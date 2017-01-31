'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('StartComponent');

const React = require('react');
const {Component, PropTypes} = React;

const firefoxVersion = window.zoteroConfig.firefoxVersion;
const firefoxHash = window.zoteroConfig.firefoxHash;
const firefoxDownload = window.zoteroConfig.firefoxDownload;
const chromeInstallUrl = window.zoteroConfig.chromeInstallUrl;
const safariDownloadUrl = window.zoteroConfig.safariDownloadUrl;
const operaDownloadUrl = window.zoteroConfig.operaDownloadUrl;

const recaptchaSitekey = '6LfrWxMUAAAAADBGrtBnRzMB6FdUf4cXzZV5pH6W';

const chromeExtensionImagePath = '../assets/start/images/chrome-extension.jpg';
const firefoxExtensionImagePath = '../assets/start/images/firefox-extension.jpg';
const safariExtensionImagePath = '../assets/start/images/safari-extension.jpg';
const connectorButtonImagePath = '../assets/start/images/zotero-button.svg';
const arrowDownGrayImagePath = '../assets/start/images/arrow-down-gray.svg';
const arrowDownWhiteImagePath = '../assets/start/images/arrow-down-white.svg';

import {ajax, postFormData} from './ajax.js';
import {slugify} from './Utils.js';

let browser = require('detect-browser');

let ArrowDownGray = React.createClass({
	render:function(){
		return (
			<div className='arrow-down'>
				<img src={arrowDownGrayImagePath} />
			</div>
		);
	}
});

let ArrowDownWhite = React.createClass({
	render:function(){
		return (
			<div className='arrow-down'>
				<img src={arrowDownWhiteImagePath} />
			</div>
		);
	}
});

let InstallFirefoxButton = React.createClass({
	installFirefox: function(){
		if (typeof InstallTrigger == 'undefined') {
			return true;
		}
		let params = {
			'Zotero': {
				URL: firefoxDownload,
				Hash: firefoxHash
			}
		};

		InstallTrigger.install(params);
		return false;
	},
	render: function() {
		return (
			<a className='button' onClick={this.installFirefox}>Install</a>
		);
	}
});

let InstallChromeButton = React.createClass({
	installChrome: function(){
		chrome.webstore.install(chromeInstallUrl, ()=>{
			//success
		}, ()=>{
			//failure
		});
	},
	render: function() {
		return (
			<a className='button' onClick={this.installChrome}>Install</a>
		);
	}
});

let InstallSafariButton = React.createClass({
	installSafari: function(){
	},
	render: function() {
		return (
			<a href={safariDownloadUrl} id="safari-connector-download-button" class="button download-link">Install</a>
		);
	}
});

let InstallOperaButton = React.createClass({
	installSafari: function(){
	},
	render: function() {
		return (
			<a href={operaDownloadUrl} id="opera-connector-download-button" class="button download-link">Install</a>
		);
	}
});


let InstallButton = React.createClass({
	render: function() {
		let browserName = browser.name;
		log.debug('InstallButton render');
		log.debug(browserName);
		/*
		let firefoxVersion = "4.0.29.11";
		let firefoxDisplayVersion = "4.0";
		let firefoxDownload = "https://download.zotero.org/extension/zotero-$firefoxVersion.xpi";
		let firefoxHash = "sha1:4d4c464d351a5c05d19746d271713670fe8939a8";

		let chromeDownload = 'https://chrome.google.com/webstore/detail/ekhagklcjbdpajgpjgmbionohlpdbjgc';
		let safariDownload = 'https://download.zotero.org/connector/safari/Zotero_Connector-4.0.28-1.safariextz';
		let operaDownload = 'https://addons.opera.com/en/extensions/details/zotero-connector/?display=en';
		let bookmarkletDownload = '/downloadbookmarklet';
		*/
		
		switch(browserName){
			case 'firefox':
				return <InstallFirefoxButton />;
			case 'chrome':
				return <InstallChromeButton />;
			case 'safari':
				return <InstallSafariButton />;
			case 'opera':
				return <InstallOperaButton />;
			default:
				//TODO: unknown browser download?
				return null;
		}
	}
});

let ChromeExtensionIcon = React.createClass({
	render: function(){
		return <img className='extensionIconImage' src={chromeExtensionImagePath} />;
	}
});

let FirefoxExtensionIcon = React.createClass({
	render: function(){
		return <img className='extensionIconImage' src={firefoxExtensionImagePath} />;
	}
});

let SafariExtensionIcon = React.createClass({
	render: function(){
		return <img className='extensionIconImage' src={safariExtensionImagePath} />;
	}
});


