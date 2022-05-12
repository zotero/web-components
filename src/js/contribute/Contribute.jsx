import { log as logger } from '../Log.js';
let log = logger.Logger('Contribute');

import { useState, useEffect } from 'react';

import { Button, Row, Col, Input, InputGroup, InputGroupAddon, Card, CardBody } from 'reactstrap';
import { Notifier } from '../Notifier.js';
import PropTypes from 'prop-types';

// import { PaymentContext, paymentReducer, NotifierContext, notifyReducer, notify, UPDATE_PURCHASE, UPDATE_CUSTOMER } from '../storage/actions.js';
import { Invoices } from '../storage/Invoices.jsx';
import { ContributionPaymentHandler } from './ContributionPaymentHandler.jsx';
import { postFormData } from '../ajax.js';
import classnames from 'classnames';

const dateFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

function nextContributionCharge(created, period) {
	let createdDate = new Date(created);
	let nowDate = new Date();
	let nextChargeDate = new Date(created);
	nextChargeDate.setFullYear(nowDate.getFullYear());

	if (period == 'month') {
		if (createdDate.getDate() > nowDate.getDate()) {
			nextChargeDate.setMonth(nowDate.getMonth());
			nextChargeDate.setDate(createdDate.getDate());
		} else {
			nextChargeDate.setMonth(nowDate.getMonth() + 1);
			nextChargeDate.setDate(createdDate.getDate());
		}
	} else if (period == 'year') {
		if (nextChargeDate < nowDate) {
			nextChargeDate.setFullYear(nextChargeDate.getFullYear() + 1);
		} else {
			// nextChargeDate has already been set to this year
		}
	} else {
		throw new Error('unexpected period for contribution');
	}
	return nextChargeDate;
}

function AmountCell(props) {
	const { amount, label, currentAmount, setAmount } = props;
	const selected = (currentAmount == amount);
	const handleAmount = () => {
		setAmount(amount);
	};

	return (
		<Col xs='4'>
			<button
				className={classnames('btn btn-block my-2 mx-auto', 'amount-cell', (selected ? 'btn-primary' : 'btn-outline-secondary'), { selected })}
				onClick={handleAmount}
			>
				{label}
			</button>
		</Col>
	);
}
AmountCell.propTypes = {
	amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	currentAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	label: PropTypes.string,
	setAmount: PropTypes.func,
};

function PeriodCell(props) {
	const { label, period, currentPeriod, setPeriod } = props;
	const selected = (currentPeriod == period);
	
	return (
		<Col xs='4'>
			<button
				className={classnames('btn btn-block my-2 mx-auto', 'period-cell', (selected ? 'btn-primary' : 'btn-outline-secondary'), { selected })}
				onClick={() => { setPeriod(period); }}
			>
				{label}
			</button>
		</Col>
	);
}
PeriodCell.propTypes = {
	period: PropTypes.oneOf(['once', 'month', 'year']),
	currentPeriod: PropTypes.oneOf(['once', 'month', 'year']),
	label: PropTypes.string,
	setPeriod: PropTypes.func,
};

