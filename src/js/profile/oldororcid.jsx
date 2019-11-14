import { log as logger } from '../Log.js';
let log = logger.Logger('Profile');

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { ajax, postFormData } from '../ajax.js';
import { apiRequestString } from '../ApiRouter.js';
import { eventSystem } from '../EventSystem.js';
import { EditableAvatar } from './editable-avatar.jsx';
import { OrcidEditableEducationItem } from './editable-education-item.jsx';
import { OrcidEditableExperienceItem } from './editable-experience-item.jsx';
import { EditableField } from './editable-field.jsx';
import { EditableInterests } from './editable-interest-item.jsx';
import { EditableTimeline } from './editable-timeline.jsx';
import { EditableSocial } from './editable-social-item.jsx';
import { EditableRich } from './editable-rich.jsx';
import { Groups, GroupsDetailed } from './groups.jsx';
import { Publications } from './publications.jsx';
import { RelatedPeople, RelatedPeopleDetailed } from './related-people.jsx';
import { FollowButtons } from '../FollowButtons.jsx';
import { InviteToGroups } from '../InviteToGroups.js';
import { MessageUserButton } from './message-user-button.jsx';
import { Alert, Container, Row, Col, Nav, NavItem, NavLink, TabPane, TabContent, Card, CardBody } from 'reactstrap';
import { OrcidProfile, OrcidProfileControl } from '../components/OrcidProfile.jsx';
// import {Coalesce} from '../components/Coalesce.jsx';
import cn from 'classnames';

const PROFILE_DATA_HANDLER_URL = '/settings/profiledata';
const ALERT_AUTO_HIDE_TIME = 3000; // ms

