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
import { Alert, Card, CardHeader, CardBody, FormGroup, Input, Modal, ModalBody, ModalHeader, Label, Row, Col, Button, Container } from 'reactstrap';

import { beginStripeIntent } from './actions.js';
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
	const { callbacks, operationPending, error, editPayment, chargeAmount, description, stripeCustomer, purchase, allowRenew, returnUrl } = props;
	const { setOperationPending, setEditPayment, setNotification, cancelPurchase, handleInvoiceRequest, handleConfirm, setCurrency } = callbacks;
	log.debug(props);

	const [ stripeIntent, setStripeIntent ] = useState(null);
	const [autorenew, setAutorenew] = useState(true);
	
	log.debug(stripeCustomer, 4);
	// clear the new subscription closing the Handler, because it is either complete, or canceled
	const cancel = () => {
		setOperationPending(false);
		cancelPurchase();
	};
	
	useEffect(async () => {
		log.debug("useEffect beginStripeIntent");
		// log.debug(stripeIntent);
		let validStripeIntent = stripeIntent;
		if (stripeIntent && stripeIntent.intent.currency != purchase.currency) {
			validStripeIntent = false;
		}
		if (editPayment && !validStripeIntent) {
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
	
	let buttonLabel = purchase.immediateCharge ? `Pay ${formatCurrency(chargeAmount, purchase.currency)}` : 'Confirm';
	
	let paymentSection = null;
	if (editPayment) {
		// allow entry of new payment details
		paymentSection = <PaymentElementModal
			stripe={window.stripe}
			{...{
				callbacks,
				purchase,
				stripeIntent,
				operationPending,
				// setOperationPending,
				buttonLabel,
				returnUrl,
				// setNotification,
				cancel,
				// handleConfirm,
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
						<Col className='text-center'><Button className='m-auto' onClick={() => { handleConfirm(false); }}>{buttonLabel}</Button></Col>
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
					<Col className='text-center'><Button className='m-auto' onClick={() => {handleConfirm(false);}}>{buttonLabel}</Button></Col>
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
				<Row>
					<Col className='text-center'>
						{purchase.currency == 'eur' ? 
							<p><a href='#' onClick={()=>{setCurrency('usd');}}>Make payment in USD</a></p> :
							<p><a href='#' onClick={()=>{setCurrency('eur');}}>Make payment in Euro</a></p> 
						}
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
SubscriptionHandler.defaultProps = {
	allowRenew: false,
};

export { SubscriptionHandler };
