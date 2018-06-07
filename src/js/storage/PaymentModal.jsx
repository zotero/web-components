'use strict';

import {log as logger} from '../Log.js';
var log = logger.Logger('PaymentModal');

// CheckoutForm.js
import {Component, Fragment} from 'react';
import {Elements, injectStripe, CardElement, AddressElement, IbanElement, PaymentRequestButtonElement} from 'react-stripe-elements';
import {Card, CardHeader, CardBody, TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Input } from 'reactstrap';
import PropTypes from 'prop-types';

class AddressSection extends Component {
	render() {
		return (
			<Fragment>
				<label>Address</label>
				<AddressElement style={{base: {fontSize: '18px'}}} />
			</Fragment>
		);
	}
};

class CardSection extends Component {
	render() {
		return (
			<Fragment>
				<CardElement />
			</Fragment>
		);
	}
};

class CardCheckoutForm extends Component {
	handleSubmit = (ev) => {
		const {name} = this.state;
		// We don't want to let default form submission happen here, which would refresh the page.
		ev.preventDefault();

		// Within the context of `Elements`, this call to createToken knows which Element to
		// tokenize, since there's only one in this group.
		this.props.stripe.createToken({name}).then(({token}) => {
			console.log('Received Stripe token in CardCheckoutForm:', token);
			this.props.handleToken(token);
		});

		// However, this line of code will do the same thing:
		// this.props.stripe.createToken({type: 'card', name: 'Jenny Rosen'});
	}

	render() {
		return (
			<form onSubmit={this.handleSubmit}>
				<div className='form-group'>
					<Input type='text' placeholder='Name'
						onChange={(evt)=>{this.setState({name:evt.target.value});}}
					/>
				</div>
				<div className='form-group'>
					<CardSection />
				</div>
				<div className='form-group'>
					<button className='btn btn-secondary'>Confirm order</button>
				</div>
			</form>
		);
	}
}
CardCheckoutForm.props = {
	handleToken: PropTypes.func.isRequired
};

class IBANCheckoutForm extends Component {
	handleSubmit = (ev) => {
		// We don't want to let default form submission happen here, which would refresh the page.
		ev.preventDefault();

		const {name, email} = this.state;

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
		// Within the context of `Elements`, this call to createToken knows which Element to
		// tokenize, since there's only one in this group.
		this.props.stripe.createSource(sourceData).then((result) => {
			console.log('Received result from createSource in IBANCheckoutForm:', result);
			if(result.error) {
				console.log('got an error.', result.error);
			} else if(result.source){
				console.log('got a source:', result.source);
			}
			//this.props.handleSource(payload);
		});

		// However, this line of code will do the same thing:
		// this.props.stripe.createToken({type: 'card', name: 'Jenny Rosen'});
	}

	render() {
		return (
			<form onSubmit={this.handleSubmit}>
				<div className='form-group'>
					<Input type='text' placeholder='Name'
						onChange={(evt)=>{this.setState({name:evt.target.value});}}
					/>
				</div>
				<div className='form-group'>
					<IbanElement
						supportedCountries={['SEPA']}
					/>
					<p className='text-muted mt-3'>
						By providing your IBAN and confirming this payment, you’re authorizing Zotero and Stripe, our payment provider, to send instructions to your bank to debit your account. You’re entitled to a refund under the terms and conditions of your agreement with your bank.
					</p>
				</div>
				<div className='form-group'>
					<button className='btn btn-secondary'>Confirm order</button>
				</div>
			</form>
		);
	}
}

class _PaymentRequestForm extends Component{
	constructor(props) {
		super(props);

		const paymentRequest = props.stripe.paymentRequest({
			country: 'US',
			currency: 'usd',
			total: {
				label: 'Zotero Storage',
				amount: props.paymentAmount,
			},
		});

		paymentRequest.on('token', ({complete, token, ...data}) => {
			console.log('Received Stripe token in PaymentRequestForm: ', token);
			console.log('Received customer information: ', data);
			this.props.handleToken(token);
			complete('success');
		});

		paymentRequest.canMakePayment().then((result) => {
			this.setState({canMakePayment: !!result});
		});

		this.state = {
			canMakePayment: false,
			paymentRequest,
		};
	}

	render() {
		log.debug('PaymentRequest render');
		log.debug(this.state);
		return this.state.canMakePayment ? (
			<PaymentRequestButtonElement
				className="PaymentRequestButton"
				onBlur={handleBlur}
				onClick={handleClick}
				onFocus={handleFocus}
				onReady={handleReady}
				paymentRequest={this.state.paymentRequest}
				style={{
					paymentRequestButton: {
						theme: 'dark',
						height: '64px',
						type: 'donate',
					},
				}}
			/>
		) : null;
	}
}
_PaymentRequestForm.propTypes = {
	canMakePayments: PropTypes.bool,
	paymentRequest: PropTypes.object
};

const InjectedPaymentRequestForm = injectStripe(_PaymentRequestForm);
let InjectedCardCheckoutForm = injectStripe(CardCheckoutForm);
let InjectedIBANCheckoutForm = injectStripe(IBANCheckoutForm);

class PaymentModal extends Component {
	constructor(props){
		super(props);
		this.state = {
			selectedMethod:'card'
		}
	}
	setPaymentChoice = (choice) => {
		this.setState({selectedMethod:choice});
	}
	render(){
		const {selectedMethod} = this.state;
		const {handleToken} = this.props;

		return (
			<div className='payment-chooser'>
				<Card>
					<CardHeader>
						<Elements>
							<InjectedPaymentRequestForm handleToken={handleToken} />
						</Elements>
						<Nav card tabs>
							<NavItem>
								<NavLink active={(selectedMethod == 'card')} onClick={()=>{this.setPaymentChoice('card')}} href='#'>
									Card
								</NavLink>
							</NavItem>
							<NavItem>
								<NavLink active={(selectedMethod == 'sepa')} onClick={()=>{this.setPaymentChoice('sepa')}} href='#'>
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
											<InjectedCardCheckoutForm handleToken={handleToken} />
										</Elements>
									</Col>
								</Row>
							</TabPane>
							<TabPane tabId="sepa">
								<Row>
									<Col sm="12">
										<Elements>
											<InjectedIBANCheckoutForm handleToken={handleToken} />
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
}
PaymentModal.propTypes = {
	tokenCallback:PropTypes.func,
	amount:PropTypes.number,
	immediateCharge:PropTypes.bool
}

export default PaymentModal;
