'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('UserGroups');

import {ajax} from './ajax.js';
import {apiRequestString} from './ApiRouter.js';
import {LoadingSpinner} from './LoadingSpinner.js';
import {buildUrl} from './wwwroutes.js';

let React = require('react');
const {Component} = React;
import PropTypes from 'prop-types';

let accessMap = {
	'all'     : {
		'members' : 'Anyone can view, only members can edit',
		'admins'  : 'Anyone can view, only admins can edit'
	},
	'members' : {
		'members' : 'Only members can view and edit',
		'admins'  : 'Only members can view, only admins can edit'
	},
	'admins'  : {
		'members' : 'Only admins can view, only members can edit',
		'admins'  : 'Only admins can view and edit'
	}
};

let typeMap = {
	'Private': 'Private',
	'PublicOpen': 'Public, Open Membership',
	'PublicClosed': 'Public, Closed Membership'
};

/*
let groupIsWritable = function(group, userID) {
	let admins = group.data.admins;
	if(!admins){
		admins = [];
	}

	switch(true){
		case group.get('owner') == userID:
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
*/

class IntroVideo extends Component{
	render(){
		return (
			<video id='group-intro-screencast' src="/static/videos/group_intro.m4v" controls='true' height='450px' poster='/static/images/group/playvideo.jpg'>
				Sorry, your browser doesn't support embedded videos.
			</video>
		);
	}
}

class GroupNugget extends Component{
	render(){
		let group = this.props.group;
		let userID = this.props.userID;

		let groupManageable = false;
		let memberCount = 1; //owner

		let members = group.data.members ? group.data.members : [];
		let admins = group.data.admins ? group.data.admins : [];

		memberCount += members.length;
		memberCount += admins.length;
		
		if(this.props.titleOnly){
			return (
				<div key={group.id}>
					<div className="nugget-name">
						<a href={buildUrl('groupView', {group})}>{group.data.name} ({memberCount})</a>
					</div>
				</div>
			);
		}
		
		if(userID && (userID == group.data.owner || (admins.includes(userID)))) {
			groupManageable = true;
		}
		
		let groupImage = null;
		if(group.hasImage){
			groupImage = (
				<a href={buildUrl('groupView', {group})} className="group-image">
					<img src={buildUrl('groupImageUrl', {groupID:group.id, purpose:'profile'})} alt="" />
				</a>
			);
		}

		let manageLinks = null;
		if(groupManageable){
			manageLinks = (
				<nav className="action-links">
					<li><a href={buildUrl('groupSettings', {group})}>Manage Profile</a></li>
					<li><a href={buildUrl('groupMemberSettings', {group})}>Manage Members</a></li>
					<li><a href={buildUrl('groupLibrarySettings', {group})}>Manage Library</a></li>
				</nav>
			);
		}

		let groupDescription = null;
		if(group.data.description){
			let markup = {__html: group.data.description};
			groupDescription = (
				<tr>
					<th scope="row">Description</th> 
					<td dangerouslySetInnerHTML={markup}></td>
				</tr>
			);
		}

		let libAccess = accessMap[group.data.libraryReading][group.data.libraryEditing];
		if(group.data.type == 'Private' && group.data.libraryReading == 'all'){
			libAccess = accessMap['members'][group.data.libraryEditing];
		}

		return (
			<div className="nugget-group">
				<div className="nugget-full">
					{groupImage}
					<div className="nugget-name">
						<a href={buildUrl('groupView', {group})}>{group.data.name}</a>
					</div>
					<nav id="group-library-link-nav" className="action-links">
						<ul>
						<li><a href={buildUrl('groupLibrary', {group})}>Group Library</a></li>
						</ul>
					</nav>
					{manageLinks}
					<table className="nugget-profile table">
						<tbody>
						<tr>
							<th scope="row">Members</th>
							<td>{memberCount}</td>
						</tr>
						{groupDescription}
						<tr>
							<th scope="row">Group Type</th>
							<td>{typeMap[group.data.type]}</td>
						</tr>
						<tr>
							<th scope="row">Group Library</th>
							<td>
								{libAccess}
							</td>
						</tr>
						</tbody>
					</table>
				</div>
			</div>
		);
	}
}
GroupNugget.defaultProps = {titleOnly:false};
GroupNugget.propTypes = {
	group: PropTypes.shape({
		id: PropTypes.number.isRequired,
		data: PropTypes.shape({
			id: PropTypes.number.isRequired,
			name: PropTypes.string.isRequired,
			type: PropTypes.string.isRequired
		}).isRequired
	}).isRequired
};


class GroupsExplainer extends Component{
	render(){
		let nonUserLink = null;
		if(!Zotero.currentUser){
			nonUserLink =  (
				<div className="login-links">
					<a href="/user/register"><b>Sign up now</b></a> or <a href="/user/login">log in</a>
				</div>
			);
		}
		return (
			<div id="group-explainer">
				<h2>What can groups do for you?</h2>
				<p>With groups, you can collaborate remotely with project members, set
				up web-based bibliographies for classes you teach, and so much more.
				</p>
				<ul>
					<li><strong>Share</strong> your own work or sources you have discovered with others who are working in related areas.</li>
					<li><strong>Collaborate</strong> with colleagues, publicly or privately, on ongoing research.</li>
					<li><strong>Discover</strong> other people with similar interests and the sources they are citing.</li>
				</ul>
				<IntroVideo />
				{nonUserLink}
			</div>
		);
	}
}

class UserGroups extends Component{
	constructor(props){
		super(props);
		this.state = {
			groups: [],
			loading:false,
			userID:false,
			groupsLoaded:false
		};
	}
	componentDidMount(){
		let userID = false;
		if(this.props.userID){
			userID = this.props.userID;
		} else if(Zotero.currentUser){
			userID = Zotero.currentUser.userID;
		} else {
			this.setState({
				groupsLoaded:true
			});
		}
		if(userID){
			log.debug(`loading groups for user ${userID}`);
			this.setState({loading:true});
			let url = apiRequestString({
				'target':'userGroups',
				'libraryType':'user',
				'libraryID': userID,
				'order':'title'
			});
			ajax({url: url, credentials:'omit'}).then((resp)=>{
				resp.json().then((data) => {
					this.setState({
						groups:data,
						userID: userID,
						loading:false,
						groupsLoaded:true
					});
				});
			});
		}
	}
	render(){
		let groups = this.state.groups;
		let userID = this.state.userID;
		let titleOnly = this.props.titleOnly;

		//Nugget entry for each group
		var groupNuggets = groups.map(function(group){
			return (
				<GroupNugget key={group.id} group={group} userID={userID} titleOnly={titleOnly} />
			);
		});

		//render group explainer text if the user has no groups (or is not logged in)
		if(this.state.groupsLoaded && groups.length == 0 && !titleOnly) {
			return <GroupsExplainer />;
		}

		return (
			<div id="user-groups-div" className="user-groups">
				{groupNuggets}
				<LoadingSpinner loading={this.state.loading} />
			</div>
		);
	}
}
UserGroups.defaultProps =  {
	titleOnly:false,
	userID:false
};

export {UserGroups, GroupNugget};
