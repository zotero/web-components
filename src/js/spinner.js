'use strict';

import React from 'react';

const config = window.zoteroConfig;
const imagePath = config.imagePath;
const blueSpinImagePath = imagePath + '/spin-blue.svg';
const whiteSpinImagePath = imagePath + '/spin-blue.svg';

export default class Spinner extends React.Component {
	render() {
		const {width, height, color} = this.props;
		let iconPath = blueSpinImagePath;//default blue
		switch(color){
			case 'white':
				iconPath = whiteSpinImagePath;
		}
		return <img className="icon icon-spin" src={iconPath} width={width} height={height} />;
	}
}
Spinner.defaultProps = {
	width: 24,
	height: 24,
	color: 'blue'
};
