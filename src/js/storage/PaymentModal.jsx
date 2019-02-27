'use strict';

import {log as logger} from '../Log.js';
var log = logger.Logger('PaymentModal');

// CheckoutForm.js
import {useState} from 'react';
import {Elements, injectStripe, CardElement, IbanElement, PaymentRequestButtonElement} from 'react-stripe-elements';
import {Button, Card, CardHeader, CardBody, TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Input, Form, FormGroup } from 'reactstrap';
import PropTypes from 'prop-types';

/*
class AddressSection extends Component {
	render() {
		return (
			<Fragment>
				<label>Address</label>
				<AddressElement style={{base: {fontSize: '18px'}}} />
			</Fragment>
		);
	}
}
*/
function CardSection() {
	return (
		<CardElement />
	);
}

function CardCheckoutForm(props){
	if(typeof props.handleToken != 'function'){
		log.error('props error in CardCheckoutForm: handleToken must be function');
	}
	const [name, setName] = useState('');
	const handleSubmit = async (ev) => {
		ev.preventDefault();

		// Within the context of `Elements`, this call to createToken knows which Element to
		// tokenize, since there's only one in this group.
		let result = await props.stripe.createToken({name});
		if(result.token){
			log.debug('Received Stripe token in CardCheckoutForm:'+ result);
			log.debug(result.token);
			props.handleToken(result.token);
		} else if(result.error){
			log.error(result.error);
			throw result.error;
		}
	};
	const buttonLabel = props.buttonLabel || 'Confirm Order';

	return (
		<Form onSubmit={handleSubmit}>
			<FormGroup>
				<Input type='text' placeholder='Name' value={name}
					onChange={(evt)=>{setName(evt.target.value);}}
				/>
			</FormGroup>
			<FormGroup>
				<CardSection />
			</FormGroup>
			<FormGroup>
				<Button type='submit' color='secondary'>{buttonLabel}</Button>
				<Button type='button' color='secondary' className='ml-2' onClick={props.onClose}>Cancel</Button>
			</FormGroup>
		</Form>
	);
}
CardCheckoutForm.props = {
	handleToken: PropTypes.func.isRequired
};


function IBANCheckoutForm(props) {
	if(typeof props.handleToken != 'function'){
		log.error('props error in CardCheckoutForm: handleToken must be function');
	}
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	
	let handleSubmit = async (ev) => {
		// We don't want to let default form submission happen here, which would refresh the page.
		ev.preventDefault();

		/*
		var sourceData = {
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
		*/
		let result = await props.stripe.createToken({name});
		if(result.token){
			//log.debug('Received Stripe token in IBANCheckoutForm:'+ result);
			//log.debug(result.token);
			props.handleToken(result.token);
		} else if(result.error){
			log.error(result.error);
			throw result.error;
		}
		return;
	};
	
	const buttonLabel = props.label || 'Confirm Order';

	return (
		<Form onSubmit={handleSubmit}>
			<FormGroup>
				<Input type='text' placeholder='Name' value={name}
					onChange={(evt)=>{setName(evt.target.value);}}
				/>
			</FormGroup>
			<FormGroup>
				<Input type='text' placeholder='Email' value={email}
					onChange={(evt)=>{setEmail(evt.target.value);}}
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

function _PaymentRequestForm(props){
	const {stripe, paymentAmount, handleToken} = props;
	const [canMakePayment, setCanMakePayment] = useState(false);
	const [paymentRequest, setPaymentRequest] = useState(null);

	if(paymentRequest == null){
		const paymentRequest = stripe.paymentRequest({
			country: 'US',
			currency: 'usd',
			total: {
				label: 'Zotero Storage',
				amount: paymentAmount,
			},
		});

		paymentRequest.on('token', ({complete, token, ...data}) => {
			log.debug('Received Stripe token in PaymentRequestForm: ', token);
			log.debug('Received customer information: ', data);
			handleToken(token);
			complete('success');
		});

		setPaymentRequest(paymentRequest);
		paymentRequest.canMakePayment().then(({result})=>{
			setCanMakePayment(!!result);
		});
	}

	if (!canMakePayment) return null;

	return (
		<PaymentRequestButtonElement
			className="PaymentRequestButton"
			/*
			onBlur={handleBlur}
			onClick={handleClick}
			onFocus={handleFocus}
			onReady={handleReady}
			*/
			paymentRequest={this.state.paymentRequest}
			style={{
				paymentRequestButton: {
					theme: 'dark',
					height: '64px',
					type: 'donate',
				},
			}}
		/>
	);
}

const InjectedPaymentRequestForm = injectStripe(_PaymentRequestForm);
const InjectedCardCheckoutForm = injectStripe(CardCheckoutForm);
const InjectedIBANCheckoutForm = injectStripe(IBANCheckoutForm);

function PaymentModal(props){
	const [selectedMethod, setMethod] = useState('card');
	const {handleToken, chargeAmount, buttonLabel} = props;
	log.debug(props);

	let paymentRequest = null;
	if(chargeAmount) {
		paymentRequest = (
			<Elements>
				<InjectedPaymentRequestForm handleToken={handleToken} paymentAmount={chargeAmount} onClose={props.onClose} />
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
							<NavLink active={(selectedMethod == 'card')} onClick={()=>{setMethod('card');}} href='#'>
								Card
							</NavLink>
						</NavItem>
						<NavItem>
							<NavLink active={(selectedMethod == 'sepa')} onClick={()=>{setMethod('sepa');}} href='#'>
								SEPA Direct Debit
							</NavLink>
						</NavItem>
					</Nav>
				</CardHeader>
				<CardBody>
					<TabContent activeTab={selectedMethod}>
						<TabPane tabId="card">
							<Row>
								<Col sm="12">
									<Elements>
										<InjectedCardCheckoutForm handleToken={handleToken} buttonLabel={buttonLabel} onClose={props.onClose} />
									</Elements>
								</Col>
							</Row>
						</TabPane>
						<TabPane tabId="sepa">
							<Row>
								<Col sm="12">
									<Elements>
										<InjectedIBANCheckoutForm handleToken={handleToken} buttonLabel={buttonLabel} onClose={props.onClose} />
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
PaymentModal.propTypes = {
	tokenCallback:PropTypes.func,
	amount:PropTypes.number,
	immediateCharge:PropTypes.bool
};
PaymentModal.defaultProps = {
	buttonLabel:'Confirm'
};

export default PaymentModal;
