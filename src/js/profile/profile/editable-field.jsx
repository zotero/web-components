'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import EditableBase from '../abstract/editable-base.jsx';
import profileEventSystem from '../profile-event-system.js';
import { PencilIcon, XIcon, CheckIcon } from '../../Icons';
import {Spinner} from '../../LoadingSpinner.js';

export default class EditableField extends EditableBase {
	constructor(props) {
		super(props);
		this.state = {
			value: this.props.value,
			editing: false,
			processing: false
		};
	}

	focus() {
		this.edit();
	}

	edit() {
		this.setState({
			editing: true
		}, () => {
			this.input.focus();
		});
	}

	save() {
		var previous = this.state.value,	
			promise = this.updateFieldOnServer(this.props.field, this.input.value);

		this.cancelPending();

		this.setState({
			processing: true,
			editing: true,
			value: ''
		});

		promise.done(response => {
			this.setState({
				processing: false,
				editing: false,
				value: response.data[this.props.field]
			});			
		});

		promise.fail(error => {
			profileEventSystem.trigger('alert', {
				level: 'danger',
				message: error.responseJSON.message
			});
			this.setState({
				processing: false,
				editing: false,
				value: previous
			});
		});
	}

	cancel() {
		this.cancelPending();
		this.setState({
			editing: false
		});
	}

	cancelPending() {
		clearTimeout(this.pending);
	}

	cancelHandler(ev) {
		ev.preventDefault();
		return this.cancel();
	}

	saveHandler(ev) {
		ev && ev.preventDefault();
		return this.save();
	}

	keyboardHandler(ev) {
		if(ev.keyCode == 27) {
			this.cancelPending();
			ev.preventDefault();
			this.cancel();
		}
	}

	blurHandler() {
		this.pending = setTimeout(this.save.bind(this), 100);
	}

	render() {
		var actions,
			cssClasses = 'profile-editable-field ' + (this.state.value ? 'profile-editable-value' : 'profile-editable-emptytext');

		if(this.state.editing) {
			if(this.state.processing) {
				actions = <Spinner />;
			} else {
				actions = <div className="profile-editable-actions">
					<a className="profile-editable-action" onClick={ev => this.saveHandler(ev) }>
						<CheckIcon />
					</a>
					<a className="profile-editable-action" onClick={ev => this.cancelHandler(ev) }>
						<XIcon />
					</a>
				</div>;
			}
			return <form className="profile-editable-field profile-editable-editing form-inline" onSubmit={ev => { this.saveHandler(ev); }}>
				<input 
					disabled={this.state.processing ? 'disabled' : null }
					className="form-control" ref={(c) => this.input = c}
					defaultValue={this.state.value}
					onKeyUp={ ev => this.keyboardHandler(ev) }
					onBlur={ ev => this.blurHandler(ev) } />
				{actions}
			</form>;
		} else {
			return <div className={cssClasses}>
				<span>{this.state.value || this.props.emptytext}</span>
				<a className="profile-editable-action" onClick={ () => { this.edit(); }}>
					<PencilIcon />
				</a>
			</div>;
		}	
	}
}


EditableField.propTypes = {
	value: PropTypes.string,
	field: PropTypes.string,
	emptytext: PropTypes.string
};