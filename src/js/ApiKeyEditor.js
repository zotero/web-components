import {log as logger} from './Log.js';
var log = logger.Logger('ApiKeyEditor');

import {Fragment, useState, useEffect, useContext, createContext} from 'react';
import PropTypes from 'prop-types';

import {RadioGroup, Radio} from './react-radio-group.js';
import {ajax, postFormData, loadAllUserGroups} from './ajax.js';
import {buildUrl} from './wwwroutes.js';
import {Notifier} from './Notifier.js';
import {getCurrentUser, querystring, parseQuery} from './Utils.js';
import {Alert, Label, Button, Input, Form, FormGroup, Card, CardBody, CardTitle} from 'reactstrap';
import {ErrorWrapper} from './components/ErrorWrapper.jsx';
import { Spinner } from './LoadingSpinner.js';

const currentUser = getCurrentUser();
const accessContext = createContext(null);

const scrollToTop = function () {
	window.scrollTo({
		top: 0,
		behavior: 'auto',
	});
};

const stringToBool = function (val) {
	if (val === true || val === false) {
		return val;
	}
	if (val === '0' || val === 0) {
		return false;
	} else if (val === '1' || val === 1) {
		return true;
	}
	log.error(`unexpected value in stringToBool: ${val}`);
	return false;
};

const boolAccess = function (access) {
	access.user.library = stringToBool(access.user.library);
	access.user.notes = stringToBool(access.user.notes);
	access.user.write = stringToBool(access.user.write);
	if (Array.isArray(access.groups)) {
		if (access.groups.length == 0) {
			access.groups = {};
		}
	}
	return access;
};
const accessShape = PropTypes.shape({
	user: PropTypes.shape({
		library: PropTypes.bool,
		notes: PropTypes.bool,
		write: PropTypes.bool,
	}),
	groups: PropTypes.shape({
		library: PropTypes.bool,
		write: PropTypes.bool,
	}),
});

const defaultValue = function (v, def) {
	if (typeof v === 'undefined') {
		return def;
	}
	if (v === null) {
		return def;
	}
	return v;
};

const requestedPermissions = function (userGroups = []) {
	const href = window.document.location.href;
	const qs = querystring(href);
	const queryVars = parseQuery(qs);
	let access = {
		user: {
			library: stringToBool(defaultValue(queryVars.library_access, 1)),
			files: stringToBool(defaultValue(queryVars.file_access, 0)),
			notes: stringToBool(defaultValue(queryVars.notes_access, 0)),
			write: stringToBool(defaultValue(queryVars.write_access, 0)),
		},
		groups: {
			all: defaultValue(queryVars.all_groups, 'none')
		}
	};

	switch (access.groups.all) {
	case 'none':
		access.groups.all = {};
		break;
	case 'read':
		access.groups.all = {library: true};
		break;
	case 'write':
		access.groups.all = {library: true, write: true};
		break;
	}
	
	for (let key in userGroups) {
		const group = userGroups[key];
		const varname = `group_${group.id}`;
		if (queryVars[varname] && queryVars[varname] != 'none') {
			access.groups[group.id] = queryVars[varname];
		}
	}

	return access;
};

const OAuthVerify = function (props) {
	const {applicationName, verifier} = props;
	return (
		<Alert color='success'>
			<h1 className='text-center'>Access Granted</h1>
			<p>To complete the transaction, return to {applicationName} and enter the verification code below.</p>
			<p id='oauth_verifier' className='text-center'>{verifier}</p>
		</Alert>
	);
};
OAuthVerify.propTypes = {
	applicationName: PropTypes.string,
	verifier: PropTypes.string
};

