'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('ChangeUsernameComponent');

const React = require('react');
const {Component} = React;
const Fragment = React.Fragment;

import {ajax, postFormData} from './ajax.js';
import {slugify} from './Utils.js';
import {buildUrl} from './wwwroutes.js';
import {Notifier} from './Notifier.js';

class FormFieldErrorMessage extends Component {
	render() {
		return (
			<p className='form-field-error'>{this.props.message}</p>
		);
	}
}

class UsernameForm extends Component{
	constructor(props){
		super(props);
		let forumSpecific = (props.username !== props.forumUsername);
		this.state = {
			formData:{
				username:props.username,
				forumUsername:props.forumUsername
			},
			usernameValidity:'undecided',
			usernameMessage:'',
			forumUsernameValidity:'undecided',
			forumUsernameMessage:'',
			formErrors:{},
			forumSpecific:forumSpecific
		};
		this.checkUsername = this.checkUsername.bind(this);
		this.saveUsername = this.saveUsername.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.handleForumCheck = this.handleForumCheck.bind(this);
		this.usernameValidation = this.usernameValidation.bind(this);
	}
	handleForumCheck(evt){
		this.setState({
			forumSpecific: evt.target.checked
		});
	}
	handleBlur(evt){
		if(evt.target.name == 'username'){
			if(evt.target.value != this.props.username){
				this.checkUsername(false);
			}
		} else if(evt.target.name == 'forumUsername'){
			if(evt.target.value != this.props.forumUsername){
				this.checkForumUsername(false);
			}
		}
	}
	async checkForumUsername(skipServer=false){
		log.debug('checkForumUsername');
		let username = this.state.formData.forumUsername;
		let result = await this.usernameValidation(username, skipServer);
		log.debug(result);
		let nstate = {
			forumUsernameValidity: result.usernameValidity,
			forumUsernameMessage: result.usernameMessage
		};
		this.setState(nstate);
	}
	async checkUsername(skipServer=false){
		let username = this.state.formData.username;
		let result = await this.usernameValidation(username, skipServer);
		log.debug(result);
		this.setState(result);
	}
	async usernameValidation(username, skipServer=false){
		if(username.indexOf('@') != -1){
			return {
				usernameValidity:'invalid',
				usernameMessage: 'Your email address can be used to log in to your Zotero account, but not as your username.'
			};
		}
		if(username.trim().indexOf(' ') != -1){
			return {
				usernameValidity:'invalid',
				usernameMessage: 'Your username can\'t contain spaces'
			};
		}
		if(!(/^[a-z0-9._-]{3,}$/i.test(username))){
			return {
				usernameValidity:'invalid',
				usernameMessage: 'Username must be at least 3 characters and may only use upper and lower case letters, numbers, ., _, or -'
			};
		}
		if((/^[0-9]+$/i.test(username))){
			return {
				usernameValidity:'invalid',
				usernameMessage: 'Username can not use exclusively numerals'
			};
		}
		if(!skipServer){
			let checkUrl = buildUrl('checkUsername', {username});
			try{
				let response = await ajax({url:checkUrl});
				let data = await response.json();
				if(data.valid){
					log.debug('returning valid username');
					return {usernameValidity:'valid'};
				} else {
					return {
						usernameValidity:'invalid',
						usernameMessage: 'Username is not available'
					};
				}
			} catch(e) {
				let formErrors = {username: 'Error checking username'};
				this.setState({formErrors});
			}
		}
		return {};
	}
	saveUsername(evt){
		if(evt){
			evt.preventDefault();
		}
		const {username, forumUsername} = this.state.formData;
		const {forumSpecific} = this.state;
		
		let changeUrl = buildUrl('changeUsername');
		let saveData = {username:username, forumUsername:username};
		if(forumSpecific){
			saveData = {username, forumUsername};
		}
		postFormData(changeUrl, saveData, {withSession:true}).then((response)=>{
			response.json().then((data)=>{
				if(data.success){
					this.setState({changeSuccessful:true});
				} else {
					this.setState({
						changeSuccessful:false,
						formError:'There was an error changing your username'
					});
				}
			});
		}).catch((response)=>{
			if(response.status == 429){
				this.setState({
					changeSuccessful:false,
					formError:'Username has been changed too recently'
				});
			} else {
				this.setState({
					changeSuccessful:false,
					formError:'There was an error changing your username'
				});
			}
		});
	}
	handleChange(evt){
		const target = evt.target;
		const value = target.type === 'checkbox' ? target.checked : target.value;
		let formData = this.state.formData;
		formData[evt.target.name] = value;

		this.setState({formData:formData});
		if(evt.target.name == 'username'){
			this.setState({usernameValidity:'undecided', usernameMessage:''}, ()=>{
				if(value !== this.props.username){
					this.checkUsername(true); //check username validity on every change, but only locally
				}
			});
		} else if(evt.target.name == 'forumUsername') {
			this.setState({forumUsernameValidity:'undecided', forumUsernameMessage:''});
			if(value !== this.props.forumUsername){
				this.checkForumUsername(true); //check username validity on every change, but only locally
			}
		}
	}
	render(){
		const {formData, formErrors, usernameValidity, usernameMessage, forumSpecific, forumUsernameMessage, forumUsernameValidity} = this.state;
		let slug = '<username>';
		if(formData.username) {
			slug = slugify(formData.username);
		}
		let profileUrl = buildUrl('profileUrl', {slug});
		let previewClass = 'profile-preview ' + usernameValidity;
		let forumFeedbackClass = 'username-message ' + forumUsernameValidity;

		let usernameForm = (
			<form id='username-form'>
				<div className='form-group'>
					<input className='form-control' type='text' name='username' placeholder='Username' onChange={this.handleChange} onBlur={this.handleBlur} value={formData.username}></input>
					<p className={previewClass}>{profileUrl}</p>
					<p className='username-message'>{usernameMessage}</p>
					<FormFieldErrorMessage message={formErrors['username']} />
					<label htmlFor='forumSpecific'>
						<input type='checkbox' checked={forumSpecific} name='forumSpecific' id='forumSpecific' onChange={this.handleForumCheck} />
						Use a different username on the Zotero forums
					</label>
					{forumSpecific ? 
						<Fragment>
							<input className='form-control' type='text' name='forumUsername' placeholder='Forum Username' onChange={this.handleChange} onBlur={this.handleBlur} value={formData.forumUsername}></input>
							<p className={forumFeedbackClass}>{forumUsernameMessage}</p>
							<FormFieldErrorMessage message={formErrors['forumUsername']} />
						</Fragment>
						: ''
					}
					<button onClick={this.saveUsername}>Save</button>
				</div>
			</form>
		);

		let notifier = null;
		if(this.state.changeSuccessful){
			let message = 'Your username has been updated';
			notifier = <Notifier type='success' message={message} />;
		} else if(this.state.formError){
			notifier = <Notifier type='error' message={this.state.formError} />;
		}
		
		return (
			<section className='change-username-section'>
				<div className='container'>
					{usernameForm}
					{notifier}
				</div>
			</section>
		);
	}
}

class ChangeUsername extends Component{
	constructor(props){
		super(props);
		this.state = {
			username:props.username,
			forumUsername: props.forumUsername,
			activated:false
		};
		this.activate = this.activate.bind(this);
	}
	componentDidMount(){
		document.documentElement.className += ' react-mounted';
	}
	activate(evt){
		evt.preventDefault();
		this.setState({activated:true});
	}
	render(){
		const {activated, username, forumUsername} = this.state;
		if(activated){
			return (
				<div className='change-username react'>
					<UsernameForm username={username} forumUsername={forumUsername} ref='usernameForm' />
				</div>
			);
		} else {
			return (
				<div className='change-username react'>
					<strong>Username: {username}</strong> <p className='hint'><a href='#' onClick={this.activate}>change</a></p>
				</div>
			);
		}
	}
}

export {ChangeUsername};
