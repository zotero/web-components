'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import profileEventSystem from '../profile-event-system.js';
import ProfileDataSource from '../profile-data-source.js';

export default class RelatedPeopleDetailed extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			loading: false,
			all: !this.props.more,
			people: this.props.people
		};
	}

	showAllHandler() {
		this.setState({
			loading: true
		});

		this.props.dataSource.getData(
			this.props.title.toLowerCase(),
			'all'
		).done(response => {
			this.setState({
				people: response.data,
				loading: false,
				all: true
			});
		}).fail(error => {
			profileEventSystem.trigger('alert', {
				level: 'danger',
				message: error.responseJSON ? error.responseJSON.message : 'Failed to update items'
			});
			this.setState({
				loading: false
			});
		});
	}

	render() {
		var footer;

		if(this.state.loading) {
			footer = <div className="profile-related-people-detailed-action">
				<div className="profile-editable-spinner"></div>
			</div>;
		} else if(!this.state.all) {
			footer = <div className="profile-related-people-detailed-action">
				<button className="btn btn-secondary" onClick={ ev => this.showAllHandler(ev) }>
					Show All
				</button>
			</div>;
		}

		return <div className="profile-related-people-detailed">
			<h2>{ this.props.title }</h2>
			<ul className="row">
				{ this.state.people.map(person => {
					var academic, affiliation;
					
					if(person.academic) {
						academic = <div className="profile-related-people-detailed-academic">
							{ person.academic }
						</div>;
					}

					if(person.affiliation) {
						affiliation = <div className="profile-related-people-detailed-affiliation">
							{ person.affiliation }
						</div>;
					}

					return <li key={ person.userID }>
						<div className="profile-related-people-detailed-avatar">
							<img src={ person.avatar || this.constructor.FALLBACK_AVATAR } />
						</div>
						<div className="profile-related-people-detailed-details">
							<div className="profile-related-people-detailed-details-username">
								<span>
									{ person.realname || person.username }
								</span>
								<a href={ '/' + person.username } className="profile-related-people-detailed-details-follow">
									Follow
								</a>
							</div>
							{ academic }
							{ affiliation }
						</div>
					</li>;
				})}
			</ul>
			{ footer }
		</div>;
	}

	static get FALLBACK_AVATAR() {
		return '/static/images/theme/portrait-fallback.png';
	}
}

RelatedPeopleDetailed.propTypes = {
	people: PropTypes.array.isRequired,
	more: PropTypes.bool,
	title: PropTypes.string.isRequired,
	dataSource: PropTypes.instanceOf(ProfileDataSource).isRequired
};