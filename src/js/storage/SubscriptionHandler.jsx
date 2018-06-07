'use strict';

/*
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
var log = logger.Logger('SubscriptionHandler');

import {Component, Fragment} from 'react';
import cn from 'classnames';
import PropTypes from 'prop-types';
import {StripeProvider} from 'react-stripe-elements';
import PaymentModal from './PaymentModal.jsx';
import { Card, CardBody, FormGroup, Input, Modal, ModalBody, ModalHeader, Label } from 'reactstrap';

import {immediateCharge, calculateNewExpiration} from './calculations.js';
import {postFormData} from '../ajax.js';

const dateFormatOptions = {year: 'numeric', month: 'long', day: 'numeric'};

const storageLevelDescriptions = {
	2: '2 GB',
	3: '6 GB',
	6: 'Unlimited storage'
};
const IndividualDescriptions = {
	2: '2 GB, 1 year',
	3: '6 GB, 1 year',
	6: 'Unlimited storage, 1 year'
};

const overQuota = function(storageLevel, userSubscription) {
	const planQuotas = window.zoteroData.planQuotas;
	let planQuota = planQuotas[storageLevel];
	if(userSubscription.usage.total > planQuota) {
		return true;
	}
	return false;
}

//component that handles a request for payment, presenting the PaymentModal and processing
//the payment or saving the customer for future use as necessary

//newSubscription describes the subscription the user is purchasing or switching to
//it must contain a type field
//type is one of: individualChange, individualUpdate, individualRenew, lab, institution
//
class SubscriptionHandler extends Component {
	constructor(props) {
		super(props);
		const {newSubscription, userSubscription} = props;
		const {type, storageLevel} = newSubscription;
		let description = [];
		let error = '';
		switch (type) {
			case 'individualChange':
				log.debug('individualChange');
				log.debug(userSubscription);
				description.push(`Change storage plan to ${storageLevelDescriptions[storageLevel]}`);
				if(immediateCharge(userSubscription.expirationDate)){
					let newExp = calculateNewExpiration(userSubscription.expirationDate, userSubscription.storageLevel, storageLevel);
					description.push(`Expiring on ${newExp.toLocaleDateString('en-US', dateFormatOptions)}.`)
					description.push(`A charge will be made to your account once you confirm your order.`);
				} else {
					description.push(`A charge will not be made to your account until your new expiration date.`);
				}
				break;
			case 'individualPaymentUpdate':
				description.push(`Update your saved payment details for your next renewal. There will be no charge made until your expiration date.`);
				break;
			case 'individualRenew':
				description.push(`Renew your current ${storageLevelDescriptions[storageLevel]} subscription.`);
				description.push(`Your card or bank account will be charged immediately after confirming.`);
				break;
			case 'lab':

				break;
			case 'institution':

				break;
			default:
				throw 'Unknown subscriptionChange type';
		};
		if(type == 'individualChange' || type == 'individualRenew'){
			if(overQuota(storageLevel, userSubscription)){
				error = `Current usage exceeds the chosen plan's quota. You'll need to choose a larger storage plan, or delete some files from your Zotero storage.`;
			}
		}
		this.state = {
			autorenew:true,
			description,
			error
		}
	}
	renewNow = async () => {
		this.setState({operationPending:true});
		const {userSubscription} = this.props;
		const storageLevel = userSubscription.storageLevel;

		//get stripe and charge for the current storage level
		this.chargeSubscription(storageLevel);
	}
	updateSubscription = async (storageLevel=false) => {
		if(storageLevel === false) {
			throw 'no storageLevel set for updateSubscription';
		}
		this.setState({operationPending:true});

		let resp;
		try {
			resp = await postFormData('/storage/updatesubscription', {storageLevel:storageLevel}, {withSession:true});

			log.debug(resp);
			//re-fetch full subscription info now that it's been updated
			this.props.refreshStorage();
			this.setState({
				operationPending:false,
				notification: {
					type:'success',
					message: 'Success'
				}
			});
		} catch(e) {
			log.error(e);
			this.setState({
				error:'Error updating subscription. Please try again in a few minutes.',
				operationPending:false,
			});
		};
	}
	updatePayment = async (token) => {
		// You can access the token ID with `token.id`.
		// Get the token ID to your server-side code for use.
		log.debug(`updating stripe card - token.id:${token.id}`);
		try {
			let resp = await postFormData('/storage/updatestripecard', {stripeToken:token.id});
			log.debug(resp);
			this.setState({
				operationPending:false,
				notification: {
					type: 'success',
					message: 'Success'
				}
			});
		} catch(e) {
			log.debug(e);
			this.setState({
				operationPending:false,
				notification: {
					type: 'error',
					message: 'Error updating payment method. Please try again in a few minutes.'
				}
			});
		}

		this.props.refreshStorage();
	}
	chargeSubscription = async (storageLevel=false, token=false) => {
		if(storageLevel === false) {
			throw 'no storageLevel set for chargeSubscription';
		}
		if(token === false) {
			throw 'no token set for chargeSubscription';
		}

		// You can access the token ID with `token.id`.
		// Get the token ID to your server-side code for use.
		log.debug(`charging stripe ajax. storageLevel:${storageLevel} - token.id:${token.id}`);
		try{
			let resp = await postFormData('/storage/stripechargeajax', {
				stripeToken:token.id,
				recur:1,
				storageLevel:storageLevel
			});
			
			log.debug(resp);
			this.setState({
				operationPending:false,
				notification: {
					type: 'success',
					message: <span>Success. <a href='/settings/storage/invoice'>View Payment Receipt</a></span>
				}
			});
		} catch(resp) {
			log.debug(resp);
			this.setState({
				operationPending:false,
				notification: {
					type: 'error',
					message: 'Error updating subscription. Please try again in a few minutes.'
				}
			});
			let data = await resp.json();
			if(data.stripeMessage){
				this.setState({
					operationPending:false,
					notification: {
						type: 'error',
						message: `There was an error processing your payment: ${data.stripeMessage}`
					}
				});
			}
		}

		this.props.refreshStorage();
	}
	handleToken = async (token) => {
		const {newSubscription, userSubscription} = this.props;
		const {type, storageLevel} = newSubscription;

		switch (type) {
			case 'individualChange':
				if(immediateCharge(userSubscription.expirationDate)){
					//charge the subscription now
					await this.chargeSubscription(storageLevel, token);
				} else {
					//save the payment method without charging
					await this.updatePayment(token);
				}
				this.props.onClose();
				break;
			case 'individualPaymentUpdate':
				await this.updatePayment(token);
				this.props.onClose();
				break;
			case 'individualRenew':
				await this.chargeSubscription(storageLevel, token);
				this.props.onClose();
				break;
			case 'lab':

				break;
			case 'institution':

				break;
			default:
				throw 'Unknown subscriptionChange type';
		};
	}
	render() {
		let {subscriptionChange, userSubscription} = this.props;
		let {autorenew, description} = this.state;
		log.debug(this.state);

		let descriptionPs = description.map((d, i)=>{
			return <p key={i}>{d}</p>;
		});

		return (
			<div className='subscription-handler'>
				<Modal isOpen={true} toggle={this.props.onClose} className='payment-modal'>
					<ModalHeader>Purchase Subscription</ModalHeader>
					<ModalBody>
						<Card className='mb-4'>
							<CardBody>
								{descriptionPs}
							</CardBody>
						</Card>
						<StripeProvider apiKey={'pk_test_u8WpYkXuG2X155p0rC4YqkvO'}>
							<PaymentModal handleToken={this.handleToken} />
						</StripeProvider>
						<Card className='mt-4'>
							<CardBody>
								<FormGroup check>
									<Label check>
										<Input
											type="checkbox"
											checked={autorenew}
											onChange={()=>{this.setState({autorenew:!autorenew}); }}
										/>{' '}
										Automatically renew
									</Label>
								</FormGroup>
							</CardBody>
						</Card>
					</ModalBody>
				</Modal>
			</div>
		)
	}
}

SubscriptionHandler.propTypes = {
	newSubscription: PropTypes.shape({
		type: PropTypes.string.isRequired,
		storageLevel: PropTypes.number
	}).isRequired,
	userSubscription: PropTypes.shape({
		storageLevel: PropTypes.number,
		discountEligible: PropTypes.bool
	}).isRequired,
	requestedStorageLevel: PropTypes.number,
	labUsers: PropTypes.number
}

export default SubscriptionHandler;
