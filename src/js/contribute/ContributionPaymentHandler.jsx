'use strict';

import {log as logger} from '../Log.js';
var log = logger.Logger('SubscriptionHandler', 1);

import {useState, useContext} from 'react';
import PropTypes from 'prop-types';
import {StripeProvider} from 'react-stripe-elements';
import { Card, CardHeader, CardBody, FormGroup, Input, Modal, ModalBody, ModalHeader, Label, Row, Col, Button, Container } from 'reactstrap';

import {CardPaymentModal} from '../storage/PaymentModal.jsx';
import {PaymentSource} from '../storage/PaymentSource.jsx';
import {PaymentContext, NotifierContext, notify, cancelPurchase} from '../storage/actions';

import {postFormData} from '../ajax.js';
import {buildUrl} from '../wwwroutes.js';
import {LoadingSpinner} from '../LoadingSpinner.js';


import { formatCurrency } from '../Utils.js';

const stripePublishableKey = window.zoteroData && window.zoteroData.stripePublishableKey ? window.zoteroData.stripePublishableKey : '';

async function chargeContribution(token=false, amount, userID){
	log.debug(`charging stripe contribution. Amount:${amount} - token.id:${token.id}`);
	let resp;
	try{
		let args = {
			subscriptionType:'contribution',
			stripeToken:token.id,
		};
		resp = await postFormData('/storage/stripechargecontribution', args);

		log.debug(resp);
		if(!resp.ok){
			throw resp;
		}
		let respData = await resp.json();
		log.debug(respData);
		if(respData.success){
			return {
				type:'success',
				message: <p>Success. Thank you for supporting Zotero</p>
			};
		} else {
			return {
				type: 'error',
				message: <p>There was an error processing your payment</p>
			};
		}
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

function ContributionPaymentHandler(props){
	const {purchase} = props;
	const {type, amount} = purchase;
	const {paymentDispatch, paymentState} = useContext(PaymentContext);
	const {notifyDispatch} = useContext(NotifierContext);
	
	const {stripeCustomer} = paymentState;
	
	//clear the new subscription closing the Handler, because it is either complete, or canceled
	const cancel = () => {
		setOperationPending(false);
		paymentDispatch(cancelPurchase());
	};
	
	let description = [];
	let chargeAmount = amount;
	let error = null;
	let immediateChargeRequired = true;
	
	const [editPayment, setEditPayment] = useState((type == 'individualPaymentUpdate'));
	const [operationPending, setOperationPending] = useState(false);
	
	switch (type) {
		case 'paymentUpdate':
			description.push(`Update your saved payment details for your next renewal. There will be no charge made until your expiration date.`);
			break;
		case 'contribution':
			description.push(`Make a one time contribution to support Zotero.`);
			description.push(`Your card or bank account will be charged immediately after confirming.`);
			immediateChargeRequired = true;
			break;
		case 'recurringContribution':
			description.push(`Make a recurring contribution to support Zotero.`);
			description.push(`Your card or bank account will be charged immediately after confirming.`);
			immediateChargeRequired = true;
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
			*/
			case 'contribution':
				result = await chargeContribution(token, amount);
				notifyDispatch(notify(result.type, result.message));
				cancel();
				break;
			case 'recurringContribution':
				//TODO
				break;
			default:
				throw 'Unknown purchase type';
		}
	};
	
	let blabel = immediateChargeRequired ? `Pay ${formatCurrency(chargeAmount)}` : 'Confirm';
	
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
				</ModalBody>
			</Modal>
		</div>
	);
}

ContributionPaymentHandler.propTypes = {
	purchase: PropTypes.shape({
		type: PropTypes.string.isRequired,
		amount: PropTypes.number
	}).isRequired,
	renew: PropTypes.bool,
};

export {ContributionPaymentHandler};
