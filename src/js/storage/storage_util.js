import { log as logger } from '../Log.js';
var log = logger.Logger('storage_util');

import { storageLevelDescriptions, dateFormatOptions } from './constants.js';
import { calculateNewExpiration } from './calculations.js';

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
};

const institutionalPurchaseDescription = function(purchase) {
	let description = [];
	if (purchase && purchase.type) {
		switch (purchase.type) {
			case 'paymentUpdate':
				description.push(`Update your saved payment details for your next renewal. There will be no charge made until your expiration date.`);
				break;
			case 'labRenew':
				description.push(`Renew your current subscription. Zotero Lab for ${purchase.numUsers} users.`);
				description.push(`Your payment method will be charged immediately after confirming.`);
				break;
			case 'lab':
				description.push(`Purchase 1 year of Zotero Lab for ${purchase.numUsers} users.`);
				description.push(`Lab Name: ${purchase.institutionName}`);
				break;
			case 'addLabUsers':
				description.push(`Add ${purchase.numUsers} users to your current subscription.`);
				description.push(`Your payment method will be charged immediately after confirming.`);
				break;
			case 'institution':
				// TODO
				break;
			default:
				throw new Error('Unknown purchase type');
		}
	}
	return description;
};

const invoicePurchaseDescription = function(purchase, invoiceUser, institutionName=false) {
	const {storageLevel} = purchase;
	let description = [];
	switch (purchase.type) {
		case 'individual':
			description.push(`Zotero Storage subscription for user ${invoiceUser.username} - ${invoiceUser.email}`);
			description.push(`1 year of Zotero file storage: ${storageLevelDescriptions[storageLevel]}`);
			break;
		case 'lab':
			if (institutionName) {
				description.push(`${institutionName}`);
			}
			description.push(`Zotero Lab subscription managed by user ${invoiceUser.username} - ${invoiceUser.email}`);
			description.push(`Zotero Lab subscription will provide one year of unlimited Zotero file storage for ${purchase.numUsers} users`);
			break;
		case 'addLabUsers':
			if (institutionName) {
				description.push(`${institutionName}`);
			}
			description.push(`Add ${purchase.numUsers} users to existing Zotero Lab subscription managed by user ${invoiceUser.username} - ${invoiceUser.email}`);
			break;
		case 'contribution':
			break;
		default:
			log.error(purchase.type);
			throw new Error('Unknown invoice type');
		}
	return description;
}

const contributionDescription = function(purchase, currentUser) {
	let description = [];
	switch (purchase.type) {
		case 'contributionPaymentUpdate':
			description.push(`Update your saved payment details for your next contribution. There will be no charge made until your normally scheduled contribution.`);
			break;
		case 'contribution':
			description.push(`Make a one time contribution to support Zotero.`);
			description.push(`Your card or bank account will be charged immediately after confirming.`);
			break;
		case 'recurringContribution':
			description.push(`Make a ${purchase.period}ly recurring contribution to support Zotero.`);
			description.push(`Your card or bank account will be charged immediately after confirming.`);
			break;
		default:
			throw new Error('Unknown purchase type');
	}
		
	if (!currentUser) {
		description.push(<small className='text-muted'>If you&apos;d like your contribution associated with your Zotero account, please <a href='/user/login'>log in</a> before contributing.</small>);
	} else {
		description.push(`Receipts will be emailed to ${currentUser.email}`);
	}
	
	return description;
}

const delayedReload = function(ms = 3000, clearQueryParams=[]) {
	log.debug('delayedReload', 4);
	setTimeout(() => {
		if (clearQueryParams) {
			let url = new URL(document.location);
			let params = url.searchParams;
			clearQueryParams.forEach((v) => {
				params.delete(v);
			});
			url.search = params.toString();
			window.location.href = url.toString();
			return;
		}
		window.location.reload();
	}, ms);
}

const clearQueryParams = function(clearQueryParams) {
	let url = new URL(document.location);
	let params = url.searchParams;
	clearQueryParams.forEach((v) => {
		params.delete(v);
	});
	url.search = params.toString();
	history.replaceState(null, '', url.toString());
	// window.location.href = url.toString();
	return;
}


const actionAllowed = function(operationPending, paymentPending, setNotification) {
	if (operationPending) {
		setNotification({type:'error', message:"Please wait for actions to complete before continuing."});
		return false;
	} else if(paymentPending) {
		setNotification({type:'error', message:"A payment is currently pending. Other updates cannot be made until it completes."});
		return false;
	}
	return true;
}

export {
	personalPurchaseDescription,
	institutionalPurchaseDescription,
	invoicePurchaseDescription,
	contributionDescription,
	delayedReload,
	clearQueryParams,
	actionAllowed,
};
