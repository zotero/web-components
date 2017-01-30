'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('InviteToGroups');

import {ajax} from './ajax.js';
import {apiRequestString} from './ApiRouter.js';
import {LoadingSpinner} from './LoadingSpinner.js';
import {GroupNugget} from './UserGroups.js';

let React = require('react');

const apiKey = window.zoteroConfig.apiKey;

import {slugify} from './Utils.js';

let groupViewUrl = function(group){
	if(group.type == 'Private') {
		return `/groups/${group.id}`;
	} else {
		let slug = slugify(group.name);
		return `/groups/${slug}`;
	}
};

//component to list groups a user can invite another user to
let InviteToGroups = React.createClass({
	componentDidMount: function() {
		this.loadGroupInfo();
	},
	loadGroupInfo: function() {
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
	},
	getDefaultProps: function() {
		return {
			titleOnly:false,
			userID:false,
			inviteeUserID: false
		};
	},
	getInitialState: function() {
		return {
			memberGroups: [],
			invitedGroups: [],
			invitableGroups: [],
			loaded:false
		};
	},
	updateSelectedGroup: function(evt) {
		this.setState({selectedGroup:evt.target.value});
	},
	inviteToGroup: function() {
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
	},
	render: function() {
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
							<a href={groupViewUrl(group)}>{group.name}</a>
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
});

export {InviteToGroups};
