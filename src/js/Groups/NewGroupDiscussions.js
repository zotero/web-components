'use strict';

// import {log as logger} from '../Log.js';
// let log = logger.Logger('NewGroupDiscussions');

import {ajax} from '../ajax.js';
import {getCurrentUser, relativeTime} from '../Utils.js';
import {useEffect, useState} from 'react';
import {Table} from 'reactstrap';
import { buildUrl } from '../wwwroutes.js';
import {Paginator} from '../components/Paginator.jsx';

const currentUser = getCurrentUser();

//fetch most recent discussions for a single group
async function fetchGroupDiscussions(groupID, page, pageSize=10){
	let resp = await ajax({url:`/groups/groupdiscussions?groupID=${groupID}&page=${page}&limit=${pageSize}`});
	let data = await resp.json();
	return data;
}
//fetch most recent discussions for all user's groups
async function fetchUserGroupDiscussions(page, pageSize=10){
	let resp = await ajax({url:`/groups/usergroupdiscussions?page=${page}&limit=${pageSize}`});
	let data = await resp.json();
	return data;
}

function NewDiscussionLink(props){
	const {group} = props;
	return <a href={buildUrl('newGroupDiscussion', {group})}>New Discussion</a>;
}

function GroupDiscussionMessageSummary(props){
	const {messageID, title, sender, displayNames, lastActivity, rsender, group, showFields, narrow} = props;
	let lastActive = parseInt(lastActivity);
	let slug = displayNames['slug'][sender];
	let senderName = displayNames['displayName'][sender];
	let rSenderSlug = displayNames['slug'][rsender];
	
	if(narrow){
		let lastPosterNode = null;
		if(rsender){
			lastPosterNode = <span><a className="discussion-list-author" href={buildUrl('profileUrl', {slug:rSenderSlug})}>{displayNames['displayName'][rsender]}</a></span>;
		} else {
			lastPosterNode = <a href={buildUrl('profileUrl', {slug})}>{senderName}</a>;
		}
		let lastActiveNode = <td><span>Last Active: {relativeTime(lastActive)}</span> by {lastPosterNode}</td>;
		let groupInfoNode = showFields.group ? <td><span>Group: <a href={buildUrl('groupView', {group})}>{group.data.name}</a></span></td> : null;
	
		return (
			<tr className='group-discussion'>
				<td>
					<a href={buildUrl('groupDiscussion', {messageID})}>{title}</a>
				</td>
				{lastActiveNode}
				{groupInfoNode}
			</tr>
		);
	}
	
	let groupInfoNode = showFields.group ? <td><span>Group: <a href={buildUrl('groupView', {group})}>{group.data.name}</a></span></td> : null;
	let lastActiveNode = showFields.lastActive ? <td><span>Last Active: {relativeTime(lastActive)}</span></td> : null;
	let lastPosterNode = null;
	if(showFields.lastPoster){
		if(rsender){
			lastPosterNode = <td><span>Last Post: <a className="discussion-list-author" href={buildUrl('profileUrl', {slug:rSenderSlug})}>{displayNames['displayName'][rsender]}</a></span></td>;
		} else {
			lastPosterNode = <td><a href={buildUrl('profileUrl', {slug})}>{senderName}</a></td>;
		}
	}
	let starterNode = showFields.starter ? <td><a href={buildUrl('profileUrl', {slug})}>{senderName}</a></td> : null;
	return (
		<tr className='group-discussion'>
			<td>
				<a href={buildUrl('groupDiscussion', {messageID})}>{title}</a>
			</td>
			{starterNode}
			{lastActiveNode}
			{lastPosterNode}
			{groupInfoNode}
		</tr>
	);
}
GroupDiscussionMessageSummary.defaultProps = {
	showFields:{
		starter:true,
		lastActive:true,
		lastPoster:true,
		group:true
	}
};

function NewGroupDiscussions(props) {
	const [discussions, setDiscussions] = useState(null);
	const [displayNames, setDisplayNames] = useState({});
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [loaded, setLoaded] = useState(false);
	
	const {group, pageSize, allGroups, showFields, narrow} = props;
	
	useEffect(() => {
		const ld = async ()=>{
			if(!currentUser){
				return;
			}
			let data;
			if(allGroups){
				data = await fetchUserGroupDiscussions(page, pageSize);
			} else {
				if(!group){
					return;
				}
				data = await fetchGroupDiscussions(group.id, page, pageSize);
			}
			setDisplayNames(data.displayNames);
			setDiscussions(data.discussions);
			setTotal(parseInt(data.count));
			setLoaded(true);
		};
		ld();
	}, [group, page, allGroups]);
	
	if(!currentUser || !loaded){
		return null;
	}
	let discussionsNodes = discussions ? discussions.map((discussion)=>{
		return <GroupDiscussionMessageSummary key={discussion.messageID} {...discussion} {...{displayNames, group, showFields, narrow}} />;
	}) : null;
	let recentMessagesBody = allGroups ? <p>You do not have any active discussions</p> : <p>This group does not have any active discussions</p>;
	if(discussions){
		recentMessagesBody = (
			<>
				<Table id='recent-group-message'>
					<tbody>
					{discussionsNodes}
					</tbody>
				</Table>
				<Paginator page={page} setPage={setPage} total={total}  />
			</>
		);
	}
	return (
		<div className='new-group-discussions card'>
			<div className='card-header'>Recent Group Discussions</div>
			<div className='card-body'>
				{recentMessagesBody}
				{allGroups ? null : <NewDiscussionLink group={group} />}
			</div>
		</div>
	);
}
NewGroupDiscussions.defaultProps = {
	group:null,
	pageSize:10,
	showGroup:false,
	showFields:{
		starter:true,
		lastActive:true,
		lastPoster:true,
		group:true
	}
};

export {NewGroupDiscussions};
