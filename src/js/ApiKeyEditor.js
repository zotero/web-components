'use strict';

import {log as logger} from './Log.js';
var log = logger.Logger('ApiKeyEditor');

const React = require('react');

const {Component} = React;
import PropTypes from 'prop-types';

import {RadioGroup, Radio} from './react-radio-group.js';
import {ajax} from './ajax.js';
import {buildUrl} from './wwwroutes.js';
import {Notifier} from './Notifier.js';
import {querystring, parseQuery, loadInitialState} from './Utils.js';

let scrollToTop = function() {
	window.scrollBy(0, -5000);
};

let stringToBool = function(val){
	if(val === '0' || val === 0) {
		return false;
	} else if(val === '1' || val === 1) {
		return true;
	}
	log.error(`unexpected value in stringToBool: ${val}`);
	return false;
};

/*
let boolToString = function(val){
	if(val){
		return '1';
	} else {
		return '0';
	}
};
*/
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
/*
let stringAccess = function(access){
	access.library = boolToString(access.library);
	access.notes = boolToString(access.notes);
	access.write = boolToString(access.write);
	return access;
};
*/
let accessShape = PropTypes.shape({
	library: PropTypes.bool,
	notes: PropTypes.bool,
	write: PropTypes.bool,
	groups: PropTypes.object
}).isRequired;

//TODO: identity request
//TODO: Accept default permissions for oauth requests
//TODO: redirect oauth on key creation
//TODO: Specify requesting application when oauth request
//TODO: complete handshake with verifier instead of forwarding if OOB
//TODO: display key when created and/or change url to editing new key, or forward to manage keys

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
		let varname = `group_${group.groupID}`;
		if(queryVars[varname] && queryVars[varname] != 'none'){
			access.groups[group.groupID] = queryVars[varname];
		}
	}

	return access;
};

class AcceptOAuth extends Component {
	render() {
		return (
			<div className='oauth-options'>
				<button type='button'>Accept Defaults</button>
				<button type='button'>Change Permissions</button>
			</div>
		);
	}
}

class OAuthVerify extends Component {
	render() {
		let applicationName = window.zoteroData.oauthClientName;
		let verifier = window.zoteroData.oauthVerifier;
		return (
			<div>
				<h1>Access Granted</h1>
				<p>To complete the transaction, return to {applicationName} and enter the verification code below.</p>
				<div id="oauth_verifier">{verifier}</div>
			</div>
		);
	}
}

//human readable summary of currently selected permissions
class PermissionsSummary extends Component {
	render() {
		let access = this.props.access;
		let userGroupsByKey = {};
		for(let group of this.props.userGroups){
			userGroupsByKey[group.groupID] = group;
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
		log.debug('PermissionsSummary render');
		log.debug(access);
		if(access.groups){
			log.debug('have groups');
			for(let id in access.groups) {
				log.debug(id);
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
					summary.push(<li key={`group_${id}_write`}>Access to read and modify library for group '{groupName}'</li>);
				} else if(groupAccess == 'read'){
					summary.push(<li key={`group_${id}_read`}>Access to read library for group '{groupName}'</li>);
				}
			}
		}

		if(summary.length == 0){
			summary.push(<li key='empty_permssions'>No additional permissions selected</li>);
		}

		return <div id='key-permissions-summary'><ul>{summary}</ul></div>;
	}
}

PermissionsSummary.propTypes = {
	access: accessShape
};

class PersonalLibraryPermissions extends Component {
	constructor(props) {
		super(props);
		this.handleChange = this.handleChange.bind(this);
	}
	handleChange(evt){
		log.debug('PersonalLibraryPermissions handleChange');
		if(!this.props.updateAccess){
			log.Error('updateAccess not set on PersonalLibraryPermissions');
			return;
		}
		log.debug('updateAccess is available');
		let access = this.props.access;
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
		this.props.updateAccess(access);
	}

	render() {
		log.debug('PersonalLibraryPermissions render');
		log.debug(this);
		let access = this.props.access;
		return (
			<div id="personal-library-permissions">
				<fieldset id="fieldset-personalLibrary"><legend>Personal Library</legend>
					<ul>
						<li>
							<label htmlFor="library">Allow library access
							<input name="library" id="library" checked={access.library} className="checkbox" type="checkbox" onChange={this.handleChange} /></label>
							<p className="hint">Allow third party to access your library.</p>
						</li>
						<li>
							<label htmlFor="notes">Allow notes access
							<input name="notes" id="notes" checked={access.notes} className="checkbox" type="checkbox" onChange={this.handleChange} /></label>
							<p className="hint">Allow third party to access your notes.</p>
						</li>
						<li><label htmlFor="write">Allow write access
							<input name="write" id="write" checked={access.write} className="checkbox" type="checkbox" onChange={this.handleChange} /></label>
							<p className="hint">Allow third party to make changes to your library.</p>
						</li>
					</ul>
				</fieldset>
			</div>
		);
	}
}

