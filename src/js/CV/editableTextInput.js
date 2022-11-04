/* global tinymce */

import { log as logger } from '../Log.js';
let log = logger.Logger('EditableTextInput');

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Input } from 'reactstrap';

function EditableTextInput(props) {
	const { placeholder, save } = props;
	const [editing, setEditing] = useState(props.editing);
	const [value, setValue] = useState(props.value);

	const valueChanged = (evt) => {
		evt.preventDefault();
		setValue(evt.target.value);
	};

	const startEdit = () => {
		setEditing(true);
	};

	const blurSave = () => {
		log.debug('blurSave');
		save(value);
		setEditing(false);
	};

	const handleFocus = (evt) => {
		evt.target.select();
	};


	if (editing) {
		return (
			<Input
				className='editable'
				type='text'
				tabIndex='0'
				autoFocus
				onFocus={handleFocus}
				onChange={valueChanged}
				onBlur={blurSave}
				value={value}
			/>
		);
	} else {
		return (
			<span className='editable' tabIndex='0' onClick={startEdit} onFocus={startEdit}>
				{value
					? value
					: <p className='text-muted'>{placeholder}</p>
				}
			</span>
		);
	}
}

EditableTextInput.defaultProps = {
	value: '',
	editing: false
};

EditableTextInput.propTypes = {
	save: PropTypes.func.isRequired,
	value: PropTypes.string,
	editing: PropTypes.bool
};

function EditableRichText(props) {
	const { id, save } = props;
	const [editing, setEditing] = useState(props.editing);
	const [value, setValue] = useState(props.value);

	const blurSave = (evt) => {
		log.debug('blurSave');
		// let id = evt.target.id;
		let content = value;
		let tinyInstance = tinymce.get(id);
		if (tinyInstance !== null) {
			log.debug('removing tinyInstance');
			content = tinyInstance.getContent();
			setValue(content);
			save(content);
			tinyInstance.remove();
			// tinymce.remove('textarea');
		} else {
			log.debug('tinyInstance is null');
		}
		log.debug('setting editing to false');
		setEditing(false);
	};

	const startEdit = () => {
		log.debug('startEdit');
		setEditing(true);
	};

	// initialize tinyMCE on the textarea when editing changes to true
	useEffect(() => {
		log.debug('EditableRichText effect 1 firing');

		log.debug(`editing: ${editing}`);
		if (editing) {
			log.debug('calling tinymce.init');
			tinymce.init({
				selector: `textarea.rte`,
				plugins: 'lists',
				toolbar: 'undo redo | bold italic underline | alignleft aligncenter alignright | subscript superscript blockquote | bullist numlist',
				branding: false,
				menubar: false,
				statusbar: true,
				// eslint-disable-next-line camelcase
				auto_focus: id,
				onBlur: {blurSave},
				// setup: (ed) => {
					// ed.on('blur', blurSave);
				// }
			});
			log.debug('done with init');
		}
		log.debug('exiting effect1');
	}, [editing]);

	if (editing) {
		return (
			<div className='cv_rte'>
				<textarea
					id={id}
					defaultValue={value}
					className='rte'
				/>
				<button onClick={blurSave}>Save</button>
			</div>
		);
	} else {
		return (
			<div
				id={id}
				className='editable'
				tabIndex='0'
				// onFocus={startEdit}
				onClick={startEdit}
				dangerouslySetInnerHTML={value ? { __html: value } : null}>
				{value
					? null
					: <p className='text-muted'>Rich text section</p>
				}
			</div>
		);
	}
}
EditableRichText.propTypes = {
	save: PropTypes.func.isRequired,
	value: PropTypes.string.isRequired,
};

export { EditableTextInput, EditableRichText };
