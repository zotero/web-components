'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('UserGroups');

import {ajax} from './ajax.js';
import {apiRequestString} from './ApiRouter.js';
import {LoadingSpinner} from './LoadingSpinner.js';
import {buildUrl} from './wwwroutes.js';
import {getCurrentUser} from './Utils.js';
import {accessMap, typeMap} from './maps/groupMaps.js';

const currentUser = getCurrentUser();

let React = require('react');
const {Component, Fragment} = React;
import PropTypes from 'prop-types';

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
		let style = {'margin':'auto'};
		return (
			<video id='group-intro-screencast' src="/static/videos/group_intro.m4v" controls={true} height='450px' poster='/static/images/group/playvideo.jpg' style={style}>
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
				<Fragment>
					<a className="nav-link" href={buildUrl('groupSettings', {group})}>Manage Profile</a>
					<a className="nav-link" href={buildUrl('groupMemberSettings', {group})}>Manage Members</a>
					<a className="nav-link" href={buildUrl('groupLibrarySettings', {group})}>Manage Library</a>
				</Fragment>
			);
		}
		let groupLinks = (
			<nav className="nav">
				<a className="nav-link" href={buildUrl('groupLibrary', {group})}>Group Library</a>
				{manageLinks}
			</nav>
		);

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
			<div className="card nugget-full">
				<div className="card-header">
					{groupImage}
					<div className="nugget-name">
						<a href={buildUrl('groupView', {group})}>{group.data.name}</a>
					</div>
				</div>
				<div className="card-body">
					{groupLinks}
					<table className="table">
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
		if(!currentUser){
			nonUserLink =  (
				<div className="login-links">
					<a href="/user/register"><b>Sign up now</b></a> or <a href="/user/login">log in</a>
				</div>
			);
		}
		return (
			<div id="group-explainer" className="mt-5">
				<h2 className="text-center">What can groups do for you?</h2>
				<p>With groups, you can collaborate remotely with project members, set
				up web-based bibliographies for classes you teach, and so much more.
				</p>
				<ul>
					<li><strong>Share</strong> your own work or sources you have discovered with others who are working in related areas.</li>
					<li><strong>Collaborate</strong> with colleagues, publicly or privately, on ongoing research.</li>
					<li><strong>Discover</strong> other people with similar interests and the sources they are citing.</li>
				</ul>
				<div className='text-center'>
					<IntroVideo />
					{nonUserLink}
				</div>
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
	loadGroups = async (evt) => {
		if(evt){
			evt.preventDefault();
		}
		let userID = false;
		if(this.props.userID){
			userID = this.props.userID;
		} else if(currentUser){
			userID = currentUser.userID;
		} else {
			this.setState({
				groupsLoaded:true
			});
		}
		if(userID){
			this.setState({loading:true});
			let url = apiRequestString({
				'target':'userGroups',
				'libraryType':'user',
				'libraryID': userID,
				'order':'title',
				'limit':25,
				'start':(this.state.groupsLoaded ? this.state.groups.length : 0)
			});
			let resp = await ajax({url: url, credentials:'omit'});
			let totalResults = parseInt(resp.headers.get('Total-Results'));
			let data = await resp.json();
			let groups = this.state.groups;
			groups = groups.concat(data);
			this.setState({
				groups:groups,
				userID: userID,
				loading:false,
				groupsLoaded:true,
				totalResults:totalResults
			});
		}
	}
	componentDidMount(){
		this.loadGroups();
	}
	render(){
		let {titleOnly, ownedOnly} = this.props;
		let {groups, userID} = this.state;

		if(ownedOnly){
			groups = groups.filter((group)=>{
				return userID == group.data.owner;
			});
		}
		//Nugget entry for each group
		var groupNuggets = groups.map(function(group){
			return (
				<GroupNugget key={group.id} group={group} userID={userID} titleOnly={titleOnly} />
			);
		});

		let moreLink = null;
		if(this.state.groupsLoaded && this.state.totalResults > groups.length){
			moreLink = <a href='#' onClick={this.loadGroups}>More</a>;
		}

		//render group explainer text if the user has no groups (or is not logged in)
		if(this.state.groupsLoaded && groups.length == 0 && !titleOnly) {
			return <GroupsExplainer />;
		}

		return (
			<div id="user-groups-div" className="user-groups">
				{groupNuggets}
				<LoadingSpinner loading={this.state.loading} />
				{moreLink}
			</div>
		);
	}
}
UserGroups.defaultProps =  {
	titleOnly:false,
	userID:false,
	ownedOnly: false,
};

export {UserGroups, GroupNugget};
