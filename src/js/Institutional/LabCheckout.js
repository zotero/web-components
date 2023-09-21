/*
TODO:
 - handlePurchase is maybe unnecessary? Is there ever a Lab operation that gets called for
 completed purchase without intent?
 - When lab paid by invoice for new Lab, make sure it is named from name column
 - 
*/

import {log as logger} from '../Log.js';
let log = logger.Logger('LabCheckout');

import { useState, useEffect } from 'react';
import { Button } from 'reactstrap';
import PropTypes from 'prop-types';

import { Notifier } from '../Notifier.js';

import { discountedCountries } from '../storage/constants.js';
import { LocationSelector } from '../storage/LocationSelector.jsx';
import { getCurrentUser, formatCurrency } from '../Utils.js';
import { InstitutionHandler } from './InstitutionHandler.jsx';
import { locationLabPrice, locationLabUserPrice, getCustomerPaymentCountry, isDiscounted } from '../storage/calculations.js';
import { getUserCustomer, chargeDefaultMethod, createInstitutionInvoice } from '../storage/actions.js';
import { buildUrl } from '../wwwroutes.js';

const currentUser = getCurrentUser();

// Allow purchase of a new Lab plan from z.org/storage/institutions
function LabCheckout(props) {
	const [notification, setNotification] = useState(null);
	const [purchase, setPurchase] = useState(null);
	const [stripeCustomer, setStripeCustomer] = useState(props.stripeCustomer);
	const [ location, setLocation ] = useState(props.detectedLocation.country);
	const [ showLocation, setShowLocation ] = useState(Object.keys(discountedCountries).includes(props.detectedLocation.country));
	const [ previewPrice, setPreviewPrice ] = useState(null);
	const [ editPayment, setEditPayment ] = useState(false);
	// const [ awaitingFinalConfirm, setAwaitingFinalConfirm ] = useState(false);
	const [ operationPending, setOperationPending ] = useState(false);

	const [labName, setLabName] = useState('');
	const [fte, setFte] = useState(15);

	const hasDefaultPayment = (stripeCustomer && stripeCustomer.invoice_settings.default_payment_method)
	
	// load stripe customer at start for logged in user if there is one
	useEffect(
		() => {
			if (currentUser && !stripeCustomer) {
				refreshCustomer();
			}
		},
		[props.stripeCustomer]
	);
	
	//remove the pending purchase, closing payment dialog
	const cancelPurchase = () => {
		setPurchase(null);
		setEditPayment(false);
		setOperationPending(false);
	}

	//update FTE from user input, making sure it's a number and if not just set to default 15
	const handleFTEChange = (evt) => {
		let nv = evt.target.value;
		nv = nv.replace(/\D/g, '');
		if (nv != '') {
			nv = parseInt(nv);
			if (isNaN(nv)) {
				nv = 15;
			}
		}
		setFte(nv);
	};

	// handle purchase button click. Lab must have a name. Set the preview price based on location in order to update later if
	//payment card location changes the price. Set the purchase object with the filled values and set for an immediate charge since
	//this is a new purchase
	const handlePurchase = () => {
		if (labName == '') {
			setNotification({type:'error', message: "Please choose a name for your lab. This name will appear as the provider of storage for your users."});
			return;
		}
		let price = locationLabPrice(fte, location);
		setPreviewPrice(price);
		setPurchase({
			type: 'lab',
			numUsers: fte,
			institutionName: labName,
			immediateCharge: true,
		});
	};

	//re-fetch the stripe customer for logged in user if there is one, and figure out a location
	//based on their payment data if there is.
	const refreshCustomer = async () => {
		if (currentUser) {
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
		}
	}

	//show an appropriate success message for a completed payment
	const successNotification = (purchase, respData) => {
		let result, invoiceUrl, manageUrl;
		switch (purchase.type) {
			case 'paymentUpdate':
				result = {
					type: 'success',
					message: <p>Your payment details have been updated.</p>
				};
				break;
			case 'labRenew':
				invoiceUrl = `/storage/invoice/${respData.invoiceID}`;

				result = {
					type: 'success',
					message: <p>Success. An invoice has been created for this charge. You can <a href={invoiceUrl}>view the invoice now</a>, and it will also be available from your <a href='/settings/storage'>storage settings</a>.</p>
				};
				break;
			case 'lab':
				manageUrl = respData.institutionID ? buildUrl('manageInstitution', { institutionID: respData.institutionID }) : false;
				invoiceUrl = respData.invoiceID ? `/storage/invoice/${respData.invoiceID}` : false;

				result = {
					type: 'success',
					message: (
						<>
							<p>Success. Your Lab subscription is being activated.</p>
							{manageUrl ? <p>You can now <a href={manageUrl}>manage your Zotero Lab subscription</a>.</p> : null}
							{invoiceUrl ? <p>You can also <a href={invoiceUrl}>view the invoice for this charge</a>.</p> : null}
							<p>You can always access your active Zotero Lab subscriptions and payment invoices from your <a href='/settings/storage'>storage settings</a>.</p>
						</>
					)
				};
				break;
			case 'addLabUsers':
				invoiceUrl = `/storage/invoice/${respData.invoiceID}`;

				result = {
					type: 'success',
					message: <p>Success. An invoice has been created for this charge. You can <a href={invoiceUrl}>view the invoice now</a>, and it will also be available from your <a href='/settings/storage'>storage settings</a>.</p>
				};
				break;
			case 'institution':
				// TODO
				break;
			default:
				throw new Error('Unknown purchase type');
		}
		return result;
	};

	//handler for confirming a "purchase" action, which can also be a change in storage subscription
	//that does not involve immediate payment or a change in payment details
	const handleConfirmPurchase = async () => {
		log.debug('handleConfirmPurchase', 4);
		log.debug(purchase, 4);
		if (operationPending) {
			log.debug('operation already pending', 4);
			return;
		}
		setOperationPending(true);

		log.debug('stripeIntent is false');
		// no payment intent because we're using the payment method on file
		// start an automatically confirmed payment intent or we are making a change
		// that does not require payment
		try {
			switch (purchase.type) {
				case 'lab':
				case 'labRenew':
				case 'addLabUsers':
					let locationPurchaseData = Object.assign({}, purchase, {location});
					let result = await chargeDefaultMethod(locationPurchaseData);
					if (result.success) {
						const n = successNotification(locationPurchaseData, result);
						setNotification(n);
						//TODO: get user's most recent institution and link
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
		}
	}	

	// callback after PaymentElement confirms intent, or user confirms action that does not require intent
	// if caller has no intent, argument should be false
	// paymentUpdate, labRenew, lab, addLabUsers, institution
	// paymentUpdate: intent used to update user's default PaymentMethod
	// lab, labRenew, addLabUsers: No intent if charging the existing PaymentMethod on file (if user doesn't choose to edit them)
	const handleConfirmIntent = async (stripeIntent) => {
		log.debug('Institution handleConfirmIntent', 4);
		log.debug(stripeIntent, 4);
		log.debug(purchase, 4);
		if (operationPending) {
			log.debug('operation already pending', 4);
			return;
		}
		setOperationPending(true);

		try {
			switch (purchase.type) {
				case 'paymentUpdate':
					// payment added to customer on server, no action needed, just allow reload of data
					setPurchase(null);
					setOperationPending(false);
					setTimeout(async () => {
						refreshCustomer();
					}, 1000);
					//TODO: refresh payment details
					return;
				case 'lab':
				case 'labRenew':
				case 'addLabUsers':
					// payment method added, now user must confirm charge
					// setAwaitingFinalConfirm(true);
					setEditPayment(false);
					// delayed fetch customer so we have payment details from server
					log.debug("getting customer with updated payment");
					setOperationPending(true);
					setTimeout(() => {
						refreshCustomer();
					}, 1000);
					break;
				default:
					throw new Error("unexpected purchase.type");
			}
			
			//TODO: get invoice/institutionID/etc from server for payment just made to link user to

			const result = successNotification(purchase, {});
			setNotification(result);
		} catch (err) {
			log.error(err);
			log.error("UNEXPECTED THROWN RESPONSE WHEN ATTEMPTING PURCHASE OR CHANGE");
			setNotification({type: 'error', message: "There was an error processing your request"});
		} finally {
			cancelPurchase();
		}
	};

	//when user clicks like to create third-party-payable invoice, send request with current purchase to
	//server to do so, then provide link (which will also be available in user's storage settings)
	const handleInvoiceRequest = async (evt) => {
		log.debug('handleInvoiceRequest', 4);
		evt.preventDefault();
		if(operationPending) {
			return;
		}
		log.debug(purchase, 4);
		setOperationPending(true);
		let result = await createInstitutionInvoice(purchase);
		setNotification(result);
		setPurchase(null);
		setOperationPending(false);
	};
	
	// Only allow purchase if the user is logged in so the lab will have a managing account. Otherwise provide quote but don't allow purchase
	let completeAction = null;
	if (currentUser) {
		completeAction = (
			<>
				<div className='form-group row'>
					<label className='col-sm-2 col-form-label' htmlFor='lab_name'>Lab Name:</label>
					<div className='col-sm-9'>
						<input type='text' name='lab_name' className='lab_name form-control' value={labName} onChange={(evt) => { setLabName(evt.target.value); }} />
						<p className='text-muted'>This name will appear as the provider of storage for your users.</p>
					</div>
				</div>
				<div className='form-group row'>
					<p>
						You&apos;re currently logged in as &quot;{currentUser.username}&quot;.
						This will be the account used to manage the user list for your subscription.
						If you&apos;d like to use a different account to manage your subscription, please log in with that account before completing the purchase.
					</p>
				</div>
				<div className='form-group row purchase-line'>
					<Button className='m-auto' color='secondary' onClick={handlePurchase}>Purchase</Button>
				</div>
			</>
		);
	} else {
		completeAction = (
			<div className='form-group row'>
				<p>
					You are not currently logged in.
					To purchase a Zotero Lab subscription, please <a href='/user/login'>log in</a> to the account that will be used to manage the user list for the subscription.
					You&apos;ll need to use that account to make changes to your subscription in the future.
				</p>
			</div>
		);
	}

	//location footer depending on detected location/payment country for differential pricing
	let locationFooter = null;
	if (showLocation) {
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

	let institutionCallbacks = {
		setPurchase,
		setNotification,
		setEditPayment,
		handleConfirmPurchase,
		handleConfirmIntent,
		handleInvoiceRequest,
		setOperationPending,
	};
	// trigger payment modal if we have a pending purchase state
	let Payment = null;
	if (purchase) {
		// Determine requirements for current purchase
		let description = [];
		let chargeAmount = 0;
		let error = null;
		let paymentInfoRequired = false;
		let immediateChargeRequired = true;
		let invoicePossible = false;

		switch (purchase.type) {
		case 'paymentUpdate':
			description.push(`Update your saved payment details for your next renewal. There will be no charge made until your expiration date.`);
			break;
		case 'labRenew':
			description.push(`Renew your current subscription. Zotero Lab for ${fte} users.`);
			description.push(`Your payment method will be charged immediately after confirming.`);
			chargeAmount = locationLabPrice(fte, location);
			immediateChargeRequired = true;
			break;
		case 'lab':
			description.push(`Purchase 1 year of Zotero Lab for ${fte} users.`);
			description.push(`Lab Name: ${labName}`);
			chargeAmount = locationLabPrice(fte, location);
			immediateChargeRequired = true;
			break;
		case 'addLabUsers':
			description.push(`Add ${additionalFTE} users to your current subscription.`);
			description.push(`Your payment method will be charged immediately after confirming.`);
			chargeAmount = locationLabUserPrice(additionalFTE, location);
			immediateChargeRequired = true;
			break;
		case 'institution':
			// TODO
			break;
		default:
			throw new Error('Unknown purchase type');
		}
		
		if (immediateChargeRequired && !hasDefaultPayment && !editPayment) {
			log.debug("setting editPayment to true", 4);
			setEditPayment(true);
		}

		const institutionState = {
			purchase,
			description,
			stripeCustomer,
			currentUser,
			previewPrice,
			chargeAmount,
			immediateChargeRequired,
			error,
			editPayment,
			operationPending,
			previewPriceMismatch: (chargeAmount != previewPrice),
			// awaitingFinalConfirm,
		};

		Payment = (<InstitutionHandler
			{...{
				institutionState,
				callbacks: institutionCallbacks,
			}}
		/>);
	}

	return (
		<div id='lab-checkout'>
			{Payment}
			<p>
				Zotero Lab is ideal for departments, laboratories, and small companies. A simple administrative interface lets you add or remove users from your Zotero Lab subscription at any time.
			</p>
			<p>
				Zotero Lab costs $30 per user, with a minimum of 15 users.
			</p>
			<div className='form-group row'>
				<label className='col-sm-2 col-form-label' htmlFor='lab_fte'>Users:</label>
				<div className='col-sm-9'>
					<input type='text' name='lab_fte' min='15' className='lab_fte form-control' value={fte} onChange={handleFTEChange} />
				</div>
			</div>
			<div className='form-group row'>
				<label className='col-sm-2 col-form-label'>Price</label>
				<div className='col-sm-9'>
					{/* {formatCurrency(labPrice(fte))} */}
					{formatCurrency(locationLabPrice(fte, location))}
					<span>&nbsp;per year, billed annually</span>
				</div>
			</div>
			{completeAction}
			<Notifier {...notification} />
			{locationFooter}
		</div>
	);
}
LabCheckout.defaultProps = {
	fte: 15,
	labName: '',
	institutionID: 0
};

LabCheckout.propTypes = {
	// purchase: PropTypes.func.isRequired,
	fte: PropTypes.number,
	labName: PropTypes.string,
	institutionID: PropTypes.number,
	stripeCustomer: PropTypes.object
};

export { LabCheckout };
