'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('InviteToGroups');

import {ajax} from './ajax.js';

let React = require('react');

import {buildUrl} from './wwwroutes.js';

//component to list groups a user can invite another user to
class InviteToGroups extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			memberGroups: [],
			invitedGroups: [],
			invitableGroups: [],
			loaded:false
		};
		this.loadGroupInfo = this.loadGroupInfo.bind(this);
		this.updateSelectedGroup = this.updateSelectedGroup.bind(this);
		this.inviteToGroup = this.inviteToGroup.bind(this);
	}
	componentDidMount() {
		this.loadGroupInfo();
	}
	loadGroupInfo() {
		let userID = this.props.inviteeUserID;
		let url = `/user/${userID}/groupsjson`;
		ajax({url: url}).then((resp)=>{
			resp.json().then((data) => {
				this.setState({
					invitedGroups:data.invitedGroups,
					invitableGroups: data.invitableGroups,
					memberGroups: data.memberGroups,
					loaded:true
				});
			});
		});
	}
	updateSelectedGroup(evt) {
		this.setState({selectedGroup:evt.target.value});
	}
	inviteToGroup() {
		let groupID = this.state.selectedGroup;
		log.debug(`invite to ${groupID}`);
		//TODO:actually send invite
		//find group and move from invitable to invited groups
		let invitedGroups = this.state.invitedGroups;
		let invitableGroups = this.state.invitableGroups;
		for(let i = 0; i < invitableGroups.length; i++){
			if(invitableGroups[i].id == groupID){
				invitedGroups.push(invitableGroups[i]);
				invitableGroups = invitableGroups.splice(i, 1);
				break;
			}
		}
		this.setState({
			invitedGroups:invitedGroups,
			invitableGroups:invitableGroups
		});
	}
	render() {
		log.debug('InviteToGroups render');
		if(!this.state.loaded){
			return null;
		}

		let inviteSection = null;
		if(this.state.invitableGroups.length > 0){
			let inviteOptions = this.state.invitableGroups.map((group)=>{
				log.debug(`invitable group ${group.id}`);
				return <option key={group.id} value={group.id} label={group.name}>{group.name}</option>;
			});

			inviteSection = (
				<div id='invite-to-group'>
					<h3>Invite to join your groups</h3>
					<select onChange={this.updateSelectedGroup}>
						{inviteOptions}
					</select>
					<button type='button' onClick={this.inviteToGroup}>Invite</button>
				</div>
			);
		}
		
		let pendingInvites = null;
		if(this.state.invitedGroups.length > 0){
			let invitationNodes = this.state.invitedGroups.map((group)=>{
				log.debug(`invited group ${group.id}`);
				return (
					<div key={group.id}>
						<div className="nugget-name">
							<a href={buildUrl('groupView', {group})}>{group.name}</a>
						</div>
					</div>
				);
			});

			pendingInvites = (
				<div id='pending-invites'>
					<h3>Pending invitations to</h3>
					{invitationNodes}
				</div>
			);
		}

		log.debug('returning full invite list');
		return (
			<div id='profile-user-groups'>
				{inviteSection}
				{pendingInvites}
			</div>
		);
	}
}
InviteToGroups.defaultProps = {
	titleOnly:false,
	userID:false,
	inviteeUserID: false
};

export {InviteToGroups};
