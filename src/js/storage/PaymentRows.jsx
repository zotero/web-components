import { log as logger } from '../Log.js';
const log = logger.Logger('PaymentRows.jsx');

import PropTypes from 'prop-types';
import { dateFormatOptions, userSubscriptionShape } from './constants';
import { Button, Row, Col } from 'reactstrap';
import { PaymentMethod } from './PaymentMethod.jsx';
import { defaultCustomerPayment } from './usePaymentProcessor.js';

// Row that shows user's payment method and allows updating the method that will be used
// or forcing an immediate renewal charge regardless of scheduled automatic renewal
function PaymentRow(props) {
	log.debug('PaymentRow', 4);
	log.debug(props, 4);
	const { paymentMethod, userSubscription, updatePaymentHandler, setRecur, renewHandler, removePayment } = props;

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
		if (paymentMethod && !userSubscription.recur) {
			autoRenewButton = <Button color='secondary' size='sm' className='m-1' onClick={()=>{setRecur(true)}}>Enable Automatic Renewal</Button>;
		}
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
				<th>Payment Method</th>
				<td>
					<PaymentMethod source={paymentMethod} />
					<Row className='mt-2'>
						<Col>
							{paymentMethod ? removePaymentButton : null}
							{(!userSubscription.recur || !paymentMethod) && (userSubscription.storageLevel > 1) ? autoRenewButton : null}
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
	const { userSubscription, setRecur, stripeCustomer } = props;
	const { institutionUnlimited } = userSubscription;
	
	let d = new Date(parseInt(userSubscription.expirationDate) * 1000);
	let formattedExpirationDate = d.toLocaleDateString('en-US', dateFormatOptions);
	const defaultPM = defaultCustomerPayment(stripeCustomer);
	
	if (userSubscription.recur && (d > Date.now()) && defaultPM) {
		// autorenew is enabled and set for sometime in the future
		return (
			<tr>
				<th>Next Payment</th>
				<td>
					<Row>
						<Col className='next-payment-date'>{institutionUnlimited ? 'Renewal will be automatically disabled if you remain covered by an institutional storage subscription. ' : null }{formattedExpirationDate}</Col>
					</Row>
					<Row>
						<Col>
							<Button color='secondary' size='sm' onClick={() => {setRecur(false);}}>Disable Automatic Renewal</Button>
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

export { PaymentRow, NextPaymentRow };
