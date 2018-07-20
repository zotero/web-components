/* global CKEDITOR:false */
'use strict';

import {log as logger} from '../../Log.js';
let log = logger.Logger('editable-rich');

import React from 'react';
import PropTypes from 'prop-types';

import EditableBase from '../abstract/editable-base.jsx';
import profileEventSystem from '../profile-event-system.js';
import {PencilIcon, TrashIcon, CheckIcon, XIcon} from '../../Icons.js';
import {Spinner} from '../../LoadingSpinner.js';
import cn from 'classnames';

export default class EditableRich extends EditableBase {
	constructor(props) {
		super(props);
		this.state = {
			value: props.value,
			editing: false,
			processing: false
		};
		this.inputTextarea = React.createRef();
	}

	edit = () => {
		const {id} = this.props;
		this.setState({
			editing: true
		}, () => {
			tinymce.init({
				selector: `#${id}`,
				toolbar: 'undo redo | bold italic underline | alignleft aligncenter alignright | subscript superscript blockquote',
				branding:false,
				menubar:false,
				statusbar:true,
				auto_focus:this.props.id,
				setup:(ed)=>{
					//ed.on('blur', this.blurSave);
				}
			});
		});
	}

	save = async () => {
		let previous = this.state.value;
		let current = previous;

		let {id} = this.props;
		let tinyInstance = tinymce.get(id);
		if(tinyInstance != null) {
			current = tinyInstance.getContent();
			tinyInstance.remove();
		}

		this.setState({
			editing: false,
			processing: true,
		});

		try {
			let response = await this.updateFieldOnServer(this.props.field, current);
			let respData = await response.json();

			this.setState({
				processing: false,
				editing: false,
				value: respData.data[this.props.field]
			});
		} catch (error) {
			profileEventSystem.trigger('alert', {
				level: 'danger',
				message: error.responseJSON.message
			});
			this.setState({
				processing: false,
				editing: false,
				value: previous
			});
		}
	}

	cancel = () => {
		let {id} = this.props;
		let tinyInstance = tinymce.get(id);
		if(tinyInstance != null) {
			tinyInstance.remove();
		}
		this.setState({
			editing: false
		});
	}

	getMarkup = () => {
		return {
			__html: this.state.value || this.props.emptytext
		};
	}

	saveHandler = (ev) => {
		ev.preventDefault();
		this.save();
	}

	cancelHandler = (ev) => {
		ev.preventDefault();
		this.cancel();
	}

	render() {
		const {processing, editing, value} = this.state;
		const {title, id} = this.props;

		let cssClasses = cn('profile-editable-rich', (value ? 'profile-editable-value' : 'profile-editable-emptytext'));

		if(processing) {
			return <div className={ cssClasses }>
				<h2>{ title }</h2>
				<div className="profile-editable-spinner"></div>
			</div>;
		}

		if(editing) {
			return <form className="profile-editable-rich profile-editable-editing" onSubmit={ ev => this.saveHandler(ev) }>
				<h2>{ title }</h2>
				<textarea ref={ this.inputTextarea } id={id} defaultValue={ value } />
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
				<h2>{ title }</h2>
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