let InstallConnectorPrompt = React.createClass({
	componentDidMount: function(){
		//detect browser and set correct browser image
	},
	getInitialState: function() {
		return {
			browser:browser.name
		};
	},
	render: function() {
		let connectorText = '';
		let connectorImage = null;
		let installButton = <InstallButton browser='chrome' />;
		switch(this.state.browser){
			case 'chrome':
				connectorText = 'Chrome Extension';
				connectorImage = <ChromeExtensionIcon />;
				break;
			case 'firefox':
				connectorText = 'Firefox Extension';
				connectorImage = <FirefoxExtensionIcon />;
				break;
			case 'safari':
				connectorText = 'Safari Extension';
				connectorImage = <SafariExtensionIcon />;
				break;
		}
		return (
			<div id='install-connector-section'>
				<div className='content'>
					<div className='install-success-div'>
						<h1>Success! You installed Zotero!</h1>
					</div>
					<div className='browser-client-icons'>
						{connectorImage}
					</div>
					<div className='install-connector'>
						<h1>1. Install the {connectorText}</h1>
						<p>Zotero connectors allow you to save to Zotero directly from your web browser.</p>
						{installButton}
						<p><a href='#' onClick={this.showAllExtensions}>Not using {this.state.browser}? Show all extensions.</a></p>
					</div>
				</div>
			</div>
		);
	}
});

let RegisterForm = React.createClass({
	componentDidMount: function(){
	},
	getInitialState: function() {
		return {
			username:'',
			usernameValid:false,
			usernameMessage:''
		};
	},
	updateUsername: function(ev) {
		let username = ev.target.value;
		this.setState({
			username:username,
			usernameValid:false
		});
	},
	checkUsername: function() {
		let username = this.state.username;
		let checkUrl = `/user/checkslug?username=${encodeURIComponent(username)}`;
		ajax(checkUrl).then((response)=>{
			response.json().then((data)=>{
				if(data.valid){
					this.setState({usernameValid:true});
				} else {
					this.setState({
						usernameValid:false,
						usernameMessage: 'Username is not available'
					});
				}
			});
		}).catch(()=>{
			//TODO:error JS notification
		});
	},
	render: function() {
		let slug = '<username>';
		if(this.state.username) {
			slug = slugify(this.state.username);
		}
		let profileUrl = `https://www.zotero.org/${slug}`;
		let previewClass = 'profile-preview ' + (this.state.usernameValid ? 'valid' : 'invalid');
		
		return (
			<div id='register-section'>
				<div className='content'>
					<ArrowDownWhite />
					<h1>2. Register to take full advantage of Zotero</h1>
					<p>If you haven't already created a Zotero account, please take a few moments to register now.
					It's a <b>free</b> way to <a href="https://www.zotero.org/support/sync">sync and access your library from anywhere</a>,
					and it lets you join <a href="https://www.zotero.org/support/groups">groups</a> and 
					<a href="https://www.zotero.org/support/sync#file_syncing">back up your all your attached files</a>.
					</p>
					<div id='register-form'>
						<input type='text' name='username' placeholder='Username' onChange={this.updateUsername}></input>
						<p className={previewClass}>{profileUrl}</p>
						<input type='text' name='email' placeholder='Email'></input>
						<input type='text' name='email_confirm' placeholder='Confirm Email'></input>
						<input type='text' name='password' placeholder='Password'></input>
						<input type='text' name='password_confirm' placeholder='Verify Password'></input>
						<div className="g-recaptcha" data-sitekey={recaptchaSitekey}></div>
						<button type='button' onClick={this.register}>Register</button>
					</div>
				</div>
			</div>
		);
	}
});

let PostRegisterGuide = React.createClass({
	componentDidMount: function(){
	},
	getInitialState: function() {
		return {
		};
	},
	render: function() {
		let quickStartGuideUrl = '/support/quickstartguide';
		return (
			<div id='post-register-guide' className='content'>
				<ArrowDownGray />
				<img src={connectorButtonImagePath} />
				<h1>3. Start building your library</h1>
				<p>New to Zotero? Read the <a href={quickStartGuideUrl}>Quick Start Guide</a> and learn about all Zotero has to offer.</p>
				<div id='register-quick-links'>
					<p><a href="https://www.zotero.org/support/quick_start_guide">Read the Quick Start Guide</a></p>
					<p><a href="https://www.zotero.org/support/getting_stuff_into_your_library">Add an item</a></p>
					<p><a href="https://www.zotero.org/support/archive_the_web">Archive a webpage</a></p>
					<p><a href="https://www.zotero.org/support/screencast_tutorials/manually_creating_items">Manually enter an item</a></p>
					<p><a href="https://www.zotero.org/support/collections">Create a collection</a></p>
					<p><a href="https://www.zotero.org/support/creating_bibliographies">Create a bibliography</a></p>
					<p><a href="https://www.zotero.org/support/word_processor_plugin_usage">Use the Word or OpenOffice plugin</a></p>
				</div>
			</div>
		);
	}
});


let Start = React.createClass({
	componentDidMount: function(){
	},
	getInitialState: function() {
		return {
		};
	},
	checkUsername: function() {

	},
	render: function() {
		return (
			<div id='start-container'>
				<InstallConnectorPrompt />
				<RegisterForm />
				<PostRegisterGuide />
			</div>
		);
	}
});

export {Start};
