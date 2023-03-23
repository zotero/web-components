'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('ExtensionsPicker');

import React from 'react';
const {Component} = React;

import {InstallConnectorPrompt} from './InstallConnector.js';

class ExtensionsPicker extends Component {
	componentDidMount(){
		document.documentElement.className += ' react-mounted';
	}
	render(){
		return (
			<div id='extensions-container' className='react'>
				<InstallConnectorPrompt showStandalone={true} />
			</div>
		);
	}
}

export {ExtensionsPicker};
