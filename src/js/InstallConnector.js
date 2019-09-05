'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('InstallConnector');

const React = require('react');
const {Component} = React;

import PropTypes from 'prop-types';
import {buildUrl} from './wwwroutes.js';
import {BrowserDetect} from './browserdetect.js';
import {Collapse} from 'reactstrap';
import {ZoteroIcon, BrowserIcon, BrowserExtensionIcon} from './Icons.js';
import classnames from 'classnames';
import {Delay} from './Utils.js';

const config = window.zoteroConfig;
const installData = config.installData;

const {firefoxHash, firefoxVersion} = installData;
const chromeDownload = 'https://chrome.google.com/webstore/detail/ekhagklcjbdpajgpjgmbionohlpdbjgc';
const firefoxDownload = `https://www.zotero.org/download/connector/dl?browser=firefox&version=${firefoxVersion}`;
const safariDownload = installData.oldSafari
	? 'https://www.zotero.org/download/connector/dl?browser=safari'
	: 'https://www.zotero.org/support/kb/safari_12_connector';

class InstallFirefoxButton extends Component{
	installFirefox(evt){
		if (typeof InstallTrigger == 'undefined') {
			return true;
		}
		evt.preventDefault();
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
				<a href={firefoxDownload} className='btn btn-lg btn-secondary' onClick={this.installFirefox}>{this.props.label}</a>
			);
		} else if(this.props.type == 'image') {
			return (
				<a href={firefoxDownload} onClick={this.installFirefox}><BrowserIcon browser='firefox' /></a>
			);
		} else if(this.props.type == 'full') {
			return (
				<div className='download-full'>
					<div className='browser-image'><BrowserIcon browser='firefox' /></div>
					<h3>Firefox Connector</h3>
					<div><a href={firefoxDownload} className='btn btn-sm btn-secondary' onClick={this.installFirefox}>{this.props.label}</a></div>
				</div>
			);
		}
	}
}
InstallFirefoxButton.defaultProps = {
	type:'button',
	label:'Install'
};
InstallFirefoxButton.propTypes = {
	type:PropTypes.oneOf(['button', 'image', 'full']),
	label:PropTypes.string
};

class InstallChromeButton extends Component{
	render(){
		if(this.props.type == 'button') {
			return <a href={chromeDownload} id="chrome-connector-download-button" className="btn btn-lg btn-secondary">{this.props.label}</a>;
		} else if(this.props.type == 'image') {
			return (
				<a href={chromeDownload}><BrowserIcon browser="chrome" /></a>
			);
		} else if(this.props.type == 'full') {
			return (
				<div className='download-full'>
					<div className='browser-image'><BrowserIcon browser="chrome" /></div>
					<h3>Chrome Connector</h3>
					<div className='install-button'><a href={chromeDownload} id="chrome-connector-download-button" className="btn btn-sm btn-secondary">{this.props.label}</a></div>
				</div>
			);
		}
	}
}
InstallChromeButton.defaultProps = {
	type:'button',
	label:'Install'
};
InstallChromeButton.propTypes = {
	type:PropTypes.oneOf(['button', 'image', 'full']),
	label:PropTypes.string
};

class InstallSafariButton extends Component{
	installSafari(){
	}
	render(){
		if(this.props.type == 'button') {
			return (
				<a href={safariDownload} id="safari-connector-download-button" className="btn btn-lg btn-secondary">{this.props.label}</a>
			);
		} else if(this.props.type == 'image'){
			return (
				<a href={safariDownload} onClick={this.installSafari}><BrowserIcon browser='safari' /></a>
			);
		} else if(this.props.type == 'full') {
			return (
				<div className='download-full'>
					<div className='browser-image'><BrowserIcon browser='safari' /></div>
					<h3>Safari Connector</h3>
					<a href={safariDownload} id="safari-connector-download-button" className="btn btn-sm btn-secondary">{this.props.label}</a>
				</div>
			);
		}
	}
}
InstallSafariButton.defaultProps = {
	type:'button',
	label:'Install'
};
InstallSafariButton.propTypes = {
	type:PropTypes.oneOf(['button', 'image', 'full']),
	label:PropTypes.string
};

class InstallButton extends Component{
	render(){
		let browserName = this.props.browser;

		switch(browserName.toLowerCase()){
			case 'firefox':
				return <InstallFirefoxButton label={this.props.label} />;
			case 'chrome':
				return <InstallChromeButton label={this.props.label} />;
			case 'safari':
				return <InstallSafariButton label={this.props.label} />;
			default:
				//TODO: unknown browser download?
				return null;
		}
	}
}
InstallButton.defaultProps = {
	label:'Install'
};
InstallButton.propTypes = {
	label:PropTypes.string,
	browser:PropTypes.string
};

