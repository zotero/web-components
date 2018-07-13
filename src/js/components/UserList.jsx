'use strict';

import {log as logger} from '../Log.js';
let log = logger.Logger('UserList');

const React = require('react');
const {Component, PureComponent, Fragment} = React;
import {PropTypes} from 'prop-types';
import {getCurrentUser} from '../Utils.js';
import { buildUrl } from '../wwwroutes.js';

import {Button, CardGroup} from 'reactstrap';
import { ProfileImage } from '../ProfileImageForm.js';

class SmallUser extends Component {
	
	render() {
		const {user} = this.props;
		const profileUrl = buildUrl('profileUrl', {slug:user.slug});
		const profileImageSrc = buildUrl('profileImage', {userID:user.userID, purpose:'thumb'});
		return (
			<div className="nugget-user-small card border-0">
				<div className='card-body border-top'>
					<a href={profileUrl}>
						<ProfileImage hasImage={user.hasImage} type='user' entityID={user.userID} width='100px' height='100px' />
						{/*<img className="small-profile-image float-left mr-3" src={profileImageSrc} alt={user.slug} title={user.slug} />*/}
					</a>
					<div className="nugget-name card-title">
						<a href={profileUrl}>{user.displayName}</a>
					</div>
					{user.hasOwnProperty('affiliation') ?
						<div className="nugget-affiliation card-subtitle text-muted">{user.affiliation}</div> :
						null}
				</div>
			</div>
		);
	}
}
class UserList extends Component{
	constructor(props){
		super(props);
	}
	render() {
		const {users, title, perRow} = this.props;
		log.debug(users);
		if(!users.length){
			return null;
		}

		let userNodes = users.map((user)=>{
			return <SmallUser key={user.userID} user={user} />;
		});

		let rowGroups = [];
		let children = [];
		for(let i=0; i<userNodes.length; i++){
			children.push(userNodes[i]);
			if((children.length == perRow) || (i == userNodes.length-1)){
				rowGroups.push(
					<CardGroup key={children[0].key}>
						{children}
					</CardGroup>
				);
				children = [];
			}
		}

		return (
			<div className='userlist'>
				{title ? <h3>{title}</h3> : null}
				{rowGroups}
			</div>
		);
	}
}
UserList.defaultProps = {
	users: [],
	title:null,
	perRow:3,
};
UserList.propTypes = {
	
};

export {UserList};
