'use strict';

import {log as logger} from '../Log.js';
let log = logger.Logger('MemberSettingsContainer.jsx');

import {useState} from 'react';
import {Table} from 'reactstrap';

import {RolesTable} from './MemberRolesTable.jsx';
import {postFormData} from '../ajax.js';
import {buildUrl} from '../wwwroutes.js';
import { loadGroupInfo } from '../ajaxHelpers.js';

function PendingApplications(props){
	const {applications, group} = props;
	if(!applications || applications.length == 0){
		return null;
	}
	
	let applicationRows = applications.map((user)=>{
		return (
			<tr key={user.userID}>
				<td><a href={buildUrl('profileUrl', {slug:user.slug})} >{user.username}</a></td>
				<td>{user.displayName}</td>
				<td>{user.dateSent}</td>
				<td> <a href={buildUrl('groupApproveApplication', {group, userID:user.userID})}>Approve</a>{' '}
					| <a href={buildUrl('groupDenyApplication', {group, userID:user.userID})}>Deny</a> </td>
			</tr>
		);
	});
	return (
		<>
			<h2 className='main-heading'>Member Applications</h2>
			<Table striped>
				<thead>
					<tr>
						<th>Username</th>
						<th>Full Name</th>
						<th>Applied On</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					{applicationRows}
				</tbody>
			</Table>
		</>
	);
}

function PendingInvitations(props){
	const {invitations, group, displayNames} = props;
	
	if(!invitations || invitations.length == 0){
		return null;
	}
	
	let invitationRows = invitations.map((user) => {
		let displayName = user.userID ? displayNames['displayName'][user.userID] : user.username;
		return (
			<tr key={user.userID}>
				<td>{user.username ? user.username : user.email}</td>
				<td>{displayName}</td>
				<td> {user.dateSent}</td>
				<td><a href={buildUrl('groupRevokeInvitation', {group, token:user.token})}>Cancel</a> </td>
			</tr>
		);
	});
	return (
		<>
			<h2 className='main-heading mt-6'>Member Invitations</h2>
			<Table striped>
				<thead>
					<tr>
						<th>Username</th>
						<th>Full Name</th>
						<th>Invited On</th>
						<th>Cancel Invitation</th>
					</tr>
				</thead>
				<tbody>
					{invitationRows}
				</tbody>
			</Table>
		</>
	);
}
function MemberSettingsContainer(props){
	const {members, invitations, applications, displayNames} = props;
	const [group, setGroup] = useState(props.group);
	
	const refreshGroup = async (groupID) => {
		let resp = await loadGroupInfo(groupID);
		let group = await resp.json();
		setGroup(group);
		//return group;
	};
	
	const updateRole = async (member, group, role) => {
		let resp = await postFormData(buildUrl('groupUpdateRole', {group}), {userID:member.userID, role}, {withSession:true});
		let d = await resp.json();
		if(d.success){
			log.debug('success');
			refreshGroup(group.id);
		} else {
			log.error('error');
			//TODO:notify on errors
		}
	};
	
	return (<div>
		<PendingApplications {...{group, applications}} />
		<h2 className='main-heading'>Current Members</h2>
		<RolesTable {...{members, group, updateRole}} />
		<PendingInvitations {...{group, invitations, displayNames}} />
	</div>);
}

export {MemberSettingsContainer};