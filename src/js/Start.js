import {log as logger} from './Log.js';
let log = logger.Logger('StartComponent');

const React = require('react');
const {Component} = React;

const config = window.zoteroConfig;

const recaptchaSitekey = config.recaptchaSitekey;

const imagePath = config.imagePath;

const connectorButtonImagePath = imagePath + '/start/zotero-button.svg';

import {ajax, postFormData} from './ajax.js';
import {slugify, getCurrentUser} from './Utils.js';
import {buildUrl} from './wwwroutes.js';
import {Notifier} from './Notifier.js';
import {VerticalExpandable} from './VerticalExpandable.js';
import {InstallConnectorPrompt} from './InstallConnector.js';
import {usernameValidation} from './Validate.js';
import {readCookie} from './Utils.js';

const currentUser = getCurrentUser();

let validateRegisterForm = function(data) {
	if(data.email != data.email2){
		return {
			valid:false,
			field:'email',
			reason:'emails must match'
		};
	}
	if(data.password != data.password2){
		return {
			valid:false,
			field:'password',
			reason:'passwords must match'
		};
	}
	return {valid:true};
};

class FormFieldErrorMessage extends Component {
	render() {
		return (
			<p className='form-field-error'>{this.props.message}</p>
		);
	}
}

class RegisterForm extends Component{
	constructor(props){
		super(props);
		this.state = {
			formData:{
				username:'',
				email:'',
				email2:'',
				password:'',
				password2:''
			},
			usernameValidity:'undecided',
			usernameMessage:'',
			formErrors:{},
			registrationSuccessful:false,
			iosApp: readCookie('iosApp'),
		};
		this.checkUsername = this.checkUsername.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.register = this.register.bind(this);
	}
	async checkUsername(){
		let username = this.state.formData.username;
		let result = await usernameValidation(username, false);
		this.setState(result);
	}
	handleChange(ev){
		let formData = this.state.formData;
		formData[ev.target.name] = ev.target.value;

		this.setState({formData:formData});
		if(ev.target.name == 'username'){
			this.setState({usernameValidity:'undecided', usernameMessage:''});
		}
	}
	async register(){
		let formData = this.state.formData;
		//validate form
		let validated = validateRegisterForm(formData);
		if(!validated.valid){
			//show error
			let formErrors = {};
			formErrors[validated.field] = validated.reason;
			this.setState({formErrors});
			return;
		}
		//set recaptcha in formdata
		formData.captcha = window.grecaptcha.getResponse();

		//submit form
		let registerUrl = buildUrl('registerAsync');
		try{
			let resp = await postFormData(registerUrl, formData);
			let data = await resp.json();
			if(data.success) {
				this.setState({registrationSuccessful:true});
			} else {
				this.setState({formError:'Error processing registration'});
			}
		} catch (resp) {
			log.debug('caught response');
			if(resp instanceof Response){
				let data = await resp.json();
				if(data.success === false){
					let formErrors = {};
					for(let ind in data.messages){
						let messages = [];
						for(let subind in data.messages[ind]){
							let m = data.messages[ind][subind];
							messages.push(m);
						}
						formErrors[ind] = messages.join(', ');
					}
					this.setState({formErrors});
				} else {
					log.error(resp);
					this.setState({formError:'Error processing registration'});
				}
			} else {
				log.error(resp);
				this.setState({formError:'Error processing registration'});
			}
		}
	}
	render(){
		//log.debug('RegisterForm render');
		let formData = this.state.formData;
		let slug = '<username>';
		if(this.state.formData.username) {
			slug = slugify(this.state.formData.username);
		}
		let profileUrl = buildUrl('profileUrl', {slug});
		let previewClass = 'profile-preview ' + this.state.usernameValidity;
		if(currentUser) {
			let heading = <h1>2. Start syncing to take full advantage of Zotero</h1>;
			if(!this.props.numbered) {
				heading = null;
			}
			return (
				<section className='register-section'>
					<div className='content'>
						{heading}
						<div>
							<p className='lead'>It looks like you’ve already created an account. Now that you’ve installed Zotero, you can use it to{' '}
								<a href="https://www.zotero.org/support/sync">sync and access your library from anywhere</a>.
								It also lets you join <a href="https://www.zotero.org/support/groups">groups</a> and{' '}
								<a href="https://www.zotero.org/support/sync#file_syncing">back up all your attached files</a>.</p>
						</div>
					</div>
				</section>
			);
		}

		let registerForm = (
			<form id='register-form'>
				<VerticalExpandable expand={!this.state.registrationSuccessful}>
					<div className='form-group'>
						<input className='form-control' type='text' name='username' placeholder='Username' onChange={this.handleChange} onBlur={this.checkUsername} value={formData.username}></input>
						<p className={previewClass}>{profileUrl}</p>
						<p className='username-message'>{this.state.usernameMessage}</p>
						<FormFieldErrorMessage message={this.state.formErrors['username']} />
					</div>
					<div className='form-group'>
						<input className='form-control' type='email' name='email' placeholder='Email' onChange={this.handleChange} value={formData.email}></input>
						<FormFieldErrorMessage message={this.state.formErrors['email']} />
					</div>
					<div className='form-group'>
						<input className='form-control' type='email' name='email2' placeholder='Confirm Email' onChange={this.handleChange} value={formData.email2}></input>
						<FormFieldErrorMessage message={this.state.formErrors['email2']} />
					</div>
					<div className='form-group'>
						<input className='form-control' type='password' name='password' placeholder='Password' onChange={this.handleChange} value={formData.password}></input>
						<FormFieldErrorMessage message={this.state.formErrors['password']} />
					</div>
					<div className='form-group'>
						<input className='form-control' type='password' name='password2' placeholder='Verify Password' onChange={this.handleChange} value={formData.password2}></input>
						<FormFieldErrorMessage message={this.state.formErrors['password2']} />
					</div>
					<div className='form-group'>
						<div className="g-recaptcha" data-sitekey={recaptchaSitekey}></div>
						<FormFieldErrorMessage message={this.state.formErrors['recaptcha']} />
					</div>
					<div className='form-group'>
						<button type='button' className='btn' onClick={this.register}>Register</button>
					</div>
					<p>By using Zotero, you agree to its <a href='https://www.zotero.org/support/terms/terms_of_service'>Terms of Service</a>.</p>
				</VerticalExpandable>
			</form>
		);

		let notifier = null;
		if(this.state.registrationSuccessful){
			let message = <span style={{fontSize:'large'}}>Thanks for registering. We’ve sent an email to activate your account.</span>;
			if (this.state.iosApp) {
				message = <span style={{fontSize:'large'}}>Your Zotero account has been created. You can now close this window and sign in to Zotero for iOS.</span>;
			}
			notifier = <Notifier type='success' message={message} />;
		} else if(this.state.formError){
			notifier = <Notifier type='error' message={this.state.formError} />;
		}

		let heading = <h1>2. Register to take full advantage of Zotero</h1>;
		if(!this.props.numbered){
			heading = null;
		}

		return (
			<section className='register-section'>
				<div className='container'>
					{heading}
					<p className='lead'>If you haven’t already created a Zotero account, please take a few moments to register now.
					It’s a <b>free</b> way to <a href="https://www.zotero.org/support/sync">sync and access your library from anywhere</a>,
					and it lets you join <a href="https://www.zotero.org/support/groups">groups</a> and{' '}
					<a href="https://www.zotero.org/support/sync#file_syncing">back up all your attached files</a>.
					</p>
					{registerForm}
					{notifier}
				</div>
			</section>
		);
	}
}
RegisterForm.defaultProps = {
	numbered:true
};

