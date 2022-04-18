/* eslint-disable camelcase */
import { log as logger } from '../Log.js';
var log = logger.Logger('PaymentModal', 1);

// CheckoutForm.js
import { useState, useEffect, useContext } from 'react';
import { Elements, useElements, CardElement, IbanElement, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { Button, Card, CardHeader, CardBody, TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Input, Form, FormGroup } from 'reactstrap';
import { Notifier } from '../Notifier.js';
import PropTypes from 'prop-types';
import { PaymentContext, cancelPurchase } from './actions.js';
// import { ajax } from '../ajax.js';

function CardSection(props) {
	return (
		<CardElement onChange={props.onChange} />
	);
}
CardSection.propTypes = {
	onChange: PropTypes.func,
};

function CardCheckoutForm(props) {
	// if (typeof props.handleToken != 'function') {
	// 	log.error('props error in CardCheckoutForm: handleToken must be function');
	// }
	if (typeof props.handleConfirm != 'function') {
		log.error('props error in CardCheckoutForm: handleConfirm must be function');
	}
	// const { chargeAmount, chargeDescription, purchase } = props;
	const stripe = window.stripe;// useStripe();
	const elements = useElements();

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [address1, setAddress1] = useState('');
	const [address2, setAddress2] = useState('');
	const [city, setCity] = useState('');
	const [state, setState] = useState('');
	// const [cardStatus, setCardStatus] = useState(null);
	const [notification, setNotification] = useState(null);
	
	const handleSubmit = async (ev) => {
		ev.preventDefault();

		props.setOperationPending(true);
		// Use elements.getElement to get a reference to the mounted Element.
		const cardElement = elements.getElement(CardElement);
		
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
		
		// create paymentMethod using the card element
		let result = await stripe.createPaymentMethod({
			type: 'card',
			card: cardElement,
			billing_details: billingDetails,
		});
		if (result.error) {
			log.error(result.error);
			setNotification({ type: 'error', message: 'Error with your payment method' });
			props.setOperationPending(false);
		} else {
			props.handleConfirm(result.paymentMethod);
		}
		return;

		/*
		if (result.token) {
			props.handleToken(result.token);
		} else if (result.error) {
			log.error(result.error);
			throw result.error;
		}
		*/

		/*
		let storageLevel = (purchase && purchase.storageLevel) ? purchase.storageLevel : null;
		// let paymentIntentClientSecret = await beginIntent(chargeAmount, chargeDescription, storageLevel, props.immediateChargeRequired);
		let paymentIntentClientSecret = await beginIntent(purchase);
		
		let tokenData = {
			name,
			address_line1: address1,
			address_line2: address2,
			address_city: city,
			address_state: state,
		};
		
		// create a PaymentMethod using the card element
		// const paymentIntentClientSecret = props.paymentIntent.client_secret;
		log.debug('calling stripe.confirmCardPayment');
		log.debug(paymentIntentClientSecret);
		log.debug(cardElement);
		let result = await stripe.confirmCardPayment(paymentIntentClientSecret, {
			payment_method: {
				card: cardElement,
				billing_details: {
					name
				}
			}
		});
		log.debug(result);
		if (result.error) {
			setNotification({ type: 'error', message: cardData.error.message });
		} else if (result.paymentIntent) {
			// send completed paymentIntent to server so subscription can be updated
			log.debug(result.paymentIntent);
			let confirmResponse = await postFormData('/storage/confirmpayment', { intentID: result.paymentIntent.id });
			let confirmResult = await confirmResponse.json();
			log.debug(confirmResult);
			if (confirmResult.requires_action) {
				// TODO: have stripe confirm
			} else if (confirmResult.success) {
				log.debug('Got successful confirmation');
				props.handleConfirm(confirmResult);
			}
		}
		*/
		
		/*
		if (result.token) {
			props.handleToken(result.token);
		} else if (result.error) {
			log.error(result.error);
			throw result.error;
		}
		*/

		/*
		// create a token using the card element
		let result = await stripe.createToken(cardElement, tokenData);
		if (result.token) {
			props.handleToken(result.token);
		} else if (result.error) {
			log.error(result.error);
			throw result.error;
		}
		*/
	};
	const handleCardChange = (cardData) => {
		// setCardStatus(cardData);
		if (cardData.error) {
			setNotification({ type: 'error', message: cardData.error.message });
		} else {
			setNotification(null);
		}
	};

	const buttonLabel = props.buttonLabel || 'Confirm Order';
	
	let emailSection = null;
	if (props.useEmail) {
		emailSection = (
			<FormGroup>
				<Input type='email' placeholder='Email' value={email}
					onChange={(evt) => { setEmail(evt.target.value); }}
				/>
			</FormGroup>
		);
	}

	let addressSection = null;
	if (props.useAddress) {
		addressSection = (
			<FormGroup>
				<Input type='address' placeholder='Address' value={address1}
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
			<Notifier {...notification} />
			{emailSection}
			<FormGroup>
				<Input type='text' placeholder='Name' value={name}
					onChange={(evt) => { setName(evt.target.value); }}
				/>
			</FormGroup>
			{addressSection}
			<FormGroup>
				<CardSection onChange={handleCardChange} />
			</FormGroup>
			<FormGroup>
				<Button type='submit' color='secondary'>{buttonLabel}</Button>
				<Button type='button' color='secondary' className='ml-2' onClick={props.onClose}>Cancel</Button>
			</FormGroup>
		</Form>
	);
}
CardCheckoutForm.propTypes = {
	setOperationPending: PropTypes.func.isRequired,
	chargeAmount: PropTypes.number.isRequired,
	// chargeDescription: PropTypes.string.isRequired,
	// handleToken: PropTypes.func.isRequired,
	handleConfirm: PropTypes.func.isRequired,
	immediateChargeRequired: PropTypes.bool.isRequired,
	buttonLabel: PropTypes.string,
	onClose: PropTypes.func.isRequired,
	useEmail: PropTypes.bool,
	useAddress: PropTypes.bool,
	paymentIntent: PropTypes.object,
};
CardCheckoutForm.defaultProps = {
	useEmail: false,
	useAddress: false,
};

function _PaymentRequestForm(props) {
	if (typeof props.handleConfirm != 'function') {
		log.error('props error in _PaymentRequestForm: handleConfirm must be function');
	}
	
	const { chargeAmount, handleToken } = props;
	// const [canMakePayment, setCanMakePayment] = useState(false);
	const [paymentRequest, setPaymentRequest] = useState(null);

	const stripe = window.stripe;// useStripe();

	useEffect(() => {
		if (stripe) {
			const pr = stripe.paymentRequest({
				country: 'US',
				currency: 'usd',
				total: {
					label: 'Zotero Storage',
					amount: chargeAmount,
				},
				requestPayerName: true,
				requestPayerEmail: true,
			});

			pr.on('token', ({ complete, token, ...data }) => {
				log.debug('Received Stripe token in PaymentRequestForm: ', token);
				log.debug('Received customer information: ', data);
				handleToken(token);
				complete('success');
			});

			// Check the availability of the Payment Request API.
			pr.canMakePayment().then((result) => {
				if (result) {
					setPaymentRequest(pr);
				}
			});
		}
	}, [stripe, handleToken, chargeAmount]);

	if (paymentRequest === null) return null;

	return (
		<PaymentRequestButtonElement
			className='PaymentRequestButton'
			options={{ paymentRequest }}
			style={{
				paymentRequestButton: {
					theme: 'light',
					height: '64px',
					type: 'buy',
				},
			}}
		/>
	);
}
_PaymentRequestForm.propTypes = {
	chargeAmount: PropTypes.number.isRequired,
	// handleToken: PropTypes.func.isRequired,
	label: PropTypes.string,
	onClose: PropTypes.func.isRequired
};


function CardPaymentModal(props) {
	const { stripe, handleToken, handleConfirm, immediateChargeRequired, chargeAmount, chargeDescription, buttonLabel, useEmail, useAddress } = props;
	const { paymentDispatch, paymentState } = useContext(PaymentContext);
	// const { paymentIntent } = paymentState;
	const { purchase } = paymentState;
	
	const handleClose = () => {
		paymentDispatch(cancelPurchase());
	};

	let paymentRequest = null;
	if (chargeAmount) {
		paymentRequest = (
			<Elements stripe={stripe}>
				<_PaymentRequestForm
					{...props}
					purchase={purchase}
					// paymentIntent={paymentIntent}
					// handleToken={handleToken}
					/*
					handleConfirm={handleConfirm}
					immediateChargeRequired={immediateChargeRequired}
					chargeAmount={chargeAmount}
					chargeDescription={chargeDescription}
					purchase={purchase}
					useEmail={useEmail}
					useAddress={useAddress}*/
					onClose={handleClose}
				/>
			</Elements>
		);
	}
	return (
		<div className='payment-chooser'>
			<Card>
				<CardBody>
					{paymentRequest}
					<Elements stripe={stripe}>
						<CardCheckoutForm
							// paymentIntent={paymentIntent}
							// handleToken={handleToken}
							{...props}
							purchase={purchase}
							
							/*
							handleConfirm={handleConfirm}
							immediateChargeRequired={immediateChargeRequired}
							chargeAmount={chargeAmount}
							chargeDescription={chargeDescription}
							buttonLabel={buttonLabel}
							useEmail={useEmail}
							useAddress={useAddress}
							*/
							onClose={handleClose}
						/>
					</Elements>
				</CardBody>
			</Card>
		</div>
	);
}
CardPaymentModal.propTypes = {
	// handleToken: PropTypes.func.isRequired,
	handleConfirm: PropTypes.func.isRequired,
	setOperationPending: PropTypes.func,
	chargeAmount: PropTypes.number.isRequired,
	// chargeDescription: PropTypes.string.isRequired,
	buttonLabel: PropTypes.string,
	tokenCallback: PropTypes.func,
	immediateChargeRequired: PropTypes.bool.isRequired,
	useEmail: PropTypes.bool,
	useAddress: PropTypes.bool,
	stripe: PropTypes.object.isRequired,
};
CardPaymentModal.defaultProps = {
	buttonLabel: 'Confirm',
	useEmail: false,
	useAddress: false,
};

export { MultiPaymentModal, CardPaymentModal };
