import { log as logger } from '../Log.js';
var log = logger.Logger('ContributionPaymentHandler', 1);

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardBody, Modal, ModalBody, ModalHeader, Row, Col, Button, Input } from 'reactstrap';

import { PaymentElementModal } from '../storage/PaymentElementModal.jsx';
import { PaymentSource } from '../storage/PaymentSource.jsx';
// import { PaymentContext, NotifierContext, notify, cancelPurchase } from '../storage/actions';
import { initiatePurchase } from '../storage/actions.js';
import { postFormData } from '../ajax.js';
import { LoadingSpinner } from '../LoadingSpinner.js';

import { formatCurrency } from '../Utils.js';

/*
async function chargeContribution(token = false, amount, period, email) {
	log.debug(`charging stripe contribution. Amount:${amount} - token.id:${token.id}`, 4);
	let resp;
	try {
		let args = {
			stripeToken: token.id,
			amount,
			period,
			email,
		};
		resp = await postFormData('/storage/stripechargecontribution', args, { withSession: true });

		if (!resp.ok) {
			throw resp;
		}
		let respData = await resp.json();
		if (respData.success) {
			return {
				type: 'success',
				message: <p>Success. Thank you for supporting Zotero</p>
			};
		} else {
			return {
				type: 'error',
				message: <p>There was an error processing your payment</p>
			};
		}
	} catch (resp) {
		let respData = await resp.json();
		if (respData.stripeMessage) {
			return { type: 'error', message: `There was an error processing your payment: ${respData.stripeMessage}` };
		} else {
			if (respData.error) {
				log.error(respData.error);
			}
			return {
				type: 'error',
				message: <>There was an error processing your contribution. Please try again in a few minutes. If you continue to experience problems, email <a href='mailto:storage@zotero.org'>storage@zotero.org</a> for assistance.</>
			};
		}
	}
}
*/
/*
async function updateContribution(stripeIntent, purchase) {
	log.debug(`charging stripe contribution. Amount:${purchase.amount} - ${stripeIntent.id}`, 4);
	let resp;
	try {
		let args = {
			stripeToken: token.id,
			amount,
			period,
		};
		resp = await postFormData('/storage/updatecontribution', args, { withSession: true });

		if (!resp.ok) {
			throw resp;
		}
		let respData = await resp.json();
		if (respData.success) {
			return {
				type: 'success',
				message: <p>Success. Thank you for supporting Zotero</p>
			};
		} else {
			return {
				type: 'error',
				message: <p>There was an error processing your payment</p>
			};
		}
	} catch (resp) {
		let respData = await resp.json();
		if (respData.stripeMessage) {
			return { type: 'error', message: `There was an error processing your payment: ${respData.stripeMessage}` };
		} else {
			if (respData.error) {
				log.error(respData.error);
			}
			return {
				type: 'error',
				message: <>There was an error processing your contribution. Please try again in a few minutes. If you continue to experience problems, email <a href='mailto:storage@zotero.org'>storage@zotero.org</a> for assistance.</>
			};
		}
	}
}
*/

