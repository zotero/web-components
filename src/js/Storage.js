'use strict';

/*
TODO:
 - clean up
 - clarify when institutional plan makes individual plan unnecessary
 - clarify when charge won't be made right away, allow to force immediate charge
 - present detailed receipt more obviously after payment
 - use new PaymentModal to get token to create source with card or IBAN
 - don't allow automatic renewal if institution provides storage
 - show that individual subscription won't be renewed with institutional storage

Flows:
 - First time subscription
 - update payment details
 - renew now, expiration imminent
 - force payment now (for multiple years?)
 - Change current plan without immediate payment
 - change current plan and pay now
 - Lab Payment
 - Lab Renewal
 - Lab receipt
 - allow payments for third parties
*/

import {log as logger} from './Log.js';
var log = logger.Logger('StorageComponent');

const React = require('react');
const {Component} = React;
//import {StripeProvider} from 'react-stripe-elements';
import PropTypes from 'prop-types';

import {ajax, postFormData} from './ajax.js';
import {Notifier} from './Notifier.js';
//import PaymentModal from './storage/PaymentModal.jsx';
import SubscriptionHandler from './storage/SubscriptionHandler.jsx';
import {calculateNewExpiration} from './storage/calculations.js';
import { Row, Col } from 'reactstrap';
import {PaymentSource} from './storage/PaymentSource.jsx';

const dateFormatOptions = {year: 'numeric', month: 'long', day: 'numeric'};

let plans = [
	{
		storageLevel: 1,
		description: '300 MB',
		price: 'Free',
		discountedPrice: 'Free'
	},
	{
		storageLevel: 2,
		description: '2 GB',
		price: '$20',
		discountedPrice: '$16'
	},
	{
		storageLevel: 3,
		description: '6 GB',
		price: '$60',
		discountedPrice: '$48'
	},
	{
		storageLevel: 6,
		description: 'Unlimited',
		price: '$120',
		discountedPrice: '$96'
	}
];

class StoragePlanRow extends Component {
	render() {
		let plan = this.props.plan;
		let userSubscription = this.props.userSubscription;

		let current = plan.storageLevel == userSubscription.storageLevel;
		let button = (<button 
			type="button"
			onClick={this.props.selectPlan}
			onMouseOver={this.props.previewPlan}
			onMouseOut={this.props.unpreviewPlan}
			className="btn btn-secondary selectPlanButton"
			data-storagelevel={plan.storageLevel}
			>Select Plan

		</button>);
		
		let rowClass = '';
		if(current){
			button = 'Current Plan';
			rowClass = 'current-plan';
		}
		if(plan.storageLevel == 1) {
			button = '';
		}
		return (
			<tr key={plan.storageLevel} className={rowClass}>
				<td>{plan.description}</td>
				<td>{userSubscription.discountEligible ? plan.discountedPrice : plan.price}</td>
				<td>
					{button}
				</td>
			</tr>
		);
	}
}

StoragePlanRow.propTypes = {
	plan: PropTypes.shape({
		storageLevel: PropTypes.number,
		description: PropTypes.string,
		discountedPrice: PropTypes.string,
		price: PropTypes.string
	}).isRequired,
	userSubscription: PropTypes.shape({
		storageLevel: PropTypes.number,
		discountEligible: PropTypes.bool
	}).isRequired
};

class InstitutionProvides extends Component {
	render(){
		const {institution} = this.props;
		let quotaDescription = `${institution.storageQuota} MB of storage`;
		if(institution.storageQuota == 1000000){
			quotaDescription = 'unlimited storage';
		}
		if(institution.validated == '0'){
			return (
				<p>{institution.name} provides {quotaDescription} for {institution.email}. <a href='/settings/account#manage-emails'>Confirm your email address</a> to take advantage.</p>
			);
		} else {
			return (
				<p>{institution.name} provides {quotaDescription} for {institution.email}</p>
			);
		}
	}
}
InstitutionProvides.propTypes = {
	institution: PropTypes.shape({
		storageQuota: PropTypes.number,
		validated: PropTypes.string,
		name: PropTypes.string,
		email: PropTypes.string
	})
};

