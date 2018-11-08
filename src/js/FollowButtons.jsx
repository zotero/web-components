'use strict';

// import {log as logger} from './Log.js';
// let log = logger.Logger('FollowButtons');

const React = require('react');
const {Component} = React;
import {PropTypes} from 'prop-types';
import {getCurrentUser} from './Utils.js';
import { postFormData } from './ajax.js';
import { buildUrl } from './wwwroutes.js';
import {UserList} from './components/UserList.jsx';
import {Button} from 'reactstrap';

const currentUser = getCurrentUser();

class FollowButtons extends Component{
	constructor(props){
		super(props);
		this.state = {
			following: props.isFollowing
		};
	}
	follow = async () => {
		const {profileUserID} = this.props;
		let resp = await postFormData(buildUrl('followUser'), {userID:profileUserID, ajax:true}, {withSession:true});
		let data = await resp.json();
		if(data.status == 'following') {
			this.setState({following:true});
		} else if(data.status == 'not following') {
			this.setState({following:false});
		}
	}
	unfollow = () => {
		this.follow();
	}
	render(){
		const {profileUserID} = this.props;
		const {following} = this.state;
		if(!currentUser) {
			return null;
		}
		if(currentUser.userID == profileUserID) {
			return null;
		}
		if(following){
			return <Button id='unfollow-button' onClick={this.unfollow}>Unfollow</Button>;
		} else {
			return <Button id='follow-button' onClick={this.follow}>Follow</Button>;
		}
	}
}
FollowButtons.propTypes = {
	profileUserID: PropTypes.number.isRequired
};

class FollowSection extends Component {
	render(){
		const {profileUserID, isFollowing, followers, following} = this.props;

		return (
			<div className='following-section'>
				<FollowButtons profileUserID={profileUserID} isFollowing={isFollowing} />
				<UserList title='Following' users={following} />
				<UserList title='Followers' users={followers} />
			</div>
		);
	}
}

FollowSection.defaultProps = {
	isFollowing: false,
	followers: [],
	following: []
};



export {FollowSection, FollowButtons};