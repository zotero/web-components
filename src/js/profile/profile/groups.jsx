/* global Zotero:false */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import GroupsBase from '../abstract/groups-base.jsx';
import {eventSystem} from '../../EventSystem.js';
import {buildUrl} from '../../wwwroutes.js';

class Groups extends GroupsBase {
	constructor(props) {
		super(props);
		this.state = {
			groups: [],
			more: false,
			loading: true
		};
	}

	componentDidMount = () => {
		this.fetchUserGroups(this.props.userid)
			.then(response => {
				if(response.fetchedGroups.length > this.props.count) {
					this.props.onExtended();
				}
				this.setState({
					more: response.fetchedGroups.length > this.props.count,
					groups: response.fetchedGroups.slice(0, this.props.count),
					loading: false
				});
			}).catch(error => {
				console.log(error);
				eventSystem.trigger('alert', {
					level: 'danger',
					message: error.responseJSON ? error.responseJSON.message : 'Failed to update items groups'
				});
			});
	}

	
	viewMoreHandler = (ev) => {
		ev.preventDefault();
		this.props.onViewMore();
	}

	render() {
		var viewAllButton;

		if(this.state.groups.length == 0) {
			return null;
		}

		if(this.state.more) {
			viewAllButton = (<span className="profile-side-panel-header-link">
				<a onClick={this.viewMoreHandler} href="">View All</a>
			</span>);
		}

		return (<div className="profile-side-panel">
			<h3>Groups</h3>
			{ viewAllButton }
			<ul>
				{this.state.groups.map(group => 
					<li key={ group.data.id }>
						<div>
							{ group.data.name }
						</div>
						<div>
							<a href={ buildUrl('groupView', {group:group}) }>Join</a>
						</div>
					</li>)}
			</ul>
		</div>);
	}

	static get defaultProps() {
		return {
			count: 3
		};
	}
}

Groups.propTypes = {
	userid: PropTypes.number.isRequired,
	count: PropTypes.number,
	onViewMore: PropTypes.func.isRequired
};

export {Groups};