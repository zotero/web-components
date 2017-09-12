'use strict';

//import {log as logger} from '../Log.js';
//let log = logger.Logger('Section');

const React = require('react');
const {Component} = React;
import { DragSource } from 'react-dnd';

import {RTE} from './text.js';
import {Collection} from './collection.js';

// Drag sources and drop targets only interact
// if they have the same string type.
// You want to keep types in a separate file with
// the rest of your app's constants.
const Types = {
	CVSECTION: 'cvsection'
};

/**
 * Specifies the drag source contract.
 * Only `beginDrag` function is required.
 */
const sectionSource = {
	beginDrag(props) {
		// Return the data describing the dragged item
		const item = { tracking: props.section.tracking, index:props.index };
		return item;
	}
};

/**
* Specifies which props to inject into your component.
*/
function collect(connect, monitor) {
	return {
		// Call this function inside render()
		// to let React DnD handle the drag events:
		connectDragSource: connect.dragSource(),
		// You can ask the monitor about the current drag state:
		isDragging: monitor.isDragging()
	};
}

class Section extends Component {
	constructor(props){
		super(props);
		this.moveUp = this.moveUp.bind(this);
		this.moveDown = this.moveDown.bind(this);
		this.headingChange = this.headingChange.bind(this);
	}
	headingChange(evt){
		this.props.updateEntry(this.props.section.tracking, 'heading', evt.target.value);
	}
	moveUp(){
		this.props.moveEntry(this.props.index, this.props.index-1);
	}
	moveDown(){
		this.props.moveEntry(this.props.index, this.props.index+1);
	}
	remove(){
		this.props.removeEntry(this.props.index);
	}
	render() {
		const {type} = this.props.section;
		// These two props are injected by React DnD,
		// as defined by your `collect` function above:
		const { isDragging, connectDragSource } = this.props;

		let typedSection = null;
		if(type == 'text'){
			typedSection = <RTE {...this.props} />;
		} else if(type == 'collection'){
			typedSection = <Collection {...this.props} />;
		}
		return connectDragSource(
			<div className='cv_section'>
				<button className='btn' onClick={this.moveUp} title='Move Up'>▲</button>
				<button className='btn' onClick={this.moveDown} title='Move Down'>▼</button>
				<button className='btn' onClick={this.remove} title='Remove Section'>x</button>
				<input type='text' className='cv-heading form-control' name='' defaultValue={this.props.section.heading} onChange={this.headingChange} placeholder='Section Title' /> 
				{typedSection}
			</div>
		);
	}
}

export default DragSource(Types.CVSECTION, sectionSource, collect)(Section);