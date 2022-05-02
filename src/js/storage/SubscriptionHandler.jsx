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
var log = logger.Logger('SubscriptionHandler');

import { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { Alert, Card, CardHeader, CardBody, FormGroup, Input, Modal, ModalBody, ModalHeader, Label, Row, Col, Button, Container } from 'reactstrap';

import { beginStripeIntent, chargeDefaultMethod, createInvoice, StorageContext, PaymentContext, refresh, cancelPurchase, immediateCharge, updateIntent } from './actions.js';
import { PaymentElementModal } from './PaymentElementModal.jsx';
import { PaymentSource } from './PaymentSource.jsx';

import { LoadingSpinner } from '../LoadingSpinner.js';
import { formatCurrency } from '../Utils.js';

const dateFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

/*
const IndividualDescriptions = {
	2: '2 GB, 1 year',
	3: '6 GB, 1 year',
	6: 'Unlimited storage, 1 year'
};
*/

// component that handles a request for payment, presenting the PaymentModal and processing
// the payment or saving the customer for future use as necessary

// purchase describes the subscription the user is purchasing or switching to
// it must contain a type field
// type is one of: individualChange, individualUpdate, individualRenew

function SubscriptionHandler(props) {
	const { userSubscription, choosePaymentType, chargeDescription, operationPending, setOperationPending, error, editPayment, setEditPayment, chargeAmount, description, stripeCustomer, purchase, allowRenew, returnUrl, setNotification, cancelPurchase, handleInvoiceRequest, handleConfirmPI } = props;
	const { type, storageLevel } = purchase;
	log.debug(props);

	const [ stripeIntent, setStripeIntent ] = useState(null);
	const [autorenew, setAutorenew] = useState(true);
	
	// const { stripeCustomer } = paymentState;
	log.debug(stripeCustomer, 4);
	// clear the new subscription closing the Handler, because it is either complete, or canceled
	const cancel = () => {
		setOperationPending(false);
		cancelPurchase();
		// paymentDispatch(cancelPurchase());
	};
	
	// update payment with immediateChargeRequired
	// useEffect(() => {
	// 	if (immediateChargeRequired) {
	// 		setPurchase(Object.assign({}, purchase, {immediateCharge: true}));
	// 		// paymentDispatch(immediateCharge(immediateChargeRequired));
	// 	}
	// }, []);
	// if (immediateChargeRequired) {
	// 	setPurchase(Object.assign({}, purchase, {immediateCharge: true}));
	// }

	useEffect(async () => {
		log.debug("useEffect beginStripeIntent");
		// log.debug(purchase);
		// log.debug(editPayment);
		// log.debug(stripeIntent);
		if (editPayment && !stripeIntent) {
			if (purchase.immediateCharge || (purchase.type == 'individualPaymentUpdate') ) {
				setOperationPending(true);
				try {
					await beginStripeIntent(purchase, setStripeIntent);
				} catch (e) {
					setNotification({type: "error", message: "There was an error with our payment processor. Please try again."});
					cancel();
				}
				setOperationPending(false);
			}
		} else {
			log.debug('not beginning intent');
		}
	}, [purchase, chargeAmount, editPayment]);

	let descriptionPs = description.map((d, i) => {
		return <p key={i}>{d}</p>;
	});
	
	
/*
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
					if (immediateChargeRequired) {
						confirmResult = await stripe.confirmCardPayment(result.client_secret);
					} else {
						confirmResult = await stripe.confirmCardSetup(result.client_secret);
					}
				} else if (paymentMethod.type == 'sepa_debit') {
					if (immediateChargeRequired) {
						confirmResult = await stripe.confirmSepaDebitPayment(result.client_secret);
					} else {
						confirmResult = await stripe.confirmSepaDebitSetup(result.client_secret);
					}
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
*/	
	
	let buttonLabel = purchase.immediateCharge ? `Pay ${formatCurrency(chargeAmount)}` : 'Confirm';
	
	let paymentSection = null;
	if (editPayment) {
		// allow entry of new payment details
		paymentSection = <PaymentElementModal
			stripe={window.stripe}
			{...{
				purchase,
				stripeIntent,
				operationPending,
				setOperationPending,
				buttonLabel,
				returnUrl,
				setNotification,
				cancel,
				chargeDescription,
				choosePaymentType,
				handleConfirm: handleConfirmPI,
			}}
		/>;
	} else if (stripeCustomer && !editPayment && purchase.immediateCharge) {
		// show existing payment method on file that will be charged, with link to change it if desired
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
						<Col className='text-center'><Button className='m-auto' onClick={() => { handleConfirmPI(false); }}>{buttonLabel}</Button></Col>
						<Col className='text-center'><Button className='m-auto' onClick={cancel}>Cancel</Button></Col>
					</Row>
				</div>
			);
		}
	} else {
		// TODO: should we ever see this?
		paymentSection = (
			<Container>
				<Row>
					<Col className='text-center'><Button className='m-auto' onClick={() => {handleConfirmPI(false);}}>{buttonLabel}</Button></Col>
					<Col className='text-center'><Button className='m-auto' onClick={cancel}>Cancel</Button></Col>
				</Row>
			</Container>
		);
	}
	
	let renewSection = null;
	if (allowRenew) {
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
	if (props.invoicePossible) {
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
					<Card className='mb-4'>
						<CardBody>
							{error}
							{descriptionPs}
						</CardBody>
					</Card>
					<LoadingSpinner className='m-auto' loading={operationPending} />
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
	allowRenew: PropTypes.bool,
	requestedStorageLevel: PropTypes.number,
	labUsers: PropTypes.number
};

export { SubscriptionHandler };
