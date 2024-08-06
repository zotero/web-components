// import {log as logger} from './Log.js';
// let log = logger.Logger('Icons');

import classnames from 'classnames';
import { PropTypes } from 'prop-types';

const config = window.zoteroConfig;
const imagePath = config.imagePath;

function ZoteroIcon(props = {width: '147', height: '160'}) {
	let iconImagePath = `${imagePath}/icons/zotero-icon-${props.width}-${props.height}`;
	let iconImagePath2x = iconImagePath + '@2x.png';
	iconImagePath += '.png';

	let p = { ...props, src: iconImagePath, srcSet: `${iconImagePath2x} 2x`, className: classnames('zotero-icon', props.className) };
	delete p.browser;
	return (<img {...p} />);
}
// ZoteroIcon.defaultProps = {
// 	width: '147',
// 	height: '160'
// };
ZoteroIcon.propTypes = {
	width: PropTypes.string,
	height: PropTypes.string,
	className: PropTypes.string,
};

function ZoteroAppIconSVG(props = {width: '160', height: '160'}) {
	let iconImagePath = `${imagePath}/icons/zotero-app-icon`;
	iconImagePath += '.svg';

	let p = { ...props, src: iconImagePath, className: classnames('zotero-app-icon', props.className) };
	delete p.browser;
	return (<img {...p} />);
}
// ZoteroAppIconSVG.defaultProps = {
// 	width: '160',
// 	height: '160'
// };
ZoteroAppIconSVG.propTypes = {
	width: PropTypes.string,
	height: PropTypes.string,
	className: PropTypes.string,
};

// BrowserIcon returns a browser icon image tag based on browser and size props
function BrowserIcon({browser = '', size = '64', className = undefined}) {
	let browserImagePath = `${imagePath}/icons/${browser.toLowerCase()}-icon-${size}`;
	let browserImagePath2x = browserImagePath + '@2x.png';
	browserImagePath += '.png';

	let p = { ...{browser, size, className}, src: browserImagePath, srcSet: `${browserImagePath2x} 2x`, className: classnames('browser-icon', className) };
	delete p.browser;
	return (<img {...p} />);
}
BrowserIcon.propTypes = {
	browser: PropTypes.string.isRequired,
	className: PropTypes.string,
	size: PropTypes.string,
};

function BrowserExtensionIcon(props={
	browserIconSize: '128',
	browserIconWidth: '128',
	zoteroIconWidth: '128',
	zoteroIconHeight: '140',
}) {
	return (
		<figure className='browser-plus-extension'>
			<BrowserIcon
				browser={props.browser}
				width={props.browserIconWidth}
				size={props.browserIconSize}/>
			<span className='icon-plus'></span>
			<ZoteroAppIconSVG
				alt='Zotero Extension'
				width={props.zoteroIconWidth}
				height={props.zoteroIconHeight}
				className='zotero-app-icon'
			/>
		</figure>
	);
}
// BrowserExtensionIcon.defaultProps = {
// 	browserIconSize: '128',
// 	browserIconWidth: '128',
// 	zoteroIconWidth: '128',
// 	zoteroIconHeight: '140',
// };
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

function PencilIcon(props) {
	return (
		<img {...props} src={`${imagePath}/icons/octicons/pencil.svg`} />
	);
}

function TrashIcon(props) {
	return (
		<img {...props} src={`${imagePath}/icons/octicons/trashcan.svg`} />
	);
}

function CheckIcon(props) {
	return (
		<img {...props} src={`${imagePath}/icons/octicons/check.svg`} />
	);
}

function XIcon(props) {
	return (
		<img {...props} src={`${imagePath}/icons/octicons/x.svg`} />
	);
}

function PlusIcon(props) {
	return (
		<img {...props} src={`${imagePath}/icons/octicons/plus.svg`} />
	);
}

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

function ChevronDownIcon() {
	return (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 16 16">
		<path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
	</svg>);
}

function ChevronUpIcon() {
	return (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-up" viewBox="0 0 16 16">
		<path fillRule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/>
	</svg>);
}

export { ZoteroIcon, ZoteroAppIconSVG, BrowserIcon, BrowserExtensionIcon, PluginsIcon, PencilIcon, TrashIcon, CheckIcon, XIcon, PlusIcon, OrcidIcon, ChevronDownIcon, ChevronUpIcon };
