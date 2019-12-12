// import {log as logger} from './Log.js';
// let log = logger.Logger('ExtensionsPicker');

import { useEffect } from 'react';
const React = require('react');

import { InstallConnectorPrompt } from './InstallConnector.js';

function ExtensionsPicker(props) {
	useEffect(() => {
		document.documentElement.className += ' react-mounted';
	}, []);

	return (
		<div id='extensions-container' className='extensions-picker react'>
			<InstallConnectorPrompt showStandalone={true} {...props} />
		</div>
	);
}

export { ExtensionsPicker };
