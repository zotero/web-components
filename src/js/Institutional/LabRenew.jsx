import { log as logger } from '../Log.js';
let log = logger.Logger('LabRenew');

import { useState } from "react";
import { ErrorWrapper } from "../components/ErrorWrapper";
import { delayedReload, institutionalPurchaseDescription } from "../storage/storage_util";
import { StorageContext } from "../storage/Storage";
import { Button, Collapse, FormGroup, Input, Label } from "reactstrap";
import { usePaymentProcessor } from '../storage/usePaymentProcessor.js';
import { PurchaseHandler } from '../storage/PurchaseHandler.jsx';
import { createInstitutionInvoice } from '../storage/actions.js';

function LabRenew(props) {
	log.debug(props);
	const { setPageNotification, numUsers, name, institutionID, detectedLocation, stripeCustomer } = props;

	// const [ stripeCustomer, setStripeCustomer ] = useState(props.stripeCustomer);
	const [ purchase, setPurchase ] = useState(null);
	const [ operationPending, setOperationPending ] = useState(false);
	// const [labName, setLabName] = useState('');

	const [showRenew, setShowRenew] = useState(false);
	const [showAddUsers, setShowAddUsers] = useState(false);
	const [renewNumUsers, setRenewNumUsers] = useState(numUsers);
	const [additionalUsers, setAdditionalUsers] = useState(1);
	const [error, setError] = useState(null);

	let paymentResultCallback = (result) => {
		setPageNotification(result);
		delayedReload(3000, ['payment_intent', 'payment_intent_client_secret', 'setup_intent', 'setup_intent_client_secret']);
	}

	const payment = usePaymentProcessor({purchase, stripeCustomer, detectedLocation, setPurchase, paymentResultCallback});

	/* callbacks */
	const renewLab = () => {
		usersInt = parseInt(renewNumUsers);
		if (usersInt < 15) {
			usersInt = 15;
		}
		setPurchase({
			type: 'labRenew',
			numUsers: usersInt,
			name,
			institutionID,
			institutionName: name,
			immediateCharge: true,
		});
	};
	
	const purchaseUsers = () => {
		let addUsers = parseInt(additionalUsers);
		if (!(addUsers > 0)) {
			setPageNotification({type:'error', message: 'Invalid number of additional users'});
			setPurchase(null);
			return;
		}
		setPurchase({
			type: 'addLabUsers',
			numUsers: additionalUsers,
			name,
			institutionID,
			institutionName: name,
			immediateCharge: true,
		})
	};
	
	const handleRenewNumUsersChange = (evt) => {
		let nv = evt.target.value;
		nv = nv.replace(/\D/g, '');
		if (nv != '') {
			nv = parseInt(nv);
			if (isNaN(nv)) {
				nv = 15;
			}
		}
		setRenewNumUsers(nv);
	};
	const handleAdditionalUsersChange = (evt) => {
		let nv = evt.target.value;
		nv = nv.replace(/\D/g, '');
		if (nv != '') {
			nv = parseInt(nv);
			if (isNaN(nv)) {
				nv = 15;
			}
		}
		setAdditionalUsers(nv);
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
		setPageNotification(result);
		setPurchase(null);
		setOperationPending(false);
	};


	let storageState;
	let callbacks;

	let Payment = null;
	if (purchase) {
		let description = institutionalPurchaseDescription(purchase);
	
		storageState = {
			payment,
			description,//multi-para description of update, whether charge or not
			stripeCustomer,
			purchase,
			invoicePossible: true,//whether it's allowed to create an invoice for this purchase
			error,
			returnUrl: window.location.href,
		};
	
		callbacks = {
			setPurchase,
			handleInvoiceRequest,
		};

		Payment = (<PurchaseHandler />);
	}

	return (
		<ErrorWrapper>
			<StorageContext.Provider value={{storageState, callbacks}}>
				<div>
					{Payment}
					<Button className='m-4' onClick={() => { setShowRenew(true); setShowAddUsers(false); }}>Renew</Button>
					<Button className='m-4' onClick={() => { setShowAddUsers(true); setShowRenew(false); }}>Add Users</Button>
					<Collapse isOpen={showRenew} className='p-5' timeout={{ exit: 0 }}>
						<FormGroup row>
							<Label htmlFor='lab_num_users'>Users:</Label>
							<Input type='text' name='lab_num_users' value={renewNumUsers} onChange={handleRenewNumUsersChange} />
						</FormGroup>
						<Button onClick={renewLab}>Purchase</Button>
					</Collapse>
					<Collapse isOpen={showAddUsers} className='p-5' timeout={{ exit: 0 }}>
						<FormGroup row>
							<Label htmlFor='additionalUsers'>Additional Users:</Label>
							<Input type='text' name='additionalUsers' value={additionalUsers} onChange={handleAdditionalUsersChange} />
						</FormGroup>
						<Button onClick={purchaseUsers}>Purchase</Button>
					</Collapse>
				</div>
			</StorageContext.Provider>
		</ErrorWrapper>
	);
}
LabRenew.defaultProps = {
	showRenew: false
};

export { LabRenew };