class InstitutionalRow extends Component {
	render(){
		const {institutions} = this.props;
		if(!institutions) {
			return null;
		}
		if(institutions.length > 0) {
			let instNodes = institutions.map(function(institution){
				return <InstitutionProvides key={institution.name} institution={institution} />;
			});
			return (
				<tr>
					<th>Institutional Storage</th>
					<td>{instNodes}</td>
				</tr>
			);
		}
		return null;
	}
}
InstitutionalRow.propTypes = {
	institutions: PropTypes.arrayOf(PropTypes.object)
};

class StorageMeter extends Component {
	render(){
		const {userSubscription} = this.props;

		let quota = userSubscription.quota;
		if(quota == 1000000) {
			return null;
		}

		let quotaPercentage = parseFloat(userSubscription.usage.total) / parseFloat(quota) * 100.0;
		quotaPercentage = quotaPercentage.toFixed(1);

		return (
			<div>
				<meter id='storage-quota' value={quotaPercentage} max='100' low='40' high='70' optimum='0'></meter>
				<span className="storage-quota-percentage">{quotaPercentage}%</span>
			</div>
		);
	}
}

class GroupUsage extends Component {
	render(){
		const {group, usage} = this.props;
		return (
			<p>{group.title} - {usage} MB</p>
		);
	}
}
GroupUsage.propTypes = {
	group: PropTypes.shape({
		title: PropTypes.string
	}),
	usage: PropTypes.number
};

class PaymentRow extends Component {
	render() {
		const {defaultSource, userSubscription, updateCardHandler, renewHandler} = this.props;

		if(!defaultSource || !userSubscription.recur){
			let paymentButton = <button className="btn btn-secondary" onClick={updateCardHandler}>Enable Automatic Renewal</button>;

			let expiration = new Date(userSubscription.expirationDate * 1000);
			if(expiration < (Date.now() + (1000*60*60*24*15))) {
				//expiration less than 2 weeks away, charge card now
				paymentButton = <button className="btn btn-secondary" onClick={renewHandler}>Renew Now</button>;
			}
			return (
				<tr>
					<th>Payment</th>
					<td>
						<p>{paymentButton}</p>
					</td>
				</tr>
			);
		}
		return (
			<tr>
				<th>Payment Method</th>
				<td>
					<PaymentSource source={defaultSource} />
					<Row className='mt-2'>
						<Col>
							<button className="btn btn-sm btn-secondary" onClick={updateCardHandler}>Update Payment</button>
						</Col>
						<Col>
							<button className="btn btn-sm btn-secondary" onClick={renewHandler}>Renew Now</button>
						</Col>
					</Row>
				</td>
			</tr>
		);
	}
}
PaymentRow.propTypes = {
	defaultSource: PropTypes.object,
	userSubscription: PropTypes.object.isRequired,
	updateCardHandler: PropTypes.func.isRequired,
	renewHandler: PropTypes.func.isRequired
};

class NextPaymentRow extends Component {
	render() {
		const {userSubscription, cancelRecur} = this.props;
		let d = new Date(parseInt(userSubscription.expirationDate)*1000);
		let formattedExpirationDate = d.toLocaleDateString('en-US', dateFormatOptions);

		if(userSubscription.recur && d > Date.now()){
			return (
				<tr>
					<th>Next Payment</th>
					<td>
						<Row>
							<Col>{formattedExpirationDate}</Col>
						</Row>
						<Row>
							<Col>
								<button className="btn btn-sm btn-secondary" onClick={cancelRecur}>Disable Autorenew</button>
							</Col>
						</Row>
					</td>
				</tr>
			);
		} else if(d < Date.now()) {
			return null;
		} else {
			return (
				<tr>
					<th>Next Payment</th>
					<td>
						<p>Plan will revert to free tier if not renewed</p>
					</td>
				</tr>
			);
		}
	}
}

