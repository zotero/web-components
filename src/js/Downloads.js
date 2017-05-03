'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('Downloads');

const React = require('react');
const {Component} = React;

const config = window.zoteroConfig;
const installData = config.installData;

const windowsDownloadUrl = installData.windowsDownloadUrl;
const macDownloadUrl = installData.macDownloadUrl;
const linux32DownloadUrl = installData.linux32DownloadUrl;
const linux64DownloadUrl = installData.linux64DownloadUrl;

const imagePath = config.imagePath;

const standaloneImagePath = imagePath + '/downloads/zotero-icon.jpg';
const standaloneImagePath2x = imagePath + '/downloads/zotero-icon@2x.jpg';

const browserExtensionImagePath = imagePath + '/downloads/browser-extension.jpg';
const browserExtensionImagePath2x = imagePath + '/downloads/browser-extension@2x.jpg';

const pluginsIconImagePath = imagePath + '/downloads/plugins-icon.svg';

import {buildUrl} from './wwwroutes.js';

import {BrowserDetect} from './browserdetect.js';

class DownloadStandaloneButton extends Component {
	render(){
		return (<div className='downloadButton'><a className='button' href={this.props.href}>Download</a></div>);
	}
}

class OtherDownloadLinkListItem extends Component {
	render(){
		return (
			<li>
				<a href={this.props.href}>{this.props.OS}</a>
			</li>
		);
	}
}

class DownloadStandalone extends Component {
	render(){
		let standaloneDownloadUrls = {
			Windows: windowsDownloadUrl,
			'Mac OS X': macDownloadUrl,
			'Linux i686': linux32DownloadUrl,
			'Linux x86_64': linux64DownloadUrl
		};

		let featuredOS = this.props.featuredOS;
		let featuredButton;
		let otherVersions = [
			'Windows',
			'Mac OS X',
			'Linux i686',
			'Linux x86_64'
		];
		let OSLabel = featuredOS;

		switch(featuredOS) {
			case 'Windows':
				featuredButton = <DownloadStandaloneButton href={standaloneDownloadUrls['Windows']} />;
				otherVersions.splice(0, 1);
				break;
			case 'Mac':
				featuredButton = <DownloadStandaloneButton href={standaloneDownloadUrls['Mac']} />;
				otherVersions.splice(1, 1);
				break;
			case 'Linux':
				if(this.props.arch == 'x86_64'){
					OSLabel = 'Linux 64-bit';
					featuredButton = <DownloadStandaloneButton href={standaloneDownloadUrls['Linux x86_64']} />;
					otherVersions.splice(3, 1);
				} else {
					OSLabel = 'Linux 32-bit';
					featuredButton = <DownloadStandaloneButton href={standaloneDownloadUrls['Linux i686']} />;
					otherVersions.splice(2, 1);
				}
				break;
		}
		
		let otherNodes = otherVersions.map((os)=>{
			let downloadUrl = standaloneDownloadUrls[os];
			return <OtherDownloadLinkListItem key={os} OS={os} href={downloadUrl} />;
		});

		return (
			<div id='download-standalone-section' className='flex-section'>
				<img className='downloadImage' src={standaloneImagePath} srcSet={`${standaloneImagePath2x} 2x`} />
				<h1>Zotero 5.0 for {OSLabel}</h1>
				<p>Your personal research assistant</p>
				{featuredButton}
				<p>Other versions</p>
				<ul className='other-versions'>
					{otherNodes}
				</ul>
			</div>
		);
	}
}

class DownloadConnector extends Component {
	render(){
		return (
			<div id='download-connector-section' className='flex-section'>
				<img className='downloadImage downloadConnectorImage' src={browserExtensionImagePath} srcSet={`${browserExtensionImagePath2x} 2x`} />
				<h1>Browser Extension</h1>
				<div className='install-connector-section'>
					<p>Get Zotero connectors for your browser</p>
					<div className='downloadButton'><a className='button'>Download</a></div>
					<p>The Zotero Connector automatically senses content as you browse the web and allows you to save it to Zotero with a single click.</p>
				</div>
			</div>
		);
	}
}

class DownloadPlugins extends Component {
	render(){
		return (
			<div id='download-plugins-section' className='flex-container'>
				<div className='flex-section'>
					<img id='plugins-image' className='downloadImage' src={pluginsIconImagePath} />
					<h1>Plugins</h1>
					<p>Install one of the many third-party plugins and become even more productive.</p>
					<p><a href={buildUrl('pluginSupport')}>Browse Plugins</a></p>
				</div>
			</div>
		);
	
	}
}

class Downloads extends Component{
	render(){
		window.BrowserDetect = BrowserDetect;

		let featuredOS = BrowserDetect.OS;
		let featuredBrowser = BrowserDetect.browser;
		let arch = (navigator.userAgent.indexOf('x86_64') != -1) ? 'x86_64' : 'x86';

		return (
			<div id='downloads-container'>
				<div className='flex-container'>
					<DownloadStandalone featuredOS={featuredOS} arch={arch} />
					<DownloadConnector featuredBrowser={featuredBrowser} />
				</div>
				<DownloadPlugins />
			</div>
		);
	}
}

export {Downloads};
