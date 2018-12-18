'use strict';

// import {log as logger} from './Log.js';
// let log = logger.Logger('AddViaEmail');

const React = require('react');
const {Component, PureComponent} = React;
import PropTypes from 'prop-types';

import {postFormData} from './ajax.js';
import {buildUrl} from './wwwroutes.js';
import { Notifier } from './Notifier.js';

//list of autocomplete options
class AddViaEmail extends Component{
	constructor(props){
		super(props);
		this.state = {
			currentEmail:props.currentEmail
		};
	}
	enableEmail = async (evt) => {
		evt.preventDefault();
		let resp = await postFormData(buildUrl('addviaemail'), {ajax:true, emailAction:'create'}, {withSession:true});
		let rdata = await resp.json();
		if(rdata.success){
			this.setState({working:false, currentEmail:rdata.email});
		} else {
			this.setState({working:false, notification:{
				type:'error', message:'Failed activating email address'
			}});
		}
	}
	resetEmail = async (evt) => {
		evt.preventDefault();
		let resp = await postFormData(buildUrl('addviaemail'), {ajax:true, emailAction:'refresh'}, {withSession:true});
		let rdata = await resp.json();
		if(rdata.success){
			this.setState({working:false, currentEmail:rdata.email});
		} else {
			this.setState({working:false, notification:{
				type:'error', message:'Failed refreshing email address'
			}});
		}
	}
	deleteEmail = async (evt) => {
		evt.preventDefault();
		let resp = await postFormData(buildUrl('addviaemail'), {ajax:true, emailAction:'delete'}, {withSession:true});
		let rdata = await resp.json();
		if(rdata.success){
			this.setState({working:false, currentEmail:null});
		} else {
			this.setState({working:false, notification:{
				type:'error', message:'Failed disabling email address'
			}});
		}
	}
	render(){
		const {currentEmail, notification} = this.state;
		
		let actions = [];
		if(currentEmail){
			actions.push(<a className='viaemail-link' key='disable' onClick={this.deleteEmail}>Disable</a>);
			actions.push(<a className='viaemail-link' key='cycle' onClick={this.resetEmail}>Reset</a>);
		} else {
			actions.push(<a className='viaemail-link' key='enable' onClick={this.enableEmail}>Enable email to your Zotero library</a>);
		}
		return (
			<div id='add-via-email'>
				<Notifier {...notification} />
				<p>You can add items to your library by sending an email with a url to a designated Zotero email address.</p>
				<CurrentEmail currentEmail={currentEmail} actions={actions} />
			</div>
		);
	}
}
AddViaEmail.propTypes = {
	emailConfirmed:PropTypes.bool,
	currentEmail:PropTypes.string
};

class CurrentEmail extends PureComponent {
	render(){
		const {currentEmail, actions} = this.props;
		if(!currentEmail) {
			return (
				<div className='current-email'>
					<p>Email to add items to your Zotero library is currently disabled.</p>
					{actions}
				</div>
			);
		} else {
			return (
				<div className='current-email'>
					<p className='current-email'>
						<b>Zotero email: </b> {currentEmail}
					</p>
					{actions}
					<p className='hint'>
						Email URLs or identifiers (DOIs, PMIDs, ISBNs, arXiv IDs) to this address to add them to your Zotero library.
						Items will go directly into your personal library.
					</p>
					<p className='hint'>
						If you receive spam in your account, click reset and we will generate a new incoming email address. Zotero will send you a confirmation email.
					</p>
				</div>
			);
		}
	}
}

export {AddViaEmail};