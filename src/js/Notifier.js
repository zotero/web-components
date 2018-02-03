'use strict';

//import {log as logger} from './Log.js';
//var log = logger.Logger('Notifier');

const React = require('react');

class Notifier extends React.Component {
	render() {
		let type = this.props.type;
		if(type == 'error') type = 'danger';
		let className = `alert alert-${type}`;
		return (
			<div className={className} role='alert'>{this.props.message}</div>
		);
	}
}

export {Notifier};