class AllExtensionsSection extends Component{
	render(){
		let otherBrowsers = ['chrome', 'firefox', 'safari'].filter((browser)=>{
			return browser != this.props.except.toLowerCase();
		});

		let installButtons = {
			'chrome': <li key='chrome'><InstallChromeButton type={this.props.type} /></li>,
			'firefox': <li key='firefox'><InstallFirefoxButton type={this.props.type} /></li>,
			'safari': <li key='safari'><InstallSafariButton type={this.props.type} /></li>
		};
		let installNodes = otherBrowsers.map((browser)=>{
			return installButtons[browser];
		});
		return (
			<section className='all-extensions'>
				<h2 className="sr-only">All connectors</h2>
				<ul>
					{installNodes}
				</ul>
				<p className='bookmarklet'>A <a href="/download/bookmarklet">bookmarklet</a> that works
				in any browser, including those on smartphones and tablets, is also available.</p>
			</section>
		);
	}
}
AllExtensionsSection.defaultProps = {
	type:'full'
};
AllExtensionsSection.propTypes = {
	type:PropTypes.oneOf(['button', 'image', 'full']),
	label:PropTypes.string,
	except:PropTypes.string
};

class InstallConnectorPrompt extends Component{
	constructor(props){
		super(props);
		this.state = {
			browser:BrowserDetect.browser,
			oldSafari:installData.oldSafari,
			showAllExtensions:false
		};
		this.showAllExtensions = this.showAllExtensions.bind(this);
	}
	componentDidMount(){
		//detect browser and set correct browser image
	}
	showAllExtensions(evt){
		this.setState({showingAllExtensions:true});
		evt.preventDefault();
		Delay(400).then(()=>{
			this.setState({allExtensionsShown:true});
		});
	}
	render(){
		let connectorText = '';
		let connectorImage = null;
		let installButton = <InstallButton browser={this.state.browser.toLowerCase()} />;
		let versionNote = null;
		switch(this.state.browser){
			case 'Chrome':
				connectorText = 'Zotero Connector for Chrome';
				connectorImage = <BrowserExtensionIcon browser='chrome' />;
				break;
			case 'Firefox':
				connectorText = 'Zotero Connector for Firefox';
				connectorImage = <BrowserExtensionIcon browser='firefox' />;
				break;
			case 'Safari':
				connectorText = 'Zotero Connector for Safari';
				connectorImage = <BrowserExtensionIcon browser='safari' />;
				if(this.state.oldSafari){
					versionNote = (
						<p className='version-note'>
							Please note: The link above is for an outdated version of the Safari connector,
							as the latest version is not compatible with your version of macOS.
							For the best experience, please upgrade to macOS 10.11 or later and reinstall
							the Safari connector from this page.
						</p>
					);
				} else {
					versionNote = (
						<p className='version-note'>
							<a href="https://www.zotero.org/support/kb/safari_connector_installation">Need help installing the Connector?</a>
						</p>
					);
				}
				break;
		}

		let otherBrowsers = ['chrome', 'firefox', 'safari'].filter((browser)=>{return browser.toLowerCase() != this.state.browser.toLowerCase();});
		let otherBrowserImages = otherBrowsers.map((browser)=>{
			return <BrowserIcon key={browser} browser={browser} size="32" />;
		});

		let showExtensionsLink = (
			<p className={classnames('show-extensions', {'fade-out':this.state.showingAllExtensions})}>
				<span className="inner-extensions">
					{otherBrowserImages}<br />
					Not using {this.state.browser}?<br />
					<a href='#' onClick={this.showAllExtensions}>Show all connectors.</a>
				</span>
				<span className="inner-start">
					<a href='#' onClick={this.showAllExtensions}>Not using {this.state.browser}? Show all connectors.</a>
				</span>
			</p>
		);

		let allExtensions = (
			<div id='all-extensions'>
				<Collapse isOpen={this.state.allExtensionsShown}>
					<AllExtensionsSection except={this.state.browser.toLowerCase()} />
				</Collapse>
			</div>
		);

		let getStandaloneSection = null;
		if(this.props.showStandalone) {
			getStandaloneSection = (
				<p className='get-zotero-standalone'>
					<ZoteroIcon
						width="32"
						height="35"
						alt=""/>
					<br />
					<a href={buildUrl('download')}>Get Zotero</a>
					<br/>
					For Mac, Windows, and Linux
				</p>
			);
		}

		let headerText = `Install the ${connectorText}`;
		if(this.props.numbered) {
			headerText = `1. Install the ${connectorText}`;
		}

		return (
			<div className="extensions-picker">
				<div className="container-fluid container-fluid-col-10">
					{connectorImage}
					<div className='install-connector'>
						<h1>{headerText}</h1>
						<p className="lead text-center">
							<span className="d-sm-block">Zotero Connectors allow you to save to Zotero</span>
							{' '}
							<span className="d-sm-block">directly from your web browser.</span></p>
						{installButton}
						{versionNote}
						{getStandaloneSection}
						{showExtensionsLink}
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
InstallConnectorPrompt.propTypes = {
	numbered: PropTypes.bool,
	showStandalone: PropTypes.bool
};

export {InstallConnectorPrompt, AllExtensionsSection, InstallButton};
