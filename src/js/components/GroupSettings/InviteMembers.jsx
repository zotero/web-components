import { log as logger } from '../../Log.js';
let log = logger.Logger('InviteMembers');

import { ajax, postFormData } from '../../ajax.js';
// import { getCurrentUser } from '../Utils.js';
import { Form, Input, FormGroup, Label, Button, FormText } from 'reactstrap';

// const currentUser = getCurrentUser();

import { useState } from 'react';
import PropTypes from 'prop-types';

// import { buildUrl } from '../wwwroutes.js';

const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const usernameRegex = /^[a-z0-9._-]{3,}$/i;
const numeralsRegex = /^[0-9]+$/i;

function FormFieldErrorMessage(props) {
	return (
		<p className='form-field-error'>{props.message}</p>
	);
}
FormFieldErrorMessage.propTypes = {
	message: PropTypes.string
};

function InviteMembers(props) {
	const [inviteText, setInviteText] = useState('');
	const [feedback, setFeedback] = useState([]);
	const [notification, setNotification] = useState(false);
	
	const validateForm = async (evt) => {
		evt.preventDefault();
		let valid = true;
		let newFeedback = [];
		let invitees = inviteText.split(/[\n,]/);
		invitees = invitees.map((invitee) => {
			return invitee.trim();
		});
		invitees = invitees.filter(invitee => invitee.length > 3);
		invitees.forEach((invitee) => {
			if (invitee.includes('@zotero.org')) {
				newFeedback.push('Cannot send to @zotero.org addresses');
				valid = false;
			}
			if (invitee.includes('@')) {
				if (!emailRegex.test(invitee)) {
					newFeedback.push(`'${invitee}' doesn't look like a valid email address.`);
					valid = false;
				}
			} else if (!usernameRegex.test(invitee) || numeralsRegex.test(invitee)) {
				newFeedback.push(`'${invitee}' does not look like a valid username.`);
				valid = false;
			}
		});
		if (invitees.length > 50) {
			newFeedback.push('Can only invite up to 50 users at a time');
			valid = false;
		}

		log.debug(invitees);
		if (!valid) {
			setFeedback(newFeedback);
		} else {
			let resp;
			try {
				resp = await postFormData('', {
					invitees: JSON.stringify(invitees),
					ajax: true
				}, { withSession: true });
	
				log.debug(resp, 4);
				if (!resp.ok) {
					throw new Error('Error sending invitations');
				}
				let respData = await resp.json();
				log.debug(respData, 4);
				setNotification({
					type: 'success',
					message: (<p>Invitations have been sent</p>)
				});
			} catch (e) {
				log.debug(resp, 4);
				setNotification({
					type: 'error',
					message: <p>There was an error sending your invitations. Please try again in a few minutes.</p>
				});
			}
		}
	};

	return (
		<Form onSubmit={validateForm}>
			<FormGroup>
				<Label for='invite_members'>Invite Members</Label>
				<Input type='textarea' name='invite_members' id='invite_members' onChange={(evt) => { setInviteText(evt.target.value); }} />
				<FormText>Separate email addresses or Zotero usernames with a comma or newline.</FormText>
				{feedback.map((err, i) => <FormFieldErrorMessage key={i} message={err} />)}
			</FormGroup>
			<Button type='submit'>Invite Members</Button>
		</Form>
	);
}

export { InviteMembers };
