import { log as logger } from '../Log.js';
const log = logger.Logger('storage/actions.js');

import { ajax, postFormData } from '../ajax.js';
import { discountedCountries } from './constants.js';

// async function beginIntent(amount, description, storageLevel, immediateCharge) {
async function initiatePurchase(purchase, setIntent) {
	log.debug(`initiatePurchase:`);
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
		log.debug('successful initiatePurchase: setting returned intent');
		setIntent(data);
		return data.client_secret;
	} else {
		throw data;
	}
}

//add paymentMethod to the customer for this session
async function addPaymentMethod(stripePaymentMethod) {
	log.debug(`addPaymentMethod:`);
	let resp = await postFormData('/storage/addpaymentmethod', {paymentMethodID: stripePaymentMethod.id}, { withSession:true });
	log.debug(resp, 1);
	let data = await resp.json();
	log.debug(data);
	if (data.success) {
		log.debug('successful addPaymentMethod');
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
		throwOnError: false,
	});

	log.debug(resp, 4);
	let respData = await resp.json();
	if (respData.success) {
		log.debug('successful chargeDefaultMethod: setting returned intent');
		// setIntent(respData);
		return respData;
	} else {
		throw respData;
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
	const { type, fte, additionalFTE, numUsers, institutionName, institutionID } = invoiceData;
	try {
		let resp;
		switch (type) {
		case 'labRenew':
			if (!numUsers) throw new Error('no numUsers set');
			if (!institutionID) throw new Error('no institutionID set');
			
			resp = await postFormData('/settings/storage/createinvoice', { type: 'labRenew', numUsers, institutionID }, { withSession: true });
			break;
		case 'lab':
			if (!numUsers) throw new Error('no numUsers set');
			
			let params = { type: 'lab', numUsers, institutionName };
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

async function getUserCustomer () {
    log.debug('getUserCustomer', 4);
    try {
        let resp = await ajax({ url: '/storage/getusercustomer' });
        log.debug(resp, 4);
        let data = await resp.json();
        return {type: 'success', success:true, stripeCustomer: data};
    } catch (e) {
        log.debug('Error retrieving customer data', 2);
        log.debug(e, 2);
        return {success:false, type: 'error', message: 'There was an error retrieving your payment or subscription data'};
    }
}

async function  deleteInvoice (invoiceID) {
	let data = { invoiceID };
	let resp = await postFormData('/storage/deleteinvoice', data, { withSession: true });
	
	if (resp.ok) {
		return { type: 'success', message: <span>Invoice Deleted</span> };
	} else {
		throw resp;
	}
};


export {
	initiatePurchase,
	addPaymentMethod,
	chargeDefaultMethod,
	createInvoice,
	createInstitutionInvoice,
	getUserCustomer,
	deleteInvoice,
};
