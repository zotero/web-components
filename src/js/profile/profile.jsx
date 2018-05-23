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
import Tab from './profile/tab.jsx';
import Tabs from './profile/tabs.jsx';

export default class Profile extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			alert: {},
			active: 'About',
			extended: this.checkIfExtendedViewNeeded()
		};
	}

	componentWillMount() {
		this.profileDataSource = new ProfileDataSource(this.props.profile.userslug);
		profileEventSystem.addListener('alert', this.onAlert.bind(this));
	}

	checkIfExtendedViewNeeded() {
		if(this.props.profile.followers && this.props.profile.followers.length > 3) {
			return true;
		}

		if(this.props.profile.following && this.props.profile.following.length > 3) {
			return true;
		}

		return false;
	}

	makeActive(newActive) {
		this.setState({
			active: newActive
		});
	}

	onAlert(alert) {
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

		alert = <div className={'alert alert-' + this.state.alert.level} role="alert">
				{this.state.alert.message}
			</div>;

		if(this.state.extended) {
			networkTab = <Tab title="Network" active={ this.state.active == 'Network' } onMakeActive={ () => this.makeActive('Network') }>
							<RelatedPeopleDetailed people={ this.props.profile.followers } title="Followers" more={ this.props.profile.followersMore } dataSource={ this.profileDataSource } />
							<RelatedPeopleDetailed people={ this.props.profile.following } title="Following" more={ this.props.profile.followingMore } dataSource={ this.profileDataSource } />
						</Tab>;

			groupsTab = <Tab title="Groups" active={ this.state.active == 'Groups' } onMakeActive={ () => this.makeActive('Groups') }>
							<GroupsDetailed userid={ this.props.userid } onViewMore={ () => this.makeActive('Groups') } />
						</Tab>;
		}

		return (
			<div className="container">
				{alert}
				<div className="user-profile-personal-details row">
					<div className="col-12 col-sm-6">
						<EditableAvatar value={ this.props.profile.meta.avatar } />
					</div>
					<div className="col-12 col-sm-6">
						<h2>
							<EditableField field="realname" emptytext="Your full name" value={ this.props.profile.meta.realname } />
						</h2>
						<ul>
							<li>
								<EditableField field="title" emptytext="Add your title" value={ this.props.profile.meta.title } />
							</li>
							<li>
								<EditableField field="academic" emptytext="Add you academic status" value={ this.props.profile.meta.academic } />
							</li>
							<li>
								<EditableField field="affiliation" emptytext="Add your university" value={ this.props.profile.meta.affiliation } />
							</li>
							<li>
								<EditableField field="location" emptytext="Add you location" value={ this.props.profile.meta.location } />
							</li>
							<li>
								<EditableItems field="social" uniform={true} emptytext="Add social profile" value={this.props.profile.meta.social}>
									<EditableSocialItem />
								</EditableItems>
							</li>
						</ul>
					</div>
				</div>
				<div className="row">
					<div className='col-12'>
						<Tabs extended={ this.state.extended }>
							<Tab title="About" active={ this.state.active == 'About' } onMakeActive={ () => this.makeActive('About') }>
								<div className='row'>
									<div className="col-12 col-sm-8">
										<EditableRich title="About" field="bio" emptytext="Add a short description of what you are currently working on" value={ this.props.profile.meta.bio } />
										<EditableItems field="interests" title="Research interests" emptytext="Add your research intereststo show what you are passionate about" value={ this.props.profile.meta.interests }>
											<EditableInterestItem />
										</EditableItems>

										<Publications userid={ this.props.userid } />

										<EditableItems field="experience" title="Professional experience" emptytext="Add your professional experience to share where you have been working" value={ this.props.profile.meta.experience }>
											<EditableExperienceItem />
										</EditableItems>

										<EditableItems field="education" title="Education history" emptytext="Add your education history to show where you have completed your studies" value={ this.props.profile.meta.education }>
											<EditableEducationItem />
										</EditableItems>
									</div>
									<div className="col-12 col-sm-4">
										<RelatedPeople people={ this.props.profile.followers.slice(0, 3) } title="Followers" more={ this.props.profile.followers.length > 3 || this.props.profile.followersMore } onViewMore={ () => this.makeActive('Network') } />
										<RelatedPeople people={ this.props.profile.following.slice(0, 3) } title="Following" more={ this.props.profile.following.length > 3 || this.props.profile.followingMore } onViewMore={ () => this.makeActive('Network') } />
										<Groups userid={ this.props.userid } onViewMore={ () => this.makeActive('Groups')} />
									</div>
								</div>
							</Tab>
							{ networkTab }
							{ groupsTab }
						</Tabs>
					</div>
				</div>
			</div>
		);
	}

	static get ALERT_AUTO_HIDE_TIME() {
		return 3000; //ms
	}
}

Profile.propTypes = {
	profile: PropTypes.object.isRequired,
	userid: PropTypes.number.isRequired
};
