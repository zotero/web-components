'use strict';

import {log as logger} from './Log.js';
var log = logger.Logger('StorageComponent');

const React = require('react');
const {Component} = React;
import PropTypes from 'prop-types';

import {ajax, postFormData} from './ajax.js';
import {Notifier} from './Notifier.js';

let priceCents = {'1':0,'2':2000,'3':6000,'4':10000,'5':24000,'6':12000};
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

var calculateRemainingValue = function(expiration=Date.now(), storageLevel=2) {
	log.debug(expiration);
	if(expiration < Date.now()){
		return 0;
	}
	let secondsPerYear = 31536000; //60*60*24*365
	
	let now = new Date(Date.now());
	let secondsLeft = (expiration.getTime() - now.getTime()) / 1000;
	let remainingValue = priceCents[storageLevel] * (secondsLeft / secondsPerYear);

	return remainingValue;
};

var calculateNewExpiration = function(oldExpiration, oldStorageLevel, newStorageLevel) {
	let secondsPerYear = 31536000; //60*60*24*365
	
	if(typeof oldExpiration == 'string'){
		oldExpiration = new Date(parseInt(oldExpiration)*1000);
	}

	if(oldExpiration < (Date.now() + (1000*60*60*24*15)) && (oldExpiration > Date.now())) {
		//expiration less than 2 weeks away, will charge and expiration will be now+1year
		let newExpiration = new Date((oldExpiration.getTime()) + (secondsPerYear * 1000)); //new Date takes milliseconds
		return newExpiration;
	}
	
	let remainingValue = calculateRemainingValue(oldExpiration, oldStorageLevel);
	let extraSecondsAtNewLevel = (remainingValue / priceCents[newStorageLevel]) * secondsPerYear;

	let newExpiration = new Date(Date.now() + (extraSecondsAtNewLevel * 1000)); //new Date takes milliseconds

	return newExpiration;
};

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
			className="btn btn-primary selectPlanButton"
			data-storagelevel={plan.storageLevel}
			//data-pricecents={priceCents[plan.storageLevel]}
			//data-description={'Zotero storage'}
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
		let institution = this.props.institution;
		let quotaDescription = `${institution.storageQuota} MB of storage`;
		if(institution.storageQuota == 1000000){
			quotaDescription = 'unlimited storage';
		}
		return (
			<p>{institution.name} provides {quotaDescription} for {institution.email}</p>
		);
	}
}

