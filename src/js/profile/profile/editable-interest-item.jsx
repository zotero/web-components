'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import EditableField from './editable-field.jsx';
import {PencilIcon, TrashIcon, CheckIcon, XIcon} from '../../Icons.js';
import {Form, Input, Button} from 'reactstrap';

export default class EditableInterestItem extends EditableField {
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