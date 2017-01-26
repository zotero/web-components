'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('InviteToGroups');

import {ajax} from './ajax.js';
import {apiRequestString} from './ApiRouter.js';
import {LoadingSpinner} from './LoadingSpinner.js';

let React = require('react');

const apiKey = window.zoteroConfig.apiKey;

//component to list groups a user can invite another user to
let InviteToGroups = React.createClass({
	componentDidMount: function() {
		let userID = false;
		let inviteeUserID = this.props.inviteeUserID;
		if(this.props.userID){
			userID = this.props.userID;
		} else if(Zotero.currentUser){
			userID = Zotero.currentUser.userID;
		}

		if(!userID || !inviteeUserID){
			return;
		}

		//headers for all requests
		let headers = {'Zotero-Api-Key':apiKey};
		
		//load groups of user
		log.debug(`loading groups for user ${userID}`);
		this.setState({loading:true});
		let userGroupsUrl = apiRequestString({
			'target':'userGroups',
			'libraryType':'user',
			'libraryID': userID,
			'order':'title'
		});
		ajax({url: userGroupsUrl, credentials:'omit', headers:headers}).then((resp)=>{
			resp.json().then((data) => {
				this.setState({
					userGroups:data,
					userGroupsLoaded:true
				});
			});
		});

		//load groups of potential invitee
		log.debug(`loading groups for user ${inviteeUserID}`);
		this.setState({loading:true});
		let inviteeGroupsUrl = apiRequestString({
			'target':'userGroups',
			'libraryType':'user',
			'libraryID': inviteeUserID,
			'order':'title'
		});
		
		ajax({url: inviteeGroupsUrl, credentials:'omit', headers:headers}).then((resp)=>{
			resp.json().then((data) => {
				this.setState({
					inviteeGroups:data,
					inviteeGroupsLoaded:true
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
			userGroups: [],
			inviteeGroups: [],
			invitableGroups: [],
			invitationsSent: [],
			userGroupsLoaded:false,
			inviteeGroupsLoaded:false,
			selectedGroup:false
		};
	},
	updateSelectedGroup: function(evt) {
		this.setState({selectedGroup:evt.target.value});
	},
	inviteToGroup: function() {
		let groupID = this.state.selectedGroup;
		log.debug(`invite to ${groupID}`);
		//TODO:actually send invite
		let invitationsSent = this.state.invitationsSent;
		invitationsSent.push(groupID);
		this.setState({invitationsSent});
	},
	render: function() {
		log.debug('InviteToGroups render');
		if(!this.state.userGroupsLoaded || !this.state.inviteeGroupsLoaded){
			return null;
		}

		let userID = this.props.userID;
		let inviteeUserID = this.props.inviteeUserID;

		log.debug(`userID: ${userID}, inviteeUserID: ${inviteeUserID}`);
		//build list of groups invitee can be invited to by user
		let invitableGroups = [];
		for(let group of this.state.userGroups){
			let members = group.data.members ? group.data.members : [];
			let admins = group.data.admins ? group.data.admins : [];
			// if viewer is group admin, has invite permissions
			if(admins.includes(userID) || group.data.owner === userID){
				// profileUser not already Member
				if(!admins.includes(inviteeUserID) && !members.includes(inviteeUserID) && group.data.owner !== inviteeUserID){
					//TODO: check if user already has invite
					invitableGroups.push(group);
				}
			}
		}

		let inviteOptions = invitableGroups.map((group)=>{
			return <option key={group.id} value={group.id} label={group.data.name}>{group.data.name}</option>;
		});

		let pendingInvitations = null;
		if(this.state.invitationsSent.length > 0){
			let invitationNodes = this.state.invitationsSent.map((groupID)=>{
				
			});
		}

		log.debug('returning full invite list');
		return (
			<div id='invite-to-group'>
				<select onChange={this.updateSelectedGroup}>
					{inviteOptions}
				</select>
				<button type='button' onClick={this.inviteToGroup}>Invite</button>
				{pendingInvitations}
			</div>
		);
	}
});

export {InviteToGroups};
