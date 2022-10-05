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

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardBody, FormGroup, Input, Modal, ModalBody, ModalHeader, Label, Row, Col, Button, Container } from 'reactstrap';

import { beginStripeIntent } from './actions.js';
import { PaymentElementModal } from './PaymentElementModal.jsx';
import { PaymentSource } from './PaymentSource.jsx';

import { LoadingSpinner } from '../LoadingSpinner.js';
import { formatCurrency } from '../Utils.js';

// component that handles a request for payment, presenting the PaymentModal and processing
// the payment or saving the customer for future use as necessary

// purchase describes the subscription the user is purchasing or switching to
// it must contain a type field
// type is one of: individualChange, individualUpdate, individualRenew

function SubscriptionHandler(props) {
	const { callbacks, operationPending, error, editPayment, chargeAmount, previewPriceMismatch, awaitingFinalConfirm, description, stripeCustomer, purchase, allowRenew, returnUrl, location } = props;
	const { setOperationPending, setEditPayment, setNotification, cancelPurchase, handleInvoiceRequest, handleConfirm, setCurrency, setLocation } = callbacks;
	log.debug(props, 4);

	const [ stripeIntent, setStripeIntent ] = useState(null);
	const [ autorenew, setAutorenew ] = useState(true);
	
	log.debug(stripeCustomer, 4);
	// clear the new subscription closing the Handler, because it is either complete, or canceled
	const cancel = () => {
		setOperationPending(false);
		cancelPurchase();
	};
	
	useEffect(async () => {
		log.debug("useEffect beginStripeIntent", 4);
		// log.debug(stripeIntent);
		let validStripeIntent = stripeIntent;
		if (stripeIntent && stripeIntent.intent.currency != purchase.currency) {
			validStripeIntent = false;
		}
		if (editPayment && !validStripeIntent) {
			if (purchase.immediateCharge || (purchase.type == 'individualPaymentUpdate') ) {
				setOperationPending(true);
				try {
					let locationPurchase = Object.assign({}, purchase, {location});
					await beginStripeIntent(locationPurchase, setStripeIntent);
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
	
	let defaultSource = false;
	if (stripeCustomer) {
		defaultSource = stripeCustomer.default_source || stripeCustomer.invoice_settings.default_payment_method;
	}
	let paymentSection = null;
	if (editPayment && !awaitingFinalConfirm) {
		// allow entry of new payment details
		paymentSection = <PaymentElementModal
			stripe={window.stripe}
			{...{
				callbacks,
				purchase,
				stripeIntent,
				awaitingFinalConfirm,
				operationPending,
				buttonLabel: 'Add Payment',
				returnUrl,
				cancel,
			}}
		/>;
	} else {
		paymentSection = <PaymentDetails 
			{...{ purchase, stripeCustomer, defaultSource, chargeAmount, previewPriceMismatch, handleConfirm, cancel }}
		/>;
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
				{props.allowEuro ?
				<Row>
					<Col className='text-center'>
						{purchase.currency == 'eur' ? 
							<p><a href='#' onClick={()=>{setCurrency('usd');}}>Make payment in USD</a></p> :
							<p><a href='#' onClick={()=>{setCurrency('eur'); setLocation('US');}}>Make payment in Euro</a></p> 
						}
					</Col>
				</Row>
				: null }
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
SubscriptionHandler.defaultProps = {
	allowRenew: false,
};

function PaymentDetails(props) {
	const { purchase, stripeCustomer, defaultSource, chargeAmount, previewPriceMismatch, handleConfirm, setEditPayment, cancel } = props;
	log.debug("PaymentSection");
	log.debug(props);
	let buttonLabel = `Pay ${formatCurrency(chargeAmount, purchase.currency)}`;

	if (stripeCustomer) {
		// show existing payment method on file that will be charged, with link to change it if desired
		if (defaultSource) {
			return (
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
					{previewPriceMismatch ? 
					<Row className='mt-2'>
						<Col><p className='text-danger'>Note that the price has updated. The price charged is based on the payment method's country.</p></Col>
					</Row>
				: null}
					<Row className='mt-2'>
						<Col className='text-center'><Button className='m-auto' onClick={() => { handleConfirm(false); }}>{buttonLabel}</Button></Col>
						<Col className='text-center'><Button className='m-auto' onClick={cancel}>Cancel</Button></Col>
					</Row>
				</div>
			);
		} else {
			return (
				<div className='paymentSourcePending'>
					<Card>
						<CardHeader>
							Payment Method
						</CardHeader>
						<CardBody>
							<LoadingSpinner className='m-auto' loading={true} />
							<p>Adding payment method...</p>
						</CardBody>
					</Card>
				</div>
			);
		}
	}
	return <p>There was an error showing payment details</p>;
}

export { SubscriptionHandler };
