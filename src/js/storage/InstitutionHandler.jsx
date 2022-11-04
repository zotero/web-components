import { log as logger } from '../Log.js';
var log = logger.Logger('InstitutionHandler', 1);

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardBody, FormGroup, Input, Modal, ModalBody, ModalHeader, Label, Row, Col, Button, Container } from 'reactstrap';

import { PaymentElementModal } from './PaymentElementModal.jsx';
import { PaymentSource } from './PaymentSource.jsx';
import { PaymentDetails } from './PaymentDetails.jsx';

import { buildUrl } from '../wwwroutes.js';
import { LoadingSpinner } from '../LoadingSpinner.js';

import { createInstitutionInvoice, beginStripeIntent } from './actions.js';

import { formatCurrency } from '../Utils.js';

// handle request to purchase Lab or Institution subscription
// 
function InstitutionHandler(props) {
	const { purchase, chargeAmount, renew, editPayment, institutionID, location, stripeCustomer, previewPriceMismatch, immediateChargeRequired, awaitingFinalConfirm, description, operationPending, callbacks } = props;
	const { setPurchase, setEditPayment, setOperationPending } = callbacks;
	
	const [autorenew, setAutorenew] = useState(true);
	const [stripeIntent, setStripeIntent] = useState(false);

	const cancel = () => {
		setPurchase(null);
		setOperationPending(false);
	}
	
	useEffect(async () => {
		log.debug("useEffect beginStripeIntent");
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
				
				let locationPurchaseData = Object.assign({}, purchaseData, {location});
				await beginStripeIntent(locationPurchaseData, setStripeIntent);
				setOperationPending(false);
			}
		}
	}, [editPayment, chargeAmount]);

	let descriptionPs = description.map((d, i) => {
		return <p key={i}>{d}</p>;
	});
	

	/*
	const handleConfirm = async (paymentMethod) => {
		return;
		log.debug('handleConfirm');
		log.debug(paymentMethod);
		if (operationPending) {
			log.debug('operation already pending');
			return;
		}

		let result, invoiceUrl, manageUrl;
		setOperationPending(true);
		let purchaseData = Object.assign({}, purchase, { paymentMethod: paymentMethod.id });
		if (purchase.fte) {
			purchaseData.numUsers = purchase.fte;
		} else if (purchase.additionalFTE) {
			purchaseData.numUsers = purchase.additionalFTE;
		}
		if (purchase.name) {
			purchaseData.institutionName = name;
		}
		let resp;
		log.debug(purchaseData);
		try {
			resp = await ajax({
				type: 'POST',
				withSession: true,
				url: '/storage/purchase',
				data: JSON.stringify(purchaseData),
				throwOnError: false,
			});
		} catch (unexpectedThrownResponse) {
			log.error("UNEXPECTED THROWN RESPONSE WHEN ATTEMPTING PURCHASE");
		} finally {
			const respData = await resp.json();
			if (!respData.success) {
				result = {
					type: 'error',
					message: <p>There was an error completing the requested action. Please try again in a few minutes. If you continue to experience problems, email <a href='mailto:storage@zotero.org'>storage@zotero.org</a> with details for assistance.</p>
				};
			} else if (respData.invoiceID && !respData.charge) {
				result = {
					type: 'success',
					message: <span>Invoice created. <a href={`/storage/invoice/${respData.invoiceID}`}>View Invoice</a>. This invoice can also be found linked at the top of your <a href='/settings/storage'>storage settings</a>.</span>
				};
			} else {
				switch (type) {
				case 'paymentUpdate':
					result = {
						type: 'success',
						message: <p>Your payment details have been updated.</p>
					};
					break;
				case 'labRenew':
					invoiceUrl = `/storage/invoice/${respData.invoiceID}`;

					result = {
						type: 'success',
						message: <p>Success. An invoice has been created for this charge. You can <a href={invoiceUrl}>view the invoice now</a>, and it will also be available from your <a href='/settings/storage'>storage settings</a>.</p>
					};
					break;
				case 'lab':
					manageUrl = buildUrl('manageInstitution', { institutionID: respData.institutionID });
					invoiceUrl = `/storage/invoice/${respData.invoiceID}`;

					result = {
						type: 'success',
						message: (
							<p>Success. You can now <a href={manageUrl}>manage your Zotero Lab subscription</a>.
								You can also <a href={invoiceUrl}>view the invoice for this charge</a>.
								Both of these will always be available to you from your <a href='/settings/storage'>storage settings</a>
							</p>
						)
					};
					break;
				case 'addLabUsers':
					invoiceUrl = `/storage/invoice/${respData.invoiceID}`;

					result = {
						type: 'success',
						message: <p>Success. An invoice has been created for this charge. You can <a href={invoiceUrl}>view the invoice now</a>, and it will also be available from your <a href='/settings/storage'>storage settings</a>.</p>
					};
					break;
				case 'institution':
					// TODO
					break;
				default:
					throw new Error('Unknown purchase type');
				}
			}
		}


		setNotification(result);
		cancel();
	};
	*/
	
	/*
	const handleConfirm = async (paymentMethod) => {
		if (operationPending) {
			return;
		}
		setOperationPending(true);
		let result;
		
		switch (type) {

		case 'labRenew':
			result = await chargeLabSubscription(token, fte, name, institutionID);
			notifyDispatch(notify(result.type, result.message));
			cancel();
			break;
		case 'lab':
			result = await chargeLabSubscription(token, fte, name, false);
			notifyDispatch(notify(result.type, result.message));
			cancel();
			break;
		case 'addLabUsers':
			result = await chargeLabAdditionalUsers(token, additionalFTE, name, institutionID);
			notifyDispatch(notify(result.type, result.message));
			cancel();
			break;
		case 'institution':
			
			break;
		default:
			throw new Error('Unknown subscriptionChange type');
		}
	};
	*/

	
	let buttonLabel = immediateChargeRequired ? `Pay ${formatCurrency(chargeAmount)}` : 'Confirm';
	
	let defaultSource = false;
	if (stripeCustomer) {
		defaultSource = stripeCustomer.default_source || stripeCustomer.invoice_settings.default_payment_method;
	}
	let paymentSection = null;
	if (editPayment && !awaitingFinalConfirm) {
		log.debug('editPayment - rendering PaymentElementModal');
		log.debug(stripeIntent);
		let peCallbacks = {...callbacks, setOperationPending }
		paymentSection = <PaymentElementModal
			stripe={window.stripe}
			{...{
				callbacks: peCallbacks,
				purchase,
				stripeIntent,
				awaitingFinalConfirm,
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
						<Col className='text-center'><Button className='m-auto' onClick={() => { callbacks.handleConfirm(false); }}>{buttonLabel}</Button></Col>
						<Col className='text-center'><Button className='m-auto' onClick={cancel}>Cancel</Button></Col>
					</Row>
				</div>
			);
		}
	} else {
		paymentSection = (
			<Container>
				<Row>
					<Col className='text-center'><Button className='m-auto' onClick={callbacks.handleConfirm}>{buttonLabel}</Button></Col>
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
							{props.error}
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
	institutionID: PropTypes.number,
	purchase: PropTypes.shape({
		type: PropTypes.string.isRequired,
		name: PropTypes.string,
		fte: PropTypes.number,
		additionalFTE: PropTypes.number,
	}).isRequired,
	renew: PropTypes.bool,
};

export { InstitutionHandler };
