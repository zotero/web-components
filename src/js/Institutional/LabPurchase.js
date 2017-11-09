'use strict';

import {log as logger} from '../Log.js';
let log = logger.Logger('LabPurchase');

const React = require('react');
const {Component} = React;
import PropTypes from 'prop-types';

import {Notifier} from '../Notifier.js';
import {postFormData} from '../ajax.js';
import {buildUrl} from '../wwwroutes.js';

const labPrice = function(fte=0){
	return (Math.max(15, fte) * 3000);
};

class LabPurchase extends Component{
	constructor(props){
		super(props);
		this.state = {
			notification:null
		};
		this.purchase = this.purchase.bind(this);
	}
	async purchase(){
		const {fte, name, institutionID} = this.props;

		this.setState({operationPending:true});
		
		let description = `Zotero Lab subscription. ${fte} users. 1 year.`;
		let priceCents = labPrice(fte);
		// log.debug(this.props);
		// log.debug(description);
		// log.debug(priceCents);
		
		let tokenHandler = async (token) => {
			// You can access the token ID with `token.id`.
			// Get the token ID to your server-side code for use.
			log.debug(`charging stripe lab. FTE:${fte} - token.id:${token.id}`);
			let resp;
			try{
				let args = {
					subscriptionType:'lab',
					stripeToken:token.id,
					userCount:fte,
					institutionName:name
				};
				if(institutionID){
					args['institutionID'] = institutionID;
				}
				resp = await postFormData('/storage/stripechargelabajax', args);

				log.debug(resp);
				if(!resp.ok){
					throw 'Error updating subscription';
				}
				let respData = await resp.json();
				log.debug(respData);
				let manageUrl = buildUrl('manageInstitution', {institutionID:respData.institutionID});
				this.setState({
					operationPending:false,
					notification: {
						type: 'success',
						message: (<p>Success. You can now <a href={manageUrl}>manage your Zotero Lab subscription</a></p>)
					}
				});

			} catch(e) {
				log.debug(resp);
				this.setState({
					operationPending:false,
					notification: {
						type: 'error',
						message: 'There was an error updating your subscription. Please try again in a few minutes. If you continue to experience problems, email storage@zotero.org for assistance.'
					}
				});
			}
		};

		let closedHandler = () => {
			this.setState({
				operationPending:false
			});
		};

		window.stripeHandler(description, tokenHandler, closedHandler, priceCents);
	}
	render(){
		const {notification} = this.state;
		const {label} = this.props;

		return (
			<div>
				<button className='btn' onClick={this.purchase}>{label}</button>
				<Notifier {...notification} />
			</div>
		);
	}
}
LabPurchase.defaultProps = {
	label:'Purchase',
	forward:true
};
LabPurchase.propTypes = {
	//purchase: PropTypes.func.isRequired,
	fte:PropTypes.number,
	name:PropTypes.string,
	institutionID:PropTypes.number,
	forward:PropTypes.bool
};

export {labPrice, LabPurchase};
