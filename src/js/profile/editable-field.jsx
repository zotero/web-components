'use strict';

import {log as logger} from '../Log.js';
let log = logger.Logger('editable-field');

import React from 'react';
import PropTypes from 'prop-types';

import {eventSystem} from '../EventSystem.js';
import { PencilIcon, XIcon, CheckIcon } from '../Icons';
import {Spinner} from '../LoadingSpinner.js';
import {Form, Input, Button} from 'reactstrap';
import cn from 'classnames';

class EditableField extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value: this.props.value,
			editing: false,
			processing: false
		};
	}
	componentDidUpdate(prevProps) {
		if(this.props.value != prevProps.value){
			this.setState({value:this.props.value});
		}
	}

	focus = () => {
		this.edit();
	}

	edit = () => {
		this.setState({
			editing: true
		});
	}

	save = async () => {
		const {value} = this.state;

		this.setState({
			processing: true,
			editing: true,
		});
		this.cancelPending();

		await this.props.saveField(this.props.field, value);
		this.setState({
			processing: false,
			editing: false,
		});
	}

	cancel = () => {
		this.cancelPending();
		this.setState({
			value:this.props.value,
			editing: false
		});
	}

	cancelPending = () => {
		clearTimeout(this.pending);
	}

	cancelHandler = (ev) => {
		ev.preventDefault();
		return this.cancel();
	}

	saveHandler = (ev) => {
		ev && ev.preventDefault();
		return this.save();
	}

	changeHandler = (evt) => {
		this.setState({value:evt.target.value});
	}

	keyboardHandler = (ev) => {
		if(ev.keyCode == 27) {
			this.cancelPending();
			ev.preventDefault();
			this.cancel();
		}
	}

	blurHandler = () => {
		this.pending = setTimeout(this.save, 100);
	}

	render() {
		const {editing, processing, value} = this.state;
		const {type, emptytext, editable} = this.props;
		let actions;

		if(editing) {
			if(processing) {
				actions = <Spinner />;
			} else {
				actions = <div className="profile-editable-actions ml-2">
					<Button outline size='sm' color='secondary' onClick={this.saveHandler} >Save</Button>{' '}
					<Button outline size='sm' color='secondary' onClick={this.cancelHandler} >Cancel</Button>
				</div>;
			}
			return <Form inline={type == 'text'} className="profile-editable-field profile-editable-editing" onSubmit={this.saveHandler}>
				<Input
					type={type}
					disabled={processing ? 'disabled' : null }
					defaultValue={value}
					onKeyUp={ this.keyboardHandler }
					onChange={this.changeHandler}
					//onBlur={ this.blurHandler }
					autoFocus={true}
				/>
				{actions}
			</Form>;
		} else {
			return <div className={cn('profile-editable-field', (value ? 'profile-editable-value' : 'profile-editable-emptytext'))}>
				<span>{value || emptytext}</span>
				{editable ? <a className="profile-editable-action" onClick={ this.edit }>
						<PencilIcon />
					</a> : null}
			</div>;
		}
	}
}


EditableField.propTypes = {
	type: PropTypes.string,
	value: PropTypes.string,
	field: PropTypes.string,
	emptytext: PropTypes.string
};

EditableField.defaultProps = {
	type:'text'
};

export {EditableField};