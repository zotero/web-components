'use strict';

import {log as logger} from '../../Log.js';
let log = logger.Logger('editable-education-item');

import React from 'react';

import {PencilIcon} from '../../Icons.js';
import {Form, FormGroup, Row, Col, CustomInput, Input, Label, Button} from 'reactstrap';
import {TimeSpan, Organization} from '../../components/OrcidProfile.jsx';

let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
		this.props.onDelete(this.props.index);
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
			return <div className="profile-timeline-wrapper">
				<div>
					{start_month && start_month.slice(0, 3) + ' '}
					{start_year}
					&nbsp;&ndash;&nbsp;
					{present ? 'present' : end_month && end_month.slice(0, 3) + ' ' + end_year }
					<br />
					{//this.getDuration()
					}
				</div>
				<div className="profile-timeline">
					<div className="profile-timeline-point" />
					{institution}<br />
					{degree_name}
				</div>
				<div>
					{editable ? <Button outline size='sm' onClick={this.edit} ><PencilIcon /></Button> : null}
				</div>
			</div>;
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

class OrcidEditableEducationItem extends EditableEducationItem {
	constructor(props){
		super(props)
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
			return (
				<div className='organization-entry profile-timeline-wrapper'>
					<Row>
						<Col xs='4'>
							<TimeSpan startDate={entry['start-date']} endDate={entry['end-date']} />
						</Col>
						<Col xs='4' className='profile-timeline'>
							<div className="profile-timeline-point" />
							<Organization organization={entry.organization} />
							<br />
							{entry['role-title']} ({entry['department-name']})
						</Col>
						<Col xs='1'>
							{editable ? <Button outline size='sm' onClick={this.edit} ><PencilIcon /></Button> : null}
						</Col>
					</Row>
				</div>
			);
		}
	}
}

OrcidEditableEducationItem.defaultProps = {
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

let orcidizeTimelineEntry = function(d){
	return {
		'department-name':d.department,
		organization:{
			address:{
				city:d.city,
				country:d.country,
				region:d.state,
			},
			name:d.institution
		},
		'role-title':d.degree_name,
		'start-date':{
			month:{
				value:d.start_month
			},
			year:{
				value:d.start_year
			}
		},
		'end-date': d.present ? null : {
			month:{
				value:d.end_month
			},
			year:{
				value:d.end_year
			}
		},
	};
}

export {EditableEducationItem, OrcidEditableEducationItem};