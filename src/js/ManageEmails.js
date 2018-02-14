'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('ManageEmails');

const React = require('react');
const {Component} = React;
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {postFormData} from './ajax.js';
import {buildUrl} from './wwwroutes.js';
import { Notifier } from './Notifier.js';

//list of autocomplete options
class ManageEmails extends Component{
	constructor(props){
		super(props);
	}
	render(){
		const {userValidated, emails, primaryEmail} = this.props;
		log.debug(emails);

		return (
			<div id='manage-emails'>
				<EmailSummary emails={emails} primaryEmail={primaryEmail} />
				{userValidated == 0 ?
					<ValidationPrompt />
					: <SecondaryEmailPrompt emails={emails} />}
				<AddEmailInput />
			</div>
		);
	}
}
ManageEmails.propTypes = {
	userValidated:PropTypes.bool,
	emails:PropTypes.arrayOf(PropTypes.shape({
		email:PropTypes.string.isRequired,
		validated:PropTypes.string.isRequired,
		emailID:PropTypes.string.isRequired
	}))
};

//prompt users to validate their email addresses
class ValidationPrompt extends Component{
	constructor(props){
		super(props);
		this.state = {
			done:false
		};
		this.requestEmails = this.requestEmails.bind(this);
	}
	requestEmails(evt){
		evt.preventDefault();
		postFormData(buildUrl('updateEmail'), {ajax:true, emailAction:'validate'}, {withSession:true}).then(()=>{
			this.setState({done:true});
		});
	}
	render(){
		return (
			<div className='ValidationPrompt'>
				<p>Some features will not be fully enabled until you <a href='#' onClick={this.requestEmails}>validate your email address</a></p>
				{this.state.done ? 
					<p>A validation email has been sent and should arrive shortly.</p>
					: null}
			</div>
		);
	}
}

//prompt users to add a different email address
class SecondaryEmailPrompt extends Component{
	render(){
		const {emails} = this.props;
		let validated = emails.filter(function(email){
			return email.validated == '1';
		});
		if(validated.length == 1){
			if(validated[0].email.includes('.edu') || validated[0].email.includes('.ac.uk')){
				return (
					<div className='secondary-email-prompt'>
						<p className='hint'>It looks like your only verified email is an institutional address. You may want to add another verified address so you won't lose access to your Zotero account if your email address is disabled. Password reset emails can only be sent to verified addresses.</p>
					</div>
				);
			} else {
				return (
					<div className='secondary-email-prompt'>
						<p className='hint'>You only have one verified email address assocaited with your account. If there's a risk you'll lose access to this account in the future, you may want to add a backup so you can always regain access to your Zotero account. Password reset emails can only be sent to verified addresses.</p>
					</div>
				);
			}
		}
		return null;
	}
}
SecondaryEmailPrompt.propTypes = {
	emails:PropTypes.arrayOf(PropTypes.object).isRequired
};

class AddEmailInput extends Component{
	constructor(props){
		super(props);
		this.state = {email:''};
		this.inputChanged = this.inputChanged.bind(this);
		this.addEmail = this.addEmail.bind(this);
	}
	inputChanged(evt){
		this.setState({email:evt.target.value});
	}
	addEmail(evt){
		evt.preventDefault();
		let email = this.state.email;
		postFormData(buildUrl('updateEmail'), {ajax:true, emailAction:'add', email:email}, {withSession:true}).then((resp)=>{
			if(!resp.ok){
				this.setState({formError:'Failed to add email address. It may already be associated with another account.'});
			} else {
				resp.json().then((data)=>{
					if(data.success){
						this.setState({done:true});
						window.location.reload();
					} else {
						this.setState({formError:'Failed to add email address. It may already be associated with another account.'});
					}
				});
			}
		});
	}
	render(){
		let notifier = null;
		if(this.state.formError){
			notifier = <Notifier type='error' message={this.state.formError} />;
		}
		return (
			<div className='add-email-input'>
				{notifier}
				<form onSubmit={this.addEmail}>
					<div>
						<label htmlFor='add-email'>Add email address</label>
						<input type='text' className='form-control' onChange={this.inputChanged} value={this.state.email} id='add-email' placeholder="Additional Email" />
					</div>
					<div>
						<button type='submit'>Add</button>
					</div>
				</form>
			</div>
		);
	}
}