function Profile(props) {
	const saveField = async (field, value) => {
		var data = {};
		data[field] = value;
		try {
			let resp = await postFormData(PROFILE_DATA_HANDLER_URL, data, { withSession: true });
			let rdata = await resp.json();
			if (rdata.result !== 'success') {
				eventSystem.trigger('alert', {
					level: 'danger',
					message: 'There was an error saving your data'
				});
			} else {
				let newProfile = Object.assign({}, profile);
				newProfile.meta.profile[field] = value;
				setProfile(newProfile);
			}
			return rdata;
		} catch (error) {
			log.error(error);
			eventSystem.trigger('alert', {
				level: 'danger',
				message: 'There was an error saving your data'
			});
			return { result: 'error' };
		}
	};

	const checkIfExtendedViewNeeded = () => {
		const { related } = props;
		if (related.followersTotal > 3) {
			return true;
		}

		if (related.followingTotal > 3) {
			return true;
		}

		return false;
	};

	const checkIfEmpty = () => {
		const profileMeta = profileUser.meta.profile;

		let emptyMeta = true;
		Object.keys(profileMeta).forEach((key) => {
			if (profileMeta[key] != '') {
				emptyMeta = false;
			}
		});

		return emptyMeta;
	};

	const loadUserGroups = async (evt) => {
		if (evt) {
			evt.preventDefault();
		}
		if (userID) {
			setGroupsLoading(true);
			let url = apiRequestString({
				target: 'userGroups',
				libraryType: 'user',
				libraryID: userID,
				order: 'title',
				limit: 25,
				start: (groupsLoaded ? groups.length : 0)
			});
			let resp = await ajax({ url: url, credentials: 'omit' });
			let totalResults = parseInt(resp.headers.get('Total-Results'));
			let groups = await resp.json();
			if (groups.length > 3) {
				setExtended(true);
			}
			setGroups(groups);
			setGroupsLoading(false);
			setGroupsLoaded(true);
		} else {
			log.error('no userID in loadUserGroups');
		}
	};

	const loadRelatedUsers = async (type) => {
		setRelatedLoading(true);
		let start = 0;
		let limit = 10;
		switch (type) {
		case 'followers':
			start = related.followers.length;
			break;
		case 'following':
			start = related.following.length;
			break;
		default:
			throw new Error('Unrecognized related user type');
		}

		let slug = profileUser.userslug;
		let url = `/${slug}/data/${type}?start=${start}&limit=${limit}`;
		try {
			let resp = await ajax({ url: url, credentials: 'omit' });
			let data = await resp.json();
			let followUsers = data.users;
			let newRelated = Object.assign({}, related);
			newRelated[type] = newRelated[type].concat(followUsers);
			setRelated(newRelated);
		} catch (err) {
			log.error(err);
		}
	};

	const makeActive = (newActive) => {
		setActive(newActive);
		window.location.hash = newActive;
	};

	const onAlert = (alert) => {
		clearTimeout(alertTimeout);
		setAlert(alert);
		let newAlertTimeout = setTimeout(() => {
			this.setState({
				alert: {}
			});
		}, ALERT_AUTO_HIDE_TIME);
		setAlertTimeout(newAlertTimeout);
	};

	const { userID, editable, isFollowing, profileUser } = props;
	const [alert, setAlert] = useState({});
	const [alertTimeout, setAlertTimeout] = useState(null);
	const [active, setActive] = useState('About');
	const [extended, setExtended] = useState(checkIfExtendedViewNeeded());
	const [hasContent, setHasContent] = useState(!checkIfEmpty());
	const [groups, setGroups] = useState([]);
	const [groupsLoading, setGroupsLoading] = useState(false);
	const [groupsLoaded, setGroupsLoaded] = useState(false);
	const [profile, setProfile] = useState(props.profileUser);
	const [related, setRelated] = useState(props.related);
	const [relatedLoading, setRelatedLoading] = useState(false);
	
	useEffect(() => {
		eventSystem.addListener('alert', onAlert);
		loadUserGroups();

		if (['#About', '#Network', '#Groups'].indexOf(window.location.hash) != -1) {
			setActive(window.location.hash.substring(1));
		}
	}, []);

	let networkTab, groupsTab, alertNode;
	const profileMeta = profile.meta.profile;

	if (alert.level) {
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
					<p>{profile.displayName} hasn&apos;t filled out their profile yet.</p>
				</CardBody>
			</Card>
		</div>
	) : null;

	if (extended) {
		networkTab = (
			<TabPane tabId='Network'>
				<RelatedPeopleDetailed type='followers' people={ related.followers } title='Followers' total={ related.followersTotal } loadRelatedUsers={loadRelatedUsers} />
				<RelatedPeopleDetailed type='following' people={ related.following } title='Following' total={ related.followingTotal } loadRelatedUsers={loadRelatedUsers} />
			</TabPane>
		);

		groupsTab = (
			<TabPane tabId='Groups'>
				<GroupsDetailed groups={groups} loaded={groupsLoaded} onViewMore={ () => makeActive('Groups') } />
			</TabPane>
		);
	}

	let userLibraryLink = profile.meta.privacy.publishLibrary == '1' ? (
		<a href={`/${profile.slug}/items`}>{profile.displayName}&apos;s public library</a>
	) : null;

	let navbar = (
		<Nav tabs>
			<NavItem>
				<NavLink className={ cn({ active: (active == 'About') }) } onClick={ () => makeActive('About') }>
					About
				</NavLink>
			</NavItem>
			<NavItem className={cn({ 'd-none': (related.followers.length == 0 && related.following.length == 0) })}>
				<NavLink className={ cn({ active: (active == 'Network') }) } onClick={ () => makeActive('Network') }>
					Network
				</NavLink>
			</NavItem>
			<NavItem>
				<NavLink className={ cn({ active: (active == 'Groups') }) } onClick={ () => makeActive('Groups') }>
					Groups
				</NavLink>
			</NavItem>
		</Nav>
	);
	if (!extended) {
		navbar = null;
	}

	let aboutTab;
	let orcidProfile = false;

	if (profile.meta.orcid_profile) {
		orcidProfile = JSON.parse(profile.meta.orcid_profile);
		aboutTab = (
			<Row>
				<Col xs={12} md={8}>
					<OrcidProfile orcidProfile={orcidProfile} />
					<Publications userID={ userID } onPublicationsLoaded={() => { setHasContent(true); }} />
				</Col>
				<Col xs={12} md={4}>
					<Groups groups={groups} loaded={groupsLoaded} onExtended={() => { setExtended(true); }} onViewMore={ () => makeActive('Groups')} />
					<RelatedPeople
						people={ related.followers.slice(0, 3) }
						title='Followers'
						more={ related.followers.length > 3 || related.followersTotal > 3 }
						onViewMore={ () => makeActive('Network') }
						id='followers'
					/>
					<RelatedPeople
						people={ related.following.slice(0, 3) }
						title='Following'
						more={ related.following.length > 3 || related.followingTotal > 3 }
						onViewMore={ () => makeActive('Network') }
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
						title='About'
						field='bio'
						emptytext='Add a short description of what you are currently working on'
						value={ profileMeta.bio }
						editable={editable}
						saveField={saveField}
					/>
					<EditableInterests
						value={profileMeta.interests}
						field='interests'
						editable={editable}
						template={{ interest: '' }}
						saveField={saveField}
					/>

					<Publications userID={ userID } onPublicationsLoaded={() => { setHasContent(true); }} />

					<EditableTimeline
						field='experience'
						title='Professional experience'
						emptytext='Add your professional experience to share where you have been working'
						value={ profileMeta.experience }
						editable={editable}
						entryClass={OrcidEditableExperienceItem}
						template={OrcidEditableExperienceItem.defaultProps.value}
						saveField={saveField}
					/>

					<EditableTimeline
						field='education'
						title='Education history'
						emptytext='Add your education history to show where you have completed your studies'
						value={ profileMeta.education }
						editable={editable}
						entryClass={OrcidEditableEducationItem}
						template={OrcidEditableEducationItem.defaultProps.value}
						saveField={saveField}
					/>
				</Col>
				<Col xs={12} md={4}>
					<Groups groups={groups} loaded={groupsLoaded} onExtended={() => { setExtended(true); }} onViewMore={ () => makeActive('Groups')} />
					<RelatedPeople
						people={ related.followers.slice(0, 3) }
						title='Followers'
						more={ related.followers.length > 3 || related.followersTotal > 3 }
						onViewMore={ () => makeActive('Network') }
						id='followers'
					/>
					<RelatedPeople
						people={ related.following.slice(0, 3) }
						title='Following'
						more={ related.following.length > 3 || related.followingTotal > 3 }
						onViewMore={ () => makeActive('Network') }
						id='following'
					/>
				</Col>
			</Row>
		);
	}
	let orcidProfileControl = null;
	if (editable) {
		orcidProfileControl = <OrcidProfileControl orcidProfile={orcidProfile} showFull={false} />;
	}

	return (
		<Container>
			{alertNode}
			<Row className='user-profile-personal-details'>
				<Col xs={12} md={4}>
					<EditableAvatar
						value={ profileMeta.avatar }
						saveField={saveField}
					/>
				</Col>
				<Col xs={12} md={8}>
					<h2>
						{!editable
							? profile.displayName
							: <EditableField
								field='realname'
								emptytext='Your full name'
								value={ profileMeta.realname }
								editable={editable}
								saveField={saveField}
							/>
						}
					</h2>
					<ul>
						<li>
							<EditableField
								field='title'
								emptytext='Add your title'
								value={ profileMeta.title }
								editable={editable}
								saveField={saveField}
							/>
						</li>
						<li>
							<EditableField
								field='academic'
								emptytext='Add your academic status'
								value={ profileMeta.academic }
								editable={editable}
								saveField={saveField}
							/>
						</li>
						<li>
							<EditableField
								field='affiliation'
								emptytext='Add your university'
								value={ profileMeta.affiliation }
								editable={editable}
								saveField={saveField}
							/>
						</li>
						<li>
							<EditableField
								field='location'
								emptytext='Add your location'
								value={ profileMeta.location }
								editable={editable}
								saveField={saveField}
							/>
						</li>
						{userLibraryLink}
						<li>
							<EditableSocial
								value={profileMeta.social}
								field='social'
								editable={editable}
								template={{ name: 'ORCID', value: '' }}
								saveField={saveField}
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
							<InviteToGroups invitee={{ userID, displayName: profileMeta.realname }} />
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

Profile.propTypes = {
	profileUser: PropTypes.object.isRequired,
	userID: PropTypes.number.isRequired,
	editable: PropTypes.bool.isRequired,
	isFollowing: PropTypes.bool.isRequired,
};

export { Profile };
