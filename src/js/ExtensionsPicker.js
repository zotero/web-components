'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('ExtensionsPicker');

const React = require('react');
const {Component} = React;

import {InstallConnectorPrompt} from './InstallConnector.js';

class ExtensionsPicker extends Component {
	render(){
		return (
			<div id='extensions-container' className='extensions-picker'>
				<InstallConnectorPrompt showStandalone={true} ref="installConnectorPrompt" />
			</div>
		);
	}
}

export {ExtensionsPicker};