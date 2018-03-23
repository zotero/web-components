'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import EditableBase from '../abstract/editable-base.jsx';
import profileEventSystem from '../profile-event-system.js';
import {PencilIcon, TrashIcon, CheckIcon, XIcon, PlusIcon} from '../../Icons.js';

export default class EditableItems extends EditableBase {
	constructor(props) {
		super(props);
		this.state = {
			counter: props.value && props.value.length + 1 || 1,
			value: props.value && JSON.parse(props.value) || [],
			editing: false,
			processing: false
		};
	}

	componentWillMount() {
		this.editableItems = {};
	}

	add() {
		var newItemsId = this.state.counter++;
		
		this.state.value.push({
			id: newItemsId
		});

		this.setState({
			value: this.state.value
		}, () => {
			if(this.editableItems[newItemsId].focus) {
				this.editableItems[newItemsId].focus();
			}
		});
	}

	update(updatedItem) {
		var previous = this.state.value.slice(0),
			itemIndex = this.state.value.findIndex(item => item.id === updatedItem.id);
		
		this.state.value[itemIndex] = updatedItem;
		this.setState({
			value: this.state.value
		}, () => {
			if(!this.props.uniform) {
				this.save(previous);
			}	
		});
	}

	save(previous) {
		var promise = this.updateFieldOnServer(this.props.field, JSON.stringify(this.state.value));
		
		previous = previous || this.state.previous;

		this.setState({
			editing: true,
			processing: true,
			value: []
		});

		promise.done(response => {
			this.setState({
				processing: false,
				editing: false,
				value: JSON.parse(response.data[this.props.field])
			});			
		});

		promise.fail(error => {
			profileEventSystem.trigger('alert', {
				level: 'danger',
				message: error.responseJSON ? error.responseJSON.message : 'Failed to update items editable'
			});
			this.setState({
				processing: false,
				editing: false,
				value: previous
			});
		});
	}

	cancel() {
		this.setState({
			editing: false,
			processing: false,
			value: this.state.previous.slice(0)
		});
	}
	
	delete(deletedItemId) {
		var itemIndex = this.state.value.findIndex(item => item.id === deletedItemId);

		this.state.value.splice(itemIndex, 1);
		this.setState({
			value: this.state.value
		});

		this.updateFieldOnServer(this.props.field, JSON.stringify(this.state.value));
	}
	
	edit() {
		this.setState({
			editing: true,
			previous: this.state.value.slice(0)
		});
	}
	
	render() {
		var edit,
			add,
			title = this.props.title && <h2>{this.props.title}</h2> || '',
			cssClasses = 'profile-editable-items profile-editable-editing ' + (this.state.value.length ? '' : 'profile-editable-items-empty');

		this.editableItems = {};

		if(typeof this.props.children === 'undefined') {
			return null;
		}

		if(this.state.processing) {
			return <div className={cssClasses}>
				{title}
				<div className="profile-editable-spinner"></div>
			</div>;
		}

		if(this.props.uniform && this.state.editing) {
			edit = <div className="profile-editable-actions profile-social-form-actions">
				<a className="profile-editable-action" onClick={ () => this.add() }>
					<PlusIcon />
				</a>
				<a className="profile-editable-action" onClick={ () => this.cancel() }>
					<XIcon />
				</a>
				<a className="profile-editable-action" onClick={ () => this.save() } >
					<CheckIcon />
				</a>
			</div>;
		}

		if(this.props.uniform && !this.state.editing) {
			edit = <a className="profile-editable-action" onClick={ () => this.edit() }>
				<PencilIcon />
			</a>;
		}

		if(!this.props.uniform) {
			add = <a className="profile-editable-action" onClick={ () => this.add() }>
				<PlusIcon />
			</a>;
		}

		return <div className={cssClasses}>
			{title} {add}
			<div>
				{this.state.value.map(item => {
					return React.cloneElement(this.props.children, {
						value: item,
						key: item.id,
						editing: this.state.editing,
						onUpdate: this.update.bind(this),
						onDelete: this.delete.bind(this),
						ref: ref => { this.editableItems[item.id] = ref; }
					});
				})}
				{edit}
			</div>
		</div>;
	}
}

EditableItems.propTypes = {
	title: PropTypes.string,
	field: PropTypes.string,
	emptytext: PropTypes.string,
	value: PropTypes.string
};