class PostRegisterGuide extends Component{
	render(){
		return (
			<section className='post-register-guide'>
				<div className='container'>
					<img src={connectorButtonImagePath} className='connector-button' width='160' height='160' />
					<h1>3. Start building your library</h1>
					<p className='lead'>New to Zotero? Explore the documentation and try out some things you can do with Zotero:</p>
					<ul className='register-quick-links'>
						<li><a href="https://www.zotero.org/support/quick_start_guide">Read the Quick Start Guide</a></li>
						<li><a href="https://www.zotero.org/support/getting_stuff_into_your_library">Add an item</a></li>
						<li><a href="https://www.zotero.org/support/archive_the_web">Archive a webpage</a></li>
						<li><a href="https://www.zotero.org/support/screencast_tutorials/manually_creating_items">Manually enter an item</a></li>
						<li><a href="https://www.zotero.org/support/collections">Create a collection</a></li>
						<li><a href="https://www.zotero.org/support/creating_bibliographies">Create a bibliography</a></li>
						<li><a href="https://www.zotero.org/support/word_processor_plugin_usage">Use the Word or LibreOffice plugin</a></li>
					</ul>
				</div>
			</section>
		);
	}
}

class Start extends Component{
	componentDidMount(){
		document.documentElement.className += ' react-mounted';
	}
	render(){
		return (
			<div className='start react'>
				<section>
					<div className='container'>
						<p className="install-success">Success! You installed Zotero!</p>
					</div>
				<div className='extensions-picker'>
					<InstallConnectorPrompt numbered={true} />
				</div>
				</section>
				<RegisterForm ref='registerForm' />
				<PostRegisterGuide ref='postRegisterGuide' />
			</div>
		);
	}
}

export {Start, InstallConnectorPrompt, RegisterForm};
