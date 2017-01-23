'use strict';

//import {log as logger} from './Log.js';
//var log = logger.Logger('MakeEditable');

const React = require('react');

let MakeEditable = React.createClass({
	getDefaultProps: function(){
		return {
			target: false
		};
	},
	makeEditable: function(){
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
	},
	render: function(){
		return (
			<button onClick={this.makeEditable}>Edit</button>
		);
	}
});

export {MakeEditable};
