import { log as logger } from '../Log.js';
var log = logger.Logger('PaymentElementModal', 1);

import { useState } from 'react';
import { Elements, useElements, PaymentElement, AddressElement } from '@stripe/react-stripe-js';
import { Label, Button, Card, CardBody, Input, Form, FormGroup } from 'reactstrap';
import { useStorageContext } from './Storage.js';
import { addPaymentMethod } from './actions.js';
import { Notifier } from '../Notifier.js';
import PropTypes from 'prop-types';
import { LoadingSpinner } from '../LoadingSpinner.js';

function PECheckoutForm(props) {
// 	if (typeof props.callbacks.handleConfirmIntent != 'function') {
// 		log.error('props error in PECheckoutForm: handleConfirmIntent must be function');
// 	}
	const { storageState, callbacks } = useStorageContext();
	const { buttonLabel, cancelable, cancel } = props;
	const { taxID, operationPending } = storageState;
	const { setTaxID, setEditPayment, setConfirmationToken, setLocation, setOperationPending, setNotification } = callbacks;
	const stripe = window.stripe;// useStripe();
	const elements = useElements();

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');

	const [errorMessage, setErrorMessage] = useState(null);
	const [paymentNotification, setPaymentNotification] = useState(null);
	const [elementReady, setElementReady] = useState(false);
	const [ showTaxID, setShowTaxID ] = useState(false);

	const handleSubmit = async (evt) => {
		// We don't want to let default form submission happen here,
		// which would refresh the page.
		evt.preventDefault();

		if (!stripe || !elements) {
			// Stripe.js has not yet loaded.
			// Make sure to disable form submission until Stripe.js has loaded.
			return;
		}
	
		callbacks.setOperationPending(true);
		setNotification(null);
		let successMessage = "Payment Submitted";

		// Use PaymentElement to create a payment method without intent so it can be previewed
		// and checked for country
		setOperationPending(true);
		// Trigger form validation and wallet collection
		const {error: submitError} = await elements.submit();
		if (submitError) {
			setPaymentNotification({ type: 'error', message: submitError.message });
			setErrorMessage(submitError.message);
			setOperationPending(false);
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
			setOperationPending(false);
			return;
		}
		log.debug('confirmationToken:');
		log.debug(confirmationToken);
		setOperationPending(false);
		setConfirmationToken(confirmationToken);
		setLocation(confirmationToken.payment_method_preview.billing_details.address);
		setEditPayment(false);
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
	}

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
				<Input type="text" name="taxID" id="taxID" placeholder="Tax ID" value={taxID}
					onChange={(evt) => { setTaxID(evt.target.value); }} />{' '}
			</FormGroup>
			: null}
		</div>;

	return (
		<Form onSubmit={handleSubmit}>
			{emailSection}
			<AddressElement options={{mode: 'billing', defaultValues:addressDefaults, autocomplete:{mode:'automatic'}}}/>
			<PaymentElement onReady={()=>{setElementReady(true);}} />
			<LoadingSpinner className='m-auto' loading={!elementReady} />
			{taxIDSection}
			<FormGroup row className='mt-4'>
				<Button disabled={(!elementReady) || (operationPending)} className='w-100' type='submit' color='secondary'>{buttonLabel}</Button>
				{cancelable ? 
					<Button type='button' color='link' className='w-100 mt-3' onClick={props.onClose}>Cancel</Button> : null
				}
			</FormGroup>
			<Notifier {...paymentNotification} />
		</Form>
	)
}
PECheckoutForm.propTypes = {
	storageState: PropTypes.shape({
	}),
	callbacks: PropTypes.shape({
		setOperationPending: PropTypes.func.isRequired,
		// handleConfirmIntent: PropTypes.func.isRequired,
	}),
	onClose: PropTypes.func.isRequired,
	buttonLabel: PropTypes.string,
	useEmail: PropTypes.bool,
	useAddress: PropTypes.bool,
	stripeIntent: PropTypes.object,
	cancelable: PropTypes.bool,
};
PECheckoutForm.defaultProps = {
	useEmail: false,
	useAddress: false,
	cancelable: true,
};

function PaymentElementModal(props) {
	const { storageState } = useStorageContext();
	const { stripe, stripeIntent, cancel } = props;
	const { price, purchase, returnUrl, allowCN } = storageState;
	log.debug('PaymentElementModal render');
	log.debug(props);

	const handleClose = () => {
		cancel();
	};

	let mode = 'payment';
	let setupFutureUsage = 'off_session';
	let amount = price.total;
	if (purchase.type == 'individualPaymentUpdate') {
		mode = 'setup';
		setupFutureUsage = 'off_session';
		amount = null;
	} else if(allowCN) {
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
		currency: storageState.currency,
		paymentMethodCreation: 'manual',
		setupFutureUsage,
		returnUrl
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
							onClose={handleClose}
						/>
					</Elements>
				</CardBody>
			</Card>
		</div>
	);
}
PaymentElementModal.propTypes = {
	storageState: PropTypes.shape({
		operationPending: PropTypes.bool.isRequired,
		returnUrl: PropTypes.string.isRequired
	}),
	callbacks: PropTypes.shape({
		setOperationPending: PropTypes.func.isRequired,
		setNotification: PropTypes.func.isRequired,
		// handleConfirmIntent: PropTypes.func.isRequired,
	}),
	buttonLabel: PropTypes.string,
	cancelable: PropTypes.bool,
};
PaymentElementModal.defaultProps = {
	buttonLabel: 'Confirm',
	useEmail: false,
	useAddress: false,
	cancelable: true,
};

export { PaymentElementModal };
