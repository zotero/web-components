'use strict';

//import {log as logger} from './Log.js';
//var log = logger.Logger('MakeEditable');

const React = require('react');
const {Component} = React;

class MakeEditable extends Component {
	constructor(props){
		super(props);
		this.makeEditable = this.makeEditable.bind(this);
	}
	makeEditable(){
		let el;
		if(this.props.target){
			el = document.querySelector(this.props.target);
		} else {
			el = document;
		}
		el.contentEditable = true;
		//highlight if not the entire document
		if(this.props.target){
			let range = document.createRange();
			range.selectNode(el);
			let sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		}
	}
	render(){
		return (
			<button onClick={this.makeEditable}>Edit</button>
		);
	}
}

MakeEditable.defaultProps = {
	target: false
};

export {MakeEditable};