// human readable summary of currently selected permissions
const PermissionsSummary = function (props) {
	const {access} = useContext(accessContext);
	const {userGroups} = props;
	let userGroupsByKey = {};
	for (let group of userGroups) {
		userGroupsByKey[group.id] = group;
	}
	let summary = [];
	
	// personal library settings
	if (access.user.library) {
		summary.push(<li key='personal_read'>Access to read your personal library</li>);
	}
	if (access.user.notes) {
		summary.push(<li key='personal_notes'>Access to read notes in your personal library</li>);
	}
	if (access.user.write) {
		summary.push(<li key='personal_write'>Access to modify your personal library</li>);
	}
	
	let individualGroups = [];
	if (access.groups) {
		for (let id in access.groups) {
			if (id != 'all') {
				individualGroups.push(id);
			}
		}
	
		// all groups library settings
		if (access.groups.all) {
			if (access.groups.all.write) {
				summary.push(<li key='all_groups_write'>Access to read and modify any of your group libraries</li>);
			} else if (access.groups.all.library) {
				summary.push(<li key='all_groups_read'>Access to read any of your group libraries</li>);
			}
		}

		for (let id of individualGroups) {
			const groupAccess = access.groups[id];
			const groupName = userGroupsByKey[id].name;
			if (groupAccess.write) {
				summary.push(<li key={`group_${id}_write`}>Access to read and modify library for group &quot;{groupName}&quot;</li>);
			} else if (groupAccess.library) {
				summary.push(<li key={`group_${id}_read`}>Access to read library for group &quot;{groupName}&quot;</li>);
			}
		}
	}

	if (summary.length == 0) {
		summary.push(<li key='empty_permssions'>No additional permissions selected</li>);
	}

	return (
		<Card id='key-permissions-summary' className='mb-4'>
			<CardBody>
				<CardTitle>Permissions</CardTitle>
				<ul>{summary}</ul>
			</CardBody>
		</Card>
	);
};

PermissionsSummary.propTypes = {
	access: accessShape.isRequired,
	userGroups: PropTypes.array
};

const PersonalLibraryPermissions = function () {
	const {access, updateAccess} = useContext(accessContext);
	const handleChange = (evt) => {
		let newAccess = Object.assign({}, access);
		if (!updateAccess) {
			log.Error('updateAccess not set on PersonalLibraryPermissions');
			return;
		}
		switch (evt.target.name) {
		case 'library':
		case 'files':
		case 'notes':
		case 'write':
			if (evt.target.checked) {
				newAccess.user[evt.target.name] = true;
			} else {
				newAccess.user[evt.target.name] = false;
			}
			
			break;
		default:
			log.error('Unexpected target for PersonalLibraryPermissions');
		}
		updateAccess(newAccess);
	};

	return (
		<div id='personal-library-permissions'>
			<Form>
				<FormGroup tag='fieldset'>
					<legend>Personal Library</legend>
					<FormGroup check>
						<Label check htmlFor='library'>
							<Input name='library' id='library' checked={access.user.library} type='checkbox' onChange={handleChange} />
							Allow library access
						</Label>
						<p className='text-muted small'>Allow third party to access your library.</p>
					</FormGroup>
					<FormGroup check>
						<Label check htmlFor='notes'>
							<Input name='notes' id='notes' checked={access.user.notes} type='checkbox' onChange={handleChange} />
							Allow notes access
						</Label>
						<p className='text-muted small'>Allow third party to access your notes.</p>
					</FormGroup>
					<FormGroup check>
						<Label check htmlFor='write'>
							<Input name='write' id='write' checked={access.user.write} type='checkbox' onChange={handleChange} />
							Allow write access
						</Label>
						<p className='text-muted small'>Allow third party to make changes to your library.</p>
					</FormGroup>
				</FormGroup>
			</Form>
		</div>
	);
};

const AllGroupsPermissions = function () {
	const {access, updateAccess} = useContext(accessContext);
	
	const handleChange = (newAllValue) => {
		let newAccess = Object.assign({}, access);
		switch (newAllValue) {
		case 'none':
			delete newAccess.groups.all;
			break;
		case 'read':
			newAccess.groups.all = {library: true, write: false};
			break;
		case 'write':
			newAccess.groups.all = {library: true, write: true};
			break;
		default:
			log.error(`Unexpected value for AllGroupsPermissions: ${newAllValue}`);
		}
		updateAccess(newAccess);
	};

	const radioName = 'all_groups';
	let selectedValue = 'none';
	if (access.groups.all) {
		if (access.groups.all.write) {
			selectedValue = 'write';
		} else if (access.groups.all.library) {
			selectedValue = 'read';
		}
	}

	return (
		<div className='all-groups-permissions'>
			<Form>
				<FormGroup tag='fieldset'>
					<legend>Default Group Permissions</legend>
					<Label htmlFor='all_groups'>All Groups
						<RadioGroup name={radioName} selectedValue={selectedValue} onChange={handleChange}>
							<Label htmlFor={radioName + 'none'}>
								<Radio value='none' id={radioName + 'none'} className='radio' />{' '}
								None
							</Label>
							<br />
							<Label htmlFor={radioName + 'read'}>
								<Radio value='read' id={radioName + 'read'} className='radio' />{' '}
								Read Only
							</Label>
							<br />
							<Label htmlFor={radioName + 'write'}>
								<Radio value='write' id={radioName + 'write'} className='radio' />{' '}
								Read/Write
							</Label>
						</RadioGroup>
					</Label>
					<p className='text-muted small'>Allow access to all current and future groups.</p>
				</FormGroup>
			</Form>
		</div>
	);
};
AllGroupsPermissions.propTypes = {
	access: accessShape.isRequired,
	updateAccess: PropTypes.func.isRequired
};

