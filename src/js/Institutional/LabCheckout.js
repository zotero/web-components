'use strict';

//import {log as logger} from '../Log.js';
//let log = logger.Logger('LabCheckout');

const React = require('react');
const {Component} = React;

import {Notifier} from '../Notifier.js';
import PropTypes from 'prop-types';

import {getCurrentUser} from '../Utils.js';
import {LabPurchase, labPrice} from './LabPurchase.js';
import {formatCurrency} from '../Utils.js';

const currentUser = getCurrentUser();

class LabCheckout extends Component{
	constructor(props){
		super(props);
		this.state = {
			fte:this.props.fte,
			name:this.props.name
		};
	}
	render(){
		const {fte, name, notification} = this.state;

		let completeAction = null;
		if(currentUser){
			completeAction = (
				<div>
					<div className='form-line'>
						<label htmlFor='lab_name'>Lab Name:</label>
						<input type='text' name='lab_name' className='lab_name form-control' value={name} onChange={(evt)=>{this.setState({name:evt.target.value});}} />
						<p className='hint'>This name will appear as the provider of storage for your users.</p>
					</div>
					<div className='form-line'>
						<p>You're currently logged in as '{currentUser.username}'. This will be the account used to manage the user list for your subscription. If you'd like to use a different account to manage your subscription, please log in with that account before completing the purchase.</p>
					</div>
					<div className='form-line purchase-line'>
						<LabPurchase {...this.state} />
					</div>
				</div>
			);
		} else {
			completeAction = (
				<div className='form-line'>
					<p>You are not currently logged in. To purchase a Zotero Lab subscription, please log in to the account that will be used to manage the user list for the subscription. You'll need to use that account to make changes to your subscription in the future.</p>
				</div>
			);
		}
		return (
			<div id='lab-checkout'>
				<p>
					Zotero Lab is ideal for departments, laboratories, and small companies. A simple administrative interface lets you add or remove users from your Zotero Lab subscription at any time.
				</p>
				<p>
					Zotero Lab costs $30 per user, with a minimum of 15 users.
				</p>
				<div className='form-line'>
					<label htmlFor='lab_fte'>Users:</label>
					<input type='text' name='lab_fte' className='lab_fte form-control' value={fte} onChange={(evt)=>{this.setState({fte:evt.target.value});}} />
				</div>
				<div className='form-line'>
					<label>Price</label>
					{formatCurrency(labPrice(fte))}
					<span>&nbsp;per year, billed annually</span>
				</div>
				{completeAction}
				<Notifier {...notification} />
			</div>
		);
	}
}
LabCheckout.defaultProps = {
	fte:15,
	name:'',
	institutionID:0
};

LabCheckout.propTypes = {
	//purchase: PropTypes.func.isRequired,
	fte:PropTypes.number,
	name:PropTypes.string,
	institutionID:PropTypes.number
};

export {LabCheckout};
