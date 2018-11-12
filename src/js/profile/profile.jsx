'use strict';

import {log as logger} from '../Log.js';
let log = logger.Logger('Profile');

import React from 'react';
import PropTypes from 'prop-types';

import {ajax, postFormData} from '../ajax.js';
import {apiRequestString} from '../ApiRouter.js';
import {eventSystem} from '../EventSystem.js';
import {EditableAvatar} from './editable-avatar.jsx';
import {OrcidEditableEducationItem} from './editable-education-item.jsx';
import {OrcidEditableExperienceItem} from './editable-experience-item.jsx';
import {EditableField} from './editable-field.jsx';
import {EditableInterests} from './editable-interest-item.jsx';
import {EditableTimeline} from './editable-timeline.jsx';
import {EditableSocial} from './editable-social-item.jsx';
import {EditableRich} from './editable-rich.jsx';
import {Groups, GroupsDetailed} from './groups.jsx';
import {Publications} from './publications.jsx';
import {RelatedPeople, RelatedPeopleDetailed} from './related-people.jsx';
import {FollowButtons} from '../FollowButtons.jsx';
import {InviteToGroups} from '../InviteToGroups.js';
import {MessageUserButton} from './message-user-button.jsx';
import {Alert, Container, Row, Col, Nav, NavItem, NavLink, TabPane, TabContent, Card, CardBody} from 'reactstrap';
import {OrcidProfile, OrcidProfileControl} from '../components/OrcidProfile.jsx';
//import {Coalesce} from '../components/Coalesce.jsx';
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
		if(['#About', '#Network', '#Groups'].indexOf(window.location.hash) != -1){
			this.state.active = window.location.hash.substring(1);
		}
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
			log.error('no userID in loadUserGroups');
		}
	}

	loadRelatedUsers = async (type) => {
		this.setState({loadingRelated: true});
		let {profile} = this.state;
		let start = 0;
		let limit = 10;
		switch(type){
			case 'followers':
				start = profile.followers.length;
				break;
			case 'following':
				start = profile.following.length;
				break;
			default:
				throw 'Unrecognized related user type';
		}

		let slug = this.props.profile.userslug;
		let url = `/${slug}/data/${type}?start=${start}&limit=${limit}`;
		try{
			let resp = await ajax({url: url, credentials:'omit'});
			let data = await resp.json();
			let followUsers = data['users'];
			let newRelated = profile[type].concat(followUsers);
			switch(type){
				case 'followers':
					profile.followers = newRelated;
					this.setState({profile});
					return;
				case 'following':
					profile.following = newRelated;
					this.setState({profile});
					return;
				default:
					throw 'Unrecognized related user type';
			}
		} catch (err){
			log.error(err);
		}
	}

	hasContent = () => {
		this.setState({hasContent:true});
	}

	makeActive = (newActive) => {
		this.setState({
			active: newActive
		});
		window.location.hash = newActive;
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
					<RelatedPeopleDetailed type='followers' people={ profile.followers } title="Followers" total={ profile.followersTotal } loadRelatedUsers={this.loadRelatedUsers} />
					<RelatedPeopleDetailed type='following' people={ profile.following } title="Following" total={ profile.followingTotal } loadRelatedUsers={this.loadRelatedUsers} />
				</TabPane>
			);

			groupsTab = (
				<TabPane tabId='Groups'>
					<GroupsDetailed {...groups} onViewMore={ () => this.makeActive('Groups') } />
				</TabPane>
			);
		}

		let userLibraryLink = profile.meta.privacy.publishLibrary == '1' ? (
			<a href={`/${profile.slug}/items`}>{profile.displayName}'s public library</a>
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
							more={ profile.followers.length > 3 || profile.followersTotal > 3 }
							onViewMore={ () => this.makeActive('Network') }
							id='followers'
						/>
						<RelatedPeople
							people={ profile.following.slice(0, 3) }
							title="Following"
							more={ profile.following.length > 3 || profile.followingTotal > 3 }
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
							more={ profile.followers.length > 3 || profile.followersTotal > 3 }
							onViewMore={ () => this.makeActive('Network') }
							id='followers'
						/>
						<RelatedPeople
							people={ profile.following.slice(0, 3) }
							title="Following"
							more={ profile.following.length > 3 || profile.followingTotal > 3 }
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
					<Col xs={12} md={4}>
						<EditableAvatar
							value={ profileMeta.avatar }
							saveField={this.saveField}
						/>
					</Col>
					<Col xs={12} md={8}>
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