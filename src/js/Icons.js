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
		if(this.props.size == 'small'){
			iconImagePath += '-small';
		} else if(this.props.size == 'large'){
			iconImagePath += '-large';
		}
		let iconImagePath2x = iconImagePath + '@2x.png';
		iconImagePath += '.png';

		let p = {...this.props, src:iconImagePath, srcSet:`${iconImagePath2x} 2x`, className:classnames('zotero-icon', this.props.className)};
		delete p.browser;
		return (<img {...p} />);
	}
}


class BrowserIcon extends Component {
	render() {
		let browserImagePath = imagePath + '/extensions/';
		browserImagePath += this.props.browser + '-icon';
		if(this.props.size == 'small'){
			browserImagePath += '-small';
		} else if(this.props.size == 'large'){
			browserImagePath += '-large';
		}
		let browserImagePath2x = browserImagePath + '@2x.png';
		browserImagePath += '.png';

		let p = {...this.props, src:browserImagePath, srcSet:`${browserImagePath2x} 2x`, className:'browser-icon'};
		delete p.browser;
		return (<img {...p} />);
	}
}

export {ZoteroIcon, BrowserIcon};
