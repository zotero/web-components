'use strict';

import {log as logger} from './Log.js';
var log = logger.Logger('ApiKeyEditor');

const React = require('react');

const {Component, Fragment} = React;
import PropTypes from 'prop-types';

import {RadioGroup, Radio} from './react-radio-group.js';
import {ajax, postFormData, loadAllUserGroups} from './ajax.js';
import {buildUrl} from './wwwroutes.js';
import {Notifier} from './Notifier.js';
import {querystring, parseQuery} from './Utils.js';
import {Alert, Label, Button, Input, Form, FormGroup, Card, CardBody, CardTitle} from 'reactstrap';
import {ErrorWrapper} from './components/ErrorWrapper.jsx';
import {getCurrentUser} from './Utils.js';
import { Spinner } from './LoadingSpinner.js';

const currentUser = getCurrentUser();

let scrollToTop = function() {
	window.scrollBy(0, -5000);
};

let stringToBool = function(val){
	if(val === true || val === false){
		return val;
	}
	if(val === '0' || val === 0) {
		return false;
	} else if(val === '1' || val === 1) {
		return true;
	}
	log.error(`unexpected value in stringToBool: ${val}`);
	return false;
};

let boolAccess = function(access){
	access.library = stringToBool(access.library);
	access.notes = stringToBool(access.notes);
	access.write = stringToBool(access.write);
	if(Array.isArray(access.groups)){
		if(access.groups.length == 0){
			access.groups = {};
		}
	}
	return access;
};
let accessShape = PropTypes.shape({
	library: PropTypes.bool,
	notes: PropTypes.bool,
	write: PropTypes.bool,
	groups: PropTypes.object
}).isRequired;

let defaultValue = function(v, def){
	if(typeof v === 'undefined'){
		return def;
	}
	if(v === null){
		return def;
	}
	return v;
};

let requestedPermissions = function(userGroups = []) {
	let href = window.document.location.href;
	let qs = querystring(href);
	let queryVars = parseQuery(qs);
	let access = {
		library: stringToBool(defaultValue(queryVars['library_access'], 1)),
		notes: stringToBool(defaultValue(queryVars['notes_access'], 0)),
		write: stringToBool(defaultValue(queryVars['write_access'], 0)),
		groups: {
			all: defaultValue(queryVars['all_groups'], 'none')
		}
	};

	for(let key in userGroups) {
		let group = userGroups[key];
		let varname = `group_${group.id}`;
		if(queryVars[varname] && queryVars[varname] != 'none'){
			access.groups[group.id] = queryVars[varname];
		}
	}

	return access;
};

class OAuthVerify extends Component {
	render() {
		let {applicationName, verifier} = this.props;
		return (
			<Alert color='success'>
				<h1 className='text-center'>Access Granted</h1>
				<p>To complete the transaction, return to {applicationName} and enter the verification code below.</p>
				<p id="oauth_verifier" className='text-center'>{verifier}</p>
			</Alert>
		);
	}
}

//human readable summary of currently selected permissions
class PermissionsSummary extends Component {
	render() {
		let {access, userGroups} = this.props;
		let userGroupsByKey = {};
		for(let group of userGroups){
			userGroupsByKey[group.id] = group;
		}
		let summary = [];
		
		//personal library settings
		if(access.library){
			summary.push(<li key='personal_read'>Access to read your personal library</li>);
		}
		if(access.notes){
			summary.push(<li key='personal_notes'>Access to read notes in your personal library</li>);
		}
		if(access.write){
			summary.push(<li key='personal_write'>Access to modify your personal library</li>);
		}
		
		let individualGroups = [];
		if(access.groups){
			for(let id in access.groups) {
				if(id != 'all'){
					individualGroups.push(id);
				}
			}
		
			//all groups library settings
			if(access.groups.all){
				if(access.groups.all == 'write'){
					summary.push(<li key='all_groups_write'>Access to read and modify any of your group libraries</li>);
				} else if(access.groups.all == 'read'){
					summary.push(<li key='all_groups_read'>Access to read any of your group libraries</li>);
				}
			}

			for(let id of individualGroups){
				let groupAccess = access.groups[id];
				let groupName = userGroupsByKey[id].name;
				if(groupAccess == 'write'){
					summary.push(<li key={`group_${id}_write`}>Access to read and modify library for group &quot;{groupName}&quot;</li>);
				} else if(groupAccess == 'read'){
					summary.push(<li key={`group_${id}_read`}>Access to read library for group &quot;{groupName}&quot;</li>);
				}
			}
		}

		if(summary.length == 0){
			summary.push(<li key='empty_permssions'>No additional permissions selected</li>);
		}

		return (
			<Card id='key-permissions-summary' className="mb-4">
				<CardBody>
					<CardTitle>Permissions</CardTitle>
					<ul>{summary}</ul>
				</CardBody>
			</Card>
		);
	}
}

