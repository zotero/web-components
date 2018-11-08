'use strict';

const {initDriver, LogCollector} = require('../utils.js');

const {By, Key, until} = require('selenium-webdriver');
const {assert} = require('chai');
const testBrowser = process.env.TEST_BROWSER || 'chrome';
import {Headers, Request, Response, fetch} from 'whatwg-fetch';

const baseUrl = 'https://dockerzotero.test:8081';

const newLayoutUrls = [
	{url:'https://dockerzotero.test:8081/', wait:false},
	{url:'https://dockerzotero.test:8081/downloads', wait:false},
	// {url:'https://dockerzotero.test:8081/support', wait:false},
	// {url:'https://dockerzotero.test:8081/blog', wait:false},
	{url:'https://dockerzotero.test:8081/getinvolved', wait:false},
	{url:'https://dockerzotero.test:8081/jobs', wait:false},
	{url:'https://dockerzotero.test:8081/storage/institutions', wait:false},
	{url:'https://dockerzotero.test:8081/user/login', wait:false},
	{url:'https://dockerzotero.test:8081/user/register', wait:false},
	{url:'https://dockerzotero.test:8081/user/lostpassword', wait:false},
	{url:'https://dockerzotero.test:8081/start', wait:false},
	{url:'https://dockerzotero.test:8081/start_standalone', wait:false},
	{url:'https://dockerzotero.test:8081/testuser1', wait:true},
	{url:'https://dockerzotero.test:8081/testuser1/cv', wait:true},
	{url:'https://dockerzotero.test:8081/groups', wait:false},
	{url:'https://dockerzotero.test:8081/downloadbookmarklet', wait:false}
];

const loggedInUrls = [
	{url:'https://dockerzotero.test:8081/settings', wait:false},
	{url:'https://dockerzotero.test:8081/settings/account', wait:false},
	{url:'https://dockerzotero.test:8081/settings/storage', wait:true},
	{url:'https://dockerzotero.test:8081/settings/cv', wait:true},
	{url:'https://dockerzotero.test:8081/settings/privacy', wait:false},
	{url:'https://dockerzotero.test:8081/settings/notifications', wait:false},
	{url:'https://dockerzotero.test:8081/settings/keys', wait:false}
];

const loginUrl = 'https://dockerzotero.test:8081/user/login';
const logoutUrl = 'https://dockerzotero.test:8081/user/logout';
const groupsUrl = 'https://dockerzotero.test:8081/groups';

let getCurrentUser = async function(driver){
	let currentUser = await driver.executeScript(function(){
		if(window.zoteroData){
			return window.zoteroData.currentUser;
		} else {
			return false;
		}
	});
	return currentUser;
};

let loginUser = async function(driver, username, password){
	//check if already logged in as user
	let currentUser = await getCurrentUser(driver);
	if(currentUser && currentUser.username == username){
		return true;
	} else if(currentUser){
		await logoutUser(driver);
	}

	await driver.get(loginUrl);
	let loginEl = await driver.findElement(By.id('username'));
	await loginEl.sendKeys(username, Key.TAB, password, Key.RETURN);
	await driver.wait(until.stalenessOf(loginEl), 5000);
	return true;
};

let logoutUser = async function(driver){
	await driver.get(logoutUrl);
	let currentUser = await getCurrentUser(driver);
	if(currentUser){
		return false;
	}
	return true;
};

