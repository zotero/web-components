'use strict';

//import {log as logger} from './Log.js';
//var log = logger.Logger('Notifier');

const React = require('react');

class Notifier extends React.Component {
	render() {
		if(!this.props.message){
			return null;
		}
		let className = `notifier ${this.props.type}`;
		return (
			<div className={className} role='alert'>{this.props.message}</div>
		);
	}
}

export {Notifier};
