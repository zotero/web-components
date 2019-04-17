'use strict';

import {log as logger} from '../Log.js';
const log = logger.Logger('storage/actions.js');

import {createContext} from 'react';
import {ajax} from '../ajax.js';

const StorageContext = createContext(null);
const NotifierContext = createContext(null);
const PaymentContext = createContext(null);
const LabContext = createContext(null);

//notifyReducer actions
const NOTIFY = 'notify';
const START_OPERATION = 'startOperation';
const STOP_OPERATION = 'stopOperation';

//paymentReducer actions
const UPDATE_CUSTOMER = 'updateCustomer';
const UPDATE_PURCHASE = 'updatePurchase';

//storageReducer actions
const UPDATE_USER_SUBSCRIPTION = 'updateUserSubscription';

//labReducer actions
const UPDATE_NAME = 'updateName';
const SET_FTE = 'setFTE';
const SET_EMAILS = 'setEmails';

function paymentReducer(state, action){
	switch(action.type){
		case UPDATE_CUSTOMER:
			return Object.assign({}, state, {
				stripeCustomer: action.stripeCustomer
			});
		case UPDATE_PURCHASE:
			return Object.assign({}, state, {
				purchase:action.purchase
			});
		default:
			return state;
	}
}

function notifyReducer(state, action){
	switch(action.type){
		case NOTIFY:
			return Object.assign({}, state, {notification:{
				type: action.notificationType,
				message: action.message
			}});
		default:
			return state;
	}
}
function storageReducer(state, action){
	switch(action.type){
		case UPDATE_USER_SUBSCRIPTION:
			action.userSubscription.institutionUnlimited = action.userSubscription.institutions.some((inst)=> {return inst.validated && inst.storageQuota == 1000000;});
			return Object.assign({}, state, {
				userSubscription:action.userSubscription,
				storageGroups: action.storageGroups,
				planQuotas: action.planQuotas
			});
		default:
			return state;
	}
}

function labReducer(state, action){
	switch(action.type){
		case UPDATE_NAME:
			return Object.assign({}, state, {
				name:action.name
			});
		case SET_FTE:
			return Object.assign({}, state, {fte:action.fte});
		case SET_EMAILS:
			return Object.assign({}, state, {emails:action.emails});
		default:
			return state;
	}
}

function selectPlan(plan){
	return {
		type:UPDATE_PURCHASE,
		purchase: {
			type:'individualChange',
			storageLevel: plan.storageLevel
		}
	};
}
function notify(type, message){
	return {
		type:NOTIFY,
		notificationType:type,
		message
	};
}
function renewNow(userSubscription){
	const storageLevel = userSubscription.storageLevel;
	return {
		type:UPDATE_PURCHASE,
		purchase:{
			type:'individualRenew',
			storageLevel
		}
	};
}
function updatePayment(){
	return {
		type:UPDATE_PURCHASE,
		purchase:{
			type:'individualPaymentUpdate'
		}
	};
}
function cancelPurchase(){
	return {
		type:UPDATE_PURCHASE,
		purchase:false
	};
}

function setEmails(emails){
	return {
		type:SET_EMAILS,
		emails:emails
	};
}

async function getSubscription(dispatch){
	log.debug('getSubscription', 4);
	try{
		let resp = await ajax({url:'/storage/usersubscription'});
		let data = await resp.json();
		dispatch({
			type:UPDATE_USER_SUBSCRIPTION,
			userSubscription: data.userSubscription,
			storageGroups:data.storageGroups,
			planQuotas: data.planQuotas
		});
	} catch (e) {
		log.debug('Error retrieving subscription data', 2);
		log.debug(e, 2);
		dispatch(notify('error', 'There was an error retrieving your subscription data'));
	}
}
async function getUserCustomer(dispatch){
	log.debug('getUserCustomer', 4);
	try{
		let resp = await ajax({url:'/storage/getusercustomer'});
		log.debug(resp, 4);
		let data = await resp.json();
		dispatch({type:UPDATE_CUSTOMER, stripeCustomer: data});
	} catch (e) {
		log.debug('Error retrieving customer data', 2);
		log.debug(e, 2);
		dispatch(notify('error', 'There was an error retrieving your subscription data'));
	}
}
function refresh(storageDispatch, paymentDispatch){
	getSubscription(storageDispatch);
	getUserCustomer(paymentDispatch);
}


export {
	NOTIFY,
	UPDATE_CUSTOMER,
	START_OPERATION,
	STOP_OPERATION,
	UPDATE_USER_SUBSCRIPTION,
	UPDATE_PURCHASE,
	UPDATE_NAME,
	SET_FTE,
	SET_EMAILS,
	refresh,
	getUserCustomer,
	getSubscription,
	cancelPurchase,
	setEmails,
	updatePayment,
	renewNow,
	notify,
	selectPlan,
	notifyReducer,
	paymentReducer,
	storageReducer,
	labReducer,
	StorageContext,
	NotifierContext,
	PaymentContext,
	LabContext
};