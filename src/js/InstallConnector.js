'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('InstallConnector');

const React = require('react');
const {Component} = React;

import {buildUrl} from './wwwroutes.js';
import {BrowserDetect} from './browserdetect.js';
import {VerticalExpandable} from './VerticalExpandable.js';

let browser = BrowserDetect.browser;

const config = window.zoteroConfig;
const installData = config.installData;

const {firefoxHash, firefoxDownload, chromeDownload, safariDownload, operaDownload} = installData;

const imagePath = config.imagePath;

const zoteroIconImagePath = imagePath + '/extensions/zotero-icon.png';
const zoteroIcon2xImagePath = imagePath + '/extensions/zotero-icon-2x.png';

class BrowserIcon extends Component {
	render() {
		let browserImagePath = imagePath + '/extensions/';
		browserImagePath += this.props.browser + '-icon';
		if(this.props.size == 'small'){
			browserImagePath += '-small';
		} else if(this.props.size == 'large'){
			browserImagePath += '-large';
		}
		let browserImagePath2x = browserImagePath + '-2x.png';
		browserImagePath += '.png';

		let p = {...this.props, src:browserImagePath, srcSet:`${browserImagePath2x} 2x`, className:'browser-icon'};
		delete p.browser;
		return (<img {...p} />);
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
				<a href={firefoxDownload} className='btn' onClick={this.installFirefox}>Install</a>
			);
		} else if(this.props.type == 'image') {
			return (
				<a href={firefoxDownload} onClick={this.installFirefox}><BrowserIcon browser='firefox' /></a>
			);
		} else if(this.props.type == 'full') {
			return (
				<div className='download-full'>
					<div className='browser-image'><BrowserIcon browser='firefox' /></div>
					<h3>Firefox extension</h3>
					<div><a href={firefoxDownload} className='btn' onClick={this.installFirefox}>Install</a></div>
				</div>
			);
		}
	}
}
InstallFirefoxButton.defaultProps = {type:'button'};

class InstallChromeButton extends Component{
	installChrome(evt){
		if(typeof window.chrome !== 'undefined'){
			evt.preventDefault();
			window.chrome.webstore.install(undefined, ()=>{
				//success
			}, ()=>{
				//failure
			});
		}
	}
	render(){
		if(this.props.type == 'button') {
			return <a href={chromeDownload} onClick={this.installChrome} id="chrome-connector-download-button" className="btn download-link">Install</a>;
		} else if(this.props.type == 'image') {
			return (
				<a href={chromeDownload} onClick={this.installChrome}><BrowserIcon browser="chrome" /></a>
			);
		} else if(this.props.type == 'full') {
			return (
				<div className='download-full'>
					<div className='browser-image'><BrowserIcon browser="chrome" /></div>
					<h3>Chrome extension</h3>
					<div className='install-button'><a href={chromeDownload} id="chrome-connector-download-button" className="btn download-link">Install</a></div>
				</div>
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
				<a href={safariDownload} id="safari-connector-download-button" className="btn download-link">Install</a>
			);
		} else if(this.props.type == 'image'){
			return (
				<a href={safariDownload} onClick={this.installSafari}><BrowserIcon browser='safari' /></a>
			);
		} else if(this.props.type == 'full') {
			return (
				<div className='download-full'>
					<div className='browser-image'><BrowserIcon browser='safari' /></div>
					<h3>Safari extension</h3>
					<a href={safariDownload} id="safari-connector-download-button" className="btn download-link">Install</a>
				</div>
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
				<a href={operaDownload} id="opera-connector-download-button" className="btn download-link">Install</a>
			);
		} else if(this.props.type == 'image') {
			return (
				<a href={operaDownload} onClick={this.installOpera}><BrowserIcon browser='opera' /></a>
			);
		} else if(this.props.type == 'full') {
			return (
				<div className='download-full'>
					<div className='browser-image'><BrowserIcon browser='opera' /></div>
					<h3>Opera extension</h3>
					<a href={operaDownload} id="opera-connector-download-button" className="btn download-link">Install</a>
				</div>
			);
		}
	}
}
InstallOperaButton.defaultProps = {type:'button'};

class InstallButton extends Component{
	render(){
		let browserName = browser;
		log.debug('InstallButton render');
		log.debug(browserName);

		switch(browserName){
			case 'Firefox':
				return <InstallFirefoxButton />;
			case 'Chrome':
				return <InstallChromeButton />;
			case 'Safari':
				return <InstallSafariButton />;
			case 'Opera':
				return <InstallOperaButton />;
			default:
				//TODO: unknown browser download?
				return null;
		}
	}
}

