'use strict';

//TODO:
// allow one time contribution
// allow recurring contribution
//  - set up subscription tied to user, allow cancel, allow update payment details

import {log as logger} from '../Log.js';
let log = logger.Logger('Contribute');

import {useState, useReducer, useContext} from 'react';

import {Card, CardBody, Button, Row, Col, Form, CustomInput} from 'reactstrap';
import {Notifier} from '../Notifier.js';
// import PropTypes from 'prop-types';
// import {formatCurrency} from '../Utils.js';

import {PaymentContext, paymentReducer, NotifierContext, notifyReducer, UPDATE_PURCHASE} from '../storage/actions.js';
import { ContributionPaymentHandler } from './ContributionPaymentHandler.jsx';
import classnames from 'classnames';

function AmountCell(props){
	const {amount, label, currentAmount, setAmount} = props;
	const handleCustom = (evt) => {
		let nv = evt.target.value;
		nv = nv.replace(/\D/g,'');
		if(nv != ''){
			nv = parseInt(nv);
			if(isNaN(nv)){
				nv = 15;
			}
		}
		nv = nv*100;//convert to cents
		setAmount(nv);
	};
	if(amount == 'custom'){
		return (<div className={classnames('amount-cell', {'selected':(currentAmount == amount)})} onClick={()=>{setAmount(amount);}}>
			<p>Other</p>
			<p><CustomInput id='custom-amount' type='text' onChange={handleCustom} /></p>
		</div>);
	}
	return <div className={classnames('amount-cell', {'selected':(currentAmount == amount)})} onClick={()=>{setAmount(amount);}}>{label}</div>;
}

function Contribute(_props){
	const {paymentDispatch, paymentState} = useContext(PaymentContext);
	const {notifyDispatch} = useContext(NotifierContext);
	
	const {purchase} = paymentState;
	const [amount, setAmount] = useState(0);
	log.debug(amount);
	
	const contribute = () => {
		paymentDispatch({type:UPDATE_PURCHASE, purchase:{
			type:'contribution',
			amount,
		}});
	};
	/*
	const handleAmount = (evt) => {
		let nv = evt.target.value;
		nv = nv.replace(/\D/g,'');
		if(nv != ''){
			nv = parseInt(nv);
			if(isNaN(nv)){
				nv = 15;
			}
		}
		setAmount(nv);
	};
	*/
	let Payment = null;
	if(purchase){
		Payment = (<ContributionPaymentHandler
			purchase={purchase}
		/>);
	}

	return (
		<div>
			{Payment}
			<Card>
				<CardBody>
					<Row>
						<Col>
							<AmountCell currentAmount={amount} amount={1000} label="$10" setAmount={setAmount} />
							<AmountCell currentAmount={amount} amount={2000} label="$20" setAmount={setAmount} />
							<AmountCell currentAmount={amount} amount={3000} label="$30" setAmount={setAmount} />
						</Col>
					</Row>
					<Row>
						<Col>
							<AmountCell currentAmount={amount} amount={5000} label="$50" setAmount={setAmount} />
							<AmountCell currentAmount={amount} amount={10000} label="$100" setAmount={setAmount} />
							<AmountCell currentAmount={amount} amount={'custom'} label="Custom" setAmount={setAmount} />
						</Col>
					</Row>
					<Row>
						<Col>
							<Button onClick={contribute}>Contribute</Button>
						</Col>
					</Row>
				</CardBody>
			</Card>
		</div>
	);
}

function ManageContribution(props){
	const [paymentState, paymentDispatch] = useReducer(paymentReducer, {
		stripeCustomer:props.stripeCustomer,
	});
	const [notifyState, notifyDispatch] = useReducer(notifyReducer, {
		operationPending:false,
		notification:null
	});
	
	const {notification} = notifyState;
	
	return (
		<PaymentContext.Provider value={{paymentDispatch, paymentState}}>
		<NotifierContext.Provider value={{notifyDispatch, notifyState}}>
		<div className='manage-contribution'>
			<Notifier {...notification} />
			<Row>
				<Col md='6'>
					<Contribute />
				</Col>
			</Row>
		</div>
		</NotifierContext.Provider>
		</PaymentContext.Provider>
	);
}

export {ManageContribution};