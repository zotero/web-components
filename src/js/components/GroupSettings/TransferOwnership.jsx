// import {log as logger} from '../../Log.js';
// let log = logger.Logger('TransferOwnership');

import React, { useState } from 'react';

import { Form, Card, CardTitle, CardBody, FormGroup, CustomInput, Button, Alert } from 'reactstrap';
import { postFormData } from '../../ajax.js';
import { buildUrl } from '../../wwwroutes.js';

function TransferOwnership(props) {
	const { group, displayNames } = props;
	const { owner, members, admins } = group.data;
	const nonOwnerMembers = [].concat(members, admins).filter(v => v != null);
	
	const [pendingOwner, setPendingOwner] = useState(props.pendingOwner);
	const [newOwner, setNewOwner] = useState(nonOwnerMembers[0]);
	const [notification, setNotification] = useState(null);
	
	let submitTransfer = async () => {
		const transferUrl = buildUrl('transferGroup', { group });
		try {
			let resp = await postFormData(transferUrl, { transferAction: 'newOwner', newOwner }, { withSession: true });
			let d = await resp.json();
			if (!d.success) {
				throw d.message;
			} else {
				setPendingOwner(newOwner);
				setNotification({ type: 'success', message: 'An invitation to take ownership of the group has been sent. You will remain the owner until this is accepted by the new owner or you revoke the invitation.' });
			}
		} catch (e) {
			return (
				<Alert color='error'>There was an error submitting the group transfer. Please try again in a few minutes.</Alert>
			);
		}
	};
	
	let submitCancel = async () => {
		const transferUrl = buildUrl('transferGroup', { group });
		try {
			let resp = await postFormData(transferUrl, { transferAction: 'cancelTransfer' }, { withSession: true });
			let d = await resp.json();
			if (!d.success) {
				throw d.message;
			} else {
				setPendingOwner(null);
				setNotification({ type: 'success', message: 'The previous group transfer request has been cancelled.' });
			}
		} catch (e) {
			return (
				<Alert color='error'>There was an error submitting the group transfer. Please try again in a few minutes.</Alert>
			);
		}
	};
	
	let actionNode = null;
	if (pendingOwner) {
		actionNode = <p>There is an invitation to accept ownership of this group pending with {displayNames[pendingOwner]} <Button className='ml-2' onClick={submitCancel}>Cancel Transfer</Button></p>;
	} else if (nonOwnerMembers.length == 0) {
		return (
			<Alert color='info'>As the owner of the group, you can transfer it to another user, however there are currently no other users in the group.</Alert>
		);
	} else {
		let ownerOptions = nonOwnerMembers.map((member) => {
			if (member == owner) return null;
			return <option key={member} value={member}>{displayNames[member]}</option>;
		});
		actionNode = (
			<Form inline>
				<FormGroup>
					<CustomInput inline id='newOwner' type='select' name='newOwner' onChange={(evt) => { setNewOwner(evt.target.value); }}>
						{ownerOptions}
					</CustomInput>
				</FormGroup>
				<Button className='ml-2' onClick={submitTransfer}>Transfer</Button>
			</Form>
		);
	}
	
	return (
		<div className='transfer-group'>
			<Card className='mb-3'>
				<CardBody>
					<CardTitle>Transfer Ownership</CardTitle>
					{notification ? <Alert color={notification.type}>{notification.message}</Alert> : null}
					{actionNode}
				</CardBody>
			</Card>
		</div>
	);
}

export { TransferOwnership };
