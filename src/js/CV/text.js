'use strict';

//import {log as logger} from '../Log.js';
//let log = logger.Logger('Text');

const React = require('react');
const {Component} = React;


class TinyEditorComponent extends Component {
	constructor(props) {
		super(props);
		this.state = { editor: null };
	}
	render() {
		return (
			<textarea
				id={this.props.id}
				defaultValue={this.props.content}
				className='rte'
			/>
		);
	}
}


class RTE extends Component {
	constructor(props) {
		super(props);
		this.editorChange = this.editorChange.bind(this);
	}
	editorChange(content){
		this.props.updateEntry(this.props.section.tracking, 'value', content);
	}
	render() {
		return (
			<div className='cv_rte'>
				<TinyEditorComponent 
					id={this.props.id}
					content={this.props.section.value}
					onEditorChange={this.editorChange}
				/>
			</div>
		);
	}
}

export {RTE};
