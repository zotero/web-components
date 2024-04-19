// import {log as logger} from './Log.js';
// let log = logger.Logger('Downloads');

import { useState, useEffect } from 'react';
import { PropTypes } from 'prop-types';

import { ZoteroIcon, PluginsIcon, BrowserExtensionIcon } from './Icons.js';
import { AllExtensionsSection, InstallButton } from './InstallConnector.js';
import { VerticalExpandable } from './VerticalExpandable.js';
import classnames from 'classnames';

const installData = window.zoteroConfig.installData;

import { buildUrl } from './wwwroutes.js';

import { BrowserDetect } from './browserdetect.js';

let platforms = [
	'mac',
	'win32',
	'win32-zip',
	'linux-i686',
	'linux-x86_64'
];

let platformMap = {
	macOS: 'mac',
	Windows: 'win32',
	'Windows ZIP': 'win32-zip',
	'Linux 32-bit': 'linux-i686',
	'Linux 64-bit': 'linux-x86_64'
};

let genericClientDownloadUrl = function (platform = 'win32') {
	// valid platforms are mac, win32, win32-zip, linux-i686, and linux-x86_64
	return `https://www.zotero.org/download/client/dl?channel=release&platform=${platform}`;
};

let specificClientDownloadUrl = function (platform, version) {
	return `https://www.zotero.org/download/client/dl?channel=release&platform=${platform}&version=${version}`;
};

function DownloadStandaloneButton(props) {
	return (<div className='downloadButton'><a className='btn' href={props.href}>Download</a></div>);
}
DownloadStandaloneButton.propTypes = {
	href: PropTypes.string.isRequired
};

function OtherDownloadLinkListItem(props) {
	return (
		<li>
			<a href={props.href}>{props.OS}</a>
		</li>
	);
}
OtherDownloadLinkListItem.propTypes = {
	href: PropTypes.string.isRequired,
	OS: PropTypes.string.isRequired,
};

