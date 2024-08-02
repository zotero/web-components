/* eslint-disable no-duplicate-imports */

import { log as logger } from '../Log.js';
const log = logger.Logger('StorageComponent');

import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Button } from 'reactstrap';

import { ErrorWrapper } from '../components/ErrorWrapper.jsx';
import { Notifier } from '../Notifier.js';
import { PurchaseHandler } from './PurchaseHandler.jsx';
import { Invoices } from './Invoices.jsx';
// import { LocationSelector } from './LocationSelector.jsx';
import { imminentExpiration, getPriceCents, getStoragePlans } from './calculations.js';

import { createInvoice, getUserCustomer } from './actions.js';

import { LastSync } from './LastSync.jsx';
import { ajax, postFormData } from '../ajax.js';
import { LoadingSpinner } from '../LoadingSpinner.js';

import { userSubscriptionShape } from './constants.js';
import { actionAllowed, personalPurchaseDescription } from './storage_util.js';
import { InstitutionalRow } from './InstitutionProvidedStorage.jsx';
import { CurrentPlanUsageRows } from './CurrentPlanUsage.jsx';
import { NextPaymentRow, PaymentRow } from './PaymentRows.jsx';
import { StoragePlansSection } from './StoragePlans.jsx';
import { usePaymentProcessor } from './usePaymentProcessor.js';

const overQuota = function (storageLevel, userSubscription) {
	const planQuotas = window.zoteroData.planQuotas;
	let planQuota = planQuotas[storageLevel];
	if (userSubscription.usage.total > planQuota) {
		return true;
	}
	return false;
};

const storageUrl = window.zoteroConfig.baseWebsiteUrl ? `${window.zoteroConfig.baseWebsiteUrl}/settings/storage` : '/settings/storage';

const StorageContext = createContext(null);
function useStorageContext() {
	return useContext(StorageContext);
}

