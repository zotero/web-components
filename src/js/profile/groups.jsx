// import {log as logger} from '../Log.js';
// let log = logger.Logger('groups.jsx');

import React from 'react';
import PropTypes from 'prop-types';

import { buildUrl } from '../wwwroutes.js';
import { typeMap } from '../maps/groupMaps.js';
import { Row, Col } from 'reactstrap';
import { Spinner } from '../LoadingSpinner';

let groupMemberCount = function (group) {
	let count = 1;
	if (group.data.members) {
		count += group.data.members.length;
	}
	if (group.data.admins) {
		count += group.data.admins.length;
	}
	return count;
};

function Groups(props) {
	let viewAllButton;
	let { groups, loaded, count, onViewMore } = props;
	
	const viewMoreHandler = (ev) => {
		ev.preventDefault();
		onViewMore();
	};

	if (!loaded) {
		return (<div className='profile-side-panel'>
			<Spinner />
		</div>);
	}

	if (loaded && groups.length == 0) {
		return null;
	}

	let more = groups.length > count;

	if (more) {
		viewAllButton = (<span className='profile-side-panel-header-link'>
			<a onClick={viewMoreHandler} href=''>View All</a>
		</span>);
	}

	return (<div className='profile-side-panel'>
		<h3>Groups</h3>
		{ viewAllButton }
		<ul>
			{groups.slice(0, 3).map(group => (
				<li key={ group.data.id }>
					<div>
						<a href={ buildUrl('groupView', { group: group }) }>{ group.data.name }</a>
					</div>
				</li>
			))}
		</ul>
	</div>);
}
Groups.defaultProps = {
	count: 3,
	groups: [],
	loaded: false,
};

Groups.propTypes = {
	count: PropTypes.number,
	onViewMore: PropTypes.func.isRequired,
	loaded: PropTypes.bool,
	groups: PropTypes.array,
};


function GroupsDetailed(props) {
	let { groups, loaded } = props;
	if (!loaded) {
		return (<div className='profile-groups-detailed'>
			<Spinner />
		</div>);
	}
	return <div className='profile-groups-detailed'>
		<h2>Groups</h2>
		<Row>
			{groups.map((group) => {
				let groupUrl = buildUrl('groupView', { group: group });
				return (
					<Col xs='12' sm='6' md='4' key={ group.id }>
						<div className='profile-groups-detailed-details'>
							<div className='profile-groups-detailed-details-groupname'>
								<span>
									<a href={groupUrl}>{ group.data.name }</a>
								</span>
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

GroupsDetailed.propTypes = {
	groups: PropTypes.arrayOf(PropTypes.shape({
		data: PropTypes.object
	})),
	loaded: PropTypes.bool,
	onViewMore: PropTypes.func.isRequired
};

export { Groups, GroupsDetailed };
