// import { log as logger } from '../Log.js';
// let log = logger.Logger('GroupInvitations');

import { ajax, postFormData } from '../ajax.js';
import { getCurrentUser } from '../Utils.js';
import { Button, Card, CardHeader, CardBody, Row, Col } from 'reactstrap';

const currentUser = getCurrentUser();

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { buildUrl } from '../wwwroutes.js';

function GroupInvitation(props) {
	const { group, invitation } = props;
	const [done, setDone] = useState(false);

	const acceptInvitation = () => {
		let url = buildUrl('groupJoin', { group });
		postFormData(url, { token: invitation.token }).then(() => {
			setDone(true);
		});
	};

	const declineInvitation = () => {
		let url = buildUrl('groupDecline', { group, token: invitation.token });
		postFormData(url, { token: invitation.token }).then(() => {
			setDone(true);
		});
	};

	if (done) {
		return null;
	}

	return (
		<>
			<strong className='group-title'><a href={buildUrl('groupView', { group })}>{group.data.name}</a></strong>
			{/* <span className="group-description">{group.data.description}</span>*/}
			<div className='group-buttons'>
				<Button outline onClick={acceptInvitation} className='accept-invitation'>Join</Button>{' '}
				<Button outline onClick={declineInvitation} className='ignore-invitation'>Ignore</Button>
			</div>
		</>
	);
}
GroupInvitation.propTypes = {
	group: PropTypes.object,
	invitation: PropTypes.shape({
		token: PropTypes.string,
	}),
};

function GroupInvitations(_props) {
	const [invitations, setInvitations] = useState([]);
	const [invitationGroups, setInvitiationGroups] = useState([]);
	const [loaded, setLoaded] = useState(false);

	const loadInvitations = async () => {
		if (currentUser) {
			const resp = await ajax({ url: '/groups/invitations' });
			const data = await resp.json();
			let invitationGroups = {};
			data.invitations.forEach((val) => {
				invitationGroups[val.groupID] = data.invitationGroups[val.groupID].apiObj;
			});

			setInvitations(data.invitations);
			setInvitiationGroups(invitationGroups);
			setLoaded(true);
		}
	};

	useEffect(() => {
		loadInvitations();
	}, []);
	
	if (!loaded) { return null; }

	let invitationNodes = invitations.map((invitation) => {
		let group = invitationGroups[invitation.groupID];
		return (
			<Row key={invitation.groupID}>
				<Col>
					<GroupInvitation key={invitation.groupID} group={group} invitation={invitation} />
				</Col>
			</Row>
		);
	});

	if (invitations.length == 0) {
		return <span className='group-invitations d-none'></span>;
	}
	return (
		<Card className='group-invitations'>
			<CardHeader>Group Invitations</CardHeader>
			<CardBody>
				{invitationNodes}
			</CardBody>
		</Card>
	);
}

export { GroupInvitations };
