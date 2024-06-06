/* eslint-disable no-duplicate-imports */
/*
TODO:
 - always create customer. Don't delete customer when disabling auto-renew. Always re-use customer.
 - update customer email along with account primary email.
 - get tax amount based on address and charge amount, and show to user before purchase.
 
 - expire unpaid invoice after 30 days?
 - show primary email in dialog unless invoice
 - make sure paid invoices can only be seen if logged in as invoiceUser or returning from successful charge
 - always create a customer, even for invoices, so that a receipt gets sent from stripe
 - get rid of context/dispatch and just pass down functions a couple levels
 - reload after timer or poll since payment updates are now done in webhook
 - allow selection of payment type before starting intent so we can set up for future usage on payment methods that support it
 - clean up
 x clarify when institutional plan makes individual plan unnecessary
 x clarify when charge won't be made right away, allow to force immediate charge
 x present detailed receipt more obviously after payment
 x use new PaymentModal to get token to create source with card or IBAN
 x don't allow automatic renewal if institution provides storage
 x show that individual subscription won't be renewed with institutional storage
 x add support for Alipay which we may want
 - whether payment/recur is enabled not always detected correctly (Enable automatic renewal and Disable autorenew both shown)
 - make sure invoices always show the information we have for whatever payment method/charge object
 - show link to receipt/invoice immediately after processing payment
 - update list of invoices after delete
 - only show list of invoices or receipts, don't duplicate
 - reload invoice after payment
 - update stripe customer email when primary email updated, or expose separately?
 - fix showing notification behind modal that can't be seen
 - after paying with/adding a saved payment method, "Renew Now" button does not recognize saved payment method until page refresh
 - with saved card payment method, switching to Euro does not set editPayment to true
 - immediate payment in euro did not reflect updated storage quota, took too long to process upgrade and the delayed refresh missed it?
 - if saved payment method is EU bank account for SEPA, "Renew Now" still starts as USD instead of EUR
 x properly show paid invoice/receipt was paid in Euro if it was
 x fix invoice layout at various sizes
 - handleConfirmPurchase is creating an intent for no reason on an individual change?
 - testcases that create old style stripe customer with old card method and tests that everything still shows up and works as expected
  with the new payment intent flow
  - "Renew Now" after adding payment method on same load does not know about the payment method
 - check for redirect with payment intent query param and check/report status.
 - check if we should combine useEffect initiatePurchase from the various components or they need to be differe
 
 - Updating payment method by enabling automatic renew does not refresh payment details shown in default view
*/

import { log as logger } from '../Log.js';
const log = logger.Logger('StorageComponent');

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Progress, Button } from 'reactstrap';

import { ErrorWrapper } from '../components/ErrorWrapper.jsx';
import { Notifier } from '../Notifier.js';
import { PurchaseHandler } from './PurchaseHandler.jsx';
import { PaymentMethod } from './PaymentMethod.jsx';
import { Invoices } from './Invoices.jsx';
import { LocationSelector } from './LocationSelector.jsx';
import { imminentExpiration, calculateNewExpiration, getPriceCents, getStoragePlans, getCustomerPaymentCountry } from './calculations.js';

import { initiatePurchase, getTaxedPrice, chargeDefaultMethod, createInvoice, getUserCustomer } from './actions.js';

import { LastSync } from './LastSync.jsx';
import { ajax, postFormData } from '../ajax.js';
import { LoadingSpinner } from '../LoadingSpinner.js';

import { storageLevelDescriptions, euroPaymentMethods, dateFormatOptions } from './constants.js';
import { defaultPayment } from './storage_util.js';

const overQuota = function (storageLevel, userSubscription) {
	const planQuotas = window.zoteroData.planQuotas;
	let planQuota = planQuotas[storageLevel];
	if (userSubscription.usage.total > planQuota) {
		return true;
	}
	return false;
};

const userSubscriptionShape = PropTypes.shape({
	quota: PropTypes.number,
	storageLevel: PropTypes.number,
	usage: PropTypes.shape({
		total: PropTypes.number
	}),
	institutionUnlimited: PropTypes.bool,
	recur: PropTypes.bool,
	expirationDate: PropTypes.number,
});

const storageUrl = window.zoteroConfig.baseWebsiteUrl ? `${window.zoteroConfig.baseWebsiteUrl}/settings/storage` : '/settings/storage';

