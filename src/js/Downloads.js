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
			'Windows': windowsDownload,
			'Mac OS X': macDownload,
			'Linux i686': linux32Download,
			'Linux x86_64': linux64Download
		};

		let featuredOS = this.props.featuredOS;
		if(!['Windows', 'Mac', 'Linux'].includes(featuredOS)){
			featuredOS = 'Windows';
		}

		let featuredButton;
		let otherVersions = [
			'Windows',
			'Mac OS X',
			'Linux i686',
			'Linux x86_64'
		];
		let OSLabel = featuredOS;
		let versionNote = null;

		switch(featuredOS) {
			case 'Windows':
				featuredButton = <DownloadStandaloneButton href={standaloneDownloadUrls['Windows']} />;
				otherVersions.splice(0, 1);
				break;
			case 'Mac':
				featuredButton = <DownloadStandaloneButton href={standaloneDownloadUrls['Mac']} />;
				otherVersions.splice(1, 1);
				if(this.props.oldMac){
					versionNote = (
						<p className='version-note'>
							Please note: The latest
							version of Zotero will not run on macOS 10.6, which is no longer supported by any major
							browser maker and no longer receives security updates from Apple. To install an outdated
							version of Zotero, click the link above, or upgrade to macOS 10.11 (El Capitan) or later to
							install the latest version. You can also use Zotero for Firefox with
							{' '}
							<a href="https://www.mozilla.org/en-US/firefox/organizations/">Firefox 45 ESR</a>
							{' '}
							until June 2017.
						</p>
					);
				}
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
			<section className='standalone'>
				<ZoteroIcon
					size='large'
					alt='Zotero Extension'
					className='download-image'
					width='147'
					height='160'
				/>
				<h1>Zotero 5.0 for {OSLabel}</h1>
				<p className='lead'>Your personal research assistant</p>
				{featuredButton}
				<p className='other-versions'>Other versions</p>
				<ul className='os-list'>
					{otherNodes}
				</ul>
				{versionNote}
			</section>
		);
	}
}

class DownloadConnector extends Component {
	render(){
		return (
			<section className='connector'>
				<img className='download-image' src={browserExtensionImagePath} srcSet={`${browserExtensionImagePath2x} 2x`} />
				<h1>Browser Extension</h1>
				<p className='lead'>Get Zotero connectors for your browser</p>
				<div className='downloadButton'><a href={buildUrl('extensions')} className='btn'>Download</a></div>
				<p className='description'>The Zotero Connector automatically senses content as you browse the web and allows you to save it to Zotero with a single click.</p>
			</section>
		);
	}
}

class DownloadPlugins extends Component {
	render(){
		return (
			<section className='plugins'>
				<div className='plugins-container clearfix'>
					<img className='plugins-icon' src={pluginsIconImagePath} />
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
