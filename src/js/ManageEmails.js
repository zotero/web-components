'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('ManageEmails');

import {useState} from 'react';
import PropTypes from 'prop-types';
import {Form, FormGroup, Label, Input, Button} from 'reactstrap';
import classnames from 'classnames';

import {postFormData} from './ajax.js';
import {buildUrl} from './wwwroutes.js';
import { Notifier } from './Notifier.js';

function ManageEmails(props){
	const {userValidated, emails, primaryEmail} = props;

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
ManageEmails.propTypes = {
	userValidated:PropTypes.bool,
	emails:PropTypes.arrayOf(PropTypes.shape({
		email:PropTypes.string.isRequired,
		validated:PropTypes.string.isRequired,
		emailID:PropTypes.string.isRequired
	}))
};

//prompt users to validate their email addresses
function ValidationPrompt(){
	const [done, setDone] = useState(false);
	const requestEmails = async (evt) => {
		evt.preventDefault();
		await postFormData(buildUrl('updateEmail'), {ajax:true, emailAction:'validate'}, {withSession:true});
		setDone(true);
	};
	
	return (
		<div className='ValidationPrompt'>
			<p>Some features will not be fully enabled until you <a href='#' onClick={requestEmails}>validate your email address</a></p>
			{done ? 
				<p>A validation email has been sent and should arrive shortly.</p>
				: null}
		</div>
	);
}

//prompt users to add a different email address
function SecondaryEmailPrompt(props){
	const {emails} = props;
	const validated = emails.filter(function(email){
		return email.validated == '1';
	});
	if(validated.length == 1){
		if(validated[0].email.includes('.edu') || validated[0].email.includes('.ac.uk')){
			return (
				<div className='secondary-email-prompt'>
					<p className='text-muted'>It looks like your only verified email is an institutional address. You may want to add another verified address so you won't lose access to your Zotero account if your email address is disabled. Password reset emails can only be sent to verified addresses.</p>
				</div>
			);
		} else {
			return (
				<div className='secondary-email-prompt'>
					<p className='text-muted'>You only have one verified email address associated with your account. If there's a risk you'll lose access to this account in the future, you may want to add a backup so you can always regain access to your Zotero account. Password reset emails can only be sent to verified addresses.</p>
				</div>
			);
		}
	}
	return null;
}
SecondaryEmailPrompt.propTypes = {
	emails:PropTypes.arrayOf(PropTypes.object).isRequired
};

function AddEmailInput(){
	const [email, setEmail] = useState('');
	const [formError, setFormError] = useState(null);
	
	const addEmail = async (evt) => {
		evt.preventDefault();
		let resp = await postFormData(buildUrl('updateEmail'), {ajax:true, emailAction:'add', email}, {withSession:true});
		if(!resp.ok){
			setFormError('Failed to add email address. It may already be associated with another account.');
		} else {
			let data = await resp.json();
			if(data.success){
				window.location.reload();
			} else {
				setFormError('Failed to add email address. It may already be associated with another account.');
			}
		}
	};
	
	return (
		<div className='add-email-input'>
			<Notifier type='error' message={formError} />
			<Form onSubmit={addEmail}>
				<FormGroup>
					<Label for='add-email'>Add email address</Label>{' '}
					<Input type='text' onChange={(evt)=>{setEmail(evt.target.value);}} value={email} id='add-email' placeholder="Additional Email" />
				</FormGroup>
				<Button type='submit'>Add</Button>
			</Form>
		</div>
	);
}

function EmailSummary(props){
	const {emails, primaryEmail} = props;
	
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
			<table className='table table-striped'>
				<tbody>
					{rows}
				</tbody>
			</table>
		</div>
	);
}
EmailSummary.propTypes = {
	primaryEmail: PropTypes.string.isRequired,
	emails: PropTypes.array.isRequired
};

function Tag(props){
	return <span className={classnames('label', props.classNames)}>{props.content}</span>;
}
Tag.propTypes = {
	content:PropTypes.string.isRequired
};

function SendVerificationLink(props){
	const {email, text} = props;
	const requestEmail = (evt) => {
		evt.preventDefault();
		postFormData(buildUrl('updateEmail'), {ajax:true, emailAction:'validate', email}, {withSession:true}).then(()=>{
			window.location.reload();
		});
	};
	return (
		<a className='verify-email-link' href='#' onClick={requestEmail}>{text}</a>
	);
}
SendVerificationLink.propTypes = {
	email:PropTypes.string.isRequired,
	text:PropTypes.string.isRequired
};

function DeleteEmailLink(props){
	const {text, email} = props;
	const deleteEmail = (evt) => {
		evt.preventDefault();
		postFormData(buildUrl('updateEmail'), {ajax:true, emailAction:'delete', email}, {withSession:true}).then(()=>{
			window.location.reload();
		});
	};
	return <a className='delete-email-link' href='#' onClick={deleteEmail}>{text}</a>;
}
DeleteEmailLink.propTypes = {
	email:PropTypes.string.isRequired,
	text:PropTypes.string.isRequired
};

function SetPrimaryEmailLink(props){
	const {email, text} = props;
	const setPrimary = (evt) => {
		evt.preventDefault();
		postFormData(buildUrl('updateEmail'), {emailAction:'primary', email, ajax:true}, {withSession:true}).then(()=>{
			window.location.reload();
		});
	};
	return <a className='setprimary-link' href='#' onClick={setPrimary}>{text}</a>;
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