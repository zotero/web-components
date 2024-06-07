import { log as logger } from '../Log.js';
var log = logger.Logger('storage_util');

import { storageLevelDescriptions, dateFormatOptions } from './constants.js';
import { calculateNewExpiration } from './calculations.js';

function defaultPayment(stripeCustomer) {
	let defaultPM = null;
	if (stripeCustomer) {
		if(stripeCustomer.invoice_settings.default_payment_method) {
			defaultPM = stripeCustomer.invoice_settings.default_payment_method;
		} else if (stripeCustomer.default_source) {
			defaultPM = stripeCustomer.default_source;
		}
	}
	return defaultPM;
};

const getCustomerPaymentCountry = function(stripeCustomer) {
	if (stripeCustomer) {
		if (stripeCustomer.invoice_settings.default_payment_method) {
			return getPaymentMethodCountry(stripeCustomer.invoice_settings.default_payment_method);
		} else if (stripeCustomer.default_source) {
			return getPaymentMethodCountry(stripeCustomer.default_source);
		}
	}
	return false;
};

const getPaymentMethodCountry = function(pm) {
	if (pm.card && pm.card.country) {
		return (pm.card.country);
	} else if (pm.billing_details && pm.billing_details.country) {
		return pm.billing_details.country;
	}
	return false;
};

//build description array for the given purchase object to describe to the user the changes are being made
const personalPurchaseDescription = function(purchase, userSubscription) {
	let description = [];
	
	const { type, storageLevel } = purchase;
	switch (type) {
	case 'individualChange':
		description.push(`Change storage plan to ${storageLevelDescriptions[storageLevel]}`);
		if (purchase.immediateCharge) {
			let newExp = calculateNewExpiration(userSubscription.expirationDate, userSubscription.storageLevel, storageLevel);
			description.push(`Expiring on ${newExp.toLocaleDateString('en-US', dateFormatOptions)}.`);
			description.push(`A charge will be made to your account once you confirm your order.`);
		} else {
			let oldExp = new Date(parseInt(userSubscription.expirationDate) * 1000);
			let newExp = calculateNewExpiration(userSubscription.expirationDate, userSubscription.storageLevel, storageLevel);
			description.push(`Your current expiration date is ${oldExp.toLocaleDateString('en-US', dateFormatOptions)}.`);
			description.push(`The time left on your current subscription will be applied to your new subscription. Your new expiration date will be ${newExp.toLocaleDateString('en-US', dateFormatOptions)}.`);
			description.push(`A charge will not be made to your account until your new expiration date.`);
		}
		break;
	case 'individualPaymentUpdate':
		description.push(`Update your saved payment details for your next renewal. There will be no charge made until your expiration date.`);
		break;
	case 'individualRenew':
		description.push(`Renew your current ${storageLevelDescriptions[storageLevel]} subscription.`);
		description.push(`Your account will be charged immediately after confirming.`);
		break;
	default:
		throw new Error('Unknown purchase type');
	}

	return description;
}

export {
    defaultPayment,
	getCustomerPaymentCountry,
	getPaymentMethodCountry,
	personalPurchaseDescription,
};
