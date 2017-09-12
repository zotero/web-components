'use strict';

import {log as logger} from '../Log.js';
let log = logger.Logger('Separator');

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DropTarget } from 'react-dnd';

const Types = {
	CVSECTION: 'cvsection'
};

const separatorTarget = {
	drop(props, monitor) {
		let item = monitor.getItem();
		props.moveEntry(item.index, props.index);
	},
	canDrop(props, monitor) {
		//only allow drop if it's not right next to dragged item
		let item = monitor.getItem();
		let itemIndex = parseInt(item.index, 10);
		let sepIndex = parseInt(props.index, 10);
		let sepRegion = props.region;
		if(itemIndex == sepIndex){
			return false;
		}
		if(sepIndex < itemIndex && sepRegion == 'bottom'){
			return false;
		}
		if(sepIndex > itemIndex && sepRegion == 'top'){
			return false;
		}
		return true;
	}
};

function collect(connect, monitor) {
	return {
		connectDropTarget: connect.dropTarget(),
		isOver: monitor.isOver(),
		canDrop: monitor.canDrop()
	};
}

class Separator extends Component {
	render() {
		const { connectDropTarget, isOver, canDrop } = this.props;

		return connectDropTarget(
			<div className={`separator ${this.props.region}`}>
				{isOver && canDrop && <div className='separator-highlight'></div>}
			</div>
		);
	}
}

Separator.propTypes = {
	connectDropTarget: PropTypes.func.isRequired,
	isOver: PropTypes.bool.isRequired
};

export default DropTarget(Types.CVSECTION, separatorTarget, collect)(Separator);