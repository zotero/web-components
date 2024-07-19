import { log as logger } from './Log.js';
let log = logger.Logger('ChangeUsernameComponent');

import { useState, useEffect } from 'react';
import { Button, Form, FormGroup, Input, Label } from 'reactstrap';
import PropTypes from 'prop-types';

import { ErrorWrapper } from './components/ErrorWrapper.jsx';
import { postFormData } from './ajax.js';
import { slugify } from './Utils.js';
import { buildUrl } from './wwwroutes.js';
import { Notifier } from './Notifier.js';
import { usernameValidation } from './Validate.js';

function FormFieldErrorMessage(props) {
	return (
		<p className='invalid-feedback'>{props.message}</p>
	);
}
FormFieldErrorMessage.propTypes = {
	message: PropTypes.string
};

function UsernameForm(props) {
	const [formData, setFormData] = useState({
		username: props.username,
		forumUsername: props.forumUsername,
	});
	const { setNotification, setActivated } = props;

	const [usernameValidity, setUsernameValidity] = useState(null);
	const [usernameMessage, setUsernameMessage] = useState('');
	const [forumUsernameValidity, setForumUsernameValidity] = useState(null);
	const [forumUsernameMessage, setForumUsernameMessage] = useState('');
	// const [forumSpecific, setForumSpecific] = useState(props.username !== props.forumUsername);

	// const handleForumCheck = (evt) => {
	// 	setForumSpecific(evt.target.checked);
	// };

	const handleBlur = (evt) => {
		if (evt.target.name == 'username') {
			if (evt.target.value != props.username) {
				checkUsername(false);
			}
		} else if (evt.target.name == 'forumUsername') {
			if (evt.target.value != props.forumUsername) {
				checkForumUsername(false);
			}
		}
	};

	const checkForumUsername = async (skipServer = false) => {
		log.debug('checkForumUsername', 4);
		let username = formData.forumUsername;
		let result = await usernameValidation(username, skipServer);
		log.debug(result, 4);
		setForumUsernameValidity(result.usernameValid);
		setForumUsernameMessage(result.usernameMessage);
	};

	const checkUsername = async (skipServer = false) => {
		let username = formData.username;
		let result = await usernameValidation(username, skipServer);
		log.debug(result, 4);
		setUsernameValidity(result.usernameValid);
		setUsernameMessage(result.usernameMessage);
	};

	const saveUsername = async (evt) => {
		if (evt) {
			evt.preventDefault();
		}
		const { username, forumUsername } = formData;

		//check if values have changed
		if (username == props.username && forumUsername == props.forumUsername) {
			//no change
			setNotification({type:'success', message:'Username not changed'});
			setActivated(false);
			return;
		}
		
		let changeUrl = buildUrl('changeUsername');
		let saveData = { username, forumUsername };
		// if (forumSpecific) {
		// 	saveData = { username, forumUsername };
		// }
		try {
			const response = await postFormData(changeUrl, saveData, { withSession: true });
			const data = await response.json();
			if (data.success) {
				setNotification({type:'success', message:'Your username has been updated'});
				setActivated(false);
			} else {
				setNotification({type:'error', message:'There was an error changing your username'})
			}
		} catch (response) {
			if (response.status == 429) {
				setNotification({type:'error', message:'Username has been changed too recently'});
				setActivated(false);
			} else {
				setNotification({type:'error', message:'There was an error changing your username'})
			}
		}
	};

	const handleChange = (evt) => {
		const target = evt.target;
		const value = target.type === 'checkbox' ? target.checked : target.value;
		let newFormData = formData;
		newFormData[target.name] = value;

		setFormData(newFormData);
		if (target.name == 'username') {
			setUsernameValidity(null);
			setUsernameMessage('');
			if (value !== props.username) {
				checkUsername(true); // check username validity on every change, but only locally
			}
		} else if (target.name == 'forumUsername') {
			setForumUsernameValidity(null);
			setForumUsernameMessage('');
			if (value !== props.forumUsername) {
				checkForumUsername(true); // check username validity on every change, but only locally
			}
		}
	};

	let slug = '<username>';
	if (formData.username) {
		slug = slugify(formData.username);
	}
	let profileUrl = buildUrl('profileUrl', { slug });
	let previewClass = 'profile-preview ' + (usernameValidity ? 'valid-feedback' : 'invalid-feedback');
	let usernameValidityProps = {
		valid: usernameValidity === true,
		invalid: usernameValidity === false,
	};
	let forumUsernameValidityProps = {
		valid: forumUsernameValidity === true,
		invalid: forumUsernameValidity === false,
	}

	let usernameForm = (
		<Form id='username-form'>
			<FormGroup>
				<Label htmlFor='username-input'>Login Username</Label>
				<Input id='username-input' type='text' name='username' placeholder='Username' onChange={handleChange} onBlur={handleBlur} value={formData.username} {...usernameValidityProps} ></Input>
				<p className={previewClass}>{profileUrl}</p>
				{usernameMessage ? <FormFieldErrorMessage message={usernameMessage} /> : null}
			</FormGroup>
			<FormGroup>
				<Label htmlFor='forumUsername-input'>Forum Username</Label>
				<Input id='forumUsername-input' type='text' name='forumUsername' placeholder='Forum Username' onChange={handleChange} onBlur={handleBlur} value={formData.forumUsername} {...forumUsernameValidityProps}></Input>
				{forumUsernameMessage ? <FormFieldErrorMessage message={forumUsernameMessage} /> : null}
			</FormGroup>
			<Button className='btn btn-secondary' onClick={saveUsername}>Save</Button>
		</Form>
	);

	return (
		<section className='change-username-section'>
			{usernameForm}
		</section>
	);
}
UsernameForm.propTypes = {
	username: PropTypes.string,
	forumUsername: PropTypes.string,
};

function ChangeUsername(props) {
	const { username, forumUsername } = props;
	const [activated, setActivated] = useState(false);
	const [notification, setNotification] = useState(null);

	useEffect(() => {
		document.documentElement.className += ' react-mounted';
	});

	const activate = (evt) => {
		evt.preventDefault();
		setActivated(true);
	};

	if (activated) {
		return (
			<ErrorWrapper>
				<div className='change-username react'>
					<Notifier {...notification} />
					<UsernameForm {...{
						username,
						forumUsername,
						setNotification,
						setActivated,
					}}
				/>
				</div>
			</ErrorWrapper>
		);
	} else {
		return (
			<ErrorWrapper>
				<div className='change-username react'>
					<Notifier {...notification} />
					<p>Login Username: {username}</p><small className='text-muted'>Used to log in and through most of the site including groups and libraries.</small>
					
					<p>Forums Display Name: {forumUsername}</p>
					<small className='text-muted'>Shown when posting to the Zotero forums.</small>

					<div className='mt-4'>
						<Button onClick={activate}>Change Username</Button>
					</div>
				</div>
			</ErrorWrapper>
		);
	}
}
ChangeUsername.propTypes = {
	username: PropTypes.string,
	forumUsername: PropTypes.string,
};

export { ChangeUsername };
