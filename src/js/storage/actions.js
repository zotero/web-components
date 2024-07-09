import { log as logger } from '../Log.js';
const log = logger.Logger('storage/actions.js');

import { ajax, postFormData } from '../ajax.js';
import { discountedCountries } from './constants.js';

//request to z.org server to start a purchase
async function initiatePurchase(purchase) {
	log.debug(`initiatePurchase:`);
	log.debug(purchase);
	
	let resp = await ajax({
		url: '/storage/purchase',
		type: 'POST',
		withSession: true,
		throwOnError: false,
		data: JSON.stringify(purchase),
	});

	log.debug(resp, 4);
	let data = await resp.json();
	log.debug(data);
	if (data.success) {
		return [data.price, data.intent];
	} else {
		throw data;
	}
}

//request to z.org server with purchase details to get the taxed price that will
//be charged, without initiating a purchase
async function getTaxedPrice(purchase) {
	log.debug('getTaxedPrice:');
	log.debug(purchase);
	let resp = await ajax({
		url: '/storage/price',
		type: 'POST',
		withSession: true,
		throwOnError: false,
		data: JSON.stringify(purchase),
	});

	log.debug(resp, 4);
	let data = await resp.json();
	log.debug(data);
	if (data.success) {
		return data.price;
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
	const { type, fte, numUsers, institutionName, institutionID } = invoiceData;
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
			if (!numUsers) throw new Error('no numUsers set');
			
			resp = await postFormData('/settings/storage/createinvoice', { type: 'addLabUsers', numUsers, institutionID }, { withSession: true });
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
        // log.debug(resp, 4);
        let data = await resp.json();
		// log.debug('got user customer');
		// log.debug(data);
		let stripeCustomer = data.stripeCustomer;
		//if data.paymentMethod is set, it's because we fetched a legacy source in the form of a paymentMethod
		//set that as the default_source so we always have the shape of a new style paymentMethod
		if (data.paymentMethod) {
			stripeCustomer.default_source = data.paymentMethod;
		}
        return {type: 'success', success:true, stripeCustomer};
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
	getTaxedPrice,
	createInvoice,
	createInstitutionInvoice,
	getUserCustomer,
	deleteInvoice,
};
