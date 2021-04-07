import { log as logger } from '../Log.js';
var log = logger.Logger('SubscriptionHandler', 1);

import { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardBody, FormGroup, Input, Modal, ModalBody, ModalHeader, Label, Row, Col, Button, Container } from 'reactstrap';

import { labPrice, labUserPrice } from './calculations.js';
import { CardPaymentModal } from './PaymentModal.jsx';
import { PaymentSource } from './PaymentSource.jsx';

import { postFormData, ajax } from '../ajax.js';
import { buildUrl } from '../wwwroutes.js';
import { LoadingSpinner } from '../LoadingSpinner.js';

import { PaymentContext, NotifierContext, notify, cancelPurchase } from './actions.js';

import { formatCurrency } from '../Utils.js';

/*
async function chargeLabSubscription(token = false, fte = false, name = '', institutionID = false) {
	// You can access the token ID with `token.id`.
	// Get the token ID to your server-side code for use.
	log.debug(`charging stripe lab. FTE:${fte} - token.id:${token.id}`);
	let resp;
	try {
		let args = {
			subscriptionType: 'lab',
			stripeToken: token.id,
			userCount: fte,
			institutionName: name
		};
		if (institutionID) {
			args.institutionID = institutionID;
		}
		resp = await postFormData('/storage/stripechargelabajax', args);

		log.debug(resp);
		if (!resp.ok) {
			throw resp;
		}
		let respData = await resp.json();
		log.debug(respData);
		if (respData.success) {
			if (institutionID) {
				// existing institution, no need to direct to management interface
				return {
					type: 'success',
					message: <p>Success. Your Zotero Lab subscription has been updated</p>
				};
			} else {
				let manageUrl = buildUrl('manageInstitution', { institutionID: respData.institutionID });
				return {
					type: 'success',
					message: (<p>Success. You can now <a href={manageUrl}>manage your Zotero Lab subscription</a></p>)
				};
			}
		} else {
			return {
				type: 'error',
				message: <p>There was an error updating your Zotero Lab subscription</p>
			};
		}
	} catch (resp) {
		log.debug(resp);
		let respData = await resp.json();
		if (respData.stripeMessage) {
			return { type: 'error', message: `There was an error processing your payment: ${respData.stripeMessage}` };
		} else {
			return {
				type: 'error',
				message: <>There was an error updating your subscription. Please try again in a few minutes. If you continue to experience problems, email <a href='mailto:storage@zotero.org'>storage@zotero.org</a> for assistance.</>
			};
		}
	}
}

async function chargeLabAdditionalUsers(token = false, additionalFTE = false, name = '', institutionID = false) {
	log.debug(`charging stripe lab additional users. additionalFTE:${additionalFTE} - token.id:${token.id}`);
	let resp;
	try {
		if (!institutionID) {
			throw new Error('InstitutionID is required in chargeLabAdditionalUsers');
		}
		
		let args = {
			subscriptionType: 'addLabUsers',
			stripeToken: token.id,
			userCount: additionalFTE,
			name,
			institutionID: institutionID
		};
		resp = await postFormData('/storage/stripechargelabajax', args);

		if (!resp.ok) {
			throw resp;
		}
		let respData = await resp.json();
		if (respData.success) {
			if (institutionID) {
				// existing institution, no need to direct to management interface
				return {
					type: 'success',
					message: <p>Success. Your Zotero Lab subscription has been updated</p>
				};
			} else {
				let manageUrl = buildUrl('manageInstitution', { institutionID: respData.institutionID });
				return {
					type: 'success',
					message: (<p>Success. You can now <a href={manageUrl}>manage your Zotero Lab subscription</a></p>)
				};
			}
		} else {
			return {
				type: 'error',
				message: <p>There was an error updating your Zotero Lab subscription</p>
			};
		}
	} catch (resp) {
		log.debug(resp);
		let respData = await resp.json();
		if (respData.stripeMessage) {
			return { type: 'error', message: `There was an error processing your payment: ${respData.stripeMessage}` };
		} else {
			return {
				type: 'error',
				message: <>There was an error updating your subscription. Please try again in a few minutes. If you continue to experience problems, email <a href='mailto:storage@zotero.org'>storage@zotero.org</a> for assistance.</>
			};
		}
	}
}
*/

async function createInvoice(type, fte, additionalFTE, name, institutionID) {
	try {
		let resp;
		switch (type) {
		case 'labRenew':
			if (!fte) throw new Error('no fte set');
			if (!institutionID) throw new Error('no institutionID set');
			
			resp = await postFormData('/settings/storage/createinvoice', { type: 'labRenew', numUsers: fte, institutionID }, { withSession: true });
			break;
		case 'lab':
			if (!fte) throw new Error('no fte set');
			
			let params = { type: 'lab', numUsers: fte };
			if (institutionID) params.institutionID = institutionID;
			resp = await postFormData('/settings/storage/createinvoice', params, { withSession: true });
			break;
		case 'addLabUsers':
			if (!institutionID) throw new Error('no institutionID set');
			if (!additionalFTE) throw new Error('no additionalFTE set');
			
			resp = await postFormData('/settings/storage/createinvoice', { type: 'addLabUsers', numUsers: additionalFTE, institutionID }, { withSession: true });
			break;
		case 'institution':
			// TODO
			throw new Error('unimplemented invoice type');
		default:
			throw new Error('unrecognized type');
		}
		
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

function InstitutionHandler(props) {
	const { purchase, renew, institutionID } = props;
	const { type, fte, name, additionalFTE } = purchase;
	const { paymentDispatch, paymentState } = useContext(PaymentContext);
	const { notifyDispatch } = useContext(NotifierContext);
	
	const { stripeCustomer } = paymentState;
	
	// clear the new subscription closing the Handler, because it is either complete, or canceled
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

		notifyDispatch(notify(result.type, result.message));
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
		let result = await createInvoice(type, fte, additionalFTE, name, institutionID);
		notifyDispatch(notify(result.type, result.message));
		cancel();
	};
	
	let blabel = immediateChargeRequired ? `Pay ${formatCurrency(chargeAmount)}` : 'Confirm';
	
	let paymentSection = null;
	if (editPayment) {
		paymentSection = <CardPaymentModal
			stripe={window.stripe}
			{...{ handleConfirm, chargeAmount, immediateChargeRequired, setOperationPending }}
			buttonLabel={blabel}
		/>;
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
