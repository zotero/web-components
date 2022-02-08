'use strict';

import {log as logger} from '../Log.js';
let log = logger.Logger('Checkout');

const React = require('react');
const {Component} = React;
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import {LabCheckout} from './LabCheckout.js';
import {Notifier} from '../Notifier.js';
import {formatCurrency} from '../Utils.js';

import {postFormData} from '../ajax.js';

let institutionPrice = function(fte){
	return (210000 + ((Math.max(500, fte) - 500) * 42));
};

class FormFieldErrorMessage extends Component {
	render() {
		return (
			<p className='form-field-error'>{this.props.message}</p>
		);
	}
}

// Checkout is a component that allows a user to enter a number of FTE for their institution and preview
// the price for an institutional plan with that many users, then make the purchase or request an invoice
class Checkout extends Component {
	constructor(props) {
		super(props);
		let defaultTabIndex = 0;
		if(location.hash == '#institution') {
			defaultTabIndex = 1;
		}
		this.state = {
			defaultTabIndex
		};
	}
	updateHash = (index, lastIndex, evt) => {
		if (index == 0) {
			location.hash = "lab";
		} else if (index == 1) {
			location.hash = "institution";
		}
	}
	render() {
		return (
			<div className='institution-checkout'>
				<h1>Zotero Lab and Zotero Institution</h1>
				<p>Zotero offers two types of unlimited <a href="https://www.zotero.org/support/storage">storage</a> plans for organizations: Zotero Lab and Zotero Institution. These subscriptions provide members of your organization with unlimited personal and group cloud storage. And as is always the case with Zotero, your users can create as many research groups as they like, with as many members as they need.</p>
				<p>To request more information, please contact <a href="mailto:storage@zotero.org">storage@zotero.org</a>.</p>
				<Tabs onSelect={this.handleSelect} forceRenderTabPanel={true} defaultIndex={this.state.defaultTabIndex} onSelect={this.updateHash}>
					<TabList>
						<Tab>Lab</Tab>
						<Tab>Institution</Tab>
					</TabList>
					<TabPanel>
						<LabCheckout ref='labcheckout' />
					</TabPanel>
					<TabPanel>
						<InstitutionCheckout ref='institutioncheckout' />
					</TabPanel>
				</Tabs>
			</div>
		);
	}
}

class InstitutionCheckout extends Component {
	constructor(props) {
		super(props);
		this.state = {
			fte:props.fte,
			contact:props.contact,
			domain:props.domain,
			name:props.name,
			formErrors:{}
		};
	}
	handleFTEChange = (evt) => {
		let nv = evt.target.value;
		nv = nv.replace(/\D/g,'');
		if(nv != ''){
			nv = parseInt(nv);
			if(isNaN(nv)){
				nv = 15;
			}
		}
		this.setState({fte:nv});
	}
	validateForm = (state) => {
		let {fte, contact, name, domain} = state;
		if(fte == '' || isNaN(parseInt(fte))){
			return {
				valid:false,
				field:'fte',
				reason:'Please specify a number of full time equivalents at your institution.'
			};
		}
		if(contact == '') {
			return {
				valid:false,
				field:'contact',
				reason:'Please specify an email address to contact you with.'
			};
		}
		if(name == '') {
			return {
				valid:false,
				field:'name',
				reason:'Please specify the name of your institution.'
			};
		}
		if(domain == '') {
			return {
				valid:false,
				field:'domain',
				reason:'Please specify one or more domains that your institution uses for email addresses.'
			};
		}
		return {valid:true};
	}
	requestInvoice = async () => {
		let resp;
		let {fte, contact, domain, name} = this.state;
		let validated = this.validateForm(this.state);
		if(!validated.valid){
			//show error
			let formErrors = {};
			formErrors[validated.field] = validated.reason;
			this.setState({formErrors});
			return;
		}

		try{
			resp = await postFormData('/storage/requestinstitutionalinvoice', {
				subscriptionType:'lab',
				fte:fte,
				institutionName:name,
				institutionDomain:domain,
				contactEmail: contact
			});

			log.debug(resp);
			if(!resp.ok){
				throw resp;
			}
			let respData = await resp.json();
			log.debug(respData);
			this.setState({
				notification: {
					type: 'success',
					message: (<p>We'll contact you shortly about your Zotero Institution subscription</p>)
				}
			});

		} catch(e) {
			log.debug(e);
			if(e.status == 429) {
				this.setState({
					notification: {
						type: 'error',
						message: "There was an error requesting an invoice. If you've already requested an invoice we'll get back to you shortly. If you continue to experience problems, email storage@zotero.org for assistance."
					}
				});
			} else {
				this.setState({
					notification: {
						type: 'error',
						message: 'There was an error requesting an invoice. If you continue to experience problems, email storage@zotero.org for assistance.'
					}
				});
			}
		}
	}
	render(){
		const {fte, contact, domain, name, notification, formErrors} = this.state;
		
		return (
			<div id='institutional-checkout'>
				<p>
					Zotero Institution provides unlimited storage for entire universities, research institutions, and corporations. All members of your organization are automatically added to your Zotero Institution subscription, based on their organizational email addresses.
				</p>
				<p>
					Pricing is based on institution size rather than usage and offers a deeply discounted rate without the need to individually manage users. The cost is $2100 for the first 500 FTE and $0.42 per additional FTE.
				</p>
				<div className='form-line'>
					<label htmlFor='institution_fte'>FTE:</label>
					<input type='text' className='institution_fte form-control' value={fte} onChange={this.handleFTEChange} />
					<FormFieldErrorMessage message={formErrors['fte']} />
				</div>
				<div className='form-line'>
					<label>Price</label>
					{formatCurrency(institutionPrice(fte))}
					<span>&nbsp;per year, billed annually</span>
				</div>
				<div className='form-line'>
					<label>Contact Email:</label>
					<input type='text' className='institution_contact_email form-control' value={contact} onChange={(evt)=>{this.setState({contact:evt.target.value});}} />
					<FormFieldErrorMessage message={formErrors['contact']} />
				</div>
				<div className='form-line'>
					<label htmlFor='institution_name'>Institution Name:</label>
					<input type='text' name='institution_name' className='institution_name form-control' value={name} onChange={(evt)=>{this.setState({name:evt.target.value});}} />
					<p className='hint'>This name will appear as the provider of storage for your users.</p>
					<FormFieldErrorMessage message={formErrors['name']} />
				</div>
				<div className='form-line'>
					<label htmlFor='institution_domain'>Domain(s):</label>
					<input type='text' name='institution_domain' className='form-control' value={domain} onChange={(evt)=>{this.setState({domain:evt.target.value});}} placeholder='@my-institution.edu' />
					<p className='hint'>The domain(s) you use for your institution's email addresses. This is how we'll identify your users.</p>
					<FormFieldErrorMessage message={formErrors['domain']} />
				</div>
				
				<div className='form-line purchase-line'>
					<button className='btn' onClick={this.requestInvoice}>Request Invoice</button>
				</div>
				<Notifier {...notification} />
			</div>
		);
	}
}
InstitutionCheckout.defaultProps = {
	fte:500,
	name:'',
	domain:'',
	contact:''
};

export {Checkout};