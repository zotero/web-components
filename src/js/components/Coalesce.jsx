'use strict';

//import {log as logger} from '../Log.js';
//let log = logger.Logger('Coalesce');

const React = require('react');
const {Component} = React;

class Coalesce extends Component{
	constructor(props){
		super(props);
	}
	render(){
		let found = false;
		let processedChildren = React.Children.map(this.props.children, (child) => {
			if(found){
				return null;
			}
			if(child != null){
				found = true;
				return child;
			}
		});
		return processedChildren;
	}
}

export {Coalesce};