import { log as logger } from '../Log.js';
const log = logger.Logger('storage/actions.js');

import { ajax, postFormData } from '../ajax.js';


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

export {
	beginStripeIntent,
	chargeDefaultMethod,
	createInvoice,
	createInstitutionInvoice,
};
