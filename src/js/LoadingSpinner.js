'use strict';

let React = require('react');
const {Component} = React;

import Spinner from './spinner.js';

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

export {LoadingSpinner};
