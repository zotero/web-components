'use strict';

import {log as logger} from '../../Log.js';
let log = logger.Logger('editable-interest-item');

import React from 'react';
import PropTypes from 'prop-types';

import {PencilIcon, XIcon} from '../../Icons.js';
import {Row, Col, Form, Input, Button} from 'reactstrap';
import cn from 'classnames';

class EditableInterests extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value:JSON.parse(props.value),
			editing:false,
			counter: props.value.length,
			addValue: ''
		};
	}
	handleInputChange = (evt) => {
		this.setState({addValue:evt.target.value});
	}
	handleKeyboard = () => {
	}
	handleBlur = () => {
	}

	addInterest = (evt) => {
		evt.preventDefault();
		let {addValue, value} = this.state;
		let entry = {
			interest: addValue
		};
		value.push(entry);
		this.setState({addValue:'', value});
	}
	remove = (index) => {
		let {value} = this.state;
		value.splice(index, 1);
		this.setState({value});
	}
	edit = () => {
		this.setState({editing:true});
	}
	save = async () => {
		let {value} = this.state;
		await this.props.saveField(this.props.field, JSON.stringify(value));
		this.setState({editing:false});
	}
	render() {
		const {editable, title, emptyText} = this.props;
		const {value, editing, addValue} = this.state;
		const interests = value;
		let cssClasses = cn({
			'editable-interests':true,
			'editable': editable,
			'hide-empty':true,
			'empty': (interests.length > 0)
		});

		let editNode = editable ? <Button outline size='sm' color='secondary' onClick={this.edit} className='ml-2' ><PencilIcon /></Button> : null;

		if(editing) {
			return (
				<div className={cssClasses}>
					<h2>{title}</h2>
					<Row>
						<Col>
							<Form inline onSubmit={this.addInterest}>
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
	value: '[]',
	title:'Research Interests',
	emptyText:'Add your research interests to show what you are passionate about'
};

EditableInterests.propTypes = {
	value: PropTypes.string,
	field: PropTypes.string.isRequired,
	editable: PropTypes.bool.isRequired,
	template: PropTypes.object.isRequired
};

export {EditableInterests};