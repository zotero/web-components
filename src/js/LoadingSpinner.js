'use strict';

import React from 'react';

const {Component} = React;
const config = window.zoteroConfig;
const imagePath = config.imagePath;
const blueSpinImagePath = imagePath + '/spin-blue.svg';
const whiteSpinImagePath = imagePath + '/spin-blue.svg';

class Spinner extends Component {
	render() {
		const {width, height, color} = this.props;
		let iconPath = blueSpinImagePath;//default blue
		switch(color){
			case 'white':
				iconPath = whiteSpinImagePath;
		}
		return <img className={this.props.className + ' icon icon-spin'} src={iconPath} width={width} height={height} />;
	}
}
Spinner.defaultProps = {
	width: 24,
	height: 24,
	color: 'blue'
};

class LoadingSpinner extends Component{
	render(){
		if(!this.props.loading){
			return null;
		}
		return <Spinner {...this.props} />;
	}
}
LoadingSpinner.defaultProps = {
	color:'blue'
};

export {Spinner, LoadingSpinner};
