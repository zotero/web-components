import { log as logger } from '../Log.js';
var log = logger.Logger('PaymentElementModal', 1);

import { useState } from 'react';
import { Elements, useElements, PaymentElement, AddressElement } from '@stripe/react-stripe-js';
import { Label, Button, Card, CardBody, Input, Form, FormGroup } from 'reactstrap';
import { useStorageContext } from './Storage.js';
import { Notifier } from '../Notifier.js';
import PropTypes from 'prop-types';
import { LoadingSpinner } from '../LoadingSpinner.js';
import { paymentShape } from './usePaymentProcessor.js';

function PECheckoutForm(props) {
// 	if (typeof props.callbacks.handleConfirmIntent != 'function') {
// 		log.error('props error in PECheckoutForm: handleConfirmIntent must be function');
// 	}
	const { storageState } = useStorageContext();
	const { payment } = storageState;
	const { buttonLabel } = props;
	const stripe = window.stripe;// useStripe();
	const elements = useElements();

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');

	const [errorMessage, setErrorMessage] = useState(null);
	const [paymentNotification, setPaymentNotification] = useState(null);
	const [elementReady, setElementReady] = useState(false);
	const [ showTaxID, setShowTaxID ] = useState(false);

	const updateAddress = async (evt) => {
		if (evt.complete) {
			const val = evt.value;
			log.debug(val);
			const addr = evt.value.address;
			log.debug("Got completed(?) address.");
			log.debug(addr);
			log.debug(val);
			setName(val.name);
		}
	}

	const handleSubmit = async (evt) => {
		// We don't want to let default form submission happen here,
		// which would refresh the page.
		evt.preventDefault();

		if (!stripe || !elements) {
			// Stripe.js has not yet loaded.
			// Make sure to disable form submission until Stripe.js has loaded.
			return;
		}
		
		payment.callbacks.setOperationPending(true);
		payment.callbacks.setNotification(null);
		let successMessage = "Payment Submitted";

		// Use PaymentElement to create a payment method without intent so it can be previewed
		// and checked for country
		// Trigger form validation and wallet collection
		const {error: submitError} = await elements.submit();
		if (submitError) {
			setPaymentNotification({ type: 'error', message: submitError.message });
			setErrorMessage(submitError.message);
			payment.callbacks.setOperationPending(false);
			return;
		}

		// Create the PaymentMethod using the details collected by the Payment Element
		const {error: cpmError, confirmationToken} = await stripe.createConfirmationToken({
			elements,
			// params: {
			// 	billing_details: billingDetails
			// }
		});
		if (cpmError) {
			setPaymentNotification({ type: 'error', message: cpmError.message });
			setErrorMessage(cpmError.message);
			payment.callbacks.setOperationPending(false);
			return;
		}
		log.debug('confirmationToken:');
		log.debug(confirmationToken);
		payment.callbacks.setOperationPending(false);
		payment.callbacks.setConfirmationToken(confirmationToken);
		// setLocation(confirmationToken.payment_method_preview.billing_details.address);
		payment.callbacks.setEditPayment(false);
		/* value is of the form
		{ name: "Test Buyer",
		  email: '...',
		  phone: null,
		  address: {
			city: '...',
			country: '...',
			line1: '...',
			line2: '...',
			postal_code: '...'
			state: '...'
			}
		}
		*/


	};

	let addressDefaults = {
		name
	};

	let emailSection = null;
	if (props.useEmail) {
		emailSection = (
			<FormGroup>
				<Input type='email' placeholder='Email' value={email} autoFocus
					onChange={(evt) => { setEmail(evt.target.value); }}
				/>
			</FormGroup>
		);
	}

	let taxIDSection = 
		<div id='taxIDSection'>
			<FormGroup check>
				<Label check>
					<Input type="checkbox"
					onChange={(evt) => { setShowTaxID(evt.target.checked); }} />{' '}
					Include Tax ID
				</Label>
			</FormGroup>
			{showTaxID ?
			<FormGroup>
				<Label for="taxID">Tax ID</Label>
				<Input type="text" name="taxID" id="taxID" placeholder="Tax ID" value={payment.state.taxID}
					onChange={(evt) => { payment.callbacks.setTaxID(evt.target.value); }} />{' '}
			</FormGroup>
			: null}
		</div>;

	return (
		<Form onSubmit={handleSubmit}>
			{emailSection}
			<div className='payment-billing-address'>
				<h4>Billing Address:</h4>
				<AddressElement onChange={updateAddress} options={{mode: 'billing', defaultValues:addressDefaults, autocomplete:{mode:'automatic'}}}/>
			</div>
			<div className='payment-method-details'>
				<h4>Payment:</h4>
				<PaymentElement onReady={()=>{setElementReady(true);}} options={{defaultValues:addressDefaults}} />
			</div>
			<LoadingSpinner className='m-auto' loading={!elementReady} />
			{taxIDSection}
			<FormGroup row className='mt-4'>
				<Button disabled={(!elementReady) || (payment.state.operationPending)} className='w-100' type='submit' color='secondary'>{buttonLabel}</Button>
				{payment.state.cancelable ? 
					<Button type='button' color='link' className='w-100 mt-3' onClick={payment.callbacks.cancelPurchase}>Cancel</Button> : null
				}
			</FormGroup>
			<Notifier {...paymentNotification} />
		</Form>
	)
}
PECheckoutForm.propTypes = {
	storageState: PropTypes.shape({
		payment: paymentShape
	}),
	// onClose: PropTypes.func.isRequired,
	buttonLabel: PropTypes.string,
	useEmail: PropTypes.bool,
	useAddress: PropTypes.bool,
	stripeIntent: PropTypes.object,
	// cancelable: PropTypes.bool,
};
PECheckoutForm.defaultProps = {
	useEmail: false,
	useAddress: false,
	// cancelable: true,
};

