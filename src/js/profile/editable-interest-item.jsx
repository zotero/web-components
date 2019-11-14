// import {log as logger} from '../Log.js';
// let log = logger.Logger('editable-interest-item');

import { useState } from 'react';
import PropTypes from 'prop-types';

import { PencilIcon, XIcon } from '../Icons.js';
import { Row, Col, Form, Input, Button } from 'reactstrap';
import cn from 'classnames';

function EditableInterests(props) {
	const { field, saveField, editable, title, emptyText } = props;
	const [value, setValue] = useState(JSON.parse(props.value));
	const [editing, setEditing] = useState(false);
	// const [counter, setCounter] = useState(props.value.length);
	const [addValue, setAddValue] = useState('');

	const handleInputChange = (evt) => {
		setAddValue(evt.target.value);
	};

	const handleKeyboard = () => {};

	const handleBlur = () => {};

	const addInterest = (evt) => {
		evt.preventDefault();

		if (addValue == '') {
			return;
		}
		// skip if dupe
		let dupe = false;
		value.forEach((entry) => {
			if (entry.interest == addValue) {
				dupe = true;
			}
		});
		if (dupe) {
			setAddValue('');
			return;
		}

		let entry = {
			interest: addValue
		};
		let newValue = value.slice(0);
		newValue.push(entry);
		setAddValue('');
		setValue(newValue);
	};

	const remove = (index) => {
		let newValue = value.slice(0);
		newValue.splice(index, 1);
		setValue(newValue);
	};

	const edit = () => {
		setEditing(true);
	};

	const save = async () => {
		await saveField(field, JSON.stringify(value));
		setEditing(false);
	};

	const cancel = async () => {
		setEditing(false);
		setValue(JSON.parse(props.value));
	};

	const interests = value;
	let cssClasses = cn({
		'editable-interests': true,
		editable: editable,
		'hide-empty': true,
		empty: (interests.length > 0)
	});

	let editNode = editable ? <Button outline size='sm' color='secondary' onClick={edit} className='ml-2' ><PencilIcon /></Button> : null;

	if (editing) {
		return (
			<div className={cssClasses}>
				<h2>{title}</h2>
				<Row>
					<Col>
						<Form inline onSubmit={addInterest}>
							<Input
								type='text'
								onKeyUp={handleKeyboard}
								onBlur={handleBlur}
								onChange={handleInputChange}
								value={addValue}
							/>{' '}
							<Button outline color='secondary' onClick={addInterest} className='ml-2'>Add</Button>{' '}
							<Button outline color='secondary' onClick={cancel} className='ml-2'>Cancel</Button>{' '}
							<Button outline color='secondary' onClick={save} className='ml-2'>Save</Button>{' '}
						</Form>
					</Col>
				</Row>
				<Row>
					{interests.map((interest, index) => {
						let removeNode = editable ? <XIcon className='pointer' onClick={() => { remove(index); }} /> : null;
						return (
							<div key={interest.interest} className='profile-interest float-left p-2 m-2 border'>
								{interest.interest}{' '}
								{removeNode}
							</div>
						);
					})}
				</Row>
			</div>
		);
	} else {
		if (interests.length == 0) {
			if (editable) {
				return (
					<div className={cssClasses}>
						<h2>{title}</h2> {editNode}
						<p>{emptyText}</p>
					</div>
				);
			} else {
				return null;
			}
		}
		return (
			<div className={cssClasses}>
				<h2>{title}</h2> {editNode}
				<Row>
					{interests.map((interest) => {
						return (
							<div key={interest.interest} className='profile-interest float-left p-2 m-2 border'>
								{interest.interest}
							</div>
						);
					})}
				</Row>
			</div>
		);
	}
}

EditableInterests.defaultProps = {
	value: '[]',
	title: 'Research Interests',
	emptyText: 'Add your research interests to show what you are passionate about'
};

EditableInterests.propTypes = {
	value: PropTypes.string,
	field: PropTypes.string.isRequired,
	editable: PropTypes.bool.isRequired,
	template: PropTypes.object.isRequired
};

export { EditableInterests };
