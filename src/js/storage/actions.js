import { log as logger } from '../Log.js';
const log = logger.Logger('storage/actions.js');

import { createContext } from 'react';
import { ajax, postFormData } from '../ajax.js';

const StorageContext = createContext(null);
// const NotifierContext = createContext(null);
const PaymentContext = createContext(null);
const LabContext = createContext(null);

// notifyReducer actions
// const NOTIFY = 'notify';
// const START_OPERATION = 'startOperation';
// const STOP_OPERATION = 'stopOperation';

// paymentReducer actions
const UPDATE_CUSTOMER = 'updateCustomer';
const UPDATE_PURCHASE = 'updatePurchase';
const UPDATE_PURCHASE_IMMEDIATE = 'updatePurchaseImmediate';
const UPDATE_INTENT = 'updateIntent';

// storageReducer actions
const UPDATE_USER_SUBSCRIPTION = 'updateUserSubscription';

// labReducer actions
const UPDATE_NAME = 'updateName';
const SET_FTE = 'setFTE';
const SET_EMAILS = 'setEmails';

function paymentReducer(state, action) {
	log.debug('paymentReducer');
	log.debug(action);
	switch (action.type) {
	case UPDATE_CUSTOMER:
		return Object.assign({}, state, {
			stripeCustomer: action.stripeCustomer
		});
	case UPDATE_PURCHASE:
		return Object.assign({}, state, {
			purchase: action.purchase
		});
	case UPDATE_PURCHASE_IMMEDIATE:
		let purchase = Object.assign({}, state.purchase);
		purchase.immediateCharge = action.immediateCharge;
		return Object.assign({}, state, { purchase });
	case UPDATE_INTENT:
		log.debug('got UPDATE_INTENT');
		let newState = Object.assign({}, state, {
			paymentIntent: action.paymentIntent
		});
		log.debug(newState);
		return newState;
	default:
		return state;
	}
}
/*
function notifyReducer(state, action) {
	switch (action.type) {
	case NOTIFY:
		if (!action.notificationType) {
			throw new Error('No notificationType for notifyReducer');
		}
		if (!action.message) {
			throw new Error('No message for notifyReducer');
		}
		return Object.assign({}, state, { notification: {
			type: action.notificationType,
			message: action.message
		} });
	default:
		return state;
	}
}
*/
function storageReducer(state, action) {
	switch (action.type) {
	case UPDATE_USER_SUBSCRIPTION:
		action.userSubscription.institutionUnlimited = action.userSubscription.institutions.some((inst) => { return inst.validated && inst.storageQuota == 1000000; });
		return Object.assign({}, state, {
			userSubscription: action.userSubscription,
			storageGroups: action.storageGroups,
			planQuotas: action.planQuotas
		});
	default:
		return state;
	}
}

function labReducer(state, action) {
	switch (action.type) {
	case UPDATE_NAME:
		return Object.assign({}, state, {
			name: action.name
		});
	case SET_FTE:
		return Object.assign({}, state, { fte: action.fte });
	case SET_EMAILS:
		return Object.assign({}, state, { emails: action.emails });
	default:
		return state;
	}
}

function immediateCharge(immediate) {
	return {
		type: UPDATE_PURCHASE_IMMEDIATE,
		immediateCharge: immediate
	};
}
function selectPlan(plan) {
	return {
		type: UPDATE_PURCHASE,
		purchase: {
			type: 'individualChange',
			storageLevel: plan.storageLevel
		}
	};
}
/*
function notify(type, message) {
	return {
		type: NOTIFY,
		notificationType: type,
		message
	};
}
*/
function renewNow(userSubscription) {
	const storageLevel = userSubscription.storageLevel;
	return {
		type: UPDATE_PURCHASE,
		purchase: {
			type: 'individualRenew',
			storageLevel
		}
	};
}
function updatePayment(storageLevel) {
	return {
		type: UPDATE_PURCHASE,
		purchase: {
			type: 'individualPaymentUpdate',
			storageLevel
		}
	};
}
function updateIntent(paymentIntent) {
	return {
		type: UPDATE_INTENT,
		paymentIntent: paymentIntent
	}
}

function cancelPurchase() {
	return {
		type: UPDATE_PURCHASE,
		purchase: false
	};
}

function setEmails(emails) {
	return {
		type: SET_EMAILS,
		emails: emails
	};
}

// async function beginIntent(amount, description, storageLevel, immediateCharge) {
async function beginStripeIntent(purchase, setIntent) {
	log.debug(`beginStripeIntent:`);
	log.debug(purchase);
	// setIntent({client_secret: 'THIS IS A SECRET', success: true, intent: {id: 'intent_id'}});
	// return;
	// let args = { amount, description, storageLevel, immediateCharge };
	let resp = await ajax({
		url: '/storage/newstripeintent',
		type: 'POST',
		withSession: true,
		data: JSON.stringify(purchase),
	});

	log.debug(resp, 4);
	let data = await resp.json();
	log.debug(data);
	if (data.success) {
		log.debug('successful beginStripeIntent: setting returned intent');
		setIntent(data);
		return data.client_secret;
	} else {
		throw data;
	}
}

