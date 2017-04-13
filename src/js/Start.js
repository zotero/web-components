'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('StartComponent');

const React = require('react');
const {Component} = React;

//const firefoxVersion = window.zoteroConfig.firefoxVersion;
const firefoxHash = window.zoteroConfig.firefoxHash;
const firefoxDownload = window.zoteroConfig.firefoxDownload;
const chromeInstallUrl = window.zoteroConfig.chromeInstallUrl;
const safariDownloadUrl = window.zoteroConfig.safariDownloadUrl;
const operaDownloadUrl = window.zoteroConfig.operaDownloadUrl;

const recaptchaSitekey = '6LfrWxMUAAAAADBGrtBnRzMB6FdUf4cXzZV5pH6W';

const imagePath = 'static/images';

const chromeExtensionImagePath = imagePath + '/start/chrome-extension.jpg';
const firefoxExtensionImagePath = imagePath + '/start/firefox-extension.jpg';
const safariExtensionImagePath = imagePath + '/start/safari-extension.jpg';
const connectorButtonImagePath = imagePath + '/start/zotero-button.svg';
const arrowDownGrayImagePath = imagePath + '/start/arrow-down-gray.svg';
const arrowDownWhiteImagePath = imagePath + '/start/arrow-down-white.svg';

const chromeBrowserImagePath = imagePath + '/theme/browser_icons/64-chrome.png';
const firefoxBrowserImagePath = imagePath + '/theme/browser_icons/64-firefox.png';
const safariBrowserImagePath = imagePath + '/theme/browser_icons/64-safari.png';
const operaBrowserImagePath = imagePath + '/theme/browser_icons/64-opera.png';


import {ajax, postFormData} from './ajax.js';
import {slugify} from './Utils.js';
import {buildUrl} from './wwwroutes.js';

let browser = require('detect-browser');

class ArrowDownGray extends Component{
	render(){
		return (
			<div className='arrow-down'>
				<img src={arrowDownGrayImagePath} />
			</div>
		);
	}
}

class ArrowDownWhite extends Component{
	render(){
		return (
			<div className='arrow-down'>
				<img src={arrowDownWhiteImagePath} />
			</div>
		);
	}
}

class InstallFirefoxButton extends Component{
	installFirefox(){
		if (typeof InstallTrigger == 'undefined') {
			return true;
		}
		let params = {
			'Zotero': {
				URL: firefoxDownload,
				Hash: firefoxHash
			}
		};

		window.InstallTrigger.install(params);
		return false;
	}
	render(){
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
}
InstallFirefoxButton.defaultProps = {type:'button'};

class InstallChromeButton extends Component{
	installChrome(){
		window.chrome.webstore.install(chromeInstallUrl, ()=>{
			//success
		}, ()=>{
			//failure
		});
	}
	render(){
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
}
InstallChromeButton.defaultProps = {type:'button'};

class InstallSafariButton extends Component{
	installSafari(){
	}
	render(){
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
}
InstallSafariButton.defaultProps = {type:'button'};

class InstallOperaButton extends Component{
	installOpera(){
	}
	render(){
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
}
InstallOperaButton.defaultProps = {type:'button'};

class InstallButton extends Component{
	render(){
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
}

class ChromeExtensionIcon extends Component{
	render(){
		return <img className='extensionIconImage' src={chromeExtensionImagePath} />;
	}
}

class FirefoxExtensionIcon extends Component{
	render(){
		return <img className='extensionIconImage' src={firefoxExtensionImagePath} />;
	}
}

class SafariExtensionIcon extends Component{
	render(){
		return <img className='extensionIconImage' src={safariExtensionImagePath} />;
	}
}

class AllExtensionsSection extends Component{
	render(){
		return (
			<div id='all-extensions'>
				<InstallChromeButton type='image' />
				<InstallFirefoxButton type='image' />
				<InstallSafariButton type='image' />
			</div>
		);
	}
}


class InstallConnectorPrompt extends Component{
	constructor(props){
		super(props);
		this.state = {
			browser:browser.name,
			showAllExtensions:false
		};
		this.showAllExtensions = this.showAllExtensions.bind(this);
	}
	componentDidMount(){
		//detect browser and set correct browser image
	}
	showAllExtensions(){
		this.setState({showAllExtensions:true});
	}
	render(){
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
}

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

class RegisterForm extends Component{
	constructor(props){
		super(props);
		this.state = {
			formData:{
				username:'',
				email:'',
				email_confirm:'',
				password:'',
				password_confirm:''
			},
			usernameValidity:'undecided',
			usernameMessage:'',
			formError:'',
			registrationSuccessful:false
		};
		this.checkUsername = this.checkUsername.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.register = this.register.bind(this);
	}
	checkUsername(){
		let username = this.state.formData.username;
		if(username.indexOf('@') != -1){
			this.setState({
				usernameValidity:'invalid',
				usernameMessage: 'Your email address can be used to log in to your Zotero account, but not as your username.'
			});
			return;
		}
		let checkUrl = buildUrl('checkUsername', {username});
		ajax({url:checkUrl}).then((response)=>{
			response.json().then((data)=>{
				if(data.valid){
					this.setState({usernameValidity:'valid'});
				} else {
					this.setState({
						usernameValidity:'invalid',
						usernameMessage: 'Username is not available'
					});
				}
			});
		}).catch(()=>{
			this.setState({formError:'Error checking username'});
			//TODO:error JS notification
		});
	}
	handleChange(ev){
		let formData = this.state.formData;
		formData[ev.target.name] = ev.target.value;

		this.setState({formData:formData});
		if(ev.target.name == 'username'){
			this.setState({usernameValidity:'undecided', usernameMessage:''});
		}
	}
	register(){
		let formData = this.state.formData;
		//validate form
		let validated = validateRegisterForm(formData);
		if(!validated.valid){
			//show error
			this.setState({formError:validated.reason});
			return;
		}
		//submit form
		let registerUrl = buildUrl('registerAsync');
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
	}
	render(){
		let slug = '<username>';
		if(this.state.formData.username) {
			slug = slugify(this.state.formData.username);
		}
		let profileUrl = buildUrl('profileUrl', {slug});
		let previewClass = 'profile-preview ' + this.state.usernameValidity;
		
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
						<input type='text' name='username' placeholder='Username' onChange={this.handleChange} onBlur={this.checkUsername}></input>
						<p className={previewClass}>{profileUrl}</p>
						<p className='usernameMessage'>{this.state.usernameMessage}</p>
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
}

class PostRegisterGuide extends Component{
	render(){
		let quickStartGuideUrl = buildUrl('quickstartGuide');
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
}

class Start extends Component{
	render(){
		return (
			<div id='start-container'>
				<InstallConnectorPrompt ref='installConnectorPrompt' />
				<RegisterForm ref='registerForm' />
				<PostRegisterGuide ref='postRegisterGuide' />
			</div>
		);
	}
}

export {Start};
