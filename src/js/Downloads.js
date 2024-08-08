import {log as logger} from './Log.js';
let log = logger.Logger('Downloads');

import { useState, useEffect } from 'react';
import { PropTypes } from 'prop-types';

import { ZoteroAppIconSVG, BrowserExtensionPlusAppIcon, ChevronDownIcon, ChevronUpIcon } from './Icons.js';
import { AllExtensionsSection, InstallButton, chromeDownload, edgeDownload, firefoxDownload } from './InstallConnector.js';
import classnames from 'classnames';

const config = window.zoteroConfig;
const installData = config.installData;

import { BrowserDetect } from './browserdetect.js';
import { Col, Collapse, Row } from 'reactstrap';

let platforms = [
	'mac',
	'win32',
	'win32-zip',
	'win-x64',
	'win-x64-zip',
	'win-arm64',
	'win-arm64-zip',
	'linux-i686',
	'linux-x86_64',
	'iOS',
	// 'android',
];

let platformVariants = {
	Mac: [
		{platform:'mac', label:'macOS', dlButtonLabel: 'Download'}
	],
	Windows: [
		{platform: 'win-x64', label: '64-bit Installer', dlButtonLabel: 'Download (64-bit)'},
		{platform: 'win-x64-zip', label: '64-bit ZIP', dlButtonLabel: 'Download (64-bit ZIP)'},
		{platform: 'win32', label: '32-bit Installer', dlButtonLabel: 'Download (32-bit Installer)'},
		{platform: 'win32-zip', label: '32-bit ZIP', dlButtonLabel: 'Download (32-bit ZIP)'},
		{platform: 'win-arm64', label: 'ARM Installer', dlButtonLabel: 'Download (ARM Installer)'},
		{platform: 'win-arm64-zip', label: 'ARM ZIP', dlButtonLabel: 'Download (ARM ZIP)'},
	],
	Linux: [
		{platform: 'linux-x86_64', label: '64-bit', dlButtonLabel: 'Download (64-bit)'},
		{platform: 'linux-i686', label: '32-bit', dlButtonLabel: 'Download (32-bit)'},
	],
	iOS: [
		{platform: 'iOS', label: 'iOS', dlButtonLabel: 'Download'}
	]
};

const iOSDownloadUrl = 'https://apps.apple.com/us/app/zotero/id1513554812';

let genericClientDownloadUrl = function (platform = 'win32') {
	// valid platforms are mac, win32, win32-zip linux-i686, and linux-x86_64
	return `https://www.zotero.org/download/client/dl?channel=release&platform=${platform}`;
};

let specificClientDownloadUrl = function (platform, version) {
	return `https://www.zotero.org/download/client/dl?channel=release&platform=${platform}&version=${version}`;
};

