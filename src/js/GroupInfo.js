'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('GroupInfo');

import {Notifier} from './Notifier.js';
import {ajax, postFormData} from './ajax.js';
//import {LoadingSpinner} from './LoadingSpinner.js';
import {buildUrl} from './wwwroutes.js';
import {apiRequestString} from './ApiRouter.js';
import {jsError, jsSuccess, getCurrentUser} from './Utils.js';
import classnames from 'classnames';
import striptags from 'striptags';

let React = require('react');

const currentUser = getCurrentUser();

let allGroupMembers = function(group) {
	let members = group.data.hasOwnProperty('members') ? group.data.members : [];
	let admins = group.data.hasOwnProperty('admins') ? group.data.admins : [];
	let allMembers = [group.data.owner, ...members, ...admins];
	return allMembers;
};

let groupIsWritable = function(group, userID) {
	let admins = group.data.admins;
	if(!admins){
		admins = [];
	}

	switch(true){
		case group.data.owner == userID:
			return true;
		case (admins.indexOf(userID) != -1):
			return true;
		case ((group.data.libraryEditing == 'members') &&
			(group.data.members) &&
			(group.data.members.indexOf(userID) != -1)):
			return true;
		default:
			return false;
	}
};

let groupIsReadable = function(group, userID) {
	let allMembers = allGroupMembers(group);

	if(group.data.type == 'PublicOpen' || group.data.type == 'PublicClosed'){
		if(group.data.libraryReading == 'all'){
			return true;
		}
		if(allMembers.indexOf(userID) != -1){
			return true;
		}
	} else {
		if(allMembers.indexOf(userID) != -1){
			return true;
		}
	}
	return false;
};

//component to list groups a user can invite another user to
class GroupMembershipActions extends React.Component{
	constructor(props){
		super(props);

		let applicationPending = false;
		let membershipInvitation = false;
		if(this.props.pending){
			if(this.props.pending.invitation == '1'){
				membershipInvitation = true;
			} else {
				applicationPending = true;
			}
		}
		this.state = {
			loading:false,
			pending:this.props.pending,
			applicationPending:applicationPending,
			membershipInvitation:membershipInvitation,
			ownershipInvitation:this.props.ownershipInvitation
		};
		this.joinGroup = this.joinGroup.bind(this);
		this.leaveGroup = this.leaveGroup.bind(this);
		this.acceptOwnership = this.acceptOwnership.bind(this);
		this.ignoreInvite = this.ignoreInvite.bind(this);
	}
	joinGroup(){
		let joinUrl = buildUrl('groupJoin', {group:this.props.group});
		let postData = {ajax:true};
		if(this.state.membershipInvitation){
			postData.token = this.state.pending.token;
		}
		postFormData(joinUrl, postData).then((resp)=>{
			return resp.json().then((data) => {
				if(data.pending === true){
					this.setState({applicationPending:true});
					jsSuccess('You have applied to join this group. A group admin must approve your application.');
				} else if(data.success === true){
					this.props.refreshGroup();
					this.setState({membershipInvitation:false});
					jsSuccess('You are now a member of this group');
				} else {
					jsError('There was a problem joining this group.');
				}
			});
		});
	}
	leaveGroup(){
		let leaveUrl = buildUrl('groupLeave', {group:this.props.group});
		postFormData(leaveUrl, {ajax:true}, {withSession:true}).then((resp)=>{
			return resp.json().then((data) => {
				if(data.success === true){
					this.props.refreshGroup();
					jsSuccess('You are no longer a member of this group');
				} else {
					jsError('There was a problem leaving this group. Please try again in a few minutes.');
				}
			});
		}).catch(()=>{
			jsError('There was a problem leaving this group. Please try again in a few minutes.');
		});
	}
	acceptOwnership(){
		let acceptUrl = buildUrl('groupAcceptOwnership', {group:this.props.group});
		postFormData(acceptUrl, {ajax:true}).then((resp)=>{
			return resp.json().then((data) => {
				if(data.success === true){
					let settingsUrl = buildUrl('groupSettings', {group:this.props.group});
					let message = `You're now the owner of this group. You can access all the group settings at ${settingsUrl}`;
					this.props.refreshGroup();
					this.setState({
						ownershipInvitation:false,
						notifier:<Notifier type='success' message={message} />
					});
				} else {
					jsError('There was a problem processing this action. Please try again in a few minutes.');
				}
			});
		});
	}
	ignoreInvite(){
		//log.debug('ignoreInvite');
		if(!this.state.pending || (this.state.pending.invitation != '1')){
			throw new Error('ignoreInvite called without pending invitation');
		}
		let token = this.state.pending.token;
		let ignoreUrl = buildUrl('groupDeclineInvitation', {group:this.props.group, token:token});
		//log.debug(`posting ignore: ${ignoreUrl}`);
		postFormData(ignoreUrl, {ajax:true, token:token}).then((resp)=>{
			return resp.json().then((data) => {
				if(data.success === true){
					this.setState({
						membershipInvitation:false
					});
					window.location = '/groups';
				} else {
					jsError('There was a problem processing this action. Please try again in a few minutes.');
				}
			});
		});
	}
	render(){
		if(!currentUser){
			return <p><a href={buildUrl('login')}>Log in</a> or <a href={buildUrl('register')}>Register</a> to join groups</p>;
		}
		let group = this.props.group;
		let member = allGroupMembers(group).includes(currentUser.userID);
		//log.debug(`member is ${member} in GroupMembershipActions render`);

		let controls = null;
		if(group.data.owner == currentUser.userID){
			controls = null;
		} else if(this.state.ownershipInvitation){
			controls = (
				<div className='join-group'>
					<p>You have been offered ownership of this group.</p>
					<button className={classnames('btn')} onClick={this.acceptOwnership}>Accept</button>
					<button className={classnames('btn', {'visually-hidden':!member})} onClick={this.leaveGroup}>Leave</button>
				</div>
			);
		} else if(this.state.membershipInvitation){
			controls = (
				<div className='join-group'>
					<p>You have been invited to join this group.</p>
					<button className={classnames('btn')} onClick={this.joinGroup}>Join</button>
					<button className={classnames('btn')} onClick={this.ignoreInvite}>Ignore</button>
				</div>
			);
		} else if(!member && this.state.applicationPending){
			controls = (
				<div className='join-group'>
					<p>Membership Pending</p>
				</div>
			);
		} else {
			controls = (
				<div className='join-group'>
					<button className={classnames('btn', {'visually-hidden':member})} onClick={this.joinGroup}>Join</button>
					<button className={classnames('btn', {'visually-hidden':!member})} onClick={this.leaveGroup}>Leave</button>
				</div>
			);
		}

		return (
			<div>
				{this.state.notifier}
				{controls}
			</div>
		);
	}
}
GroupMembershipActions.defaultProps = {
	member:false,
	pending:false,
	ownershipInvitation:false
};

