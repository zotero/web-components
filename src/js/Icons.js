'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('Icons');

const React = require('react');
const {Component} = React;

import classnames from 'classnames';

const config = window.zoteroConfig;
const imagePath = config.imagePath;

class ZoteroIcon extends Component {
	render() {
		let iconImagePath = imagePath + '/extensions/zotero-icon';
		//allow specific context for icon if needed
		if(this.props.context == 'extensions') {
			iconImagePath = imagePath + '/extensions/zotero-icon';
		} else if(this.props.context == 'downloads') {
			iconImagePath = imagePath + '/downloads/zotero-icon';
		}
		if(this.props.size == 'small'){
			iconImagePath += '-small';
		} else if(this.props.size == 'large'){
			iconImagePath += '-large';
		}
		let iconImagePath2x = iconImagePath + '@2x.png';
		iconImagePath += '.png';

		let p = {...this.props, src:iconImagePath, srcSet:`${iconImagePath2x} 2x`, className:classnames('zotero-icon', this.props.className)};
		delete p.browser;
		delete p.context;
		return (<img {...p} />);
	}
}


class BrowserIcon extends Component {
	render() {
		let browserImagePath = imagePath + '/extensions/';
		browserImagePath += this.props.browser.toLowerCase() + '-icon';
		if(this.props.size == 'small'){
			browserImagePath += '-small';
		} else if(this.props.size == 'large'){
			browserImagePath += '-large';
		}
		let browserImagePath2x = browserImagePath + '@2x.png';
		browserImagePath += '.png';

		let p = {...this.props, src:browserImagePath, srcSet:`${browserImagePath2x} 2x`, className:classnames('browser-icon', this.props.className)};
		delete p.browser;
		return (<img {...p} />);
	}
}

export {ZoteroIcon, BrowserIcon};
