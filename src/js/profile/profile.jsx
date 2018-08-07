'use strict';

import {log as logger} from '../Log.js';
let log = logger.Logger('Profile');

import React from 'react';
import PropTypes from 'prop-types';

import {postFormData} from '../ajax.js';
import {eventSystem} from '../EventSystem.js';
import {EditableAvatar} from './profile/editable-avatar.jsx';
import {EditableEducationItem, OrcidEditableEducationItem} from './profile/editable-education-item.jsx';
import {EditableExperienceItem} from './profile/editable-experience-item.jsx';
import {EditableField} from './profile/editable-field.jsx';
import {EditableInterests} from './profile/editable-interest-item.jsx';
import {EditableTimeline} from './profile/editable-timeline.jsx';
import {EditableSocial} from './profile/editable-social-item.jsx';
import {EditableRich} from './profile/editable-rich.jsx';
import {Groups} from './profile/groups.jsx';
import {GroupsDetailed} from './profile/groups-detailed.jsx';
import {ProfileDataSource} from './profile-data-source.js';
import {Publications} from './profile/publications.jsx';
import {RelatedPeople} from './profile/related-people.jsx';
import {RelatedPeopleDetailed} from './profile/related-people-detailed.jsx';
import {FollowButtons} from '../FollowButtons.jsx';
import {InviteToGroups} from '../InviteToGroups.js';
import {MessageUserButton} from './profile/message-user-button.jsx';
import {Alert, Container, Row, Col, Nav, NavItem, NavLink, TabPane, TabContent, Card, CardBody} from 'reactstrap';
import {OrcidProfile, Name, Biography, Educations, Employments, Fundings, Works, ResearcherUrls, Keywords} from '../components/OrcidProfile.jsx';
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
			hasContent: !this.checkIfEmpty()
		};
	}

	saveField = (field, value) => {
		var data = {};
		data[field] = value;
		return postFormData(PROFILE_DATA_HANDLER_URL, data, {withSession:true});
	}

	componentWillMount = () => {
		this.profileDataSource = new ProfileDataSource(this.props.profile.userslug);
		eventSystem.addListener('alert', this.onAlert.bind(this));
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
		const {profile, userid, editable, isFollowing} = this.props;
		const profileMeta = profile.meta.profile;
		const {active, extended, alert, hasContent} = this.state;

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
					<GroupsDetailed userid={ userid } onViewMore={ () => this.makeActive('Groups') } />
				</TabPane>
			);
		}

		let userLibraryLink = profile.meta.privacy.publishLibrary ? (
			<a href='./items'>{profile.displayName}'s public library</a>
		) : null;

		//find current job title
		let profileTitle = false;
		if(profileMeta.experience){
			let expObj = JSON.parse(profileMeta.experience);
			let lastExp = expObj[expObj.length - 1];
			if(lastExp.present){
				profileTitle = lastExp.position_name;
			}
		}

		//find last degree that is not currently being pursued
		let termDegree = false;
		if(profileMeta.education){
			let eduObj = JSON.parse(profileMeta.education);
			for(let i=eduObj.length-1; i>0; i--){
				let lastEdu = eduObj[eduObj.length - 1];
				if(!lastEdu.present){
					termDegree = lastEdu.degree_name + ', ' + lastEdu.institution;
					break;
				}
			}
		}

		let navbar = (
			<Nav tabs>
				<NavItem>
					<NavLink className={ cn({active:(active == 'About')}) } onClick={ () => this.makeActive('About') }>
						About
					</NavLink>
				</NavItem>
				<NavItem className={cn({'d-none': (profile.followers.length == 0 && profile.following.length == 0)})}>*/}
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
		//if(profile.meta.orcid_profile) {
		if(false) {
			let p = JSON.parse(profile.meta.orcid_profile);
			aboutTab = (
				<Row>
					<Col xs='12' sm='8'>
						<OrcidProfile orcidProfile={p} />
					</Col>
					<Col xs='12' sm='4'>
						<Groups userid={ userid } onExtended={()=>{this.setState({extended:true});}} onViewMore={ () => this.makeActive('Groups')} />
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
			let p = JSON.parse(profile.meta.orcid_profile);
			aboutTab = (
				<Row>
					<Col xs='12' sm='8'>
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

						<Publications userid={ userid } onPublicationsLoaded={this.hasContent} />

						<EditableTimeline
							field="experience"
							title="Professional experience"
							emptytext="Add your professional experience to share where you have been working"
							value={ profileMeta.experience }
							editable={editable}
							entryClass={EditableExperienceItem}
							saveField={this.saveField}
						/>

						<EditableTimeline
							field="education"
							title="Education history"
							emptytext="Add your education history to show where you have completed your studies"
							value={ profileMeta.education }
							editable={editable}
							entryClass={OrcidEditableEducationItem}
							saveField={this.saveField}
						/>
					</Col>
					<Col xs='12' sm='4'>
						<Groups userid={ userid } onExtended={()=>{this.setState({extended:true});}} onViewMore={ () => this.makeActive('Groups')} />
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
					<Col xs='12' sm='8'>
						<OrcidProfile orcidProfile={p} />
					</Col>
				</Row>
			);
		}

		return (
			<Container>
				{alertNode}
				<Row className="user-profile-personal-details">
					<Col xs='12' sm='6'>
						<EditableAvatar
							value={ profileMeta.avatar }
							saveField={this.saveField}
						/>
					</Col>
					<Col xs='12' sm='6'>
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
								{profileTitle}
								<EditableField
									field="title"
									emptytext="Add your title"
									value={ profileMeta.title }
									editable={editable}
									saveField={this.saveField}
								/>
							</li>
							<li>
								{termDegree}
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
						<div className='user-actions clearfix'>
							<div className='float-left mr-4'>
								<FollowButtons profileUserID={userid} isFollowing={isFollowing} />
							</div>
							<div className='float-left mr-4'>
								<MessageUserButton username={profile.username} />
							</div>
							<div className='float-left mr-4'>
								<InviteToGroups invitee={{userID:userid, displayName:profileMeta.realname}} />
							</div>
						</div>
						{emptyProfileNode}
					</Col>
				</Row>
				<Row>
					<Col xs='12'>
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
	userid: PropTypes.number.isRequired,
	editable: PropTypes.bool.isRequired,
	isFollowing: PropTypes.bool.isRequired,
};

export {Profile};