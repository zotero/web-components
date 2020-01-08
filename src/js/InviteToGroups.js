import { log as logger } from './Log.js';
let log = logger.Logger('InviteToGroups');

import { ajax, postFormData, loadAllUserGroups } from './ajax.js';
import { LoadingSpinner } from './LoadingSpinner.js';
import { buildUrl } from './wwwroutes.js';
import { jsError, getCurrentUser } from './Utils.js';
import { ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

const currentUser = getCurrentUser();

import { useState } from 'react';
import PropTypes from 'prop-types';

// component to list groups a user can invite another user to
function InviteToGroups(props) {
	let { userID, invitee } = props;

	const [userGroups, setUserGroups] = useState([]);
	const [alreadyInvited, setAlreadyInvited] = useState(null);
	const [alreadyInvitedLoaded, setAlreadyInvitedLoaded] = useState(false);
	const [invitationsSent, setInvitationsSent] = useState([]);
	const [userGroupsLoaded, setUserGroupsLoaded] = useState(false);
	const [loadingGroups, setLoadingGroups] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);

	const toggle = () => {
		if (!userGroupsLoaded) {
			if (!loadingGroups) {
				setLoadingGroups(true);
				loadGroupData();
			}
		}
		setDropdownOpen(!dropdownOpen);
	};

	const loadGroupData = async () => {
		let inviteeUserID = invitee.userID;
		if (!userID && currentUser) {
			userID = currentUser.userID;
		}

		if (!userID) {
			throw new Error('no userID');
		}
		if (!inviteeUserID) {
			throw new Error('no user to invite');
		}

		try {
			const loadedGroups = await loadAllUserGroups(userID);
			setUserGroups(loadedGroups);
			setUserGroupsLoaded(true);
		} catch (e) {
			jsError('Error getting groups');
			log.error(e);
		}

		// load list of groups user has already been invited to
		let alreadyInvitedUrl = `/user/${inviteeUserID}/alreadyinvited`;
		try {
			let resp = await ajax({ url: alreadyInvitedUrl, withSession: true });
			let data = await resp.json();
			if (data.success) {
				setAlreadyInvited(data.alreadyInvited);
				setAlreadyInvitedLoaded(true);
			} else {
				throw new Error('Error getting already invited');
			}
		} catch (e) {
			jsError('Error getting invitations');
			log.error(e);
		}
	};

	const inviteToGroup = async (groupID) => {
		let group;
		userGroups.forEach((ugroup) => {
			if (ugroup.id == groupID) {
				group = ugroup;
			}
		});

		try {
			let resp = await postFormData(buildUrl('groupInvite'), { groupID: group.id, userID: invitee.userID, ajax: true });
			let data = await resp.json();
			if (data.success) {
				let updatedSent = invitationsSent;
				updatedSent.push(parseInt(groupID));
				setInvitationsSent(updatedSent);
			} else {
				throw data;
			}
		} catch (e) {
			jsError('Error sending invitation');
			log.error(e);
		}
	};

	// populate list of groups user has permission to send invites for, and profileUser is not already
	// a member or has an invitation pending
	let invitableGroups = false;
	if (userGroupsLoaded && alreadyInvitedLoaded) {
		let inviteeUserID = invitee.userID;

		// build list of groups invitee can be invited to by user
		invitableGroups = [];
		for (let group of userGroups) {
			let members = group.data.members ? group.data.members : [];
			let admins = group.data.admins ? group.data.admins : [];
			// if viewer is group admin (has invite permissions) or group is open
			if (admins.includes(userID) || (group.data.owner === userID)) { // || (group.data.type == 'PublicOpen') ? Should any user be able to invite others to a public open group?
				// profileUser not already Member
				if (!admins.includes(inviteeUserID) && !members.includes(inviteeUserID) && group.data.owner !== inviteeUserID) {
					// check if user already has invite
					if (!alreadyInvited.includes(group.id)) {
						// log.debug(`adding ${group.data.name} to invitableGroups`);
						invitableGroups.push(group);
					}
				}
			}
		}
	}

	if (!userID) {
		return null;
	}
	if (userID == invitee.userID) {
		return null;
	}

	let inviteSection = null;
	let pendingInvitations = null;

	let groupMap = {};
	userGroups.forEach((group) => {
		groupMap[group.id] = group;
	});

	if (invitableGroups !== false) {
		// filter out invitableGroups that user has just invited profileUser to
		invitableGroups = invitableGroups.filter((group) => {
			if (invitationsSent.includes(group.id)) {
				return false;
			}
			return true;
		});

		// if there are any invitable groups, make an invite section with options
		// otherwise inform user that profileUser has already been invited, or user has no groups
		// to issue invites for
		let inviteOptions;
		if (invitableGroups.length > 0) {
			inviteOptions = invitableGroups.map((group) => {
				return (<DropdownItem key={group.id} value={group.id} onClick={() => { inviteToGroup(group.id); }}>{group.data.name}</DropdownItem>);

				/* return <option key={group.id} value={group.id} label={group.data.name}>{group.data.name}</option>;*/
			});

			inviteSection = (
				<>
					<DropdownItem header>Invite To</DropdownItem>
					{inviteOptions}
				</>
			);
		} else if (alreadyInvited.length == 0) {
			inviteSection = (
				<DropdownItem>You don&apos;t currently have any groups to invite {invitee.displayName} to.
				If you haven&apos;t previously invited them to your group, make sure you are an admin for
				the group, or <a href={buildUrl('groupCreate')}>create a new group</a> to collaborate with other users.</DropdownItem>
			);
		}

		if (invitationsSent.length > 0 || alreadyInvited.length > 0) {
			let invitationsSentNodes = invitationsSent.map((groupID) => {
				let group = groupMap[groupID];
				return (
					<DropdownItem key={group.id} disabled>{group.data.name}</DropdownItem>
				);
			});

			let alreadyInvitedNodes = alreadyInvited.map((groupID) => {
				let group = groupMap[groupID];
				return (
					<DropdownItem key={group.id} disabled>{group.data.name}</DropdownItem>
				);
			});

			pendingInvitations = (
				<>
					<DropdownItem header>Pending invitations</DropdownItem>
					{invitationsSentNodes}
					{alreadyInvitedNodes}
				</>
			);
		}
	}

	const loading = (!userGroupsLoaded) || (!alreadyInvitedLoaded);

	return (
		<div id='invite-to-group'>
			<ButtonDropdown isOpen={dropdownOpen} toggle={toggle}>
				<DropdownToggle caret>
					Invite to group
				</DropdownToggle>
				<DropdownMenu>
					<LoadingSpinner loading={loading} />
					{inviteSection}
					{pendingInvitations}
				</DropdownMenu>
			</ButtonDropdown>
		</div>
	);
}
InviteToGroups.defaultProps = {
	titleOnly: false,
	invitee: false,
	userID: currentUser.userID || false
};
InviteToGroups.propTypes = {
	userID: PropTypes.number,
	invitee: PropTypes.object,
};

export { InviteToGroups };