//Row to select the corresponding storage plan
function StoragePlanRow(props) {
	const { plan, userSubscription, selectPlan } = props;

	const current = plan.storageLevel == userSubscription.storageLevel;
	let button = (
		<Button color='secondary' size='sm' onClick={() => { selectPlan(plan); }}>Select Plan</Button>
	);
	
	let rowClass = '';
	if (current) {
		button = 'Current Plan';
		rowClass = 'current-plan';
	}
	if (plan.storageLevel == 1) {
		button = '';
	}
	return (
		<tr key={plan.storageLevel} className={rowClass}>
			<td>{plan.description}</td>
			<td>{plan.priceString}</td>
			<td>
				{button}
			</td>
		</tr>
	);
}

StoragePlanRow.propTypes = {
	plan: PropTypes.shape({
		storageLevel: PropTypes.number,
		description: PropTypes.string,
		price: PropTypes.string
	}).isRequired,
	userSubscription: userSubscriptionShape,
	selectPlan: PropTypes.func.isRequired,
};

//row showing a single institution subscription note and asking user to verify email if not already done
function InstitutionProvides(props) {
	const { institution } = props;
	let quotaDescription = `${institution.storageQuota} MB of storage`;
	if (institution.storageQuota == 1000000) {
		quotaDescription = 'unlimited storage';
	}
	if (!institution.validated) {
		return (
			<p>{institution.name} provides {quotaDescription} for {institution.email}. <a href='/settings/account#manage-emails'>Confirm your email address</a> to take advantage.</p>
		);
	} else {
		return (
			<p>{institution.name} provides {quotaDescription} for {institution.email}</p>
		);
	}
}
InstitutionProvides.propTypes = {
	institution: PropTypes.shape({
		storageQuota: PropTypes.number,
		validated: PropTypes.bool,
		name: PropTypes.string,
		email: PropTypes.string
	})
};

//the row in storage settings listing all institution provided storage
function InstitutionalRow(props) {
	const { institutions } = props;
	if (!institutions) {
		return null;
	}
	if (institutions.length > 0) {
		let instNodes = institutions.map(function (institution) {
			return <InstitutionProvides key={`${institution.name}_${institution.expiration}`} institution={institution} />;
		});
		return (
			<tr>
				<th>Institutional Storage</th>
				<td>{instNodes}</td>
			</tr>
		);
	}
	return null;
}
InstitutionalRow.propTypes = {
	institutions: PropTypes.arrayOf(PropTypes.object)
};

//usage meter showing proportion of storage quota being currently used
function StorageMeter(props) {
	const { userSubscription } = props;
	
	let quota = userSubscription.quota;
	if (quota >= 1000000) {
		return null;
	}

	let quotaPercentage = parseFloat(userSubscription.usage.total) / parseFloat(quota) * 100.0;
	quotaPercentage = quotaPercentage.toFixed(1);

	let color;
	switch (true) {
	case (quotaPercentage < 40):
		color = 'success';
		break;
	case (quotaPercentage < 70):
		color = 'warning';
		break;
	case (quotaPercentage >= 70):
		color = 'danger';
		break;
	default:
		color = 'success';
	}

	return (
		<div>
			<div className='text-center'>{quotaPercentage}%</div>
			<Progress value={quotaPercentage} max='100' color={color} />
		</div>
	);
}
StorageMeter.propTypes = {
	userSubscription: userSubscriptionShape,
}

//text saying how much storage the given group is using
function GroupUsage(props) {
	const { group, usage } = props;
	if (!group) {
		return null;
	}
	return (
		<p>{group.title} - {usage} MB</p>
	);
}
GroupUsage.propTypes = {
	group: PropTypes.shape({
		title: PropTypes.string
	}),
	usage: PropTypes.number
};

