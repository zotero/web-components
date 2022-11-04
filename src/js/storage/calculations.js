import {log as logger} from '../Log.js';
var log = logger.Logger('storage/calculations');

import { priceCents, discountTiers, discountLabTiers, discountedCountries, storagePlans, discountedPriceStrings } from './constants.js';

// return bool whether a charge for a changed subscription should be made immediately
const imminentExpiration = function (expiration = 0) {
	// log.debug(expiration);
	// log.debug(new Date(expiration * 1000));
	if ((expiration * 1000) < (Date.now() + (1000 * 60 * 60 * 24 * 15))) {
		return true;
	}
	return false;
};

const calculateRemainingValue = function (expiration = Date.now(), storageLevel = 2) {
	// log.debug(expiration);
	if (expiration < Date.now()) {
		return 0;
	}
	const secondsPerYear = 31536000; // 60*60*24*365
	
	const now = new Date(Date.now());
	let secondsLeft = (expiration.getTime() - now.getTime()) / 1000;
	let remainingValue = priceCents[storageLevel] * (secondsLeft / secondsPerYear);

	return remainingValue;
};

const calculateNewExpiration = function (oldExpiration, oldStorageLevel, newStorageLevel) {
	let secondsPerYear = 31536000; // 60*60*24*365
	
	if (typeof oldExpiration == 'string') {
		oldExpiration = new Date(parseInt(oldExpiration) * 1000);
	} else if (oldExpiration < new Date(2000, 0)) {
		oldExpiration = new Date(oldExpiration * 1000);
	}

	if (oldExpiration < Date.now()) {
		let newExpiration = new Date(Date.now() + (secondsPerYear * 1000));
		return newExpiration;
	}
	if (oldExpiration < (Date.now() + (1000 * 60 * 60 * 24 * 15)) && (oldExpiration > Date.now())) {
		// expiration less than 2 weeks away, will charge and expiration will be oldExpiration+1year
		let newExpiration = new Date((oldExpiration.getTime()) + (secondsPerYear * 1000)); // new Date takes milliseconds
		return newExpiration;
	}
	
	let remainingValue = calculateRemainingValue(oldExpiration, oldStorageLevel);
	log.debug(`remainingValue: ${remainingValue}`);
	let extraSecondsAtNewLevel = (remainingValue / priceCents[newStorageLevel]) * secondsPerYear;

	let newExpiration = new Date(Date.now() + (extraSecondsAtNewLevel * 1000)); // new Date takes milliseconds

	return newExpiration;
};

const labPrice = function (fte = 0) {
	return (Math.max(15, fte) * 3000);
};

const labUserPrice = function (fte = 0) {
	return (fte * 3000);
};

//lab price for a given number of users, based on location's discount tier
const locationLabPrice = function(fte=0, location='US') {
	if (Object.keys(discountedCountries).includes(location)) {
		let discountLevel = discountedCountries[location];
		return Math.max(15, fte) * discountLabTiers[discountLevel];
	}
	return labPrice(fte);
}

const locationLabUserPrice = function (fte = 0, location='US') {
	if (Object.keys(discountedCountries).includes(location)) {
		let discountLevel = discountedCountries[location];
		return fte * discountLabTiers[discountLevel];
	}
	return labUserPrice(fte);
}

const getPriceCents = function(location) {
	if (Object.keys(discountedCountries).includes(location)) {
		let discountLevel = discountedCountries[location];
		return discountTiers[discountLevel];
	}
	return priceCents;
};

const getStoragePlans = function(location) {
	const basePlans = storagePlans;
	if (Object.keys(discountedCountries).includes(location)) {
		let discountLevel = discountedCountries[location];
		let discountedPlans = basePlans.map((plan) => {
			let nplan = Object.assign({}, plan);
			nplan.priceString = discountedPriceStrings[discountLevel][plan.storageLevel];
			return nplan;
		});
		return discountedPlans;
	}
	return basePlans;
};

const getCustomerPaymentCountry = function(stripeCustomer) {
	if (stripeCustomer && stripeCustomer.invoice_settings.default_payment_method) {
		let dpm = stripeCustomer.invoice_settings.default_payment_method;
		if (dpm.card && dpm.card.country) {
			return (dpm.card.country);
		}
	}
	return false;
};

const isDiscounted = function(country) {
	return Object.keys(discountedCountries).includes(country);
};

export {calculateRemainingValue, calculateNewExpiration, imminentExpiration, labPrice, labUserPrice, locationLabPrice, locationLabUserPrice, getPriceCents, getStoragePlans, getCustomerPaymentCountry, isDiscounted};
