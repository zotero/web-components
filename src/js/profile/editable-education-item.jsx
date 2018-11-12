'use strict';

// import {log as logger} from '../Log.js';
// let log = logger.Logger('editable-education-item');

import React from 'react';

import {Form, FormGroup, Row, Col, CustomInput, Input, Label, Button} from 'reactstrap';
import {OrganizationEntry, orcidizeTimelineEntry} from '../components/OrcidProfile.jsx';

let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/*
class EditableEducationItem extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value:props.value,
			editing:props.editing
		};
	}
	updateEvt = (evt) => {
		let stateValue = this.state.value;
		let newValue = Object.assign({}, stateValue);
		let el = evt.target;
		let name = el.getAttribute('name');
		if(el.type == 'checkbox'){
			newValue[name] = el.checked;
		} else {
			newValue[name] = el.value;
		}
		this.setState({value:newValue});
	}
	edit = () => {
		this.setState({editing:true});
	}
	save = () => {
		let {value} = this.state;
		this.props.onUpdate(this.props.index, value);
		this.setState({editing:false});
	}
	remove = () => {
		this.props.remove(this.props.index);
	}
	cancel = () => {
		this.setState({
			value:this.props.value,
			editing:false
		});
	}
	render() {
		const {editable} = this.props;
		const {editing, value} = this.state;
		const {start_month, start_year, degree_name, end_month, end_year, present, institution} = value;
		if(editing) {
			return <Form className="profile-timeline-form-wrapper" onSubmit={this.save}>
				<FormGroup row>
					<Col>
						<CustomInput type='select' id='start_month' name='start_month' onChange={this.updateEvt} defaultValue={start_month} >
							{months.map(month => <option value={month} key={month}>{month}</option>)}
						</CustomInput>
					</Col>
					<Col>
						<Input id='start_year' name='start_year' onChange={this.updateEvt} defaultValue={start_year} placeholder='Start year' type='number' />
					</Col>
					<Col>
						<Input id='degree_name' name='degree_name' onChange={this.updateEvt} defaultValue={degree_name} placeholder='Degree name' />
					</Col>
				</FormGroup>
				<FormGroup row>
					<Col>
						<CustomInput
							type='select'
							id='end_month'
							name='end_month'
							onChange={this.updateEvt}
							defaultValue={end_month}
							disabled={present}
							>
							{months.map(month => <option value={month} key={month}>{month}</option>)}
						</CustomInput>
					</Col>
					<Col>
						<Input id='end_year' name='end_year' onChange={this.updateEvt} defaultValue={end_year} placeholder='End year' type='number' disabled={present} />
					</Col>
					<Col>
						<Input id='institution' name='institution' onChange={this.updateEvt} defaultValue={institution} placeholder='Name of your institution' />
					</Col>
				</FormGroup>
				<FormGroup row>
					<Col>
						<FormGroup check>
							<Label check>
								<Input type='checkbox'
									name='present'
									onChange={this.updateEvt}
									checked={present}
								/>
								&nbsp;Current
							</Label>
						</FormGroup>
					</Col>
				</FormGroup>
				<Button outline size='sm' color='secondary' onClick={this.save} >Save</Button>{' '}
				<Button outline size='sm' color='secondary' onClick={this.remove} >Remove</Button>{' '}
				<Button outline size='sm' color='secondary' onClick={this.cancel} >Cancel</Button>{' '}
			</Form>;
		} else {
			let entry = orcidizeTimelineEntry(value);
			return <OrganizationEntry entry={entry} editable={editable} edit={this.edit} />;
		}
	}
}

EditableEducationItem.defaultProps = {
	value: {
		institution: '',
		degree_name: '',
		start_month: 'January',
		start_year: '',
		end_month: 'January',
		end_year: '',
		present: false
	}
};
*/
class OrcidEditableEducationItem extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value:props.value,
			editing:props.editing
		};
	}
	updateEvt = (evt) => {
		let stateValue = this.state.value;
		let newValue = Object.assign({}, stateValue);
		let el = evt.target;
		let name = el.getAttribute('name');
		if(el.type == 'checkbox'){
			newValue[name] = el.checked;
		} else {
			newValue[name] = el.value;
		}
		this.setState({value:newValue});
	}
	edit = () => {
		this.setState({editing:true});
	}
	save = () => {
		let {value} = this.state;
		this.props.onUpdate(this.props.index, value);
		this.setState({editing:false});
	}
	remove = () => {
		this.props.remove(this.props.index);
	}
	cancel = () => {
		this.setState({
			value:this.props.value,
			editing:false
		});
	}
	render() {
		const {editable} = this.props;
		const {editing, value} = this.state;
		const {city, state, country, department, url, start_month, start_year, degree_name, end_month, end_year, present, institution} = value;
		if(editing) {
			return <Form className="profile-timeline-form-wrapper" onSubmit={this.save}>
				<FormGroup row>
					<Col>
						<Input id='institution' name='institution' onChange={this.updateEvt} defaultValue={institution} placeholder='Name of your institution' />
						<Input id='city' name='city' onChange={this.updateEvt} defaultValue={city} placeholder='City' />
						<Input id='state' name='state' onChange={this.updateEvt} defaultValue={state} placeholder='State/region' />
						<Input id='country' name='country' onChange={this.updateEvt} defaultValue={country} placeholder='Country' />
					</Col>
					<Col>
						<Input id='department' name='department' onChange={this.updateEvt} defaultValue={department} placeholder='Department' />
						<Input id='degree_name' name='degree_name' onChange={this.updateEvt} defaultValue={degree_name} placeholder='Degree name' />
						<Input id='url' name='url' onChange={this.updateEvt} defaultValue={url} placeholder='URL' />

						<Row>
							<Col>
								<CustomInput type='select' id='start_month' name='start_month' onChange={this.updateEvt} defaultValue={start_month} >
									{months.map(month => <option value={month} key={month}>{month}</option>)}
								</CustomInput>
							</Col>
							<Col>
								<Input id='start_year' name='start_year' onChange={this.updateEvt} defaultValue={start_year} placeholder='Start year' type='number' />
							</Col>
						</Row>
						<Row>
							<Col>
								<CustomInput
									type='select'
									id='end_month'
									name='end_month'
									onChange={this.updateEvt}
									defaultValue={end_month}
									disabled={present}
									>
									{months.map(month => <option value={month} key={month}>{month}</option>)}
								</CustomInput>
							</Col>
							<Col>
								<Input id='end_year' name='end_year' onChange={this.updateEvt} defaultValue={end_year} placeholder='End year' type='number' disabled={present} />
							</Col>
						</Row>
						<Row>
							<Col>
								<FormGroup check>
									<Label check>
										<Input type='checkbox'
											name='present'
											onChange={this.updateEvt}
											checked={present}
										/>
										&nbsp;Current
									</Label>
								</FormGroup>
							</Col>
						</Row>
					</Col>
				</FormGroup>
				<Button outline size='sm' color='secondary' onClick={this.save} >Save</Button>{' '}
				<Button outline size='sm' color='secondary' onClick={this.remove} >Remove</Button>{' '}
				<Button outline size='sm' color='secondary' onClick={this.cancel} >Cancel</Button>{' '}
			</Form>;
		} else {
			let entry = orcidizeTimelineEntry(value);
			return <OrganizationEntry entry={entry} editable={editable} edit={this.edit} />;
		}
	}
}

OrcidEditableEducationItem.defaultProps = {
	value:{
		institution: '',
		city:'',
		state:'',
		country:'',
		department:'',
		degree_name: '',
		url:'',
		start_month: 'January',
		start_year: '',
		end_month: 'January',
		end_year: '',
		present: false
	}
};

export {OrcidEditableEducationItem};