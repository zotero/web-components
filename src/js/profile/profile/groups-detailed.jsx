/* global Zotero:false */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import GroupsBase from '../abstract/groups-base.jsx';
import profileEventSystem from '../profile-event-system.js';
import {buildUrl} from '../../wwwroutes.js';
import {typeMap} from '../../maps/groupMaps.js';
import {Row, Col} from 'reactstrap';

let groupMemberCount = function(group){
	let count = 1;
	if(group.data.members){
		count += group.data.members.length;
	}
	if(group.data.admins){
		count += group.data.admins.length;
	}
	return count;
}

export default class GroupsDetailed extends GroupsBase {
	constructor(props) {
		super(props);
		this.state = {
			groups: []
		};
	}

	componentWillMount() {
		this.fetchUserGroups(this.props.userid)
			.then(response => {
				this.setState({
					more: response.fetchedGroups.length > this.props.count,
					groups: response.fetchedGroups.slice(0, this.props.count),
					loading: false
				});
			}).catch(error => {
				profileEventSystem.trigger('alert', {
					level: 'danger',
					message: error.responseJSON ? error.responseJSON.message : 'Failed to update items groupsDetailed'
				});
			});
	}

	render() {
		return <div className="profile-groups-detailed">
			<h2>Groups</h2>
			<Row>
				{this.state.groups.map(group => {
					let groupUrl = buildUrl('groupView', {group:group});
					return (
						<Col xs='12' sm='6' md='4' key={ group.id }>
							<div className="profile-groups-detailed-details">
								<div className="profile-groups-detailed-details-groupname">
									<span>
										<a href={groupUrl}>{ group.data.name }</a>
									</span>
									<a href={ groupUrl } className="profile-groups-detailed-details-join">
										Join
									</a>
								</div>
								<div>
									{ groupMemberCount(group) } Members
								</div>
								<div>
									{ typeMap[group.data.type] }
								</div>
							</div>
						</Col>
					);
				})}
			</Row>
		</div>;
	}

	static get defaultProps() {
		return {
			count: 6
		};
	}
}

GroupsDetailed.propTypes = {
	userid: PropTypes.number.isRequired,
	count: PropTypes.number,
	onViewMore: PropTypes.func.isRequired
};