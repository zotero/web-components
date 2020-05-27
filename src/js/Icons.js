// import {log as logger} from './Log.js';
// let log = logger.Logger('Icons');

import classnames from 'classnames';
import { PropTypes } from 'prop-types';

const config = window.zoteroConfig;
const imagePath = config.imagePath;

function ZoteroIcon(props) {
	let iconImagePath = `${imagePath}/icons/zotero-icon-${props.width}-${props.height}`;
	let iconImagePath2x = iconImagePath + '@2x.png';
	iconImagePath += '.png';

	let p = { ...props, src: iconImagePath, srcSet: `${iconImagePath2x} 2x`, className: classnames('zotero-icon', props.className) };
	delete p.browser;
	return (<img {...p} />);
}
ZoteroIcon.defaultProps = {
	width: '147',
	height: '160'
};
ZoteroIcon.propTypes = {
	width: PropTypes.string,
	height: PropTypes.string,
	className: PropTypes.string,
};

// BrowserIcon returns a browser icon image tag based on browser and size props
function BrowserIcon(props) {
	let browserImagePath = `${imagePath}/icons/${props.browser.toLowerCase()}-icon-${props.size}`;
	let browserImagePath2x = browserImagePath + '@2x.png';
	browserImagePath += '.png';

	let p = { ...props, src: browserImagePath, srcSet: `${browserImagePath2x} 2x`, className: classnames('browser-icon', props.className) };
	delete p.browser;
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
				height={props.zoteroIconHeight}
				className='zotero-icon'
			/>
		</figure>
	);
}
BrowserExtensionIcon.defaultProps = {
	browserIconSize: '128',
	zoteroIconWidth: '128',
	zoteroIconHeight: '140',
};
BrowserExtensionIcon.propTypes = {
	browser: PropTypes.string.isRequired,
	browserIconSize: PropTypes.string.isRequired,
	zoteroIconWidth: PropTypes.string.isRequired,
	zoteroIconHeight: PropTypes.string.isRequired,
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
