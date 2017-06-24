'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('Downloads');

const React = require('react');
const {Component} = React;
const flexibility = require('flexibility');

import {ZoteroIcon} from './Icons.js';
import classnames from 'classnames';
import {AllExtensionsSection} from './InstallConnector.js';
import {VerticalExpandable} from './VerticalExpandable.js';
import {InstallButton} from './InstallConnector.js';
import {ajax} from './ajax.js';

const config = window.zoteroConfig;
const installData = config.installData;

const imagePath = config.imagePath;
const pluginsIconImagePath = imagePath + '/downloads/plugins-icon.svg';

import {buildUrl} from './wwwroutes.js';

import {BrowserDetect} from './browserdetect.js';
import {BrowserIcon} from './Icons.js';

let platforms = [
	'mac',
	'win32',
	'linux-i686',
	'linux-x86_64'
];

let platformMap = {
	'macOS': 'mac',
	'Windows': 'win32',
	'Linux 32-bit': 'linux-i686',
	'Linux 64-bit': 'linux-x86_64'
};

let genericClientDownloadUrl = function(platform='win32'){
	//valid platforms are mac, win32, linux-i686, and linux-x86_64
	return `https://www.zotero.org/download/standalone/dl?channel=release&platform=${platform}`;
};

let specificClientDownloadUrl = function(platform, version){
	switch(platform){
		case 'win32':
			return `https://download.zotero.org/standalone/${version}/Zotero-${version}_setup.exe`;
		case 'mac':
			return `https://download.zotero.org/standalone/${version}/Zotero-${version}.dmg`;
		case 'linux-i686':
			return `https://download.zotero.org/standalone/${version}/Zotero-${version}_linux-i686.tar.bz2`;
		case 'linux-x86_64':
			return `https://download.zotero.org/standalone/${version}/Zotero-${version}_linux-x86_64.tar.bz2`;
		default:
			log.error('Invalid platform for downloadUrl');
	}
};

let getManifest = function(platform){
	let url = `https://www.zotero.org/download/standalone/manifests/release/updates-${platform}.json`;
	return ajax(url).then((resp)=>{
		resp.json().then((manifest)=>{
			return manifest;
		});
	});
};

let getAllManifests = function(){
	let promises = platforms.map((platform)=>{
		return getManifest(platform);
	});
	return Promise.all(promises).then((manifests)=>{
		return {
			'mac':manifests[0],
			'win32':manifests[1],
			'linux-i686': manifests[2],
			'linux-x86_64': manifests[3]
		};
	}).catch(()=>{
		throw 'Error retrieving manifests';
	});
};

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
	constructor(props){
		super(props);
		
		let downloadUrls = {};
		platforms.forEach((platform)=>{
			downloadUrls[platform] = genericClientDownloadUrl(platform);
		});
		this.state = {
			showOldVersions:false,
			downloadUrls:downloadUrls,
			versionSpecificUrls:false
		};
		this.showOldVersions = this.showOldVersions.bind(this);
	}
	componentDidMount(){
		getAllManifests().then((manifests)=>{
			let downloadUrls = {};
			platforms.forEach((platform)=>{
				let manifest = manifests[platform];
				let version = manifest['version'];
				downloadUrls[platform] = specificClientDownloadUrl(platform, version);
			});
			this.setState({downloadUrls:downloadUrls});
		}).catch(()=>{
			log.error('Error getting manifest files');
		});
	}
	showOldVersions(evt){
		this.setState({showOldVersions:true});
		evt.preventDefault();
	}
	render(){
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
			case 'Windows':{
				let url = this.state.downloadUrls['win32'];
				featuredButton = <DownloadStandaloneButton href={url} />;
				otherVersions.splice(1, 1);
				break;
			}
			case 'Mac':{
				let url = this.state.downloadUrls['mac'];
				if(this.props.oldMac){
					url = specificClientDownloadUrl('mac', '4.0.29.11');
				}
				featuredButton = <DownloadStandaloneButton href={url} />;
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
			}
			case 'Linux':{
				if(this.props.arch == 'x86_64'){
					let url = this.state.downloadUrls['linux-x86_64'];
					featuredButton = <DownloadStandaloneButton href={url} />;
					otherVersions.splice(3, 1);
				} else {
					let url = this.state.downloadUrls['linux-i686'];
					OSLabel = 'Linux 32-bit';
					featuredButton = <DownloadStandaloneButton href={url} />;
					otherVersions.splice(2, 1);
				}
				break;
			}
		}

		let otherNodes = otherVersions.map((os)=>{
			let downloadUrl = this.state.downloadUrls[platformMap[os]];
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
				
				{versionNote}
				
				<p className='other-versions'>Other platforms</p>
				<ul className='os-list'>
					{otherNodes}
				</ul>
				
				{!this.state.showOldVersions
					? <p><a href="#" onClick={this.showOldVersions}>Looking for Zotero 4.0?</a></p>
					: ''
				}
				<VerticalExpandable expand={this.state.showOldVersions}>
					<ul className='old-versions'>
						<li>
							<h3>Zotero 4.0 for Firefox</h3>
							<ul>
								<li><a href="https://download.zotero.org/extension/zotero-4.0.29.21.xpi">Zotero for Firefox</a></li>
								<li><a href="/support/word_processor_plugin_installation">Word processor plugins</a></li>
							</ul>
						</li>
						<li>
							<h3>Zotero Standalone 4.0</h3>
							<ul>
								{this.props.oldMac
									? <li><a href={specificClientDownloadUrl('mac', '4.0.29.11')}>Mac (10.6–10.8)</a></li>
									: <li><a href={specificClientDownloadUrl('mac', '4.0.29.15')}>Mac</a></li>}
								<li><a href={specificClientDownloadUrl('win32', '4.0.29.17')}>Windows</a></li>
								<li><a href={specificClientDownloadUrl('linux-i686', '4.0.29.10')}>Linux 32-bit</a></li>
								<li><a href={specificClientDownloadUrl('linux-x86_64', '4.0.29.10')}>Linux 64-bit</a></li>
							</ul>
						</li>
					</ul>
				</VerticalExpandable>
			</section>
		);
	}
}

class DownloadConnector extends Component {
	constructor(props){
		super(props);
		this.state = {
			showAllExtensions:false
		};
		this.showAllExtensions = this.showAllExtensions.bind(this);
	}
	showAllExtensions(evt){
		this.setState({showAllExtensions:true});
		evt.preventDefault();
	}
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
				<InstallButton browser={this.props.featuredBrowser} label={`Install ${this.props.featuredBrowser} Extension`} />
				<p className='description'>Zotero Connectors automatically sense content as you browse the web and allow you to save it to Zotero with a single click.</p>
				{!this.state.showAllExtensions
					? <p className='other-versions'><a href='#' onClick={this.showAllExtensions}>Zotero Connectors for other browsers</a></p>
					: ''}
				<VerticalExpandable expand={this.state.showAllExtensions}>
					<AllExtensionsSection except={this.props.featuredBrowser} type='full' />
					<p>A <a href="/downloadbookmarklet">bookmarklet</a> that works
					in any browser, including those on smartphones and tablets, is also available.</p>
				</VerticalExpandable>
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
		if(typeof document != 'undefined'){
			flexibility(document.documentElement);
			document.documentElement.className += ' react-mounted';
		}
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
