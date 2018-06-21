'use strict';

//import {log as logger} from '../Log.js';
//let log = logger.Logger('Text');

const React = require('react');
const {Component} = React;
import {EditableRichText} from './editableTextInput.js';

class RTE extends Component {
	constructor(props) {
		super(props);
		this.editorChange = this.editorChange.bind(this);
	}
	editorChange(content){
		this.props.updateEntry(this.props.section.tracking, 'value', content);
	}
	render() {
		return <EditableRichText id={this.props.id} value={this.props.section.value} save={this.editorChange} />;
	}
}

export {RTE};
