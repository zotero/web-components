/* eslint-disable camelcase */

// import {log as logger} from '../Log.js';
// const log = logger.Logger('editable-social-item');

import { useState } from 'react';
import PropTypes from 'prop-types';

import { PencilIcon, TrashIcon } from '../Icons.js';
import { Form, CustomInput, Input, Button } from 'reactstrap';


let social_networks = {
	ORCID: {
		iconClass: 'social social-orcid',
		getUrl: (username) => {
			return `http://orcid.org/${username}`;
		}
	},
	'Scopus Author ID': {
		iconClass: 'social social-scopus',
		getUrl: (username) => {
			return `https://www.scopus.com/authid/detail.uri?authorId=${username}`;
		}
	},
	Twitter: {
		iconClass: 'social social-twitter',
		getUrl: (username) => {
			return `https://twitter.com/${username}`;
		}
	},
	Mendeley: {
		iconClass: 'social social-mendeley',
		getUrl: (username) => {
			return `https://www.mendeley.com/profiles/${username}`;
		}
	},
	Facebook: {
		iconClass: 'social social-facebook',
		getUrl: (username) => {
			return `https://www.facebook.com/${username}`;
		}
	}
};

function EditableSocial(props) {
	const { template, field, saveField, editable, emptytext } = props;
	const [value, setValue] = useState(JSON.parse(props.value));
	// const [addValue, setAddValue] = useState('');
	const [editing, setEditing] = useState(false);
	const [counter, setCounter] = useState(props.value.length);

	const edit = () => {
		setEditing(true);
	};

	const addEmpty = () => {
		let addObject;
		if (template === undefined) {
			addObject = { id: counter + 1 };
		} else {
			addObject = Object.assign({}, template, { id: counter + 1 });
		}
		let newValue = value.slice(0);
		newValue.push(addObject);
		setValue(newValue);
		// setAddValue('');
		setCounter(counter + 1);
	};

	const save = async () => {
		await saveField(field, JSON.stringify(value));
		setEditing(false);
	};

	const remove = (index) => {
		let newValue = value.slice(0);
		newValue.splice(index, 1);
		setValue(newValue);
	};

	// const cancel = () => {
	// 	setValue(JSON.parse(props.value));
	// 	setEditing(false);
	// };

	const handleNameChange = (evt) => {
		let index = evt.target.getAttribute('data-index');
		index = parseInt(index);
		let newValue = value.slice(0);
		newValue[index].name = evt.target.value;
		setValue(newValue);
	};

	const handleValueChange = (evt) => {
		let index = evt.target.getAttribute('data-index');
		index = parseInt(index);
		let newValue = value.slice(0);
		newValue[index].value = evt.target.value;
		setValue(newValue);
	};

	// const handleKeyboard = () => {};

	// const handleBlur = () => {};

	let editNode = null;
	if (editable) {
		if (editing) {
			editNode = (
				<>
					<Button outline color='secondary' onClick={save} className='ml-2'>Save</Button>{' '}
					<Button outline color='secondary' onClick={addEmpty}>Add</Button>
				</>
			);
		} else {
			editNode = <PencilIcon onClick={edit} title='Edit' className='pointer' />;
		}
	}

	let socialNodes = value.map((socialEntry, index) => {
		if (editing) {
			return <Form key={socialEntry.id} inline className='profile-editable-social profile-editable-editing mb-2' onSubmit={save}>
				<CustomInput
					type='select'
					id='social-select'
					onChange={handleNameChange }
					defaultValue={ socialEntry.name }
					data-index={index}
					clearable='false'
				>
					{ Object.keys(social_networks).map(network => <option value={ network } key={ network }>{ network }</option>)}
				</CustomInput>{' '}
				<Input
					defaultValue={ socialEntry.value }
					onChange={ handleValueChange }
					data-index={index}
					placeholder={'User name on ' + socialEntry.name}
				/>
				<div className='profile-editable-actions'>
					<a className='profile-editable-action' onClick={() => { remove(index); }}>
						<TrashIcon title='Delete' />
					</a>
				</div>
			</Form>;
		} else {
			var entry = '';
			if (value) {
				entry = <a href={social_networks[socialEntry.name].getUrl(socialEntry.value)}>
					<span className={social_networks[socialEntry.name].iconClass}></span>
				</a>;
			} else {
				entry = emptytext;
			}

			return <div key={socialEntry.id} className={`profile-editable-social profile-editable-${value ? 'value' : 'emptytext'}`}>
				<span>{ entry }</span>
			</div>;
		}
	});

	return (
		<div className='editable-social'>
			{socialNodes}
			{editNode}
		</div>
	);
}

EditableSocial.defaultProps = {
	value: '[]'
};

EditableSocial.propTypes = {
	value: PropTypes.string,
	field: PropTypes.string.isRequired,
	editable: PropTypes.bool.isRequired,
	template: PropTypes.object.isRequired
};

export { EditableSocial };
