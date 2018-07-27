'use strict';

import React from 'react';
import PropTypes from 'prop-types';

export default class RelatedPeople extends React.Component {
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
						{person.username}
					</div>
					<div>
						<a href={'/' + person.username}>Follow</a>
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