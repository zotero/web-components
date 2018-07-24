'use strict';
 
import React from 'react';

import EditableTimelineItem from '../abstract/editable-timeline-item.jsx';
import {PencilIcon, TrashIcon, CheckIcon, XIcon, PlusIcon} from '../../Icons.js';
import {Form, FormGroup, Col, CustomInput, Input, Label, Button} from 'reactstrap';

export default class EditableEducationItem extends EditableTimelineItem {
	render() {
		const {editable} = this.props;
		const {editing, start_month, start_year, degree_name, end_month, end_year, present, institution} = this.state;
		if(editing) {
			return <Form className="profile-timeline-form-wrapper" onSubmit={this.save}>
				<FormGroup row>
					<Col>
						<CustomInput type='select' id='start_month' name='start_month' onChange={this.updateEvt} defaultValue={start_month} >
							{this.constructor.MONTHS.map(month => <option value={month} key={month}>{month}</option>)}
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
							{this.constructor.MONTHS.map(month => <option value={month} key={month}>{month}</option>)}
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
					{this.getDuration()}
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

	static get EDITABLE_PROPERTIES() {
		return {
			start_month: 'January',
			start_year: '',
			degree_name: '',
			end_month: 'January',
			end_year: '',
			institution: '',
			present: false
		};
	}
}