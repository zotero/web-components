import { log as logger } from '../Log.js';
var log = logger.Logger('InstitutionHandler', 1);

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardBody, FormGroup, Input, Modal, ModalBody, ModalHeader, Label, Row, Col, Button, Container } from 'reactstrap';

import { labPrice, labUserPrice } from './calculations.js';
import { PaymentElementModal } from './PaymentElementModal.jsx';
import { PaymentSource } from './PaymentSource.jsx';

import { ajax } from '../ajax.js';
import { buildUrl } from '../wwwroutes.js';
import { LoadingSpinner } from '../LoadingSpinner.js';

import { createInstitutionInvoice, beginStripeIntent } from './actions.js';

import { formatCurrency } from '../Utils.js';


function InstitutionHandler(props) {
	const { purchase, stripeCustomer, setPurchase, renew, institutionID, setNotification } = props;
	const { type, fte, name, additionalFTE } = purchase;
	
	const [autorenew, setAutorenew] = useState(true);
	const [editPayment, setEditPayment] = useState((type == 'paymentUpdate'));
	const [operationPending, setOperationPending] = useState(false);
	const [stripeIntent, setStripeIntent] = useState(false);

	// clear the new subscription closing the Handler, because it is either complete, or canceled
	const cancel = () => {
		setOperationPending(false);
		setPurchase(null);
	};
	
	let description = [];
	let chargeAmount = false;
	let error = null;
	let immediateChargeRequired = true;
		
	switch (type) {
	case 'paymentUpdate':
		description.push(`Update your saved payment details for your next renewal. There will be no charge made until your expiration date.`);
		break;
	case 'labRenew':
		description.push(`Renew your current subscription. Zotero Lab for ${fte} users.`);
		description.push(`Your card or bank account will be charged immediately after confirming.`);
		chargeAmount = labPrice(fte);
		immediateChargeRequired = true;
		break;
	case 'lab':
		description.push(`Purchase 1 year of Zotero Lab for ${fte} users.`);
		description.push(`Lab Name: ${name}`);
		chargeAmount = labPrice(fte);
		immediateChargeRequired = true;
		break;
	case 'addLabUsers':
		description.push(`Add ${additionalFTE} users to your current subscription.`);
		description.push(`Your card or bank account will be charged immediately after confirming.`);
		chargeAmount = labUserPrice(additionalFTE);
		immediateChargeRequired = true;
		break;
	case 'institution':
		// TODO
		break;
	default:
		throw new Error('Unknown purchase type');
	}
	
	if (immediateChargeRequired && !stripeCustomer && !editPayment) {
		setEditPayment(true);
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
					purchaseData.institutionName = name;
				}
				
				await beginStripeIntent(purchaseData, setStripeIntent);
				setOperationPending(false);
			}
		}
	}, [editPayment, chargeAmount]);

	let descriptionPs = description.map((d, i) => {
		return <p key={i}>{d}</p>;
	});
	
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

	const handleInvoiceRequest = async () => {
		setOperationPending(true);
		let result = await createInstitutionInvoice({type, fte, additionalFTE, name, institutionID});
		setNotification(result);
		cancel();
	};
	
	let buttonLabel = immediateChargeRequired ? `Pay ${formatCurrency(chargeAmount)}` : 'Confirm';
	
	let paymentSection = null;
	if (editPayment) {
		log.debug('editPayment - rendering PaymentElementModal');
		log.debug(stripeIntent);
		paymentSection = <PaymentElementModal
			stripe={window.stripe}
			{...{
				setNotification,
				purchase,
				stripeIntent,
				operationPending,
				setOperationPending,
				setNotification,
				buttonLabel,
				useEmail: true,
				returnUrl: window.location.toString(),
				handleConfirm,
				cancel,
			}}
			chargeDescription="Charge"
		/>;
		// paymentSection = <CardPaymentModal
		// 	stripe={window.stripe}
		// 	{...{ handleConfirm, chargeAmount, immediateChargeRequired, setOperationPending }}
		// 	buttonLabel={blabel}
		// />;
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
						<Col className='text-center'><Button className='m-auto' onClick={() => { handleConfirm(false); }}>{buttonLabel}</Button></Col>
						<Col className='text-center'><Button className='m-auto' onClick={cancel}>Cancel</Button></Col>
					</Row>
				</div>
			);
		}
	} else {
		paymentSection = (
			<Container>
				<Row>
					<Col className='text-center'><Button className='m-auto' onClick={handleConfirm}>{buttonLabel}</Button></Col>
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
					<p><a href='#' onClick={handleInvoiceRequest}>Create invoice payable by third party</a></p>
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
