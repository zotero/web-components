'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('GroupInvitations');

import {ajax, postFormData} from './ajax.js';
import {getCurrentUser} from './Utils.js';

const currentUser = getCurrentUser();

let React = require('react');

import {buildUrl} from './wwwroutes.js';

class GroupInvitation extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			done:false
		};
		this.acceptInvitation = this.acceptInvitation.bind(this);
		this.declineInvitation = this.declineInvitation.bind(this);
	}
	acceptInvitation(){
		let group = this.props.group;
		let invitation = this.props.invitation;
		let url = buildUrl('groupJoin', {group});
		postFormData(url, {token:invitation.token}).then(()=>{
			this.setState({done:true});
		});
	}
	declineInvitation(){
		let group = this.props.group;
		let invitation = this.props.invitation;
		let url = buildUrl('groupDecline', {group, token:invitation.token});
		postFormData(url, {token:invitation.token}).then(()=>{
			this.setState({done:true});
		});
	}
	render(){
		if(this.state.done){
			return null;
		}
		let group = this.props.group;

		return (
			<li><strong className="group-title"><a href={buildUrl('groupView', {group})}>{group.data.name}</a></strong> 
				{/*<span className="group-description">{group.data.description}</span>*/}
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
		this.loadInvitations = this.loadInvitations.bind(this);
	}
	componentDidMount(){
		this.loadInvitations();
	}
	loadInvitations() {
		if(currentUser){
			ajax({url:'/groups/invitations'}).then((resp)=>{
				resp.json().then((data) => {
					let invitationGroups = {};
					data.invitations.forEach((val) => {
						invitationGroups[val.groupID] = data.invitationGroups[val.groupID].apiObj;
					});
					this.setState({
						invitations:data.invitations,
						invitationGroups:invitationGroups
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
