'use strict';

import {log as logger} from '../../Log.js';
let log = logger.Logger('editable-timeline');

import React from 'react';
import PropTypes from 'prop-types';

import {EditableBase} from '../abstract/editable-base.jsx';
import profileEventSystem from '../profile-event-system.js';
import {PencilIcon} from '../../Icons.js';
import {Button} from 'reactstrap';

class EditableTimeline extends EditableBase {
	constructor(props) {
		super(props);
		this.state = {
			counter: props.value && props.value.length + 1 || 1,
			value: props.value && JSON.parse(props.value) || [],
			processing: false,
			editLast: false
		};
	}

	add = () => {
		let {value, counter} = this.state;
		let newItemsId = counter++;
		
		value.push({
			id: newItemsId
		});

		this.setState({value, counter, editLast:true});
	}

	update = (updatedItem) => {
		let {value} = this.state;
		let previous = value.slice(0);
		let itemIndex = value.findIndex(item => item.id === updatedItem.id);
		
		value[itemIndex] = updatedItem;
		this.setState({value}, () => {
			if(!this.props.uniform) {
				this.save(previous);
			}	
		});
	}

	save = async (previous) => {
		const {field} = this.props;
		const {value} = this.state;

		this.setState({
			editing: true,
			processing: true,
			value: []
		});

		try {
			let response = await this.updateFieldOnServer(field, JSON.stringify(value));

			previous = previous || this.state.previous;

			let respdata = await response.json();
			this.setState({
				processing: false,
				editing: false,
				editLast:false,
				value: JSON.parse(respdata.data[this.props.field])
			});
		} catch (error) {
			profileEventSystem.trigger('alert', {
				level: 'danger',
				message: error.responseJSON ? error.responseJSON.message : 'Failed to update items editable'
			});
			this.setState({
				processing: false,
				editing: false,
				editLast:false,
				value: previous
			});
		}
	}

	cancel = () => {
		this.setState({
			editing: false,
			processing: false,
			editLast:false,
			value: this.state.previous.slice(0)
		});
	}
	
	delete = (deletedItemId) => {
		var itemIndex = this.state.value.findIndex(item => item.id === deletedItemId);

		this.state.value.splice(itemIndex, 1);
		this.setState({
			value: this.state.value
		});

		this.updateFieldOnServer(this.props.field, JSON.stringify(this.state.value));
	}
	
	edit = () => {
		this.setState({
			editing: true,
			previous: this.state.value.slice(0)
		});
	}
	
	render() {
		const {children, title, editable} = this.props;
		const {processing, editing, value, editLast} = this.state;
		let edit = null;
		let cssClasses = 'profile-editable-items profile-editable-editing ' + (value.length ? '' : 'profile-editable-items-empty');

		let titleNode = title ? <h2>{title}</h2> : null;

		if(typeof children === 'undefined') {
			return null;
		}

		if(processing) {
			return <div className={cssClasses}>
				{title}
				<div className="profile-editable-spinner"></div>
			</div>;
		}

		let add = editable ? <Button outline size='sm' color='secondary' onClick={this.add} className='ml-2' >Add</Button> : null;
	
		return <div className={cssClasses}>
			{titleNode} {add}
			<div>
				{value.map((item, index) => {
					return React.cloneElement(children, {
						value: item,
						key: item.id,
						onUpdate: this.update,
						onDelete: this.delete,
						editable: editable,
						editing: (editLast && (index == (value.length - 1)))
					});
				})}
				{edit}
			</div>
		</div>;
	}
}

EditableTimeline.propTypes = {
	title: PropTypes.string,
	field: PropTypes.string,
	emptytext: PropTypes.string,
	value: PropTypes.string,
	uniform: PropTypes.bool //whether to have a single + button at the top, as well as edit icons for each section, or single edit for the full set
};

EditableTimeline.defaultProps = {
	uniform:false
};

export {EditableTimeline};