class InstitutionalRow extends Component {
	render(){
		let institutions = this.props.institutions;
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

class StorageMeter extends Component {
	render(){
		let quota = this.props.quota;
		let quotaPercentage = this.props.quotaPercentage;
		if(quota == 1000000) {
			return null;
		}
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
		let group = this.props.group;
		let usage = this.props.usage;
		return (
			<p>{group.title} - {usage} MB</p>
		);
	}
}

class PaymentRow extends Component {
	render() {
		if(!this.props.defaultSource || !this.props.userSubscription.recur){
			let paymentButton = <button className="btn" onClick={this.props.updateCardHandler}>Enable Automatic Renewal</button>;

			let expiration = new Date(this.props.userSubscription.expirationDate * 1000);
			if(expiration < (Date.now() + (1000*60*60*24*15))) {
				//expiration less than 2 weeks away, charge card now
				paymentButton = <button className="btn" onClick={this.props.renewHandler}>Renew Now</button>;
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
		let card = this.props.defaultSource;
		return (
			<tr>
				<th>Payment Card</th>
				<td>
					<p><b>{card.brand} ****-****-****-{card.last4}</b></p>
					<p>
						Exp: <b>{card.exp_year}-{card.exp_month}</b>
						<button className="btn right" onClick={this.props.updateCardHandler}>Update Card</button>
					</p>
				</td>
			</tr>
		);
	}
}

class NextPaymentRow extends Component {
	render() {
		let userSubscription = this.props.userSubscription;
		let dateFormatOptions = {year: 'numeric', month: 'long', day: 'numeric'};
		let d = new Date(parseInt(userSubscription.expirationDate)*1000);
		let formattedExpirationDate = d.toLocaleDateString('en-US', dateFormatOptions);

		if(userSubscription.recur && d > Date.now()){
			return (
				<tr>
					<th>Next Payment</th>
					<td>
						<p>
							{formattedExpirationDate}
							<button className="btn right" onClick={this.props.cancelRecur}>Disable Autorenew</button>
						</p>
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
		let storageLevel = this.props.storageLevel;
		if(!storageLevel){
			return null;
		}

		let dateFormatOptions = {year: 'numeric', month: 'long', day: 'numeric'};
		let userSubscription = this.props.userSubscription;

		if(storageLevel == 1) {
			return (<tr><td colSpan='3'>New Expiration: Never</td></tr>);
		} else {
			let newExpiration = calculateNewExpiration(userSubscription.expirationDate, userSubscription.storageLevel, storageLevel);
			return (
				<tr>
					<td colSpan='3'>
						New Expiration: {newExpiration.toLocaleDateString('en-US', dateFormatOptions)}
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

		this.getSubscription = this.getSubscription.bind(this);
		this.getUserCustomer = this.getUserCustomer.bind(this);
		this.previewPlan = this.previewPlan.bind(this);
		this.unpreviewPlan = this.unpreviewPlan.bind(this);
		this.selectPlan = this.selectPlan.bind(this);
		this.renewNow = this.renewNow.bind(this);
		this.updateSubscription = this.updateSubscription.bind(this);
		this.chargeSubscription = this.chargeSubscription.bind(this);
		this.updatePayment = this.updatePayment.bind(this);
		this.cancelRecur = this.cancelRecur.bind(this);
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
	getSubscription() {
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
	getUserCustomer() {
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
	previewPlan(evt) {
		let storageLevel = evt.target.getAttribute('data-storagelevel');
		this.setState({previewStorageLevel:storageLevel});
	}
	unpreviewPlan() {
		this.setState({previewStorageLevel:null});
	}
	selectPlan(evt) {
		this.setState({operationPending:true});
		let storageLevel = evt.target.getAttribute('data-storagelevel');
		let userSubscription = this.state.userSubscription;

		log.debug(`select plan ${storageLevel}`);

		let planQuota = this.state.planQuotas[storageLevel];
		if(userSubscription.usage.total > planQuota) {
			this.setState({
				operationPending:false,
				notification:{
					type: 'error',
					message: 'Current usage exceeds plan quota.'
				}
			});
			return;
		}
		
		//charge the subscription if no current subscription, or expiration within 5 days
		let d = new Date(parseInt(userSubscription.expirationDate)*1000);
		if((!userSubscription.expirationDate) || (d < (Date.now() + (1000*60*60*24*5)) )) {
			//trigger stripe charge
			this.chargeSubscription(storageLevel);
		} else {
			//just update storage plan without charging
			this.updateSubscription(storageLevel);
		}
	}
	renewNow() {
		this.setState({operationPending:true});
		let userSubscription = this.state.userSubscription;
		let storageLevel = userSubscription.storageLevel;

		let planQuota = this.state.planQuotas[storageLevel];
		if(userSubscription.usage.total > planQuota) {
			this.setState({
				operationPending:false,
				notification: {
					type: 'error',
					message: 'Current usage exceeds plan quota.'
				}
			});
			return;
		}
		
		//get stripe and charge for the current storage level
		this.chargeSubscription(storageLevel);
	}
	updateSubscription(storageLevel=false) {
		if(storageLevel === false) {
			throw 'no storageLevel set for updateSubscription';
		}
		this.setState({operationPending:true});

		postFormData('/storage/updatesubscription', {storageLevel:storageLevel}).then((resp) => {
			log.debug(resp);
			//re-fetch full subscription info now that it's been updated
			this.getSubscription();
			this.setState({
				operationPending:false,
				notification: {
					type:'success',
					message: 'Success'
				}
			});
		}).catch((e) => {
			log.error(e);
			this.setState({
				operationPending:false,
				notification: {
					type: 'error',
					message: 'Error updating subscription. Please try again in a few minutes.'
				}
			});
		});
	}
	chargeSubscription(storageLevel=false) {
		if(storageLevel === false) {
			throw 'no storageLevel set for updateSubscription';
		}

		this.setState({operationPending:true});
		
		let descriptions = {
			2: '2 GB, 1 year',
			3: '6 GB, 1 year',
			6: 'Unlimited storage, 1 year'
		};

		let tokenHandler = (token) => {
			// You can access the token ID with `token.id`.
			// Get the token ID to your server-side code for use.
			log.debug(`charging stripe ajax. storageLevel:${storageLevel} - token.id:${token.id}`);
			postFormData('/storage/stripechargeajax', {
				stripeToken:token.id,
				recur:1,
				storageLevel:storageLevel
			}).then((resp) => {
				log.debug(resp);
				this.setState({
					operationPending:false,
					notification: {
						type: 'success',
						message: <span>Success. <a href='/settings/storage/invoice'>View Payment Receipt</a></span>
					}
				});
			}).catch((resp) => {
				log.debug(resp);
				this.setState({
					operationPending:false,
					notification: {
						type: 'error',
						message: 'Error updating subscription. Please try again in a few minutes.'
					}
				});
				resp.json().then((data)=>{
					if(data.stripeMessage){
						this.setState({
							operationPending:false,
							notification: {
								type: 'error',
								message: `There was an error processing your payment: ${data.stripeMessage}`
							}
						});
					}
				});
			}).then(()=>{
				this.getSubscription();
				this.getUserCustomer();
			});
		};
		
		let closedHandler = () => {
			this.setState({
				operationPending:false
			});
		};

		window.stripeHandler(descriptions[storageLevel], tokenHandler, closedHandler);
	}
	updatePayment() {
		let userSubscription = this.state.userSubscription;
		let storageLevel = userSubscription.storageLevel;

		let planQuota = this.state.planQuotas[storageLevel];
		if(userSubscription.usage.total > planQuota) {
			this.setState({
				operationPending:false,
				notification: {
					type: 'error',
					message: 'Current usage exceeds plan quota.'
				}
			});
			return;
		}

		this.setState({operationPending:true});
		let tokenHandler = (token) => {
			// You can access the token ID with `token.id`.
			// Get the token ID to your server-side code for use.
			log.debug(`updating stripe card - token.id:${token.id}`);
			postFormData('/storage/updatestripecard', {
				stripeToken:token.id
			}).then((resp) => {
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
		};

		let closedHandler = () => {
			this.setState({
				operationPending:false
			});
		};

		window.stripeHandler('', tokenHandler, closedHandler);
	}
	cancelRecur(){
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
	render() {
		window.StorageComponent = this;
		let reactInstance = this;
		if(this.state.userSubscription === null){
			return null;
		}
		let userSubscription = this.state.userSubscription;
		let groups = this.state.storageGroups;
		let dateFormatOptions = {year: 'numeric', month: 'long', day: 'numeric'};

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

		let quotaPercentage = parseFloat(userSubscription.usage.total) / parseFloat(userSubscription.quota) * 100.0;
		quotaPercentage = quotaPercentage.toFixed(1);

		let groupUsageNodes = [];
		for(let groupID in userSubscription.usage.groups){
			let usage = userSubscription.usage.groups[groupID];
			groupUsageNodes.push(<GroupUsage key={groupID} group={groups[groupID]} usage={usage} />);
		}

		let planRowNodes = plans.map(function(plan){
			return <StoragePlanRow key={plan.storageLevel} plan={plan} userSubscription={userSubscription} selectPlan={reactInstance.selectPlan} previewPlan={reactInstance.previewPlan} unpreviewPlan={reactInstance.unpreviewPlan} />;
		});

		let institutionalRow = <InstitutionalRow institutions={userSubscription.institutions} />;
		
		let planPreviewRow = <PreviewRow storageLevel={this.state.previewStorageLevel} userSubscription={userSubscription} />;
		
		let paymentRow = null;
		if(userSubscription.storageLevel != 1) {
			let defaultSource = null;
			if(this.state.stripeCustomer){
				defaultSource = this.state.stripeCustomer.default_source;
			}
			paymentRow = (<PaymentRow 
				defaultSource={defaultSource}
				userSubscription={userSubscription}
				updateCardHandler={this.updatePayment}
				renewHandler={this.renewNow}
			/>);
		}

		let nextPaymentRow = null;
		nextPaymentRow = <NextPaymentRow cancelRecur={this.cancelRecur} userSubscription={userSubscription} />;
		
		let modalSpinner = null;
		if(this.state.operationPending){
			modalSpinner = <div className='modal'><div className='modal-text'><p className='modal-text'>Updating...</p></div></div>;
		}

		return (
			<div className='storage-container'>
				{modalSpinner}
				<Notifier {...this.state.notification} />
				<div className='user-storage'>
					<div className='current-storage flex-section'>
						<div className='section-header'>
							<b>Current Plan</b>
						</div>
						<div className='section-body'>
							<table>
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
											<StorageMeter quota={userSubscription.quota} quotaPercentage={quotaPercentage} />
										</td>
									</tr>
									{paymentRow}
									{nextPaymentRow}
									{institutionalRow}
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
									{planPreviewRow}
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
