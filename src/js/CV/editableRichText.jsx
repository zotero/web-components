/* global tinymce */

import { log as logger } from '../Log.js';
let log = logger.Logger('EditableRichText');

import { useState, useEffect, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import PropTypes from 'prop-types';

function EditableRichText(props) {
	const editorRef = useRef(null);
	const { id, save } = props;
	// const [editing, setEditing] = useState(props.editing);
	// const [value, setValue] = useState(props.value);
	const [dirty, setDirty] = useState(false);
	const initialValue = props.value;
	// const editing = true;

	let tinyinit = {
		// selector: `textarea.rte`,
		// inline: true,
		plugins: 'lists advlist autoresize',
		toolbar: 'undo redo | bold italic underline | alignleft aligncenter alignright | subscript superscript blockquote | bullist numlist',
		branding: false,
		menubar: false,
		statusbar: true,
		// min_height: '5rem',
		// eslint-disable-next-line camelcase
		// auto_focus: id,
		// setup: (ed) => {
		// 	ed.on('blur', blurSave);
		// }
	}

	useEffect(() => setDirty(false), [initialValue]);
	
	log.debug('EditableRichText');
	log.debug(`props: ${JSON.stringify(props)}`);
	// log.debug(`editing: ${editing}`);
	const blurSave = () => {
		log.debug('blurSave');
		if (editorRef.current) {
			const content = editorRef.current.getContent();
			setDirty(false);
			editorRef.current.setDirty(false);
			//save
			setValue(content);
			// setEditing(false);
		}
	}
	return (
		<div className='cv_rte editable' >
			<Editor
				init={tinyinit}
				initialValue={initialValue}
				onInit={(evt, editor) => editorRef.current = editor}
				onDirty={() => setDirty(true)}
				// onBlur={blurSave}
			>
			</Editor>
		</div>
	);
}
EditableRichText.propTypes = {
	save: PropTypes.func.isRequired,
	value: PropTypes.string.isRequired,
};

export { EditableRichText };