/*
Manage storage subscription for individual user
- First time subscription -> purchase object, payment details/confirmationToken, refresh/show price/paymentIntent, confirm charge
- update payment details -> purchase object, payment details/confirmationToken, save to customer/setupIntent/show renewal price without charging
- renew now, expiration imminent -> purchase object, show existing paymentDetails/show price, confirmCharge (create/charge paymentIntent with existing customer) OR change paymentDetails/confirmationToken, refresh/show price/paymentIntent, confirmCharge
- force payment now ^as above
- Change current plan without immediate payment -> purchase object, confirmChange (no intent)
- change current plan and pay now (imminent expiration) -> purchaseObject, renewNow flow
*/
function Storage(props) {
	log.debug(props);
	const { detectedLocation } = props;
	const [ paymentPending, setPaymentPending ] = useState(props.paymentPending);
	const [ userSubscription, setUserSubscription ] = useState(props.userSubscription);
	const [ storageGroups, setStorageGroups ] = useState({});
	const [ stripeCustomer, setStripeCustomer ] = useState(props.stripeCustomer);
	const [ purchase, setPurchase ] = useState(null);
	const [ pageNotification, setPageNotification ] = useState(null);
	const [ operationPending, setOperationPending ] = useState(false);
	const [ storagePlans, setStoragePlans ] = useState([]);
	
	// const stripe = window.stripe;// useStripe();

	log.debug({userSubscription, stripeCustomer, purchase}, 4);

	let paymentResultCallback = (result) => {
		log.debug("paymentResultCallback");
		log.debug(result);
		setPageNotification(result);
		if (result.delayRequired !== false) {
			log.debug("delayed refreshing after 3 secs");
			setPaymentPending(true);
			delayedRefresh();
		} else {
			log.debug("refreshing after 1 sec");
			delayedRefresh(1000);
		}
	}

	const returnUrl = storageUrl;
	const payment = usePaymentProcessor({
		purchase,
		stripeCustomer,
		userSubscription,
		detectedLocation,
		paymentMethodConfigs: props.paymentMethodConfigs,
		setPurchase,
		paymentResultCallback,
		returnUrl,
		cancelable:true,
		paymentPending
	});
	log.debug('payment:');
	log.debug(payment);

	let immediateChargeRequired = false;
	if (purchase) {
		immediateChargeRequired = (purchase.type != 'individualPaymentUpdate') && (purchase.type == 'individualRenew' || imminentExpiration(userSubscription.expirationDate));
	}
	
	let paymentPendingNotification = null;
	if (paymentPending) {
		let message = `Your payment is processing. Your storage subscription will be updated once it has completed.`;
		if (userSubscription && userSubscription.paymentPendingMethodType == 'sepa_debit') {
			message += ` Payment was made using SEPA debit, which may take up to 14 business days to complete.`;
		}
		paymentPendingNotification = <Notifier {...{
			id: 'paymentPendingNotification',
			type: 'info',
			message,
		}} />;
	}
	/** Effect calls */
	//fetch userSubscription and stripeCustomer if either not included in props
	useEffect(
		() => {
			if (!userSubscription || !stripeCustomer) {
				refresh();
			}
		},
		[props.userSubscription, props.stripeCustomer]
	);

	//update purchase object to include various other state when it changes
	//make sure correct currency is set on purchase object when either changes
	useEffect(() => {
		if (purchase) {
			let update = false;
			let nv = Object.assign({}, purchase);
			/*
			if (purchase.currency != payment.state.currency && payment.state.currency !== false) {
				nv.currency = payment.state.currency;
				update = true;
			}
			*/
			if (payment?.state?.taxID && (purchase.taxID != payment.state.taxID)) {
				nv.taxID = payment.state.taxID;
				update = true;
			}
			if (immediateChargeRequired != purchase.immediateCharge) {
				nv.immediateCharge = immediateChargeRequired;
				update = true;
			}
			if (update) {
				setPurchase(nv);
			}
		}
	}, [purchase, payment, immediateChargeRequired]);
	
	useEffect(() => {
		setStoragePlans(getStoragePlans(payment.state.location));
	}, [payment.state.location]);

	// *** Callbacks for user actions ***
	//callback for "Update Payment Details" button
	const updatePaymentHandler = () => {
		if (!actionAllowed(operationPending, paymentPending, setPageNotification)) {
			return;
		}
		const nv = Object.assign({}, {
			type: 'individualPaymentUpdate',
			storageLevel: userSubscription.storageLevel,
		});
		setPurchase(nv);
		// setEditPayment(true);
	};

	//callback for "Renew  Now" button
	const renewHandler = () => {
		log.debug('renewHandler', 4);
		if (!actionAllowed(operationPending, paymentPending, setPageNotification)) {
			return;
		}
		// setEditPayment(false);
		// const price = getPriceCents(location)[userSubscription.storageLevel];
		// setPreviewPrice(price);
		const nv = Object.assign({}, {
			type: 'individualRenew',
			storageLevel: userSubscription.storageLevel,
		});
		setPurchase(nv);
	};

	//callback for choosing a storage plan
	// editPayment to false so that it can be decided if it's necessary
	// based on the new purchase. Set the preview price from when the user clicked
	// so that we can notify them if it changes once they add a payment method and we
	// tie any discount to their location
	const selectPlan = (plan) => {
		log.debug('selectPlan', 4);
		if (!actionAllowed(operationPending, paymentPending, setPageNotification)) {
			return;
		}
		// setEditPayment(false);
		setPageNotification(null);
		// let price = getPriceCents(location)[plan.storageLevel];
		// setPreviewPrice(price);
		const nv = Object.assign({}, {
			type: 'individualChange',
			storageLevel: plan.storageLevel,
		});
		setPurchase(nv);
	}
	
	//make request to server to get the user's subscription
	const getSubscription = async () => {
		log.debug('getSubscription', 4);
		try {
			let resp = await ajax({ url: '/storage/usersubscription' });
			let data = await resp.json();
			log.debug(data);
			if (data.userSubscription.quota == 1000000 && data.userSubscription.institutions.length > 0) {
				data.userSubscription.institutionUnlimited = true;
			}
			setUserSubscription(data.userSubscription);
			setPaymentPending(data.userSubscription.paymentPendingMethodType !== null);
			log.debug('got userSubscription');
			log.debug(data.userSubscription);
			// let price_base = getPriceCents(location)[data.userSubscription.storageLevel];
			// setPreviewPrice(price_base);
			// setPrice({base:price_base, tax:0, total:price_base});
			setStorageGroups(data.storageGroups);
		} catch (e) {
			log.debug('Error retrieving subscription data', 2);
			log.debug(e, 2);
			setPageNotification({type: 'error', message: 'There was an error retrieving your subscription data'});
		}
	}

	// refresh the user subscription and stripe customer in order to update
	// after changes that may have been processed on Z or stripe server.
	// Includes setting payment country based on the country of the payment card,
	// and setting currency to euro if the payment method calls for it.
	const refresh = async () => {
		log.debug('refresh');
		setOperationPending(true);
		getSubscription();

		let customerResponse = await getUserCustomer();
		if(!customerResponse.success) {
			setStripeCustomer(null);
			setPageNotification(customerResponse);
		} else {
			log.debug(customerResponse.stripeCustomer);
			setStripeCustomer(customerResponse.stripeCustomer);
		}

		setOperationPending(false);
	};

	// call refresh after a delay to give server actions time to process
	const delayedRefresh = (ms = 3000) => {
		log.debug('delayedRefresh', 4);
		setOperationPending(true);
		setTimeout(() => {
			refresh();
		}, ms);
	}

	// clear notification message after a given time, default to 10 seconds
	const delayedClearNotification = (ms = 10000) => {
		setTimeout(() => {
			setPageNotification(null);
		}, ms);
	}

	// disable automatic renewal for logged-in user's subscription
	const setRecur = async (recur) => {
		if (!actionAllowed(operationPending, paymentPending, setPageNotification)) {
			return;
		}
		setOperationPending(true);

		let recurArg = recur ? '1' : '0';
		try {
			let resp = await postFormData('/storage/updateautorenew', { autorenew: recurArg }, { withSession: true });
			let rd = await resp.json();
			log.debug(resp, 4);
			if (!rd.success) {
				throw new Error("Failed updating recur");
			}
			let newStatus = recur ? "enabled" : "disabled";
			setPageNotification({type: 'success', message: `Automatic renewal ${newStatus}`});
			delayedClearNotification();
		} catch (e) {
			log.debug(e);
			setPageNotification({type: 'error', message: 'Error updating subscription. Please try again in a few minutes.'});
		} finally {
			refresh();
			setOperationPending(false);
		}
	};

	//remove all payment methods. This will disable further charges unless new payment details are entered.
	const removePayment = async () => {
		if (!actionAllowed(operationPending, paymentPending, setPageNotification)) {
			return;
		}
		setOperationPending(true);

		try {
			let resp = await postFormData('/storage/removepayment', undefined, { withSession: true });
			log.debug(resp, 4);
			setPageNotification({type: 'success', message: 'Removed payment method'});
		} catch (e) {
			log.error(e);
			setPageNotification({type: 'error', message: 'Error updating payment method. Please try again in a few minutes.'});
		} finally {
			setOperationPending(false);
		}

		refresh();
	};

	// create invoice on Zotero server and link to it
	const handleInvoiceRequest = async (evt) => {
		evt.preventDefault();
		if (!actionAllowed(operationPending, paymentPending, setPageNotification)) {
			return;
		}
		if(operationPending) {
			return;
		}
		setOperationPending(true);
		let result = await createInvoice({ type: 'individual', storageLevel: purchase.storageLevel });
		setPageNotification(result);
		payment.callbacks.cancelPurchase();
		setOperationPending(false);
	};
	

	// *** Render sections of storage widget ***
	if (userSubscription === null) {
		return <LoadingSpinner className='m-auto' loading={true} />
	}

	let currentPlanRows = (<CurrentPlanUsageRows {...{userSubscription, storageGroups}} />);

	//payment row that shows saved payment method if available, and options for it:
	// renew immediately (ahead of expiration), remove payment method, update payment method
	let paymentRow = null;
	if (userSubscription.storageLevel != 1 || stripeCustomer) {
		paymentRow = (<PaymentRow {...{
			userSubscription,
			updatePaymentHandler,
			setRecur,
			renewHandler,
			removePayment,
			paymentMethod: payment.state.defaultPaymentMethod,
			// defaultPaymentMethod,
		}} />);
	}
	
	//based on purchase object and current subscription and customer data, set variables to be passed
	//to subscription handler so it knows if we need payment info and when a charge needs to be made and for how much
	//charge time, currency, discount status, and 
	//Includes constructing plain english description of current subscription, and changes being made before
	//user confirms.
	let Payment = null;
	let storageState = {};
	let callbacks = {};
	if(purchase) {
		let description = personalPurchaseDescription(purchase, userSubscription);

		let error = null;
		let invoicePossible = immediateChargeRequired; // (purchase.type != 'individualPaymentUpdate');
		
		const { type, storageLevel } = purchase;
		if (type == 'individualChange' || type == 'individualRenew') {
			if (overQuota(storageLevel, userSubscription)) {
				error = <Alert color='error'>Current usage exceeds the chosen plan&apos;s quota. You&apos;ll need to choose a larger storage plan, or delete some files from your Zotero storage.</Alert>;
				description = [];
			}
		}
		
		storageState = {
			payment,
			description,//multi-para description of update, whether charge or not
			stripeCustomer,
			purchase,
			invoicePossible,//whether it's allowed to create an invoice for this purchase
			error,
			paymentMethodConfigs: props.paymentMethodConfigs,
		};

		callbacks = {
			setPurchase,
			handleInvoiceRequest,
			refresh,
		};

		if (!props.summary) {
			Payment = (<PurchaseHandler />);
		}
	}

	log.debug(`building storagePlansSection. currency:${payment.state.currency}`);
	log.debug(payment.state);
	let storagePlansSection = userSubscription.institutionUnlimited ? null : <StoragePlansSection {...{
		storagePlans,
		selectPlan,
		userSubscription,
		location,
		currency: payment.state.currency ?? 'usd',
	}} />

	return (
		<ErrorWrapper>
			<StorageContext.Provider value={{storageState, callbacks}}>
			<React.StrictMode>
			<div className='storage-container' >
				<LastSync />
				{Payment}
				{operationPending
					? <div className='modal'><div className='modal-text'><p className='modal-text'>Updating...</p></div></div>
					: null
				}
				<Notifier {...pageNotification} />
				{paymentPendingNotification}
				<div className='user-storage'>
					<Row className='my-3'>
						<Col md='12'>
							<Invoices invoices={props.userInvoices} setNotification={setPageNotification} type={['individual', 'individualRenew']} collapseLabel='Show Invoices' />
							<Invoices invoices={props.userInvoices} setNotification={setPageNotification} type='contribution' collapseLabel='Show Contributions' />
						</Col>
					</Row>
					<Row>
						<Col md='6'>
							<div className='current-storage'>
								<div className='section-header'>
									<b>Current Plan</b>
								</div>
								<div className='section-body'>
									<table className='table'>
										<tbody>
											{currentPlanRows}
											{paymentRow}
											<NextPaymentRow {...{userSubscription, stripeCustomer, setRecur}} />
											<InstitutionalRow institutions={userSubscription.institutions} />
										</tbody>
									</table>
								</div>
							</div>
						</Col>
						<Col md='6'>
							{storagePlansSection}
						</Col>
					</Row>
				</div>
			</div>
			</React.StrictMode>
			</StorageContext.Provider>
		</ErrorWrapper>
	);
}
Storage.propTypes = {
	userSubscription: userSubscriptionShape,
	stripeCustomer: PropTypes.object,
	storageGroups: PropTypes.object,
	summary: PropTypes.bool,
	userInvoices: PropTypes.array,
};

function StorageSummary(props) {
	return <Storage summary={true} {...props} />;
}

export { Storage, StorageSummary, StorageContext, useStorageContext };
