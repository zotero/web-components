// import {log as logger} from './Log.js';
// let log = logger.Logger('InstallConnector');

import { useState } from 'react';
import { PropTypes } from 'prop-types';

import { buildUrl } from './wwwroutes.js';
import { BrowserDetect } from './browserdetect.js';
import { VerticalExpandable } from './VerticalExpandable.js';
import { ZoteroIcon, BrowserIcon, BrowserExtensionIcon } from './Icons.js';
import { Delay } from './Utils.js';
import classnames from 'classnames';

const installData = window.zoteroConfig.installData;

const { firefoxHash, firefoxVersion } = installData;
const chromeDownload = 'https://chrome.google.com/webstore/detail/ekhagklcjbdpajgpjgmbionohlpdbjgc';
const edgeDownload = 'https://microsoftedge.microsoft.com/addons/detail/nmhdhpibnnopknkmonacoephklnflpho';
const firefoxDownload = `https://www.zotero.org/download/connector/dl?browser=firefox&version=${firefoxVersion}`;
const safariDownload = installData.oldSafari
	? 'https://www.zotero.org/download/connector/dl?browser=safari'
	: 'https://www.zotero.org/support/kb/safari_12_connector';

function InstallFirefoxButton(props) {
	const { label, type } = props;
	const installFirefox = (evt) => {
		if (typeof InstallTrigger == 'undefined') {
			return true;
		}
		evt.preventDefault();
		let params = {
			Zotero: {
				URL: firefoxDownload,
				Hash: firefoxHash
			}
		};

		window.InstallTrigger.install(params);
		return false;
	};

	if (type == 'button') {
		return (
			<a href={firefoxDownload} className='btn' onClick={installFirefox}>{label}</a>
		);
	} else if (type == 'image') {
		return (
			<a href={firefoxDownload} onClick={installFirefox}><BrowserIcon browser='firefox' /></a>
		);
	} else if (type == 'full') {
		return (
			<div className='download-full'>
				<div className='browser-image'><BrowserIcon browser='firefox' /></div>
				<h3>Firefox connector</h3>
				<div><a href={firefoxDownload} className='btn' onClick={installFirefox}>{label}</a></div>
			</div>
		);
	}
}
InstallFirefoxButton.defaultProps = {
	type: 'button',
	label: 'Install'
};

function InstallChromeButton(props) {
	const { type, label } = props;
	if (type == 'button') {
		return <a href={chromeDownload} id='chrome-connector-download-button' className='btn download-link'>{label}</a>;
	} else if (type == 'image') {
		return (
			<a href={chromeDownload}><BrowserIcon browser='chrome' /></a>
		);
	} else if (type == 'full') {
		return (
			<div className='download-full'>
				<div className='browser-image'><BrowserIcon browser='chrome' /></div>
				<h3>Chrome connector</h3>
				<div className='install-button'><a href={chromeDownload} id='chrome-connector-download-button' className='btn download-link'>{label}</a></div>
			</div>
		);
	}
}
InstallChromeButton.defaultProps = {
	type: 'button',
	label: 'Install'
};

function InstallEdgeButton(props) {
	const { type, label } = props;
	if (type == 'button') {
		return <a href={edgeDownload} id='edge-connector-download-button' className='btn download-link'>{label}</a>;
	} else if (type == 'image') {
		return (
			<a href={edgeDownload}><BrowserIcon browser='edge' /></a>
		);
	} else if (type == 'full') {
		return (
			<div className='download-full'>
				<div className='browser-image'><BrowserIcon browser='edge' /></div>
				<h3>Edge connector</h3>
				<div className='install-button'><a href={edgeDownload} id='edge-connector-download-button' className='btn download-link'>{label}</a></div>
			</div>
		);
	}
}
InstallEdgeButton.defaultProps = {
	type: 'button',
	label: 'Install'
};

function InstallSafariButton(props) {
	const { type, label } = props;
	if (type == 'button') {
		return (
			<p id="safari-download-text">The Zotero Connector for Safari is bundled with Zotero. You can enable it from the Extensions pane of the Safari preferences.</p>
		);
	} else if (type == 'image') {
		return (
			<a href={safariDownload}><BrowserIcon browser='safari' /></a>
		);
	} else if (type == 'full') {
		return (
			<div className='download-full'>
				<div className='browser-image'><BrowserIcon browser='safari' /></div>
				<h3>Safari connector</h3>
				<a href={safariDownload} id='safari-connector-download-button' className='btn download-link'>{label}</a>
			</div>
		);
	}
}
InstallSafariButton.defaultProps = {
	type: 'button',
	label: 'Install'
};

function InstallButton(props) {
	const { browser, label } = props;

	switch (browser.toLowerCase()) {
	case 'firefox':
		return <InstallFirefoxButton label={label} />;
	case 'chrome':
		return <InstallChromeButton label={label} />;
	case 'safari':
		return <InstallSafariButton label={label} />;
	case 'edge':
		return <InstallEdgeButton label={label} />;
	default:
		// TODO: unknown browser download?
		return null;
	}
}
InstallButton.defaultProps = {
	label: 'Install'
};
InstallButton.propTypes = {
	browser: PropTypes.string.isRequired,
	label: PropTypes.string,
};