function DownloadStandaloneButton({label = 'Download', href=''}) {
	return (<div className='downloadButton'><a className='btn btn-lg' href={href}>{label}</a></div>);
}
DownloadStandaloneButton.propTypes = {
	href: PropTypes.string.isRequired,
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
	// const [showOldVersions, setShowOldVersions] = useState(false);
	const [showOtherPlatforms, setShowOtherPlatforms] = useState(false);
	
	let downloadUrls = {};
	platforms.forEach((platform) => {
		if (platform == 'iOS') {
			downloadUrls[platform] = iOSDownloadUrl;
			return;
		}
		downloadUrls[platform] = genericClientDownloadUrl(platform);
		if (props.standaloneVersions && props.standaloneVersions[platform]) {
			downloadUrls[platform] = specificClientDownloadUrl(platform, props.standaloneVersions[platform]);
		}
	});


	let featuredOS = props.featuredOS;
	if (!['Windows', 'Mac', 'macOS', 'Linux', 'iOS'].includes(featuredOS)) {
		featuredOS = 'Windows';
	}
	if (featuredOS == 'macOS') featuredOS = 'Mac';

	let otherVersions = structuredClone(platformVariants);
	let OSLabel = featuredOS;
	let wrapHeader = false;
	let versionNote = null;
	let featuredPlatform = 'win-x64';
	
	switch (featuredOS) {
		case 'Windows': {
			featuredPlatform = 'win-x64';
			versionNote = <p>Also available: <a href={downloadUrls['win-arm64']}>Windows ARM</a></p>;
			break;
		}
		case 'Mac': {
			featuredPlatform = 'mac';
			break;
		}
		case 'Linux': {
			featuredPlatform = (props.arch == 'i686') ? 'linux-i686' : 'linux-x86_64';
			break;
		}
		case 'iOS': {
			featuredPlatform = 'iOS';
			break;
		}
	}
	let variant = platformVariants[featuredOS].filter(v => v.platform == featuredPlatform)[0];
	let featuredUrl = downloadUrls[featuredPlatform];
	let featuredButton = <DownloadStandaloneButton href={featuredUrl} label={`${variant.dlButtonLabel}`} />;
	
	let otherNodes = [];
	for (let OS in otherVersions) {
		// log.debug(variant.platform);
		if (!otherVersions[OS]) {
			throw new Error("unexpected OS not in otherVersions");
		}
		if (otherVersions[OS].length == 0) {
			continue;
		} else if(otherVersions[OS].length == 1) {
			let variant = otherVersions[OS][0];
			let className = 'platform-list';
			if (variant.platform == featuredPlatform) {
				// continue;
				className += ' d-sm-none'
			}
			let downloadUrl = downloadUrls[variant.platform];
			let link = <a href={downloadUrl}>{variant.label}</a>;
			otherNodes.push(<li key={OS} {...{className}}>{link}</li>);
		} else {
			let links = [];
			otherVersions[OS].forEach(variant => {
				let className = '';
				if (variant.platform == featuredPlatform) {
					className += ' d-sm-none';
				}
				let downloadUrl = downloadUrls[variant.platform];
				links.push(<li key={variant.platform} {...{className}}><a href={downloadUrl}>{variant.label}</a></li>);
			});
			otherNodes.push(<li key={OS} className='platform-list'>{OS}: <ul>{links}</ul></li>);
		}
	}
	otherNodes.push(<li key='android' className='d-sm-none text-muted'><p className='android-teaser'>Stay tuned — Android app is coming soon.</p></li>);

	//old versions list
	let oldVersionNodes = [];
	for(let OS in props.oldVersions) {
		let url = specificClientDownloadUrl(props.oldVersions[OS].platform, props.oldVersions[OS].version);
		oldVersionNodes.push(<li key={OS}><a href={url}>{OS}</a></li>)
	}
	let oldVersions = (<div className='old-versions'><ul>
		{oldVersionNodes}
	</ul></div>);

	return (<>
		<div className='col-lg-6 d-none d-sm-block'>
			<div className='standalone download-section d-flex flex-column'>
				<Row><Col>
					<ZoteroAppIconSVG
						alt='Zotero'
						className='download-image'
						width='128'
						height='128'
					/>
					{featuredOS == 'iOS' ?
						<h1 className={wrapHeader ? 'wrap' : null}>Zotero for {OSLabel}</h1> :
						<h1 className={wrapHeader ? 'wrap' : null}>Zotero 7 for {OSLabel}</h1>
					}
					<p className='lead'>Your personal research assistant</p>

					{featuredButton}
				</Col></Row>

				<Row className='additional-notes'><Col>
					{versionNote}

					<div className='margin-help-div'>
						<p className='installation-help'><a href='https://www.zotero.org/support/installation'>Installation Help</a></p>
					</div>
				</Col></Row>

				<div className='row mt-auto' >
					<div className='col other-versions bottom-collapse'>
						<div className='toggle' onClick={(evt) => { setShowOtherPlatforms(!showOtherPlatforms); evt.preventDefault(); }}>
							<a href='#' >Other versions</a>
							<span className='float-right'>
							{showOtherPlatforms ?
								<ChevronDownIcon /> 
								: <ChevronUpIcon />
							}
							</span>
						</div>
						<Collapse isOpen={showOtherPlatforms}>
							<h3>Zotero 7</h3>
							<ul className='os-list'>{otherNodes}</ul>
							<h3>Zotero 6</h3>
							{oldVersions}
						</Collapse>
					</div>
				</div>
			</div>
		</div>
		<div className='standalone d-sm-none'>
			<Row className='xs-section'><Col>
			<h2>Download Zotero 7</h2>
			<ul className='os-list'>{otherNodes}</ul>
			{versionNote}

			<div className='margin-help-div'>
				<p className='installation-help'><a href='https://www.zotero.org/support/installation'>Installation Help</a></p>
			</div>
			</Col></Row>
		</div>
	</>);
}
DownloadStandalone.propTypes = {
	standaloneVersions: PropTypes.object,
	featuredOS: PropTypes.string,
	arch: PropTypes.string,
};

