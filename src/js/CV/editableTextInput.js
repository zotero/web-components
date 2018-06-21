'use strict';

import {log as logger} from '../Log.js';
let log = logger.Logger('EditableTextInput');

const React = require('react');
const {Component} = React;
import PropTypes from 'prop-types';
import {Input} from 'reactstrap';

class EditableTextInput extends Component {
	constructor(props) {
		super(props);
		this.state = {
			editing: this.props.editing,
			value:this.props.value
		};
	}
	valueChanged = (evt) => {
		evt.preventDefault();
		this.setState({value:evt.target.value});
	}
	startEdit = () => {
		this.setState({editing:true});
	}
	blurSave = () => {
		log.debug('blurSave');
		this.props.save(this.state.value);
		this.setState({editing:false});
	}
	handleFocus = (evt) => {
		evt.target.select();
	}
	render() {
		if(this.state.editing){
			return (
				<Input 
					className='editable'
					type='text'
					tabIndex='0'
					autoFocus
					onFocus={this.handleFocus}
					onChange={this.valueChanged}
					onBlur={this.blurSave}
					value={this.state.value} 
				/>
			);
		} else {
			return (
				<span className='editable' tabIndex='0' onClick={this.startEdit} onFocus={this.startEdit}>{this.state.value}</span>
			);
		}
	}
}

EditableTextInput.defaultProps = {
	value:'',
	editing:false
};

EditableTextInput.propTypes = {
	//save: PropTypes.func.isRequired,
	value: PropTypes.string,
	editing: PropTypes.bool
};

class EditableRichText extends EditableTextInput {
	startEdit = () =>  {
		//this.setState({editing:true});
		log.debug('startEdit');
		log.debug(this.props);
		
		this.setState({editing:true}, ()=>{
			//window.setTimeout(() => {
				tinymce.init({
					selector: `textarea.rte`,
					toolbar: 'undo redo | bold italic underline | alignleft aligncenter alignright | subscript superscript blockquote',
					branding:false,
					menubar:false,
					statusbar:true,
					auto_focus:this.props.id,
					setup:(ed)=>{
						ed.on('blur', this.blurSave);
					}
				});
				//tinymce.get(this.props.id).focus();
			//}, 1000);
		});
		
	}
	blurSave = (evt) => {
		log.debug('blurSave');
		log.debug(evt);
		let id = evt.target.id;
		let updatedContent = tinymce.get(id).getContent();
		log.debug(updatedContent);
		this.setState({value:updatedContent, editing:false});
		this.props.save(updatedContent);
	}
	render() {
		if(this.state.editing){
			return (
				<div className='cv_rte'>
					<textarea
						id={this.props.id}
						defaultValue={this.state.value}
						className='rte'
					/>
				</div>
			);
		} else {
			return (
				<div id={this.props.id} className='editable' tabIndex='0' onFocus={this.startEdit} onClick={this.startEdit} dangerouslySetInnerHTML={{__html:this.state.value}}></div>
			);
		}
	}
}

export {EditableTextInput, EditableRichText};