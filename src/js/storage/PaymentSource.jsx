'use strict';

import {log as logger} from '../Log.js';
var log = logger.Logger('PaymentSource');

import {Component, Fragment} from 'react';
import cn from 'classnames';
import PropTypes from 'prop-types';
import {Row, Col} from 'reactstrap';

class Card extends Component {
	render(){
		const {card} = this.props;

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
}

class Iban extends Component {
	render(){
		const {iban} = this.props;
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
}

class PaymentSource extends Component {
	render() {
		const {source} = this.props;
		log.debug(source);
		let type = source.type;
		if(!type && source.object){
			type = source.object;
		}

		switch(type){
			case 'card':
				return <Card card={source} />
				break;
			case 'sepa_debit':
				return <Iban iban={source} />
				break;
			default:
				return null;
				//throw 'unknown source type';
		}
	}
}

export {PaymentSource};
