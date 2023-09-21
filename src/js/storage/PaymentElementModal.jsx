import { log as logger } from '../Log.js';
var log = logger.Logger('PaymentElementModal', 1);

import { useState } from 'react';
import { Elements, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button, Card, CardBody, Input, Form, FormGroup } from 'reactstrap';
import { addPaymentMethod } from './actions.js';
import { Notifier } from '../Notifier.js';
import PropTypes from 'prop-types';
import { LoadingSpinner } from '../LoadingSpinner.js';

function PECheckoutForm(props) {
	if (typeof props.callbacks.handleConfirmIntent != 'function') {
		log.error('props error in PECheckoutForm: handleConfirmIntent must be function');
	}
	const { callbacks, purchase, buttonLabel, returnUrl, cancelable, cancel, operationPending, stripeIntent } = props;
	const { setOperationPending, setNotification, handleConfirmIntent } = callbacks;
	const stripe = window.stripe;// useStripe();
	const elements = useElements();

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [address1, setAddress1] = useState('');
	const [address2, setAddress2] = useState('');
	const [city, setCity] = useState('');
	const [state, setState] = useState('');

	const [errorMessage, setErrorMessage] = useState(null);
	const [paymentNotification, setPaymentNotification] = useState(null);
	const [elementReady, setElementReady] = useState(false);

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
		let successMessage = "Payment Submitted";

		let billingDetails = {
			name,
		};
		
		if (props.useEmail && email != '') {
			billingDetails.email = email;
		}

		if (props.useAddress) {
			billingDetails.address = {
				line1: address1,
				line2: address2,
				city: city,
				state: state,
			};
		}

		// Use PaymentElement to create a payment method without intent so it can be previewed
		// and checked for country
		/*
		// Trigger form validation and wallet collection
		const {error: submitError} = await elements.submit();
		if (submitError) {
			setPaymentNotification({ type: 'error', message: submitError.message });
			setErrorMessage(submitError.message);
			return;
		}

		// Create the PaymentMethod using the details collected by the Payment Element
		const {error: cpmError, paymentMethod} = await stripe.createPaymentMethod({
			elements,
			params: {
				billing_details: billingDetails
			}
		});
		if (cpmError) {
			setPaymentNotification({ type: 'error', message: cpmError.message });
			setErrorMessage(cpmError.message);
			return;
		}
		log.debug('PaymentMethod:');
		log.debug(paymentMethod);
		//send payment method to our server to add to customer
		await addPaymentMethod(paymentMethod);

		callbacks.refresh();
		// === END independent Payment Method section
		*/

		if (stripeIntent.intent.object == 'setup_intent') {
			log.debug("confirming setupIntent");
			var confirmResult = await stripe.confirmSetup({
				//`Elements` instance that was used to create the Payment Element
				elements,
				confirmParams: {
					return_url: returnUrl,
					payment_method_data: {
						billing_details: billingDetails
					}
				},
				redirect: 'if_required',			
			});
			successMessage = "Payment Saved";
		} else {
			log.debug("confirming paymentIntent");
			var confirmResult = await stripe.confirmPayment({
				//`Elements` instance that was used to create the Payment Element
				elements,
				confirmParams: {
					return_url: returnUrl,
					payment_method_data: {
						billing_details: billingDetails
					},
				},
				redirect: 'if_required',			
			});
		}
		log.debug(confirmResult);
		var { error } = confirmResult;
		
		if (error) {
			// This point will only be reached if there is an immediate error when
			// confirming the payment. Show error to your customer (for example, payment
			// details incomplete)
			setPaymentNotification({ type: 'error', message: error.message });
			setErrorMessage(error.message);
		} else {
			// Your customer will be redirected to your `return_url`. For some payment
			// methods like iDEAL, your customer will be redirected to an intermediate
			// site first to authorize the payment, then redirected to the `return_url`.

			//show success dialog which user will see unless they got redirected
			setNotification({ type: 'success', message: successMessage});
			//handleConfirmIntent will close dialog by removing purchase if necessary
			handleConfirmIntent(stripeIntent);
		}

		setOperationPending(false);
	};

	//disable name and email from being collected by stripe since we'll always collect or have
	let peFields = {
		billingDetails: {
			name: 'never',
			email: 'never',
		}
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

	let addressSection = null;
	if (props.useAddress) {
		addressSection = (
			<FormGroup>
				<Input type='address' placeholder='Address' value={address1} autoFocus={!props.useEmail}
					onChange={(evt) => { setAddress1(evt.target.value); }}
				/>
				<Input type='address' placeholder='Address 2' value={address2}
					onChange={(evt) => { setAddress2(evt.target.value); }}
				/>
				<Input type='text' placeholder='City' value={city}
					onChange={(evt) => { setCity(evt.target.value); }}
				/>
				<Input type='text' placeholder='State' value={state}
					onChange={(evt) => { setState(evt.target.value); }}
				/>
			</FormGroup>
		);
	}

	
	return (
		<Form onSubmit={handleSubmit}>
			{emailSection}
			<FormGroup>
				<Input type='text' placeholder='Name' value={name} autoFocus={!props.useEmail && !props.useAddress}
					onChange={(evt) => { setName(evt.target.value); }}
				/>
			</FormGroup>
			{addressSection}

			<PaymentElement onReady={()=>{setElementReady(true);}} fields={peFields}  />
			<LoadingSpinner className='m-auto' loading={!elementReady} />
			<FormGroup row className='mt-4'>
				<Button disabled={(!elementReady) || (operationPending)} className='w-100' type='submit' color='secondary'>{buttonLabel}</Button>
				{cancelable ? 
					<Button type='button' color='link' className='w-100 mt-3' onClick={props.onClose}>Cancel</Button> : null
				}
			</FormGroup>
			{/* {errorMessage && <div>{errorMessage}</div>} */}
			<Notifier {...paymentNotification} />
		</Form>
	)
}
PECheckoutForm.propTypes = {
	callbacks: PropTypes.shape({
		setOperationPending: PropTypes.func.isRequired,
		handleConfirmIntent: PropTypes.func.isRequired,
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
	const { stripe, stripeIntent, cancel, storageState } = props;
	log.debug('PaymentElementModal render');
	log.debug(props);

	const handleClose = () => {
		cancel();
	};
	
	if (!stripeIntent) {
		log.debug('no stripeIntent, returning null PaymentElementModal');
		return null;
	}

	log.debug(stripeIntent);
	log.debug(stripeIntent.client_secret);

	const options = {
		clientSecret: stripeIntent.client_secret,
		// Fully customizable with appearance API.
		appearance: {
			theme: 'stripe'
		},
	};

	//add a key for Elements so we can update it when the paymentIntent changes
	const key = stripeIntent.client_secret;

	return (
		<div className='payment-chooser'>
			<Card>
				<CardBody>
					<Elements {...{stripe, options, key}}>
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
	callbacks: PropTypes.shape({
		setOperationPending: PropTypes.func.isRequired,
		setNotification: PropTypes.func.isRequired,
		handleConfirmIntent: PropTypes.func.isRequired,
	}),
	operationPending: PropTypes.bool.isRequired,
	buttonLabel: PropTypes.string,
	cancelable: PropTypes.bool,
	returnUrl: PropTypes.string.isRequired,
};
PaymentElementModal.defaultProps = {
	buttonLabel: 'Confirm',
	useEmail: false,
	useAddress: false,
	cancelable: true,
};

export { PaymentElementModal };
