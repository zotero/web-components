'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('ExtensionsPicker');

const React = require('react');
const {Component} = React;

import {InstallConnectorPrompt} from './Start.js';

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