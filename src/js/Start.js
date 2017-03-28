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

const chromeExtensionImagePath = '../assets/images/start/chrome-extension.jpg';
const firefoxExtensionImagePath = '../assets/images/start/firefox-extension.jpg';
const safariExtensionImagePath = '../assets/images/start/safari-extension.jpg';
const connectorButtonImagePath = '../assets/images/start/zotero-button.svg';
const arrowDownGrayImagePath = '../assets/images/start/arrow-down-gray.svg';
const arrowDownWhiteImagePath = '../assets/images/start/arrow-down-white.svg';

const chromeBrowserImagePath = '../assets/images/theme/browser_icons/64-chrome.png';
const firefoxBrowserImagePath = '../assets/images/theme/browser_icons/64-firefox.png';
const safariBrowserImagePath = '../assets/images/theme/browser_icons/64-safari.png';
const operaBrowserImagePath = '../assets/images/theme/browser_icons/64-opera.png';


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
	getDefaultProps: function(){
		return {
			type:'button'
		};
	},
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
		if(this.props.type == 'button'){
			return (
				<a className='button' onClick={this.installFirefox}>Install</a>
			);
		} else if(this.props.type == 'image') {
			return (
				<a onClick={this.installFirefox}><img src={firefoxBrowserImagePath} /></a>
			);
		}
	}
});

let InstallChromeButton = React.createClass({
	getDefaultProps: function(){
		return {
			type:'button'
		};
	},
	installChrome: function(){
		chrome.webstore.install(chromeInstallUrl, ()=>{
			//success
		}, ()=>{
			//failure
		});
	},
	render: function() {
		if(this.props.type == 'button') {
			return (
				<a className='button' onClick={this.installChrome}>Install</a>
			);
		} else if(this.props.type == 'image') {
			return (
				<a onClick={this.installChrome}><img src={chromeBrowserImagePath} /></a>
			);
		}
	}
});

let InstallSafariButton = React.createClass({
	getDefaultProps: function(){
		return {
			type:'button'
		};
	},
	installSafari: function(){
	},
	render: function() {
		if(this.props.type == 'button') {
			return (
				<a href={safariDownloadUrl} id="safari-connector-download-button" className="button download-link">Install</a>
			);
		} else if(this.props.type == 'image'){
			return (
				<a onClick={this.installSafari}><img src={safariBrowserImagePath} /></a>
			);
		}
	}
});

let InstallOperaButton = React.createClass({
	getDefaultProps: function(){
		return {
			type:'button'
		};
	},
	installOpera: function(){
	},
	render: function() {
		if(this.props.type == 'button') {
			return (
				<a href={operaDownloadUrl} id="opera-connector-download-button" className="button download-link">Install</a>
			);
		} else if(this.props.type == 'image') {
			return (
				<a onClick={this.installOpera}><img src={operaBrowserImagePath} /></a>
			);
		}
	}
});


let InstallButton = React.createClass({
	render: function() {
		let browserName = browser.name;
		log.debug('InstallButton render');
		log.debug(browserName);
		
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

let AllExtensionsSection = React.createClass({
	render:function(){
		return (
			<div id='all-extensions'>
				<InstallChromeButton type='image' />
				<InstallFirefoxButton type='image' />
				<InstallSafariButton type='image' />
			</div>
		);
	}
});


let InstallConnectorPrompt = React.createClass({
	componentDidMount: function(){
		//detect browser and set correct browser image
	},
	getInitialState: function() {
		return {
			browser:browser.name,
			showAllExtensions:false
		};
	},
	showAllExtensions: function() {
		this.setState({showAllExtensions:true});
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

		let allExtensions = null;
		if(this.state.showAllExtensions){
			allExtensions = <AllExtensionsSection />;
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
						<p><a onClick={this.showAllExtensions}>Not using {this.state.browser}? Show all extensions.</a></p>
						{allExtensions}
					</div>
				</div>
			</div>
		);
	}
});

let validateRegisterForm = function(data) {
	if(data.email != data.email_confirm){
		return {
			valid:false,
			reason:'emails must match'
		};
	}
	if(data.password != data.password_confirm){
		return {
			valid:false,
			reason:'passwords must match'
		};
	}
	return {valid:true};
};

let RegisterForm = React.createClass({
	getInitialState: function() {
		return {
			formData:{
				username:'',
				email:'',
				email_confirm:'',
				password:'',
				password_confirm:''
			},
			usernameValid:false,
			usernameMessage:'',
			formError:'',
			registrationSuccessful:false
		};
	},/*
	updateUsername: function(ev) {
		let formData = this.state.formData;
		let username = ev.target.value;
		this.setState({
			username:username,
			usernameValid:false
		});
	},*/
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
	handleChange: function(ev){
		let formData = this.state.formData;
		formData[ev.target.name] = ev.target.value;

		this.setState({formData:formData});
		if(ev.target.name == 'username'){
			this.setState({usernameValid:false, usernameMessage:''});
		}
	},
	register: function() {
		let formData = this.state.formData;
		//validate form
		let validated = validateRegisterForm(formData);
		if(!validated.valid){
			//show error
			this.setState({formError:validated.reason});
			return;
		}
		//submit form
		let registerUrl = '/user/registerasync';
		postFormData(registerUrl, formData).then((resp)=>{
			resp.json().then((data)=>{
				if(data.success === false){
					this.setState({formError:data.error});
				}
				this.setState({registrationSuccessful:true});
			});
		}).catch(()=>{
			this.setState({formError:'Error processing registration'});
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
						<input type='text' name='username' placeholder='Username' onChange={this.handleChange}></input>
						<p className={previewClass}>{profileUrl}</p>
						<input type='email' name='email' placeholder='Email' onChange={this.handleChange}></input>
						<input type='email' name='email_confirm' placeholder='Confirm Email' onChange={this.handleChange}></input>
						<input type='password' name='password' placeholder='Password' onChange={this.handleChange}></input>
						<input type='password' name='password_confirm' placeholder='Verify Password' onChange={this.handleChange}></input>
						<div className="g-recaptcha" data-sitekey={recaptchaSitekey}></div>
						<p id="register-form-error" className={this.state.formError? '' : 'hidden'}>{this.state.formError}</p>
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
				<InstallConnectorPrompt ref='installConnectorPrompt' />
				<RegisterForm ref='registerForm' />
				<PostRegisterGuide ref='postRegisterGuide' />
			</div>
		);
	}
});

export {Start};