function ContributionPaymentHandler(props) {
	const { contributionState, callbacks } = props;
	const { purchase, currentUser, stripeCustomer, stripeIntent, operationPending } = contributionState;
	const { setStripeIntent, setNotification, setOperationPending, cancelPurchase, handleConfirmIntent } = callbacks;
	// const { type, amount, period } = purchase;
	
	const [editPayment, setEditPayment] = useState(false);
	const [email, setEmail] = useState('');

	let description = [];
	// let chargeAmount = amount;
	let error = null;

	// clear the new subscription closing the Handler, because it is either complete, or canceled
	const cancel = () => {
		setOperationPending(false);
		cancelPurchase();
	};

	useEffect(() => {
		log.debug("useEffect initiatePurchase", 4);
		const startPurchase = async () => {
			log.debug(purchase, 4);
			if (editPayment && !stripeIntent) {
				if (purchase.immediateCharge || purchase.type=='contributionPaymentUpdate') {
					setOperationPending(true);
					let purchaseData = Object.assign({}, purchase);
					await initiatePurchase(purchaseData, setStripeIntent);
					setOperationPending(false);
				}
			}
		};
		startPurchase();
	}, [purchase, editPayment]);

	switch (purchase.type) {
	case 'contributionPaymentUpdate':
		description.push(`Update your saved payment details for your next contribution. There will be no charge made until your normally scheduled contribution.`);
		break;
	case 'contribution':
		description.push(`Make a one time contribution to support Zotero.`);
		description.push(`Your card or bank account will be charged immediately after confirming.`);
		break;
	case 'recurringContribution':
		description.push(`Make a ${purchase.period}ly recurring contribution to support Zotero.`);
		description.push(`Your card or bank account will be charged immediately after confirming.`);
		break;
	default:
		throw new Error('Unknown purchase type');
	}
	
	if (!currentUser) {
		description.push(<small className='text-muted'>If you&apos;d like your contribution associated with your Zotero account, please <a href='/user/login'>log in</a> before contributing.</small>);
	} else {
		description.push(`Receipts will be emailed to ${currentUser.email}`);
	}
	
	if ((purchase.immediateCharge || purchase.type == 'contributionPaymentUpdate') && !stripeCustomer && !editPayment) {
		setEditPayment(true);
	}
	
	let descriptionPs = description.map((d, i) => {
		return <p key={i}>{d}</p>;
	});
	
	/*
	const handleConfirm = async () => {
		let result;
		setOperationPending(true);
		switch (purchase.type) {
		case 'paymentUpdate':
			if (!stripeIntent) {
				throw new Error('Required stripe intent not passed');
			}
			result = await updateContribution(token, amount, period);
			notify(result.type, result.message);
			cancel();
			break;
		case 'contribution':
		case 'recurringContribution':
			result = await chargeContribution(token, amount, period, email);
			setNotification(result);
			cancel();
			break;
		default:
			throw new Error('Unknown purchase type');
		}
	};
	*/
	
	let buttonLabel = purchase.immediateCharge ? `Pay US ${formatCurrency(purchase.amount)}` : 'Confirm';

	// enable email section if we don't have a user so we can associate something with the contribution and email them a receipt
	let emailSection = null;
	if (!currentUser) {
		emailSection = (
			<Card className='mb-4'>
				<CardBody>
					<Input type='text' name='email' onChange={(evt) => { setEmail(evt.target.value); }} placeholder='Email' value={email} />
				</CardBody>
			</Card>
		);
	}
	
	let paymentSection = null;
	if (editPayment) {
		paymentSection = <PaymentElementModal 
			stripe={window.stripe}
			{...{
				purchase,
				stripeIntent,
				handleConfirmIntent,
				// chargeAmount,
				operationPending,
				setOperationPending,
				buttonLabel,
				callbacks,
				useEmail: false,
				cancelable: true,
				cancel: cancelPurchase,
				returnUrl: window.location.toString(),
			}}
		/>;
	} else if (stripeCustomer) {
		// const defaultSource = stripeCustomer.default_source;
		// const defaultPaymentMethod = stripeCustomer.invoice_settings.default_payment_method;
		const paymentDetails = stripeCustomer.default_source || stripeCustomer.invoice_settings.default_payment_method;
		if (paymentDetails) {
			paymentSection = (
				<div className='currentPaymentSource'>
					<Card>
						<CardHeader>
							Payment Method
						</CardHeader>
						<CardBody>
							<PaymentSource source={paymentDetails} />
							<Button color='link' onClick={() => { setEditPayment(true); }}>Change Payment Details</Button>
						</CardBody>
					</Card>
					<Row className='mt-2'>
						<Col className='text-center'><Button className='m-auto' onClick={() => { handleConfirmIntent(false); }}>{buttonLabel}</Button></Col>
						<Col className='text-center'><Button className='m-auto' onClick={cancel}>Cancel</Button></Col>
					</Row>
				</div>
			);
		}
	}

	return (
		<div className='subscription-handler'>
			<Modal isOpen={true} toggle={cancel} className='payment-modal'>
				<ModalHeader>Contribute to Zotero</ModalHeader>
				<ModalBody>
					<Card className='mb-4'>
						<CardBody>
							{error}
							{descriptionPs}
						</CardBody>
					</Card>
					<LoadingSpinner className='m-auto' loading={operationPending} />
					{emailSection}
					{paymentSection}
				</ModalBody>
			</Modal>
		</div>
	);
}

ContributionPaymentHandler.propTypes = {
	contributionState: PropTypes.shape({
		purchase: PropTypes.shape({
			type: PropTypes.string.isRequired,
			amount: PropTypes.number,
			period: PropTypes.string,
		}).isRequired,
		renew: PropTypes.bool,
		currentUser: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
	})
};

export { ContributionPaymentHandler };
