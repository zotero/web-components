// import {log as logger} from '../Log.js';
// let log = logger.Logger('GroupsPageContainer');

import { useEffect, useState } from 'react';

import { UserGroups } from './UserGroups.js';
import { GroupInvitations } from './GroupInvitations.js';
import { NewGroupDiscussions } from './NewGroupDiscussions.js';

import { getCurrentUser } from '../Utils.js';
const currentUser = getCurrentUser();
import { ajax } from '../ajax.js';
import { apiRequestString } from '../ApiRouter.js';

let loadGroups = async (userID = false, start = 0) => {
	if (!userID) {
		if (currentUser) {
			userID = currentUser.userID;
		} else {
			return { groupsLoaded: true, loading: false };
		}
	}
	if (userID) {
		let url = apiRequestString({
			target: 'userGroups',
			libraryType: 'user',
			libraryID: userID,
			order: 'title',
			limit: 25,
			start
		});
		let resp = await ajax({ url: url, credentials: 'omit' });
		let totalResults = parseInt(resp.headers.get('Total-Results'));
		let data = await resp.json();
		let groups = data;
		return { userID, groups, totalResults, loading: false };
	} else {
		return { groupsLoaded: true, loading: false };
	}
};

function GroupsPageContainer() {
	const [groupData, setGroupData] = useState({ loading: true, groupsLoaded: false, titleOnly: false });
	
	useEffect(() => {
		const fetchData = async () => {
			let data = await loadGroups();
			data.groupsLoaded = true;
			data.loading = false;
			setGroupData(data);
		};
		
		fetchData();
	}, []);
	
	if (!currentUser) {
		return (
			<div className='row'>
				<div className='col'>
					<h1 className='main-heading'>Groups</h1>
					<UserGroups {...groupData} />
				</div>
			</div>
		);
	}
	return (
		<div className='row'>
			<div className='col-md-8'>
				<h1 className='main-heading'>Groups</h1>
				<UserGroups {...groupData} />
			</div>
			<div className='col-md-4'>
				<nav className='nav nav-pills justify-content-center mb-4'>
					<a className='nav-link active' href='/groups/new'>Create a New Group</a>
					<a className='nav-link' href='/search/type/group'>Search for Groups</a>
				</nav>
				
				<div id='group-alerts' className='alerts'>
					<GroupInvitations />
				</div>
				
				{groupData.loading ? null : <NewGroupDiscussions allGroups={true} narrow={true} showFields={{ title: true, lastActive: true, lastPoster: true }} />}
				
			</div>
		</div>
	);
}

export { GroupsPageContainer };
