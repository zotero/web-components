'use strict';

import {log as logger} from '../Log.js';
var log = logger.Logger('SubscriptionHandler', 1);

import {useState, useContext} from 'react';
import PropTypes from 'prop-types';
import {StripeProvider} from 'react-stripe-elements';
import { Card, CardHeader, CardBody, FormGroup, Input, Modal, ModalBody, ModalHeader, Label, Row, Col, Button, Container } from 'reactstrap';

import {labPrice, labUserPrice} from './calculations.js';
import {CardPaymentModal} from './PaymentModal.jsx';
import {PaymentSource} from './PaymentSource.jsx';

import {postFormData} from '../ajax.js';
import {buildUrl} from '../wwwroutes.js';
import {LoadingSpinner} from '../LoadingSpinner.js';

import {PaymentContext, NotifierContext, notify} from './actions.js';
import {cancelPurchase} from './actions.js';

const stripePublishableKey = window.zoteroData && window.zoteroData.stripePublishableKey ? window.zoteroData.stripePublishableKey : '';
//const dateFormatOptions = {year: 'numeric', month: 'long', day: 'numeric'};

async function chargeLabSubscription(token=false, fte=false, name='', institutionID=false){
	// You can access the token ID with `token.id`.
	// Get the token ID to your server-side code for use.
	log.debug(`charging stripe lab. FTE:${fte} - token.id:${token.id}`);
	let resp;
	try{
		let args = {
			subscriptionType:'lab',
			stripeToken:token.id,
			userCount:fte,
			institutionName:name
		};
		if(institutionID){
			args['institutionID'] = institutionID;
		}
		resp = await postFormData('/storage/stripechargelabajax', args);

		log.debug(resp);
		if(!resp.ok){
			throw resp;
		}
		let respData = await resp.json();
		log.debug(respData);
		let manageUrl = buildUrl('manageInstitution', {institutionID:respData.institutionID});
		return {
			type: 'success',
			message: (<p>Success. You can now <a href={manageUrl}>manage your Zotero Lab subscription</a></p>)
		};
	} catch(resp) {
		log.debug(resp);
		let respData = await resp.json();
		if(respData.stripeMessage){
			return {type:'error', 'message':`There was an error processing your payment: ${respData.stripeMessage}`};
		} else {
			return {
				type: 'error',
				message: 'There was an error updating your subscription. Please try again in a few minutes. If you continue to experience problems, email storage@zotero.org for assistance.'
			};
		}
	}
}

function InstitutionHandler(props){
	const {purchase, renew} = props;
	const {type, fte, name} = purchase;
	const {paymentDispatch, paymentState} = useContext(PaymentContext);
	const {notifyDispatch} = useContext(NotifierContext);
	
	const {stripeCustomer} = paymentState;
	
	//clear the new subscription closing the Handler, because it is either complete, or canceled
	const cancel = () => {
		setOperationPending(false);
		paymentDispatch(cancelPurchase());
	};
	
	let description = [];
	let chargeAmount = false;
	let error = null;
	let immediateChargeRequired = true;
	
	const [autorenew, setAutorenew] = useState(true);
	const [editPayment, setEditPayment] = useState((type == 'individualPaymentUpdate'));
	const [operationPending, setOperationPending] = useState(false);
	
	switch (type) {
		/*
		case 'paymentUpdate':
			description.push(`Update your saved payment details for your next renewal. There will be no charge made until your expiration date.`);
			break;
		case 'labRenew':
			description.push(`Renew your current ${storageLevelDescriptions[storageLevel]} subscription.`);
			description.push(`Your card or bank account will be charged immediately after confirming.`);
			chargeAmount = priceCents[storageLevel];
			immediateChargeRequired = true;
			break;
		*/
		case 'lab':
			description.push(`Purchase 1 year of Zotero Lab for ${fte} users.`);
			description.push(`Lab Name: ${name}`);
			chargeAmount = labPrice(fte);
			immediateChargeRequired = true;
			break;
		case 'addLabUsers':
			description.push(`Purchase ${fte} additional Lab users for '${name}'`);
			chargeAmount = labUserPrice(fte);
			immediateChargeRequired = true;
			break;
		case 'institution':
			//TODO
			break;
		default:
			throw 'Unknown purchase type';
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
			/*
			case 'paymentUpdate':
				if(!token){
					throw 'Required token not passed';
				}
				result = await updatePayment(token);
				notify(result.type, result.message);
				cancel();
				break;
			case 'labRenew':
				break;
			*/
			case 'lab':
				result = await chargeLabSubscription(token, fte, name, false);
				notifyDispatch(notify(result.type, result.message));
				cancel();
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
			<StripeProvider apiKey={stripePublishableKey}>
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
				<ModalHeader>Institution Subscription</ModalHeader>
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

InstitutionHandler.propTypes = {
	purchase: PropTypes.shape({
		type: PropTypes.string.isRequired,
		fte: PropTypes.number
	}).isRequired,
	renew: PropTypes.bool,
};

export {InstitutionHandler};
