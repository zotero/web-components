'use strict';

import {log as logger} from '../Log.js';
let log = logger.Logger('Manage');

const React = require('react');
const {Component} = React;

import {Collapse} from 'reactstrap';
import {Notifier} from '../Notifier.js';
import PropTypes from 'prop-types';
import {ButtonEditable} from '../components/ButtonEditable.js';
import {LabPurchase, labPrice} from './LabPurchase.js';
import {formatCurrency} from '../Utils.js';

import {postFormData} from '../ajax.js';
import {buildUrl} from '../wwwroutes.js';

class LabRenew extends Component{
	constructor(props){
		super(props);
		this.state = {
			fte:this.props.fte
		};
	}
	render(){
		const {fte} = this.state;
		const {name, institutionID} = this.props;
		let fteNum = parseInt(fte);
		if(!(fteNum > 14)){
			fteNum = 14;
		}
		//log.debug(`LabRenew fte:${fte} fteNum:${fteNum}`);
		return (
			<div>
				<a href='#' onClick={(evt)=>{evt.preventDefault(); this.setState({showRenew:true});}}>Renew</a>
				<Collapse isOpen={this.state.showRenew}>
					<div className='form-line'>
						<label htmlFor='lab_fte'>Users:</label>
						<input type='text' name='lab_fte' className='lab_fte form-control' value={fte} onChange={(evt)=>{this.setState({fte:evt.target.value});}} />
					</div>
					<div className='form-line'>
						<label>Price</label>
						{formatCurrency(labPrice(fteNum))}
					</div>
					<LabPurchase fte={fteNum} name={name} institutionID={institutionID} />
				</Collapse>
			</div>
		);
	}
}
LabRenew.defaultProps = {
	showRenew:false
};

class InstitutionData extends Component{
	constructor(props){
		super(props);
		this.state = {
			name:props.name
		};
	}
	saveInstitutionName = async (name) => {
		let updateUrl = buildUrl('manageInstitution', {institutionID:this.props.institutionID});
		let resp;
		try{
			resp = await postFormData(updateUrl, {institutionName:name}, {withSession:true});

			if(!resp.ok){
				throw 'Error updating institution name';
			}
			let respData = await resp.json();
			if(respData.success){
				this.setState({
					notification: {
						type: 'success',
						message: (<p>Institution updated</p>)
					},
					name:name
				});
			} else {
				throw 'Request failed';
			}
		} catch(e){
			log.debug(e);
			this.setState({
				notification: {
					type: 'error',
					message: (<p>There was an error updating the email list</p>)
				}
			});

		}
	}
	render(){
		const {fte, userEmails, expirationDate, institutionID} = this.props;
		const {name} = this.state;
		let expdate = new Date(expirationDate*1000);
		//let expdate = new Date();
		return (
			<div>
				<h3>Institution</h3>
				<div className='form-line'>
					<label htmlFor='lab_name'>Name:</label>
					<ButtonEditable save={this.saveInstitutionName} value={name} />
					<p className='hint'>This name will appear as the provider of storage for your users.</p>
				</div>
				<div className='form-line'>
					<label htmlFor='lab_fte'>Users:</label>
					{userEmails.length} / {fte}
				</div>
				<div className='form-line'>
					<label>Expiration:</label>
					{`${expdate.getFullYear()}-${expdate.getMonth()+1}-${expdate.getDate()}`}
				</div>
				<LabRenew
					fte={fte}
					institutionID={institutionID}
					name={name}
				/>
			</div>
		);
	}
}
InstitutionData.defaultProps = {
	emails:[],
	fte:15,
	name:''
};

class Manage extends Component{
	constructor(props){
		super(props);
		this.state = {
			emails:props.userEmails
		};
	}
	updateEmailList = async () => {
		const {emails} = this.state;
		let updateUrl = buildUrl('institutionemaillist', {institutionID:this.props.institutionID});
		let resp;
		try{
			resp = await postFormData(updateUrl, {emails:emails.join('\n')}, {withSession:true});

			log.debug(resp);
			if(!resp.ok){
				throw 'Error updating email list';
			}
			let respData = await resp.json();
			log.debug(respData);
			this.setState({
				notification: {
					type: 'success',
					message: (<p>Email list updated</p>)
				}
			});
		} catch(e){
			log.debug(e);
			this.setState({
				notification: {
					type: 'error',
					message: (<p>There was an error updating the email list</p>)
				}
			});

		}
	}
	render(){
		const {emails, notification} = this.state;
		//const {institution} = this.props;
		let emailsText = emails.join('\n');
		return (
			<div className='manage-institution'>
				<Notifier {...notification} />
				<div className='flex-container'>
					<div className='email-list flex-section'>
						<h3>Email List</h3>
						<textarea
							className='form-control email-list'
							rows='10'
							value={emailsText}
							onChange={(evt)=>{
								this.setState({
									emails:evt.target.value.split('\n')
								});
							}}
						/>
						<p className='hint'>One email per line, no other separators</p>
						<button className='btn update-list-button' onClick={this.updateEmailList}>Update List</button>
					</div>
					<div className='current-storage flex-section'>
						<InstitutionData {...this.props} />
					</div>
				</div>
			</div>
		);
	}
}
Manage.propTypes = {
	institutionID:PropTypes.number.isRequired,
	userEmails:PropTypes.arrayOf(PropTypes.string).isRequired
};
Manage.defaultProps = {
	emails:[]
};

export {Manage};