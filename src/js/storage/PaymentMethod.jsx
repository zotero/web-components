import {log as logger} from '../Log.js';
var log = logger.Logger('PaymentMethod');

import {Row, Col} from 'reactstrap';
import { getFlagEmoji } from '../Utils.js';
import PropTypes from 'prop-types';


function BillingDetails(props) {
	log.debug(props);
	const { name, address, email } = props;
	const { line1, line2, city, state, postal_code, country } = address;
	return (
		<div id='billing_details'>
			<p>
				{name}<br />
				{line1}<br />
				{line2 ? (line2 + '<br />') : null}
				{city ? `${city}, ` : ''}
				{state ? `${state}, ` : ''}
				{postal_code + ' '} 
				{country}
			</p>
			<p>{email}</p>
		</div>
	);
}

function Card(props) {
	log.debug("**********Card");
	log.debug(props);
	const {card} = props;

	return (
		<div className='stripe-card'>
			<Row>
				<Col>
					<b>{card.brand} ****-****-****-{card.last4}</b>
				</Col>
			</Row>
			<Row>
				<Col>
					Exp: <b>{card.exp_year}-{card.exp_month}</b>
				</Col>
			</Row>
			<Row>
				<Col>
					Country: <b>{getFlagEmoji(card.country)} {card.country}</b>
				</Col>
			</Row>
		</div>
	);
}
Card.propTypes = {
	card: PropTypes.object.isRequired
};

function Iban(props) {
	const {iban} = props;
	log.debug(iban);

	return (
		<div className='stripe-iban'>
			<Row>
				<Col>
					IBAN: <b>{getFlagEmoji(iban.country)} {iban.country} ****-****-**** {iban.last4}</b>
				</Col>
			</Row>
		</div>
	);
}
Iban.propTypes = {
	iban: PropTypes.object.isRequired
};

function PaymentMethod(props) {
	const { source } = props;
	if (!source) {
		return <p>No payment method saved</p>;
	}

	if (source.object != 'payment_method') {
		log.error("PaymentMethod source object is not 'payment_method'");
		throw new Error("PaymentMethod source object is not 'payment_method'");
	}
	
	log.debug(source);
	let type = source.type;
	// if (source.object == 'payment_method') {
	// 	if (source.type == 'card') {
	// 		type = 'paymentMethodCard';
	// 	}
	// } else if (!type && source.object) {
	// 	type = source.object;
	// }

	log.debug(`type: ${type}`);
	switch (type) {
	/*
	case 'card':
		return (
			<>
				<BillingDetails {...source.billing_details} />
				<Card card={source.card} />
			</>
		);
	*/
	case 'sepa_debit':
		return (
			<>
				<BillingDetails {...source.billing_details} />
				SEPA Debit
				<Iban iban={source.sepa_debit} />
			</>
		);
	case 'card':
		return (
			<>
				<BillingDetails {...source.billing_details} />
				<Card card={source.card} />
			</>
		);
	default:
		log.error('Unknown source type passed to PaymentMethod');
		return (
			<>
				<BillingDetails {...source.billing_details} />
				{type}
			</>
		);
	}
}
PaymentMethod.propTypes = {
	source: PropTypes.object
};

export {PaymentMethod};
