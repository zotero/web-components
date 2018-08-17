'use strict';

import {log as logger} from '../Log.js';
let log = logger.Logger('Profile');

import React from 'react';
import PropTypes from 'prop-types';

import {ajax, postFormData} from '../ajax.js';
import {apiRequestString} from '../ApiRouter.js';
import {eventSystem} from '../EventSystem.js';
import {EditableAvatar} from './profile/editable-avatar.jsx';
import {EditableEducationItem, OrcidEditableEducationItem} from './profile/editable-education-item.jsx';
import {EditableExperienceItem, OrcidEditableExperienceItem} from './profile/editable-experience-item.jsx';
import {EditableField} from './profile/editable-field.jsx';
import {EditableInterests} from './profile/editable-interest-item.jsx';
import {EditableTimeline} from './profile/editable-timeline.jsx';
import {EditableSocial} from './profile/editable-social-item.jsx';
import {EditableRich} from './profile/editable-rich.jsx';
import {Groups, GroupsDetailed} from './profile/groups.jsx';
import {ProfileDataSource} from './profile-data-source.js';
import {Publications} from './profile/publications.jsx';
import {RelatedPeople, RelatedPeopleDetailed} from './profile/related-people.jsx';
import {FollowButtons} from '../FollowButtons.jsx';
import {InviteToGroups} from '../InviteToGroups.js';
import {MessageUserButton} from './profile/message-user-button.jsx';
import {Alert, Container, Row, Col, Nav, NavItem, NavLink, TabPane, TabContent, Card, CardBody} from 'reactstrap';
import {OrcidProfile, OrcidProfileControl} from '../components/OrcidProfile.jsx';
import {Coalesce} from '../components/Coalesce.jsx';
import cn from 'classnames';

const PROFILE_DATA_HANDLER_URL = '/settings/profiledata';