PermissionsSummary.propTypes = {
	access: accessShape
};

class PersonalLibraryPermissions extends Component {
	constructor(props) {
		super(props);
	}
	handleChange = (evt) => {
		let {updateAccess, access} = this.props;
		if(!updateAccess){
			log.Error('updateAccess not set on PersonalLibraryPermissions');
			return;
		}
		switch(evt.target.name) {
			case 'library':
			case 'notes':
			case 'write':
				if(evt.target.checked) {
					access[evt.target.name] = true;
				} else {
					access[evt.target.name] = false;
				}
				
				break;
			default:
				log.error('Unexpected target for PersonalLibraryPermissions');
		}
		updateAccess(access);
	}

	render() {
		let {access} = this.props;
		return (
			<div id="personal-library-permissions">
				<Form>
				<FormGroup tag="fieldset">
					<legend>Personal Library</legend>
					<FormGroup check>
						<Label check htmlFor="library">
							<Input name="library" id="library" checked={access.library} type="checkbox" onChange={this.handleChange} />
							Allow library access
						</Label>
						<p className="text-muted small">Allow third party to access your library.</p>
					</FormGroup>
					<FormGroup check>
						<Label check htmlFor="notes">
							<Input name="notes" id="notes" checked={access.notes} type="checkbox" onChange={this.handleChange} />
							Allow notes access
						</Label>
						<p className="text-muted small">Allow third party to access your notes.</p>
					</FormGroup>
					<FormGroup check>
						<Label check htmlFor="write">
							<Input name="write" id="write" checked={access.write} type="checkbox" onChange={this.handleChange} />
							Allow write access
						</Label>
						<p className="text-muted small">Allow third party to make changes to your library.</p>
					</FormGroup>
				</FormGroup>
				</Form>
			</div>
		);
	}
}

class AllGroupsPermissions extends Component {
	constructor(props){
		super(props);
	}
	handleChange = (newAllValue) => {
		if(!this.props.updateAccess){
			log.Error('updateAccess not set on AllGroupsPermissions');
			return;
		}
		let access = this.props.access;
		switch(newAllValue){
			case 'none':
			case 'read':
			case 'write':
				access['groups']['all'] = newAllValue;
				break;
			default:
				log.error('Unexpected value for AllGroupsPermissions');
		}
		this.props.updateAccess(access);
	}
	render() {
		let radioName = 'all_groups';
		let selectedValue = this.props.access.groups['all'];
		if(!selectedValue){
			selectedValue = 'none';
		}

		return (
			<div className="all-groups-permissions">
				<Form>
				<FormGroup tag="fieldset">
					<legend>Default Group Permissions</legend>
					<Label htmlFor="all_groups">All Groups
						<RadioGroup name={radioName} selectedValue={selectedValue} onChange={this.handleChange}>
							<Label htmlFor={radioName+'none'}>
								<Radio value="none" id={radioName+'none'} className="radio" />{' '}
								None
							</Label>
							<br />
							<Label htmlFor={radioName+'read'}>
								<Radio value="read" id={radioName+'read'} className="radio" />{' '}
								Read Only
							</Label>
							<br />
							<Label htmlFor={radioName+'write'}>
								<Radio value="write" id={radioName+'write'} className="radio" />{' '}
								Read/Write
							</Label>
						</RadioGroup>
					</Label>
					<p className="text-muted small">Allow access to all current and future groups.</p>
				</FormGroup>
				</Form>
			</div>
		);
	}
}

class IndividualGroupPermissions extends Component {
	constructor(props){
		super(props);
	}
	handleChange = (newGroupValue) => {
		if(!this.props.updateAccess){
			log.Error('updateAccess not set on IndividualGroupPermissions');
			return;
		}
		let access = this.props.access;
		switch(newGroupValue){
			case 'none':
			case 'read':
			case 'write':
				access['groups'][this.props.groupID] = newGroupValue;
				break;
			default:
				log.error('Unexpected value for IndividualGroupPermissions');
		}
		this.props.updateAccess(access);
	}

	render(){
		const {group, access} = this.props;
		let groupID = group.id;
		let groupName = group.name;
		let radioName = `group_${groupID}`;
		let selectedValue = access.groups[groupID];
		if(!selectedValue){
			selectedValue = 'none';
		}

		return (
			<Fragment>
				<Label htmlFor={`group_${groupID}`}>{groupName}
					<RadioGroup name={radioName} selectedValue={selectedValue} onChange={this.handleChange}>
						<Label htmlFor={radioName+'_none'}>
							<Radio value="none" id={radioName+'_none'} className="radio" />{' '}
							None
						</Label>
						<br />
						<Label htmlFor={radioName+'_read'}>
							<Radio value="read" id={radioName+'_read'} className="radio" />{' '}
							Read Only
						</Label>
						<br />
						<Label htmlFor={radioName+'_write'}>
							<Radio value="write" id={radioName+'_write'} className="radio" />{' '}
							Read/Write
						</Label>
					</RadioGroup>
				</Label>
				<p className="text-muted small">Access level to this group.</p>
			</Fragment>
		);
	}
}