async function chargeDefaultMethod(purchase) {
	log.debug(`chargeDefaultMethod:`);
	log.debug(purchase);
	let purchaseData = Object.assign({}, purchase, {autoConfirm:true});
	let resp = await ajax({
		url: '/storage/newstripeintent',
		type: 'POST',
		withSession: true,
		data: JSON.stringify(purchaseData),
	});

	log.debug(resp, 4);
	let data = await resp.json();
	log.debug(data);
	if (data.success) {
		log.debug('successful chargeDefaultMethod: setting returned intent');
		// setIntent(data);
		return data;
	} else {
		throw data;
	}
}

async function createInvoice(invoiceData) {
	//TODO: validate invoice data fits one of the correct forms
	
	let resp;
	try {
		resp = await postFormData('/settings/storage/createinvoice', invoiceData, { withSession: true });
		if (resp.ok) {
			const respData = await resp.json();
			const { invoiceID } = respData;
			//return success notification with link to new invoice
			return { type: 'success', message: (<span>Invoice created. <a href={`/storage/invoice/${invoiceID}`}>View Invoice</a></span>) };
		} else {
			throw resp;
		}
	} catch (e) {
		log.error(e);
		return { type: 'error', message: 'Error creating invoice. Please try again in a few minutes.' };
	}
}

async function createInstitutionInvoice(invoiceData) {
	log.debug('createInstitutionInvoice');
	log.debug(invoiceData);
	const { type, fte, additionalFTE, name, institutionID } = invoiceData;
	try {
		let resp;
		switch (type) {
		case 'labRenew':
			if (!fte) throw new Error('no fte set');
			if (!institutionID) throw new Error('no institutionID set');
			
			resp = await postFormData('/settings/storage/createinvoice', { type: 'labRenew', numUsers: fte, institutionID }, { withSession: true });
			break;
		case 'lab':
			if (!fte) throw new Error('no fte set');
			
			let params = { type: 'lab', numUsers: fte };
			if (institutionID) params.institutionID = institutionID;
			resp = await postFormData('/settings/storage/createinvoice', params, { withSession: true });
			break;
		case 'addLabUsers':
			if (!institutionID) throw new Error('no institutionID set');
			if (!additionalFTE) throw new Error('no additionalFTE set');
			
			resp = await postFormData('/settings/storage/createinvoice', { type: 'addLabUsers', numUsers: additionalFTE, institutionID }, { withSession: true });
			break;
		case 'institution':
			// TODO
			throw new Error('unimplemented invoice type');
		default:
			throw new Error('unrecognized type');
		}
		
		if (resp.ok) {
			const respData = await resp.json();
			const { invoiceID } = respData;
			return { type: 'success', message: <span>Invoice created. <a href={`/storage/invoice/${invoiceID}`}>View Invoice</a></span> };
		} else {
			throw resp;
		}
	} catch (e) {
		log.error(e);
		return { type: 'error', message: 'Error creating invoice. Please try again in a few minutes.' };
	}
}

	
/*
async function beginPaymentIntent(dispatch, amount, description) {
	let resp;
	try {
		// resp = await postFormData('/storage/newstripeintent', { amount, description }, { withSession: true });
		resp = await postFormData('/storage/newstripeintent', { amount, description }, { withSession: true });
		log.debug(resp, 4);
		let data = await resp.json();
		if (data.success) {
			dispatch({ type: UPDATE_INTENT, paymentIntent: { client_secret: data.client_secret } });
		} else {
			throw data;
		}
	} catch (e) {
		log.debug('Error beginning paymentIntent', 2);
		log.debug(e, 2);
		dispatch(notify('error', 'There was an error retrieving your subscription data'));
	}
}
*/

export {
	// NOTIFY,
	UPDATE_CUSTOMER,
	// START_OPERATION,
	// STOP_OPERATION,
	UPDATE_USER_SUBSCRIPTION,
	UPDATE_PURCHASE,
	UPDATE_NAME,
	SET_FTE,
	SET_EMAILS,
	UPDATE_INTENT,
	// beginPaymentIntent,
	// getUserCustomer,
	// getSubscription,
	cancelPurchase,
	setEmails,
	updatePayment,
	updateIntent,
	renewNow,
	// notify,
	immediateCharge,
	selectPlan,
	// notifyReducer,
	paymentReducer,
	storageReducer,
	labReducer,
	StorageContext,
	// NotifierContext,
	PaymentContext,
	LabContext,
	beginStripeIntent,
	chargeDefaultMethod,
	createInvoice,
	createInstitutionInvoice,
};
