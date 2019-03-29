'use strict';

/*
TODO:
 - clean up
 - clarify when institutional plan makes individual plan unnecessary
 x clarify when charge won't be made right away, allow to force immediate charge
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

import {log as logger} from '../Log.js';
const log = logger.Logger('StorageComponent');

import {useReducer, useEffect} from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Progress, Button } from 'reactstrap';

import {ajax, postFormData} from '../ajax.js';
import {Notifier} from '../Notifier.js';
import SubscriptionHandler from './SubscriptionHandler.jsx';
import {PaymentSource} from './PaymentSource.jsx';

const dateFormatOptions = {year: 'numeric', month: 'long', day: 'numeric'};

const plans = [
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

function StoragePlanRow(props) {
	const {plan, userSubscription, dispatch} = props;
	const current = plan.storageLevel == userSubscription.storageLevel;
	let button = (
		<Button onClick={()=>{dispatch(selectPlan(plan));}}>Select Plan</Button>
	);
	
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

function InstitutionProvides(props) {
	const {institution} = props;
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
InstitutionProvides.propTypes = {
	institution: PropTypes.shape({
		storageQuota: PropTypes.number,
		validated: PropTypes.string,
		name: PropTypes.string,
		email: PropTypes.string
	})
};

function InstitutionalRow(props) {
	const {institutions} = props;
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
InstitutionalRow.propTypes = {
	institutions: PropTypes.arrayOf(PropTypes.object)
};

function StorageMeter(props) {
	const {userSubscription} = props;

	let quota = userSubscription.quota;
	if(quota == 1000000) {
		return null;
	}

	let quotaPercentage = parseFloat(userSubscription.usage.total) / parseFloat(quota) * 100.0;
	quotaPercentage = quotaPercentage.toFixed(1);

	let color;
	switch(true){
		case (quotaPercentage < 40):
			color = 'success';
			break;
		case (quotaPercentage < 70):
			color = 'warning';
			break;
		case (quotaPercentage >= 70):
			color = 'danger';
			break;
		default:
			color = 'success';
	}

	return (
		<div>
			<div className="text-center">{quotaPercentage}%</div>
			<Progress value={quotaPercentage} max='100' color={color} />
		</div>
	);
}

function GroupUsage(props) {
	const {group, usage} = props;
	return (
		<p>{group.title} - {usage} MB</p>
	);
}
GroupUsage.propTypes = {
	group: PropTypes.shape({
		title: PropTypes.string
	}),
	usage: PropTypes.number
};

function PaymentRow(props) {
	const {defaultSource, userSubscription, updateCardHandler, renewHandler} = props;

	if(!defaultSource || !userSubscription.recur){
		let paymentButton = <Button color='secondary' onClick={updateCardHandler}>Enable Automatic Renewal</Button>;

		let expiration = new Date(userSubscription.expirationDate * 1000);
		if(expiration < (Date.now() + (1000*60*60*24*15))) {
			//expiration less than 2 weeks away, charge card now
			paymentButton = <Button color='secondary' onClick={renewHandler}>Renew Now</Button>;
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
						<Button color='secondary' size='small' onClick={updateCardHandler}>Update Payment</Button>
					</Col>
					<Col>
						<Button color='secondary' size='small' onClick={renewHandler}>Renew Now</Button>
					</Col>
				</Row>
			</td>
		</tr>
	);
}
PaymentRow.propTypes = {
	defaultSource: PropTypes.object,
	userSubscription: PropTypes.object.isRequired,
	updateCardHandler: PropTypes.func.isRequired,
	renewHandler: PropTypes.func.isRequired
};

function NextPaymentRow(props) {
	const {userSubscription, cancelRecur} = props;
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
							<Button color='secondary' size='small' onClick={cancelRecur}>Disable Autorenew</Button>
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
/*
function PreviewRow(props) {
	const {storageLevel, userSubscription} = props;
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
*/
const UPDATE_USER_SUBSCRIPTION = 'updateUserSubscription';
const NOTIFY = 'notify';
const UPDATE_CUSTOMER = 'updateCustomer';
const PREVIEW_STORAGE = 'previewStorage';
const NEW_SUBSCRIPTION = 'newSubscription';
const CHANGE_SUBSCRIPTION = 'changeSubscription';
const START_OPERATION = 'startOperation';
const STOP_OPERATION = 'stopOperation';

function storageReducer(state, action){
	log.debug(action);
	switch(action.type){
		case UPDATE_USER_SUBSCRIPTION:
			return Object.assign({}, state, {
				userSubscription:action.userSubscription,
				storageGroups: action.storageGroups,
				planQuotas: action.planQuotas
			});
		case UPDATE_CUSTOMER:
			return Object.assign({}, state, {
				stripeCustomer: action.stripeCustomer
			});
		case NOTIFY:
			return Object.assign({}, state, {notification:{
				type: action.notificationType,
				message: action.message
			}});
		case PREVIEW_STORAGE:
			return Object.assign({}, state, {
				previewStorageLevel:action.storageLevel
			});
		case NEW_SUBSCRIPTION:
			return Object.assign({}, state, {
				subscriptionChange:action.subscriptionChange
			});
		case CHANGE_SUBSCRIPTION:
			return Object.assign({}, state, {
				subscriptionChange:{
					type:'individualChange',
					storageLevel: action.storageLevel
				}
			});
		case START_OPERATION:
			return Object.assign({}, state, {operationPending:true});
		case STOP_OPERATION:
			return Object.assign({}, state, {operationPending:false});
		default:
			return state;
	}
}