//component to display the general information about a group
class GroupInfo extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			group:this.props.group
		};
		this.refreshGroup = this.refreshGroup.bind(this);
	}
	refreshGroup(){
		//log.debug('GroupInfo refreshGroup');
		let groupID = this.props.group.id;
		let groupUrl = apiRequestString({target:'group', libraryType:'group', libraryID:groupID});
		ajax({url:groupUrl, credentials:'omit'}).then((resp)=>{
			//log.debug(resp);
			resp.json().then((data)=>{
				this.setState({group:data});
			});
		}).catch(()=>{
			jsError('There was an error loading the updated group information');
			//log.debug('error refreshing group');
		});
	}
	render(){
		let group = this.state.group;
		let displayNames = this.props.displayNames;

		let groupImage = null;
		if(this.props.groupImage){
			groupImage = <img src={this.props.groupImage} alt="Group picture" id="group-image" />;
		}

		let groupDescription = null;
		if(group.data.description){
			groupDescription = <div dangerouslySetInnerHTML={{__html:group.data.description}}></div>;
		}

		let groupUrl = null;
		if(group.data.url){
			let url = striptags(group.data.url);
			groupUrl = <a href={url} rel='nofollow'>{url}</a>;
		}

		let created = new Date(group.meta.created);
		let groupMembership;
		if(group.data.type == 'Private'){
			groupMembership = 'Invitation';
		} else if(group.data.type == 'PublicClosed'){
			groupMembership = 'Closed';
		} else {
			groupMembership = 'Open';
		}

		let libraryAccess;
		if(!currentUser){
			libraryAccess = 'None';
		} else if(groupIsWritable(group, currentUser.userID)){
			libraryAccess = 'You can view and edit';
		} else if(groupIsReadable(group, currentUser.userID)){
			libraryAccess = 'You can only view';
		} else {
			libraryAccess = 'None';
		}
		return (
			<div>
				{groupImage}
				{groupDescription}
				{groupUrl}
				<ul className="group-information">
					<li>
						<span className="field">Owner:</span> 
						<span className="value">
						<a href={buildUrl('profileUrl', {slug:displayNames['slug'][group.data.owner]})}>{displayNames['displayName'][group.data.owner]}</a>
						</span>
					</li>
					<li>
						<span className="field">Registered:</span> <span className="value">{created.toISOString().substr(0,10)}</span>
					</li>
					<li>
						<span className="field">Type:</span> <span className="value">
							{group.data.type == 'Private' ? 'Private' : 'Public'}
						</span>
					</li>
					<li>
						<span className="field">Membership:</span> <span className="value">
							{groupMembership}
						</span>
					</li>
					<li>
						<span className="field">Library Access:</span> <span className="value">
							{libraryAccess}
						</span>
					</li>
				</ul>
				<GroupMembershipActions
					group={group}
					pending={this.props.pending}
					ownershipInvitation={this.props.ownershipInvitation}
					refreshGroup={this.refreshGroup} />
			</div>
		);
	}
}

export {GroupMembershipActions, GroupInfo, groupIsReadable};