function Contribute(props) {
	const { setNotification, currentUser } = props;
	const [ stripeIntent, setStripeIntent ] = useState(null);
	const [ purchase, setPurchase ] = useState(null);
	const [period, setPeriod] = useState('once');
	const [amount, setAmount] = useState(3000);
	const [custom, setCustom] = useState(false);
	const [currentContribution, setCurrentContribution] = useState(props.currentContribution);
	const [stripeCustomer, setStripeCustomer] = useState(props.stripeCustomer);

	// set values if contribution already in effect
	useEffect(() => {
		if (currentContribution) {
			setPeriod(currentContribution.period);
			setAmount(currentContribution.amount);
			if (![1000, 2000, 3000, 5000, 10000].includes(currentContribution.amount)) {
				setCustom(true);
			}
		}
	}, [currentContribution]);

	const handleConfirm = (stripeIntent) => {
		log.debug(stripeIntent);
		setNotification({type: 'success', message: "Contribution Submitted. Thanks for supporting Zotero!"})
	}
	const cancelPurchase = () => {
		setPurchase(null);
	};

	// don't allow altering amount or period for existing contribution
	// it might be slightly more intuitive, but it's confusing to figure out exactly when to charge then
	// and leaving a proper trail of changes is much harder then
	const handleAmount = (newAmount) => {
		if (currentContribution) {
			if (newAmount != currentContribution.amount) {
				setNotification({type: 'error', message: "If you'd like to modify the amount or frequency of your contribution, please stop your current contribution and create a new one. Thanks for supporting Zotero!"});
				return;
			}
		}
		setCustom(false);
		setAmount(newAmount);
	};
	const handlePeriod = (newPeriod) => {
		if (currentContribution) {
			if (newPeriod != currentContribution.period) {
				setNotification({type: 'error', message: "If you'd like to modify the amount or frequency of your contribution, please stop your current contribution and create a new one. Thanks for supporting Zotero!"});
				return;
			}
		}
		setPeriod(newPeriod);
	};

	const contribute = () => {
		if (amount == 0) {
			setNotification({type: 'error', message: 'No amount selected for contribution.'});
			throw new Error('No amount selected for contribution.');
		}
		if (amount < 500) {
			setNotification({type: 'error', message: 'Due to the cost of processing payments, we do not currently accept contributions under $5.00'});
			throw new Error('Disallowed amount specified for contribution.');
		}
		
		let newPurchase = { amount, period, immediateCharge:true };
		
		// if details are the same, just update payment details
		if (currentContribution) {
			if (amount == currentContribution.amount && period == currentContribution.period) {
				newPurchase.type = 'contributionPaymentUpdate';
				newPurchase.immediateCharge = false;
			} else {
				throw new Error('Attempting to change non-payment details on an existing contribution');
			}
		} else {
			switch (period) {
			case 'once':
				newPurchase.type = 'contribution';
				break;
			case 'month':
			case 'year':
				newPurchase.type = 'recurringContribution';
				break;
			default:
				setNotification({type: 'error', message: 'There was an error processing your contribution'});
				throw new Error('Unrecognized period for contribution');
			}

			if (newPurchase.type == 'recurringContribution') {
				if (!currentUser) {
					setNotification({type: 'error', message: <p>Please <a href='/user/login'>log in</a> to make a recurring contribution.</p>});
					newPurchase = null;
					// throw new Error('No logged in user for recurring contribution');
				}
			}
		}
		
		setPurchase(newPurchase);
	};

	const stopContribution = async () => {
		try {
			let resp = await postFormData('/storage/cancelcontribution', {}, { withSession: true });
			
			if (!resp.ok) {
				throw resp;
			}
			let respData = await resp.json();
			if (respData.success) {
				setNotification({type: 'success', message: 'Your recurring contribution has been stopped'});
				setStripeCustomer(false);
				// paymentDispatch({ type: UPDATE_CUSTOMER, stripeCustomer: false });
				// paymentDispatch()
				setCurrentContribution(false);
			} else {
				setNotification({type: 'error', message: 'There was an error updating your contribution'});
			}
		} catch (resp) {
			setNotification({type: 'error', message: 'There was an error updating your contribution'});
		}
	};

	const handleCustom = (evt) => {
		let nv = evt.target.value;
		nv = nv.replace(/\D/g, '');
		if (nv != '') {
			nv = parseInt(nv);
			if (isNaN(nv)) {
				nv = 15;
			}
		}
		nv *= 100;// convert to cents
		
		if (currentContribution) {
			if (nv != currentContribution.amount) {
				setNotification({type: 'error', message: "If you'd like to modify the amount or frequency of your contribution, please stop your current contribution and create a new one. Thanks for supporting Zotero!"});
				return;
			}
		}

		setAmount(nv);
	};

	let Payment = null;
	if (purchase) {
		Payment = (<ContributionPaymentHandler
			{...{
				purchase,
				currentContribution,
				currentUser,
				stripeCustomer,
				stripeIntent,
				setStripeIntent,
				setNotification,
				cancelPurchase,
				handleConfirm,
			}}
		/>);
	}

	let customNode = null;
	if (custom) {
		customNode = (
			<Row className='my-1'>
				<Col>
					<InputGroup>
						<InputGroupAddon addonType='prepend'>US $</InputGroupAddon>
						<Input id='custom-amount' type='text' onChange={handleCustom} value={amount > 0 ? amount / 100 : ''} placeholder='Custom Amount' />
					</InputGroup>
				</Col>
			</Row>
		);
	}
	let contributionNode = null;
	if (currentContribution) {
		let amtDollars = currentContribution.amount / 100;
		let nextChargeDate = nextContributionCharge(currentContribution.created, currentContribution.period);
		let description = (
			<>
				<p>{`You currently have an active contribution for US $${amtDollars} once per ${currentContribution.period}.`}</p>
				<p>{`The next charge will be on ${nextChargeDate.toLocaleDateString(undefined, dateFormatOptions)}.`}</p>
			</>
		);
		
		contributionNode = (
			<Row className = 'my-1'>
				<Col>
					<Card>
						<CardBody>
							{description}
							<Button block onClick={stopContribution}>Stop Contribution</Button>
							<Button block onClick={contribute}>Review Payment</Button>
						</CardBody>
					</Card>
				</Col>
			</Row>
		);
	} else {
		contributionNode = (
			<Row>
				<Col>
					<Button
						disabled={currentUser ? false : true}
					 	block onClick={contribute}>Contribute</Button>
				</Col>
			</Row>
		);
	}
	return (
		<div>
			{Payment}
			<Row>
				<PeriodCell currentPeriod={period} period={'once'} label='One Time' setPeriod={handlePeriod} />
				<PeriodCell currentPeriod={period} period={'month'} label='Monthly' setPeriod={handlePeriod} />
				<PeriodCell currentPeriod={period} period={'year'} label='Yearly' setPeriod={handlePeriod} />
			</Row>
			<hr />
			<Row>
				<AmountCell currentAmount={amount} amount={1000} label='$10' setAmount={handleAmount} />
				<AmountCell currentAmount={amount} amount={2000} label='$20' setAmount={handleAmount} />
				<AmountCell currentAmount={amount} amount={3000} label='$30' setAmount={handleAmount} />
			</Row>
			<Row>
				<AmountCell currentAmount={amount} amount={5000} label='$50' setAmount={handleAmount} />
				<AmountCell currentAmount={amount} amount={10000} label='$100' setAmount={handleAmount} />
				<Col xs='4'>
					<button
						className={classnames('btn btn-block my-2 mx-auto', 'amount-cell', (custom ? 'btn-primary' : 'btn-outline-secondary'), { selected: custom })}
						onClick={() => { setCustom(true); }}
					>
						Custom
					</button>
				</Col>
			</Row>
			{customNode}
			{contributionNode}
			{!currentUser && 
			<Row>
				<Col>
					<p className='text-center'>Please <a href='/user/login'>log in</a> to make a contribution</p>
				</Col>
			</Row>}
		</div>
	);
}
Contribute.propTypes = {
	currentUser: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
	currentContribution: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
};

function ManageContribution(props) {
	const [notification, setNotification] = useState(null);
	const { currentUser, currentContribution, stripeCustomer } = props;
	
	return (
		<div className='manage-contribution'>
			<Notifier {...notification} />
			<Row>
				<Col>
					<Contribute {...{
						currentUser,
						currentContribution,
						stripeCustomer,
						setNotification,
					 	}}
					/>
					<div className='mt-4'>
						<Invoices invoices={props.userInvoices} type='contribution' collapseLabel='Show Contribution Receipts' />
					</div>
				</Col>
			</Row>
		</div>
	);
}
ManageContribution.propTypes = {
	stripeCustomer: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
	currentUser: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
	currentContribution: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
	userInvoices: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
};

export { ManageContribution };
