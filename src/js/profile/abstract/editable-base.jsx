'use strict';

import {log as logger} from '../../Log.js';
let log = logger.Logger('editable-base');

import React from 'react';
import {postFormData} from '../../ajax.js';
import {eventSystem} from '../../EventSystem.js';

const PROFILE_DATA_HANDLER_URL = '/settings/profiledata';

class EditableBase extends React.Component {
	updateFieldOnServer(field, value) {
		var data = {};
		data[field] = value;
		return postFormData(PROFILE_DATA_HANDLER_URL, data, {withSession:true});
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

	_edit() {
		const {value} = this.state;
		this.setState({
			editing:true,
			previous: value.slice(0)
		});
	}
	edit = () => {
		return this._edit.apply(this);
	}

	_add(entry) {
		let {value, addValue, counter} = this.state;
		value.push(entry);
		counter++;
		this.setState({value, addValue:'', counter});
	}
	add = (entry) => {
		return this._add.apply(this, [entry]);
	}

	_addEmpty(evt) {
		evt.preventDefault();
		let {value, counter} = this.state;
		let {template} = this.props;
		let addObject;
		if(template === undefined){
			addObject = {id:++counter};
		} else {
			addObject = Object.assign({}, template, {id:++counter});
		}
		value.push(addObject);
		this.setState({value, addValue:'', counter});
	}
	addEmpty = (evt) => {
		return this._addEmpty.apply(this, [evt]);
	}

	_updateEntry(index, entry) {
		if(index === undefined || entry === undefined){
			log.error('Insufficient arguments to _updateEntry');
			throw 'Insufficient arguments to _updateEntry';
		}
		let {value} = this.state;
		let newValue = value.slice(0);
		newValue[index] = entry;
		this.setState({value:newValue}, this.save);
	}
	updateEntry = (index, entry) => {
		return this._updateEntry.apply(this, [index, entry]);
	}

	_remove(index) {
		if(index === undefined){
			log.error('Insufficient arguments to _remove');
			throw 'Insufficient arguments to _remove';
		}
		let {value} = this.state;
		value.splice(index, 1);
		this.setState({value});
	}
	remove = (index) => {
		return this._remove.apply(this, [index]);
	}

	//move entry at oldIndex placing it at newIndex
	_reorder(oldIndex, newIndex) {
		if(oldIndex === undefined || newIndex === undefined){
			log.error('Insufficient arguments to _reorder');
			throw 'Insufficient arguments to _reorder';
		}
		
		let {value} = this.state;
		let newValue = value.slice(0);
		let entry = newValue.splice(oldIndex, 1);
		newValue.splice(newIndex, 0, ...entry);
		this.setState({value:newValue});
	}
	reorder = (oldIndex, newIndex) => {
		return this._reorder.apply(this, [oldIndex, newIndex]);
	}

	async _save(evt) {
		if(evt){
			evt.preventDefault();
		}
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
			eventSystem.trigger('alert', {
				level: 'danger',
				message: error.responseJSON ? error.responseJSON.message : 'Failed to update items editable'
			});
			this.setState({
				processing: false,
				editing: true,
			});
		}
	}
	save = async (evt) => {
		return this._save.apply(this, [evt]);
	}

	_cancel() {
		const {previous} = this.state;
		this.setState({
			value:previous,
			editing:false,
			processing:false
		});
	}
	cancel = () => {
		return this._cancel.apply(this);
	}
}

export {EditableBase, MultipleEditableBase};
