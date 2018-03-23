/* global CKEDITOR:false */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import EditableBase from '../abstract/editable-base.jsx';
import profileEventSystem from '../profile-event-system.js';
import {PencilIcon, TrashIcon, CheckIcon, XIcon} from '../../Icons.js';

export default class EditableRich extends EditableBase {
	constructor(props) {
		super(props);
		this.state = {
			value: props.value,
			editing: false,
			processing: false
		};
	}

	edit() {
		this.setState({
			editing: true
		}, () => {
			this.editor = CKEDITOR.replace(this.input, this.constructor.CKEDITOR_CONFIG);
		});
	}

	save() {
		var previous = this.state.value,
			current = this.editor.getData(),
			promise = this.updateFieldOnServer(this.props.field, current);

		this.editor.destroy();

		this.setState({
			editing: false,
			processing: true,
			value: ''
		});

		promise.done(response => {
			this.setState({
				processing: false,
				editing: false,
				value: response.data[this.props.field]
			});
		});

		promise.fail(error => {
			profileEventSystem.trigger('alert', {
				level: 'danger',
				message: error.responseJSON ? error.responseJSON.message : 'Failed to update items editableRich'
			});
			this.setState({
				processing: false,
				editing: false,
				value: previous
			});
		});
	}

	cancel() {
		this.editor.destroy();
		this.setState({
			editing: false
		});
	}

	getMarkup() {
		return {
			__html: this.state.value || this.props.emptytext
		};
	}

	saveHandler(ev) {
		ev.preventDefault();
		this.save();
	}

	cancelHandler(ev) {
		ev.preventDefault();
		this.cancel();
	}

	render() {
		var cssClasses = 'profile-editable-rich ' + (this.state.value ? 'profile-editable-value' : 'profile-editable-emptytext');

		if(this.state.processing) {
			return <div className={ cssClasses }>
				<h2>{ this.props.title }</h2>
				<div className="profile-editable-spinner"></div>
			</div>;
		}

		if(this.state.editing) {
			return <form className="profile-editable-rich profile-editable-editing" onSubmit={ ev => this.saveHandler(ev) }>
				<h2>{ this.props.title }</h2>
				<textarea ref={ c => this.input = c } defaultValue={ this.state.value } />
				<div className="profile-timeline-form-actions">
					<a className="profile-editable-action" onClick={ ev => this.saveHandler(ev) }>
						<CheckIcon />
					</a>
					<a className="profile-editable-action" onClick={ ev => this.cancelHandler(ev) }>
						<XIcon />
					</a>
				</div>
			</form>;
		} else {
			return <div className={ cssClasses }>
				<h2>{ this.props.title }</h2>
				<a className="profile-editable-action" onClick={ () => this.edit() }>
					<PencilIcon />
				</a>
				<span dangerouslySetInnerHTML={ this.getMarkup() }></span>
			</div>;
		}	
	}

	static get CKEDITOR_CONFIG() {
		return {
			customConfig: '',
			toolbar: [
				{
					name: 'basicstyles',
					items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat']
				},
				{
					name: 'paragraph',
					items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote' ]
				},
				{
					name: 'format',
					items: [ 'Format' ]
				},
				{
					name: 'document',
					items: [ 'Maximize', '-', 'Source' ]
				}
			]
		};
	}
}


EditableRich.propTypes = {
	title: PropTypes.string,
	field: PropTypes.string,
	emptytext: PropTypes.string,
	value: PropTypes.string
};