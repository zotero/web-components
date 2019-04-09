'use strict';

/*
Flows:
 - First time subscription (payment details, immediate charge)
 - update payment details (payment details)
 - renew now, expiration imminent (payment details, immediate charge)
 - force payment now (for multiple years?) (payment details, immediate charge)
 - Change current plan without immediate payment
 - change current plan and pay now (payment details, immediate charge)
 - Lab Payment (payment details, immediate charge)
 - Lab Renewal (payment details, immediate charge)
 - Lab receipt
 - allow payments for third parties (payment details, immediate charge)
 - Add users to lab?
*/

import {log as logger} from '../Log.js';
var log = logger.Logger('SubscriptionHandler');
log.setLevel(1);

import {useState, useContext} from 'react';
import PropTypes from 'prop-types';
import {StripeProvider} from 'react-stripe-elements';
import { Alert, Card, CardHeader, CardBody, FormGroup, Input, Modal, ModalBody, ModalHeader, Label, Row, Col, Button, Container } from 'reactstrap';

import {StorageDispatch} from './Storage.js';
import {refresh, cancelNewSubscription} from './actions.js';
import {imminentExpiration, calculateNewExpiration, priceCents} from './calculations.js';
import {CardPaymentModal} from './PaymentModal.jsx';
import {PaymentSource} from './PaymentSource.jsx';

import {postFormData} from '../ajax.js';
import {LoadingSpinner} from '../LoadingSpinner.js';

const dateFormatOptions = {year: 'numeric', month: 'long', day: 'numeric'};

const storageLevelDescriptions = {
	2: '2 GB',
	3: '6 GB',
	6: 'Unlimited storage'
};

/*
const IndividualDescriptions = {
	2: '2 GB, 1 year',
	3: '6 GB, 1 year',
	6: 'Unlimited storage, 1 year'
};
*/
const overQuota = function(storageLevel, userSubscription) {
	const planQuotas = window.zoteroData.planQuotas;
	let planQuota = planQuotas[storageLevel];
	if(userSubscription.usage.total > planQuota) {
		return true;
	}
	return false;
};

async function updateSubscription(storageLevel=false){
	if(storageLevel === false) {
		throw 'no storageLevel set for updateSubscription';
	}
	
	let resp;
	try {
		resp = await postFormData('/storage/updatesubscription', {storageLevel:storageLevel}, {withSession:true});
		log.debug(resp);
		if(resp.ok){
			return {type:'success', 'message':'Subscription updated'};
		} else {
			throw resp;
		}
	} catch(e) {
		log.error(e);
		return {type:'error', 'message':'Error updating subscription. Please try again in a few minutes.'};
	}
}
async function updatePayment(token){
	// You can access the token ID with `token.id`.
	// Get the token ID to your server-side code for use.
	log.debug(`updating stripe card - token.id:${token.id}`);
	try {
		let resp = await postFormData('/storage/updatestripecard', {stripeToken:token.id});
		log.debug(resp);
		if(resp.ok){
			return {type:'success', 'message':'Payment method updated'};
		} else {
			throw resp;
		}
	} catch(e) {
		log.error(e);
		return {type:'error', 'message':'Error updating payment method. Please try again in a few minutes.'};
	}
}
async function chargeSubscription(storageLevel=false, token=false){
	if(storageLevel === false) {
		throw 'no storageLevel set for chargeSubscription';
	}
	
	// You can access the token ID with `token.id`.
	// Get the token ID to your server-side code for use.
	log.debug(`charging stripe ajax. storageLevel:${storageLevel} - token.id:${token.id}`);
	log.debug(token);
	try{
		let data = {
			recur:1,
			storageLevel:storageLevel
		};
		if(token) {
			data.stripeToken = token.id;
		}
		let resp = await postFormData('/storage/stripechargeajax', data);
		
		log.debug(resp);
		if(resp.ok){
			return {type:'success', 'message':<span>Success. <a href='/settings/storage/invoice'>View Payment Receipt</a></span>};
		} else {
			throw resp;
		}
	} catch(resp) {
		log.error(resp);
		
		let data = await resp.json();
		if(data.stripeMessage){
			return {type:'error', 'message':`There was an error processing your payment: ${data.stripeMessage}`};
		} else {
			return {type:'error', 'message':'Error updating subscription. Please try again in a few minutes.'};
		}
		
	}
}

