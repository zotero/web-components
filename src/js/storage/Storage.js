/* eslint-disable no-duplicate-imports */
/*
TODO:
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


Flows:
 - First time subscription
 - update payment details
 - renew now, expiration imminent
 - force payment now (for multiple years?)
 - Change current plan without immediate payment
 - change current plan and pay now
 - Lab Payment
 - Lab Renewal
 - Lab receipt
 - allow payments for third parties
*/

import { log as logger } from '../Log.js';
const log = logger.Logger('StorageComponent');

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Progress, Button } from 'reactstrap';

import { ErrorWrapper } from '../components/ErrorWrapper.jsx';
import { Notifier } from '../Notifier.js';
import { SubscriptionHandler } from './SubscriptionHandler.jsx';
import { PaymentSource } from './PaymentSource.jsx';
import { Invoices } from './Invoices.jsx';
import { LocationSelector } from './LocationSelector.jsx';
import { imminentExpiration, calculateNewExpiration, getPriceCents, getStoragePlans, getCustomerPaymentCountry, isDiscounted } from './calculations.js';

import { chargeDefaultMethod, createInvoice, getUserCustomer } from './actions.js';

import { LastSync } from './LastSync.jsx';
import { ajax, postFormData } from '../ajax.js';
import { LoadingSpinner } from '../LoadingSpinner.js';

import { storageLevelDescriptions, discountedCountries } from './constants.js';

const dateFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

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

function defaultPayment(stripeCustomer) {
	let defaultPM = false;
	if (stripeCustomer) {
		if (stripeCustomer.default_source) {
			defaultPM = stripeCustomer.default_source;
		} else if(stripeCustomer.invoice_settings.default_payment_method) {
			defaultPM = stripeCustomer.invoice_settings.default_payment_method;
		}
	}
	return defaultPM;
};

