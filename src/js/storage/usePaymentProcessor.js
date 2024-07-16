import { log as logger } from '../Log.js';
var log = logger.Logger('usePaymentProcessor.js');

import { useEffect, useState } from 'react';
import { getTaxedPrice, initiatePurchase } from './actions.js';
import { euroCountries, euroPaymentMethods, userSubscriptionShape } from './constants.js';
import { PropTypes } from 'prop-types';
import { clearQueryParams } from './storage_util.js';

//get the payment method and currency for a stripe customer
function defaultCustomerPayment(stripeCustomer) {
	let defaultPM = false;
	if (stripeCustomer) {
		if(stripeCustomer.invoice_settings.default_payment_method) {
			defaultPM = stripeCustomer.invoice_settings.default_payment_method;
		} else if (stripeCustomer.default_source) {
			defaultPM = stripeCustomer.default_source;
		}
	}

	return defaultPM;
};

const stripePaymentCurrency = function(stripeCustomer, paymentMethod, detectedLocation={continent:'EU'}) {
	let currency = 'usd';

	if (paymentMethod && euroPaymentMethods.includes(paymentMethod.type) && currency != 'eur') {
		log.debug(`euro payment method. Setting currency to eur`);
		currency = 'eur';
	} else if(stripeCustomer && stripeCustomer.metadata.currency) {
		log.debug(`customer has currency set. Setting currency to ${stripeCustomer.metadata.currency}`);
		currency = stripeCustomer.metadata.currency;
	} else if(paymentMethod && euroCountries.includes(paymentMethod.country)) {
		log.debug(`payment method has euro country code ${paymentMethod.country}. Setting currency to eur`);
		currency = 'eur';
	}/* else if(detectedLocation.continent == 'EU' ? 'eur' : 'usd') {
		currency = 'eur';
	}*/

	return currency;
}
/*
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
*/
const getPaymentMethodCountry = function(pm) {
	if (pm.billing_details && pm.billing_details.country) {
		return pm.billing_details.country;
	} else if (pm.card && pm.card.country) {
		return (pm.card.country);
	}
	return false;
};

const defaultPurchasePaymentMethod = function(editPayment, confirmationToken, stripeCustomer) {
	//set defaultPaymentMethod, set currency to euro if saved payment method is EU bank, set location if it doesn't match payment method country
	let defaultPaymentMethod = false;
	if (!editPayment) {
		if(confirmationToken) {
			log.debug("setting defaultPaymentMethod from confirmationToken preview");
			defaultPaymentMethod = confirmationToken.payment_method_preview;
		} else if (stripeCustomer) {
			log.debug("setting defaultPaymentMethod from customer");
			defaultPaymentMethod = defaultCustomerPayment(stripeCustomer);
		}
	}
	return defaultPaymentMethod;
}

