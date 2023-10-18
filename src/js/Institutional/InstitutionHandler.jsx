import { log as logger } from '../Log.js';
var log = logger.Logger('InstitutionHandler', 1);

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardBody, FormGroup, Input, Modal, ModalBody, ModalHeader, Label, Row, Col, Button, Container } from 'reactstrap';

import { PaymentElementModal } from '../storage/PaymentElementModal.jsx';
import { PaymentSource } from '../storage/PaymentSource.jsx';
import { PaymentDetails } from '../storage/PaymentDetails.jsx';

import { LoadingSpinner } from '../LoadingSpinner.js';

import { initiatePurchase } from '../storage/actions.js';

import { formatCurrency } from '../Utils.js';

// handle request to purchase Lab or Institution subscription
// 
function InstitutionHandler(props) {
	const { institutionState, callbacks } = props;
	const { purchase, chargeAmount, renew, editPayment, institutionID, location, stripeCustomer, previewPriceMismatch, immediateChargeRequired, description, operationPending, error } = institutionState;
	const { setPurchase, setEditPayment, setOperationPending } = callbacks;
	
	const [autorenew, setAutorenew] = useState(true);
	const [stripeIntent, setStripeIntent] = useState(false);

	const cancel = () => {
		setPurchase(null);
		setOperationPending(false);
	}
	
	useEffect(() => {
		log.debug("useEffect initiatePurchase");
		const startPurchase = async () => {
			log.debug(purchase);
			if (!stripeIntent) {
				if (editPayment) {
					setOperationPending(true);
					let purchaseData = Object.assign({}, purchase, {immediateCharge: immediateChargeRequired});
					if (purchase.fte) {
						purchaseData.numUsers = purchase.fte;
					} else if (purchase.additionalFTE) {
						purchaseData.numUsers = purchase.additionalFTE;
					}
					if (purchase.name) {
						purchaseData.institutionName = purchase.name;
					}
					
					const locationPurchaseData = Object.assign({}, purchaseData, {location});
					await initiatePurchase(locationPurchaseData, setStripeIntent);
					setOperationPending(false);
				}
			}
		};
		startPurchase();
	}, [editPayment, chargeAmount]);

	let descriptionPs = description.map((d, i) => {
		return <p key={i}>{d}</p>;
	});
	
	let buttonLabel = immediateChargeRequired ? `Pay ${formatCurrency(chargeAmount)}` : 'Confirm';
	
	let defaultSource = false;
	if (stripeCustomer) {
		defaultSource = stripeCustomer.default_source || stripeCustomer.invoice_settings.default_payment_method;
	}
	let paymentSection = null;
	if (editPayment) {
		log.debug('editPayment - rendering PaymentElementModal');
		log.debug(stripeIntent);
		paymentSection = <PaymentElementModal
			stripe={window.stripe}
			{...{
				callbacks,
				purchase,
				stripeIntent,
				// awaitingFinalConfirm,
				operationPending,
				buttonLabel,
				useEmail: true,
				returnUrl: window.location.toString(),
				cancel,
			}}
		/>;
		// paymentSection = <CardPaymentModal
		// 	stripe={window.stripe}
		// 	{...{ handleConfirm, chargeAmount, immediateChargeRequired, setOperationPending }}
		// 	buttonLabel={blabel}
		// />;
	} else if (stripeCustomer && immediateChargeRequired) {

		paymentSection = <PaymentDetails
			{...{ purchase, stripeCustomer, defaultSource, chargeAmount, previewPriceMismatch, handleConfirm: callbacks.handleConfirmPurchase, cancel }}
		/>;

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
						<Col className='text-center'><Button className='m-auto' onClick={() => { callbacks.handleConfirmPurchase(false); }}>{buttonLabel}</Button></Col>
						<Col className='text-center'><Button className='m-auto' onClick={cancel}>Cancel</Button></Col>
					</Row>
				</div>
			);
		}
	} else {
		paymentSection = (
			<Container>
				<Row>
					<Col className='text-center'><Button className='m-auto' onClick={callbacks.handleConfirmPurchase}>{buttonLabel}</Button></Col>
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
	
	let invoiceSection = (
		<Container className='mt-4'>
			<Row>
				<Col className='text-center'>
					<p><a href='#' onClick={callbacks.handleInvoiceRequest}>Create invoice payable by third party</a></p>
				</Col>
			</Row>
		</Container>
	);

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
					{invoiceSection}
					{renewSection}
				</ModalBody>
			</Modal>
		</div>
	);
}

InstitutionHandler.propTypes = {
	institutionState: PropTypes.shape({
		institutionID: PropTypes.number,
		purchase: PropTypes.shape({
			type: PropTypes.string.isRequired,
			name: PropTypes.string,
			fte: PropTypes.number,
			additionalFTE: PropTypes.number,
		}).isRequired,
		renew: PropTypes.bool,
	}),
	callbacks: PropTypes.shape({
		handleConfirmPurchase: PropTypes.func,
		setPurchase: PropTypes.func,
		setEditPayment: PropTypes.func,
		setOperationPending: PropTypes.func,
	}),
};

export { InstitutionHandler };