class BrowserExtensionIcon extends Component{
	render(){
		return (
			<figure className="browser-plus-extension">
				<BrowserIcon
					browser={this.props.browser}
					size="large"
					width="128"
					height="128" />
				<span className="icon-plus"></span>
				<img
					src={zoteroIconImagePath}
					alt="Zotero Extension"
					width="144"
					height="144"
					className="zotero-icon"
					srcSet={`${zoteroIcon2xImagePath} 2x`}
				/>
			</figure>
		);
	}
}

class AllExtensionsSection extends Component{
	render(){
		let otherBrowsers = ['chrome', 'firefox', 'safari', 'opera'].filter((browser)=>{
			return browser != this.props.except;
		});

		let installButtons = {
			'chrome': <li key='chrome'><InstallChromeButton type='full' /></li>,
			'firefox': <li key='firefox'><InstallFirefoxButton type='full' /></li>,
			'safari': <li key='safari'><InstallSafariButton type='full' /></li>,
			'opera': <li key='opera'><InstallOperaButton type='full' /></li>
		};
		let installNodes = otherBrowsers.map((browser)=>{
			return installButtons[browser];
		});
		return (
			<section className='all-extensions'>
				<h2 className="visually-hidden">All extensions</h2>
				<ul>
					{installNodes}
				</ul>
			</section>
		);
	}
}

class InstallConnectorPrompt extends Component{
	constructor(props){
		super(props);
		this.state = {
			browser:browser,
			showAllExtensions:false
		};
		this.showAllExtensions = this.showAllExtensions.bind(this);
	}
	componentDidMount(){
		//detect browser and set correct browser image
	}
	showAllExtensions(evt){
		this.setState({showAllExtensions:true});
		evt.preventDefault();
	}
	render(){
		let connectorText = '';
		let connectorImage = null;
		let installButton = <InstallButton browser='chrome' />;
		switch(this.state.browser){
			case 'Chrome':
				connectorText = 'Chrome Extension';
				connectorImage = <BrowserExtensionIcon browser='chrome' />;
				break;
			case 'Firefox':
				connectorText = 'Firefox Extension';
				connectorImage = <BrowserExtensionIcon browser='firefox' />;
				break;
			case 'Safari':
				connectorText = 'Safari Extension';
				connectorImage = <BrowserExtensionIcon browser='safari' />;
				break;
			case 'Opera':
				connectorText = 'Opera Extension';
				connectorImage = <BrowserExtensionIcon browser='opera' />;
				break;
		}

		let showExtensionsLink = <p className='show-extensions'/>;
		if(!this.state.showAllExtensions) {
			let otherBrowsers = ['chrome', 'firefox', 'safari', 'opera'].filter((browser)=>{return browser.toLowerCase() != this.state.browser.toLowerCase();});
			let otherBrowserImages = otherBrowsers.map((browser)=>{
				return <BrowserIcon key={browser} browser={browser} size="small" width="32" height="32" />;
			});

			showExtensionsLink = (
				<p className='show-extensions'>
					{otherBrowserImages}
					Not using {this.state.browser}?
					<br />
					<a href='#' onClick={this.showAllExtensions}>Show all extensions</a>
				</p>
			);
		}

		let allExtensions = (
			<div>
				<VerticalExpandable expand={this.state.showAllExtensions}>
					<AllExtensionsSection except={this.state.browser.toLowerCase()} />
				</VerticalExpandable>
			</div>
		);

		let getStandaloneSection = null;
		if(this.props.showStandalone) {
			getStandaloneSection = (
				<p className='get-zotero-standalone'>
					<a href={buildUrl('download')}>Get Zotero Standalone</a><br/>
					Available for Mac, Windows, and Linux
				</p>
			);
		}

		let headerText = `Install the ${connectorText}`;
		if(this.props.numbered) {
			headerText = `1. Install the ${connectorText}`;
		}

		return (
			<div>
				<div className="jumbotron">
					<div className="container">
						{connectorImage}
						<div className='install-connector'>
							<h1>{headerText}</h1>
							<p className="lead">
								<span className="line">Zotero Connectors allow you to save to Zotero</span>
								<span className="line">directly from your web browser.</span></p>
							{installButton}
							{getStandaloneSection}
							{showExtensionsLink}
						</div>
					</div>
				</div>
				{allExtensions}
			</div>
		);
	}
}

InstallConnectorPrompt.defaultProps = {
	numbered:false,
	showStandalone:false
};

export {InstallConnectorPrompt};
