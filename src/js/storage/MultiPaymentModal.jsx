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

function IBANCheckoutForm(props) {
	if (typeof props.handleConfirm != 'function') {
		log.error('props error in IBANCheckoutForm: handleConfirm must be function');
	}
	
	const stripe = window.stripe;// useStripe();
	const elements = useElements();

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [address1, setAddress1] = useState('');
	const [address2, setAddress2] = useState('');
	const [city, setCity] = useState('');
	const [state, setState] = useState('');
	const [notification, setNotification] = useState(null);

	const elementOptions = {
		supportedCountries: ['SEPA']
	};

	const handleSubmit = async (ev) => {
		ev.preventDefault();

		props.setOperationPending(true);
		// Use elements.getElement to get a reference to the mounted Element.
		const ibanElement = elements.getElement(IbanElement);
		
		let billingDetails = {
			name,
			email,
		};
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
			type: 'sepa_debit',
			sepa_debit: ibanElement,
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
		let sourceData = {
			type: 'sepa_debit',
			currency: 'eur',
			owner: {
				name,
				email,
			},
			mandate: {
				// Automatically send a mandate notification email to your customer
				// once the source is charged.
				notification_method: 'email',
			},
		};
		let result = await stripe.createToken(ibanElement, sourceData);
		if (result.token) {
			props.handleToken(result.token);
		} else if (result.error) {
			log.error(result.error);
			throw result.error;
		}
*/
	};
	
	const buttonLabel = props.label || 'Confirm Order';

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
			<FormGroup>
				<Input type='text' placeholder='Name' value={name}
					onChange={(evt) => { setName(evt.target.value); }}
				/>
			</FormGroup>
			<FormGroup>
				<Input type='text' placeholder='Email' value={email}
					onChange={(evt) => { setEmail(evt.target.value); }}
				/>
			</FormGroup>
			{addressSection}
			<FormGroup>
				<IbanElement
					options={elementOptions}
				/>
				<p className='text-muted mt-3'>
					By providing your IBAN and confirming this payment, you’re authorizing Zotero and Stripe, our payment provider, to send instructions to your bank to debit your account. You’re entitled to a refund under the terms and conditions of your agreement with your bank.
				</p>
			</FormGroup>
			<FormGroup>
				<Button color='secondary'>{buttonLabel}</Button>
				<Button type='button' color='secondary' className='ml-2' onClick={props.onClose}>Cancel</Button>
			</FormGroup>
		</Form>
	);
}
IBANCheckoutForm.propTypes = {
	// handleToken: PropTypes.func.isRequired,
	label: PropTypes.string,
	onClose: PropTypes.func.isRequired,
	setOperationPending: PropTypes.func.isRequired,
	handleConfirm: PropTypes.func.isRequired,
	useAddress: PropTypes.bool,
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

function MultiPaymentModal(props) {
	const [selectedMethod, setMethod] = useState('card');
	const { stripe, handleConfirm, immediateChargeRequired, chargeAmount, chargeDescription, buttonLabel, useEmail, useAddress } = props;
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
					onClose={handleClose}
				/>
			</Elements>
		);
	}
	
	return (
		<div className='payment-chooser'>
			<Card>
				<CardHeader>
					{paymentRequest}
					<Nav card tabs>
						<NavItem>
							<NavLink active={(selectedMethod == 'card')} onClick={() => { setMethod('card'); }} href='#'>
								Card
							</NavLink>
						</NavItem>
						<NavItem>
							<NavLink active={(selectedMethod == 'sepa')} onClick={() => { setMethod('sepa'); }} href='#'>
								SEPA Direct Debit
							</NavLink>
						</NavItem>
					</Nav>
				</CardHeader>
				<CardBody>
					<TabContent activeTab={selectedMethod}>
						<TabPane tabId='card'>
							<Row>
								<Col sm='12'>
									<Elements stripe={stripe}>
										<CardCheckoutForm
											{...props}
											purchase={purchase}
											onClose={handleClose}
										/>
										{/*<CardCheckoutForm handleToken={handleToken} buttonLabel={buttonLabel} onClose={handleClose} useEmail={useEmail} useAddress={useAddress} />*/}
									</Elements>
								</Col>
							</Row>
						</TabPane>
						<TabPane tabId='sepa'>
							<Row>
								<Col sm='12'>
									<Elements stripe={stripe}>
										<IBANCheckoutForm
											{...props}
											purchase={purchase}
											onClose={handleClose}
										/>
										{/*<IBANCheckoutForm handleToken={handleToken} buttonLabel={buttonLabel} onClose={handleClose} />*/}
									</Elements>
								</Col>
							</Row>
						</TabPane>
					</TabContent>
				</CardBody>
			</Card>
		</div>
	);
}
MultiPaymentModal.propTypes = {
	// handleToken: PropTypes.func.isRequired,
	chargeAmount: PropTypes.number.isRequired,
	buttonLabel: PropTypes.string,
	tokenCallback: PropTypes.func,
	amount: PropTypes.number,
	immediateCharge: PropTypes.bool,
	useEmail: PropTypes.bool,
	useAddress: PropTypes.bool,
	stripe: PropTypes.object.isRequired,
};
MultiPaymentModal.defaultProps = {
	buttonLabel: 'Confirm'
};


export { MultiPaymentModal };
