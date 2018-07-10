'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import profileEventSystem from '../profile-event-system.js';
import ProfileDataSource from '../profile-data-source.js';
import {Row, Col, Button} from 'reactstrap';

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
				message: error.responseJSON ? error.responseJSON.message : 'Failed to update items people'
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
				<Button color='secondary' onClick={ ev => this.showAllHandler(ev) }>
					Show All
				</Button>
			</div>;
		}

		return <div className="profile-related-people-detailed">
			<h2>{ this.props.title }</h2>
			<Row>
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

					return (
						<Col xs='12' sm='6' md='4' key={ person.userID }>
							<div className="profile-related-people-detailed-details">
								<div className="profile-related-people-detailed-avatar float-left">
									<img src={ person.avatar || this.constructor.FALLBACK_AVATAR } />
								</div>
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
						</Col>
					);
				})}
			</Row>
			{ footer }
		</div>;
	}

	static get FALLBACK_AVATAR() {
		return '/static/images/theme/portrait-fallback.png';
	}
}

RelatedPeopleDetailed.propTypes = {
	people: PropTypes.arrayOf(PropTypes.shape({
		username: PropTypes.string.isRequired,
		userID: PropTypes.number.isRequired,
		realname: PropTypes.string,
		affiliation: PropTypes.string,
		academic: PropTypes.string,
		avatar: PropTypes.string
	})).isRequired,
	more: PropTypes.bool,
	title: PropTypes.string.isRequired,
	dataSource: PropTypes.instanceOf(ProfileDataSource).isRequired
};