// Row that shows user's payment method and allows updating the method that will be used
// or forcing an immediate renewal charge regardless of scheduled automatic renewal
function PaymentRow(props) {
	log.debug('PaymentRow', 4);
	log.debug(props, 4);
	const { defaultPaymentMethod, userSubscription, updatePaymentHandler, renewHandler, removePayment } = props;
	const paymentMethod = defaultPaymentMethod;

	const renewNowButton = <Button color='secondary' size='sm' className='m-1' onClick={renewHandler}>Renew Now</Button>;
	if (userSubscription.institutionUnlimited) {
		// don't allow renewal when institution provides unlimited
		return (
			<tr>
				<th>Payment Method</th>
				<td>
					<PaymentMethod source={paymentMethod} />
					<Row className='mt-2'>
						<Col>
							<Button color='secondary' size='sm' onClick={updatePaymentHandler}>Update Payment</Button>
						</Col>
					</Row>
				</td>
			</tr>
		);
	}
	if (!paymentMethod || !userSubscription.recur) {
		let autoRenewButton = <Button color='secondary' size='sm' className='m-1' onClick={updatePaymentHandler}>Enable Automatic Renewal</Button>;
		let removePaymentButton = <Button color='secondary' size='sm' className='m-1' onClick={removePayment}>Remove Payment Details</Button>;
		let renewButton = null;
		
		//show either "Renew Now" or both "Renew Now" and "Enable AutoRenew"
		//depending on expiration date. Always allow charging early, but only allow
		//delaying charge if expiration is at least 2 weeks away
		let expiration = new Date(userSubscription.expirationDate * 1000);
		if (expiration < (Date.now() + (1000 * 60 * 60 * 24 * 15))) {
			// expiration less than 2 weeks away, charge card now
			autoRenewButton = renewNowButton;
		} else {
			renewButton = renewNowButton;
		}
		return (
			<tr>
				<th>Payment</th>
				<td>
					<PaymentMethod source={paymentMethod} />
					<Row className='mt-2'>
						<Col>
							{paymentMethod ? removePaymentButton : null}
							{!userSubscription.recur && (userSubscription.storageLevel > 1) ? autoRenewButton : null}
							{userSubscription.storageLevel > 1 ? renewButton : null}
						</Col>
					</Row>
				</td>
			</tr>
		);
	}
	return (
		<tr>
			<th>Payment Method</th>
			<td>
				<PaymentMethod source={paymentMethod} />
				<Row className='mt-2'>
					<Col>
						<Button color='secondary' size='sm' className='m-1' onClick={updatePaymentHandler}>Update Payment</Button>
					</Col>
					<Col>
						{userSubscription.storageLevel > 1 ? renewNowButton : null}
					</Col>
				</Row>
			</td>
		</tr>
	);
}
PaymentRow.propTypes = {
	defaultPaymentMethod: PropTypes.object,
	userSubscription: userSubscriptionShape,
};

// show when the next automatic payment will be made, or plan will expire,
// or that renewal is unnecessary while covered by institution
function NextPaymentRow(props) {
	const { userSubscription, cancelRecur, stripeCustomer } = props;
	const { institutionUnlimited } = userSubscription;
	
	let d = new Date(parseInt(userSubscription.expirationDate) * 1000);
	let formattedExpirationDate = d.toLocaleDateString('en-US', dateFormatOptions);
	const defaultPM = defaultPayment(stripeCustomer);
	
	if (userSubscription.recur && (d > Date.now()) && defaultPM) {
		// autorenew is enabled and set for sometime in the future
		return (
			<tr>
				<th>Next Payment</th>
				<td>
					<Row>
						<Col>{institutionUnlimited ? 'Renewal will be automatically disabled if you remain covered by an institutional storage subscription. ' : null }{formattedExpirationDate}</Col>
					</Row>
					<Row>
						<Col>
							<Button color='secondary' size='sm' onClick={cancelRecur}>Disable Automatic Renewal</Button>
						</Col>
					</Row>
				</td>
			</tr>
		);
	} else if (d < Date.now()) {
		// expiration has already passed without renewal
		return null;
	} else if (institutionUnlimited) {
		// covered by institution which prevents needing renewal
		return null;
	} else {
		// no automatic renewal. Must be done manually before expiration to avoid interruption.
		return (
			<tr>
				<th>Next Payment</th>
				<td>
					<p>Plan will revert to free tier if not renewed</p>
				</td>
			</tr>
		);
	}
}

function StoragePlansSection(props) {
	const { location, setLocation, storagePlans } = props;
	let planRowNodes = storagePlans.map((plan) => {
		return <StoragePlanRow 
			key={plan.storageLevel}
			plan={plan}
			userSubscription={props.userSubscription}
			selectPlan={props.selectPlan}
		/>;
	});

	let locationFooter = null;
	if (props.showLocation) {
		locationFooter = (
			<div className='section-footer'>
				<LocationSelector {...{
					location,
					setLocation,
				}} />
				<p>Prices shown require that the payment card address matches the selected country.</p>
			</div>
		);
	}

	return (
		<div className='change-storage-plan'>
			<div className='section-header'>
				<b>Change Plan</b>
			</div>
			<div className='section-body'>
				<table className='table table-striped'>
					<tbody>
						<tr>
							<th>Storage Amount</th>
							<th colSpan={2}>Annual Price (USD) <span className='hint text-muted small'>plus tax where applicable</span></th>
						</tr>
						{planRowNodes}
					</tbody>
				</table>
			</div>
			{locationFooter}
		</div>
	);
}