class AcceptDefaults extends Component {
	render(){
		return (
			<div>
				<Button onClick={this.props.saveKey}>Accept Defaults</Button>{' '}
				<Button onClick={this.props.editPermissions}>Edit Permissions</Button>
			</div>
		);
	}
}

class KeyAccessEditor extends Component {
	render(){
		const {perGroup, access, userGroups, updateAccess, changePerGroup} = this.props;

		let individualGroupNodes = null;
		if(perGroup){
			individualGroupNodes = userGroups.map((group) => {
				let groupID = group.id;
				return <IndividualGroupPermissions key={groupID} groupID={groupID} group={group} access={access} updateAccess={updateAccess} />;
			});
		}

		return (
			<div>
				<PersonalLibraryPermissions access={access} updateAccess={updateAccess} />
				<AllGroupsPermissions access={access} updateAccess={updateAccess} />
				<FormGroup tag="fieldset">
					<legend>Specific Groups</legend>
					<FormGroup>
						<Label check htmlFor="individual_groups">
							<Input name="individual_groups" id="individual_groups" type="checkbox" onChange={changePerGroup} checked={perGroup} />
							Per Group Permissions
						</Label>
						<p className="text-muted small">Set group by group permissions for this key</p>
					</FormGroup>
					{individualGroupNodes}
				</FormGroup>
			</div>
		);
	}
}

class IdentityRequest extends Component {
	constructor(props){
		super(props);
		this.state = {};
	}
	saveKey = async () => {
		let resp;
		let identityUrl = buildUrl('authorizeIdentity');
		resp = await ajax({url:identityUrl, type:'POST', withSession:true});

		scrollToTop();
		if(!resp.ok){
			log.error('Error processing request');
		}
		let data = await resp.json();
		let {success, verifier, redirect} = data;
		if(success){
			this.setState({notification: {type:'success', message:'Permission granted'}});
			
			//redirect if savekey response indicates one
			//this would be an oauth app redirect, otherwise the redirect will in in our own url parsed below
			if(redirect){
				log.debug(`redirect to ${redirect}`);
				window.location.href = redirect;
				return;
			}

			//if there is a verifier, display it for user to pass on to the oauth app
			if(verifier){
				this.setState({verifier});
				return;
			}
		} else {
			this.setState({notification: {type:'error', message:'Error processing request'}});
		}
	}

	render(){
		let {oauthClientName} = this.props;
		let {notification, verifier} = this.state;

		if(verifier){
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
					<Button onClick={this.saveKey}>Allow Access</Button>{' '}
					<Button onClick={this.revokeKey}>Cancel</Button>
				</div>
			</ErrorWrapper>
		);
	}
}