function AllExtensionsSection(props) {
	const { type, except } = props;
	let otherBrowsers = ['chrome', 'firefox', 'safari', 'edge'].filter((browser) => {
		return browser != except.toLowerCase();
	});

	let installButtons = {
		chrome: <li key='chrome'><InstallChromeButton type={type} /></li>,
		firefox: <li key='firefox'><InstallFirefoxButton type={type} /></li>,
		safari: <li key='safari'><InstallSafariButton type={type} /></li>,
		edge: <li key='edge'><InstallEdgeButton type={type} /></li>
	};
	let installNodes = otherBrowsers.map((browser) => {
		return installButtons[browser];
	});
	return (
		<section className='all-extensions'>
			<h2 className='visually-hidden'>All connectors</h2>
			<ul>
				{installNodes}
			</ul>
			<p className='bookmarklet'>A <a href='/download/bookmarklet'>bookmarklet</a> that works
			in any browser, including those on smartphones and tablets, is also available.</p>
		</section>
	);
}
AllExtensionsSection.defaultProps = {
	type: 'full'
};
AllExtensionsSection.propTypes = {
	type: PropTypes.string.isRequired,
	except: PropTypes.string,
};

function InstallConnectorPrompt(props) {
	const [showingAllExtensions, setShowingAllExtensions] = useState(false);
	const [allExtensionsShown, setAllExtensionsShown] = useState(false);

	const featuredBrowser = props.featuredBrowser || BrowserDetect.browser;
	const oldSafari = props.oldSafari || installData.oldSafari;
	
	const showAllExtensions = (evt) => {
		setShowingAllExtensions(true);
		evt.preventDefault();
		Delay(400).then(() => {
			setAllExtensionsShown(true);
		});
	};

	let connectorText = '';
	let connectorImage = null;
	let installButton = <InstallButton browser={featuredBrowser.toLowerCase()} />;
	let versionNote = null;
	switch (featuredBrowser) {
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
		if (oldSafari) {
			versionNote = (
				<p className='version-note'>
						Please note: The link above is for an outdated version of the Safari connector,
						as the latest version is not compatible with your version of macOS.
						For the best experience, please upgrade to macOS 10.11 or later and reinstall
						the Safari connector from this page.
				</p>
			);
		}
		break;
	case 'Edge':
		connectorText = 'Zotero Connector for Edge';
		connectorImage = <BrowserExtensionIcon browser='edge' />;
		break;
	default:
		connectorText = 'Zotero Connector for Chrome';
		connectorImage = <BrowserExtensionIcon browser='chrome' />;
	}

	let otherBrowsers = ['chrome', 'firefox', 'safari', 'edge'].filter((browser) => { return browser.toLowerCase() != featuredBrowser.toLowerCase(); });
	let otherBrowserImages = otherBrowsers.map((browser) => {
		return <BrowserIcon key={browser} browser={browser} size='32' />;
	});

	let showExtensionsLink = (
		<p className={classnames('show-extensions', { 'fade-out': showingAllExtensions })}>
			<span className='inner-extensions'>
				{otherBrowserImages}<br />
				Not the browser you&apos;re looking for?<br />
				<a href='#' onClick={showAllExtensions}>Show all connectors</a>
			</span>
			<span className='inner-start'>
				<a href='#' onClick={showAllExtensions}>Not the browser you&apos;re looking for? Show all connectors</a>
			</span>
		</p>
	);

	let allExtensions = (
		<div id='all-extensions'>
			<VerticalExpandable expand={allExtensionsShown}>
				<AllExtensionsSection except={featuredBrowser.toLowerCase()} />
			</VerticalExpandable>
		</div>
	);

	let getStandaloneSection = null;
	if (props.showStandalone) {
		getStandaloneSection = (
			<p className='get-zotero-standalone'>
				<ZoteroIcon
					width='32'
					height='35'
					alt=''/>
				<br />
				<a href={buildUrl('download')}>Get Zotero</a>
				<br/>
				For Mac, Windows, and Linux
			</p>
		);
	}

	let headerText = `Install the ${connectorText}`;
	if (props.numbered) {
		headerText = `1. Install the ${connectorText}`;
	}

	return (
		<div>
			<div className='jumbotron'>
				<div className='container'>
					{connectorImage}
					<div className='install-connector'>
						<h1>{headerText}</h1>
						<p className='lead'>
							<span className='line'>Zotero Connectors allow you to save to Zotero</span>
							{' '}
							<span className='line'>directly from your web browser.</span></p>
						{installButton}
						{versionNote}
						{getStandaloneSection}
						{showExtensionsLink}
					</div>
				</div>
			</div>
			{allExtensions}
		</div>
	);
}

InstallConnectorPrompt.defaultProps = {
	numbered: false,
	showStandalone: false
};
InstallConnectorPrompt.propTypes = {
	numbered: PropTypes.bool,
	showStandalone: PropTypes.bool,
	featuredBrowser: PropTypes.string,
	oldSafari: PropTypes.bool,
};

export { InstallConnectorPrompt, AllExtensionsSection, InstallButton };
