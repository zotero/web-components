import {log as logger} from '../Log.js';
var log = logger.Logger('PaymentSource');

import {Row, Col} from 'reactstrap';
import { getFlagEmoji } from '../Utils.js';
import PropTypes from 'prop-types';

function Card(props) {
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
					<b>{getFlagEmoji(iban.country)} {iban.country} ****-****-**** {iban.last4}</b>
				</Col>
			</Row>
		</div>
	);
}
Iban.propTypes = {
	iban: PropTypes.object.isRequired
};

function PaymentSource(props) {
	const { source } = props;
	if (!source) {
		return <p>No payment method saved</p>;
	}
	
	log.debug(source);
	let type = source.type;
	if (source.object == 'payment_method') {
		if (source.type == 'card') {
			type = 'paymentMethodCard';
		}
	} else if (!type && source.object) {
		type = source.object;
	}

	log.debug(`type: ${type}`);
	switch (type) {
	case 'card':
		return <Card card={source} />;
	case 'sepa_debit':
		return <Iban iban={source.sepa_debit} />;
	case 'paymentMethodCard':
		return <Card card={source.card} />;
	default:
		log.error('Unknown source type passed to PaymentSource');
		return null;
	}
}
PaymentSource.propTypes = {
	source: PropTypes.object
};

export {PaymentSource};
