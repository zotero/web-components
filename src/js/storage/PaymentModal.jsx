import { log as logger } from '../Log.js';
var log = logger.Logger('PaymentModal', 1);

// CheckoutForm.js
import { useState, useContext } from 'react';
import { Elements, injectStripe, CardElement, IbanElement, PaymentRequestButtonElement } from 'react-stripe-elements';
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

		let tokenData = {
			name,
			address_line1: address1,
			address_line2: address2,
			address_city: city,
			address_state: state,
		};
		
		/*
		let sourceData = {
			type: 'card',
			currency: 'usd',
			owner: {
				name,
				email,
				address: {
					line1: address1,
					line2: address2,
				}
			},
		};
		*/
		
		// Within the context of `Elements`, this call to createToken knows which Element to
		// tokenize, since there's only one in this group.
		let result = await props.stripe.createToken(tokenData);
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
	stripe: PropTypes.object.isRequired,
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
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	
	let handleSubmit = async (ev) => {
		// We don't want to let default form submission happen here, which would refresh the page.
		ev.preventDefault();

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
		let result = await props.stripe.createToken(sourceData);
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
					supportedCountries={['SEPA']}
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
	stripe: PropTypes.object.isRequired,
	label: PropTypes.string,
	onClose: PropTypes.func.isRequired
};

function _PaymentRequestForm(props) {
	const { stripe, paymentAmount, handleToken } = props;
	const [canMakePayment, setCanMakePayment] = useState(false);
	const [paymentRequest, setPaymentRequest] = useState(null);

	if (paymentRequest === null) {
		const paymentRequest = stripe.paymentRequest({
			country: 'US',
			currency: 'usd',
			total: {
				label: 'Zotero Storage',
				amount: paymentAmount,
				requestPayerName: true,
				requestPayerEmail: true,
			},
		});

		paymentRequest.on('token', ({ complete, token, ...data }) => {
			log.debug('Received Stripe token in PaymentRequestForm: ', token);
			log.debug('Received customer information: ', data);
			handleToken(token);
			complete('success');
		});

		setPaymentRequest(paymentRequest);
		log.debug(paymentRequest);
		paymentRequest.canMakePayment().then((result) => {
			log.debug('paymentRequest canMakePayment:');
			log.debug(result);
			setCanMakePayment(!!result);
			log.debug(paymentRequest);
		});
	}

	if (!canMakePayment) return null;

	return (
		<PaymentRequestButtonElement
			className='PaymentRequestButton'
			paymentRequest={paymentRequest}
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
	stripe: PropTypes.object.isRequired,
	label: PropTypes.string,
	onClose: PropTypes.func.isRequired
};

const InjectedPaymentRequestForm = injectStripe(_PaymentRequestForm);
const InjectedCardCheckoutForm = injectStripe(CardCheckoutForm);
const InjectedIBANCheckoutForm = injectStripe(IBANCheckoutForm);

function MultiPaymentModal(props) {
	const [selectedMethod, setMethod] = useState('card');
	const { handleToken, chargeAmount, buttonLabel, useEmail, useAddress } = props;
	const { paymentDispatch } = useContext(PaymentContext);
	const handleClose = () => {
		paymentDispatch(cancelPurchase());
	};

	let paymentRequest = null;
	if (chargeAmount) {
		paymentRequest = (
			<Elements>
				<InjectedPaymentRequestForm handleToken={handleToken} paymentAmount={chargeAmount} onClose={handleClose} />
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
									<Elements>
										<InjectedCardCheckoutForm handleToken={handleToken} buttonLabel={buttonLabel} onClose={handleClose} useEmail={useEmail} useAddress={useAddress} />
									</Elements>
								</Col>
							</Row>
						</TabPane>
						<TabPane tabId='sepa'>
							<Row>
								<Col sm='12'>
									<Elements>
										<InjectedIBANCheckoutForm handleToken={handleToken} buttonLabel={buttonLabel} onClose={handleClose} />
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
};
MultiPaymentModal.defaultProps = {
	buttonLabel: 'Confirm'
};

function CardPaymentModal(props) {
	const { handleToken, chargeAmount, buttonLabel, useEmail, useAddress } = props;
	const { paymentDispatch } = useContext(PaymentContext);
	const handleClose = () => {
		paymentDispatch(cancelPurchase());
	};

	let paymentRequest = null;
	if (chargeAmount) {
		paymentRequest = (
			<Elements>
				<InjectedPaymentRequestForm handleToken={handleToken} paymentAmount={chargeAmount} onClose={handleClose} useEmail={useEmail} useAddress={useAddress} />
			</Elements>
		);
	}
	return (
		<div className='payment-chooser'>
			<Card>
				<CardBody>
					{paymentRequest}
					<Elements>
						<InjectedCardCheckoutForm handleToken={handleToken} buttonLabel={buttonLabel} onClose={handleClose} useEmail={useEmail} useAddress={useAddress} />
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
};
CardPaymentModal.defaultProps = {
	buttonLabel: 'Confirm',
	useEmail: false,
	useAddress: false,
};

export { MultiPaymentModal, CardPaymentModal };
