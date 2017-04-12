'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('GroupInvitations');

import {ajax, postFormData} from './ajax.js';

let React = require('react');

import {slugify} from './Utils.js';

let groupViewUrl = function(group){
	if(group.type == 'Private') {
		return `/groups/${group.id}`;
	} else {
		let slug = slugify(group.name);
		return `/groups/${slug}`;
	}
};

let groupJoinUrl = function(group){
	return `/groups/${group.id}/join`;
};

let groupDeclineUrl = function(group, token){
	return `/groups/${group.id}/decline/${token}`;
};

class GroupInvitation extends React.Component{
	constructor(props){
		super(props);
		this.acceptInvitation = this.acceptInvitation.bind(this);
		this.declineInvitation = this.declineInvitation.bind(this);
	}
	acceptInvitation(){
		let group = this.props.group;
		let invitation = this.props.invitation;
		let url = groupJoinUrl(group);
		postFormData(url, {token:invitation.token});
	}
	declineInvitation(){
		let group = this.props.group;
		let invitation = this.props.invitation;
		let url = groupDeclineUrl(group, invitation.token);
		postFormData(url, {token:invitation.token});
	}
	render(){
		let group = this.props.group;

		return (
			<li><strong className="group-title"><a href={groupViewUrl(group)}>{group.name}</a></strong> 
				<span className="group-description">{group.description}</span>
				<div className="group-buttons">
					<button type="button" onClick={this.acceptInvitation}>Join</button>
					<button type="button" onClick={this.declineInvitation}>Ignore</button>
				</div>
			</li>
		);
	}
}

class GroupInvitations extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			invitations:[],
			invitationGroups:[]
		};
	}
	componentDidMount(){
		if(Zotero.currentUser){
			ajax({url:'/groups/invitations'}).then((resp)=>{
				resp.json().then((data) => {
					this.setState({
						invitations:data.invitations,
						invitationGroups:data.invitationGroups
					});
				});
			});
		}
	}
	render() {
		let invitationGroups = this.state.invitationGroups;
		let invitations = this.state.invitations;
		let invitationNodes = invitations.map((invitation)=>{
			let group = invitationGroups[invitation.groupID];
			return <GroupInvitation key={invitation.groupID} group={group} invitation={invitation} />;
		});

		if(invitations.length == 0) {
			return null;
		}
		return (
			<div className='group-invitations'>
				<h2>Group Invitations</h2>
				<ul>
					{invitationNodes}
				</ul>
			</div>
		);
	}
}

export {GroupInvitations};