//component that handles a request for payment, presenting the PaymentModal and processing
//the payment or saving the customer for future use as necessary

//subscriptionChange describes the subscription the user is purchasing or switching to
//it must contain a type field
//type is one of: individualChange, individualUpdate, individualRenew, lab, institution

function SubscriptionHandler(props){
	const {subscriptionChange, renew} = props;
	const {type, storageLevel} = subscriptionChange;
	const {dispatch, userSubscription, stripeCustomer, storageNotify} = useContext(StorageDispatch);
	
	const cancel = () => {
		setOperationPending(false);
		dispatch(cancelNewSubscription());
	};
	let description = [];
	let chargeAmount = false;
	let error = null;
	//let paymentInfoRequired = false;
	let immediateChargeRequired = imminentExpiration(userSubscription.expirationDate);
	
	const [autorenew, setAutorenew] = useState(true);
	const [editPayment, setEditPayment] = useState((type == 'individualPaymentUpdate'));
	const [operationPending, setOperationPending] = useState(false);
	
	switch (type) {
		case 'individualChange':
			log.debug('individualChange');
			log.debug(userSubscription);
			description.push(`Change storage plan to ${storageLevelDescriptions[storageLevel]}`);
			if(immediateChargeRequired){
				log.debug('immediateCharge is requried');
				let newExp = calculateNewExpiration(userSubscription.expirationDate, userSubscription.storageLevel, storageLevel);
				description.push(`Expiring on ${newExp.toLocaleDateString('en-US', dateFormatOptions)}.`);
				description.push(`A charge will be made to your account once you confirm your order.`);
				chargeAmount = priceCents[storageLevel];
			} else {
				let oldExp = new Date(parseInt(userSubscription.expirationDate)*1000);
				let newExp = calculateNewExpiration(userSubscription.expirationDate, userSubscription.storageLevel, storageLevel);
				description.push(`Your current expiration date is ${oldExp.toLocaleDateString('en-US', dateFormatOptions)}.`);
				description.push(`Your new expiration date will be ${newExp.toLocaleDateString('en-US', dateFormatOptions)}.`);
				description.push(`A charge will not be made to your account until your new expiration date.`);
			}
			break;
		case 'individualPaymentUpdate':
			description.push(`Update your saved payment details for your next renewal. There will be no charge made until your expiration date.`);
			break;
		case 'individualRenew':
			description.push(`Renew your current ${storageLevelDescriptions[storageLevel]} subscription.`);
			description.push(`Your card or bank account will be charged immediately after confirming.`);
			chargeAmount = priceCents[storageLevel];
			immediateChargeRequired = true;
			break;
		case 'lab':
			//TODO
			break;
		case 'institution':
			//TODO
			break;
		default:
			throw 'Unknown subscriptionChange type';
	}
	if(type == 'individualChange' || type == 'individualRenew'){
		if(overQuota(storageLevel, userSubscription)){
			error = <Alert color='error'>Current usage exceeds the chosen plan&apos;s quota. You&apos;ll need to choose a larger storage plan, or delete some files from your Zotero storage.</Alert>;
		}
	}
	
	if(immediateChargeRequired && !stripeCustomer && !editPayment){
		setEditPayment(true);
	}
	
	let descriptionPs = description.map((d, i)=>{
		return <p key={i}>{d}</p>;
	});
	
	const handleConfirm = async (token) => {
		let result;
		setOperationPending(true);
		switch (type) {
			case 'individualChange':
				if(immediateChargeRequired){
					//charge the subscription now
					log.debug('immediate charge, chargeSubscription');
					log.debug(token);
					if(!token){
						throw 'Required token not passed';
					}
					result = await chargeSubscription(storageLevel, token);
					refresh(dispatch);
				} else {
					//update without charge
					result = await updateSubscription(storageLevel);
					refresh(dispatch);
				}
				storageNotify(result.type, result.message);
				cancel();
				break;
			case 'individualPaymentUpdate':
				if(!token){
					throw 'Required token not passed';
				}
				result = await updatePayment(token);
				refresh(dispatch);
				storageNotify(result.type, result.message);
				cancel();
				break;
			case 'individualRenew':
				//if token is present it will be used, otherwise existing customer will be charged
				log.debug('individualRenew, chargeSubscription');
				log.debug(token);
				result = await chargeSubscription(storageLevel, token);
				refresh(dispatch);
				storageNotify(result.type, result.message);
				cancel();
				break;
			case 'lab':
				
				break;
			case 'institution':
				
				break;
			default:
				throw 'Unknown subscriptionChange type';
		}
	};
	
	let blabel = immediateChargeRequired ? 'Purchase' : 'Confirm';
	
	let paymentSection = null;
	if(editPayment){
		paymentSection = (
			<StripeProvider apiKey={'pk_test_u8WpYkXuG2X155p0rC4YqkvO'}>
				<CardPaymentModal handleToken={handleConfirm} chargeAmount={chargeAmount} buttonLabel={blabel} />
			</StripeProvider>
		);
	} else if(stripeCustomer && immediateChargeRequired){
		const defaultSource = stripeCustomer.default_source;
		if(defaultSource){
			paymentSection = (
				<div className='currentPaymentSource'>
					<Card>
						<CardHeader>
							Payment Method
						</CardHeader>
						<CardBody>
							<PaymentSource source={defaultSource} />
							<Button color='link' onClick={()=>{setEditPayment(true);}}>Change Payment Details</Button>
						</CardBody>
					</Card>
					<Row className='mt-2'>
						<Col className='text-center'><Button className='m-auto' onClick={()=>{handleConfirm(false);}}>{blabel}</Button></Col>
						<Col className='text-center'><Button className='m-auto' onClick={cancel}>Cancel</Button></Col>
					</Row>
				</div>
			);
		}
	} else {
		paymentSection = (
			<Container>
				<Row>
					<Col className='text-center'><Button className='m-auto' onClick={handleConfirm}>{blabel}</Button></Col>
					<Col className='text-center'><Button className='m-auto' onClick={cancel}>Cancel</Button></Col>
				</Row>
			</Container>
		);
	}
	
	let renewSection = null;
	if(renew){
		renewSection = (
			<Card className='mt-4'>
				<CardBody>
					<FormGroup check>
						<Label check>
							<Input
								type="checkbox"
								checked={autorenew}
								onChange={(evt)=>{setAutorenew(evt.target.checked);}}
							/>{' '}
							Automatically renew
						</Label>
					</FormGroup>
				</CardBody>
			</Card>
		);
	}

	return (
		<div className='subscription-handler'>
			<Modal isOpen={true} toggle={cancel} className='payment-modal'>
				<ModalHeader>Manage Subscription</ModalHeader>
				<ModalBody>
					<LoadingSpinner className='m-auto' loading={operationPending} />
					<Card className='mb-4'>
						<CardBody>
							{error}
							{descriptionPs}
						</CardBody>
					</Card>
					{paymentSection}
					{renewSection}
				</ModalBody>
			</Modal>
		</div>
	);
}

SubscriptionHandler.propTypes = {
	subscriptionChange: PropTypes.shape({
		type: PropTypes.string.isRequired,
		storageLevel: PropTypes.number
	}).isRequired,
	renew: PropTypes.bool,
	requestedStorageLevel: PropTypes.number,
	labUsers: PropTypes.number
};

export default SubscriptionHandler;