//test Zotero pages load as expected
describe('Zotero Pages', async function(){
	let driver;
	let driver2;
	let anondriver;
	let lc = new LogCollector();

	before(async function(){
		driver = await initDriver(testBrowser, true);
		driver2 = await initDriver(testBrowser, true);
		anondriver = await initDriver(testBrowser, true);
		lc.driver = driver;
	});

	after(async function(){
		await driver.quit();
		await driver2.quit();
		await anondriver.quit();
		return;
	});


	describe('Pages Loading', async function(){
		for(let i=0; i<newLayoutUrls.length; i++){
			let testPage = newLayoutUrls[i];
			let {url, wait} = testPage;
			it(`should load ${url} without errors`, async () => {
				await driver.get(url);
				await driver.wait(until.elementLocated(By.css('header.main-header')), 5000);
				if(wait){
					await driver.sleep(500);
				}
				let pageLogs = await lc.getLogs();// getLogs(driver);
				if(pageLogs.length) {
					console.log(pageLogs);
				}
				assert.isEmpty(pageLogs);
				let curUrl = await driver.getCurrentUrl();
				assert.equal(curUrl, url);
				return true;
			});
		}
	});

	describe('Logged in pages loading', async function(){
		it('should successfully log in', async function(){
			//log in as testUser1
			console.log(`logging in`);
			await loginUser(driver, 'testUser1', 'password');
			//go back to index
			await driver.get(`${baseUrl}/`);
			let currentUser = await getCurrentUser(driver);
			assert.equal(currentUser.username, 'testUser1', 'zoteroData.currentUser reflects logged in user');
			// await driver.navigate().to(`${baseUrl}/`);
			// let curUrl = await driver.getCurrentUrl();
			// console.log(curUrl);
			// await driver.wait(until.elementIsVisible(driver.findElement(By.css('button.user-dropdown-toggle'))), 5000);
			// let userDropdownEl = await driver.findElement(By.css('button.user-dropdown-toggle'));
			// let text = await userDropdownEl.getText();
			// console.log(text);
			// assert.equal(text.trim(), 'Test User', 'Display name is shown in dropdown button');
			return true;
		});

		//loop through logged in urls
		for(let i=0; i<loggedInUrls.length; i++){
			let pageTest = loggedInUrls[i];
			let {url, wait} = pageTest;
			it(`should successfully load user required page ${url}`, async () => {
				//console.log(`loading ${loggedInUrls[i]}`);
				await driver.get(url);
				await driver.wait(until.elementLocated(By.css('header.main-header')), 5000);
				if(wait){
					await driver.sleep(500);
				}
				let pageLogs = await lc.getLogs();// getLogs(driver);
				if(pageLogs.length) {
					console.log(pageLogs);
				}
				assert.isEmpty(pageLogs);
				let curUrl = await driver.getCurrentUrl();
				assert.equal(curUrl, url);
				//await getLinks(driver);
			});
		}

		//check user groups page loads groups
		it("should load with the user's groups", async function(){
			await driver.navigate().to(groupsUrl);
			await driver.wait(until.elementLocated(By.css('.user-groups')), 5000);
			let pageLogs = await lc.getLogs();// getLogs(driver);
			assert.isEmpty(pageLogs);
			await driver.wait(until.elementLocated(By.css('.card.nugget-full')));
			let groupNuggetEls = await driver.findElements(By.css('.card.nugget-full'));
			assert.isAtLeast(groupNuggetEls.length, 1, 'at least 1 gropu nugget card');
			let nameEl = await driver.findElement(By.css('div.nugget-name a'));
			let nameText = await nameEl.getText();
			assert.isNotEmpty(nameText);
			//assert.equal(nameText, 'Not Pandas', 'testUser1\'s group is named Not Pandas');

			await driver.wait(until.elementLocated(By.css('.card.new-group-discussions')));
			let groupDiscussionsCard = await driver.findElements(By.css('.card.new-group-discussions'));
			assert.lengthOf(groupDiscussionsCard, 1, 'found group discussions card');
		});

		//check group settings pages
		it('should load group settings pages without error', async function(){
			let groupSettingsPages = [
				`${baseUrl}/groups/319/settings`,
				`${baseUrl}/groups/319/settings/members`,
				`${baseUrl}/groups/319/settings/library`,
				`${baseUrl}/groups/319/invite`,
				`${baseUrl}/groups/319/settings/owner`
			];

			for(let i=0; i<groupSettingsPages.length; i++){
				it(`should successfully load group settings page ${groupSettingsPages[i]}`, async function(){
					await driver.get(groupSettingsPages[i]);
					await driver.wait(until.elementLocated(By.css('header.main-header')), 5000);
					//await driver.sleep(1000);
					let pageLogs = await lc.getLogs();//getLogs(driver);
					console.log(pageLogs);
					assert.isEmpty(pageLogs);
					let curUrl = await driver.getCurrentUrl();
					assert.equal(curUrl, groupSettingsPages[i]);
					return true;
				});
			}
		});

		//check /mylibrary redirect
		it('should redirect /mylibrary to the user library url', async function(){
			await driver.navigate().to(`${baseUrl}/mylibrary`);
			let curUrl = await driver.getCurrentUrl();
			assert.equal(curUrl, `${baseUrl}/testuser1/items`);
			return true;
		});
	});

	describe('Logged out group page', async function(){
		it('should load with info for anon users', async function(){
			await driver2.get(`${baseUrl}/groups`);
			
			await driver2.wait(until.elementLocated(By.css('#group-explainer h2')), 5000);
			let headingEl = await driver2.findElement(By.css('#group-explainer h2'));
			let headingText = await headingEl.getText();
			assert.equal(headingText, 'What can groups do for you?', 'Group explainer heading is expected');
			return true;
		});
	});

	describe('Group invitation', async function(){
		it('should log in with testUser2 and show no invitations', async function(){
			//log in to testUser2
			await loginUser(driver2, 'testUser2', 'password');
			await driver2.navigate().to(`${baseUrl}/groups`);
			let emptyInvitesEls = await driver2.wait(until.elementsLocated(By.css('#react-group-invitations span.group-invitations.d-none')));
			assert.lengthOf(emptyInvitesEls, 1, 'found the empty invites placeholder');
			return true;
		});
		
		it('should have testUser1 invite testUser2 to group', async function(){
			await driver.navigate().to(`${baseUrl}/groups/319/invite`);
			let inviteEl = await driver.findElement(By.id('invite_members'));
			await inviteEl.sendKeys('testUser2', Key.TAB, Key.RETURN);
			await driver.wait(until.stalenessOf(inviteEl), 5000);
			let curUrl = await driver.getCurrentUrl();
			assert.equal(curUrl, `${baseUrl}/groups/319/settings/members`);
			return true;
		});
		
		it("should detect the invitation from testUser2's groups page, then decline", async function(){
			await driver2.navigate().to(`${baseUrl}/groups`);
			let groupInviteTitles = await driver2.wait(until.elementsLocated(By.css('#react-group-invitations .group-title')), 5000);
			assert.lengthOf(groupInviteTitles, 1, 'found one group invitation');

			await driver2.wait(until.elementLocated(By.css('button.ignore-invitation')), 5000);
			let ignoreButton = await driver2.findElement(By.css('button.ignore-invitation'));
			ignoreButton.click();
			await driver2.wait(until.stalenessOf(ignoreButton));

			await driver2.navigate().refresh();
			let emptyInvitesEls = await driver2.wait(until.elementsLocated(By.css('#react-group-invitations span.group-invitations.d-none')), 5000);
			//console.log(emptyInvitesEls);
			//emptyInvitesEls = await driver2.findElements(By.css('#react-group-invitations span.group-invitations.d-none'));
			assert.lengthOf(emptyInvitesEls, 1, 'found the empty invites placeholder');
			return true;
		});
	});

	describe.skip('profile visibility', async function(){
		it('should show a profile for a normal user', async function(){
			await anondriver.get(`${baseUrl}/testuser1`);
			let bioEl = await anondriver.wait(until.elementLocated(By.css('div.profile-editable-rich')), 5000);
			let text = await bioEl.getText();
			assert.include(text, 'George Mason', 'profile bio section includes expected substring');
		});

		it('should show a blank profile for a flagged user', async function(){
			await anondriver.get(`${baseUrl}/testuserflagged`);
			let bioEl = await anondriver.wait(until.elementLocated(By.css('div.profile-editable-rich')), 5000);
			let text = await bioEl.getText();
			assert.isEmpty(text, 'profile bio section is empty for anon viewers');
		});

		it('should not show a profile for a banned user', async function(){
			await anondriver.get(`${baseUrl}/testuserbanned`);
			let bioEl = await anondriver.findElements(By.css('div.profile-editable-rich'));
			assert.isEmpty(bioEl);
			let titleEl = await anondriver.wait(until.elementLocated(By.css('h1')), 5000);
			let text = await titleEl.getText();
			assert.include(text, 'Error');
		});
	});

	describe('Account Deletion', async function(){
		it('should prevent user from deleting while owner of a group', async function(){
			await driver.get(`${baseUrl}/settings/deleteaccount`);
			let currentUser = await getCurrentUser(driver);
			assert.equal(currentUser.username, 'testUser1', 'zoteroData.currentUser reflects logged in user');
			let warningEl = await driver.wait(until.elementLocated(By.css('div.alert-warning')), 5000);
			let warningText = await warningEl.getText();
			assert.include(warningText, 'You cannot delete your account while you are the owner of a Zotero group');
			//make sure delete button not present
			let deleteButton = await driver.findElements(By.css('#deleteaccount'));
			assert.isEmpty(deleteButton);
		});

		it('should have a clear metadata button when not a group owner but has metadata', async function(){
			await loginUser(driver2, 'testUser2', 'password');
			await driver2.get(`${baseUrl}/settings/deleteaccount`);
			let clearMetaButton = await driver2.findElements(By.css('#clearusermeta'));
			assert.isNotEmpty(clearMetaButton);

			let deleteButton = await driver2.findElements(By.css('#deleteaccount'));
			assert.isEmpty(deleteButton);
		});
		it('should have a delete button when not a group owner', async function(){
			await loginUser(driver2, 'testUser3', 'password');
			await driver2.get(`${baseUrl}/settings/deleteaccount`);
			let currentUser = await getCurrentUser(driver2);
			assert.equal(currentUser.username, 'testUser3', 'zoteroData.currentUser reflects logged in user');
			//make sure delete button present
			let deleteButton = await driver2.findElements(By.css('#deleteaccount'));
			assert.isNotEmpty(deleteButton);
		});
	});

	describe('download page', async function(){
		it('should reflect the appropriate browser the page is loaded in', async function(){
			await driver.get(`${baseUrl}/downloads`);
			let downloadButton = await driver.wait(until.elementLocated(By.css('.connector a.btn.btn-lg')), 5000);
			let downloadText = await downloadButton.getText();
			switch(testBrowser){
				case 'chrome':
					assert.include(downloadText, 'Install Chrome Connector');
					break;
				case 'firefox':
					assert.include(downloadText, 'Install Firefox Connector');
					break;
			}
		});
	});

	describe('cv page', async function(){
		it('should show the loaded text and collection data', async function(){
			await driver.get(`${baseUrl}/testuser1/cv`);
			let entryNode = await driver.wait(until.elementLocated(By.css('.profile_cvEntry')), 5000);
			assert.isNotEmpty(entryNode);
			let headerNode = await driver.findElement(By.css('.profile_cvHead'));
			let headerText = await headerNode.getText();
			assert.isNotEmpty(headerText);
		});
	});

	describe.skip('test following on oldprofile', async function(){
		it('should follow users', async function(){
			await driver.get(`${baseUrl}/testuser1`);
			let followerUsernameNode = await driver.wait(until.elementLocated(By.css('.following-section .nugget-name a')), 5000);
			let followerUsername = await followerUsernameNode.getText();
			assert.equal(followerUsername, 'testUser2');
		});
	});

	describe('test following on editable profile', async function(){
		it('should follow users', async function(){
			await driver.get(`${baseUrl}/testuser2`);
			let profileNode = await driver.wait(until.elementLocated(By.css('#user-profile .container')), 5000);
			assert.isNotEmpty(profileNode);
			//should not have any followers to start
			let followersPanelNode = await driver.findElements(By.css('#followers-side-panel'));
			assert.isEmpty(followersPanelNode);

			await driver.findElement(By.css('#follow-button')).click();
			await driver.navigate().refresh();
			profileNode = await driver.wait(until.elementLocated(By.css('#user-profile .container')), 5000);
			//should now have testUser1 as a follower
			followersPanelNode = await driver.findElement(By.css('#followers-side-panel'));
			assert.isNotEmpty(followersPanelNode);

			await driver.findElement(By.css('#unfollow-button')).click();
			await driver.navigate().refresh();
			profileNode = await driver.wait(until.elementLocated(By.css('#user-profile .container')), 5000);
			followersPanelNode = await driver.findElements(By.css('#followers-side-panel'));
			assert.isEmpty(followersPanelNode, 'followers Panel gone after unfollow');
		});
	});
	
	describe('test creating keys', async function(){
		it('should create a key', async function(){
			await loginUser(driver, 'testUser1', 'password');
			await driver.get(`${baseUrl}/settings/keys`);
			
		});
	});
/*
	describe('test oauth', async function(){
		it('should handshake', async function(){
			const crypto = require('crypto');
			const OAuth = require('oauth-1.0a');
			//const request = require('request');

			const oauth = OAuth({
				consumer: { key: 'c78bd174f4e46178e09c', secret: '8bc5c2aaac7895045172'},
				signature_method: 'HMAC-SHA1',
				hash_function(base_string, key) {
					return crypto.createHmac('sha1', key).update(base_string).digest('base64');
				}
			});

			const requestTokenEndpoint = 'https://www.zotero.org/oauth/request';
			const access_token_endpoint = 'https://www.zotero.org/oauth/access';
			const zotero_authorize_endpoint = 'https://www.zotero.org/oauth/authorize';
			const oauthCallback = 'http://localhost/test2callback';
			
			const request_data = {
				url: requestTokenEndpoint,
				method: 'POST',
				data: {oauth_callback:'oob'}
			};
			//oauth.authorize(request_data, token);

			let resp = await fetch(request_data.url, {
				method:request_data.method,
				data: oauth.authorize(request_data)
			});
		});
	});

	describe('placeholder', async function(){
		it('placeholder', async function(){
			
		});
	});
	*/
});