function getSubscription(dispatch){
	log.debug('getSubscription');
	ajax({url:'/storage/usersubscription'}).then((resp) => {
		log.debug(resp);
		resp.json().then((data) => {
			dispatch({
				type:UPDATE_USER_SUBSCRIPTION,
				userSubscription: data.userSubscription,
				storageGroups:data.storageGroups,
				planQuotas: data.planQuotas
			});
		});
	}).catch((e)=>{
		log.debug('Error retrieving subscription data');
		log.debug(e);
		dispatch(notify('error', 'There was an error retrieving your subscription data'));
	});
}
function getUserCustomer(dispatch){
	log.debug('getUserCustomer');
	ajax({url:'/storage/getusercustomer'}).then((resp) => {
		log.debug(resp);
		resp.json().then((data) => {
			dispatch({type:UPDATE_CUSTOMER, stripeCustomer: data});
		});
	}).catch((e)=>{
		log.debug('Error retrieving customer data');
		log.debug(e);
		dispatch(notify('error', 'There was an error retrieving your subscription data'));
	});
}
function cancelRecur(dispatch){
	dispatch({type:START_OPERATION});

	postFormData('/storage/cancelautorenew').then((resp) => {
		log.debug(resp);
		dispatch(notify('success', 'Success'));
		dispatch({type:STOP_OPERATION});
	}).catch((resp) => {
		log.debug(resp);
		dispatch(notify('error', 'Error updating payment method. Please try again in a few minutes.'));
		dispatch({type:STOP_OPERATION});
	}).then(()=>{
		refresh(dispatch);
	});
}
function refresh(dispatch){
	getSubscription(dispatch);
	getUserCustomer(dispatch);
}
/*
function previewPlan(plan){
	return {type:PREVIEW_STORAGE, storageLevel:plan.storageLevel};
}
function unpreviewPlan(){
	return {type:PREVIEW_STORAGE, storageLevel:null};
}
*/
function selectPlan(plan){
	return {
		type:CHANGE_SUBSCRIPTION,
		storageLevel: plan.storageLevel
	};
}
function notify(type, message){
	return {
		type:NOTIFY,
		notificationType:type,
		message
	};
}
function renewNow(userSubscription){
	const storageLevel = userSubscription.storageLevel;
	return {
		type:NEW_SUBSCRIPTION,
		subscriptionChange:{
			type:'individualRenew',
			storageLevel
		}
	};
}
function updatePayment(){
	return {
		type:NEW_SUBSCRIPTION,
		subscriptionChange:{
			type:'individualPaymentUpdate'
		}
	};
}
function cancelNewSubscription(){
	return {
		type:NEW_SUBSCRIPTION,
		subscriptionChange:false
	};
}

function Storage(props){
	const [state, dispatch] = useReducer(storageReducer, {
		userSubscription:props.userSubscription,
		storageGroups:[],
		planQuotas:{},
		stripeCustomer:props.stripeCustomer,
		operationPending:false,
		notification:null
	});
	
	const {userSubscription, storageGroups, stripeCustomer, operationPending, notification, subscriptionChange} = state;
	
	useEffect(
		()=>{
			if(!props.userSubscription){
				getSubscription(dispatch);
			}
			if(!props.stripeCustomer){
				getUserCustomer(dispatch);
			}
			/*
			if((typeof(window.zoteroData.userSubscription) !== 'undefined') && (typeof(window.zoteroData.stripeCustomer) !== 'undefined')){
				//don't load new data if it's already been loaded serverside and included with the page
				//instead just set the state with it
				dispatch({
					type:UPDATE_USER_SUBSCRIPTION,
					userSubscription: window.zoteroData.userSubscription,
					storageGroups:window.zoteroData.storageGroups,
					planQuotas: window.zoteroData.planQuotas
				});
				dispatch({
					type:UPDATE_CUSTOMER,
					stripeCustomer: window.zoteroData.stripeCustomer
				});
			} else {
				getSubscription(dispatch);
				getUserCustomer(dispatch);
			}
			*/
		},
		[props.userSubscription, props.stripeCustomer]
	);
	
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
				<p>Your Zotero storage subscription will expire {d.toLocaleDateString('en-US', numDateFormatOptions)} if you don&apos;t renew before then.</p>
			</td>);
		}
	}

	let quotaDescription = userSubscription.quota + ' MB';
	if(userSubscription.quota == 1000000) {
		quotaDescription = 'Unlimited';
	}

	let groupUsageNodes = [];
	for(let groupID in userSubscription.usage.groups){
		let usage = parseInt(userSubscription.usage.groups[groupID]);
		groupUsageNodes.push(<GroupUsage key={groupID} group={storageGroups[groupID]} usage={usage} />);
	}

	let planRowNodes = plans.map((plan)=>{
		return <StoragePlanRow key={plan.storageLevel} plan={plan} userSubscription={userSubscription} dispatch={dispatch} />;
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
			updateCardHandler={()=>{dispatch(updatePayment());}}
			renewHandler={()=>{dispatch(renewNow(userSubscription));}}
		/>);
	}
	
	let Payment = null;
	if(subscriptionChange){
		Payment = (<SubscriptionHandler
			subscriptionChange={subscriptionChange}
			userSubscription={userSubscription}
			stripeCustomer={stripeCustomer}
			refreshStorage={()=>{refresh(dispatch);}}
			doneNotification={(type, message)=>{dispatch(notify(type, message));}}
			onClose={()=>{dispatch(cancelNewSubscription());}}
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
								<NextPaymentRow cancelRecur={()=>{cancelRecur(dispatch);}} userSubscription={userSubscription} />
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
								{/* <PreviewRow storageLevel={previewStorageLevel} userSubscription={userSubscription} /> */}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

export {Storage};
