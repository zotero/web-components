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

import {log as logger} from '../Log.js';
const log = logger.Logger('StorageComponent');

import {useReducer, useEffect, useContext} from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Progress, Button } from 'reactstrap';

import {ErrorWrapper} from '../components/ErrorWrapper.jsx';
import {Notifier} from '../Notifier.js';
import {SubscriptionHandler} from './SubscriptionHandler.jsx';
import {PaymentSource} from './PaymentSource.jsx';
import {PendingInvoices} from './PendingInvoices.jsx';

import {StorageContext, PaymentContext, NotifierContext, getUserCustomer, getSubscription, updatePayment, renewNow, selectPlan, START_OPERATION, STOP_OPERATION, notify} from './actions.js';
import {storageReducer, notifyReducer, paymentReducer} from './actions.js';

import {postFormData} from '../ajax.js';

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
	const {storageState} = useContext(StorageContext);
	const {paymentDispatch} = useContext(PaymentContext);
	const {userSubscription} = storageState;
	const current = plan.storageLevel == userSubscription.storageLevel;
	let button = (
		<Button onClick={() => { paymentDispatch(selectPlan(plan)); }}>Select Plan</Button>
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
	const {institutions} = props;
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

function StorageMeter() {
	const {storageState} = useContext(StorageContext);
	const {userSubscription} = storageState;
	
	let quota = userSubscription.quota;
	if (quota == 1000000) {
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

function GroupUsage(props) {
	const {group, usage} = props;
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

function PaymentRow(props) {
	const {defaultSource} = props;
	const {storageState} = useContext(StorageContext);
	const {paymentDispatch} = useContext(PaymentContext);
	const {userSubscription} = storageState;
	
	const updateCardHandler = () => {
		paymentDispatch(updatePayment());
	};
	const renewHandler = () => {
		paymentDispatch(renewNow(userSubscription));
	};
	
	const renewNowButton = <Button color='secondary' size='small' onClick={renewHandler}>Renew Now</Button>;
	if (userSubscription.institutionUnlimited) {
		// don't allow renewal when institution provides unlimited
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
	if (!defaultSource || !userSubscription.recur) {
		let autoRenewButton = <Button color='secondary' onClick={updateCardHandler}>Enable Automatic Renewal</Button>;
		let renewButton = null;
		
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
					<Row className='mt-2'>
						<Col>
							{autoRenewButton}
						</Col>
						<Col>
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

function NextPaymentRow(props) {
	const {userSubscription, cancelRecur} = props;
	const {institutionUnlimited} = userSubscription;
	
	let d = new Date(parseInt(userSubscription.expirationDate) * 1000);
	let formattedExpirationDate = d.toLocaleDateString('en-US', dateFormatOptions);
	
	if (userSubscription.recur && d > Date.now()) {
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

function StoragePlansSection() {
	let planRowNodes = plans.map((plan) => {
		return <StoragePlanRow key={plan.storageLevel} plan={plan} />;
	});

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
		</div>
	);
}

function Storage(props) {
	const [storageState, storageDispatch] = useReducer(storageReducer, {
		userSubscription: props.userSubscription,
		storageGroups: props.storageGroups,
		planQuotas: {},
	});
	const [paymentState, paymentDispatch] = useReducer(paymentReducer, {
		stripeCustomer: props.stripeCustomer,
	});
	const [notifyState, notifyDispatch] = useReducer(notifyReducer, {
		operationPending: false,
		notification: null
	});
	
	const {userSubscription, storageGroups} = storageState;
	const {stripeCustomer, purchase} = paymentState;
	const {operationPending, notification} = notifyState;
	useEffect(
		() => {
			if (!props.userSubscription) {
				getSubscription(storageDispatch);
			}
			if (!props.stripeCustomer) {
				getUserCustomer(paymentDispatch);
			}
		},
		[props.userSubscription, props.stripeCustomer]
	);
	
	const cancelRecur = async () => {
		notifyDispatch({type: START_OPERATION});

		try {
			let resp = await postFormData('/storage/cancelautorenew');
			log.debug(resp, 4);
			notifyDispatch(notify('success', 'Automatic renewal disabled'));
			notifyDispatch({type: STOP_OPERATION});
		} catch (e) {
			log.debug(e);
			notifyDispatch(notify('error', 'Error updating payment method. Please try again in a few minutes.'));
			notifyDispatch({type: STOP_OPERATION});
		}

		getUserCustomer(paymentDispatch);
		getSubscription(storageDispatch);
	};
	
	if (userSubscription === null) {
		return null;
	}

	let expirationDate = <td>Never</td>;
	if (userSubscription.expirationDate && (userSubscription.expirationDate != '0')) {
		let d = new Date(parseInt(userSubscription.expirationDate) * 1000);
		let dateString = <p>{d.toLocaleDateString('en-US', dateFormatOptions)}</p>;
		let numDateFormatOptions = {year: 'numeric', month: 'numeric', day: 'numeric'};
		
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
	if (userSubscription.quota == 1000000) {
		quotaDescription = 'Unlimited';
	}

	let groupUsageNodes = [];
	for (let groupID in userSubscription.usage.groups) {
		let usage = parseInt(userSubscription.usage.groups[groupID]);
		groupUsageNodes.push(<GroupUsage key={groupID} group={storageGroups[groupID]} usage={usage} />);
	}

	let paymentRow = null;
	if (userSubscription.storageLevel != 1) {
		let defaultSource = null;
		if (stripeCustomer) {
			defaultSource = stripeCustomer.default_source;
		}
		paymentRow = (<PaymentRow
			defaultSource={defaultSource}
		/>);
	}
	
	let Payment = null;
	if (purchase && !props.summary) {
		Payment = (<SubscriptionHandler
			purchase={purchase}
		/>);
	}

	return (
		<StorageContext.Provider value={{storageDispatch, storageState}}><PaymentContext.Provider value={{paymentDispatch, paymentState}}><NotifierContext.Provider value={{notifyDispatch, notifyState}}>
			<div className='storage-container'>
				{Payment}
				{operationPending
					? <div className='modal'><div className='modal-text'><p className='modal-text'>Updating...</p></div></div>
					: null
				}
				<Notifier {...notification} />
				<div className='user-storage'>
					<Row className='my-3'>
						<Col md='12'>
							<PendingInvoices userInvoices={props.userInvoices} type='individual' />
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
													<StorageMeter />
												</td>
											</tr>
											{paymentRow}
											<NextPaymentRow userSubscription={userSubscription} cancelRecur={cancelRecur} />
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
		</NotifierContext.Provider></PaymentContext.Provider></StorageContext.Provider>
	);
}
Storage.propTypes = {
	userSubscription: PropTypes.object,
	stripeCustomer: PropTypes.object,
	storageGroups: PropTypes.array,
	summary: PropTypes.bool,
	userInvoices: PropTypes.array,
};

function StorageSummary(props) {
	return <Storage summary={true} {...props} />;
}

export {Storage, StorageContext, StorageSummary};
