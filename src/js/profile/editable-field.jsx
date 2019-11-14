// import {log as logger} from '../Log.js';
// let log = logger.Logger('editable-field');

import { useState } from 'react';
import PropTypes from 'prop-types';

import { PencilIcon } from '../Icons';
import { Spinner } from '../LoadingSpinner.js';
import { Form, Input, Button } from 'reactstrap';
import cn from 'classnames';

function EditableField(props) {
	const { field, saveField, type, emptytext, editable } = props;

	const [value, setValue] = useState(props.value);
	const [editing, setEditing] = useState(false);
	const [processing, setProcessing] = useState(false);
	const [pending, setPending] = useState(null);

	// componentDidUpdate(prevProps) {
	// 	if (this.props.value != prevProps.value) {
	// 		this.setState({ value: this.props.value });
	// 	}
	// }

	// const focus = () => {
	// 	edit();
	// };

	const edit = () => {
		setEditing(true);
	};

	const save = async () => {
		setProcessing(true);
		setEditing(true);

		cancelPending();

		await saveField(field, value);
		setProcessing(false);
		setEditing(false);
	};

	const cancel = () => {
		cancelPending();
		setValue(props.value);
		setEditing(false);
	};

	const cancelPending = () => {
		clearTimeout(pending);
	};

	const cancelHandler = (ev) => {
		ev.preventDefault();
		return cancel();
	};

	const saveHandler = (ev) => {
		ev && ev.preventDefault();
		return save();
	};

	const changeHandler = (evt) => {
		setValue(evt.target.value);
	};

	const keyboardHandler = (ev) => {
		if (ev.keyCode == 27) {
			cancelPending();
			ev.preventDefault();
			cancel();
		}
	};

	// const blurHandler = () => {
	// 	let tm = setTimeout(save, 100);
	// 	setPending(tm);
	// };

	let actions;

	if (editing) {
		if (processing) {
			actions = <div className='profile-editable-actions ml-2'><Spinner /></div>;
		} else {
			actions = <div className='profile-editable-actions ml-2'>
				<Button outline size='sm' color='secondary' onClick={saveHandler} >Save</Button>{' '}
				<Button outline size='sm' color='secondary' onClick={cancelHandler} >Cancel</Button>
			</div>;
		}
		return <Form inline={type == 'text'} className='profile-editable-field profile-editable-editing' onSubmit={saveHandler}>
			<Input
				type={type}
				disabled={processing ? 'disabled' : null }
				defaultValue={value}
				onKeyUp={ keyboardHandler }
				onChange={changeHandler}
				// onBlur={ blurHandler }
				autoFocus={true}
			/>
			{actions}
		</Form>;
	} else {
		return <div className={cn('profile-editable-field', (value ? 'profile-editable-value' : 'profile-editable-emptytext'))}>
			<span>{value || emptytext}</span>
			{ editable
				? <a className='profile-editable-action' onClick={ edit }><PencilIcon /></a>
				: null
			}
		</div>;
	}
}


EditableField.propTypes = {
	type: PropTypes.string,
	value: PropTypes.string,
	field: PropTypes.string,
	emptytext: PropTypes.string
};

EditableField.defaultProps = {
	type: 'text'
};

export { EditableField };
