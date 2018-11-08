'use strict';

import {log as logger} from '../Log.js';
let log = logger.Logger('editable-timeline');

import React from 'react';
import PropTypes from 'prop-types';

import {Button} from 'reactstrap';

class EditableTimeline extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			counter: props.value && props.value.length + 1 || 1,
			value: props.value && JSON.parse(props.value) || [],
			processing: false,
			editLast: false
		};
	}
	componentDidUpdate(prevProps) {
		if(this.props.value != prevProps.value){
			this.setState({value:JSON.parse(this.props.value)});
		}
	}
	addEmpty = (evt) => {
		evt.preventDefault();
		let {value, counter} = this.state;
		let {template} = this.props;
		if(!template){
			throw 'no template';
		}
		let addObject;
		if(template === undefined){
			addObject = {id:++counter};
		} else {
			addObject = Object.assign({}, template, {id:++counter});
		}
		value.push(addObject);
		this.setState({value, addValue:'', counter, editLast:true});
	}

	updateEntry = (index, entry) => {
		if(index === undefined || entry === undefined){
			log.error('Insufficient arguments to updateEntry');
			throw 'Insufficient arguments to updateEntry';
		}
		let {value} = this.state;
		let newValue = value.slice(0);
		newValue[index] = entry;
		this.setState({value:newValue, editLast:false}, this.save);
	}

	save = async (evt) => {
		if(evt){
			evt.preventDefault();
		}
		const {field} = this.props;
		const {value} = this.state;

		this.setState({
			processing: true,
		});

		await this.props.saveField(field, JSON.stringify(value));
		this.setState({
			processing: false,
			editing: false,
		});
		return;
	}

	remove = (index) => {
		if(index === undefined){
			log.error('Insufficient arguments to _remove');
			throw 'Insufficient arguments to _remove';
		}
		let {value} = this.state;
		value.splice(index, 1);
		this.setState({
			value,
			editLast:false
		}, this.save);
	}

	render() {
		const {entryClass, title, editable} = this.props;
		const {processing, value, editLast} = this.state;
		let edit = null;
		let cssClasses = 'profile-editable-items profile-editable-editing ' + (value.length ? '' : 'profile-editable-items-empty');

		let titleNode = title ? <h2>{title}</h2> : null;

		if(typeof entryClass === 'undefined') {
			return null;
		}

		if(processing) {
			return <div className={cssClasses}>
				{title}
				<div className="profile-editable-spinner"></div>
			</div>;
		}

		let add = editable ? <Button outline size='sm' color='secondary' onClick={this.addEmpty} className='ml-2' >Add</Button> : null;
	
		return <div className={cssClasses}>
			{titleNode} {add}
			<div>
				{value.map((entry, index) => {
					return React.createElement(entryClass, {
						index,
						value: entry,
						key: index,
						onUpdate: this.updateEntry,
						remove: this.remove,
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
};

export {EditableTimeline};