const IndividualGroupPermissions = function (props) {
	const {access, updateAccess} = useContext(accessContext);
	const {group} = props;
	const groupID = group.id;
	
	const handleChange = (newGroupValue) => {
		let newAccess = Object.assign({}, access);
		switch (newGroupValue) {
		case 'none':
			delete newAccess.groups[groupID];
			break;
		case 'read':
			newAccess.groups[groupID] = {library: true, write: false};
			break;
		case 'write':
			newAccess.groups[groupID] = {library: true, write: true};
			break;
		default:
			log.error(`Unexpected value for IndividualGroupPermissions: ${newGroupValue}`);
		}
		updateAccess(newAccess);
	};

	const groupName = group.name;
	const radioName = `group_${groupID}`;
	
	let selectedValue = 'none';
	if (access.groups[groupID]) {
		if (access.groups[groupID].write) {
			selectedValue = 'write';
		} else if (access.groups[groupID].library) {
			selectedValue = 'read';
		}
	}

	return (
		<Fragment>
			<Label htmlFor={`group_${groupID}`}>{groupName}
				<RadioGroup name={radioName} selectedValue={selectedValue} onChange={handleChange}>
					<Label htmlFor={radioName + '_none'}>
						<Radio value='none' id={radioName + '_none'} className='radio' />{' '}
						None
					</Label>
					<br />
					<Label htmlFor={radioName + '_read'}>
						<Radio value='read' id={radioName + '_read'} className='radio' />{' '}
						Read Only
					</Label>
					<br />
					<Label htmlFor={radioName + '_write'}>
						<Radio value='write' id={radioName + '_write'} className='radio' />{' '}
						Read/Write
					</Label>
				</RadioGroup>
			</Label>
			<p className='text-muted small'>Access level to this group.</p>
		</Fragment>
	);
};
IndividualGroupPermissions.propTypes = {
	group: PropTypes.object.isRequired
};


const AcceptDefaults = function (props) {
	const {saveKey, editPermissions} = props;
	return (
		<div>
			<Button onClick={saveKey}>Accept Defaults</Button>{' '}
			<Button onClick={editPermissions}>Edit Permissions</Button>
		</div>
	);
};
AcceptDefaults.propTypes = {
	saveKey: PropTypes.func.isRequired,
	editPermissions: PropTypes.func.isRequired
};

const KeyAccessEditor = function (props) {
	const {perGroup, userGroups, changePerGroup} = props;

	let individualGroupNodes = null;
	if (perGroup) {
		individualGroupNodes = userGroups.map((group) => {
			const groupID = group.id;
			return <IndividualGroupPermissions key={groupID} group={group} />;
		});
	}

	return (
		<div>
			<PersonalLibraryPermissions />
			<AllGroupsPermissions />
			<FormGroup tag='fieldset'>
				<legend>Specific Groups</legend>
				<FormGroup>
					<Label check htmlFor='individual_groups'>
						<Input name='individual_groups' id='individual_groups' type='checkbox' onChange={changePerGroup} checked={perGroup} />
						Per Group Permissions
					</Label>
					<p className='text-muted small'>Set group by group permissions for this key</p>
				</FormGroup>
				{individualGroupNodes}
			</FormGroup>
		</div>
	);
};
KeyAccessEditor.propTypes = {
	perGroup: PropTypes.bool,
	userGroups: PropTypes.array.isRequired,
	changePerGroup: PropTypes.func
};

