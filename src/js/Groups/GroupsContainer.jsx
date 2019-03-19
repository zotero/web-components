'use strict';

// import {log as logger} from '../Log.js';
// let log = logger.Logger('GroupsContainer');

import {useEffect, useState} from 'react';

import {UserGroups} from './UserGroups.js';
import {getCurrentUser} from '../Utils.js';
const currentUser = getCurrentUser();
import {ajax} from '../ajax.js';
import {apiRequestString} from '../ApiRouter.js';

let loadGroups = async (userID=false, start=0) => {
	if(!userID) {
		if(currentUser){
			userID = currentUser.userID;
		} else {
			return {groupsLoaded:true};
		}
	}
	if(userID){
		let url = apiRequestString({
			'target':'userGroups',
			'libraryType':'user',
			'libraryID': userID,
			'order':'title',
			'limit':25,
			start
		});
		let resp = await ajax({url: url, credentials:'omit'});
		let totalResults = parseInt(resp.headers.get('Total-Results'));
		let data = await resp.json();
		let groups = data;
		return {userID, groups, totalResults, loading:false};
	} else {
		return {groupsLoaded:true, loading:false};
	}
};

function GroupsContainer(props){
	const [groupData, setGroupData] = useState({loading:true});
	
	useEffect(()=>{
		const fetchData = async ()=>{
			let data = await loadGroups();
			setGroupData(data);
		};
		
		fetchData();
	}, []);
	
	let d = Object.assign({}, props, groupData);
	return (<UserGroups {...d} />);
}

export {GroupsContainer};