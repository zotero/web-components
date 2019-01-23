'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('InviteToGroups');

import {ajax, postFormData} from './ajax.js';
import { loadUserGroups } from './ajaxHelpers.js';
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
		this.loadGroupData = this.loadGroupData.bind(this);
		this.updateSelectedGroup = this.updateSelectedGroup.bind(this);
		this.inviteToGroup = this.inviteToGroup.bind(this);
		this.showInvitation = this.showInvitation.bind(this);
		this.calculateInvitable = this.calculateInvitable.bind(this);
	}
	loadGroupData() {
		log.debug('loadGroupData');
		let userID = false;
		let inviteeUserID = this.props.invitee.userID;
		if(this.props.userID){
			userID = this.props.userID;
		} else if(currentUser){
			userID = currentUser.userID;
		}

		if(!userID || !inviteeUserID){
			return;
		}

		//load groups of user
		let userGroupsPromise = loadUserGroups(userID).then((resp)=>{
			return resp.json().then((data) => {
				this.setState({
					userGroups:data,
					userGroupsLoaded:true
				});
				return data;
			});
		}).catch(()=>{
			jsError('Error getting groups');
		});

		//load list of groups user has already been invited to
		let alreadyInvitedUrl = `/user/${inviteeUserID}/alreadyinvited`;
		
		let alreadyInvitedPromise = ajax({url: alreadyInvitedUrl}).then((resp)=>{
			return resp.json().then((data) => {
				this.setState({
					alreadyInvited:data.alreadyInvited,
					alreadyInvitedLoaded:true
				});
				return data;
			});
		}).catch(()=>{
			jsError('Error getting invitations');
		});

		Promise.all([userGroupsPromise, alreadyInvitedPromise]).then((results)=>{
			let invitable = this.calculateInvitable(results[0], results[1].alreadyInvited);
			if(invitable === false){
				log.debug('error calculating invitable');
				jsError('Error getting groups');
			} else {
				if(invitable.length > 0){
					this.setState({selectedGroup: invitable[0].id});
				}
			}
		});
	}
	showInvitation(evt) {
		evt.preventDefault();
		this.loadGroupData();
		this.setState({showInvitation:true});
	}
	updateSelectedGroup(evt) {
		this.setState({selectedGroup:evt.target.value});
	}
	inviteToGroup() {
		let groupID = this.state.selectedGroup;
		let group;
		this.state.userGroups.forEach((ugroup)=>{
			if(ugroup.id == groupID){
				group = ugroup;
			}
		});

		postFormData(buildUrl('groupInvite'), {groupID:group.id, userID:this.props.invitee.userID, ajax:true}).then((resp)=>{
			resp.json().then((data) => {
				if(data.success){
					let invitationsSent = this.state.invitationsSent;
					invitationsSent.push(parseInt(groupID));
					this.setState({invitationsSent});
				} else {
					throw data;
				}
			});
		}).catch(()=>{
			jsError('Error sending invitation');
		});
	}
	calculateInvitable(userGroups, alreadyInvited) {
		if((!this.state.userGroupsLoaded) || (!this.state.alreadyInvitedLoaded)){
			return false;
		}

		let userID = this.props.userID;
		let inviteeUserID = this.props.invitee.userID;

		//log.debug(`userID: ${userID}, inviteeUserID: ${inviteeUserID}`);
		
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
		log.debug('InviteToGroups render');
		if(!this.props.userID){
			return null;
		}
		if(this.props.userID == this.props.invitee) {
			return null;
		}
		
		let inviteSection = null;
		let pendingInvitations = null;
		
		let groupMap = {};
		this.state.userGroups.forEach((group)=>{
			groupMap[group.id] = group;
		});

		//populate list of groups user has permission to send invites for, and profileUser is not already
		//a member or has an invitation pending
		let invitableGroups = this.calculateInvitable(this.state.userGroups, this.state.alreadyInvited);
		if(invitableGroups !== false){
			//filter out invitableGroups that user has just invited profileUser to
			invitableGroups = invitableGroups.filter((group)=>{
				if(this.state.invitationsSent.includes(group.id)){
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
			} else if(this.state.alreadyInvited.length > 0) {
				inviteSection = (
					<div>
						<p>{this.props.invitee.displayName} has already been invited to your groups.</p>
					</div>
				);
			} else {
				inviteSection = (
					<div>
						<p>You don't currently have any groups to invite {this.props.invitee.displayName} to.
							If you haven't previously invited them to your group, make sure you are an admin for
							the group, or <a href={buildUrl('groupCreate')}>create a new group</a> to collaborate with other users.
						</p>
					</div>
				);
			}

			if(this.state.invitationsSent.length > 0 || this.state.alreadyInvited.length > 0){
				let invitationsSentNodes = this.state.invitationsSent.map((groupID)=>{
					let group = groupMap[groupID];
					return (
						<li key={group.id}><a href={buildUrl('groupView', {group})}>{group.data.name}</a></li>
					);
				});

				let alreadyInvitedNodes = this.state.alreadyInvited.map((groupID)=>{
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

		let loading = (!this.state.userGroupsLoaded) || (!this.state.alreadyInvitedLoaded);

		return (
			<div id='invite-to-group'>
				<a className='expand-link' href="#" onClick={this.showInvitation}>
					Invite {this.props.invitee.displayName} to join one of your groups
				</a>
				<VerticalExpandable expand={this.state.showInvitation}>
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
