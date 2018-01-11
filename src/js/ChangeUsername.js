'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('ChangeUsernameComponent');

const React = require('react');
const {Component} = React;

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
		this.state = {
			formData:{
				username:''
			},
			usernameValidity:'undecided',
			usernameMessage:'',
			formErrors:{}
		};
		this.checkUsername = this.checkUsername.bind(this);
		this.saveUsername = this.saveUsername.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
	}
	handleBlur(){
		this.checkUsername(false);
	}
	checkUsername(skipServer=false){
		let username = this.state.formData.username;
		if(username.indexOf('@') != -1){
			this.setState({
				usernameValidity:'invalid',
				usernameMessage: 'Your email address can be used to log in to your Zotero account, but not as your username.'
			});
			return;
		}
		if(username.trim().indexOf(' ') != -1){
			this.setState({
				usernameValidity:'invalid',
				usernameMessage: 'Your username can\'t contain spaces'
			});
			return;
		}
		if(!(/^[a-z0-9._-]{3,}$/i.test(username))){
			this.setState({
				usernameValidity:'invalid',
				usernameMessage: 'Username may only use upper and lower case letters, numbers, ., _, or -'
			});
			return;
		}
		if((/^[0-9]+$/i.test(username))){
			this.setState({
				usernameValidity:'invalid',
				usernameMessage: 'Username can not use exclusively numerals'
			});
			return;
		}
		if(!skipServer){
			let checkUrl = buildUrl('checkUsername', {username});
			ajax({url:checkUrl}).then((response)=>{
				response.json().then((data)=>{
					if(data.valid){
						this.setState({usernameValidity:'valid'});
					} else {
						this.setState({
							usernameValidity:'invalid',
							usernameMessage: 'Username is not available'
						});
					}
				});
			}).catch(()=>{
				let formErrors = {username: 'Error checking username'};
				this.setState({formErrors});
			});
		}
	}
	saveUsername(evt){
		if(evt){
			evt.preventDefault();
		}
		let username = this.state.formData.username;
		let changeUrl = buildUrl('changeUsername');
		postFormData(changeUrl, {username}, {withSession:true}).then((response)=>{
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
	handleChange(ev){
		let formData = this.state.formData;
		formData[ev.target.name] = ev.target.value;

		this.setState({formData:formData});
		if(ev.target.name == 'username'){
			this.setState({usernameValidity:'undecided', usernameMessage:''});
			this.checkUsername(true); //check username validity on every change, but only locally
		}
	}
	render(){
		let formData = this.state.formData;
		let slug = '<username>';
		if(this.state.formData.username) {
			slug = slugify(this.state.formData.username);
		}
		let profileUrl = buildUrl('profileUrl', {slug});
		let previewClass = 'profile-preview ' + this.state.usernameValidity;
		
		let usernameForm = (
			<form id='username-form'>
				<div className='form-group'>
					<input className='form-control' type='text' name='username' placeholder='Username' onChange={this.handleChange} onBlur={this.handleBlur} value={formData.username}></input>
					<p className={previewClass}>{profileUrl}</p>
					<p className='username-message'>{this.state.usernameMessage}</p>
					<FormFieldErrorMessage message={this.state.formErrors['username']} />
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
		if(this.state.activated){
			return (
				<div className='change-username react'>
					<UsernameForm />
				</div>
			);
		} else {
			return (
				<div className='change-username react'>
					<strong>Username: {this.state.username}</strong> <p className='hint'><a href='#' onClick={this.activate}>change</a></p>
				</div>
			);
		}
	}
}

export {ChangeUsername};
