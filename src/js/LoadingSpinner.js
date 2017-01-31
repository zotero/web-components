'use strict';

let React = require('react');

import Spinner from './spinner.js';

let LoadingSpinner = React.createClass({
	render: function(){
		if(!this.props.loading){
			return null;
		}
		return <Spinner />;
	}
});

export {LoadingSpinner};
