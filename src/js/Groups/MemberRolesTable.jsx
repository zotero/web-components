// import {log as logger} from '../Log.js';
// let log = logger.Logger('MemberRolesTable.jsx');

import { useState } from 'react';
import { Table, CustomInput } from 'reactstrap';

import { buildUrl } from '../wwwroutes.js';
import { LoadingSpinner } from '../LoadingSpinner.js';
import PropTypes from 'prop-types';

const groupShape = PropTypes.shape({
	data: PropTypes.shape({
		admins: PropTypes.array,
		members: PropTypes.array,
		owner: PropTypes.number
	})
}).isRequired;

const memberShape = PropTypes.shape({
	userID: PropTypes.number,
	displayName: PropTypes.string,
}).isRequired;

function RoleForm(props) {
	const { group, member, updateRole, currentRole, setLoading } = props;
	
	if (currentRole == 'owner') {
		return 'Owner';
	} else {
		return (
			<CustomInput id={'role_' + member.userID} type='select' value={currentRole} onChange={async (evt) => { setLoading(true); await updateRole(member, group, evt.target.value); setLoading(false); }}>
				<option value='admin'>Admin</option>
				<option value='member'>Member</option>
				<option value='remove'>Remove</option>
			</CustomInput>
		);
	}
}
function RoleRow(props) {
	const { group, member, updateRole } = props;
	const [loading, setLoading] = useState(false);
	
	let currentRole = null;
	if (member.userID == group.data.owner) {
		currentRole = 'owner';
	} else if (group.data.admins && group.data.admins.includes(member.userID)) {
		currentRole = 'admin';
	} else if (group.data.members && group.data.members.includes(member.userID)) {
		currentRole = 'member';
	}
	if (currentRole === null) {
		return null;
	}
	return (<tr>
		<td><a href={buildUrl('profileUrl', { slug: member.slug })}>{member.username}</a></td>
		<td>{member.displayName}</td>
		<td><RoleForm {...{ group, member, updateRole, currentRole, setLoading }} /></td>
		<td className='loading-col'><LoadingSpinner loading={loading} /></td>
	</tr>);
}
RoleRow.propTypes = {
	group: groupShape,
	member: memberShape,
	updateRole: PropTypes.func.isRequired
};

function RolesTable(props) {
	const { group, members, updateRole } = props;
	
	let membersRows = members.map((member) => {
		return <RoleRow key={member.userID} {...{ group, member, updateRole }} />;
	});
	
	return (<Table striped>
		<thead>
			<tr>
				<th>Username</th>
				<th>Full Name</th>
				<th>Role</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{membersRows}
		</tbody>
	</Table>);
}
RolesTable.propTypes = {
	group: groupShape,
	members: PropTypes.arrayOf(memberShape),
	updateRole: PropTypes.func.isRequired
};

export { RolesTable };