/*
Flows:
 - First time subscription -> purchase object, payment details/confirmationToken, refresh/show price/paymentIntent, confirm charge
 - update payment details -> purchase object, payment details/confirmationToken, save to customer/setupIntent/show renewal price without charging
 - renew now, expiration imminent -> purchase object, show existing paymentDetails/show price, confirmCharge (create/charge paymentIntent with existing customer) OR change paymentDetails/confirmationToken, refresh/show price/paymentIntent, confirmCharge
 - force payment now ^as above
 - Change current plan without immediate payment -> purchase object, confirmChange (no intent)
 - change current plan and pay now (imminent expiration) -> purchaseObject, renewNow flow
 - Lab Payment
 - Lab Renewal
 - Lab receipt
 - create invoice for any type of payment:
  - allow payments for third parties without Zotero account, needs to be limited to prevent card-testing
  vars: purchase (type, storageLevel), haveCustomerPayment, confirmationToken, 
  if (purchase) {
	if (customerPaymentDetails) {
		getPrice => {
			setPrice
		}
	} else if (confirmationToken) {
		initiatePurchase => {
			setPrice;
			setStripeIntent;
		}
	}

	handleConfirm:
		if (confirmationToken) {
			stripe.confirmIntent
		} else if(customerPaymentDetails) {
			initiatePurchase (autoConfirm:True) =>

		}
  }
*/
function Storage(props) {
	// log.debug(props);
	const [ userSubscription, setUserSubscription ] = useState(props.userSubscription);
	const [ storageGroups, setStorageGroups ] = useState({});
	const [ stripeCustomer, setStripeCustomer ] = useState(props.stripeCustomer);
	const [ purchase, setPurchase ] = useState(null);
	const [ notification, setNotification ] = useState(null);
	const [ operationPending, setOperationPending ] = useState(false);
	const [ editPayment, setEditPayment ] = useState((purchase && purchase.type == 'individualPaymentUpdate'));
	const [ location, setLocation ] = useState(null);
	const [ showLocation, setShowLocation ] = useState(false);
	const [ currency, setCurrency ] = useState('usd');
	// const [ priceCents, setPriceCents ] = useState(null);
	const [ previewPrice, setPreviewPrice ] = useState(null);
	const [ price, setPrice ] = useState({base: 2000, tax:0, total:2000});
	const [ storagePlans, setStoragePlans ] = useState([]);
	// const [ awaitingFinalConfirm, setAwaitingFinalConfirm ] = useState(false);
	// const [ havePaymentMethod, setHavePaymentMethod ] = useState(defaultPayment(stripeCustomer) !== null);
	const [ taxID, setTaxID ] = useState( stripeCustomer ? stripeCustomer.metadata.taxID : '');
	const [ stripeIntent, setStripeIntent ] = useState(null);
	const [ confirmationToken, setConfirmationToken ] = useState(null);
	const [ paymentStarted, setPaymentStarted ] = useState(false);
	const [ taxPriceError, setTaxPriceError ] = useState(false);

	const stripe = window.stripe;// useStripe();

	log.debug({userSubscription, stripeCustomer, purchase, previewPrice}, 4);

	//set defaultPaymentMethod and set currency to euro if saved payment method is EU bank
	let defaultPaymentMethod = false;
	if(confirmationToken) {
		defaultPaymentMethod = confirmationToken.payment_method_preview;
	} else if (stripeCustomer) {
		defaultPaymentMethod = stripeCustomer.default_source || stripeCustomer.invoice_settings.default_payment_method;
	}

	//parse query to check for redirect after stripe payment
	useEffect(() => {
		let queryParams = new URLSearchParams(window.location.search);
		const redirectStatus = queryParams.get('redirect_status', null);
		const setupIntentQ = queryParams.get('setup_intent', null);
		const setupIntentSecretQ = queryParams.get('setup_intent_client_secret');
		const paymentIntentQ = queryParams.get('payment_intent', null);
		const paymentIntentSecretQ = queryParams.get('payment_intent_client_secret');
		if (redirectStatus == 'succeeded') {
			if (setupIntentQ) {
				setNotification({'type': 'success', 'message': 'Payment setup complete'});
			} else if(paymentIntentQ) {
				setNotification({'type': 'success', 'message': 'Payment complete'});
			}
		}
	}, [window.location.href]);
	
	//fetch userSubscription and stripeCustomer if either not included in props
	useEffect(
		() => {
			if (!userSubscription || !stripeCustomer) {
				refresh();
			}
		},
		[props.userSubscription, props.stripeCustomer]
	);

	useEffect(() => {
		if (purchase) {
			if (purchase.currency != currency) {
				setPurchase(Object.assign({}, purchase, {currency}));
			}
		}
	}, [currency]);

	//update dependent variables when purchase changes
	useEffect(() => {
		if (!purchase) {
			return;
		}
		switch (purchase.type) {
			case 'individualPaymentUpdate':
				setEditPayment(true);
				break;
			case 'individualRenew':
				break;
			case 'individualChange':
				break;
			default:
				
		}
		if (currency != 'usd' && !purchase.currency) {
			setPurchase(Object.assign({}, purchase, {currency}));
		}
	}, [purchase]);

	//update prices when the user's location changes
	useEffect(() => {
		setStoragePlans(getStoragePlans(location));
		const priceAction = async () => {
			if (purchase) {
				let customerPaymentDetails = defaultPayment(stripeCustomer) ?? false;
				let immediateChargeRequired = (purchase.type != 'individualPaymentUpdate') && (purchase.type == 'individualRenew' || imminentExpiration(userSubscription.expirationDate));
				if (confirmationToken) {
					log.debug("have confirmationToken: getting price and creating intent that we'll confirm after price");
					let locationPurchase = Object.assign({}, purchase, {
						confirmationTokenID: confirmationToken?.id ?? null,
						taxID
					});
					setOperationPending(true);
					try{
						let [taxedPrice, intent] = await initiatePurchase(locationPurchase);
						if (intent.next_action) {
							if (intent.next_action.redirect_to_url) {
								window.location.href = intent.next_action.redirect_to_url.url;
							}
						}
						if (intent.object == 'setup_intent' && intent.status == 'succeeded') {
							setStripeIntent(null);
							setNotification({type: 'success', message: 'Payment method updated'});
							delayedClearNotification(4000);
							cancelPurchase();
						} else {
							setStripeIntent(intent);
						}
						setPrice(taxedPrice);
						setTaxPriceError(false);
						setEditPayment(false);
					} catch (e) {
						log.debug('caught error from initiatePurchase');
						log.debug(e);
						if (e.success === false && e.message == "Could not calculate taxes") {
							setTaxPriceError(true);
						} else {
							setNotification({type: "error", message: "There was an error processing your purchase."});
							cancelPurchase();
						}
					} finally {
						log.debug("finally block for priceAction tax calculation");
						cancelPurchase();
						setOperationPending(false);
					}
				} else if (customerPaymentDetails && immediateChargeRequired) {
					log.debug("have customer details, getting price without intent");
					//get taxed price based on address from existing customer payment details
					setOperationPending(true);
					try {
						let taxedPrice = await getTaxedPrice(purchase);
						log.debug(taxedPrice);
						setPrice(taxedPrice);
						setTaxPriceError(false);
					} catch (e) {
						log.debug('caught error from getTaxedPrice');
						log.debug(e);
						setTaxPriceError(true);
						if (e.success === false && e.message == "Could not calculate taxes") {
							setTaxPriceError(true);
						} else {
							setNotification({type: "error", message: "There was an error processing your purchase."});
							cancelPurchase();
						}
					} finally {
						setOperationPending(false);
					}
				}
			}
		};
		priceAction();
			/*
			let priceCents = 0;
			if (purchase) {
				priceCents = getPriceCents(location)[purchase.storageLevel];
			}
			let price = {
				base: priceCents,
				tax: 0,
				total: priceCents,
			};
			log.debug(price);
			setPrice(price);
			setPriceCents(priceCents);
			let plans = getStoragePlans(location);
			setStoragePlans(plans);
			*/
	}, [confirmationToken, purchase]);

	//callback for "Update Payment Details" button
	const updatePaymentHandler = () => {
		const nv = Object.assign({}, {
			type: 'individualPaymentUpdate',
			storageLevel: userSubscription.storageLevel,
		});
		setPurchase(nv);
	};

	//callback for "Renew  Now" button
	const renewHandler = () => {
		log.debug('renewHandler', 4);
		setEditPayment(false);
		const price = getPriceCents(location)[userSubscription.storageLevel];
		setPreviewPrice(price);
		const nv = Object.assign({}, {
			type: 'individualRenew',
			storageLevel: userSubscription.storageLevel,
		});
		setPurchase(nv);
	};

	//remove any in-progress purchase, which will close modal
	const cancelPurchase = () => {
		log.debug('cancelling purchase', 4);
		setEditPayment(false);
		setPurchase(null);
		setConfirmationToken(false);
		setStripeIntent(false);
	}

	//callback for choosing a storage plan
	// editPayment to false so that it can be decided if it's necessary
	// based on the new purchase. Set the preview price from when the user clicked
	// so that we can notify them if it changes once they add a payment method and we
	// tie any discount to their location
	const selectPlan = (plan) => {
		log.debug('selectPlan', 4);
		setEditPayment(false);
		let price = getPriceCents(location)[plan.storageLevel];
		setPreviewPrice(price);
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
			setUserSubscription(data.userSubscription);
			log.debug('got userSubscription - setting price');
			log.debug(data.userSubscription);
			let price_base = getPriceCents(location)[data.userSubscription.storageLevel];
			setPreviewPrice(price_base);
			setPrice({base:price_base, tax:0, total:price_base});
			setStorageGroups(data.storageGroups);
		} catch (e) {
			log.debug('Error retrieving subscription data', 2);
			log.debug(e, 2);
			setNotification({type: 'error', message: 'There was an error retrieving your subscription data'});
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
			setNotification(customerResponse);
		} else {
			log.debug(customerResponse.stripeCustomer);
			setStripeCustomer(customerResponse.stripeCustomer);
			let paymentCountry = getCustomerPaymentCountry(customerResponse.stripeCustomer);
			if (paymentCountry) {
				setLocation(paymentCountry);
			}
			log.debug('got stripeCustomer, setting defaultPaymentMethod');
			const defaultPaymentMethod = defaultPayment(customerResponse.stripeCustomer);
			if (defaultPaymentMethod && euroPaymentMethods.includes(defaultPaymentMethod.type) && currency != 'eur') {
				setCurrency('eur');
			}
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
			setNotification(null);
		}, ms);
	}

	// disable automatic renewal for logged-in user's subscription
	const cancelRecur = async () => {
		setOperationPending(true);

		try {
			let resp = await postFormData('/storage/cancelautorenew', undefined, { withSession: true });
			log.debug(resp, 4);
			setNotification({type: 'success', message: 'Automatic renewal disabled'});
			delayedClearNotification();
		} catch (e) {
			log.debug(e);
			setNotification({type: 'error', message: 'Error updating payment method. Please try again in a few minutes.'});
		} finally {
			setOperationPending(false);
		}

		refresh();
	};

	//remove all payment methods and delete stripe customer. This will disable further charges
	//unless new payment details are entered.
	const removePayment = async () => {
		setOperationPending(true);

		try {
			let resp = await postFormData('/storage/removepayment', undefined, { withSession: true });
			log.debug(resp, 4);
			setNotification({type: 'success', message: 'Removed payment method'});
		} catch (e) {
			log.error(e);
			setNotification({type: 'error', message: 'Error updating payment method. Please try again in a few minutes.'});
		} finally {
			setOperationPending(false);
		}

		refresh();
	};

	//handler for confirming a "purchase" action, which can also be a change in storage subscription
	//that does not involve immediate payment or a change in payment details
	const handleConfirmPurchase = async () => {
		log.debug('handleConfirmPurchase', 2);
		log.debug(purchase, 2);
		log.debug(stripeIntent);
		log.debug(confirmationToken);
		if (operationPending) {
			log.debug('operation already pending', 2);
			return;
		}
		setOperationPending(true);

		let customerPaymentDetails = defaultPayment(stripeCustomer) ?? false;

		if(confirmationToken && stripeIntent) {
			//confirm clicked for purchase after showing price: confirm stripe intent from client
			try {
				let result = await stripe.confirmPayment({
					clientSecret: stripeIntent.client_secret,
					confirmParams: {
						confirmation_token: confirmationToken.id,
						return_url: window.location.href,
					},
					redirect: "always"
				});
				if (result.error) {
					setNotification({type: 'error', message: "There was an error processing your request"});
					log.error(result);
				} else {
					log.error("Successful intent did not redirect");
					//successful confirmation, reset values and 
					setStripeIntent(null);
					setConfirmationToken(null);
					setEditPayment(false);
					setNotification({type: 'success', message: ''})
					delayedRefresh();
				}
			}  catch (err) {
				log.error(err);
				if (err.success === false && err.message) {
					setNotification({type: 'error', message: err.message});
				} else {
					log.error("UNEXPECTED THROWN RESPONSE WHEN ATTEMPTING PURCHASE OR CHANGE");
					setNotification({type: 'error', message: "There was an error processing your request"});
				}
			} finally {
				log.debug('finally block for confirmationToken+stripeIntent');
				cancelPurchase();
				setOperationPending(false);
			}
		} else if(customerPaymentDetails) {
			//confirm purchase clicked without confirmation token: already have payment details saved - initiate auto-confirmed payment intent
			setPaymentStarted(true);
			setOperationPending(true);
			try {
				const autoConfirmPurchase = Object.assign({}, purchase, {autoConfirm:true});
				let [price, intent] = await initiatePurchase(autoConfirmPurchase);
				setStripeIntent(intent);
				setPrice(price);
				setTaxPriceError(false);
				setEditPayment(false);
				delayedRefresh();
			} catch (e) {
				log.debug('caught error from initiatePurchase');
				log.debug(e);
				if (e.success === false && e.message == "Could not calculate taxes") {
					setTaxPriceError(true);
				} else {
					setNotification({type: "error", message: "There was an error processing your purchase."});
					cancelPurchase();
				}
			} finally {
				log.debug("finally block for autoconfirm Purchase");
				cancelPurchase();
				setOperationPending(false);
			}
		};
		log.debug('done with confirmPurchase');
		return;
	}

	// create invoice on Zotero server and link to it
	const handleInvoiceRequest = async (evt) => {
		evt.preventDefault();
		if(operationPending) {
			return;
		}
		setOperationPending(true);
		let result = await createInvoice({ type: 'individual', storageLevel: purchase.storageLevel });
		setNotification(result);
		cancelPurchase();
		setOperationPending(false);
	};
	
	if (userSubscription === null) {
		return <LoadingSpinner className='m-auto' loading={true} />
	}

	let expirationDate = <td>Never</td>;
	if (userSubscription.expirationDate && (userSubscription.expirationDate != '0')) {
		let d = new Date(parseInt(userSubscription.expirationDate) * 1000);
		let dateString = <p>{d.toLocaleDateString('en-US', dateFormatOptions)}</p>;
		let numDateFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric' };
		
		if (d < Date.now()) {
			expirationDate = (<td>
				{dateString}
				<p>Your previous Zotero storage subscription has expired.</p>
			</td>);
		} else if (userSubscription.recur) {
			expirationDate = (<td>
				{dateString}
				<p>Your Zotero storage subscription is set to automatically renew {d.toLocaleDateString('en-US', numDateFormatOptions)}.</p>
			</td>);
		} else {
			expirationDate = (<td>
				{dateString}
				<p>Your Zotero storage subscription will expire {d.toLocaleDateString('en-US', numDateFormatOptions)} if you don&apos;t renew before then.</p>
			</td>);
		}
	}

	//number of MB or "Unlimited"
	let quotaDescription = userSubscription.quota + ' MB';
	if (userSubscription.quota >= 1000000) {
		quotaDescription = 'Unlimited';
	}

	//build list of storage usage by groups owned the this user
	let groupUsageNodes = [];
	for (let groupID in userSubscription.usage.groups) {
		let usage = parseInt(userSubscription.usage.groups[groupID]);
		groupUsageNodes.push(<GroupUsage key={groupID} group={storageGroups[groupID]} usage={usage} />);
	}

	//payment row that shows saved payment method if available, and options for it:
	// renew immediately (ahead of expiration), remove payment method, update payment method
	let paymentRow = null;
	if (userSubscription.storageLevel != 1 || stripeCustomer) {
		let paymentRowProps = {
			userSubscription,
			updatePaymentHandler,
			renewHandler,
			removePayment,
			defaultPaymentMethod: defaultPayment(stripeCustomer),
		};
		
		paymentRow = (<PaymentRow {...paymentRowProps} />);
	}
	
	//based on purchase object and current subscription and customer data, set variables to be passed
	//to subscription handler so it knows if we need payment info and when a charge needs to be made and for how much
	//charge time, currency, discount status, and 
	//Includes constructing plain english description of current subscription, and changes being made before
	//user confirms.
	let Payment = null;
	let immediateChargeRequired = false;
	let paymentInfoRequired = false;
	if(purchase) {
		// Determine requirements for current purchase
		let description = [];
		// let chargeAmount = 0;
		let error = null;
		let invoicePossible = false;
		immediateChargeRequired = (purchase.type != 'individualPaymentUpdate') && (purchase.type == 'individualRenew' || imminentExpiration(userSubscription.expirationDate));
		
		const { type, storageLevel } = purchase;
		switch (type) {
		case 'individualChange':
			log.debug('individualChange', 4);
			log.debug(userSubscription, 4);
			description.push(`Change storage plan to ${storageLevelDescriptions[storageLevel]}`);
			if (immediateChargeRequired) {
				log.debug('immediateCharge is requried', 4);
				let newExp = calculateNewExpiration(userSubscription.expirationDate, userSubscription.storageLevel, storageLevel);
				description.push(`Expiring on ${newExp.toLocaleDateString('en-US', dateFormatOptions)}.`);
				description.push(`A charge will be made to your account once you confirm your order.`);
				// chargeAmount = priceCents[storageLevel];
				invoicePossible = true;
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
			paymentInfoRequired = true;
			break;
		case 'individualRenew':
			description.push(`Renew your current ${storageLevelDescriptions[storageLevel]} subscription.`);
			description.push(`Your account will be charged immediately after confirming.`);
			// chargeAmount = priceCents[storageLevel];
			immediateChargeRequired = true;
			invoicePossible = true;
			break;
		default:
			throw new Error('Unknown purchase type');
		}
		if (type == 'individualChange' || type == 'individualRenew') {
			if (overQuota(storageLevel, userSubscription)) {
				error = <Alert color='error'>Current usage exceeds the chosen plan&apos;s quota. You&apos;ll need to choose a larger storage plan, or delete some files from your Zotero storage.</Alert>;
				description = [];
			}
		}
		
		log.debug(`immediateChargeRequired: ${immediateChargeRequired}`, 4);
		log.debug(stripeCustomer, 4);

		if (!editPayment) {
			if ((immediateChargeRequired || paymentInfoRequired) && !defaultPaymentMethod && !editPayment) {
				log.debug('setting editPayment true - 840');
				setEditPayment(true);
			} else if(purchase.type == 'individualPaymentUpdate' && !editPayment) {
				log.debug('setting editPayment true - 843');
				setEditPayment(true);
			}
		}

		if (immediateChargeRequired && !purchase.immediateCharge) {
			log.debug('immediateChargeRequired and no immediateCharge set on purchase - 858');
			setPurchase(Object.assign({}, purchase, {immediateCharge: true}));
		}

		let storageState = {
			description,//multi-para description of update, whether charge or not
			// userSubscription,
			stripeCustomer,
			stripeIntent,
			confirmationToken,
			taxID,
			allowEuro: true,// props.detectedLocation.continent == 'EU',
			// awaitingFinalConfirm,
			purchase,
			location,
			currency,
			invoicePossible,//whether it's allowed to create an invoice for this purchase
			// chargeAmount,
			// previewPriceMismatch: !!(chargeAmount && (chargeAmount != previewPrice)),
			price,
			previewPriceMismatch: !!(price.total && (price.base != previewPrice)),
			error,
			editPayment,
			operationPending,
			notification,
			returnUrl: storageUrl,
			taxPriceError
		};

		let storageCallbacks = {
			setNotification,
			setPurchase,
			setPrice,
			setTaxID,
			setStripeIntent,
			setConfirmationToken,
			cancelPurchase,
			handleConfirmPurchase,
			// handleConfirmIntent,
			handleInvoiceRequest,
			setEditPayment,
			setOperationPending,
			setCurrency,
			setLocation,
			refresh,
			// setHavePaymentMethod,
		};

		if (!props.summary) {
			Payment = (<PurchaseHandler
				{...{
					storageState,
					callbacks: storageCallbacks,
				}}
			/>);
		}
	}

	return (
		<ErrorWrapper>
			<React.StrictMode>
			<div className='storage-container'  inert={operationPending ? 'true' : undefined}>
				<LastSync />
				{Payment}
				{operationPending
					? <div className='modal'><div className='modal-text'><p className='modal-text'>Updating...</p></div></div>
					: null
				}
				<Notifier {...notification} />
				<div className='user-storage'>
					<Row className='my-3'>
						<Col md='12'>
							<Invoices invoices={props.userInvoices} setNotification={setNotification} type={['individual', 'individualRenew']} collapseLabel='Show Invoices' />
							<Invoices invoices={props.userInvoices} setNotification={setNotification} type='contribution' collapseLabel='Show Contributions' />
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
											<tr>
												<th>Quota</th>
												<td>{quotaDescription}</td>
											</tr>
											<tr>
												<th>Expiration</th>
												{expirationDate}
											</tr>
											<tr>
												<th>Current Usage</th>
												<td>
													<p>My Library - {userSubscription.usage.library} MB</p>
													{groupUsageNodes}
													<p>Total - {userSubscription.usage.total} MB</p>
													<StorageMeter {...{userSubscription}} />
												</td>
											</tr>
											{paymentRow}
											<NextPaymentRow {...{userSubscription, stripeCustomer, cancelRecur}} />
											<InstitutionalRow institutions={userSubscription.institutions} />
										</tbody>
									</table>
								</div>
							</div>
						</Col>
						<Col md='6'>
							{userSubscription.institutionUnlimited ? null : <StoragePlansSection {...{
								storagePlans,
								selectPlan,
								userSubscription,
								location,
								setLocation,
								showLocation,
							}} />}
						</Col>
					</Row>
				</div>
			</div>
			</React.StrictMode>
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

export { Storage, StorageSummary };
