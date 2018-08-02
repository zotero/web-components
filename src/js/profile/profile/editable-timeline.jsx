'use strict';

import {log as logger} from '../../Log.js';
let log = logger.Logger('editable-timeline');

import React from 'react';
import PropTypes from 'prop-types';

import {MultipleEditableBase} from '../abstract/editable-base.jsx';
import {Button} from 'reactstrap';

class EditableTimeline extends MultipleEditableBase {
	constructor(props) {
		super(props);
		this.state = {
			counter: props.value && props.value.length + 1 || 1,
			value: props.value && JSON.parse(props.value) || [],
			processing: false,
			editLast: false
		};
	}

	addEmpty = (evt) => {
		super._addEmpty.apply(this, [evt]);
		this.setState({editLast:true});
	}

	updateEntry = (index, entry) => {
		this._updateEntry.apply(this, [index, entry]);
	}

	render() {
		const {entryClass, title, editable} = this.props;
		const {processing, editing, value, editLast} = this.state;
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
};

export {EditableTimeline};