const IdentityRequest = function (props) {
	const {oauthClientName} = props;
	const [notification, setNotification] = useState(null);
	const [verifier, setVerifier] = useState(null);

	const saveKey = async () => {
		const identityUrl = buildUrl('authorizeIdentity');
		const resp = await ajax({url: identityUrl, type: 'POST', withSession: true});

		scrollToTop();
		if (!resp.ok) {
			log.error('Error processing request');
		}
		const data = await resp.json();
		const {success, verifier, redirect} = data;
		if (success) {
			setNotification({type: 'success', message: 'Permission granted'});
			
			// redirect if savekey response indicates one
			// this would be an oauth app redirect, otherwise the redirect will in in our own url parsed below
			if (redirect) {
				log.debug(`redirect to ${redirect}`, 4);
				window.location.href = redirect;
				return;
			}

			// if there is a verifier, display it for user to pass on to the oauth app
			if (verifier) {
				setVerifier(verifier);
				return;
			}
		} else {
			setNotification({type: 'error', message: 'Error processing request'});
		}
		scrollToTop();
	};
	const cancel = async () => {
		log.debug(`redirect to /settings/keys`, 4);
		window.location.href = '/settings/keys';
	};

	if (verifier) {
		return <OAuthVerify verifier={verifier} applicationName={oauthClientName} />;
	}

	return (
		<ErrorWrapper>
			<div className='identity-request'>
				<h1>Permissions Request</h1>
				<Notifier {...notification} />
				<Alert color='secondary' className='my-3'>
					<h2>An application would like to connect to your account</h2>
					<p>The application &quot;{oauthClientName}&quot; would like to access your account.</p>
				</Alert>

				<Alert color='secondary'>
					Share identity information with this application?
				</Alert>
				<Button onClick={saveKey}>Allow Access</Button>{' '}
				<Button onClick={cancel}>Cancel</Button>
			</div>
		</ErrorWrapper>
	);
};
IdentityRequest.propTypes = {
	oauthClientName: PropTypes.string
};

