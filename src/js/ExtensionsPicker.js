'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('ExtensionsPicker');

const React = require('react');
const {Component} = React;

const config = window.zoteroConfig;
const installData = config.installData;

//const firefoxVersion = window.zoteroConfig.firefoxVersion;
const firefoxHash = installData.firefoxHash;
const firefoxDownload = installData.firefoxDownload;
const chromeInstallUrl = installData.chromeInstallUrl;
const safariDownloadUrl = installData.safariDownloadUrl;
const operaDownloadUrl = installData.operaDownloadUrl;

const recaptchaSitekey = config.recaptchaSitekey;

const imagePath = config.imagePath;

const chromeExtensionImagePath = imagePath + '/start/chrome-extension.jpg';
const firefoxExtensionImagePath = imagePath + '/start/firefox-extension.jpg';
const safariExtensionImagePath = imagePath + '/start/safari-extension.jpg';
const chromeExtension2xImagePath = imagePath + '/start/chrome-extension@2x.jpg';
const firefoxExtension2xImagePath = imagePath + '/start/firefox-extension@2x.jpg';
const safariExtension2xImagePath = imagePath + '/start/safari-extension@2x.jpg';
const connectorButtonImagePath = imagePath + '/start/zotero-button.svg';
const arrowDownGrayImagePath = imagePath + '/start/arrow-down-gray.svg';
const arrowDownWhiteImagePath = imagePath + '/start/arrow-down-white.svg';

const chromeBrowserImagePath = imagePath + '/theme/browser_icons/64-chrome.png';
const firefoxBrowserImagePath = imagePath + '/theme/browser_icons/64-firefox.png';
const safariBrowserImagePath = imagePath + '/theme/browser_icons/64-safari.png';
const operaBrowserImagePath = imagePath + '/theme/browser_icons/64-opera.png';

import {buildUrl} from './wwwroutes.js';

import {BrowserDetect} from './browserdetect.js';

import {InstallConnectorPrompt} from './Start.js';

let browser = BrowserDetect.browser;
/*
class AllExtensions extends Component {
	render(){
		return (

		);
	}
}
*/

class ExtensionsPicker extends Component {
	render(){
		return (
			<div id='extensions-container'>
				<InstallConnectorPrompt showStandalone={true} />
			</div>
		);
	}
}

export {ExtensionsPicker};