class Profile extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			alert: {},
			active: 'About',
			extended: this.checkIfExtendedViewNeeded(),
			hasContent: !this.checkIfEmpty(),
			groups:{
				groups:[],
				loading:false,
				loaded:false
			},
			profile:props.profile
		};
		this.profileDataSource = new ProfileDataSource(this.props.profile.userslug);
		eventSystem.addListener('alert', this.onAlert);
	}

	saveField = async (field, value) => {
		var data = {};
		data[field] = value;
		try{
			let resp = await postFormData(PROFILE_DATA_HANDLER_URL, data, {withSession:true});
			let rdata = await resp.json();
			if(rdata.result !== 'success'){
				eventSystem.trigger('alert', {
					level: 'danger',
					message: 'There was an error saving your data'
				});
			} else {
				let {profile} = this.state;
				profile.meta.profile[field] = value;
				this.setState({profile});
			}
			return rdata;
		} catch (error) {
			log.error(error);
			eventSystem.trigger('alert', {
				level: 'danger',
				message: 'There was an error saving your data'
			});
			return {result:'error'};
		}
	}

	componentDidMount = () => {
		this.loadUserGroups();
	}

	checkIfExtendedViewNeeded = () => {
		const {profile} = this.props;
		if(profile.followers && profile.followers.length > 3) {
			return true;
		}

		if(profile.following && profile.following.length > 3) {
			return true;
		}

		return false;
	}

	checkIfEmpty = () => {
		const {profile} = this.props;
		const profileMeta = profile.meta.profile;

		let emptyMeta = true;
		Object.keys(profileMeta).map((key)=>{
			if(profileMeta[key] != '') {
				emptyMeta = false;
			}
		});

		return emptyMeta;
	}

	loadUserGroups = async (evt) => {
		if(evt){
			evt.preventDefault();
		}
		let {userID} = this.props;
		let {extended, groups} = this.state;
		if(userID){
			groups.loading = true;
			this.setState({groups});
			let url = apiRequestString({
				'target':'userGroups',
				'libraryType':'user',
				'libraryID': userID,
				'order':'title',
				'limit':25,
				'start':(groups.loaded ? this.state.groups.length : 0)
			});
			let resp = await ajax({url: url, credentials:'omit'});
			let totalResults = parseInt(resp.headers.get('Total-Results'));
			let data = await resp.json();
			groups.groups = groups.groups.concat(data);
			if(groups.groups.length > 3){
				extended = true;
			}
			groups.loading = false;
			groups.loaded = true;
			groups.totalResults = totalResults;
			this.setState({
				groups,
				extended
			});
		} else {
			log.error("no userID in loadUserGroups");
		}
	}

	hasContent = () => {
		this.setState({hasContent:true});
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
		var networkTab, groupsTab, alertNode;
		const {userID, editable, isFollowing} = this.props;
		const {profile, active, extended, alert, hasContent, groups} = this.state;
		const profileMeta = profile.meta.profile;

		if(alert.level){
			alertNode = (
				<Alert color={alert.level}>
					{alert.message}
				</Alert>
			);
		}

		let emptyProfileNode = !hasContent ? (
			<div id='empty-profile-text' className='mt-6'>
				<Card>
					<CardBody>
						<p>{profile.displayName} hasn't filled out their profile yet.</p>
					</CardBody>
				</Card>
			</div>
		) : null;

		if(extended) {
			networkTab = (
				<TabPane tabId='Network'>
					<RelatedPeopleDetailed people={ profile.followers } title="Followers" more={ profile.followersMore } dataSource={ this.profileDataSource } />
					<RelatedPeopleDetailed people={ profile.following } title="Following" more={ profile.followingMore } dataSource={ this.profileDataSource } />
				</TabPane>
			);

			groupsTab = (
				<TabPane tabId='Groups'>
					<GroupsDetailed {...groups} onViewMore={ () => this.makeActive('Groups') } />
				</TabPane>
			);
		}

		let userLibraryLink = profile.meta.privacy.publishLibrary ? (
			<a href='./items'>{profile.displayName}'s public library</a>
		) : null;

		let navbar = (
			<Nav tabs>
				<NavItem>
					<NavLink className={ cn({active:(active == 'About')}) } onClick={ () => this.makeActive('About') }>
						About
					</NavLink>
				</NavItem>
				<NavItem className={cn({'d-none': (profile.followers.length == 0 && profile.following.length == 0)})}>
					<NavLink className={ cn({active:(active == 'Network')}) } onClick={ () => this.makeActive('Network') }>
						Network
					</NavLink>
				</NavItem>
				<NavItem>
					<NavLink className={ cn({active:(active == 'Groups')}) } onClick={ () => this.makeActive('Groups') }>
						Groups
					</NavLink>
				</NavItem>
			</Nav>
		);
		if(!extended){
			navbar = null;
		}

		let aboutTab;
		let orcidProfile = false;

		if(profile.meta.orcid_profile) {
			orcidProfile = JSON.parse(profile.meta.orcid_profile);
			aboutTab = (
				<Row>
					<Col xs={12} md={8}>
						<OrcidProfile orcidProfile={orcidProfile} />
						<Publications userID={ userID } onPublicationsLoaded={this.hasContent} />
					</Col>
					<Col xs={12} md={4}>
						<Groups {...groups} onExtended={()=>{this.setState({extended:true});}} onViewMore={ () => this.makeActive('Groups')} />
						<RelatedPeople
							people={ profile.followers.slice(0, 3) }
							title="Followers"
							more={ profile.followers.length > 3 || profile.followersMore }
							onViewMore={ () => this.makeActive('Network') }
							id='followers'
						/>
						<RelatedPeople
							people={ profile.following.slice(0, 3) }
							title="Following"
							more={ profile.following.length > 3 || profile.followingMore }
							onViewMore={ () => this.makeActive('Network') }
							id='following'
						/>
					</Col>
				</Row>
			);
		} else {
			aboutTab = (
				<Row>
					<Col xs={12} md={8}>
						<EditableRich
							id='bio-text'
							title="About"
							field="bio"
							emptytext="Add a short description of what you are currently working on"
							value={ profileMeta.bio }
							editable={editable}
							saveField={this.saveField}
						/>
						<EditableInterests
							value={profileMeta.interests}
							field='interests'
							editable={editable}
							template={{interest:''}}
							saveField={this.saveField}
						/>

						<Publications userID={ userID } onPublicationsLoaded={this.hasContent} />

						<EditableTimeline
							field="experience"
							title="Professional experience"
							emptytext="Add your professional experience to share where you have been working"
							value={ profileMeta.experience }
							editable={editable}
							entryClass={OrcidEditableExperienceItem}
							template={OrcidEditableExperienceItem.defaultProps.value}
							saveField={this.saveField}
						/>

						<EditableTimeline
							field="education"
							title="Education history"
							emptytext="Add your education history to show where you have completed your studies"
							value={ profileMeta.education }
							editable={editable}
							entryClass={OrcidEditableEducationItem}
							template={OrcidEditableEducationItem.defaultProps.value}
							saveField={this.saveField}
						/>
					</Col>
					<Col xs={12} md={4}>
						<Groups {...groups} onExtended={()=>{this.setState({extended:true});}} onViewMore={ () => this.makeActive('Groups')} />
						<RelatedPeople
							people={ profile.followers.slice(0, 3) }
							title="Followers"
							more={ profile.followers.length > 3 || profile.followersMore }
							onViewMore={ () => this.makeActive('Network') }
							id='followers'
						/>
						<RelatedPeople
							people={ profile.following.slice(0, 3) }
							title="Following"
							more={ profile.following.length > 3 || profile.followingMore }
							onViewMore={ () => this.makeActive('Network') }
							id='following'
						/>
					</Col>
				</Row>
			);
		}
		let orcidProfileControl = null;
		if(editable){
			orcidProfileControl = <OrcidProfileControl orcidProfile={orcidProfile} showFull={false} />;
		}

		return (
			<Container>
				{alertNode}
				<Row className="user-profile-personal-details">
					<Col xs={12} md={6}>
						<EditableAvatar
							value={ profileMeta.avatar }
							saveField={this.saveField}
						/>
					</Col>
					<Col xs={12} md={6}>
						<h2>
							{!editable ?
								profile.displayName :
								<EditableField
									field="realname"
									emptytext="Your full name"
									value={ profileMeta.realname }
									editable={editable}
									saveField={this.saveField}
								/>
							}
						</h2>
						<ul>
							<li>
								<EditableField
									field="title"
									emptytext="Add your title"
									value={ profileMeta.title }
									editable={editable}
									saveField={this.saveField}
								/>
							</li>
							<li>
								<EditableField
									field="academic"
									emptytext="Add your academic status"
									value={ profileMeta.academic }
									editable={editable}
									saveField={this.saveField}
								/>
							</li>
							<li>
								<EditableField
									field="affiliation"
									emptytext="Add your university"
									value={ profileMeta.affiliation }
									editable={editable}
									saveField={this.saveField}
								/>
							</li>
							<li>
								<EditableField
									field="location"
									emptytext="Add your location"
									value={ profileMeta.location }
									editable={editable}
									saveField={this.saveField}
								/>
							</li>
							{userLibraryLink}
							<li>
								<EditableSocial
									value={profileMeta.social}
									field='social'
									editable={editable}
									template={{name:'ORCID', value:''}}
									saveField={this.saveField}
								/>
							</li>
						</ul>
						{orcidProfileControl}
						<div className='user-actions clearfix'>
							<div className='float-left mr-4'>
								<FollowButtons profileUserID={userID} isFollowing={isFollowing} />
							</div>
							<div className='float-left mr-4'>
								<MessageUserButton username={profile.username} />
							</div>
							<div className='float-left mr-4'>
								<InviteToGroups invitee={{userID, displayName:profileMeta.realname}} />
							</div>
						</div>
						{emptyProfileNode}
					</Col>
				</Row>
				<Row className='mt-2'>
					<Col xs={12}>
						{navbar}
						<TabContent activeTab={active}>
							<TabPane tabId='About'>
								{aboutTab}
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
	userID: PropTypes.number.isRequired,
	editable: PropTypes.bool.isRequired,
	isFollowing: PropTypes.bool.isRequired,
};

export {Profile};