'use strict';

import {log as logger} from '../../Log.js';
let log = logger.Logger('editable-experience-item');

import React from 'react';

import {PencilIcon} from '../../Icons.js';
import {Button, Form, FormGroup, Col, CustomInput, Input, Label} from 'reactstrap';

let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class EditableExperienceItem  extends React.Component {
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
		const {start_month, start_year, position_name, end_month, end_year, present, institution} = value;
		
		let edit = editable ? <Button outline size='sm' onClick={this.edit} ><PencilIcon /></Button> : null;

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
						<Input id='position_name' name='position_name' onChange={this.updateEvt} defaultValue={position_name} placeholder='Position name' />
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
							{months.map(month => <option  value={month} key={month}>{month}</option>)}
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
									onClick={this.updateEvt}
									value={present}
								/>
								&nbsp;I currently work here
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
					{position_name}
				</div>
				<div>
					{edit}
				</div>
			</div>;
		}
	}
}

EditableExperienceItem.defaultProps = {
	value: {
		start_month: 'January',
		start_year: '',
		position_name: '',
		end_month: 'January',
		end_year: '',
		institution: '',
		present: false
	}
}

export {EditableExperienceItem};