import { log as logger } from '../Log.js';
var log = logger.Logger('PaymentModal', 1);

// CheckoutForm.js
import { useState, useEffect, useContext } from 'react';
import { Elements, useElements, CardElement, IbanElement, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { Button, Card, CardHeader, CardBody, TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Input, Form, FormGroup } from 'reactstrap';
import { Notifier } from '../Notifier.js';
import PropTypes from 'prop-types';
import { PaymentContext, cancelPurchase } from './actions.js';

function CardSection(props) {
	return (
		<CardElement onChange={props.onChange} />
	);
}
CardSection.propTypes = {
	onChange: PropTypes.func,
};

function CardCheckoutForm(props) {
	if (typeof props.handleToken != 'function') {
		log.error('props error in CardCheckoutForm: handleToken must be function');
	}
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

		// Use elements.getElement to get a reference to the mounted Element.
		const cardElement = elements.getElement(CardElement);
		
		let tokenData = {
			name,
			address_line1: address1,
			address_line2: address2,
			address_city: city,
			address_state: state,
		};
		
		// create a token using the card element
		let result = await stripe.createToken(cardElement, tokenData);
		if (result.token) {
			props.handleToken(result.token);
		} else if (result.error) {
			log.error(result.error);
			throw result.error;
		}
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
	handleToken: PropTypes.func.isRequired,
	buttonLabel: PropTypes.string,
	onClose: PropTypes.func.isRequired,
	useEmail: PropTypes.bool,
	useAddress: PropTypes.bool,
};
CardCheckoutForm.defaultProps = {
	useEmail: false,
	useAddress: false,
};


function IBANCheckoutForm(props) {
	if (typeof props.handleToken != 'function') {
		log.error('props error in CardCheckoutForm: handleToken must be function');
	}
	const stripe = window.stripe;// useStripe();
	const elements = useElements();

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');

	const elementOptions = {
		supportedCountries: ['SEPA']
	};

	let handleSubmit = async (ev) => {
		// We don't want to let default form submission happen here, which would refresh the page.
		ev.preventDefault();

		// Use elements.getElement to get a reference to the mounted Element.
		const ibanElement = elements.getElement(IbanElement);

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
	};
	
	const buttonLabel = props.label || 'Confirm Order';

	return (
		<Form onSubmit={handleSubmit}>
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
	handleToken: PropTypes.func.isRequired,
	label: PropTypes.string,
	onClose: PropTypes.func.isRequired
};

function _PaymentRequestForm(props) {
	if (typeof props.handleToken != 'function') {
		log.error('props error in CardCheckoutForm: handleToken must be function');
	}
	
	const { paymentAmount, handleToken } = props;
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
					amount: paymentAmount,
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
	}, [stripe, handleToken, paymentAmount]);

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
	paymentAmount: PropTypes.number.isRequired,
	handleToken: PropTypes.func.isRequired,
	label: PropTypes.string,
	onClose: PropTypes.func.isRequired
};

function MultiPaymentModal(props) {
	const [selectedMethod, setMethod] = useState('card');
	const { stripe, handleToken, chargeAmount, buttonLabel, useEmail, useAddress } = props;
	const { paymentDispatch } = useContext(PaymentContext);
	const handleClose = () => {
		paymentDispatch(cancelPurchase());
	};

	let paymentRequest = null;
	if (chargeAmount) {
		paymentRequest = (
			<Elements stripe={stripe}>
				<_PaymentRequestForm handleToken={handleToken} paymentAmount={chargeAmount} onClose={handleClose} />
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
										<CardCheckoutForm handleToken={handleToken} buttonLabel={buttonLabel} onClose={handleClose} useEmail={useEmail} useAddress={useAddress} />
									</Elements>
								</Col>
							</Row>
						</TabPane>
						<TabPane tabId='sepa'>
							<Row>
								<Col sm='12'>
									<Elements stripe={stripe}>
										<IBANCheckoutForm handleToken={handleToken} buttonLabel={buttonLabel} onClose={handleClose} />
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
	handleToken: PropTypes.func.isRequired,
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

function CardPaymentModal(props) {
	const { stripe, handleToken, chargeAmount, buttonLabel, useEmail, useAddress } = props;
	const { paymentDispatch } = useContext(PaymentContext);
	const handleClose = () => {
		paymentDispatch(cancelPurchase());
	};

	let paymentRequest = null;
	if (chargeAmount) {
		paymentRequest = (
			<Elements stripe={stripe}>
				<_PaymentRequestForm handleToken={handleToken} paymentAmount={chargeAmount} onClose={handleClose} useEmail={useEmail} useAddress={useAddress} />
			</Elements>
		);
	}
	return (
		<div className='payment-chooser'>
			<Card>
				<CardBody>
					{paymentRequest}
					<Elements stripe={stripe}>
						<CardCheckoutForm handleToken={handleToken} buttonLabel={buttonLabel} onClose={handleClose} useEmail={useEmail} useAddress={useAddress} />
					</Elements>
				</CardBody>
			</Card>
		</div>
	);
}
CardPaymentModal.propTypes = {
	handleToken: PropTypes.func.isRequired,
	chargeAmount: PropTypes.number.isRequired,
	buttonLabel: PropTypes.string,
	tokenCallback: PropTypes.func,
	amount: PropTypes.number,
	immediateCharge: PropTypes.bool,
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
