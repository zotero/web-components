'use strict';

import {log as logger} from '../Log.js';
var log = logger.Logger('PaymentSource');

import {Row, Col} from 'reactstrap';
import PropTypes from 'prop-types';

function Card(props){
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
					<b>{iban}</b>
				</Col>
			</Row>
			<Row>
				<Col>
					Exp:
				</Col>
			</Row>
		</div>
	);
}
Iban.propTypes = {
	iban: PropTypes.object.isRequired
};

function PaymentSource(props){
	const {source} = props;
	let type = source.type;
	if(!type && source.object){
		type = source.object;
	}

	switch(type){
		case 'card':
			return <Card card={source} />;
		case 'sepa_debit':
			return <Iban iban={source} />;
		default:
			log.error('Unknown source type passed to PaymentSource');
			return null;
	}
}
PaymentSource.propTypes = {
	source: PropTypes.object.isRequired
};

export {PaymentSource};
