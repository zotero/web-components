import { log as logger } from '../Log.js';
var log = logger.Logger('PayInvoice', 1);

import { useState, useReducer } from 'react';
import PropTypes from 'prop-types';
import { Alert, Card, CardHeader, CardBody, Row, Col } from 'reactstrap';

import { Notifier } from '../Notifier.js';
import { priceCents, labPrice, labUserPrice } from './calculations.js';
import { CardPaymentModal } from './PaymentModal.jsx';
import { PaymentSource } from './PaymentSource.jsx';

import { postFormData, ajax } from '../ajax.js';
import { LoadingSpinner } from '../LoadingSpinner.js';
import { formatCurrency } from '../Utils.js';
import { PaymentContext, paymentReducer } from './actions.js';

const dateFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

const storageLevelDescriptions = {
	2: '2 GB',
	3: '6 GB',
	6: 'Unlimited storage'
};

async function chargeInvoice(invoiceID = false, token = false) {
	if (!invoiceID) {
		throw new Error('no invoiceID specified');
	}
	if (token === false) {
		throw new Error('no token for chargeInvoice');
	}
	
	try {
		let data = {
			invoiceID,
			stripeToken: token.id
		};
		let resp = await postFormData('/storage/chargeinvoice', data, { withSession: true });
		
		log.debug(resp);
		if (resp.ok) {
			let respData = await resp.json();
			return {
				type: 'success',
				message: <span>Invoice Paid</span>,
				data: respData
			};
		} else {
			throw resp;
		}
	} catch (resp) {
		log.error(resp);
		
		try {
			let data = await resp.json();
			if (data.stripeMessage) {
				return { type: 'error', message: `There was an error processing your payment: ${data.stripeMessage}` };
			} else {
				return { type: 'error', message: 'Error updating subscription. Please try again in a few minutes.' };
			}
		} catch (e) {
			return { type: 'error', message: 'Error updating subscription. Please try again in a few minutes.' };
		}
	}
}

