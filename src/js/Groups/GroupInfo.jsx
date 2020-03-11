// import {log as logger} from './Log.js';
// let log = logger.Logger('GroupInfo');

import { Notifier } from '../Notifier.js';
import { postFormData } from '../ajax.js';
import { loadGroupInfo } from '../ajaxHelpers.js';
import { buildUrl } from '../wwwroutes.js';
import { jsError, jsSuccess, getCurrentUser } from '../Utils.js';
import classnames from 'classnames';
import striptags from 'striptags';

import { useState } from 'react';
import PropTypes from 'prop-types';

const currentUser = getCurrentUser();

let allGroupMembers = function (group) {
	let members = group.data.hasOwnProperty('members') ? group.data.members : [];
	let admins = group.data.hasOwnProperty('admins') ? group.data.admins : [];
	let allMembers = [group.data.owner, ...members, ...admins];
	return allMembers;
};

let groupIsWritable = function (group, userID) {
	let admins = group.data.admins;
	if (!admins) {
		admins = [];
	}

	switch (true) {
	case group.data.owner == userID:
		return true;
	case (admins.indexOf(userID) != -1):
		return true;
	case ((group.data.libraryEditing == 'members')
			&& (group.data.members)
			&& (group.data.members.indexOf(userID) != -1)):
		return true;
	default:
		return false;
	}
};

let groupIsReadable = function (group, userID) {
	let allMembers = allGroupMembers(group);

	if (group.data.type == 'PublicOpen' || group.data.type == 'PublicClosed') {
		if (group.data.libraryReading == 'all') {
			return true;
		}
		if (allMembers.indexOf(userID) != -1) {
			return true;
		}
	} else if (allMembers.indexOf(userID) != -1) {
		return true;
	}
	return false;
};

// component to list groups a user can invite another user to
function GroupMembershipActions(props) {
	const { group, refreshGroup } = props;
	const [loading, setLoading] = useState(false);
	const [pending, setPending] = useState(props.pending);
	const [applicationPending, setApplicationPending] = useState(props.pending && props.pending.invitation == '0');
	const [membershipInvitation, setMembershipInvitation] = useState(props.pending && props.pending.invitation == '1');
	const [ownershipInvitation, setOwnershipInvitation] = useState(props.ownershipInvitation);
	const [notifier, setNotifier] = useState(null);

	const joinGroup = async () => {
		let joinUrl = buildUrl('groupJoin', { group });
		let postData = { ajax: true };
		if (membershipInvitation) {
			postData.token = pending.token;
		}
		let resp = await postFormData(joinUrl, postData);
		let data = await resp.json();
		if (data.pending === true) {
			setApplicationPending(true);
			jsSuccess('You have applied to join this group. A group admin must approve your application.');
		} else if (data.success === true) {
			refreshGroup();
			setMembershipInvitation(false);
			jsSuccess('You are now a member of this group');
		} else {
			jsError('There was a problem joining this group.');
		}
	};

	const leaveGroup = async () => {
		let leaveUrl = buildUrl('groupLeave', { group });
		let resp = await postFormData(leaveUrl, { ajax: true }, { withSession: true });
		let data = await resp.json();
		if (data.success === true) {
			refreshGroup();
			jsSuccess('You are no longer a member of this group');
		} else {
			jsError('There was a problem leaving this group. Please try again in a few minutes.');
		}
	};

	const acceptOwnership = async () => {
		let acceptUrl = buildUrl('groupAcceptOwnership', { group });
		let resp = await postFormData(acceptUrl, { ajax: true });
		let data = await resp.json();
		if (data.success === true) {
			let settingsUrl = buildUrl('groupSettings', { group });
			let message = `You're now the owner of this group. You can access all the group settings at ${settingsUrl}`;
			refreshGroup();
			setOwnershipInvitation(false);
			setNotifier(<Notifier type='success' message={message} />);
		} else {
			jsError('There was a problem processing this action. Please try again in a few minutes.');
		}
	};

	const ignoreInvite = async () => {
		// log.debug('ignoreInvite');
		if (!pending || (pending.invitation != '1')) {
			throw new Error('ignoreInvite called without pending invitation');
		}
		let token = pending.token;
		let ignoreUrl = buildUrl('groupDeclineInvitation', { group, token });
		// log.debug(`posting ignore: ${ignoreUrl}`);
		let resp = await postFormData(ignoreUrl, { ajax: true, token: token });
		let data = await resp.json();
		if (data.success === true) {
			setMembershipInvitation(false);
			window.location = '/groups';
		} else {
			jsError('There was a problem processing this action. Please try again in a few minutes.');
		}
	};

	// render
	if (!currentUser) {
		return <p><a href={buildUrl('login')}>Log in</a> or <a href={buildUrl('register')}>Register</a> to join groups</p>;
	}
	let member = allGroupMembers(group).includes(currentUser.userID);
	
	let controls = null;
	if (group.data.owner == currentUser.userID) {
		controls = null;
	} else if (ownershipInvitation) {
		controls = (
			<div className='join-group'>
				<p>You have been offered ownership of this group.</p>
				<button className={classnames('btn', 'mr-3')} onClick={acceptOwnership}>Accept</button>
				<button className={classnames('btn', 'mr-3', { 'd-none': !member })} onClick={leaveGroup}>Leave</button>
			</div>
		);
	} else if (membershipInvitation) {
		controls = (
			<div className='join-group'>
				<p>You have been invited to join this group.</p>
				<button className={classnames('btn', 'mr-3')} onClick={joinGroup}>Join</button>
				<button className={classnames('btn', 'mr-3')} onClick={ignoreInvite}>Ignore</button>
			</div>
		);
	} else if (!member && applicationPending) {
		controls = (
			<div className='join-group'>
				<p>Membership Pending</p>
			</div>
		);
	} else {
		controls = (
			<div className='join-group'>
				<button className={classnames('btn', 'mr-3', { 'd-none': member })} onClick={joinGroup}>Join</button>
				<button className={classnames('btn', 'mr-3', { 'd-none': !member })} onClick={leaveGroup}>Leave</button>
			</div>
		);
	}

	return (
		<div>
			{notifier}
			{controls}
		</div>
	);
}
GroupMembershipActions.defaultProps = {
	member: false,
	pending: false,
	ownershipInvitation: false
};
GroupMembershipActions.propTypes = {
	group: PropTypes.shape({
		data: PropTypes.shape({
			owner: PropTypes.number
		})
	}),
	refreshGroup: PropTypes.func,
	pending: PropTypes.shape({
		invitation: PropTypes.string,
		token: PropTypes.string,
	}),
	ownershipInvitation: PropTypes.bool,
};