class AllGroupsPermissions extends Component {
	constructor(props){
		super(props);
		this.handleChange = this.handleChange.bind(this);
	}
	handleChange(newAllValue){
		if(!this.props.updateAccess){
			log.Error('updateAccess not set on AllGroupsPermissions');
			return;
		}
		log.debug(newAllValue);
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
		log.debug('AllGroupPermissions render');
		let radioName = 'all_groups';
		let selectedValue = this.props.access.groups['all'];
		if(!selectedValue){
			selectedValue = 'none';
		}

		return (
			<div className="all-groups-permissions">
				<legend>Default Group Permissions</legend>
				<label htmlFor="all_groups">All Groups
					<RadioGroup name={radioName} selectedValue={selectedValue} onChange={this.handleChange}>
						<label htmlFor={radioName+'none'}>
							<Radio value="none" id={radioName+'none'} className="radio" />
							None
						</label>
						<br />
						<label htmlFor={radioName+'read'}>
							<Radio value="read" id={radioName+'read'} className="radio" />
							Read Only
						</label>
						<br />
						<label htmlFor={radioName+'write'}>
							<Radio value="write" id={radioName+'write'} className="radio" />
							Read/Write
						</label>
					</RadioGroup>
				</label>
				<p className="hint">Allow access to all current and future groups.</p>
			</div>
		);
	}
}

class IndividualGroupPermissions extends Component {
	constructor(props){
		super(props);
		this.handleChange = this.handleChange.bind(this);
	}
	handleChange(newGroupValue){
		if(!this.props.updateAccess){
			log.Error('updateAccess not set on IndividualGroupPermissions');
			return;
		}
		let access = this.props.access;
		log.debug(this.props.groupID);
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
		log.debug('IndividualGroupPermissions render');
		let group = this.props.group;
		let groupID = group.groupID;
		let groupName = group.name;
		let radioName = `group_${groupID}`;
		let selectedValue = this.props.access.groups[groupID];
		if(!selectedValue){
			selectedValue = 'none';
		}

		return (
			<li>
				<label htmlFor={`group_${groupID}`}>{groupName}
					<RadioGroup name={radioName} selectedValue={selectedValue} onChange={this.handleChange}>
						<label htmlFor={radioName+'none'}>
							<Radio value="none" id={radioName+'_none'} className="radio" />
							None
						</label>
						<br />
						<label htmlFor={radioName+'read'}>
							<Radio value="read" id={radioName+'_read'} className="radio" />
							Read Only
						</label>
						<br />
						<label htmlFor={radioName+'write'}>
							<Radio value="write" id={radioName+'_write'} className="radio" />
							Read/Write
						</label>
					</RadioGroup>
				</label>
				<p className="hint">Access level to this group.</p>
			</li>
		);
	}
}


class AcceptDefaults extends Component {
	render(){
		return (
			<div>
				<button type='button' onClick={this.props.acceptDefaults}>Accept Defaults</button>
				<button type='button' onClick={this.props.editPermissions}>Edit Permissions</button>
			</div>
		);
	}
}

class KeyAccessEditor extends Component {
	render(){
		let access = this.props.access;
		let userGroups = this.props.userGroups;
		let updateAccess = this.props.updateAccess;
		let changePerGroup = this.props.changePerGroup;

		let individualGroupNodes = null;
		if(this.props.perGroup){
			individualGroupNodes = userGroups.map((group) => {
				let groupID = group.groupID;
				return <IndividualGroupPermissions key={groupID} groupID={groupID} group={group} access={access} updateAccess={updateAccess} />;
			});
		}

		return (
			<div>
				<PersonalLibraryPermissions access={access} updateAccess={updateAccess} />
				<AllGroupsPermissions access={access} updateAccess={updateAccess} />
				<fieldset>
					<legend>Specific Groups</legend>
					<ul>
						<li><label htmlFor="individual_groups">Per Group Permissions
								<input name="individual_groups" className="checkbox" type="checkbox" onChange={changePerGroup} checked={this.props.perGroup} />
							</label>
							<p className="hint">Set group by group permissions for this key</p>
						</li>
					</ul>
					<ul>
						{individualGroupNodes}
					</ul>
				</fieldset>
			</div>
		);
	}
}

