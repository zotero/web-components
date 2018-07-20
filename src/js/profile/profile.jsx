'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import EditableAvatar from './profile/editable-avatar.jsx';
import EditableEducationItem from './profile/editable-education-item.jsx';
import EditableExperienceItem from './profile/editable-experience-item.jsx';
import EditableField from './profile/editable-field.jsx';
import EditableInterestItem from './profile/editable-interest-item.jsx';
import EditableItems from './profile/editable-items.jsx';
import EditableRich from './profile/editable-rich.jsx';
import EditableSocialItem from './profile/editable-social-item.jsx';
import Groups from './profile/groups.jsx';
import GroupsDetailed from './profile/groups-detailed.jsx';
import ProfileDataSource from './profile-data-source.js';
import profileEventSystem from './profile-event-system.js';
import Publications from './profile/publications.jsx';
import RelatedPeople from './profile/related-people.jsx';
import RelatedPeopleDetailed from './profile/related-people-detailed.jsx';
import {FollowButtons} from '../FollowButtons.jsx';
import {InviteToGroups} from '../InviteToGroups.js';
import {MessageUserButton} from './profile/message-user-button.jsx';
import {Alert, Container, Row, Col, Nav, NavItem, NavLink, TabPane, TabContent} from 'reactstrap';
import cn from 'classnames';

class Profile extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			alert: {},
			active: 'About',
			extended: this.checkIfExtendedViewNeeded()
		};
	}

	componentWillMount = () => {
		this.profileDataSource = new ProfileDataSource(this.props.profile.userslug);
		profileEventSystem.addListener('alert', this.onAlert.bind(this));
	}

	checkIfExtendedViewNeeded = () => {
		if(this.props.profile.followers && this.props.profile.followers.length > 1) {
			return true;
		}

		if(this.props.profile.following && this.props.profile.following.length > 1) {
			return true;
		}

		return false;
	}

	makeActive = (newActive) => {
		this.setState({
			active: newActive
		});
	}

	onAlert = (alert) => {
		clearTimeout(this.alertTimeout);
		this.setState({
			alert: alert
		}, () => {
			this.alertTimeout = setTimeout(() => {
				this.setState({
					alert: {}
				});
			}, this.constructor.ALERT_AUTO_HIDE_TIME);
		});
	}

	render() {
		var networkTab, groupsTab, alert;
		const {profile, userid, editable} = this.props;
		const profileMeta = profile.meta.profile;
		const activeTab = this.state.active;

		if(this.state.alert.level){
			alert = <Alert color={this.state.alert.level}>
					{this.state.alert.message}
				</Alert>;
		}

		if(this.state.extended) {
			networkTab = (
				<TabPane tabId='Network'>
					<RelatedPeopleDetailed people={ profile.followers } title="Followers" more={ profile.followersMore } dataSource={ this.profileDataSource } />
					<RelatedPeopleDetailed people={ profile.following } title="Following" more={ profile.followingMore } dataSource={ this.profileDataSource } />
				</TabPane>
			);

			groupsTab = (
				<TabPane tabId='Groups'>
					<GroupsDetailed userid={ userid } onViewMore={ () => this.makeActive('Groups') } />
				</TabPane>
			);
		}

		let userLibraryLink = profile.meta.privacy.publishLibrary ? (
			<a href='./items'>{profile.displayName}'s public library</a>
		) : null;

		return (
			<Container>
				{alert}
				<Row className="user-profile-personal-details">
					<Col xs='12' sm='6'>
						<EditableAvatar value={ profileMeta.avatar } />
					</Col>
					<Col xs='12' sm='6'>
						<h2>
							{!editable ?
								profile.displayName :
								<EditableField field="realname" emptytext="Your full name" value={ profileMeta.realname } />
							}
						</h2>
						<ul>
							<li>
								<EditableField field="title" emptytext="Add your title" value={ profileMeta.title } />
							</li>
							<li>
								<EditableField field="academic" emptytext="Add your academic status" value={ profileMeta.academic } />
							</li>
							<li>
								<EditableField field="affiliation" emptytext="Add your university" value={ profileMeta.affiliation } />
							</li>
							<li>
								<EditableField field="location" emptytext="Add your location" value={ profileMeta.location } />
							</li>
							{userLibraryLink}
							<li>
								<EditableItems field="social" uniform={true} emptytext="Add social profile" value={profileMeta.social}>
									<EditableSocialItem />
								</EditableItems>
							</li>
						</ul>
						<div className='user-actions'>
							<div className='float-left mr-4'>
								<FollowButtons profileUserID={userid} isFollowing={this.props.isFollowing} />
							</div>
							<div className='float-left mr-4'>
								<MessageUserButton username={profile.username} />
							</div>
							<div className='float-left mr-4'>
								<InviteToGroups invitee={{userID:userid, displayName:profileMeta.realname}} />
							</div>
						</div>
					</Col>
				</Row>
				<Row>
					<Col xs='12'>
						<Nav tabs>
							<NavItem>
								<NavLink className={ cn({active:(activeTab == 'About')}) } onClick={ () => this.makeActive('About') }>
									About
								</NavLink>
							</NavItem>
							<NavItem>
								<NavLink className={ cn({active:(activeTab == 'Network')}) } onClick={ () => this.makeActive('Network') }>
									Network
								</NavLink>
							</NavItem>
							<NavItem>
								<NavLink className={ cn({active:(activeTab == 'Groups')}) } onClick={ () => this.makeActive('Groups') }>
									Groups
								</NavLink>
							</NavItem>
						</Nav>
						<TabContent activeTab={this.state.active}>
							<TabPane tabId='About'>
								<Row>
									<Col xs='12' sm='8'>
										<EditableRich id='bio-text' title="About" field="bio" emptytext="Add a short description of what you are currently working on" value={ profileMeta.bio } />
										<EditableItems field="interests" title="Research interests" emptytext="Add your research intereststo show what you are passionate about" value={ profileMeta.interests }>
											<EditableInterestItem />
										</EditableItems>

										<Publications userid={ userid } />

										<EditableItems field="experience" title="Professional experience" emptytext="Add your professional experience to share where you have been working" value={ profileMeta.experience }>
											<EditableExperienceItem />
										</EditableItems>

										<EditableItems field="education" title="Education history" emptytext="Add your education history to show where you have completed your studies" value={ profileMeta.education }>
											<EditableEducationItem />
										</EditableItems>
									</Col>
									<Col xs='12' sm='4'>
										<Groups userid={ userid } onViewMore={ () => this.makeActive('Groups')} />
										<RelatedPeople people={ profile.followers.slice(0, 3) } title="Followers" more={ profile.followers.length > 3 || profile.followersMore } onViewMore={ () => this.makeActive('Network') } />
										<RelatedPeople people={ profile.following.slice(0, 3) } title="Following" more={ profile.following.length > 3 || profile.followingMore } onViewMore={ () => this.makeActive('Network') } />
									</Col>
								</Row>
							</TabPane>
							{ networkTab }
							{ groupsTab }
						</TabContent>
					</Col>
				</Row>
			</Container>
		);
	}

	static get ALERT_AUTO_HIDE_TIME() {
		return 3000; //ms
	}
}

Profile.propTypes = {
	profile: PropTypes.object.isRequired,
	userid: PropTypes.number.isRequired,
	editable: PropTypes.bool.isRequired,
	isFollowing: PropTypes.bool.isRequired,
};

export {Profile};