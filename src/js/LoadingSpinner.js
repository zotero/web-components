'use strict';

let React = require('react');

let LoadingSpinner = React.createClass({
	render: function(){
		if(!this.props.loading){
			return null;
		}
		return (
			<div>
				<img src="/static/images/theme/broken-circle-spinner.gif" />
			</div>
		);
	}
});

export {LoadingSpinner};