function StoragePlanRow(props) {
	const { plan, userSubscription, selectPlan } = props;

	const current = plan.storageLevel == userSubscription.storageLevel;
	let button = (
		<Button onClick={() => { selectPlan(plan); }}>Select Plan</Button>
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

function InstitutionalRow(props) {
	const { institutions } = props;
	if (!institutions) {
		return null;
	}
	if (institutions.length > 0) {
		let instNodes = institutions.map(function (institution) {
			return <InstitutionProvides key={institution.name} institution={institution} />;
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
	const { defaultSource, defaultPaymentMethod, userSubscription, updateCardHandler, renewHandler, removePayment } = props;
	
	let paymentMethod = defaultSource || defaultPaymentMethod;

	const renewNowButton = <Button color='secondary' size='sm' className='m-1' onClick={renewHandler}>Renew Now</Button>;
	if (userSubscription.institutionUnlimited) {
		// don't allow renewal when institution provides unlimited
		return (
			<tr>
				<th>Payment Method</th>
				<td>
					<PaymentSource source={paymentMethod} />
					<Row className='mt-2'>
						<Col>
							<Button color='secondary' size='sm' onClick={updateCardHandler}>Update Payment</Button>
						</Col>
					</Row>
				</td>
			</tr>
		);
	}
	if (!paymentMethod || !userSubscription.recur) {
		let autoRenewButton = <Button color='secondary' size='sm' className='m-1' onClick={updateCardHandler}>Enable Automatic Renewal</Button>;
		let removePaymentButton = <Button color='secondary' size='sm' className='m-1' onClick={removePayment}>Remove Payment Details</Button>;
		let renewButton = null;
		
		//show either "Renew Now" or both "Renew Now" and "Enable AutoRenew"
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
					<PaymentSource source={paymentMethod} />
					<Row className='mt-2'>
						<Col>
							{paymentMethod ? removePaymentButton : null}
							{!userSubscription.recur ? autoRenewButton : null}
							{renewButton}
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
				<PaymentSource source={paymentMethod} />
				<Row className='mt-2'>
					<Col>
						<Button color='secondary' size='sm' className='m-1' onClick={updateCardHandler}>Update Payment</Button>
					</Col>
					<Col>
						{renewNowButton}
					</Col>
				</Row>
			</td>
		</tr>
	);
}
PaymentRow.propTypes = {
	defaultSource: PropTypes.object,
	defaultPaymentMethod: PropTypes.object,
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
							<Button color='secondary' size='small' onClick={cancelRecur}>Disable Autorenew</Button>
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
							<th>Annual Price (USD)</th>
							<th></th>
						</tr>
						{planRowNodes}
					</tbody>
				</table>
			</div>
			{locationFooter}
		</div>
	);
}

function Storage(props) {
	// log.debug(props);
	const [ userSubscription, setUserSubscription ] = useState(props.userSubscription);
	const [ storageGroups, setStorageGroups ] = useState({});
	const [ stripeCustomer, setStripeCustomer ] = useState(props.stripeCustomer);
	const [ purchase, setPurchase ] = useState(null);
	const [ notification, setNotification ] = useState(null);
	const [ operationPending, setOperationPending ] = useState(false);
	const [ editPayment, setEditPayment ] = useState((purchase && purchase.type == 'individualPaymentUpdate'));
	const [ location, setLocation ] = useState(props.detectedLocation.country);
	const [ showLocation, setShowLocation ] = useState(props.detectedLocation.country != 'US');
	const [ priceCents, setPriceCents ] = useState(null);
	const [ previewPrice, setPreviewPrice ] = useState(null);
	const [ storagePlans, setStoragePlans ] = useState([]);
	const [ awaitingFinalConfirm, setAwaitingFinalConfirm ] = useState(false);

	log.debug({userSubscription, stripeCustomer, purchase, previewPrice});
	const choosePaymentType = (paymentType) => {
		let nv = Object.assign({}, purchase, {paymentMethodType: paymentType})
		setPurchase(nv);
	}

	const setCurrency = (currency) => {
		let newPurchase = Object.assign({}, purchase, {currency});
		cancelPurchase();
		setPurchase(newPurchase);
	}

	const updateCardHandler = () => {
		setPurchase({
			type: 'individualPaymentUpdate',
			storageLevel: userSubscription.storageLevel,
		});
	};
	const renewHandler = () => {
		log.debug('renewHandler');
		let price = getPriceCents(location)[userSubscription.storageLevel];
		setPreviewPrice(price);
		setPurchase({
			type: 'individualRenew',
			storageLevel: userSubscription.storageLevel,
		})
	};

	useEffect(
		() => {
			if (!userSubscription || !stripeCustomer) {
				refresh();
			}
		},
		[props.userSubscription, props.stripeCustomer]
	);

	useEffect(
		() => {
			setPriceCents(getPriceCents(location));
			let plans = getStoragePlans(location);
			setStoragePlans(plans);
		},
		[location]
	);

	const cancelPurchase = () => {
		setPurchase(null);
	}

	const selectPlan = (plan) => {
		log.debug('selectPlan');
		let price = getPriceCents(location)[plan.storageLevel];
		setPreviewPrice(price);
		setPurchase({
			type: 'individualChange',
			storageLevel: plan.storageLevel
		});
	}
	
	const getSubscription = async () => {
		log.debug('getSubscription', 4);
		try {
			let resp = await ajax({ url: '/storage/usersubscription' });
			let data = await resp.json();
			log.debug(data);
			setUserSubscription(data.userSubscription);
			setStorageGroups(data.storageGroups);
		} catch (e) {
			log.debug('Error retrieving subscription data', 2);
			log.debug(e, 2);
			setNotification({type: 'error', message: 'There was an error retrieving your subscription data'});
		}
	}
	/*
	const getUserCustomer = async () => {
		log.debug('getUserCustomer', 4);
		try {
			let resp = await ajax({ url: '/storage/getusercustomer' });
			log.debug(resp, 4);
			let data = await resp.json();
			setStripeCustomer(data);
			// set location to country on card
			if (data && data.invoice_settings.default_payment_method) {
				let dpm = data.invoice_settings.default_payment_method;
				if (dpm.card && dpm.card.country) {
					setLocation(dpm.card.country);
					if (!Object.keys(discountedCountries).includes(dpm.card.country)) {
						setShowLocation(false);
					} else {
						setShowLocation(true);
					}
				}
			}
		} catch (e) {
			log.debug('Error retrieving customer data', 2);
			log.debug(e, 2);
			setNotification({type: 'error', message: 'There was an error retrieving your subscription data'});
		}
	}
	*/
	const refresh = async () => {
		log.debug('refresh');
		setOperationPending(true);
		getSubscription();

		let customerResponse = await getUserCustomer();
		if(!customerResponse.success) {
			setStripeCustomer(null);
			setNotification(customerResponse);
		} else {
			setStripeCustomer(customerResponse.stripeCustomer);
			let paymentCountry = getCustomerPaymentCountry(customerResponse.stripeCustomer);
			if (paymentCountry) {
				setLocation(paymentCountry);
				if (isDiscounted(paymentCountry)) {
					setShowLocation(true);
				} else {
					setShowLocation(false);
				}
			}
		}
		// getUserCustomer(setStripeCustomer, setLocation, setShowLocation, setNotification);
		setOperationPending(false);
	};

	const delayedRefresh = () => {
		log.debug('delayedRefresh');
		setOperationPending(true);
		setTimeout(() => {
			refresh();
		}, 3000);
	}

	const cancelRecur = async () => {
		setOperationPending(true);

		try {
			let resp = await postFormData('/storage/cancelautorenew', undefined, { withSession: true });
			log.debug(resp, 4);
			setNotification({type: 'success', message: 'Automatic renewal disabled'});
		} catch (e) {
			log.debug(e);
			setNotification({type: 'error', message: 'Error updating payment method. Please try again in a few minutes.'});
		} finally {
			setOperationPending(false);
		}

		refresh();
	};

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

	const handleConfirmPurchase = async () => {
		log.debug('handleConfirmPurchase');
		log.debug(purchase);
		if (operationPending) {
			log.debug('operation already pending');
			return;
		}
		setOperationPending(true);

		// no payment intent because we're using the payment method on file
		// start an automatically confirmed payment intent or we are making a change
		// that does not require payment
		try {
			let purchaseData = Object.assign({}, purchase, {location});
			switch (purchase.type) {
				case 'individualChange':
					log.debug('individualChange');
					let response = await ajax({
						type: 'POST',
						withSession: true,
						// url: '/storage/purchase',
						url: '/storage/newstripeintent',
						data: JSON.stringify(purchaseData),
						throwOnError: false,
					});
					result = await response.json();
					log.debug(result, 3);
					setNotification({type: result.type, message: result.message})
					refresh();
					break;
				case 'individual':
				case 'individualCharge':
				case 'individualRenew':
					let result = await chargeDefaultMethod(purchaseData);
					if (result.success) {
						setNotification({type: 'success', message: 'Your payment has been processed.'});
						// refresh storage and subscription again after 3 seconds
						delayedRefresh();
					}
					break;
				default:
					throw new Error(`unexpected purchase.type: ${purchase.type}`);
			}
		} catch (err) {
			log.error(err);
			if (err.success === false && err.message) {
				setNotification({type: 'error', message: err.message});
			} else {
				log.error("UNEXPECTED THROWN RESPONSE WHEN ATTEMPTING PURCHASE OR CHANGE");
				setNotification({type: 'error', message: "There was an error processing your request"});
			}
		} finally {
			cancelPurchase();
			setOperationPending(false);
		}
	}

	// callback after PaymentElement confirms intent, or user confirms action that does not require intent
	// if caller has no intent, argument should be false
	// individualChange: no intent, just changing the plan
	// individualRenew: No intent if charging the existing PaymentMethod on file (if user doesn't choose to edit them)
	// individualPaymentUpdate: intent used to update user's default PaymentMethod
	const handleConfirmIntent = async (stripeIntent) => {
		log.debug('handleConfirmIntent');
		log.debug(stripeIntent);
		log.debug(purchase);
		if (operationPending) {
			log.debug('operation already pending');
			return;
		}
		setOperationPending(true);

		try {
			switch (purchase.type) {
				case 'individualPaymentUpdate':
					// payment added to customer on server, no action needed, just allow reload of data
					cancelPurchase();
					setOperationPending(false);
					delayedRefresh();
					return;
				case 'individual':
				case 'individualCharge':
				case 'individualRenew':
					// payment method added, now user must confirm charge
					setAwaitingFinalConfirm(true);
					setEditPayment(false);
					// delayed fetch customer so we have payment details from server
					log.debug("getting customer with updated payment");
					setOperationPending(true);
					setTimeout(() => {
						refresh();
						// getUserCustomer(setStripeCustomer, setLocation, setShowLocation, setNotification);
					}, 1000);
					break;
				default:
					throw new Error("unexpected purchase.type");
			}
		} catch (err) {
			log.error(err);
			log.error("UNEXPECTED THROWN RESPONSE WHEN ATTEMPTING PURCHASE OR CHANGE");
			setNotification({type: 'error', message: "There was an error processing your request"});
		}
	};

	// create invoice and link to it
	const handleInvoiceRequest = async (evt) => {
		evt.preventDefault();
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

	let quotaDescription = userSubscription.quota + ' MB';
	if (userSubscription.quota >= 1000000) {
		quotaDescription = 'Unlimited';
	}

	let groupUsageNodes = [];
	for (let groupID in userSubscription.usage.groups) {
		let usage = parseInt(userSubscription.usage.groups[groupID]);
		groupUsageNodes.push(<GroupUsage key={groupID} group={storageGroups[groupID]} usage={usage} />);
	}

	let paymentRow = null;
	if (userSubscription.storageLevel != 1 || stripeCustomer) {
		let paymentRowProps = {
			userSubscription,
			updateCardHandler,
			renewHandler,
			removePayment,
		};
		if (stripeCustomer) {
			paymentRowProps.defaultSource = stripeCustomer.default_source;
			paymentRowProps.defaultPaymentMethod = stripeCustomer.invoice_settings.default_payment_method;
		}
		
		paymentRow = (<PaymentRow {...paymentRowProps} />);
	}
	
	let Payment = null;
	if(purchase) {
		// Determine requirements for current purchase
		let description = [];
		let chargeAmount = 0;
		let error = null;
		let paymentInfoRequired = false;
		let immediateChargeRequired = imminentExpiration(userSubscription.expirationDate);
		let invoicePossible = false;

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
				chargeAmount = priceCents[storageLevel];
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
			chargeAmount = priceCents[storageLevel];
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
		
		log.debug(`immediateChargeRequired: ${immediateChargeRequired}`);
		log.debug(stripeCustomer);
		let havePaymentMethod = false;
		if (stripeCustomer && stripeCustomer.deleted !== true) {
			if (stripeCustomer.default_source !== null || stripeCustomer.invoice_settings.default_payment_method !== null) {
				havePaymentMethod = true;
			}
		}
		// (stripeCustomer && (stripeCustomer.deleted !== true) && (stripeCustomer.default_source !== null || stripeCustomer.invoice_settings.default_payment_method !== null));
		if (!awaitingFinalConfirm && !editPayment) {
			if ((immediateChargeRequired || paymentInfoRequired) && !havePaymentMethod && !editPayment) {
				setEditPayment(true);
			} else if(purchase.type == 'individualPaymentUpdate' && !editPayment) {
				setEditPayment(true);
			}/* else {
				log.debug("not setting editPayment to true", 4);
			}*/
		}

		if (immediateChargeRequired && !purchase.immediateCharge) {
			setPurchase(Object.assign({}, purchase, {immediateCharge: true}));
		}

		// let chargeDescription = storageLevel ? storageLevelDescriptions[storageLevel] : "Update payment method";

		let storageCallbacks = {
			setNotification,
			cancelPurchase,
			handleConfirmPurchase,
			handleConfirmIntent,
			handleInvoiceRequest,
			setEditPayment,
			setOperationPending,
			choosePaymentType,
			setCurrency,
			setLocation,
		};

		log.debug(`editPayment: ${editPayment}`);
		if (!props.summary) {
			Payment = (<SubscriptionHandler
				{...{
					description,//multi-para description of update, whether charge or not
					// chargeDescription,//description for stripe charge
					// userSubscription,
					stripeCustomer,
					allowEuro: props.detectedLocation.continent == 'EU',
					awaitingFinalConfirm,
					purchase,
					location,
					invoicePossible,//whether it's allowed to create an invoice for this purchase
					chargeAmount,
					previewPriceMismatch: !!(chargeAmount && (chargeAmount != previewPrice)),
					error,
					editPayment,
					operationPending,
					callbacks: storageCallbacks,
				}}
				returnUrl={storageUrl}
			/>);
		}
	}

	return (
		<ErrorWrapper>
			<div className='storage-container'>
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
