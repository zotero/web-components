'use strict';

// import {log as logger} from '../Log.js';
// let log = logger.Logger('related-people');

import React from 'react';
import PropTypes from 'prop-types';

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
			viewAllButton = <span className="profile-side-panel-header-link float-right"><a onClick={this.viewMoreHandler} href="">View All</a></span>;
		}
		return <div className="profile-side-panel" id={`${this.props.id}-side-panel`}>
			<h3>{this.props.title}</h3>
			{viewAllButton}
			<ul>
				{this.props.people.map(person => 
				<li key={person.userID}>
					<div>
						<a href={'/' + person.slug}>{person.displayName}</a>
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
			people: props.people
		};
	}

	showMore = () => {
		this.props.loadRelatedUsers(this.props.type);
	}
	render() {
		let footer;
		let {loading} = this.state;
		let {title, people, total} = this.props;
		let all = !(people.length < total);
		
		if(!loading && people.length == 0){
			return null;
		}

		if(loading) {
			footer = <div className="profile-related-people-detailed-action">
				<Spinner color='blue' />
			</div>;
		} else if(!all) {
			footer = <div className="profile-related-people-detailed-action">
				<Button color='secondary' onClick={this.showMore}>
					More
				</Button>
			</div>;
		}

		return <div className="profile-related-people-detailed">
			<h2>{ title }</h2>
			<Row>
				{ people.map(person => {
					let academic, affiliation;
					
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
										<a href={ '/' + person.slug }>
											{ person.displayName || person.username }
										</a>
									</span>
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
		userID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
		realname: PropTypes.string,
		affiliation: PropTypes.string,
		academic: PropTypes.string,
		avatar: PropTypes.string
	})).isRequired,
	more: PropTypes.bool,
	title: PropTypes.string.isRequired,
};

export {RelatedPeople, RelatedPeopleDetailed};