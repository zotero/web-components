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
				<span className='name'>{name}</span><br />
				<span className='line1'>{line1}</span><br />
				<span className='line2'>{line2 ? [line2, <br />]  : ''}</span>
				<span className='city'>{city ? `${city}, ` : ''}</span>
				<span className='state'>{state ? `${state}, ` : ''}</span>
				<span className='postal'>{postal_code ? `${postal_code}` : ' '} </span>
				<span className='country'>{country}</span>
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
					Exp: <b>{card.exp_year}-{String(card.exp_month).padStart(2, '0')}</b>
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
					IBAN: <b>{getFlagEmoji(iban.country)} {iban.country} *****-{iban.last4}</b>
				</Col>
			</Row>
		</div>
	);
}
Iban.propTypes = {
	iban: PropTypes.object.isRequired
};

function Ideal(props) {
	const {ideal} = props;
	log.debug(ideal);

	return (
		<div className='stripe-ideal'>
			<Row>
				<Col>
					Bank: <b>{ideal.bank}</b>
				</Col>
			</Row>
			<Row>
				<Col>
					BIC: <b>{ideal.bic}</b>
				</Col>
			</Row>
		</div>
	);
}
function PaymentMethod(props) {
	const { source } = props;
	log.debug(source);
	if (!source) {
		return <p>No payment method saved</p>;
	}

	let type = source.type;

	log.debug(`type: ${type}`);
	switch (type) {
	case 'sepa_debit':
		return (
			<>
				<BillingDetails {...source.billing_details} />
				Payment Type: SEPA Debit
				<Iban iban={source.sepa_debit} />
			</>
		);
	case 'card':
		return (
			<>
				<BillingDetails {...source.billing_details} />
				Payment Type: Card
				<Card card={source.card} />
			</>
		);
	case 'ideal':
		return (
			<>
				<BillingDetails {...source.billing_details} />
				Payment Type: iDEAL
				<Ideal ideal={source.ideal} />
			</>
		)
	default:
		log.warn('Unknown source type passed to PaymentMethod');
		return (
			<>
				<BillingDetails {...source.billing_details} />
				Payment Type: {type}
			</>
		);
	}
}
PaymentMethod.propTypes = {
	source: PropTypes.oneOfType([PropTypes.object, PropTypes.bool])
};

export {PaymentMethod};
