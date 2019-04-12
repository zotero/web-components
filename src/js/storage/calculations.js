'use strict';

import {log as logger} from '../Log.js';
var log = logger.Logger('storage/calculations');

const priceCents = {'1':0,'2':2000,'3':6000,'4':10000,'5':24000,'6':12000};

//return bool whether a charge for a changed subscription should be made immediately
const imminentExpiration = function(expiration=0){
	//log.debug(expiration);
	//log.debug(new Date(expiration * 1000));
	if((expiration * 1000) < (Date.now() + (1000*60*60*24*15))) {
		return true;
	}
	return false;
};

const calculateRemainingValue = function(expiration=Date.now(), storageLevel=2) {
	//log.debug(expiration);
	if(expiration < Date.now()){
		return 0;
	}
	const secondsPerYear = 31536000; //60*60*24*365
	
	const now = new Date(Date.now());
	let secondsLeft = (expiration.getTime() - now.getTime()) / 1000;
	let remainingValue = priceCents[storageLevel] * (secondsLeft / secondsPerYear);

	return remainingValue;
};

const calculateNewExpiration = function(oldExpiration, oldStorageLevel, newStorageLevel) {
	let secondsPerYear = 31536000; //60*60*24*365
	
	if(typeof oldExpiration == 'string'){
		oldExpiration = new Date(parseInt(oldExpiration)*1000);
	} else if(oldExpiration < new Date(2000, 0)) {
		oldExpiration = new Date(oldExpiration * 1000);
	}

	if(oldExpiration < Date.now()){
		let newExpiration = new Date(Date.now() + (secondsPerYear * 1000));
		return newExpiration;
	}
	if(oldExpiration < (Date.now() + (1000*60*60*24*15)) && (oldExpiration > Date.now())) {
		//expiration less than 2 weeks away, will charge and expiration will be oldExpiration+1year
		let newExpiration = new Date((oldExpiration.getTime()) + (secondsPerYear * 1000)); //new Date takes milliseconds
		return newExpiration;
	}
	
	let remainingValue = calculateRemainingValue(oldExpiration, oldStorageLevel);
	log.debug(`remainingValue: ${remainingValue}`);
	let extraSecondsAtNewLevel = (remainingValue / priceCents[newStorageLevel]) * secondsPerYear;

	let newExpiration = new Date(Date.now() + (extraSecondsAtNewLevel * 1000)); //new Date takes milliseconds

	return newExpiration;
};

const labPrice = function(fte=0){
	return (Math.max(15, fte) * 3000);
};

const labUserPrice = function(fte=0){
	return (fte * 3000);
};

export {calculateRemainingValue, calculateNewExpiration, imminentExpiration, priceCents, labPrice, labUserPrice};