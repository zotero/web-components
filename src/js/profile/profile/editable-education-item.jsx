 'use strict';
 
 import React from 'react';

 import EditableTimelineItem from '../abstract/editable-timeline-item.jsx';
 import {PencilIcon, TrashIcon, CheckIcon, XIcon, PlusIcon} from '../../Icons.js';

 export default class EditableEducationItem extends EditableTimelineItem {
	render() {
		if(this.state.editing) {
			return <form className="profile-timeline-form-wrapper" onSubmit={this.save}>
				<div className='form-row'>
					<div className='col'>
						<select className="form-control" onChange={() => {this.update();}} ref={(c) => this.startMonthInput = c} defaultValue={this.state.start_month}>
							{this.constructor.MONTHS.map(month => <option value={month} key={month}>{month}</option>)}
						</select>
					</div>
					<div className='col'>
						<input className="form-control" onChange={() => {this.update();}} ref={(c) => this.startYearInput = c} defaultValue={this.state.start_year} placeholder="Start year" type="number" />
					</div>
					<div className='col'>
						<input className="form-control" onChange={() => {this.update();}} ref={(c) => this.degreeNameInput = c} defaultValue={this.state.degree_name} placeholder="Degree name" />
					</div>
				</div>
				<div className='form-row'>
					<div className='col'>
						<select className="form-control" onChange={() => {this.update();}} ref={(c) => this.endMonthInput = c} defaultValue={this.state.end_month} disabled={this.state.present}>
							{this.constructor.MONTHS.map(month => <option value={month} key={month}>{month}</option>)}
						</select>
					</div>
					<div className='col'>
						<input className="form-control" onChange={() => {this.update();}} ref={(c) => this.endYearInput = c} defaultValue={this.state.end_year} placeholder="End year" disabled={this.state.present} type="number" />
					</div>
					<div className='col'>
						<input className="form-control" onChange={() => {this.update();}} ref={(c) => this.institutionInput = c} defaultValue={this.state.institution} placeholder="Name of your institution" />
					</div>
				</div>
				<div className='form-row'>
					<div className='col'>
						<div className="form-check">
							<label >
								<input
									ref={(c) => this.presentInput = c}
									className='form-check-input'
									type="checkbox"
									onClick={() => {this.update();}}
									value={ this.state.present } />
								&nbsp;Current
							</label>
						</div>
					</div>
				</div>
				<div className="profile-timeline-form-actions form-row">
					<a className="profile-editable-action" onClick={ () => { this.save(); }}>
						<CheckIcon />
					</a>
					<a className="profile-editable-action" onClick={ () => { this.remove(); }}>
						<TrashIcon />
					</a>
					<a className="profile-editable-action" onClick={ () => { this.cancel(); }}>
						<XIcon />
					</a>
				</div>
			</form>;
		} else {
			return <div className="profile-timeline-wrapper">
				<div>
					{this.state.start_month && this.state.start_month.slice(0, 3) + ' '}
					{this.state.start_year}
					&nbsp;&ndash;&nbsp;
					{this.state.present ? 'present' : this.state.end_month && this.state.end_month.slice(0, 3) + ' ' + this.state.end_year }
					<br />
					{this.getDuration()}
				</div>
				<div className="profile-timeline">
					<div className="profile-timeline-point" />
					{this.state.institution}<br />
					{this.state.degree_name}
				</div>
				<div>
					<a className="profile-editable-action" onClick={() => { this.edit(); }}>
						<PencilIcon />
					</a>
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