class ApiKeyEditor extends Component {
	constructor(props) {
		super(props);
		const {editKey, userGroups} = props;
		this.state = {loading:true, editKey, userGroups:userGroups};
	}
	componentDidMount = async () => {
		this.initializeRequested();
	}
	initializeRequested = async () => {
		log.debug('initializeRequested');
		const {editKey, oauthRequest, oauthClientName} = this.props;
		let userGroups;
		if(this.props.userGroups) {
			userGroups = this.props.userGroups;
		} else {
			userGroups = await loadAllUserGroups(currentUser.userID);
			userGroups = userGroups.map((ug) => {return ug.data;});
		}

		let access, perGroup, name;
		if(editKey){
			//set up initial state for an existing key
			access = boolAccess(editKey.access);
			name = editKey.name;
		} else {
			//set up initial state for new key, including checking for permissions requested
			//in query params
			access = requestedPermissions(userGroups);
			let queryVars = parseQuery(querystring(window.document.location.href));
			name = '';
			if(queryVars['name']){
				name = queryVars['name'];
			} else if(oauthClientName) {
				name = oauthClientName;
			}
		}

		perGroup = false;
		let accessGroupIDs = Object.keys(access['groups']);
		for(let groupID of accessGroupIDs){
			if(groupID != 'all'){
				perGroup = true;
				break;
			}
		}

		this.setState({
			editKey,
			access,
			name:name,
			perGroup,
			defaultsPending: oauthRequest ? true : false,
			userGroups,
			loading:false
		});
	}
	updateAccess = (updatedAccess) => {
		this.setState({access: updatedAccess});
	}
	changeName = (evt) => {
		this.setState({name:evt.target.value});
	}
	saveKey = async () => {
		const {oauthRequest} = this.props;
		const {editKey, name, access, perGroup} = this.state;
		let key = false;
		if(editKey){
			key = editKey.key;
		}

		let keyObject = {
			key:key,
			name: name,
			access: access
		};
		
		//if perGroup is off, don't send anything other than the 'all' setting
		if(!perGroup){
			keyObject.access.groups = {
				all: keyObject.access.groups['all']
			};
		}
		let resp;
		let saveUrl = buildUrl('saveKey', {key:key, oauth:oauthRequest});
		resp = await ajax({url:saveUrl, type:'POST', withSession:true, data:JSON.stringify(keyObject)});
	
		scrollToTop();
		if(!resp.ok){
			log.error('Error saving key');
		}
		let data = await resp.json();
		let {success, verifier, redirect, updatedKey} = data;
		if(success){
			this.setState({notification: {type:'success', message:'Key Saved'}});
			
			//redirect if savekey response indicates one
			//this would be an oauth app redirect, otherwise the redirect will in in our own url parsed below
			if(redirect){
				log.debug(`redirect to ${redirect}`);
				window.location.href = redirect;
				return;
			}

			let queryVars = parseQuery(querystring(window.document.location.href));

			//check for redirect used in private feed url flow and forward if present
			if(queryVars['redirect']){
				let target = queryVars['redirect'];
				if(target.includes('?')){
					target = target + `&key=${updatedKey.key}`;
				} else {
					target = target + `?key=${updatedKey.key}`;
				}
				log.debug(`redirect to ${target}`);
				window.location.href = target;
				return;
			}
			
			//if there is a verifier, display it for user to pass on to the oauth app
			if(verifier){
				this.setState({verifier});
				return;
			}
			//if no previously existing key and no verifier this is a new key:
			//display it for user to copy
			if(!key){
				this.setState({createdKey:updatedKey.key});
			}
		} else {
			this.setState({notification: {type:'error', message:'Error saving key'}});
		}
	}
	
	revokeKey = async () => {
		const {editKey} = this.state;
		const key = editKey.key;
		
		let revokeUrl = buildUrl('revokeKey', {key:key});
		let resp = await postFormData(revokeUrl, {revoke:'1', key:key});
		scrollToTop();
		if(!resp.ok){
			log.error('Error deleting key');
		}
		let data = await resp.json();
		if(data.success){
			this.setState({notification: {type:'success', message:'Key Revoked'}});
		} else {
			this.setState({notification: {type:'error', message:'Error deleting key'}});
		}
	}

	changePerGroup = (evt) => {
		this.setState({perGroup: evt.target.checked});
	}
	render() {
		//const {userGroups} = this.props;
		const {identity, oauthRequest, oauthClientName} = this.props;
		const {loading, createdKey, editKey, defaultsPending, access, perGroup, notification, name, userGroups, verifier} = this.state;

		if(identity) {
			return <IdentityRequest oauthClientName={oauthClientName} />;
		}

		let title = <h1>New Key</h1>;
		if(editKey){
			title = <h1>Edit Key</h1>;
		}

		if(loading){
			return <Spinner />;
		}

		if(verifier){
			return <OAuthVerify verifier={verifier} applicationName={oauthClientName} />;
		}

		if(createdKey){
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
		if(oauthRequest){
			requesterNode = (
			<Alert color='secondary' className='my-3'>
				<h2>An application would like to connect to your account</h2>
				<p>The application &quot;{oauthClientName}&quot; would like to access your account.</p>
			</Alert>);
		}

		let accessSection;
		if(defaultsPending){
			accessSection = <AcceptDefaults saveKey={this.saveKey} editPermissions={()=>{this.setState({defaultsPending:false});}} />;
		} else {
			accessSection = (
				<Fragment>
					<KeyAccessEditor
						access={access}
						updateAccess={this.updateAccess}
						userGroups={userGroups}
						perGroup={perGroup}
						changePerGroup={this.changePerGroup}
					/>
					<Button onClick={this.saveKey}>Save Key</Button>{' '}
					<Button onClick={this.revokeKey}>Revoke Key</Button>
				</Fragment>
			);
		}
		
		let notifier = null;
		if(notification){
			notifier = <Notifier {...notification} />;
		}
		return (
			<ErrorWrapper>
				<div className='key-editor'>
					{title}
					{notifier}
					{requesterNode}
					<Label htmlFor='name'>Key Name
						<Input type='text' placeholder='Key Name' name='name' id='name' onChange={this.changeName} value={name} />
					</Label>

					<PermissionsSummary access={access} userGroups={userGroups} />

					{accessSection}
				</div>
			</ErrorWrapper>
		);
	}
}


export {ApiKeyEditor};
