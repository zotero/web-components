'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('InviteToGroups');

import {ajax, postFormData} from './ajax.js';
import {apiRequestString} from './ApiRouter.js';
import {LoadingSpinner} from './LoadingSpinner.js';
import {buildUrl} from './wwwroutes.js';
import {VerticalExpandable} from './VerticalExpandable.js';
import {jsError, getCurrentUser} from './Utils.js';

const currentUser = getCurrentUser();

let React = require('react');

//component to list groups a user can invite another user to
class InviteToGroups extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			userGroups: [],
			invitationsSent: [],
			userGroupsLoaded:false,
			selectedGroup:false,
			showInvitation:false
		};
	}
	loadGroupData = async () => {
		let {userID, invitee} = this.props;
		let inviteeUserID = invitee.userID;
		if(!userID && currentUser){
			userID = currentUser.userID;
		}

		if(!userID){
			throw 'no userID';
		}
		if(!inviteeUserID){
			throw 'no user to invite';
		}

		//load groups of user
		let userGroupsUrl = apiRequestString({
			'target':'userGroups',
			'libraryType':'user',
			'libraryID': userID,
			'order':'title'
		});
		let userGroups;
		try {
			let resp = await ajax({url: userGroupsUrl, credentials:'omit'});
			userGroups = await resp.json();
			this.setState({
				userGroups,
				userGroupsLoaded:true
			});
		} catch(e){
			jsError('Error getting groups');
			log.error(e);
		};

		//load list of groups user has already been invited to
		let alreadyInvitedUrl = `/user/${inviteeUserID}/alreadyinvited`;
		let alreadyInvited;
		try {
			let resp = await ajax({url: alreadyInvitedUrl});
			let data = await resp.json();
			alreadyInvited = data.alreadyInvited;
			this.setState({
				alreadyInvited,
				alreadyInvitedLoaded:true
			});
		} catch(e){
			jsError('Error getting invitations');
			log.error(e);
		}

		let invitable = this.calculateInvitable(userGroups, alreadyInvited);
		if(invitable === false){
			log.error('error calculating invitable');
			jsError('Error getting groups');
		} else {
			if(invitable.length > 0){
				this.setState({selectedGroup: invitable[0].id});
			}
		}
	}
	showInvitation = (evt) => {
		evt.preventDefault();
		this.loadGroupData();
		this.setState({showInvitation:true});
	}
	updateSelectedGroup = (evt) => {
		this.setState({selectedGroup:evt.target.value});
	}
	inviteToGroup = async () => {
		const {selectedGroup, userGroups} = this.state;
		const {invitee} = this.props;
		let group;
		userGroups.forEach((ugroup)=>{
			if(ugroup.id == selectedGroup){
				group = ugroup;
			}
		});

		try{
			let resp = await postFormData(buildUrl('groupInvite'), {groupID:group.id, userID:invitee.userID, ajax:true});
			let data = await resp.json();
			if(data.success){
				let invitationsSent = this.state.invitationsSent;
				invitationsSent.push(parseInt(groupID));
				this.setState({invitationsSent});
			} else {
				throw data;
			}
		} catch(e){
			jsError('Error sending invitation');
			log.error(e);
		}
	}
	calculateInvitable = (userGroups, alreadyInvited) => {
		if((!this.state.userGroupsLoaded) || (!this.state.alreadyInvitedLoaded)){
			return false;
		}

		const {userID, invitee} = this.props;
		let inviteeUserID = invitee.userID;

		//build list of groups invitee can be invited to by user
		let invitableGroups = [];
		for(let group of userGroups){
			let members = group.data.members ? group.data.members : [];
			let admins = group.data.admins ? group.data.admins : [];
			// if viewer is group admin (has invite permissions) or group is open
			if(admins.includes(userID) || (group.data.owner === userID)){ //|| (group.data.type == 'PublicOpen') ? Should any user be able to invite others to a public open group?
				// profileUser not already Member
				if(!admins.includes(inviteeUserID) && !members.includes(inviteeUserID) && group.data.owner !== inviteeUserID){
					//check if user already has invite
					if(!alreadyInvited.includes(group.id)){
						//log.debug(`adding ${group.data.name} to invitableGroups`);
						invitableGroups.push(group);
					}
				}
			}
		}
		return invitableGroups;
	}
	render() {
		const {userID, invitee} = this.props;
		const {userGroups, alreadyInvited, invitationsSent, userGroupsLoaded, alreadyInvitedLoaded, showInvitation} = this.state;
		if(!userID){
			return null;
		}
		if(userID == invitee.userID) {
			return null;
		}

		let inviteSection = null;
		let pendingInvitations = null;

		let groupMap = {};
		userGroups.forEach((group)=>{
			groupMap[group.id] = group;
		});

		//populate list of groups user has permission to send invites for, and profileUser is not already
		//a member or has an invitation pending
		let invitableGroups = this.calculateInvitable(userGroups, alreadyInvited);
		if(invitableGroups !== false){
			//filter out invitableGroups that user has just invited profileUser to
			invitableGroups = invitableGroups.filter((group)=>{
				if(invitationsSent.includes(group.id)){
					return false;
				}
				return true;
			});

			//if there are any invitable groups, make an invite section with options
			//otherwise inform user that profileUser has already been invited, or user has no groups
			//to issue invites for
			if(invitableGroups.length > 0){
				let inviteOptions = invitableGroups.map((group)=>{
					return <option key={group.id} value={group.id} label={group.data.name}>{group.data.name}</option>;
				});

				inviteSection = (
					<div>
						<select onChange={this.updateSelectedGroup}>
							{inviteOptions}
						</select>
						<button type='button' onClick={this.inviteToGroup}>Invite</button>
					</div>
				);
			} else if(alreadyInvited.length > 0) {
				inviteSection = (
					<div>
						<p>{invitee.displayName} has already been invited to your groups.</p>
					</div>
				);
			} else {
				inviteSection = (
					<div>
						<p>You don't currently have any groups to invite {invitee.displayName} to.
							If you haven't previously invited them to your group, make sure you are an admin for
							the group, or <a href={buildUrl('groupCreate')}>create a new group</a> to collaborate with other users.
						</p>
					</div>
				);
			}

			if(invitationsSent.length > 0 || alreadyInvited.length > 0){
				let invitationsSentNodes = invitationsSent.map((groupID)=>{
					let group = groupMap[groupID];
					return (
						<li key={group.id}><a href={buildUrl('groupView', {group})}>{group.data.name}</a></li>
					);
				});

				let alreadyInvitedNodes = alreadyInvited.map((groupID)=>{
					let group = groupMap[groupID];
					return (
						<li key={group.id}><a href={buildUrl('groupView', {group})}>{group.data.name}</a></li>
					);
				});

				pendingInvitations = (
					<div>
						<h3>Pending invitations to</h3>
						<ul>
							{invitationsSentNodes}
							{alreadyInvitedNodes}
						</ul>
					</div>
				);
			}
		}

		const loading = (!userGroupsLoaded) || (!alreadyInvitedLoaded);

		return (
			<div id='invite-to-group'>
				<a className='expand-link' href="#" onClick={this.showInvitation}>
					Invite {invitee.displayName} to join one of your groups
				</a>
				<VerticalExpandable expand={showInvitation}>
					<LoadingSpinner loading={loading} />
					{inviteSection}
					{pendingInvitations}
				</VerticalExpandable>
			</div>
		);
	}
}
InviteToGroups.defaultProps = {
	titleOnly:false,
	invitee:false,
	userID:false
};

export {InviteToGroups};
