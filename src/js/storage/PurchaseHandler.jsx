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

/*
Start with purchase describing what we're trying to purchase, stripeCustomer if exists, paymentMethod if stripeCustomer has one, callbacks
 - Open dialog that shows: what we're purchasing, existing paymentMethod or PaymentElement to gather new payment, option to switch currency, option to toggle renewal
   - if existing paymentMethod: show details with option to update
   - else (or on change): get confirmationToken from PaymentElementModal

     - Get full price details from server based on address with confirmationToken or existing paymentMethod
	   - show base price, tax, total, and purchase button
	     - on purchase button: submit purchase, confirmationToken, price to server to complete as long as the actual charge matches what is expected 
 - 
*/

import { log as logger } from '../Log.js';
var log = logger.Logger('PurchaseHandler');

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardBody, FormGroup, Input, Modal, ModalBody, ModalHeader, Label, Row, Col, Button, Container } from 'reactstrap';
import { Notifier } from '../Notifier.js';

import { useStorageContext } from './Storage.js';
// import { initiatePurchase } from './actions.js';
import { PaymentElementModal } from './PaymentElementModal.jsx';
import { PaymentDetails } from './PaymentDetails.jsx';

import { LoadingSpinner } from '../LoadingSpinner.js';

// component that handles a request for payment, presenting the PaymentModal and processing
// the payment or saving the customer for future use as necessary

// purchase describes the subscription the user is purchasing or switching to
// it must contain a type field
// type is one of: individualChange, individualUpdate, individualRenew

function PurchaseHandler(props) {
	const { storageState, callbacks } = useStorageContext();
	const { payment, purchase, error, description, allowRenew, invoicePossible } = storageState;
	const { handleInvoiceRequest } = callbacks;
	log.debug('PurchaseHandler');
	log.debug({storageState, callbacks});

	const [ autorenew, setAutorenew ] = useState(true);
	
	// log.debug(payment.stripeCustomer, 4);
	let descriptionPs = description.map((d, i) => {
		return <p key={i}>{d}</p>;
	});
	
	let paymentSection = null;
	if (payment.state.editPayment) {
		// allow entry of new payment details
		paymentSection = <PaymentElementModal
			stripe={window.stripe}
			{...{
				autorenew,
				setAutorenew,
				buttonLabel: 'Submit',
				cancel: payment.callbacks.cancelPurchase,
			}}
		/>;
	} else if (payment.state.price.total && purchase.immediateCharge) { //if(chargeAmount)
		log.debug('total price and immediateCharge: showing PaymentDetails with price');
		paymentSection = <>
			<PaymentDetails 
				{...{
					defaultPaymentMethod: payment.state.defaultPaymentMethod,
					autorenew,
					setAutorenew,
				}}
			/>
		</>;
	} else if (purchase.type == 'individualChange' && !purchase.immediateCharge && !payment.state.taxPriceError) {
		log.debug('Showing bare confirmChange');
		paymentSection = (
			<div className='confirmChange'>
				<Row className='mt-2'>
					<Col className='text-center'><Button className='m-auto' onClick={() => { payment.callbacks.handleConfirmPurchase(); }}>Confirm Change</Button></Col>
					{payment.state.cancelable ? <Col className='text-center'><Button className='m-auto' onClick={payment.callbacks.cancelPurchase}>Cancel</Button></Col> : null}
				</Row>
			</div>
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
	if (false) { //if(invoicePossible) {
		invoiceSection = (
			<Container className='mt-4'>
				<Row>
					<Col className='text-center'>
						<p><a id='create-invoice-link' href='#' onClick={handleInvoiceRequest}>Create invoice payable by third party</a></p>
					</Col>
				</Row>
			</Container>
		);
	}

	//allow changing of currency between USD and EUR if we don't already have a payment method set
	let currencySection = null;
	if((payment.state.currency == 'eur' || payment.state.allowEuro) && !payment.state.defaultPaymentMethod) {
		currencySection = (
			<Container className='mt-4'>
				<Row>
					<Col className='text-center'>
						{payment.state.currency == 'eur' ? 
							<p><a href='#' onClick={(e)=>{e.preventDefault(); payment.callbacks.setCurrency('usd');}}>Make payment in USD</a></p> :
							<p><a href='#' onClick={(e)=>{e.preventDefault(); payment.callbacks.setCurrency('eur'); /*setLocation('US');*/}}>Make payment in Euro</a></p> 
						}
					</Col>
				</Row>
			</Container>
		);
	} else {
		log.debug(`not showing currency section: allowEuro:${payment.state.allowEuro}, PM:${payment.state.defaultPaymentMethod}`);
	}

	if (error !== null) {
		log.debug("error is not null in PurchaseHandler");
		paymentSection = null;
		invoiceSection = null;
		renewSection = null;
	}

	let taxPriceNotifier = payment.state.taxPriceError ?
	<Notifier id='tax-price-error' type='error' message="There was an error calculating taxes for the entered address. You may need to update your address or payment details." />
	: null;
	
	return (
		<div className='subscription-handler'>
			<Modal isOpen={true} toggle={payment.callbacks.cancelPurchase} className='payment-modal'>
				<ModalHeader>{props.title}</ModalHeader>
				<ModalBody>
					{taxPriceNotifier}
					<Notifier {...payment.state.notification} />
					<Card className='mb-4'>
						<CardBody>
							{error}
							<div className='purchase-description'>
								{descriptionPs}
							</div>
						</CardBody>
					</Card>
					<LoadingSpinner className='m-auto' loading={payment.state.operationPending} />
					{paymentSection}
					{invoiceSection}
					{currencySection}
					{renewSection}
				</ModalBody>
			</Modal>
		</div>
	);
}

PurchaseHandler.propTypes = {
	title: PropTypes.string,
	storageState: PropTypes.shape({
		purchase: PropTypes.shape({
			type: PropTypes.string.isRequired,
			storageLevel: PropTypes.number
		}).isRequired,
		allowRenew: PropTypes.bool,
		requestedStorageLevel: PropTypes.number,
		labUsers: PropTypes.number
	})
};
PurchaseHandler.defaultProps = {
	title: "Manage Subscription",
	allowRenew: false,
};

export { PurchaseHandler };
