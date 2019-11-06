import { log as logger } from './Log.js';
let log = logger.Logger('ChangeUsernameComponent');

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { ErrorWrapper } from './components/ErrorWrapper.jsx';
import { postFormData } from './ajax.js';
import { slugify } from './Utils.js';
import { buildUrl } from './wwwroutes.js';
import { Notifier } from './Notifier.js';
import { usernameValidation } from './Validate.js';

function FormFieldErrorMessage(props) {
	return (
		<p className='form-field-error'>{props.message}</p>
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
	const [usernameValidity, setUsernameValidity] = useState('undecided');
	const [usernameMessage, setUsernameMessage] = useState('');
	const [forumUsernameValidity, setForumUsernameValidity] = useState('undecided');
	const [forumUsernameMessage, setForumUsernameMessage] = useState('');
	const [formErrors, setFormErrors] = useState({});
	const [formError, setFormError] = useState(undefined);
	const [forumSpecific, setForumSpecific] = useState(props.username !== props.forumUsername);
	const [changeSuccessful, setChangeSuccessful] = useState(undefined);

	const handleForumCheck = (evt) => {
		setForumSpecific(evt.target.checked);
	};

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
		setForumUsernameValidity(result.usernameValidity);
		setForumUsernameMessage(result.usernameMessage);
	};

	const checkUsername = async (skipServer = false) => {
		let username = formData.username;
		let result = await usernameValidation(username, skipServer);
		log.debug(result, 4);
		setUsernameValidity(result.usernameValidity);
		setUsernameMessage(result.usernameMessage);
	};

	const saveUsername = async (evt) => {
		if (evt) {
			evt.preventDefault();
		}
		const { username, forumUsername } = formData;
		
		let changeUrl = buildUrl('changeUsername');
		let saveData = { username: username, forumUsername: username };
		if (forumSpecific) {
			saveData = { username, forumUsername };
		}
		try {
			const response = await postFormData(changeUrl, saveData, { withSession: true });
			const data = await response.json();
			if (data.success) {
				setChangeSuccessful(true);
			} else {
				setChangeSuccessful(false);
				setFormError('There was an error changing your username');
			}
		} catch (response) {
			if (response.status == 429) {
				setChangeSuccessful(false);
				setFormError('Username has been changed too recently');
			} else {
				setChangeSuccessful(false);
				setFormError('There was an error changing your username');
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
			setUsernameValidity('undecided');
			setUsernameMessage('');
			if (value !== props.username) {
				checkUsername(true); // check username validity on every change, but only locally
			}
		} else if (target.name == 'forumUsername') {
			setForumUsernameValidity('undecided');
			setForumUsernameMessage('');
			if (value !== props.forumUsername) {
				this.checkForumUsername(true); // check username validity on every change, but only locally
			}
		}
	};

	let slug = '<username>';
	if (formData.username) {
		slug = slugify(formData.username);
	}
	let profileUrl = buildUrl('profileUrl', { slug });
	let previewClass = 'profile-preview ' + usernameValidity;
	let forumFeedbackClass = 'username-message ' + forumUsernameValidity;

	let usernameForm = (
		<form id='username-form'>
			<div className='form-group'>
				<input className='form-control' type='text' name='username' placeholder='Username' onChange={handleChange} onBlur={handleBlur} value={formData.username}></input>
				<p className={previewClass}>{profileUrl}</p>
				<p className='username-message'>{usernameMessage}</p>
				<FormFieldErrorMessage message={formErrors.username} />
				<label htmlFor='forumSpecific'>
					<input type='checkbox' checked={forumSpecific} name='forumSpecific' id='forumSpecific' onChange={handleForumCheck} />
					Use a different username on the Zotero forums
				</label>
				{forumSpecific
					? <>
						<input className='form-control' type='text' name='forumUsername' placeholder='Forum Username' onChange={handleChange} onBlur={handleBlur} value={formData.forumUsername}></input>
						<p className={forumFeedbackClass}>{forumUsernameMessage}</p>
						<FormFieldErrorMessage message={formErrors.forumUsername} />
					</>
					: ''
				}
			</div>
			<button className='btn btn-secondary' onClick={saveUsername}>Save</button>
		</form>
	);

	let notifier = null;
	if (changeSuccessful) {
		let message = 'Your username has been updated';
		notifier = <Notifier type='success' message={message} />;
	} else if (formError) {
		notifier = <Notifier type='error' message={formError} />;
	}
	
	return (
		<section className='change-username-section'>
			{usernameForm}
			{notifier}
		</section>
	);
}
UsernameForm.propTypes = {
	username: PropTypes.string,
	forumUsername: PropTypes.string,
};

function ChangeUsername(props) {
	const { username, forumUsername } = props;
	// const [username, setUsername] = useState(props.username);
	// const [forumUsername, setForumUsername] = useState(props.forumUsername);
	const [activated, setActivated] = useState(false);

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
					<UsernameForm username={username} forumUsername={forumUsername} />
				</div>
			</ErrorWrapper>
		);
	} else {
		return (
			<ErrorWrapper>
				<div className='change-username react'>
					<strong>Username: {username}</strong> <p className='hint'><a href='#' onClick={activate}>change</a></p>
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
