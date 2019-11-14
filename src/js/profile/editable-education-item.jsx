/* eslint-disable camelcase */

// import {log as logger} from '../Log.js';
// let log = logger.Logger('editable-education-item');

import { useState } from 'react';

import { Form, FormGroup, Row, Col, CustomInput, Input, Label, Button } from 'reactstrap';
import { OrganizationEntry, orcidizeTimelineEntry } from '../components/OrcidProfile.jsx';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function OrcidEditableEducationItem(props) {
	const { editable } = props;
	const [value, setValue] = useState(props.value);
	const [editing, setEditing] = useState(props.editing);

	const updateEvt = (evt) => {
		let newValue = Object.assign({}, value);
		let el = evt.target;
		let name = el.getAttribute('name');
		if (el.type == 'checkbox') {
			newValue[name] = el.checked;
		} else {
			newValue[name] = el.value;
		}
		setValue(newValue);
	};

	const edit = () => {
		setEditing(true);
	};

	const save = () => {
		props.onUpdate(props.index, value);
		setEditing(false);
	};

	const remove = () => {
		props.remove(props.index);
	};

	const cancel = () => {
		setValue(props.value);
		setEditing(false);
	};

	const { city, state, country, department, url, start_month, start_year, degree_name, end_month, end_year, present, institution } = value;
	if (editing) {
		return <Form className='profile-timeline-form-wrapper' onSubmit={save}>
			<FormGroup row>
				<Col>
					<Input id='institution' name='institution' onChange={updateEvt} defaultValue={institution} placeholder='Name of your institution' />
					<Input id='city' name='city' onChange={updateEvt} defaultValue={city} placeholder='City' />
					<Input id='state' name='state' onChange={updateEvt} defaultValue={state} placeholder='State/region' />
					<Input id='country' name='country' onChange={updateEvt} defaultValue={country} placeholder='Country' />
				</Col>
				<Col>
					<Input id='department' name='department' onChange={updateEvt} defaultValue={department} placeholder='Department' />
					<Input id='degree_name' name='degree_name' onChange={updateEvt} defaultValue={degree_name} placeholder='Degree name' />
					<Input id='url' name='url' onChange={updateEvt} defaultValue={url} placeholder='URL' />

					<Row>
						<Col>
							<CustomInput type='select' id='start_month' name='start_month' onChange={updateEvt} defaultValue={start_month} >
								{months.map(month => <option value={month} key={month}>{month}</option>)}
							</CustomInput>
						</Col>
						<Col>
							<Input id='start_year' name='start_year' onChange={updateEvt} defaultValue={start_year} placeholder='Start year' type='number' />
						</Col>
					</Row>
					<Row>
						<Col>
							<CustomInput
								type='select'
								id='end_month'
								name='end_month'
								onChange={updateEvt}
								defaultValue={end_month}
								disabled={present}
							>
								{months.map(month => <option value={month} key={month}>{month}</option>)}
							</CustomInput>
						</Col>
						<Col>
							<Input id='end_year' name='end_year' onChange={updateEvt} defaultValue={end_year} placeholder='End year' type='number' disabled={present} />
						</Col>
					</Row>
					<Row>
						<Col>
							<FormGroup check>
								<Label check>
									<Input type='checkbox'
										name='present'
										onChange={updateEvt}
										checked={present}
									/>
									&nbsp;Current
								</Label>
							</FormGroup>
						</Col>
					</Row>
				</Col>
			</FormGroup>
			<Button outline size='sm' color='secondary' onClick={save} >Save</Button>{' '}
			<Button outline size='sm' color='secondary' onClick={remove} >Remove</Button>{' '}
			<Button outline size='sm' color='secondary' onClick={cancel} >Cancel</Button>{' '}
		</Form>;
	} else {
		let entry = orcidizeTimelineEntry(value);
		return <OrganizationEntry entry={entry} editable={editable} edit={edit} />;
	}
}

OrcidEditableEducationItem.defaultProps = {
	value: {
		institution: '',
		city: '',
		state: '',
		country: '',
		department: '',
		degree_name: '',
		url: '',
		start_month: 'January',
		start_year: '',
		end_month: 'January',
		end_year: '',
		present: false
	}
};

export { OrcidEditableEducationItem };
