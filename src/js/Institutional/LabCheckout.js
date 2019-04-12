'use strict';

// import {log as logger} from '../Log.js';
// let log = logger.Logger('LabCheckout');

import {useReducer} from 'react';
import {Button} from 'reactstrap';
import PropTypes from 'prop-types';

import {Notifier} from '../Notifier.js';

import {getCurrentUser, formatCurrency} from '../Utils.js';
import {InstitutionHandler} from '../storage/InstitutionHandler.jsx';
import {labPrice} from '../storage/calculations.js';
import {labReducer, paymentReducer, notifyReducer, PaymentContext, NotifierContext, LabContext, SET_FTE, UPDATE_PURCHASE, UPDATE_NAME} from '../storage/actions.js';

const currentUser = getCurrentUser();

//Allow purchase of a new Lab plan from z.org/storage/institutions
function LabCheckout(props){
	const [paymentState, paymentDispatch] = useReducer(paymentReducer, {
		stripeCustomer:props.stripeCustomer,
		purchase:null
	});
	const [notifyState, notifyDispatch] = useReducer(notifyReducer, {
		operationPending:false,
		notification:null
	});
	const [labState, labDispatch] = useReducer(labReducer, {
		fte: 15,
		name: '',
	});
	
	const {purchase} = paymentState;
	const {notification} = notifyState;
	const {fte, name} = labState;
	
	const handleFTEChange = (evt) => {
		let nv = evt.target.value;
		nv = nv.replace(/\D/g,'');
		if(nv != ''){
			nv = parseInt(nv);
			if(isNaN(nv)){
				nv = 15;
			}
		}
		labDispatch({type:SET_FTE, fte:nv});
	};
	const handlePurchase = () => {
		paymentDispatch({type:UPDATE_PURCHASE, purchase:{
			type:'lab',
			fte,
			name
		}});
	};
	
	const setName = (name) => {
		labDispatch({type:UPDATE_NAME, name});
	};
	
	//Only allow purchase if the user is logged in so the lab will have a managing account. Otherwise provide quote but don't allow purchase
	let completeAction = null;
	if(currentUser){
		completeAction = (
			<div>
				<div className='form-line'>
					<label htmlFor='lab_name'>Lab Name:</label>
					<input type='text' name='lab_name' className='lab_name form-control' value={name} onChange={(evt)=>{setName(evt.target.value);}} />
					<p className='hint'>This name will appear as the provider of storage for your users.</p>
				</div>
				<div className='form-line'>
					<p>You&apos;re currently logged in as &quot;{currentUser.username}&quot;. This will be the account used to manage the user list for your subscription. If you&apos;d like to use a different account to manage your subscription, please log in with that account before completing the purchase.</p>
				</div>
				<div className='form-line purchase-line'>
					<Button color='secondary' onClick={handlePurchase}>Purchase</Button>
				</div>
			</div>
		);
	} else {
		completeAction = (
			<div className='form-line'>
				<p>You are not currently logged in. To purchase a Zotero Lab subscription, please log in to the account that will be used to manage the user list for the subscription. You&apos;ll need to use that account to make changes to your subscription in the future.</p>
			</div>
		);
	}
	
	//trigger payment modal if we have a pending purchase state
	let Payment = null;
	if(purchase){
		Payment = (<InstitutionHandler
			purchase={purchase}
		/>);
	}

	return (
		<LabContext.Provider value={{labDispatch, labState}}>
		<PaymentContext.Provider value={{paymentDispatch, paymentState}}>
		<NotifierContext.Provider value={{notifyDispatch, notifyState}}>
		<div id='lab-checkout'>
			{Payment}
			<p>
				Zotero Lab is ideal for departments, laboratories, and small companies. A simple administrative interface lets you add or remove users from your Zotero Lab subscription at any time.
			</p>
			<p>
				Zotero Lab costs $30 per user, with a minimum of 15 users.
			</p>
			<div className='form-line'>
				<label htmlFor='lab_fte'>Users:</label>
				<input type='text' name='lab_fte' min="15" className='lab_fte form-control' value={fte} onChange={handleFTEChange} />
			</div>
			<div className='form-line'>
				<label>Price</label>
				{formatCurrency(labPrice(fte))}
				<span>&nbsp;per year, billed annually</span>
			</div>
			{completeAction}
			<Notifier {...notification} />
		</div>
		</NotifierContext.Provider>
		</PaymentContext.Provider>
		</LabContext.Provider>
	);
}
LabCheckout.defaultProps = {
	fte:15,
	name:'',
	institutionID:0
};

LabCheckout.propTypes = {
	//purchase: PropTypes.func.isRequired,
	fte:PropTypes.number,
	name:PropTypes.string,
	institutionID:PropTypes.number,
	stripeCustomer: PropTypes.object
};

export {LabCheckout};