function usePaymentProcessor({ purchase, stripeCustomer, userSubscription, detectedLocation, setPurchase, paymentResultCallback, returnUrl, cancelable, paymentPending }) {
	log.debug({purchase, stripeCustomer, userSubscription, detectedLocation, setPurchase});
	// const [ stripeCustomer, setStripeCustomer ] = useState(props.stripeCustomer);
	const [ notification, setNotification ] = useState(null);
	const [ operationPending, setOperationPending ] = useState(false);
	const [ editPayment, setEditPayment ] = useState(purchase && ['individualPaymentUpdate', 'contributionPaymentUpdate'].includes(purchase.type));
	// const [ location, setLocation ] = useState('US');
	// const [ showLocation, setShowLocation ] = useState(false);
	const [ currency, setCurrency ] = useState(false);
	const [ price, setPrice ] = useState({base: 2000, tax:0, total:2000});
	const [ taxID, setTaxID ] = useState( stripeCustomer ? stripeCustomer.metadata.taxID : '');
	const [ stripeIntent, setStripeIntent ] = useState(null);
	const [ confirmationToken, setConfirmationToken ] = useState(null);
	const [ taxPriceError, setTaxPriceError ] = useState(false);
	log.debug(`editPayment: ${editPayment}`);

	//set defaultPaymentMethod, set currency to euro if saved payment method is EU bank, set location if it doesn't match payment method country
	let defaultPaymentMethod = defaultPurchasePaymentMethod(editPayment, confirmationToken, stripeCustomer);
	let defaultCurrency = stripePaymentCurrency(stripeCustomer, defaultPaymentMethod, detectedLocation);

	//update currency after getting customer or intent
	useEffect(() => {
		if (stripeCustomer || stripeIntent) {
			if (currency === false) {
				log.debug("currency not yet set");
				setCurrency(defaultCurrency);
			} else {
				log.debug('currency already set');
			}
		}
	}, [stripeCustomer, stripeIntent]);

	if (!editPayment) {
		if (purchase && !confirmationToken && ['individualPaymentUpdate', 'contributionPaymentUpdate'].includes(purchase.type)) {
			setEditPayment(true);
		} else if (purchase && purchase.immediateCharge && !defaultPaymentMethod) {
			log.debug("Need payment and don't have it - setting editPayment true");
			setEditPayment(true);
		}
	}
	
	if (purchase) {
		if (purchase.currency != currency) {
			purchase.currency = currency;
		}
	}

	//remove any in-progress purchase, which will close modal
	const cancelPurchase = () => {
		log.debug('cancelPurchase');
		if(cancelable === false) {
			log.debug("Purchase is not cancelable");
			return;
		}
		setEditPayment(false);
		setPurchase(null);
		setConfirmationToken(false);
		setStripeIntent(false);
	}
	
	/** Effect calls */
	//parse query to check for redirect after stripe payment
	useEffect(() => {
		const showIntentResult = async () => {
			let queryParams = new URLSearchParams(window.location.search);
			const redirectStatus = queryParams.get('redirect_status', null);
			const setupIntentQ = queryParams.get('setup_intent', null);
			const setupIntentSecretQ = queryParams.get('setup_intent_client_secret');
			const paymentIntentQ = queryParams.get('payment_intent', null);
			const paymentIntentSecretQ = queryParams.get('payment_intent_client_secret');
			let result = false;
			if (paymentIntentSecretQ) {
				result = await stripe.retrievePaymentIntent(paymentIntentSecretQ);
			} else if(setupIntentSecretQ) {
				result = await stripe.retrievePaymentIntent(paymentIntentSecretQ);
			}
			if (result) {
				if (result.error) {
					paymentResultCallback({success:false, 'type': 'error', 'message': 'There was an error communicating with our payment processor'});
				} else if (result.paymentIntent) {
					paymentResultCallback({success:true, 'type': 'success', 'message': 'Payment Submitted'});
				} else if (result.setupIntent) {
					paymentResultCallback({success:true, 'type': 'success', 'message': 'Payment Setup Complete'});
				}
				clearQueryParams(['redirect_status', 'setup_intent', 'setup_intent_client_secret', 'payment_intent', 'payment_intent_client_secret']);
			}
		};
		showIntentResult();
	}, [window.location.href]);

	//update prices when the user's location or purchase changes
	useEffect(() => {
		const priceAction = async () => {
			if (purchase && !paymentPending) {
				let customerPaymentDetails = defaultCustomerPayment(stripeCustomer) ?? false;
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
							paymentResultCallback({success:true, type: 'success', message: 'Payment method updated'});
							// delayedClearNotification(4000);
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
							paymentResultCallback({success:false, type: "error", message: "There was an error processing your purchase."});
							cancelPurchase();
						}
					} finally {
						log.debug("finally block for priceAction tax calculation");
						// cancelPurchase();
						setOperationPending(false);
					}
				} else if (customerPaymentDetails && purchase.immediateCharge) {
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
							paymentResultCallback({success:false, type: "error", message: "There was an error processing your purchase."});
							cancelPurchase();
						}
					} finally {
						setOperationPending(false);
					}
				}
			}
		};
		priceAction();
	}, [confirmationToken, purchase]);

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

		let customerPaymentDetails = defaultCustomerPayment(stripeCustomer) ?? false;

		if(confirmationToken && stripeIntent) {
			//confirm clicked for purchase after showing price: confirm stripe intent from client
			try {
				let result = await stripe.confirmPayment({
					clientSecret: stripeIntent.client_secret,
					confirmParams: {
						confirmation_token: confirmationToken.id,
						return_url: returnUrl ?? window.location.href,
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
					paymentResultCallback({success:true, type:'success', message:'Payment Submitted', delayRequired:true});
					cancelPurchase();
					// setNotification({type: 'success', message: ''})
					// delayedRefresh();
				}
			}  catch (err) {
				log.error(err);
				if (err.success === false && err.message) {
					paymentResultCallback({success:false, type: 'error', message: err.message});
				} else {
					log.error("UNEXPECTED THROWN RESPONSE WHEN ATTEMPTING PURCHASE OR CHANGE");
					paymentResultCallback({success:false, type: 'error', message: "There was an error processing your request"});
				}
			} finally {
				log.debug('finally block for confirmationToken+stripeIntent');
				setOperationPending(false);
			}
		} else if(customerPaymentDetails || (purchase.type == 'individualChange' && !purchase.immediateCharge)) {
			//confirm purchase clicked without confirmation token: already have payment details saved or we don't need them - initiate auto-confirmed payment intent
			setOperationPending(true);
			try {
				const autoConfirmPurchase = Object.assign({}, purchase, {autoConfirm:true});
				let [serverPrice, intent] = await initiatePurchase(autoConfirmPurchase);
				// setStripeIntent(null);
				if (intent) {
					setStripeIntent(intent);
				}
				// setStripeIntent(intent);
				if (serverPrice) {
					setPrice(serverPrice);
				}
				setTaxPriceError(false);
				setEditPayment(false);
				let message, delayRequired;
				if (intent) {
					message = 'Payment Submitted';
					delayRequired = true;
				} else {
					message = 'Update Complete';
					delayRequired = false;
				}
				paymentResultCallback({success:true, type:'success', message, delayRequired});
				// delayedRefresh();
			} catch (e) {
				log.debug('caught error from initiatePurchase');
				log.debug(e);
				if (e.success === false && e.message == "Could not calculate taxes") {
					setTaxPriceError(true);
				} else {
					paymentResultCallback({success:false, type: "error", message: "There was an error processing your purchase."});
				}
			} finally {
				log.debug("finally block for autoconfirm Purchase");
				cancelPurchase();
				setOperationPending(false);
			}
		}/* else if(purchase.type == 'individualChange' && !purchase.immediateCharge) {
			//Just change plan without charge
			setOperationPending(true);
			try {
				let [price, intent] = await initiatePurchase(purchase);
				setStripeIntent(intent);
				setPrice(price);
				setTaxPriceError(false);
				setEditPayment(false);
				paymentResultCallback({success:true, type:'success', message:'Update Complete'});
				// delayedRefresh();
			} catch (e) {
				log.debug('caught error from initiatePurchase');
				log.debug(e);
				if (e.success === false && e.message == "Could not calculate taxes") {
					setTaxPriceError(true);
				} else {
					paymentResultCallback({success:false, type: "error", message: "There was an error processing your purchase."});
				}
			} finally {
				log.debug("finally block for no immediate payment individualChange");
				cancelPurchase();
				setOperationPending(false);
			}
		}*/ else {
			log.error("unexpected state in handleConfirmPurchase");
			paymentResultCallback({success:false, type: "error", message: "There was an error processing your change."});
		};
		log.debug('done with confirmPurchase');
		return;
	}

	return {
		state: {
			purchase,
			// description,
			location,
			currency: currency ? currency : 'usd',
			price,
			stripeCustomer,
			stripeIntent,
			confirmationToken,
			defaultPaymentMethod,
			allowEuro: detectedLocation.continent == 'EU',
			allowCN: detectedLocation.continent == 'AS',
			cancelable,
			editPayment,
			notification,
			taxPriceError,
			operationPending,
		},
		callbacks: {
			setNotification,
			setPrice,
			setStripeIntent,
			setConfirmationToken,
			cancelPurchase,
			handleConfirmPurchase,
			setEditPayment,
			setOperationPending,
			setCurrency,
			setTaxID,
			// setLocation,
		}
	}
}

const paymentShape = PropTypes.shape({
	state: PropTypes.shape({
		purchase: PropTypes.Object,
		price: PropTypes.shape({
			base: PropTypes.number,
			taxes: PropTypes.number,
			total: PropTypes.number,
			operationPending: PropTypes.bool
		})
	}).isRequired,
	callbacks: PropTypes.shape({

	}).isRequired,
});

export {
	defaultCustomerPayment,
	getPaymentMethodCountry,
	defaultPurchasePaymentMethod,
	usePaymentProcessor,
	paymentShape,
};
