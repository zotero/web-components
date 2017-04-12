'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('NewGroupDiscussions');

import {ajax} from './ajax.js';

let React = require('react');

class NewGroupDiscussions extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			partial:''
		};
	}
	componentDidMount(){
		if(Zotero.currentUser){
			ajax({url:'/groups/newgroupdiscussions'}).then((resp)=>{
				resp.text().then((data) => {
					this.setState({partial:data});
				});
			});
		}
	}
	render() {
		if(!Zotero.currentUser){
			return null;
		}
		let partialHtml = {__html: this.state.partial};

		return (
			<div className='new-group-discussions'>
				<h2>New Group Discussions</h2>
				<div dangerouslySetInnerHTML={partialHtml}></div>
			</div>
		);
	}
}

export {NewGroupDiscussions};