function PaymentElementModal(props) {
	const { storageState } = useStorageContext();
	const { stripe, cancel } = props;
	const { payment, purchase } = storageState;
	log.debug('PaymentElementModal render');
	log.debug(props);

	// const handleClose = () => {
	// 	cancel();
	// };

	let mode = 'payment';
	let setupFutureUsage = 'off_session';
	let amount = payment.state.price.total;
	if (purchase.type == 'individualPaymentUpdate') {
		mode = 'setup';
		setupFutureUsage = 'off_session';
		amount = null;
	} else if(payment.state.allowCN) {
		log.debug("allowCN true, setting future usage to ''");
		setupFutureUsage = null;
	}
	const options = {
		// Fully customizable with appearance API.
		appearance: {
			theme: 'stripe',
			// fontFamily: 'AvenirNextLTPro'
		},
		/*
		fonts: [
			{
				family: 'AvenirNextLTPro',
				src: 'url(/static/fonts/36AC02_0_0.eot)',
				weight: '500',
			}
		],
		*/
		amount,
		mode,
		currency: payment.state.currency,
		paymentMethodCreation: 'manual',
		setupFutureUsage,
	};

	//add a key for Elements so we can update it when the paymentIntent changes
	// const key = stripeIntent.client_secret;

	return (
		<div className='payment-chooser'>
			<Card>
				<CardBody>
					<Elements {...{stripe, options}}>
						<PECheckoutForm
							{...props}
							// onClose={handleClose}
						/>
					</Elements>
				</CardBody>
			</Card>
		</div>
	);
}
PaymentElementModal.propTypes = {
	storageState: PropTypes.shape({
		payment: paymentShape,
	}),
	buttonLabel: PropTypes.string,
	cancelable: PropTypes.bool,
	cancel: PropTypes.func.isRequired,
};
PaymentElementModal.defaultProps = {
	buttonLabel: 'Confirm',
	useEmail: false,
	useAddress: false,
	cancelable: true,
};

export { PaymentElementModal };
