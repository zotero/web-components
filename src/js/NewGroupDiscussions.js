'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('NewGroupDiscussions');

import {ajax, postFormData} from './ajax.js';
import {apiRequestString} from './ApiRouter.js';
import {LoadingSpinner} from './LoadingSpinner.js';

let React = require('react');

let NewGroupDiscussions = React.createClass({
	componentDidMount: function(){
		ajax({url:'/groups/newgroupdiscussions'}).then((resp)=>{
			resp.text().then((data) => {
				this.setState({partial:data});
			});
		});
	},
	getInitialState: function(){
		return {
			partial:''
		};
	},
	render: function() {
		let partialHtml = {__html: this.state.partial};

		return (
			<div className='new-group-discussions'>
				<h2>New Group Discussions</h2>
				<div dangerouslySetInnerHTML={partialHtml}></div>
			</div>
		);
	}
});

export {NewGroupDiscussions};
