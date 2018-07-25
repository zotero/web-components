'use strict';

import {log as logger} from '../../Log.js';
let log = logger.Logger('editable-base');

import React from 'react';
import {postFormData} from '../../ajax.js';
import profileEventSystem from '../profile-event-system.js';

class EditableBase extends React.Component {
	updateFieldOnServer(field, value) {
		var data = {};
		data[field] = value;
		return postFormData(this.constructor.PROFILE_DATA_HANDLER_URL, data, {withSession:true});
	}

	static get PROFILE_DATA_HANDLER_URL() {
		return '/settings/profiledata';
	}
}

class MultipleEditableBase extends EditableBase {
	constructor(props) {
		super(props);
		this.state = {
			value:JSON.parse(props.value),
			//addValue:'',
			editing:false,
		};
		this.state.counter = this.state.value.length;
	}

	edit = () => {
		const {value} = this.state;
		this.setState({
			editing:true,
			previous: value.slice(0)
		});
	}

	add = (evt) => {
		evt.preventDefault();
		let {value, addValue, counter} = this.state;
		value.push({interest:addValue, index:counter++});
		this.setState({value, addValue:'', counter});
	}

	addEmpty = (evt) => {
		evt.preventDefault();
		let {value, counter} = this.state;
		let {template} = this.props;
		let addObject;
		if(template === undefined){
			addObject = {index:counter++};
		} else {
			addObject = Object.assign({}, template, {id:counter++});
		}
		value.push(addObject);
		this.setState({value, addValue:'', counter});
	}

	remove = (index) => {
		let {value} = this.state;
		value.splice(index, 1);
		this.setState({value});
	}

	save = async (evt) => {
		evt.preventDefault();
		const {field} = this.props;
		const {value} = this.state;

		this.setState({
			processing: true,
		});

		try {
			let response = await this.updateFieldOnServer(field, JSON.stringify(value));
			let respdata = await response.json();
			this.setState({
				processing: false,
				editing: false,
				value: JSON.parse(respdata.data[field]),
				previous:value.slice(0)
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
			value:previous,
			editing:false,
			processing:false
		});
	}
}

export {EditableBase, MultipleEditableBase};
