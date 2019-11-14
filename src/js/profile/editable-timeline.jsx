import { log as logger } from '../Log.js';
let log = logger.Logger('editable-timeline');

import { useState, useEffect, createElement } from 'react';
import PropTypes from 'prop-types';

import { Button } from 'reactstrap';

function EditableTimeline(props) {
	const { field, template, entryClass, title, editable } = props;

	const [counter, setCounter] = useState(props.value && props.value.length + 1 || 1);
	const [value, setValue] = useState(props.value && JSON.parse(props.value) || []);
	const [processing, setProcessing] = useState(false);
	const [editLast, setEditLast] = useState(false);
	const [editing, setEditing] = useState(false);

	useEffect(() => {
		const save = async () => {
			// if(evt){
			// 	evt.preventDefault();
			// }
			
			setProcessing(true);
			// this.setState({
			// 	processing: true,
			// });
	
			await props.saveField(field, JSON.stringify(value));
			setProcessing(false);
			setEditing(false);
			// this.setState({
			// 	processing: false,
			// 	editing: false,
			// });
		};
		
		save();
	}, [field, value]);

	// componentDidUpdate(prevProps) {
	// 	if (this.props.value != prevProps.value) {
	// 		this.setState({ value: JSON.parse(this.props.value) });
	// 	}
	// }

	const addEmpty = (evt) => {
		evt.preventDefault();
		if (!template) {
			throw new Error('no template');
		}
		let addObject;
		if (template === undefined) {
			addObject = { id: counter + 1 };
		} else {
			addObject = Object.assign({}, template, { id: counter + 1 });
		}
		let newValue = value.slice(0);
		newValue.push(addObject);
		
		setValue(newValue);
		setCounter(counter + 1);
		setEditLast(true);

		// this.setState({ value, addValue: '', counter, editLast: true });
	};

	const updateEntry = (index, entry) => {
		if (index === undefined || entry === undefined) {
			log.error('Insufficient arguments to updateEntry');
			throw new Error('Insufficient arguments to updateEntry');
		}
		let newValue = value.slice(0);
		newValue[index] = entry;

		setValue(newValue);
		setEditLast(false);
		// save();
		// this.setState({ value: newValue, editLast: false }, this.save);
	};

	const remove = (index) => {
		if (index === undefined) {
			log.error('Insufficient arguments to _remove');
			throw new Error('Insufficient arguments to _remove');
		}
		let newValue = value.slice(0);
		newValue.splice(index, 1);
		setValue(newValue);
		setEditLast(false);
		// save();

		// this.setState({
		// 	value,
		// 	editLast: false
		// }, this.save);
	};

	let edit = null;
	let cssClasses = 'profile-editable-items profile-editable-editing ' + (value.length ? '' : 'profile-editable-items-empty');

	let titleNode = title ? <h2>{title}</h2> : null;

	if (typeof entryClass === 'undefined') {
		return null;
	}

	if (processing) {
		return <div className={cssClasses}>
			{title}
			<div className='profile-editable-spinner'></div>
		</div>;
	}

	let add = editable ? <Button outline size='sm' color='secondary' onClick={addEmpty} className='ml-2' >Add</Button> : null;

	return <div className={cssClasses}>
		{titleNode} {add}
		<div>
			{value.map((entry, index) => {
				return createElement(entryClass, {
					index,
					value: entry,
					key: index,
					onUpdate: updateEntry,
					remove,
					editable,
					editing: (editLast && (index == (value.length - 1)))
				});
			})}
			{edit}
		</div>
	</div>;
}

EditableTimeline.propTypes = {
	title: PropTypes.string,
	field: PropTypes.string,
	emptytext: PropTypes.string,
	value: PropTypes.string,
};

export { EditableTimeline };