const ApiKeyEditor = function (props) {
	const {editKey, identity, oauthRequest, oauthClientName} = props;
	const [loading, setLoading] = useState(true);
	const [userGroups, setUserGroups] = useState(props.userGroups);
	const [access, setAccess] = useState(null);
	const [name, setName] = useState('');
	const [perGroup, setPerGroup] = useState(false);
	const [defaultsPending, setDefaultsPending] = useState(false);
	const [notification, setNotification] = useState(null);
	const [createdKey, setCreatedKey] = useState(null);
	const [verifier, setVerifier] = useState(null);

	useEffect(() => {
		const initializeRequested = async () => {
			// load usergroups if they weren't passed in as props
			if (!props.userGroups) {
				let userGroups = await loadAllUserGroups(currentUser.userID);
				userGroups = userGroups.map((ug) => {
					return ug.data;
				});
				setUserGroups(userGroups);
			}

			let initAccess;
			if (editKey) {
				// set up initial state for an existing key
				initAccess = boolAccess(editKey.access);
				setName(editKey.name);
			} else {
				// set up initial state for new key, including checking for permissions requested
				// in query params
				initAccess = requestedPermissions(userGroups);
				const queryVars = parseQuery(querystring(window.document.location.href));
				if (queryVars.name) {
					setName(queryVars.name);
				} else if (oauthClientName) {
					setName(oauthClientName);
				}
			}
			setAccess(initAccess);

			const accessGroupIDs = Object.keys(initAccess.groups);
			for (let groupID of accessGroupIDs) {
				if (groupID != 'all') {
					setPerGroup(true);
					break;
				}
			}

			setDefaultsPending(!!oauthRequest);
			setLoading(false);
		};
		initializeRequested();
	}, []);

	const updateAccess = (updatedAccess) => {
		log.debug('updateAccess', 4);
		log.debug(updatedAccess, 4);
		setAccess(updatedAccess);
	};
	const changeName = (evt) => {
		setName(evt.target.value);
	};
	const saveKey = async () => {
		let key = false;
		if (editKey) {
			key = editKey.key;
		}

		let keyObject = {
			key: key,
			name: name,
			access: access
		};

		// don't allow setting blank name
		if (name == '') {
			scrollToTop();
			setNotification({type: 'error', message: 'Key is missing name'});
			return;
		}
		
		// if perGroup is off, don't send anything other than the 'all' setting
		if (!perGroup) {
			keyObject.access.groups = {
				all: keyObject.access.groups.all
			};
		}
		
		const saveUrl = buildUrl('saveKey', {key: key, oauth: oauthRequest});
		const resp = await ajax({url: saveUrl, type: 'POST', withSession: true, data: JSON.stringify(keyObject)});
	
		if (!resp.ok) {
			log.error('Error saving key');
			setNotification({type: 'error', message: 'Error saving key'});
			scrollToTop();
			return;
		}
		const data = await resp.json();
		const {success, verifier, redirect, updatedKey} = data;
		if (success) {
			setNotification({type: 'success', message: 'Key Saved'});
			
			// redirect if savekey response indicates one
			// this would be an oauth app redirect, otherwise the redirect will in in our own url parsed below
			if (redirect) {
				log.debug(`redirect to ${redirect}`, 4);
				window.location.href = redirect;
				return;
			}

			const queryVars = parseQuery(querystring(window.document.location.href));

			// check for redirect used in private feed url flow and forward if present
			if (queryVars.redirect) {
				let target = queryVars.redirect;
				if (target.includes('?')) {
					target += `&key=${updatedKey.key}`;
				} else {
					target += `?key=${updatedKey.key}`;
				}
				log.debug(`redirect to ${target}`, 4);
				window.location.href = target;
				return;
			}
			
			// if there is a verifier, display it for user to pass on to the oauth app
			if (verifier) {
				setVerifier(verifier);
				scrollToTop();
				return;
			}
			// if no previously existing key and no verifier this is a new key:
			// display it for user to copy
			if (!key) {
				setCreatedKey(updatedKey.key);
			}
		} else {
			setNotification({type: 'error', message: 'Error saving key'});
		}
		scrollToTop();
	};
	
	const revokeKey = async () => {
		const key = editKey.key;
		
		const revokeUrl = buildUrl('revokeKey', {key});
		const resp = await postFormData(revokeUrl, {revoke: '1', key: key}, {withSession: true});
		scrollToTop();
		if (!resp.ok) {
			log.error('Error deleting key');
			setNotification({type: 'error', message: 'Error deleting key'});
		}
		const data = await resp.json();
		if (data.success) {
			setNotification({type: 'success', message: 'Key Revoked'});
		} else {
			setNotification({type: 'error', message: 'Error deleting key'});
		}
		scrollToTop();
	};

	const changePerGroup = (evt) => {
		setPerGroup(evt.target.checked);
	};

	if (identity) {
		return <IdentityRequest oauthClientName={oauthClientName} />;
	}

	let title = <h1>New Key</h1>;
	if (editKey) {
		title = <h1>Edit Key</h1>;
	}

	if (loading) {
		return <Spinner />;
	}

	if (verifier) {
		return <OAuthVerify verifier={verifier} applicationName={oauthClientName} />;
	}

	if (createdKey) {
		return (
			<ErrorWrapper>
				<div className='key-editor'>
					<p>Your new API key has been created and is displayed below. Please save it now as it will not be accessible again after this point.</p>
					<Alert color='success'>
						<p className='text-center large'>{createdKey}</p>
					</Alert>
				</div>
			</ErrorWrapper>
		);
	}

	let requesterNode = null;
	if (oauthRequest) {
		requesterNode = (
			<Alert color='secondary' className='my-3'>
				<h2>An application would like to connect to your account</h2>
				<p>The application &quot;{oauthClientName}&quot; would like to access your account.</p>
			</Alert>
		);
	}

	let accessSection = null;
	if (defaultsPending) {
		accessSection = <AcceptDefaults saveKey={saveKey} editPermissions={() => { setDefaultsPending(false); }} />;
	} else {
		accessSection = (
			<Fragment>
				<KeyAccessEditor
					access={access}
					updateAccess={updateAccess}
					userGroups={userGroups}
					perGroup={perGroup}
					changePerGroup={changePerGroup}
				/>
				<Button onClick={saveKey}>Save Key</Button>{' '}
				<Button onClick={revokeKey}>Revoke Key</Button>
			</Fragment>
		);
	}
	
	return (
		<ErrorWrapper>
			<accessContext.Provider value={{access, updateAccess}}>
				<div className='key-editor'>
					{title}
					<Notifier {...notification} />
					{requesterNode}
					<Label htmlFor='name'>Key Name
						<Input type='text' placeholder='Key Name' name='name' id='name' onChange={changeName} value={name} />
					</Label>

					<PermissionsSummary userGroups={userGroups} />

					{accessSection}
				</div>
			</accessContext.Provider>
		</ErrorWrapper>
	);
};
ApiKeyEditor.propTypes = {
	editKey: PropTypes.shape({
		access: accessShape,
		name: PropTypes.string,
		key: PropTypes.string
	}),
	identity: PropTypes.bool,
	oauthRequest: PropTypes.bool,
	oauthClientName: PropTypes.string,
	userGroups: PropTypes.array
};

export {ApiKeyEditor};
