/* global tinymce */

import { log as logger } from '../Log.js';
let log = logger.Logger('editable-rich');

import { useState, useRef } from 'react';
import PropTypes from 'prop-types';

import { PencilIcon } from '../Icons.js';
import { Spinner } from '../LoadingSpinner.js';
import { Button } from 'reactstrap';
import cn from 'classnames';

function EditableRich(props) {
	const inputTextarea = useRef(null);

	const { id, field, saveField, title, editable } = props;

	const [value, setValue] = useState(props.value);
	const [editing, setEditing] = useState(false);
	const [processing, setProcessing] = useState(false);

	// componentDidUpdate(prevProps) {
	// 	if (this.props.value != prevProps.value) {
	// 		this.setState({ value: this.props.value });
	// 	}
	// }

	const edit = () => {
		setEditing(true);
		
		// init tinymce after state update, may need to do this as a side effect dependent on editing
		tinymce.init({
			selector: `#${id}`,
			toolbar: 'undo redo | bold italic underline | alignleft aligncenter alignright | subscript superscript blockquote',
			branding: false,
			menubar: false,
			statusbar: true,
			auto_focus: this.props.id,

			/*
			setup:(ed)=>{
				//ed.on('blur', this.blurSave);
			}
			*/
		});
	};

	const save = async () => {
		let newValue;
		let tinyInstance = tinymce.get(id);
		if (tinyInstance != null) {
			newValue = tinyInstance.getContent();
			tinyInstance.remove();
		} else {
			log.warn('no tinyMCE instance when saving editable-rich');
		}

		setEditing(false);
		setProcessing(true);

		await saveField(field, value);
		
		setProcessing(false);
	};

	const cancel = () => {
		let tinyInstance = tinymce.get(id);
		if (tinyInstance != null) {
			tinyInstance.remove();
		}
		setEditing(false);
	};

	const getMarkup = () => {
		return {
			__html: value || props.emptytext
		};
	};

	const saveHandler = (ev) => {
		ev.preventDefault();
		save();
	};

	const cancelHandler = (ev) => {
		ev.preventDefault();
		cancel();
	};


	let cssClasses = cn({
		'profile-editable-rich': true,
		'profile-editable-value': (!!value),
		'profile-editable-emptytext': (!value)
	});

	if (processing) {
		return <div className={ cssClasses }>
			<h2>{ title }</h2>
			<Spinner />
		</div>;
	}

	if (editing) {
		return <form className='profile-editable-rich profile-editable-editing' onSubmit={ saveHandler }>
			<h2>{ title }</h2>
			<textarea ref={ inputTextarea } id={id} defaultValue={ value } />
			<div className='profile-timeline-form-actions'>
				<Button outline size='sm' color='secondary' onClick={saveHandler} >Save</Button>{' '}
				<Button outline size='sm' color='secondary' onClick={cancelHandler} >Cancel</Button>
			</div>
		</form>;
	} else {
		return <div className={ cssClasses }>
			<h2>{ title }</h2>
			{editable ? <Button outline size='sm' color='secondary' onClick={edit} className='mb-2 ml-2'><PencilIcon /></Button> : null}
			<span dangerouslySetInnerHTML={ getMarkup() }></span>
		</div>;
	}
}


EditableRich.propTypes = {
	title: PropTypes.string,
	field: PropTypes.string,
	emptytext: PropTypes.string,
	value: PropTypes.string
};

export { EditableRich };
