'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('VerticalExpandable');

const React = require('react');
const {Component} = React;
import {VelocityComponent} from 'velocity-react';

class VerticalExpandable extends Component{
	render() {
		if(!this.props.expand){
			return (
				<VelocityComponent
					duration={this.props.duration}
					runOnMount={false}>
					<div style={{display:'none'}}>
						{this.props.children}
					</div>
				</VelocityComponent>
			);
		}
		return (
			<VelocityComponent
				animation='slideDown'
				duration={this.props.duration}
				runOnMount={false}>
				<div style={{display:'block'}}>
					{this.props.children}
				</div>
			</VelocityComponent>
		);
	}
}
VerticalExpandable.defaultProps = {
	expand:false,
	duration:300
};

export {VerticalExpandable};
