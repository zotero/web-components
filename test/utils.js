const {Builder, By, Capabilities} = require('selenium-webdriver');
const {Options} = require('selenium-webdriver/firefox');
const chrome = require('selenium-webdriver/chrome');

//TODO: implement headless
let initFirefoxDriver = async function(headless=true){
	let options = new Options().setBinary('/home/fcheslack/App/firefox-beta/firefox');

	if(headless){
		//process.env.MOZ_HEADLESS = '1';
		//options.headless();
		//builder.setFirefoxOptions(new Options().headless());
	}
	let driver = await new Builder().
		forBrowser('firefox').
		withCapabilities(Capabilities.firefox().set('acceptInsecureCerts', true)).
		setFirefoxOptions(options).
		build();

	driver.actions({bridge:true});
	return driver;
};

let initChromeDriver = async function(headless=true){
	let builder = await new Builder().forBrowser('chrome');
	if(headless){
		builder.setChromeOptions(new chrome.Options().headless());
	}
	builder.withCapabilities(Capabilities.chrome().set('acceptInsecureCerts', true));
	let driver = await builder.build();
	return driver;
};

let initDriver = async function(browser, headless=true){
	let driver;
	switch(browser){
		case 'firefox':
			driver = await initFirefoxDriver(headless);
			break;
		case 'chrome':
			driver = await initChromeDriver(headless);
			break;
		default:
			throw 'Unknown browser';
	}
	return driver;
};

let getLinks = async function(driver){
	let linkEls = await driver.findElements(By.tagName('a'));
	let hrefs = [];

	for(let i=0; i<linkEls.length; i++){
		let href = await linkEls[i].getAttribute('href');
		hrefs.push(href);
		//console.log(href);
	}
	return hrefs;
};

let getLogs = async function(driver){
	//let availTypes = await driver.manage().logs().getAvailableLogTypes();
	//console.log(availTypes);
	let browserLogs = await driver.manage().logs().get('browser');
	//console.log(browserLogs);
	return browserLogs;
};

let getCookies = async function(driver){
	let cookies = await driver.manage().getCookies();
	return cookies;
};

class LogCollector {
	constructor(){
		this.driver = null;
		this.logs = {};
	}
	getLogs = async () => {
		let driverUrl = await this.driver.getCurrentUrl();
		let curUrl = new URL(driverUrl);
		
		//let availTypes = await this.driver.manage().logs().getAvailableLogTypes();
		//console.log(availTypes);
		let browserLogs = await this.driver.manage().logs().get('browser');
		this.logs[curUrl.href] = browserLogs;
		return browserLogs;
	}
}

class LinkAggregator {
	constructor(){
		/*
		this.baseUrl = new URL();
		this.sameHostOnly = true;
		this.driver = null;
		this.hrefs = {};
		*/
	}
	setBaseUrl = (url) => {
		this.baseUrl = new URL(url);
	}
	baseUrl = new URL();
	sameHostOnly = true
	driver = null
	hrefs = {}
	getLinks = async () => {
		let curUrl = await this.driver.getCurrentUrl();
		let linkEls = await this.driver.findElements(By.tagName('a'));
		
		for(let i=0; i<linkEls.length; i++){
			let href = await linkEls[i].getAttribute('href');
			let url = new URL(href, curUrl);
			if(this.sameHostOnly){
				if(url.host != this.baseUrl.host){
					continue;
				}
			}
			this.hrefs[url.href] = url;
			//console.log(url.href);
		}
	}
}

class Auditor {
	constructor(baseUrl){
		let la = new LinkAggregator();
		let lc = new LogCollector();
		la.setBaseUrl(baseUrl);
		this.linkAggregator = la;
		this.logCollector = lc;
	}
	setDriver(driver) {
		this.driver = driver;
		this.linkAggregator.driver = driver;
		this.logCollector.driver = driver;
	}
}

export {LinkAggregator, LogCollector, Auditor, initDriver, getCookies, getLinks, getLogs};
