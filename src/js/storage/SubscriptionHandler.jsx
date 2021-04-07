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

import { log as logger } from '../Log.js';
var log = logger.Logger('SubscriptionHandler', 1);

import { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { Alert, Card, CardHeader, CardBody, FormGroup, Input, Modal, ModalBody, ModalHeader, Label, Row, Col, Button, Container } from 'reactstrap';

import { StorageContext, PaymentContext, NotifierContext, refresh, cancelPurchase, notify, immediateCharge } from './actions.js';
import { imminentExpiration, calculateNewExpiration, priceCents } from './calculations.js';
import { CardPaymentModal, MultiPaymentModal } from './PaymentModal.jsx';
import { PaymentSource } from './PaymentSource.jsx';

import { postFormData, ajax } from '../ajax.js';
import { LoadingSpinner } from '../LoadingSpinner.js';
import { formatCurrency } from '../Utils.js';

const dateFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

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
const overQuota = function (storageLevel, userSubscription) {
	const planQuotas = window.zoteroData.planQuotas;
	let planQuota = planQuotas[storageLevel];
	if (userSubscription.usage.total > planQuota) {
		return true;
	}
	return false;
};

/*
async function updateSubscription(storageLevel = false) {
	if (storageLevel === false) {
		throw new Error('no storageLevel set for updateSubscription');
	}
	
	let resp;
	try {
		resp = await postFormData('/storage/updatesubscription', { storageLevel: storageLevel }, { withSession: true });
		log.debug(resp, 4);
		if (resp.ok) {
			return { type: 'success', message: 'Subscription updated' };
		} else {
			throw resp;
		}
	} catch (e) {
		log.error(e);
		return { type: 'error', message: 'Error updating subscription. Please try again in a few minutes.' };
	}
}
async function updatePayment(token) {
	// You can access the token ID with `token.id`.
	// Get the token ID to your server-side code for use.
	log.debug(`updating stripe card - token.id:${token.id}`, 4);
	try {
		let resp = await postFormData('/storage/updatestripecard', { stripeToken: token.id });
		log.debug(resp, 4);
		if (resp.ok) {
			return { type: 'success', message: 'Payment method updated' };
		} else {
			throw resp;
		}
	} catch (e) {
		log.error(e);
		return { type: 'error', message: 'Error updating payment method. Please try again in a few minutes.' };
	}
}
async function chargeSubscription(storageLevel = false, token = false) {
	if (storageLevel === false) {
		throw new Error('no storageLevel set for chargeSubscription');
	}
	
	// You can access the token ID with `token.id`.
	// Get the token ID to your server-side code for use.
	log.debug(`charging stripe ajax. storageLevel:${storageLevel} - token.id:${token.id}`, 4);
	log.debug(token, 4);
	try {
		let data = {
			recur: 1,
			storageLevel: storageLevel
		};
		if (token) {
			data.stripeToken = token.id;
		}
		let resp = await postFormData('/storage/stripechargeajax', data);
		let respData = await resp.json();
		let chargeID = respData.chargeID;
		log.debug(resp, 4);
		if (resp.ok) {
			return { type: 'success', message: <span>Success. <a href={`/settings/storage/invoice?chargeID=${chargeID}`}>View Payment Receipt</a></span> };
		} else {
			throw resp;
		}
	} catch (resp) {
		log.error(resp);
		
		let data = await resp.json();
		if (data.stripeMessage) {
			return { type: 'error', message: `There was an error processing your payment: ${data.stripeMessage}` };
		} else {
			return { type: 'error', message: 'Error updating subscription. Please try again in a few minutes.' };
		}
	}
}
*/

async function createInvoice(storageLevel = false) {
	if (storageLevel === false) {
		throw new Error('no storageLevel set for createInvoice');
	}
	
	let resp;
	try {
		resp = await postFormData('/settings/storage/createinvoice', { type: 'individual', storageLevel: storageLevel }, { withSession: true });
		if (resp.ok) {
			const respData = await resp.json();
			const { invoiceID } = respData;
			return { type: 'success', message: <span>Invoice created. <a href={`/storage/invoice/${invoiceID}`}>View Invoice</a></span> };
		} else {
			throw resp;
		}
	} catch (e) {
		log.error(e);
		return { type: 'error', message: 'Error creating invoice. Please try again in a few minutes.' };
	}
}

// component that handles a request for payment, presenting the PaymentModal and processing
// the payment or saving the customer for future use as necessary

// purchase describes the subscription the user is purchasing or switching to
// it must contain a type field
// type is one of: individualChange, individualUpdate, individualRenew

function SubscriptionHandler(props) {
	const { purchase, renew } = props;
	const { type, storageLevel } = purchase;
	const { storageDispatch, storageState } = useContext(StorageContext);
	const { notifyDispatch } = useContext(NotifierContext);
	const { paymentDispatch, paymentState } = useContext(PaymentContext);
	
	const { userSubscription } = storageState;
	const { stripeCustomer, paymentIntent } = paymentState;
	log.debug(stripeCustomer, 4);
	// clear the new subscription closing the Handler, because it is either complete, or canceled
	const cancel = () => {
		setOperationPending(false);
		paymentDispatch(cancelPurchase());
	};
	
	let description = [];
	let chargeAmount = 0;
	let error = null;
	// let paymentInfoRequired = false;
	let immediateChargeRequired = imminentExpiration(userSubscription.expirationDate);
	let invoicePossible = false;
	
	const [autorenew, setAutorenew] = useState(true);
	const [editPayment, setEditPayment] = useState((type == 'individualPaymentUpdate'));
	const [operationPending, setOperationPending] = useState(false);
	
	switch (type) {
	case 'individualChange':
		log.debug('individualChange', 4);
		log.debug(userSubscription, 4);
		description.push(`Change storage plan to ${storageLevelDescriptions[storageLevel]}`);
		if (immediateChargeRequired) {
			log.debug('immediateCharge is requried', 4);
			let newExp = calculateNewExpiration(userSubscription.expirationDate, userSubscription.storageLevel, storageLevel);
			description.push(`Expiring on ${newExp.toLocaleDateString('en-US', dateFormatOptions)}.`);
			description.push(`A charge will be made to your account once you confirm your order.`);
			chargeAmount = priceCents[storageLevel];
			invoicePossible = true;
		} else {
			let oldExp = new Date(parseInt(userSubscription.expirationDate) * 1000);
			let newExp = calculateNewExpiration(userSubscription.expirationDate, userSubscription.storageLevel, storageLevel);
			description.push(`Your current expiration date is ${oldExp.toLocaleDateString('en-US', dateFormatOptions)}.`);
			description.push(`The time left on your current subscription will be applied to your new subscription. Your new expiration date will be ${newExp.toLocaleDateString('en-US', dateFormatOptions)}.`);
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
		invoicePossible = true;
		break;
	default:
		throw new Error('Unknown purchase type');
	}
	if (type == 'individualChange' || type == 'individualRenew') {
		if (overQuota(storageLevel, userSubscription)) {
			error = <Alert color='error'>Current usage exceeds the chosen plan&apos;s quota. You&apos;ll need to choose a larger storage plan, or delete some files from your Zotero storage.</Alert>;
			description = [];
		}
	}
	
	log.debug(`immediateChargeRequired: ${immediateChargeRequired}`);
	log.debug(stripeCustomer);
	let havePaymentMethod = false;
	if (stripeCustomer && stripeCustomer.deleted !== true) {
		if (stripeCustomer.default_source !== null || stripeCustomer.invoice_settings.default_payment_method !== null) {
			havePaymentMethod = true;
		}
	}
	// (stripeCustomer && (stripeCustomer.deleted !== true) && (stripeCustomer.default_source !== null || stripeCustomer.invoice_settings.default_payment_method !== null));
	if (immediateChargeRequired && !havePaymentMethod && !editPayment) {
		setEditPayment(true);
	}

	// update payment with immediateChargeRequired
	useEffect(() => {
		if (immediateChargeRequired) {
			paymentDispatch(immediateCharge(immediateChargeRequired));
		}
	}, []);

	/*
	useEffect(() => {
		// begin payment intent
		if (immediateChargeRequired) {
			let chargeDescription = storageLevelDescriptions[storageLevel];
			beginPaymentIntent(paymentDispatch, chargeAmount, chargeDescription);
		}
	}, [immediateChargeRequired, chargeAmount]);
	*/
	let descriptionPs = description.map((d, i) => {
		return <p key={i}>{d}</p>;
	});
	
	const handleConfirm = async (paymentMethod) => {
		log.debug('handleConfirm');
		log.debug(paymentMethod);
		if (operationPending) {
			log.debug('operation already pending');
			return;
		}
		let response;
		let result;
		setOperationPending(true);
		let purchaseData = Object.assign({}, purchase, { paymentMethod: paymentMethod.id, paymentMethodType: paymentMethod.type });
		log.debug(purchaseData);
		try {
			response = await ajax({
				type: 'POST',
				withSession: true,
				url: '/storage/purchase',
				data: JSON.stringify(purchaseData),
				throwOnError: false,
			});
		} catch (unexpectedThrownResponse) {
			log.error("UNEXPECTED THROWN RESPONSE WHEN ATTEMPTING PURCHASE");
		} finally {
			log.debug('got response from handleConfirm');
			result = await response.json();
			log.debug(result);
			let notifyType = result.success ? 'success' : 'error';
			let notifyMessage = result.message;

			if (!result.success && result.requires_action) {
				const stripe = window.stripe;
				let confirmResult;
				if (paymentMethod.type == 'card') {
					confirmResult = await stripe.confirmCardPayment(result.client_secret);
				} else if (paymentMethod.type == 'sepa_debit') {
					confirmResult = await stripe.confirmSepaDebitPayment(result.client_secret);
				}
				log.debug(confirmResult);
				if (confirmResult.error) {
					log.debug('confirmResult error');
					notifyType = 'error';
				} else if (confirmResult.paymentIntent) {
					log.debug('confirmResult paymentIntent');
					// resumbmit the purchase with the paymentIntent so the subscription gets updated
					let resubPurchaseData = Object.assign({}, purchaseData, { paymentIntentID: confirmResult.paymentIntent.id });
					response = await ajax({
						type: 'POST',
						withSession: true,
						url: '/storage/purchase',
						data: JSON.stringify(resubPurchaseData),
						throwOnError: false,
					});
					log.debug('got response from resubmitted handleConfirm');
					result = await response.json();
					log.debug(result);
					notifyType = result.success ? 'success' : 'error';
					notifyMessage = result.message;
				}
			}

			refresh(storageDispatch, paymentDispatch);
			notifyDispatch(notify(notifyType, notifyMessage));
			cancel();
		}
	};
	
	const handleInvoiceRequest = async (evt) => {
		evt.preventDefault();
		setOperationPending(true);
		let result = await createInvoice(storageLevel);
		notifyDispatch(notify(result.type, result.message));
		cancel();
	};
	
	let blabel = immediateChargeRequired ? `Pay ${formatCurrency(chargeAmount)}` : 'Confirm';
	
	let paymentSection = null;
	if (editPayment) {
		/*
		paymentSection = <CardPaymentModal
			stripe={window.stripe}
			{...{ immediateChargeRequired, handleConfirm, paymentIntent, chargeAmount, setOperationPending }}
			chargeDescription={storageLevel ? storageLevelDescriptions[storageLevel] : "Update payment method"}
			buttonLabel={blabel}
		/>;
		*/
		
		paymentSection = <MultiPaymentModal
			stripe={window.stripe}
			{...{ immediateChargeRequired, handleConfirm, paymentIntent, chargeAmount, setOperationPending }}
			chargeDescription={storageLevel ? storageLevelDescriptions[storageLevel] : "Update payment method"}
			buttonLabel={blabel}
		/>;
		
		// paymentSection = <MultiPaymentModal stripe={window.stripe} handleToken={handleConfirm} paymentIntent={paymentIntent} chargeAmount={chargeAmount} buttonLabel={blabel} />;
	} else if (stripeCustomer && immediateChargeRequired) {
		const defaultSource = stripeCustomer.default_source || stripeCustomer.invoice_settings.default_payment_method;
		if (defaultSource) {
			paymentSection = (
				<div className='currentPaymentSource'>
					<Card>
						<CardHeader>
							Payment Method
						</CardHeader>
						<CardBody>
							<PaymentSource source={defaultSource} />
							<Button color='link' onClick={() => { setEditPayment(true); }}>Change Payment Details</Button>
						</CardBody>
					</Card>
					<Row className='mt-2'>
						<Col className='text-center'><Button className='m-auto' onClick={() => { handleConfirm(false); }}>{blabel}</Button></Col>
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
	if (renew) {
		renewSection = (
			<Card className='mt-4'>
				<CardBody>
					<FormGroup check>
						<Label check>
							<Input
								type='checkbox'
								checked={autorenew}
								onChange={(evt) => { setAutorenew(evt.target.checked); }}
							/>{' '}
							Automatically renew
						</Label>
					</FormGroup>
				</CardBody>
			</Card>
		);
	}
	
	let invoiceSection = null;
	if (invoicePossible) {
		invoiceSection = (
			<Container className='mt-4'>
				<Row>
					<Col className='text-center'>
						<p><a href='#' onClick={handleInvoiceRequest}>Create invoice payable by third party</a></p>
					</Col>
				</Row>
			</Container>
		);
	}

	if (error !== null) {
		paymentSection = null;
		invoiceSection = null;
		renewSection = null;
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
					{invoiceSection}
					{renewSection}
				</ModalBody>
			</Modal>
		</div>
	);
}

SubscriptionHandler.propTypes = {
	purchase: PropTypes.shape({
		type: PropTypes.string.isRequired,
		storageLevel: PropTypes.number
	}).isRequired,
	renew: PropTypes.bool,
	requestedStorageLevel: PropTypes.number,
	labUsers: PropTypes.number
};

export { SubscriptionHandler };
