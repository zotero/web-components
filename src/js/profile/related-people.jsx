'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import {eventSystem} from '../EventSystem.js';
import {ProfileDataSource} from './profile-data-source.js';
import {Row, Col, Button} from 'reactstrap';
import {Spinner} from '../LoadingSpinner.js';

class RelatedPeople extends React.Component {
	viewMoreHandler = (ev) => {
		ev.preventDefault();
		this.props.onViewMore();
	}

	render() {
		var viewAllButton;
		if(this.props.people.length == 0) {
			return null;
		}

		if(this.props.more) {
			viewAllButton = <span className="profile-side-panel-header-link"><a onClick={this.viewMoreHandler} href="">View All</a></span>;
		}
		return <div className="profile-side-panel" id={`${this.props.id}-side-panel`}>
			<h3>{this.props.title}</h3>
			{viewAllButton}
			<ul>
				{this.props.people.map(person => 
				<li key={person.userID}>
					<div>
						{person.displayName}
					</div>
					<div>
						<a href={'/' + person.slug}>Follow</a>
					</div>
				</li>)}
			</ul>
		</div>;
	}
}

RelatedPeople.propTypes = {
	people: PropTypes.array.isRequired,
	more: PropTypes.bool,
	title: PropTypes.string.isRequired,
	onViewMore: PropTypes.func.isRequired
};

class RelatedPeopleDetailed extends React.Component {
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
			eventSystem.trigger('alert', {
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
				<Spinner color='blue' />
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
					
					if(person.meta.profile.academic) {
						academic = <div className="profile-related-people-detailed-academic">
							{ person.meta.profile.academic }
						</div>;
					}

					if(person.meta.profile.affiliation) {
						affiliation = <div className="profile-related-people-detailed-affiliation">
							{ person.meta.profile.affiliation }
						</div>;
					}

					return (
						<Col xs='12' sm='6' md='4' key={ person.userID }>
							<div className="profile-related-people-detailed-details">
								<div className="profile-related-people-detailed-avatar float-left mr-2">
									<img src={ person.avatar || this.constructor.FALLBACK_AVATAR } />
								</div>
								<div className="profile-related-people-detailed-details-username">
									<span>
										{ person.displayName || person.username }
									</span>
									<a href={ '/' + person.slug } className="profile-related-people-detailed-details-follow">
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
		userID: PropTypes.string.isRequired,
		realname: PropTypes.string,
		affiliation: PropTypes.string,
		academic: PropTypes.string,
		avatar: PropTypes.string
	})).isRequired,
	more: PropTypes.bool,
	title: PropTypes.string.isRequired,
	dataSource: PropTypes.instanceOf(ProfileDataSource).isRequired
};

export {RelatedPeople, RelatedPeopleDetailed};