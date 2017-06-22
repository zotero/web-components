'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('Downloads');

const React = require('react');
const {Component} = React;
const flexibility = require('flexibility');

import {ZoteroIcon} from './Icons.js';
import classnames from 'classnames';

const config = window.zoteroConfig;
const installData = config.installData;

const {windowsDownload, macDownload, linux32Download, linux64Download} = installData;

const imagePath = config.imagePath;

const browserExtensionImagePath = imagePath + '/downloads/browser-extension.png';
const browserExtensionImagePath2x = imagePath + '/downloads/browser-extension@2x.png';

const pluginsIconImagePath = imagePath + '/downloads/plugins-icon.svg';

import {buildUrl} from './wwwroutes.js';

import {BrowserDetect} from './browserdetect.js';
import {BrowserIcon} from './Icons.js';

class DownloadStandaloneButton extends Component {
	render(){
		return (<div className='downloadButton'><a className='btn' href={this.props.href}>Download</a></div>);
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
			'macOS': macDownload,
			'Windows': windowsDownload,
			'Linux i686': linux32Download,
			'Linux x86_64': linux64Download
		};

		let featuredOS = this.props.featuredOS;
		if(!['Windows', 'Mac', 'Linux'].includes(featuredOS)){
			featuredOS = 'Windows';
		}

		let featuredButton;
		let otherVersions = [
			'macOS',
			'Windows',
			'Linux 32-bit',
			'Linux 64-bit'
		];
		let OSLabel = featuredOS;
		let versionNote = null;

		switch(featuredOS) {
			case 'Windows':
				featuredButton = <DownloadStandaloneButton href={standaloneDownloadUrls['Windows']} />;
				otherVersions.splice(1, 1);
				break;
			case 'Mac':
				featuredButton = <DownloadStandaloneButton href={standaloneDownloadUrls['Mac']} />;
				otherVersions.splice(0, 1);
				if(this.props.oldMac){
					versionNote = (
						<p className='version-note'>
							Please note: The latest version of Zotero will not run on macOS 10.6–10.8,
							which are no longer supported by any major browser maker and no longer
							receive security updates from Apple. To install an outdated version of
							Zotero, click the link above, or upgrade to macOS 10.11 (El Capitan) or
							later to install the latest version. All Macs running 10.8 can be upgraded
							to at least 10.11.
						</p>
					);
				}
				break;
			case 'Linux':
				if(this.props.arch == 'x86_64'){
					//OSLabel = 'Linux 64-bit';
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
			<section className='standalone'>
				<ZoteroIcon
					context='downloads'
					alt='Zotero'
					className='download-image'
					width='147'
					height='160'
				/>
				<h1>Zotero for {OSLabel}</h1>
				<p className='lead'>Your personal research assistant</p>
				{featuredButton}
				
				<p className='other-versions'>Other versions</p>
				<ul className='os-list'>
					{otherNodes}
				</ul>
				<p><a href="/support/4.0">Looking for Zotero 4.0?</a></p>
				{versionNote}
			</section>
		);
	}
}

class DownloadConnector extends Component {
	render(){
		return (
			<section className='connector'>
				<BrowserIcon
					className='download-image'
					alt={this.props.featuredBrowser + ' Icon'}
					browser={this.props.featuredBrowser}
					size="large"
				/>
				<h1>Zotero Connector</h1>
				<p className='lead'>Save to Zotero from your browser</p>
				<div className='downloadButton'><a href={buildUrl('extensions')} className='btn'>Install {this.props.featuredBrowser} Extension</a></div>
				<p className='description'>Zotero Connectors automatically sense content as you browse the web and allow you to save it to Zotero with a single click.</p>
				<p className='other-versions'><a href={buildUrl('extensions')}>Zotero Connectors for other browsers</a></p>
			</section>
		);
	}
}

class DownloadPlugins extends Component {
	render(){
		return (
			<section className='plugins'>
				<div className='plugins-container clearfix'>
					<img className='plugins-icon' width='116' height='120' src={pluginsIconImagePath} />
					<h1>Plugins</h1>
					<p>
						Install one of the many third-party plugins and become even more productive.<br />
						<a href={buildUrl('pluginSupport')}>Browse Plugins</a>
					</p>
				</div>
			</section>
		);
	}
}

class Downloads extends Component{
	constructor(props){
		super(props);
		this.state = {
			featuredOS:BrowserDetect.OS,
			featuredBrowser:BrowserDetect.browser,
			arch:((navigator.userAgent.indexOf('x86_64') != -1) ? 'x86_64' : 'x86'),
			oldMac: installData.oldMac,
			mobile: navigator.userAgent.includes('mobile')
		};
	}
	componentDidMount(){
		flexibility(document.documentElement);
		document.documentElement.className += ' react-mounted';
	}
	render(){
		let {featuredOS, featuredBrowser, arch, oldMac} = this.state;

		return (
			<div className={classnames('downloads', this.state.mobile?'mobile':'')}>
				<div className="container">
					<div className='row loose jumbotron'>
						<DownloadStandalone featuredOS={featuredOS} arch={arch} ref='downloadStandalone' oldMac={oldMac} />
						<DownloadConnector featuredBrowser={featuredBrowser} ref='downloadConnector' />
					</div>
					<DownloadPlugins />
				</div>
			</div>
		);
	}
}

export {Downloads};