class EmailSummary extends Component{
	render(){
		const {emails, primaryEmail} = this.props;
		
		let rows = emails.map((email)=>{
			return (
				<tr key={email.emailID}>
					<td>{email.email}</td>
					<td>{email.email == primaryEmail ?
						<Tag content='Primary' classNames='primary' title='All notifications will go to this address. Password resets can be sent to any verified address.' />
						:null}
					{email.validated == '0' ?
						<Tag content='Unverified' title='Unverified addresses cannot receive password resets.' />
						:null}
					</td>
					<td>
					{email.email != primaryEmail && email.validated == '1' ?
						<SetPrimaryEmailLink email={email.email} text='Set Primary' />
						:null}
					</td>
					<td>
					{email.validated == '0' ?
						<span>Verification email sent. <SendVerificationLink email={email.email} text='Resend' /></span>
						:null}
					</td>
					<td>
					<DeleteEmailLink className='delete-email-link' email={email.email} text='Delete'/>
					</td>
				</tr>
			);
		});

		return (
			<div className='table-wrapper'>
				<table>
					<tbody>
						{rows}
					</tbody>
				</table>
			</div>
		);
	}
}
EmailSummary.propTypes = {
	primaryEmail: PropTypes.string.isRequired,
	emails: PropTypes.array.isRequired
};

class Tag extends Component{
	render(){
		return (
			<span className={classnames('label', this.props.classNames)}>{this.props.content}</span>
		);
	}
}
Tag.propTypes = {
	content:PropTypes.string.isRequired
};

class SendVerificationLink extends Component{
	constructor(props){
		super(props);
		this.state = {
			done:false
		};
		this.requestEmails = this.requestEmails.bind(this);
	}
	requestEmails(evt){
		evt.preventDefault();
		postFormData(buildUrl('updateEmail'), {ajax:true, emailAction:'validate', email:this.props.email}, {withSession:true}).then(()=>{
			this.setState({done:true});
			window.location.reload();
		});
	}
	render(){
		const {text} = this.props;
		return (
			<a className='verify-email-link' href='#' onClick={this.requestEmail}>{text}</a>
		);
	}
}
SendVerificationLink.propTypes = {
	email:PropTypes.string.isRequired,
	text:PropTypes.string.isRequired
};

class DeleteEmailLink extends Component{
	constructor(props){
		super(props);
		this.state = {
			done:false
		};
		this.deleteEmail = this.deleteEmail.bind(this);
	}
	deleteEmail(evt){
		evt.preventDefault();
		postFormData(buildUrl('updateEmail'), {ajax:true, emailAction:'delete', email:this.props.email}, {withSession:true}).then(()=>{
			this.setState({done:true});
			window.location.reload();
		});
	}
	render(){
		const {text} = this.props;
		return (
			<a className='delete-email-link' href='#' onClick={this.deleteEmail}>{text}</a>
		);
	}
}
DeleteEmailLink.propTypes = {
	email:PropTypes.string.isRequired,
	text:PropTypes.string.isRequired
};

class SetPrimaryEmailLink extends Component{
	constructor(props){
		super(props);
		this.state = {
			done:false
		};
		this.setPrimary = this.setPrimary.bind(this);
	}
	setPrimary(evt){
		evt.preventDefault();
		postFormData(buildUrl('updateEmail'), {emailAction:'primary', email:this.props.email, ajax:true}, {withSession:true}).then(()=>{
			this.setState({done:true});
			window.location.reload();
		});
	}
	render(){
		const {text} = this.props;
		return (
			<a className='setprimary-link' href='#' onClick={this.setPrimary}>{text}</a>
		);
	}
}
SetPrimaryEmailLink.propTypes = {
	email:PropTypes.string.isRequired,
	text:PropTypes.string.isRequired
};

/*
let accessShape = PropTypes.shape({
	library: PropTypes.bool,
	notes: PropTypes.bool,
	write: PropTypes.bool,
	groups: PropTypes.object
}).isRequired;
*/
export {ManageEmails};