// component to display the general information about a group
function GroupInfo(props) {
	const { displayNames } = props;
	const [group, setGroup] = useState(props.group);

	const refreshGroup = async () => {
		// log.debug('GroupInfo refreshGroup');
		let groupID = group.id;
		try {
			let resp = await loadGroupInfo(groupID);
			let data = await resp.json();
			setGroup(data);
		} catch (e) {
			jsError('There was an error loading the updated group information');
		}
	};

	let groupImage = null;
	if (props.groupImage) {
		groupImage = <img src={props.groupImage} alt='Group picture' id='group-image' />;
	}

	let groupDescription = null;
	let groupUrl = null;
	if (group.data.url) {
		let url = striptags(group.data.url);
		groupUrl = <a href={url} rel='nofollow'>{url}</a>;
	}

	let created = new Date(group.meta.created);
	let groupMembership;
	if (group.data.type == 'Private') {
		groupMembership = 'Invitation';
	} else if (group.data.type == 'PublicClosed') {
		groupMembership = 'Closed';
	} else {
		groupMembership = 'Open';
	}

	let libraryAccess;
	if (!currentUser) {
		if (groupIsReadable(group, 0)) {
			libraryAccess = 'You can only view';
		} else {
			libraryAccess = 'None';
		}
	} else if (groupIsWritable(group, currentUser.userID)) {
		libraryAccess = 'You can view and edit';
	} else if (groupIsReadable(group, currentUser.userID)) {
		libraryAccess = 'You can only view';
	} else {
		libraryAccess = 'None';
	}
	return (
		<div className='card border-0 mb-4'>
			{groupImage}
			{groupDescription}
			{groupUrl}
			<table className='table'>
				<tbody>
					<tr>
						<th scope='row'>Owner:</th>
						<td>
							<a href={buildUrl('profileUrl', { slug: displayNames.slug[group.data.owner] })}>{displayNames.displayName[group.data.owner]}</a>
						</td>
					</tr>
					<tr>
						<th scope='row'>Registered:</th>
						<td>
							{created.toISOString().substr(0, 10)}
						</td>
					</tr>
					<tr>
						<th scope='row'>Type:</th>
						<td>
							{group.data.type == 'Private' ? 'Private' : 'Public'}
						</td>
					</tr>
					<tr>
						<th scope='row'>Membership:</th>
						<td>
							{groupMembership}
						</td>
					</tr>
					<tr>
						<th scope='row'>Library Access:</th>
						<td>
							{libraryAccess}
						</td>
					</tr>
				</tbody>
			</table>
			
			<GroupMembershipActions
				group={group}
				pending={props.pending}
				ownershipInvitation={props.ownershipInvitation}
				refreshGroup={refreshGroup} />
		</div>
	);
}
GroupInfo.propTypes = {
	displayNames: PropTypes.object.isRequired,
	pending: PropTypes.bool.isRequired,
	ownershipInvitation: PropTypes.bool,
	group: PropTypes.shape({
		data: PropTypes.shape({
			owner: PropTypes.number
		})
	}),
	groupImage: PropTypes.string,
};

export { GroupMembershipActions, GroupInfo, groupIsReadable };
