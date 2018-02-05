'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('NewGroupDiscussions');

import {ajax} from './ajax.js';
import {getCurrentUser} from './Utils.js';

const currentUser = getCurrentUser();

let React = require('react');

class NewGroupDiscussions extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			partial:''
		};
	}
	componentDidMount(){
		if(currentUser){
			ajax({url:'/groups/newgroupdiscussions'}).then((resp)=>{
				resp.text().then((data) => {
					this.setState({partial:data});
				});
			});
		}
	}
	render() {
		if(!currentUser){
			return null;
		}
		let partialHtml = {__html: this.state.partial};

		return (
			<div className='new-group-discussions card'>
				<div className='card-header'>New Group Discussions</div>
				<div className='card-body'>
					<div dangerouslySetInnerHTML={partialHtml}></div>
				</div>
			</div>
		);
	}
}

export {NewGroupDiscussions};