function DownloadStandalone(props) {
	let downloadUrls = {};
	platforms.forEach((platform) => {
		downloadUrls[platform] = genericClientDownloadUrl(platform);
		if (props.standaloneVersions && props.standaloneVersions[platform]) {
			downloadUrls[platform] = specificClientDownloadUrl(platform, props.standaloneVersions[platform]);
		}
	});

	const [showOldVersions, setShowOldVersions] = useState(false);

	let featuredOS = props.featuredOS;
	if (!['Windows', 'Mac', 'Linux'].includes(featuredOS)) {
		featuredOS = 'Windows';
	}

	let featuredButton;
	let otherVersions = [
		'macOS',
		'Windows',
		'Windows ZIP',
		'Linux 32-bit',
		'Linux 64-bit'
	];
	let OSLabel = featuredOS;
	let wrapHeader = false;
	let versionNote = null;

	switch (featuredOS) {
	case 'Windows': {
		let url = downloadUrls.win32;
		if (props.oldWindows) {
			url = specificClientDownloadUrl('windows', '5.0.77');
			versionNote = (
				<p className='version-note'>
						Please note: The latest version of Zotero will not run on versions of
						Windows older than Windows 7. To install an outdated version of
						Zotero, click the link above, or upgrade to Windows 7 or later to
						install the latest version.
				</p>
			);
		}
		featuredButton = <DownloadStandaloneButton href={url} />;
		otherVersions.splice(1, 1);
		break;
	}
	case 'Mac': {
		let url = downloadUrls.mac;
		if (props.oldMac) {
			url = specificClientDownloadUrl('mac', '4.0.29.11');
		}
		featuredButton = <DownloadStandaloneButton href={url} />;
		otherVersions.splice(0, 1);
		if (props.oldMac) {
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
	case 'Linux': {
		if (props.arch == 'x86_64') {
			let url = downloadUrls['linux-x86_64'];
			featuredButton = <DownloadStandaloneButton href={url} />;
			otherVersions.splice(3, 1);
		} else {
			let url = downloadUrls['linux-i686'];
			OSLabel = 'Linux 32-bit';
			wrapHeader = true;
			featuredButton = <DownloadStandaloneButton href={url} />;
			otherVersions.splice(2, 1);
		}
		/*
		versionNote = (
			<p className='installation-help'>
				<a href='/support/installation'>Installation Help</a>
			</p>
		);
		*/
		break;
	}
	}

	let otherNodes = otherVersions.map((os) => {
		let downloadUrl = downloadUrls[platformMap[os]];
		return <OtherDownloadLinkListItem key={os} OS={os} href={downloadUrl} />;
	});

	return (
		<section className='standalone'>
			<ZoteroIcon
				alt='Zotero'
				className='download-image'
				width='147'
				height='160'
			/>
			<h1 className={wrapHeader ? 'wrap' : null}>Zotero 6 for {OSLabel}</h1>
			<p className='lead'>Your personal research assistant</p>
			{featuredButton}

			{versionNote}

			<p className='other-versions'>Other platforms</p>
			<ul className='os-list'>
				{otherNodes}
			</ul>
			<p className='installation-help'><a href='https://www.zotero.org/support/installation'>Installation Help</a></p>
			{/*
			{!showOldVersions
				? <p><a href='#' onClick={() => { setShowOldVersions(true); }}>Looking for Zotero 4.0?</a></p>
				: ''
			}
			<VerticalExpandable expand={showOldVersions}>
				<ul className='old-versions'>
					<li>
						<h3>Zotero 4.0 for Firefox</h3>
						<ul>
							<li><a href='https://download.zotero.org/extension/zotero-4.0.29.25.xpi'>Zotero for Firefox</a></li>
							<li><a href='/support/word_processor_plugin_installation'>Word processor plugins</a></li>
						</ul>
					</li>
					<li>
						<h3>Zotero Standalone 4.0</h3>
						<ul>
							{props.oldMac
								? <li><a href={specificClientDownloadUrl('mac', '4.0.29.11')}>Mac (10.6–10.8)</a></li>
								: <li><a href={specificClientDownloadUrl('mac', '4.0.29.15')}>Mac</a></li>}
							<li><a href={specificClientDownloadUrl('win32', '4.0.29.17')}>Windows</a></li>
							<li><a href={specificClientDownloadUrl('linux-i686', '4.0.29.10')}>Linux 32-bit</a></li>
							<li><a href={specificClientDownloadUrl('linux-x86_64', '4.0.29.10')}>Linux 64-bit</a></li>
						</ul>
					</li>
				</ul>
			</VerticalExpandable>
			*/}
		</section>
	);
}
DownloadStandalone.propTypes = {
	standaloneVersions: PropTypes.object,
	featuredOS: PropTypes.string,
	oldMac: PropTypes.bool,
	oldWindows: PropTypes.bool,
	arch: PropTypes.string,
};

function DownloadConnector(props) {
	const [showAllExtensions, setShowAllExtensions] = useState(false);
	const oldSafari = installData.oldSafari;
	const oldFirefox = /Firefox\/(4[56789]|5[01])\./.test(navigator.userAgent);
	
	let versionNote = null;
	if (props.featuredBrowser == 'Safari') {
		versionNote = (
			<p className='installation-help'>
				<a href='https://www.zotero.org/support/kb/safari_compatibility'>Don’t see the Zotero Connector in Safari?</a>
			</p>
		);
		/*
		if (oldSafari) {
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
				<p className='installation-help'>
					<a href='https://www.zotero.org/support/kb/safari_connector_installation'>Need help installing the Connector?</a>
				</p>
			);
		}
		*/
	}
	let installButton = <InstallButton browser={props.featuredBrowser} label={`Install ${props.featuredBrowser} Connector`} />;
	if (oldFirefox) {
		installButton = <p className='danger'>It looks like you’re using an outdated version of Firefox. Please install Firefox 52 or later to use the Zotero Connector.</p>;
	}
	let installAndDescription = (<>
		{installButton}
		<p className='description'>Zotero Connectors automatically sense content as you browse the web and allow you to save it to Zotero with a single click.</p>
	</>);
	if (props.featuredBrowser == 'Safari') {
		installAndDescription = (<>
			<p className='description'>Zotero Connectors automatically sense content as you browse the web and allow you to save it to Zotero with a single click.</p>
			{installButton}
		</>);
	}
	return (
		<section className='connector'>
			<BrowserExtensionIcon
				className='download-image'
				alt={props.featuredBrowser + ' Icon'}
				browser={props.featuredBrowser}
				browserIconSize='112'
				zoteroIconWidth='112'
				zoteroIconHeight='122'
			/>
			<h1>Zotero Connector</h1>
			<p className='lead'>Save to Zotero from your browser</p>
			{installAndDescription}
			{versionNote}
			{!showAllExtensions
				? <p className='other-versions'><a href='#' onClick={(evt) => { setShowAllExtensions(true); evt.preventDefault(); }}>Zotero Connectors for other browsers</a></p>
				: ''}
			<VerticalExpandable expand={showAllExtensions}>
				<AllExtensionsSection except={props.featuredBrowser} type='full' />
			</VerticalExpandable>
		</section>
	);
}
DownloadConnector.propTypes = {
	featuredBrowser: PropTypes.string.isRequired
};

function DownloadPlugins() {
	return (
		<section className='plugins'>
			<div className='plugins-container clearfix'>
				<PluginsIcon width='116' height='120' />
				<h1>Plugins</h1>
				<p>
					Install one of the many third-party plugins and become even more productive.<br />
					<a href={buildUrl('pluginSupport')}>Browse Plugins</a>
				</p>
			</div>
		</section>
	);
}

function Downloads(props) {
	let featuredBrowser = props.featuredBrowser || BrowserDetect.browser;
	if (['chrome', 'firefox', 'safari', 'edge'].indexOf(featuredBrowser.toLowerCase()) == -1) {
		featuredBrowser = 'Chrome';
	}
	const featuredOS = props.featuredOS || BrowserDetect.OS;
	const arch = props.arch || ((navigator.userAgent.indexOf('x86_64') != -1) ? 'x86_64' : 'x86');
	const oldMac = props.oldMac || installData.oldMac;
	const oldWindows = props.oldWindows || installData.oldWindows;
	const mobile = props.mobile || navigator.userAgent.includes('mobile');
	
	useEffect(() => {
		if (typeof document != 'undefined') {
			document.documentElement.className += ' react-mounted';
		}
	}, []);

	return (
		<div className={classnames('downloads', mobile ? 'mobile' : '')}>
			<div className='container'>
				{featuredBrowser == 'none'
					? <p style={{
						width: '90%',
						marginLeft: 'auto',
						marginRight: 'auto',
						fontSize: '16px',
						fontWeight: 'bold',
						textAlign: 'center',
						backgroundColor: '#fff9b7',
						paddingTop: '9px',
						paddingBottom: '9px',
						borderRadius: '4px'
					}}>
						Using Zotero with Firefox? We’ve made some{' '}
						<a href='/blog/a-unified-zotero-experience/'>important changes</a> to the way
						Zotero works.
					</p>
					: ''}
				
				<div className='row loose jumbotron'>
					<DownloadStandalone featuredOS={featuredOS} arch={arch} oldMac={oldMac} oldWindows={oldWindows} standaloneVersions={props.standaloneVersions} />
					<DownloadConnector featuredBrowser={featuredBrowser} />
				</div>
				<DownloadPlugins />
			</div>
		</div>
	);
}
Downloads.propTypes = {
	standaloneVersions: PropTypes.object,
	featuredBrowser: PropTypes.string,
	featuredOS: PropTypes.string,
	arch: PropTypes.string,
	oldMac: PropTypes.bool,
	oldWindows: PropTypes.bool,
	mobile: PropTypes.bool,
};

export { Downloads };
