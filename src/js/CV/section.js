// import { log as logger } from '../Log.js';
// let log = logger.Logger('Section');

import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import { PropTypes } from 'prop-types';
import { RTE } from './text.js';
import { Collection } from './collection.js';
import { EditableTextInput } from './editableTextInput.js';
import { Button, Col, Row } from 'reactstrap';

// Drag sources and drop targets only interact
// if they have the same string type.
// You want to keep types in a separate file with
// the rest of your app's constants.
const Types = {
	CVSECTION: 'cvsection'
};

const Section = (props) => {
	const { updateEntry, removeEntry, moveEntry, section, index } = props;

	const ref = useRef(null);
	
	const [, drop] = useDrop({
		accept: Types.CVSECTION,
		hover(item, monitor) {
			if (!ref.current) {
				return;
			}
			const dragIndex = item.index;
			const hoverIndex = index;
			// Don't replace items with themselves
			if (dragIndex === hoverIndex) {
				return;
			}
			// Determine rectangle on screen
			const hoverBoundingRect = ref.current.getBoundingClientRect();
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
			moveEntry(dragIndex, hoverIndex);
			// Note: we're mutating the monitor item here!
			// Generally it's better to avoid mutations,
			// but it's good here for the sake of performance
			// to avoid expensive index searches.
			item.index = hoverIndex;
		},
	});
	const [/* { isDragging }*/, drag] = useDrag({
		item: { type: Types.CVSECTION, section, index },
		collect: monitor => ({
			isDragging: monitor.isDragging(),
		}),
	});
	// const opacity = isDragging ? 0 : 1;
	drag(drop(ref));

	const updateHeading = (newval) => {
		updateEntry(section.tracking, 'heading', newval);
	};

	const moveUp = () => {
		moveEntry(index, index - 1);
	};

	const moveDown = () => {
		moveEntry(index, index + 1);
	};

	const remove = () => {
		removeEntry(index);
	};

	let typedSection = null;
	if (section.type == 'text') {
		typedSection = <RTE {...props} />;
	} else if (section.type == 'collection') {
		typedSection = <Collection {...props} />;
	}
	return (
		<section className='settings-section cv_section m-3' ref={ref} >
			<Row>
				<Col xs='1'>
					<div className='vert_drag_handle'></div>
				</Col>
				<Col xs='9'>
					<h2 className='profile_cvHead'>
						<EditableTextInput value={section.heading} save={updateHeading} placeholder='Section Title' />
					</h2>
					<div className='mt-2'>
						{typedSection}
					</div>
				</Col>
				<Col xs='2'>
					<Button color="link" onClick={moveUp} title='Move Section Up'>Move Up</Button>
					<Button color="link" onClick={moveDown} title='Move Section Down'>Move Down</Button>
					<Button color="link" onClick={remove} title='Remove Section'>Delete</Button>
					{/* <Button outline onClick={this.edit} title='Edit Section'>Edit</Button>*/}
				</Col>
			</Row>
		</section>
	);
};
Section.propTypes = {
	index: PropTypes.number,
	section: PropTypes.shape({
		heading: PropTypes.string,
		tracking: PropTypes.string,
		type: PropTypes.string,
	}),
	updateEntry: PropTypes.func,
	removeEntry: PropTypes.func,
	moveEntry: PropTypes.func,
};

export default Section;