class ApiKeyEditor extends Component {
	constructor(props) {
		super(props);
		let defaultState = {
			defaultsPending:false
		};
		defaultState = loadInitialState(defaultState);
		this.state = defaultState;
		
		if(this.state.editKey){
			//set up initial state for an existing key
			let editKey = this.state.editKey;
			let access = boolAccess(editKey.access);
			let perGroup = false;
			let accessGroupIDs = Object.keys(access['groups']);
			for(let groupID of accessGroupIDs){
				if(groupID != 'all'){
					perGroup = true;
					break;
				}
			}

			this.state.access = access;
			this.state.name = editKey.name;
			this.state.perGroup = perGroup;
		} else {
			//set up initial state for new key, including checking for permissions requested
			//in query params
			this.state.access = requestedPermissions(this.state.userGroups);

			if(this.state.oauthClientName) {
				this.state.defaultsPending = true;
			}

			let perGroup = false;
			let accessGroupIDs = Object.keys(this.state.access['groups']);
			for(let groupID of accessGroupIDs){
				if(groupID != 'all'){
					perGroup = true;
					break;
				}
			}
			this.state.perGroup = perGroup;

			let queryVars = parseQuery(querystring(window.document.location.href));
			if(queryVars['name']){
				this.state.name = queryVars['name'];
			} else if(this.state.oauthClientName) {
				this.state.name = this.state.oauthClientName;
			}
		}

		//bind callback functions to component
		this.updateAccess = this.updateAccess.bind(this);
		this.changePerGroup = this.changePerGroup.bind(this);
		this.saveKey = this.saveKey.bind(this);
		this.changeName = this.changeName.bind(this);
	}
	componentDidMount() {
	}

	updateAccess(updatedAccess) {
		log.debug('updating access');
		log.debug(updatedAccess);
		this.setState({access: updatedAccess});
	}

	changeName(evt) {
		this.setState({name:evt.target.value});
	}

	saveKey(){
		let key;
		if(this.state.editKey){
			key = editKey.key;
		}

		let keyObject = {
			key:key,
			name: this.state.name,
			access: this.state.access
		};

		//if perGroup is off, don't send anything other than the 'all' setting
		if(!this.state.perGroup){
			keyObject.access.groups = {
				all: keyObject.access.groups['all']
			};
		}
		let saveUrl = buildUrl('saveKey', {key:key});
		ajax({url:saveUrl, type:'POST', withSession:true, data:JSON.stringify(keyObject)}).then((resp)=>{
			scrollToTop();
			if(!resp.ok){
				log.error('Error saving key');
			}
			resp.json().then((data) => {
				if(data.success){
					this.setState({notification: {type:'success', message:'Key Saved'}});
					let queryVars = parseQuery(querystring(window.document.location.href));

					//check for redirect used in private feed url flow and forward if present
					if(queryVars['redirect']){
						let target = queryVars['redirect'];
						if(target.includes('?')){
							target = target + `&key=${data.updatedKey.key}`;
						} else {
							target = target + `?key=${data.updatedKey.key}`;
						}
						window.location.href = target;
					}
				} else {
					this.setState({notification: {type:'error', message:'Error saving key'}});
				}
				log.debug(data);
			});
		});
	}

	changePerGroup(evt) {
		this.setState({perGroup: evt.target.checked});
	}
	render() {
		let title = <h1>New Key</h1>;
		if(this.state.editKey){
			title = <h1>Edit Key</h1>;
		}

		let requesterNode = null;
		let defaultAccepter = null;
		if(this.state.oauthClientName){
			requesterNode = (<div>
				<h2>An application would like to connect to your account</h2>
				<p>The application '{this.state.oauthClientName}' would like to access your account.</p>
			</div>);
		}

		let editingSection = (<KeyAccessEditor
			access={this.state.access}
			updateAccess={this.updateAccess}
			userGroups={this.state.userGroups}
			perGroup={this.state.perGroup}
			changePerGroup={this.changePerGroup}
		/>);
		if(this.state.defaultsPending){
			editingSection = <AcceptDefaults />;
		}

		let notifier = null;
		if(this.state.notification){
			notifier = <Notifier {...this.state.notification} />;
		}
		return (
			<div className='key-editor'>
				{title}
				{notifier}
				{requesterNode}
				<label htmlFor='name'>Key Name
					<input type='text' placeholder='Key Name' name='name' id='name' onChange={this.changeName} value={this.state.name} />
				</label>

				<PermissionsSummary access={this.state.access} userGroups={this.state.userGroups} />

				{editingSection}

				<button type='button' onClick={this.saveKey}>Save Key</button>
				<button type='button'>Revoke Key</button>
			</div>
		);
	}
}


export {ApiKeyEditor};
