// import {log as logger} from './Log.js';
// let log = logger.Logger('Icons');

import classnames from 'classnames';
import { PropTypes } from 'prop-types';

const config = window.zoteroConfig;
const imagePath = config.imagePath;

// Available sizes of zotero-app-icon-{size}.png
const zoteroIconSizes = [16, 32, 64, 128, 256, 512];

// Smallest available app icon at least `px` wide (or the largest one)
function zoteroIconSize(px) {
	return zoteroIconSizes.find(size => size >= px) || zoteroIconSizes[zoteroIconSizes.length - 1];
}

// ZoteroIcon returns the Zotero app icon at the given width
function ZoteroIcon(props) {
	const width = parseInt(props.width);
	const iconImagePath = `${imagePath}/icons/zotero-app-icon-${zoteroIconSize(width)}.png`;
	const iconImagePath2x = `${imagePath}/icons/zotero-app-icon-${zoteroIconSize(width * 2)}.png`;

	let p = { ...props, height: props.width, src: iconImagePath, srcSet: `${iconImagePath2x} 2x`, className: classnames('zotero-icon', props.className) };
	delete p.browser;
	return (<img {...p} />);
}
ZoteroIcon.defaultProps = {
	width: '160'
};
ZoteroIcon.propTypes = {
	width: PropTypes.string,
	className: PropTypes.string,
};

// BrowserIcon returns a browser icon image tag based on browser and size props
function BrowserIcon(props) {
	const browser = props.browser.toLowerCase();
	let src;
	let srcSet;
	if (browser == 'safari') {
		// Safari icon is only available as PNG (32, 64, 128, with @2x)
		const fileSize = props.size > 64 ? 128 : (props.size > 32 ? 64 : 32);
		src = `${imagePath}/icons/safari-icon-${fileSize}.png`;
		srcSet = `${imagePath}/icons/safari-icon-${fileSize}@2x.png 2x`;
	}
	else {
		src = `${imagePath}/icons/${browser}-icon.svg`;
	}

	let p = { ...props, src, srcSet, width: props.size, height: props.size, className: classnames('browser-icon', props.className) };
	delete p.browser;
	delete p.size;
	return (<img {...p} />);
}
BrowserIcon.defaultProps = {
	size: '64'
};
BrowserIcon.propTypes = {
	browser: PropTypes.string.isRequired,
	className: PropTypes.string,
	size: PropTypes.string.isRequired,
};

function BrowserExtensionIcon(props) {
	return (
		<figure className='browser-plus-extension'>
			<BrowserIcon
				browser={props.browser}
				size={props.browserIconSize}/>
			<span className='icon-plus'></span>
			<ZoteroIcon
				alt='Zotero Extension'
				width={props.zoteroIconWidth}
				className='zotero-icon'
			/>
		</figure>
	);
}
BrowserExtensionIcon.defaultProps = {
	browserIconSize: '128',
	zoteroIconWidth: '128',
};
BrowserExtensionIcon.propTypes = {
	browser: PropTypes.string.isRequired,
	browserIconSize: PropTypes.string.isRequired,
	zoteroIconWidth: PropTypes.string.isRequired,
};

function PluginsIcon(props) {
	return (
		<img className='plugins-icon' width={props.width} height={props.height} src={`${imagePath}/icons/plugins-icon.svg`} />
	);
}
PluginsIcon.propTypes = {
	width: PropTypes.string.isRequired,
	height: PropTypes.string.isRequired,
};

function OrcidIcon(props) {
	return (
		<img className='orcid-icon' width={props.width} height={props.height} src={`${imagePath}/icons/ORCiD_icon.svg`} />
	);
}
OrcidIcon.defaultProps = {
	width: '16px',
	height: '16px',
};
OrcidIcon.propTypes = {
	width: PropTypes.string.isRequired,
	height: PropTypes.string.isRequired,
};

export { ZoteroIcon, BrowserIcon, BrowserExtensionIcon, PluginsIcon, OrcidIcon };
