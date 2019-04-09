'use strict';

/*
TODO:
 - clean up
 x clarify when institutional plan makes individual plan unnecessary
 x clarify when charge won't be made right away, allow to force immediate charge
 x present detailed receipt more obviously after payment
 x use new PaymentModal to get token to create source with card or IBAN
 x don't allow automatic renewal if institution provides storage
 x show that individual subscription won't be renewed with institutional storage

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

// import {log as logger} from '../Log.js';
// const log = logger.Logger('StorageComponent');

import {useReducer, useEffect, useContext, createContext} from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Progress, Button } from 'reactstrap';

import {Notifier} from '../Notifier.js';
import SubscriptionHandler from './SubscriptionHandler.jsx';
import {PaymentSource} from './PaymentSource.jsx';

import {cancelRecur, getUserCustomer, getSubscription, updatePayment, renewNow, selectPlan, storageReducer, notify} from './actions.js';

const dateFormatOptions = {year: 'numeric', month: 'long', day: 'numeric'};

const plans = [
	{
		storageLevel: 1,
		description: '300 MB',
		price: 'Free',
		discountedPrice: 'Free'
	},
	{
		storageLevel: 2,
		description: '2 GB',
		price: '$20',
		discountedPrice: '$16'
	},
	{
		storageLevel: 3,
		description: '6 GB',
		price: '$60',
		discountedPrice: '$48'
	},
	{
		storageLevel: 6,
		description: 'Unlimited',
		price: '$120',
		discountedPrice: '$96'
	}
];

function StoragePlanRow(props) {
	const {plan} = props;
	const {dispatch, userSubscription} = useContext(StorageDispatch);
	
	const current = plan.storageLevel == userSubscription.storageLevel;
	let button = (
		<Button onClick={()=>{dispatch(selectPlan(plan));}}>Select Plan</Button>
	);
	
	let rowClass = '';
	if(current){
		button = 'Current Plan';
		rowClass = 'current-plan';
	}
	if(plan.storageLevel == 1) {
		button = '';
	}
	return (
		<tr key={plan.storageLevel} className={rowClass}>
			<td>{plan.description}</td>
			<td>{userSubscription.discountEligible ? plan.discountedPrice : plan.price}</td>
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
		discountedPrice: PropTypes.string,
		price: PropTypes.string
	}).isRequired,
};

function InstitutionProvides(props) {
	const {institution} = props;
	let quotaDescription = `${institution.storageQuota} MB of storage`;
	if(institution.storageQuota == 1000000){
		quotaDescription = 'unlimited storage';
	}
	if(!institution.validated){
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
	const {institutions} = props;
	if(!institutions) {
		return null;
	}
	if(institutions.length > 0) {
		let instNodes = institutions.map(function(institution){
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

function StorageMeter() {
	const {userSubscription} = useContext(StorageDispatch);

	let quota = userSubscription.quota;
	if(quota == 1000000) {
		return null;
	}

	let quotaPercentage = parseFloat(userSubscription.usage.total) / parseFloat(quota) * 100.0;
	quotaPercentage = quotaPercentage.toFixed(1);

	let color;
	switch(true){
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
			<div className="text-center">{quotaPercentage}%</div>
			<Progress value={quotaPercentage} max='100' color={color} />
		</div>
	);
}

function GroupUsage(props) {
	const {group, usage} = props;
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

function PaymentRow(props) {
	const {defaultSource} = props;
	const {dispatch, userSubscription} = useContext(StorageDispatch);
	
	const updateCardHandler = () => {
		dispatch(updatePayment());
	};
	const renewHandler = () => {
		dispatch(renewNow(userSubscription));
	};
	
	const renewNowButton = <Button color='secondary' size='small' onClick={renewHandler}>Renew Now</Button>;
	if(userSubscription.institutionUnlimited){
		//don't allow renewal when institution provides unlimited
		return (
			<tr>
				<th>Payment Method</th>
				<td>
					<PaymentSource source={defaultSource} />
					<Row className='mt-2'>
						<Col>
							<Button color='secondary' size='small' onClick={updateCardHandler}>Update Payment</Button>
						</Col>
					</Row>
				</td>
			</tr>
		);
	}
	if(!defaultSource || !userSubscription.recur){
		let paymentButton = <Button color='secondary' onClick={updateCardHandler}>Enable Automatic Renewal</Button>;

		let expiration = new Date(userSubscription.expirationDate * 1000);
		if(expiration < (Date.now() + (1000*60*60*24*15))) {
			//expiration less than 2 weeks away, charge card now
			paymentButton = renewNowButton;
		}
		return (
			<tr>
				<th>Payment</th>
				<td>
					<p>{paymentButton}</p>
				</td>
			</tr>
		);
	}
	return (
		<tr>
			<th>Payment Method</th>
			<td>
				<PaymentSource source={defaultSource} />
				<Row className='mt-2'>
					<Col>
						<Button color='secondary' size='small' onClick={updateCardHandler}>Update Payment</Button>
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
};

function NextPaymentRow() {
	const {dispatch, userSubscription} = useContext(StorageDispatch);
	const {institutionUnlimited} = userSubscription;
	let d = new Date(parseInt(userSubscription.expirationDate)*1000);
	let formattedExpirationDate = d.toLocaleDateString('en-US', dateFormatOptions);
	
	if(userSubscription.recur && d > Date.now()){
		//autorenew is enabled and set for sometime in the future
		return (
			<tr>
				<th>Next Payment</th>
				<td>
					<Row>
						<Col>{institutionUnlimited ? 'Renewal will be automatically disabled if you remain covered by an institutional storage subscription. ' : null }{formattedExpirationDate}</Col>
					</Row>
					<Row>
						<Col>
							<Button color='secondary' size='small' onClick={()=>{cancelRecur(dispatch);}}>Disable Autorenew</Button>
						</Col>
					</Row>
				</td>
			</tr>
		);
	} else if(d < Date.now()) {
		//expiration has already passed without renewal
		return null;
	} else if(institutionUnlimited) {
		//covered by institution which prevents needing renewal
		return null;
	} else {
		//no automatic renewal. Must be done manually before expiration to avoid interruption.
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

function StoragePlansSection(){
	let planRowNodes = plans.map((plan)=>{
		return <StoragePlanRow key={plan.storageLevel} plan={plan} />;
	});

	return (
		<div className='change-storage-plan'>
			<div className='section-header'>
				<b>Change Plan</b>
			</div>
			<div className='section-body'>
				<table className="table table-striped">
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
		</div>
	);
}

const StorageDispatch = createContext(null);

function Storage(props){
	const [state, dispatch] = useReducer(storageReducer, {
		userSubscription:props.userSubscription,
		storageGroups:[],
		planQuotas:{},
		stripeCustomer:props.stripeCustomer,
		operationPending:false,
		notification:null
	});
	
	const {userSubscription, storageGroups, stripeCustomer, operationPending, notification, subscriptionChange} = state;
	
	useEffect(
		()=>{
			if(!props.userSubscription){
				getSubscription(dispatch);
			}
			if(!props.stripeCustomer){
				getUserCustomer(dispatch);
			}
		},
		[props.userSubscription, props.stripeCustomer]
	);
	
	const storageNotify = (type, message) => {
		dispatch(notify(type, message));
	};
	
	if(userSubscription === null){
		return null;
	}

	let expirationDate = <td>Never</td>;
	if(userSubscription.expirationDate && (userSubscription.expirationDate != '0')) {
		let d = new Date(parseInt(userSubscription.expirationDate)*1000);
		let dateString = <p>{d.toLocaleDateString('en-US', dateFormatOptions)}</p>;
		let numDateFormatOptions = {year: 'numeric', month: 'numeric', day: 'numeric'};
		
		if(d < Date.now()){
			expirationDate = (<td>
				{dateString}
				<p>Your previous Zotero storage subscription has expired.</p>
			</td>);
		} else if(userSubscription.recur){
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
	if(userSubscription.quota == 1000000) {
		quotaDescription = 'Unlimited';
	}

	let groupUsageNodes = [];
	for(let groupID in userSubscription.usage.groups){
		let usage = parseInt(userSubscription.usage.groups[groupID]);
		groupUsageNodes.push(<GroupUsage key={groupID} group={storageGroups[groupID]} usage={usage} />);
	}

	let paymentRow = null;
	if(userSubscription.storageLevel != 1) {
		let defaultSource = null;
		if(stripeCustomer){
			defaultSource = stripeCustomer.default_source;
		}
		paymentRow = (<PaymentRow 
			defaultSource={defaultSource}
		/>);
	}
	
	let Payment = null;
	if(subscriptionChange){
		Payment = (<SubscriptionHandler
			subscriptionChange={subscriptionChange}
		/>);
	}

	return (
		<StorageDispatch.Provider value={{dispatch, stripeCustomer, userSubscription, storageNotify}}>
		<div className='storage-container'>
			{Payment}
			{operationPending ? 
				<div className='modal'><div className='modal-text'><p className='modal-text'>Updating...</p></div></div> :
				null
			}
			<Notifier {...notification} />
			<div className='user-storage'>
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
												<StorageMeter />
											</td>
										</tr>
										{paymentRow}
										<NextPaymentRow cancelRecur={()=>{cancelRecur(dispatch);}} />
										<InstitutionalRow institutions={userSubscription.institutions} />
									</tbody>
								</table>
							</div>
						</div>
					</Col>
					<Col md='6'>
						{userSubscription.institutionUnlimited ? null : <StoragePlansSection />}
					</Col>
				</Row>
			</div>
		</div>
		</StorageDispatch.Provider>
	);
}
Storage.propTypes = {
	userSubscription: PropTypes.object,
	stripeCustomer: PropTypes.object
};

function StorageSummary(props){
	const [state, dispatch] = useReducer(storageReducer, {
		userSubscription:props.userSubscription,
		storageGroups:[],
		planQuotas:{},
		stripeCustomer:props.stripeCustomer,
		operationPending:false,
		notification:null
	});
	
	const {userSubscription, storageGroups, stripeCustomer, operationPending, notification} = state;
	
	useEffect(
		()=>{
			if(!props.userSubscription){
				getSubscription(dispatch);
			}
			if(!props.stripeCustomer){
				getUserCustomer(dispatch);
			}
		},
		[props.userSubscription, props.stripeCustomer]
	);
	
	const storageNotify = (type, message) => {
		dispatch(notify(type, message));
	};
	
	if(userSubscription === null){
		return null;
	}

	let expirationDate = <td>Never</td>;
	if(userSubscription.expirationDate && (userSubscription.expirationDate != '0')) {
		let d = new Date(parseInt(userSubscription.expirationDate)*1000);
		let dateString = <p>{d.toLocaleDateString('en-US', dateFormatOptions)}</p>;
		let numDateFormatOptions = {year: 'numeric', month: 'numeric', day: 'numeric'};
		
		if(d < Date.now()){
			expirationDate = (<td>
				{dateString}
				<p>Your previous Zotero storage subscription has expired.</p>
			</td>);
		} else if(userSubscription.recur){
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
	if(userSubscription.quota == 1000000) {
		quotaDescription = 'Unlimited';
	}

	let groupUsageNodes = [];
	for(let groupID in userSubscription.usage.groups){
		let usage = parseInt(userSubscription.usage.groups[groupID]);
		groupUsageNodes.push(<GroupUsage key={groupID} group={storageGroups[groupID]} usage={usage} />);
	}

	let paymentRow = null;
	if(userSubscription.storageLevel != 1) {
		let defaultSource = null;
		if(stripeCustomer){
			defaultSource = stripeCustomer.default_source;
		}
		paymentRow = (<PaymentRow 
			defaultSource={defaultSource}
		/>);
	}
	
	return (
		<StorageDispatch.Provider value={{dispatch, stripeCustomer, userSubscription, storageNotify}}>
		<div className='storage-container'>
			{operationPending ? 
				<div className='modal'><div className='modal-text'><p className='modal-text'>Updating...</p></div></div> :
				null
			}
			<Notifier {...notification} />
			<div className='user-storage'>
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
												<StorageMeter />
											</td>
										</tr>
										{paymentRow}
										<NextPaymentRow cancelRecur={()=>{cancelRecur(dispatch);}} />
										<InstitutionalRow institutions={userSubscription.institutions} />
									</tbody>
								</table>
							</div>
						</div>
					</Col>
					<Col md='6'>
						{userSubscription.institutionUnlimited ? null : <StoragePlansSection />}
					</Col>
				</Row>
			</div>
		</div>
		</StorageDispatch.Provider>
	);
}
StorageSummary.propTypes = {
	userSubscription: PropTypes.object,
	stripeCustomer: PropTypes.object
};

export {Storage, StorageDispatch, StorageSummary};
