/*
TODO:
 - When lab paid by invoice for new Lab, make sure it is named from name column
*/

import {log as logger} from '../Log.js';
let log = logger.Logger('LabCheckout');

import { useState, useEffect } from 'react';
import { Button } from 'reactstrap';
import PropTypes from 'prop-types';

import { Notifier } from '../Notifier.js';

import { StorageContext } from '../storage/Storage.js';
import { getCurrentUser, formatCurrency } from '../Utils.js';
import { locationLabPrice, locationLabUserPrice, isDiscounted } from '../storage/calculations.js';
import { createInstitutionInvoice, getUserCustomer } from '../storage/actions.js';
import { institutionalPurchaseDescription } from '../storage/storage_util.js';
import { ErrorWrapper } from '../components/ErrorWrapper.jsx';
import { PurchaseHandler } from '../storage/PurchaseHandler.jsx';
import { usePaymentProcessor } from '../storage/usePaymentProcessor.js';

const currentUser = getCurrentUser();

// Allow purchase of a new Lab plan from z.org/storage/institutions
function LabCheckout(props) {
	// log.debug(props);
	const {detectedLocation} = props;
	const [ stripeCustomer, setStripeCustomer ] = useState(props.stripeCustomer);
	const [ purchase, setPurchase ] = useState(null);
	const [ pageNotification, setPageNotification ] = useState(null);
	const [ operationPending, setOperationPending ] = useState(false);
	const [labName, setLabName] = useState('');
	const [fte, setFte] = useState(15);

	let paymentResultCallback = (result) => {
		if (result.success) {
			let message;
			switch (purchase.type) {
				case 'paymentUpdate':
					message = <p>Your payment details have been updated.</p>;
					break;
				case 'labRenew':
					message = <p>Success. You can always manage your Zotero Lab subscriptions from your <a href='/settings/storage'>storage settings</a>.</p>;
					break;
				case 'lab':
					message = <>
						<p>Success. Your Lab subscription is being activated.</p>
						<p>You can always manage your Zotero Lab subscriptions from your <a href='/settings/storage'>storage settings</a>.</p>
					</>;
					break;
				case 'addLabUsers':
					message = <p>Success. You can always manage your Zotero Lab subscriptions from your <a href='/settings/storage'>storage settings</a>.</p>
					break;
				default:
					throw new Error('Unknown purchase type');
			}
			setPageNotification({type:'success', success:true, message});
		} else {
			setPageNotification(result);
		}
	}

	const payment = usePaymentProcessor({
		purchase,
		stripeCustomer,
		detectedLocation,
		setPurchase,
		paymentResultCallback,
		cancelable:true,
	});

	/** Effect calls */
	// load stripe customer at start for logged in user if there is one
	useEffect(
		() => {
			if (currentUser && !stripeCustomer) {
				refreshCustomer();
			}
		},
		[props.stripeCustomer]
	);
	
	/** Callbacks */
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
			setPageNotification({type:'error', message: "Please choose a name for your lab. This name will appear as the provider of storage for your users."});
			return;
		}

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
				setPageNotification(customerResponse);
			} else {
				setStripeCustomer(customerResponse.stripeCustomer);
			}
		}
	}

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
		setPageNotification(result);
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
						<input id="lab_name" type='text' name='lab_name' className='lab_name form-control' value={labName} onChange={(evt) => { setLabName(evt.target.value); }} />
						<p className='text-muted'>This name will appear as the provider of storage for your users.</p>
					</div>
				</div>
				<div id='lab-manager-text' className='form-group row'>
					<p>
						You&apos;re currently logged in as &quot;{currentUser.username}&quot;.
						This will be the account used to manage the user list for your subscription.
						If you&apos;d like to use a different account to manage your subscription, please log in with that account before completing the purchase.
					</p>
				</div>
				<div className='form-group row purchase-line'>
					<Button className='m-auto purchase-button' color='secondary' onClick={handlePurchase}>Purchase</Button>
				</div>
			</>
		);
	} else {
		completeAction = (
			<div id='lab-manager-text' className='form-group row'>
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
	/*
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
	*/
	let callbacks = {
		setPurchase,
		handleInvoiceRequest,
	};

	let storageState;
	// trigger payment modal if we have a pending purchase state
	let Payment = null;
	if (purchase) {
		// Determine requirements for current purchase
		let description = institutionalPurchaseDescription(purchase);
		// let description = [];
		let error = null;
		let invoicePossible = true;
		
		storageState = {
			payment,
			description,//multi-para description of update, whether charge or not
			stripeCustomer,
			purchase,
			invoicePossible,//whether it's allowed to create an invoice for this purchase
			error,
			returnUrl: window.location.href,
		};

		Payment = (<PurchaseHandler title="Purchase Lab" />);
	}

	return (
		<ErrorWrapper>
			<StorageContext.Provider value={{storageState, callbacks}}>
				<div id='lab-checkout'>
					{Payment}
					<p>
						Zotero Lab is ideal for departments, laboratories, and small companies. A simple administrative interface lets you add or remove users from your Zotero Lab subscription at any time.
					</p>
					<p>
						Zotero Lab costs $30 per user, with a minimum of 15 users.
					</p>
					<div className='form-group row'>
						<label className='col col-sm-2 col-form-label' htmlFor='lab_fte'>Users:</label>
						<div className='col col-sm-9'>
							<input id="lab_fte" type='text' name='lab_fte' min='15' className='lab_fte form-control' value={fte} onChange={handleFTEChange} />
						</div>
					</div>
					<div className='form-group row price-row'>
						<label className='col col-sm-2 col-form-label'>Price (excl. tax):</label>
						<div className='col col-sm-9'>
							{/* {formatCurrency(labPrice(fte))} */}
							{formatCurrency(locationLabPrice(fte, location), payment.state.currency)}
							<span>&nbsp;per year, billed annually</span>
						</div>
					</div>
					{completeAction}
					<Notifier {...pageNotification} />
					{locationFooter}
				</div>
				</StorageContext.Provider>
		</ErrorWrapper>
	);
}
LabCheckout.defaultProps = {
	fte: 15,
	labName: '',
	institutionID: 0
};

LabCheckout.propTypes = {
	fte: PropTypes.number,
	labName: PropTypes.string,
	institutionID: PropTypes.number,
	stripeCustomer: PropTypes.object
};

export { LabCheckout };
