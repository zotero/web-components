'use strict';

import {log as logger} from '../Log.js';
const log = logger.Logger('storage/actions.js');

import {ajax, postFormData} from '../ajax.js';

const UPDATE_USER_SUBSCRIPTION = 'updateUserSubscription';
const NOTIFY = 'notify';
const UPDATE_CUSTOMER = 'updateCustomer';
const PREVIEW_STORAGE = 'previewStorage';
const NEW_SUBSCRIPTION = 'newSubscription';
const CHANGE_SUBSCRIPTION = 'changeSubscription';
const START_OPERATION = 'startOperation';
const STOP_OPERATION = 'stopOperation';

function storageReducer(state, action){
	log.debug(action);
	switch(action.type){
		case UPDATE_USER_SUBSCRIPTION:
			action.userSubscription.institutionUnlimited = action.userSubscription.institutions.some((inst)=> {return inst.validated && inst.storageQuota == 1000000;});
			return Object.assign({}, state, {
				userSubscription:action.userSubscription,
				storageGroups: action.storageGroups,
				planQuotas: action.planQuotas
			});
		case UPDATE_CUSTOMER:
			return Object.assign({}, state, {
				stripeCustomer: action.stripeCustomer
			});
		case NOTIFY:
			return Object.assign({}, state, {notification:{
				type: action.notificationType,
				message: action.message
			}});
		case PREVIEW_STORAGE:
			return Object.assign({}, state, {
				previewStorageLevel:action.storageLevel
			});
		case NEW_SUBSCRIPTION:
			return Object.assign({}, state, {
				subscriptionChange:action.subscriptionChange
			});
		case CHANGE_SUBSCRIPTION:
			return Object.assign({}, state, {
				subscriptionChange:{
					type:'individualChange',
					storageLevel: action.storageLevel
				}
			});
		case START_OPERATION:
			return Object.assign({}, state, {operationPending:true});
		case STOP_OPERATION:
			return Object.assign({}, state, {operationPending:false});
		default:
			return state;
	}
}

/*
function previewPlan(plan){
	return {type:PREVIEW_STORAGE, storageLevel:plan.storageLevel};
}
function unpreviewPlan(){
	return {type:PREVIEW_STORAGE, storageLevel:null};
}
*/
function selectPlan(plan){
	return {
		type:CHANGE_SUBSCRIPTION,
		storageLevel: plan.storageLevel
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
		type:NEW_SUBSCRIPTION,
		subscriptionChange:{
			type:'individualRenew',
			storageLevel
		}
	};
}
function updatePayment(){
	return {
		type:NEW_SUBSCRIPTION,
		subscriptionChange:{
			type:'individualPaymentUpdate'
		}
	};
}
function cancelNewSubscription(){
	return {
		type:NEW_SUBSCRIPTION,
		subscriptionChange:false
	};
}

async function getSubscription(dispatch){
	log.debug('getSubscription');
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
		log.debug('Error retrieving subscription data');
		log.debug(e);
		dispatch(notify('error', 'There was an error retrieving your subscription data'));
	}
}
async function getUserCustomer(dispatch){
	log.debug('getUserCustomer');
	try{
		let resp = await ajax({url:'/storage/getusercustomer'});
		log.debug(resp);
		let data = await resp.json();
		dispatch({type:UPDATE_CUSTOMER, stripeCustomer: data});
	} catch (e) {
		log.debug('Error retrieving customer data');
		log.debug(e);
		dispatch(notify('error', 'There was an error retrieving your subscription data'));
	}
}
async function cancelRecur(dispatch){
	dispatch({type:START_OPERATION});

	try{
		let resp = await postFormData('/storage/cancelautorenew');
		log.debug(resp);
		dispatch(notify('success', 'Automatic renewal disabled'));
		dispatch({type:STOP_OPERATION});
	} catch (e) {
		log.debug(e);
		dispatch(notify('error', 'Error updating payment method. Please try again in a few minutes.'));
		dispatch({type:STOP_OPERATION});
	}

	refresh(dispatch);
}
function refresh(dispatch){
	getSubscription(dispatch);
	getUserCustomer(dispatch);
}


export {refresh, cancelRecur, getUserCustomer, getSubscription, cancelNewSubscription, updatePayment, renewNow, notify, selectPlan, storageReducer};