class PreviewRow extends Component {
	render() {
		const {storageLevel, userSubscription} = this.props;
		if(!storageLevel){
			return null;
		}

		if(storageLevel == 1) {
			return (<tr><td colSpan='3'>New Expiration: Never</td></tr>);
		} else {
			let oldExpiration = new Date(parseInt(userSubscription.expirationDate) * 1000);
			let newExpiration = calculateNewExpiration(userSubscription.expirationDate, userSubscription.storageLevel, storageLevel);
			return (
				<tr>
					<td colSpan='3'>
					<Row>
						<Col>
							Current Expiration: {oldExpiration.toLocaleDateString('en-US', dateFormatOptions)}
						</Col>
					</Row>
					<Row>
						<Col>
							New Expiration: {newExpiration.toLocaleDateString('en-US', dateFormatOptions)}
						</Col>
					</Row>
					</td>
				</tr>
			);
		}
	}
}

class Storage extends Component {
	constructor(props) {
		super(props);
		this.state = {
			userSubscription:null,
			storageGroups:[],
			planQuotas:{},
			stripeCustomer:null,
			operationPending:false,
			notification:null
		};
	}
	componentDidMount(){
		if((typeof(window.zoteroData.userSubscription) !== 'undefined') && (typeof(window.zoteroData.stripeCustomer) !== 'undefined')){
			//don't load new data if it's already been loaded serverside and included with the page
			//instead just set the state with it
			this.setState({
				userSubscription: window.zoteroData.userSubscription,
				storageGroups:window.zoteroData.storageGroups,
				planQuotas: window.zoteroData.planQuotas,
				stripeCustomer: window.zoteroData.stripeCustomer
			});
			return;
		}
		this.getSubscription();
		this.getUserCustomer();
	}
	getSubscription = () => {
		log.debug('getSubscription');
		ajax({url:'/storage/usersubscription'}).then((resp) => {
			log.debug(resp);
			resp.json().then((data) => {
				this.setState({
					userSubscription: data.userSubscription,
					storageGroups:data.storageGroups,
					planQuotas: data.planQuotas
				});
			});
		}).catch((e)=>{
			log.debug('Error retrieving subscription data');
			log.debug(e);
			this.setState({notification:{
				type: 'error',
				message: 'There was an error retrieving your subscription data'
			}});
		});
	}
	getUserCustomer = () => {
		log.debug('getUserCustomer');
		ajax({url:'/storage/getusercustomer'}).then((resp) => {
			log.debug(resp);
			resp.json().then((data) => {
				this.setState({stripeCustomer: data});
			});
		}).catch((e)=>{
			log.debug('Error retrieving customer data');
			log.debug(e);
			this.setState({notification:{
				type: 'error',
				message: 'There was an error retrieving your subscription data'
			}});
		});
	}
	previewPlan = (evt) => {
		let storageLevel = evt.target.getAttribute('data-storagelevel');
		this.setState({previewStorageLevel:storageLevel});
	}
	unpreviewPlan = () => {
		this.setState({previewStorageLevel:null});
	}
	selectPlan = (evt) => {
		let storageLevel = parseInt(evt.target.getAttribute('data-storagelevel'), 10);
		this.setState({
			newSubscription:{
				type:'individualChange',
				storageLevel
			}
		});
		return;
	}
	renewNow = () => {
		const {userSubscription} = this.state;
		const storageLevel = userSubscription.storageLevel;
		this.setState({
			newSubscription:{
				type:'individualRenew',
				storageLevel
			}
		});

		return;
	}
	updatePayment = () => {
		this.setState({
			newSubscription:{
				type:'individualPaymentUpdate'
			}
		});
		return ;
	}
	cancelRecur = () => {
		this.setState({operationPending:true});

		postFormData('/storage/cancelautorenew').then((resp) => {
			log.debug(resp);
			this.setState({
				operationPending:false,
				notification: {
					type: 'success',
					message: 'Success'
				}
			});
		}).catch((resp) => {
			log.debug(resp);
			this.setState({
				operationPending:false,
				notification: {
					type: 'error',
					message: 'Error updating payment method. Please try again in a few minutes.'
				}
			});
		}).then(()=>{
			this.getSubscription();
			this.getUserCustomer();
		});
	}
	refresh = () => {
		this.getSubscription();
		this.getUserCustomer();
	}
	render() {
		const {userSubscription, storageGroups, stripeCustomer, previewStorageLevel, operationPending, notification, newSubscription} = this.state;
		if(userSubscription === null){
			return null;
		}

		let expirationDate = <td>Never</td>;
		if(userSubscription.expirationDate && (userSubscription.expirationDate != '0')) {
			let d = new Date(parseInt(userSubscription.expirationDate)*1000);
			let dateString = <p>{d.toLocaleDateString('en-US', dateFormatOptions)}</p>;
			let numDateFormatOptions = {year: 'numeric', month: 'numeric', day: 'numeric'};
			
			if(d < Date.now()){
				expirationDate = (<td>
					{dateString}
					<p>Your previous Zotero storage subscription has expired.</p>
				</td>);
			} else if(userSubscription.recur){
				expirationDate = (<td>
					{dateString}
					<p>Your Zotero storage subscription is set to automatically renew {d.toLocaleDateString('en-US', numDateFormatOptions)}.</p>
				</td>);
			} else {
				expirationDate = (<td>
					{dateString}
					<p>Your Zotero storage subscription will expire {d.toLocaleDateString('en-US', numDateFormatOptions)} if you don't renew before then.</p>
				</td>);
			}
		}

		let quotaDescription = userSubscription.quota + ' MB';
		if(userSubscription.quota == 1000000) {
			quotaDescription = 'Unlimited';
		}

		let groupUsageNodes = [];
		for(let groupID in userSubscription.usage.groups){
			let usage = userSubscription.usage.groups[groupID];
			groupUsageNodes.push(<GroupUsage key={groupID} group={storageGroups[groupID]} usage={usage} />);
		}

		let planRowNodes = plans.map((plan)=>{
			return <StoragePlanRow key={plan.storageLevel} plan={plan} userSubscription={userSubscription} selectPlan={this.selectPlan} previewPlan={this.previewPlan} unpreviewPlan={this.unpreviewPlan} />;
		});

		let paymentRow = null;
		if(userSubscription.storageLevel != 1) {
			let defaultSource = null;
			if(stripeCustomer){
				defaultSource = stripeCustomer.default_source;
			}
			paymentRow = (<PaymentRow 
				defaultSource={defaultSource}
				userSubscription={userSubscription}
				updateCardHandler={this.updatePayment}
				renewHandler={this.renewNow}
			/>);
		}
		
		let Payment = null;
		if(newSubscription){
			Payment = (<SubscriptionHandler
				newSubscription={newSubscription}
				userSubscription={userSubscription}
				stripeCustomer={stripeCustomer}
				refreshStorage={this.refresh}
				onClose={()=>{this.setState({newSubscription:false});}}
			/>);
		}

		return (
			<div className='storage-container'>
				{Payment}
				{operationPending ? 
					<div className='modal'><div className='modal-text'><p className='modal-text'>Updating...</p></div></div> :
					null
				}
				<Notifier {...notification} />
				<div className='user-storage'>
					<div className='current-storage flex-section'>
						<div className='section-header'>
							<b>Current Plan</b>
						</div>
						<div className='section-body'>
							<table className='table'>
								<tbody>
									<tr>
										<th>Quota</th>
										<td>{quotaDescription}</td>
									</tr>
									<tr>
										<th>Expiration</th>
										{expirationDate}
									</tr>
									<tr>
										<th>Current Usage</th>
										<td>
											<p>My Library - {userSubscription.usage.library} MB</p>
											{groupUsageNodes}
											<p>Total - {userSubscription.usage.total} MB</p>
											<StorageMeter userSubscription={userSubscription} />
										</td>
									</tr>
									{paymentRow}
									<NextPaymentRow cancelRecur={this.cancelRecur} userSubscription={userSubscription} />
									<InstitutionalRow institutions={userSubscription.institutions} />
								</tbody>
							</table>
						</div>
					</div>
					<div className='change-storage-plan flex-section'>
						<div className='section-header'>
							<b>Change Plan</b>
						</div>
						<div className='section-body'>
							<table className="table table-striped">
								<tbody>
									<tr>
										<th>Storage Amount</th>
										<th>Annual Price (USD)</th>
										<th></th>
									</tr>
									{planRowNodes}
									<PreviewRow storageLevel={previewStorageLevel} userSubscription={userSubscription} />
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export {Storage};
