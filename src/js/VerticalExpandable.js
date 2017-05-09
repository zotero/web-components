'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('VerticalExpandable');

var React = require('react');

class VerticalExpandable extends React.Component{
	render() {
		let className = 'vertical-expandable';
		if(this.props.expand){
			className += ' expand';
		}
		return (
			<div className={className}>
				{this.props.children}
			</div>
		);
	}
}
VerticalExpandable.defaultProps = {
	expanded:false
};

export {VerticalExpandable};
