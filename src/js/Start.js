'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('StartComponent');

const React = require('react');
const {Component} = React;

const config = window.zoteroConfig;

const recaptchaSitekey = config.recaptchaSitekey;

const imagePath = config.imagePath;

const connectorButtonImagePath = imagePath + '/start/zotero-button.svg';
const iconSpinImagePath = imagePath + '/spin-white.svg';

import {postFormData} from './ajax.js';
import {slugify, getCurrentUser} from './Utils.js';
import {buildUrl} from './wwwroutes.js';
import {Notifier} from './Notifier.js';
import {InstallConnectorPrompt} from './InstallConnector.js';
import {usernameValidation} from './Validate.js';
import {Collapse} from 'reactstrap';
import cn from 'classnames';

const currentUser = getCurrentUser();
/*
let validateRegisterForm = function(data) {
	return {valid:true};
};
*/
class RegisterForm extends Component{
	constructor(props){
		super(props);
		this.state = {
			formData:{
				username:'',
				email:'',
				password:'',
			},
			usernameChecked:false,
			usernameValid:false,
			usernameMessage:'',
			formErrors:{},
			registrationSuccessful:false,
			passwordVisible:false,
			wasValidated:false
		};
		this.checkUsername = this.checkUsername.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.register = this.register.bind(this);
		this.togglePasswordVisible = this.togglePasswordVisible.bind(this);
	}
	async checkUsername(){
		let username = this.state.formData.username;
		let result = await usernameValidation(username, false);
		this.setState(result);
	}
	handleChange(ev){
		let {formData} = this.state;
		formData[ev.target.name] = ev.target.value;

		this.setState({formData:formData});
		if(ev.target.name == 'username'){
			this.setState({
				usernameChecked:false,
				usernameValid:false,
				usernameMessage:''
			});
		}
	}
	togglePasswordVisible(){
		let {passwordVisible} = this.state;
		this.setState({passwordVisible:(!passwordVisible)});
	}
	async register(){
		let {formData} = this.state;
		//validate form
		//let validated = validateRegisterForm(formData);
		let validated = {valid:true};
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
		this.setState({loading:true});
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
		const {formData, usernameChecked, usernameValid, loading, registrationSuccessful, formError, formErrors,
			usernameMessage, passwordVisible} = this.state;

		let slug = '<username>';
		if(formData.username) {
			slug = slugify(formData.username);
		}
		let profileUrl = buildUrl('profileUrl', {slug});
		if(currentUser) {
			let heading = <h1>2. Start syncing to take full advantage of Zotero</h1>;
			if(!this.props.numbered) {
				heading = null;
			}
			return (
				<section className='register-section'>
					<div className='container'>
						<div className='content'>
							{heading}
							<div>
								<p className='lead text-center'>It looks like you’ve already created an account. Now that you’ve installed Zotero, you can use it to{' '}
									<a href="https://www.zotero.org/support/sync">sync and access your library from anywhere</a>.
									It also lets you join <a href="https://www.zotero.org/support/groups">groups</a> and{' '}
									<a href="https://www.zotero.org/support/sync#file_syncing">back up all your attached files</a>.</p>
							</div>
						</div>
					</div>
				</section>
			);
		}

		let registerForm = (
			<form className='register-form'>
				<Collapse isOpen={!registrationSuccessful}>
					<div className='form-group'>
						<input
							className={cn('form-control', 'form-control-lg', {'is-invalid':(usernameChecked && !usernameValid), 'is-valid':(usernameChecked && usernameValid)})}
							type='text'
							name='username'
							placeholder='Username'
							onChange={this.handleChange}
							onBlur={this.checkUsername}
							value={formData.username}>
						</input>
						<p className={cn('profile-preview', {valid:usernameValid, invalid:(usernameChecked && !usernameValid)})}>{profileUrl}</p>
						<div className='invalid-feedback'>{usernameMessage ? usernameMessage : formErrors['username']}</div>
					</div>
					<div className='form-group'>
						<input
							className={cn('form-control', 'form-control-lg', {'is-invalid':formErrors.hasOwnProperty('email')})}
							type='email'
							name='email'
							placeholder='Email'
							onChange={this.handleChange}
							value={formData.email}>
						</input>
						<div className='invalid-feedback'>{formErrors['email']}</div>
					</div>
					<div className='form-group'>
						<div className="input-group">
							<input
								className={cn('form-control', 'form-control-lg', {'is-invalid':formErrors.hasOwnProperty('password')})}
								type={passwordVisible ? 'text' : 'password'}
								name='password'
								placeholder='Password'
								onChange={this.handleChange}
								value={formData.password}>
							</input>
							<div className="input-group-append">
								<button type='button' className="btn btn-outline-secondary" onClick={this.togglePasswordVisible}>
									<span className={cn('inline-feedback', {active:passwordVisible})}>
										<span className="default-text">Show</span>
										<span className="feedback shorter">Hide</span>
									</span>
								</button>
							</div>
							<div className='invalid-feedback'>{formErrors['password']}</div>
						</div>
					</div>
					<div className='form-group'>
						<div className="g-recaptcha" data-sitekey={recaptchaSitekey}></div>
						<div className='invalid-feedback'>{formErrors['recaptcha']}</div>
					</div>
					<div className='form-group'>
						<button type='button' className='btn btn-lg btn-block btn-secondary btn-register' onClick={this.register} disabled={loading}>
							<span className={cn('inline-feedback', {active:loading})}>
								<span className="default-text">Register</span>
								<span className="shorter feedback">
									<img className="icon icon-spin" src={iconSpinImagePath} width="16" height="16" />
								</span>
							</span>
						</button>
					</div>
					<p>By using Zotero, you agree to its <a href="https://www.zotero.org/support/terms/terms_of_service">Terms of Service</a>.</p>
				</Collapse>
			</form>
		);

		let notifier = null;
		if(registrationSuccessful){
			let message = 'Thanks for registering. We’ve sent an email to activate your account.';
			notifier = <Notifier type='success' message={message} />;
		} else if(formError){
			notifier = <Notifier type='error' message={formError} />;
		}

		let heading = <h1>2. Register to take full advantage of Zotero</h1>;
		if(!this.props.numbered){
			heading = null;
		}

		return (
			<section className='section section-md register-section'>
				<div className='container-fluid container-fluid-col-10'>
					{heading}
					<p className='lead text-center'>If you haven’t already created a Zotero account, please take a few moments to register now.
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
			<section className='section section-md post-register-guide'>
				<div className='container-fluid container-fluid-col-10'>
					<img src={connectorButtonImagePath} className='connector-button' width='160' height='160' />
					<h1>3. Start building your library</h1>
					<p className='lead text-center'>New to Zotero? Explore the documentation and see what Zotero can do.</p>
					<div className="row">
						<div className="col-md quick-link-container">
							<a className="quick-link" href="https://www.zotero.org/support/quick_start_guide">
								<img src={imagePath + '/start/quick-start-guide.svg'} width="72" height="72" alt="" />
								Read the Quick <span className="d-sm-block">Start Guide</span>
							</a>
						</div>
						<div className="col-md quick-link-container">
							<a className="quick-link" href="https://www.zotero.org/support/getting_stuff_into_your_library">
								<img src={imagePath + '/start/new-item.svg'} width="72" height="72" alt="" />
								Add items to <span className="d-sm-block">Zotero</span>
							</a>
						</div>
						<div className="col-md quick-link-container">
							<a className="quick-link" href="https://www.zotero.org/support/collections_and_tags">
								<img src={imagePath + '/start/folder.svg'} width="72" height="72" alt="" />
								Organize your <span className="d-sm-block">research</span>
							</a>
						</div>
						<div className="col-md quick-link-container">
							<a className="quick-link" href="https://www.zotero.org/support/creating_bibliographies">
							<img src={imagePath + '/start/bibliography.svg'} width="72" height="72" alt="" />
								Create a <span className="d-sm-block">bibliography</span>
							</a>
						</div>
						<div className="col-md quick-link-container">
							<a className="quick-link" href="https://www.zotero.org/support/word_processor_plugin_usage">
								<img src={imagePath + '/start/plugin.svg'} width="72" height="72" alt="" />
								Cite in Word <span className="d-sm-block">or LibreOffice</span>
							</a>
						</div>
					</div>
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
				<p className="install-success">Success! You installed Zotero!</p>
				<section className="section section-md section-extensions">
					<InstallConnectorPrompt ref='installConnectorPrompt' numbered={true} />
				</section>
				<RegisterForm ref='registerForm' />
				<PostRegisterGuide ref='postRegisterGuide' />
			</div>
		);
	}
}

export {Start, InstallConnectorPrompt, RegisterForm};