// component that handles paying an invoice that has been generated by a user for a third party to pay
function PayInvoice(props) {
	const { invoice, invoiceUser, institutionName, overQuota } = props;
	const { invoiceID, invoiceType, stripeCharge, numUsers, storageLevel, created } = invoice;
	
	const [paymentState, paymentDispatch] = useReducer(paymentReducer, {
		stripeCustomer: props.stripeCustomer,
	});
	const [stripeChargeObject, setStripeChargeObject] = useState(props.stripeChargeObject);
	
	const [invoicePaid, setInvoicePaid] = useState(!!stripeCharge);
	const { paymentIntent } = paymentState;
	
	let description = [];
	let chargeAmount = 0;
	let error = null;
	let createdDate = new Date(created);
	
	const [notification, setNotification] = useState(null);
	const [operationPending, setOperationPending] = useState(false);
	
	if (!props.invoice) {
		return null;
	}
	
	switch (invoiceType) {
	case 'individual':
		description.push(`Zotero Storage subscription for user ${invoiceUser.username} - ${invoiceUser.email}`);
		description.push(`1 year of Zotero file storage: ${storageLevelDescriptions[storageLevel]}`);
		chargeAmount = priceCents[storageLevel];
		break;
	case 'lab':
		if (institutionName) {
			description.push(`${institutionName}`);
		}
		description.push(`Zotero Lab subscription managed by user ${invoiceUser.username} - ${invoiceUser.email}`);
		description.push(`Zotero Lab subscription will provide one year of unlimited Zotero file storage for ${numUsers} users`);
		chargeAmount = labPrice(numUsers);
		break;
	case 'addLabUsers':
		if (institutionName) {
			description.push(`${institutionName}`);
		}
		description.push(`Add ${numUsers} users to existing Zotero Lab subscription managed by user ${invoiceUser.username} - ${invoiceUser.email}`);
		chargeAmount = labUserPrice(numUsers);
		break;
	case 'contribution':
		break;
	default:
		log.error(invoiceType);
		throw new Error('Unknown invoice type');
	}
	if (invoiceType == 'individual' && overQuota) {
		error = <Alert color='error'>Current usage exceeds the chosen plan&apos;s quota. You&apos;ll need to choose a larger storage plan, or delete some files from your Zotero storage.</Alert>;
	}
	
	let descriptionPs = description.map((d, i) => {
		return <p key={i}>{d}</p>;
	});
	
	/*
	const handleConfirm = async (paymentMethod) => {
		let result;
		setOperationPending(true);
		result = await chargeInvoice(invoiceID, paymentMethod);
		setNotification(result);
		if (result.type == 'success') {
			setStripeChargeObject(result.data.stripeChargeObject);
			setInvoicePaid(true);
			setOperationPending(false);
		}
	};
	*/

	const handleConfirm = async (paymentMethod) => {
		log.debug('handleConfirm');
		log.debug(paymentMethod);
		if (operationPending) {
			log.debug('operation already pending');
			return;
		}
		let result;
		setOperationPending(true);
		let purchaseData = { invoiceID, type: 'chargePayableInvoice', paymentMethod: paymentMethod.id };// Object.assign({}, purchase, { paymentMethod: paymentMethod.id });
		log.debug(purchaseData);
		let resp = await ajax({
			type: 'POST',
			withSession: true,
			url: '/storage/purchase',
			data: JSON.stringify(purchaseData),
		});
		if (resp.ok) {
			let respData = await resp.json();
			result = {
				type: 'success',
				message: <span>Invoice Paid</span>,
				data: respData
			};
		}
		setNotification(result);
		if (result.type == 'success') {
			setStripeChargeObject(result.data.stripeChargeObject);
			setInvoicePaid(true);
			setOperationPending(false);
		}
	};
	
	let blabel = `Pay ${formatCurrency(chargeAmount)}`;
	
	let paymentSection = null;
	if (!invoicePaid) {
		log.debug(description);
		paymentSection = <CardPaymentModal
			stripe={window.stripe}
			{...{ handleConfirm, paymentIntent, chargeAmount, setOperationPending }}
			immediateChargeRequired={true}
			chargeDescription={description}
			buttonLabel={blabel}
			useEmail={true}
		/>;
		
		/*
			stripe={window.stripe}
			handleToken={handleConfirm}
			chargeAmount={chargeAmount}
			chargeDescription={description}
			buttonLabel={blabel}
			useEmail={true}
		/>;
		*/
	} else {
		const source = stripeChargeObject.source;
		log.debug(source);
		log.debug(stripeChargeObject);
		descriptionPs = <p>{stripeChargeObject.description}</p>;
		let datePaid = new Date(stripeChargeObject.created * 1000);
		
		if (source) {
			paymentSection = (
				<div className='currentPaymentSource'>
					<Card>
						<CardHeader>
							<h3>Invoice Paid - {datePaid.toLocaleDateString('en-US', dateFormatOptions)}</h3>
						</CardHeader>
						<CardBody>
							<h4>Payment Method</h4>
							<PaymentSource source={source} />
						</CardBody>
					</Card>
				</div>
			);
		}
	}
	
	return (
		<PaymentContext.Provider value={{ paymentDispatch, paymentState }}>
			<div className='pay-invoice'>
				<Row>
					<Col sm={{ size: 4, offset: 2 }}>
						<h3>Invoice ID</h3>
						<p>{invoice.invoiceID}</p>
						<p>{createdDate.toLocaleDateString('en-US', dateFormatOptions)}</p>
					</Col>
					<Col sm={4}>
						<h3>Invoice For:</h3>
						<div id='user_info'>
							<p>{invoiceUser.username}</p>
							<p>{invoiceUser.email}</p>
							<p></p>
						</div>
					</Col>
				</Row>
				<Row>
					<Col sm={{ size: 8, offset: 2 }}>
						<Notifier {...notification} />
						<Card className='payment-card'>
							<CardHeader>Zotero Subscription Invoice</CardHeader>
							<CardBody>
								<LoadingSpinner className='m-auto' loading={operationPending} />
								<Card className='mb-4'>
									<CardBody>
										{error}
										{descriptionPs}
									</CardBody>
								</Card>
								{paymentSection}
							</CardBody>
						</Card>
					</Col>
				</Row>
			</div>
		</PaymentContext.Provider>
	);
}

PayInvoice.propTypes = {
	invoice: PropTypes.shape({
		invoiceID: PropTypes.string.isRequired,
		invoiceType: PropTypes.string.isRequired,
		stripeCharge: PropTypes.string,
		userID: PropTypes.number,
		institutionID: PropTypes.number,
		numUsers: PropTypes.number,
		storageLevel: PropTypes.number,
		created: PropTypes.string
	}).isRequired,
	invoiceUser: PropTypes.shape({
		userID: PropTypes.number,
		username: PropTypes.string,
		email: PropTypes.string
	}),
	overQuota: PropTypes.bool,
	stripeCustomer: PropTypes.object,
	stripeChargeObject: PropTypes.shape({
		source: PropTypes.object,
		created: PropTypes.number,
	}),
	institutionName: PropTypes.oneOfType([PropTypes.string, PropTypes.bool])
};

export { PayInvoice };