function DownloadConnector(props) {
	const [showAllExtensions, setShowAllExtensions] = useState(false);
	const iOS = props.featuredOS == 'iOS';
	
	let versionNote = null;
	if (!iOS && props.featuredBrowser == 'Safari') {
		versionNote = (
			<p className='installation-help'>
				<a href='https://www.zotero.org/support/kb/safari_compatibility'>Don’t see the Zotero Connector in Safari?</a>
			</p>
		);
	}

	let installButton = <InstallButton browser={props.featuredBrowser} label={`Install ${props.featuredBrowser} Connector`} />;
	let installAndDescription = installButton;
	if (iOS) {
		installAndDescription = <p>The Zotero iOS app automatically includes share-sheet functionality to save from your browser or other apps using the share button.</p>;
	}
	return (<>
		<div className='col-lg-6 d-none d-sm-block'>
			<section className='connector download-section d-flex flex-column'>
				<Row><Col>
					<BrowserExtensionPlusAppIcon
						className='extension-download-image'
						alt={props.featuredBrowser + ' Icon'}
						browser={props.featuredBrowser}
						browserIconSize='128'
						browserIconWidth='96'
						zoteroIconWidth='96'
						zoteroIconHeight='96'
					/>
					<h1>Zotero Connector</h1>
					<p className='lead'>Save from your browser with a single click</p>
					{installAndDescription}
				</Col></Row>
				<Row className='additional-notes'><Col>
					{versionNote}
				</Col></Row>
				
				<Row className='spacer-row'><Col>
				</Col></Row>

				<Row className='mt-auto'>
					<Col className='col other-versions bottom-collapse' >
						<div className='toggle' onClick={(evt) => { setShowAllExtensions(!showAllExtensions); evt.preventDefault(); }}>
							<a href='#' >Zotero Connectors for other browsers</a>
							<span className='float-right'>
							{showAllExtensions ?
								<ChevronDownIcon /> 
								: <ChevronUpIcon />
							}
							</span>
						</div>
						<Collapse isOpen={showAllExtensions}>
							<AllExtensionsSection title={false} except={props.featuredBrowser} type='image-link' otherBrowsers={['chrome', 'firefox', 'edge', 'safari']} />
						</Collapse>
					</Col>
				</Row>
			</section>
		</div>
		<div className='d-sm-none'>
			<Row className='xs-section'><Col>
			<h2>Download Zotero Connector</h2>
			<p><b>Zotero Connectors are for desktop only.</b> On mobile, you can easily save items and PDFs from the web to Zotero via the Share button in browsers and other apps.</p>
			<ul>
				<li>
					<a href={chromeDownload}>Chrome</a>
				</li>
				<li>
					<a href={firefoxDownload}>Firefox</a>
				</li>
				<li>
					<a href={edgeDownload}>Edge</a>
				</li>
				<li>
					<p>The Zotero Connector for Safari is bundled with Zotero. You can enable it from the Extensions pane in the Safari settings.</p>
					<p className='installation-help'>
						<a href='https://www.zotero.org/support/kb/safari_compatibility'>Don’t see the Zotero Connector in Safari?</a>
					</p>
				</li>
			</ul>
			</Col></Row>
		</div>
	</>);
}
DownloadConnector.propTypes = {
	featuredBrowser: PropTypes.string.isRequired
};

function Downloads(props) {
	// log.debug(BrowserDetect);
	// log.debug(props);
	let featuredBrowser = props.featuredBrowser || BrowserDetect.browser;
	if (['chrome', 'firefox', 'safari', 'edge'].indexOf(featuredBrowser.toLowerCase()) == -1) {
		featuredBrowser = 'Chrome';
	}
	const featuredOS = props.featuredOS || BrowserDetect.OS;
	const arch = props.arch || BrowserDetect.arch;// ((navigator.userAgent.indexOf('x86_64') != -1) ? 'x86_64' : 'x86');
	const mobile = props.mobile || navigator.userAgent.includes('mobile');
	
	useEffect(() => {
		if (typeof document != 'undefined') {
			document.documentElement.className += ' react-mounted';
		}
	}, []);

	return (
		<div className={classnames('downloads', mobile ? 'mobile' : '')}>
			<div className='container'>
				<div className='row'>
					<DownloadStandalone {...{featuredOS, arch, standaloneVersions:props.standaloneVersions, oldVersions:props.oldVersions}} />
					<DownloadConnector {...{featuredOS, featuredBrowser}} />
				</div>
			</div>
		</div>
	);
}
Downloads.propTypes = {
	standaloneVersions: PropTypes.object,
	featuredBrowser: PropTypes.string,
	featuredOS: PropTypes.string,
	arch: PropTypes.string,
	mobile: PropTypes.bool,
};

export { Downloads };
