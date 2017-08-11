'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import EditableField from './editable-field.jsx';

export default class EditableInterestItem extends EditableField {
	constructor(props) {
		super(props);
		this.state = {
			interest: props.value.interest,
			editing: false
		};
	}

	save() {
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
	
	remove() {
		this.cancelPending();
		this.props.onDelete(this.props.value.id);
	}

	render() {
		if(this.state.editing) {
			return <form className="profile-editable-interest profile-editable-editing form-inline" onSubmit={ ev => this.saveHandler(ev) }>
				<input 
					className="form-control"
					ref={ ref => this.input = ref } defaultValue={ this.state.interest }
					onKeyUp={ ev => this.keyboardHandler(ev) }
					onBlur={ ev => this.blurHandler(ev) } />
				<div className="profile-editable-actions">
					<a className="profile-editable-action" onClick={ ev => this.saveHandler(ev) }>
						<span className="glyphicon glyphicon-ok"></span>
					</a>
					<a className="profile-editable-action" onClick={ () => this.remove() }>
						<span className="glyphicon glyphicon-trash"></span>
					</a>
					<a className="profile-editable-action" onClick={ ev => this.cancelHandler(ev) }>
						<span className="glyphicon glyphicon-remove"></span>
					</a>
				</div>
			</form>;
		} else {
			return <div className="profile-editable-interest profile-editable-{this.state.value ? 'value' : 'emptytext'}">
				<span>{this.state.interest || this.props.emptytext}</span>
				<a className="profile-editable-action" onClick={ () => this.edit() }>
					<span className="glyphicon glyphicon-pencil"></span>
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