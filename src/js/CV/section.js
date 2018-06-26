'use strict';

//import {log as logger} from '../Log.js';
//let log = logger.Logger('Section');

const React = require('react');
const {Component} = React;
import { findDOMNode } from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';

import {RTE} from './text.js';
import {Collection} from './collection.js';
import {EditableTextInput, EditableRichText} from './editableTextInput.js';
import {Button, ButtonGroup, Card, CardBody} from 'reactstrap';

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

const sectionTarget = {
	hover(props, monitor, component) {
		const dragIndex = monitor.getItem().index;
		const hoverIndex = props.index;
	
		// Don't replace items with themselves
		if (dragIndex === hoverIndex) {
			return;
		}

		// Determine rectangle on screen
		const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();

		// Get vertical middle
		const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

		// Determine mouse position
		const clientOffset = monitor.getClientOffset();

		// Get pixels to the top
		const hoverClientY = clientOffset.y - hoverBoundingRect.top;

		// Only perform the move when the mouse has crossed half of the items height
		// When dragging downwards, only move when the cursor is below 50%
		// When dragging upwards, only move when the cursor is above 50%

		// Dragging downwards
		if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
			return;
		}

		// Dragging upwards
		if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
			return;
		}

		// Time to actually perform the action
		props.moveEntry(dragIndex, hoverIndex);

		// Note: we're mutating the monitor item here!
		// Generally it's better to avoid mutations,
		// but it's good here for the sake of performance
		// to avoid expensive index searches.
		monitor.getItem().index = hoverIndex;
	},
	drop(props, monitor) {
		let item = monitor.getItem();
		props.moveEntry(item.index, props.index);
	}
};

/**
* Specifies which props to inject into your component.
*/
function dragcollect(connect, monitor) {
	return {
		// Call this function inside render()
		// to let React DnD handle the drag events:
		connectDragSource: connect.dragSource(),
		connectDragPreview: connect.dragPreview(),
		// You can ask the monitor about the current drag state:
		isDragging: monitor.isDragging()
	};
}

function dropcollect(connect, monitor){
	return {
		connectDropTarget: connect.dropTarget(),
		isOver: monitor.isOver(),
		canDrop: monitor.canDrop()
	};
}

class Section extends Component {
	headingChange = (evt) => {
		this.props.updateEntry(this.props.section.tracking, 'heading', evt.target.value);
	}
	updateHeading = (newval) => {
		this.props.updateEntry(this.props.section.tracking, 'heading', newval);
	}
	moveUp = () => {
		this.props.moveEntry(this.props.index, this.props.index-1);
	}
	moveDown = () => {
		this.props.moveEntry(this.props.index, this.props.index+1);
	}
	remove = () => {
		this.props.removeEntry(this.props.index);
	}
	edit = () => {
		this.props.edit(this.props.index);
	}
	save = () => {
		this.props.save(this.props.index);
	}
	render() {
		const {type} = this.props.section;
		// These two props are injected by React DnD,
		// as defined by your `collect` function above:
		const { isDragging, connectDragPreview, connectDragSource, connectDropTarget, isOver, canDrop } = this.props;

		let typedSection = null;
		if(type == 'text'){
			typedSection = <RTE {...this.props} />;
		} else if(type == 'collection'){
			typedSection = <Collection {...this.props} />;
		}
		return connectDropTarget(connectDragPreview(
			<div className='cv_section m-3'>
				<Card>
					{connectDragSource(<div className='drag_handle'></div>)}
					<CardBody>
						<ButtonGroup className='mb-2'>
							<Button outline onClick={this.moveUp} title='Move Up'>▲</Button>
							<Button outline onClick={this.moveDown} title='Move Down'>▼</Button>
							<Button outline onClick={this.remove} title='Remove Section'>x</Button>
							{/*<Button outline onClick={this.edit} title='Edit Section'>Edit</Button>*/}
						</ButtonGroup>
						<h2 className="profile_cvHead">
							<EditableTextInput value={this.props.section.heading} save={this.updateHeading} placeholder='Section Header' />
						</h2>
						<div className='mt-2'>
							{typedSection}
						</div>
					</CardBody>
				</Card>
			</div>
		));
	}
}

export default DropTarget(Types.CVSECTION, sectionTarget, dropcollect)(DragSource(Types.CVSECTION, sectionSource, dragcollect)(Section));
//export default Section;