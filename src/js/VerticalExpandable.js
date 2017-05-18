'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('VerticalExpandable');

const React = require('react');
const {Component} = React;
import {VelocityComponent} from 'velocity-react';

class VerticalExpandable extends Component{
	render() {
		if(!this.props.expand) {
			return null;
		}
		return (
			<VelocityComponent animation='slideDown' duration={this.props.duration} runOnMount={true}>
				{this.props.children}
			</VelocityComponent>
		);
	}
}
VerticalExpandable.defaultProps = {
	expand:false,
	duration:300
};

export {VerticalExpandable};
