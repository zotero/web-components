'use strict';

import {log as logger} from '../../Log.js';
let log = logger.Logger('editable-interest-item');

import React from 'react';
import PropTypes from 'prop-types';

import EditableBase from '../abstract/editable-base.jsx';
import profileEventSystem from '../profile-event-system.js';
import EditableField from './editable-field.jsx';
import {PencilIcon, TrashIcon, CheckIcon, XIcon} from '../../Icons.js';
import {Row, Col, Form, Input, Button} from 'reactstrap';
import cn from 'classnames';

class EditableInterests extends EditableBase {
	constructor(props) {
		log.debug(props);
		super(props);
		this.state = {
			interests:JSON.parse(props.interests),
			addValue:'',
			editing:false,
		};
		this.state.counter = this.state.interests.length;
	}

	edit = () => {
		const {interests} = this.state;
		this.setState({
			editing:true,
			previous: interests.slice(0)
		});
	}

	add = (evt) => {
		evt.preventDefault();
		let {interests, addValue, counter} = this.state;
		interests.push({interest:addValue, index:counter++});
		this.setState({interests, addValue:'', counter});
	}

	remove = (index) => {
		let {interests} = this.state;
		interests.splice(index, 1);
		this.setState({interests});
	}

	save = async () => {
		const {interests} = this.state;

		this.setState({
			processing: true,
		});

		try {
			let response = await this.updateFieldOnServer('interests', JSON.stringify(interests));
			let respdata = await response.json();
			this.setState({
				processing: false,
				editing: false,
				interests: JSON.parse(respdata.data['interests']),
				previous:interests.slice(0)
			});
		} catch (error) {
			log.error(error);
			profileEventSystem.trigger('alert', {
				level: 'danger',
				message: error.responseJSON ? error.responseJSON.message : 'Failed to update items editable'
			});
			this.setState({
				processing: false,
				editing: true,
			});
		}
	}

	cancel = () => {
		const {previous} = this.state;
		this.setState({
			interests:previous,
			editing:false,
			processing:false
		});
	}

	handleInputChange = (evt) => {
		this.setState({addValue:evt.target.value});
	}

	handleKeyboard = () => {

	}

	handleBlur = () => {

	}

	render() {
		const {editable, title, emptyText} = this.props;
		const {interests, editing, addValue} = this.state;
		let cssClasses = cn({
			'editable-interests':true,
			'editable': editable,
			'hide-empty':true,
			'empty': (interests.length > 0)
		});
		log.debug(this.state);

		let editNode = editable ? <Button outline size='sm' color='secondary' onClick={this.edit} className='ml-2' ><PencilIcon /></Button> : null;

		if(editing) {
			return (
				<div className={cssClasses}>
					<h2>{title}</h2>
					<Row>
						<Col>
							<Form inline onSubmit={this.add}>
								<Input
									type='text'
									onKeyUp={this.handleKeyboard}
									onBlur={this.handleBlur}
									onChange={this.handleInputChange}
									value={addValue}
								/>{' '}
								<Button outline color='secondary' onClick={this.addInterest} className='ml-2'>Add</Button>{' '}
								<Button outline color='secondary' onClick={this.cancel} className='ml-2'>Cancel</Button>{' '}
								<Button outline color='secondary' onClick={this.save} className='ml-2'>Save</Button>{' '}
							</Form>
						</Col>
					</Row>
					<Row>
						{interests.map((interest, index) => {
							let removeNode = editable ? <XIcon className='pointer' onClick={()=>{this.remove(index);}} /> : null;
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
			if(interests.length == 0){
				if(editable){
					return (
						<div className={cssClasses}>
							<h2>{title}</h2> {editNode}
							<p>{emptyText}</p>
						</div>
					)
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
}

EditableInterests.defaultProps = {
	interests: '[]',
	title:'Research Interests',
	emptyText:'Add your research interests to show what you are passionate about'
};

class EditableInterestItem extends EditableField {
	constructor(props) {
		super(props);
		this.state = {
			interest: props.value.interest,
			editing: false
		};
	}

	save = () => {
		var updatedItem = {
			interest: this.input.value,
			id: this.props.value.id
		};

		this.cancelPending();
	
		this.setState(Object.assign({}, updatedItem, {
			editing: false
		}), () => {
			this.props.onUpdate(updatedItem);
		});
	}
	
	remove = () => {
		this.cancelPending();
		this.props.onDelete(this.props.value.id);
	}

	render() {
		if(this.state.editing) {
			return <Form inline className="profile-editable-interest profile-editable-editing" onSubmit={this.saveHandler}>
				<Input
					ref={ ref => this.input = ref } defaultValue={ this.state.interest }
					onKeyUp={this.keyboardHandler}
					onBlur={this.blurHandler}
				/>
				<div className="profile-editable-actions">
					<a className="profile-editable-action" onClick={this.saveHandler}>
						<CheckIcon />
					</a>
					<a className="profile-editable-action" onClick={this.remove}>
						<TrashIcon />
					</a>
					<a className="profile-editable-action" onClick={this.cancelHandler}>
						<XIcon />
					</a>
				</div>
			</Form>;
		} else {
			return <div className={`profile-editable-interest profile-editable-${this.state.value ? 'value' : 'emptytext'}`}>
				<span>{this.state.interest || this.props.emptytext}</span>
				<a className="profile-editable-action" onClick={this.edit}>
					<PencilIcon />
				</a>
			</div>;
		}	
	}

	static get defaultProps() {
		return {
			value: {}
		};
	}
}


EditableInterestItem.propTypes = {
	value: PropTypes.object,
	onUpdate: PropTypes.func,
	onDelete: PropTypes.func,
	emptytext: PropTypes.string
};

export {EditableInterests};