'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('PurchaseWorkshop');

import React, { useState } from 'react';
import {Notifier} from './Notifier.js';
import {postFormData} from './ajax.js';

function PurchaseWorkshop(props){
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [notification, setNotification] = useState({});
	const {label} = props;

	let onPurchase = () => {
		let args = {name, email};
		stripePurchase('Zotero Workshop', 25000, args, setNotification);
	};
	return (
		<div className='purchaseWorkshop'>
			<Notifier {...notification} />
			<div className='form-line'>
				<label htmlFor='Name'>Attendee Name:</label>
				<input type='text' name='name' className='name form-control' value={name} onChange={(evt)=>{setName(evt.target.value);}} />
			</div>
			<div className='form-line'>
				<label htmlFor='email'>Attendee Email:</label>
				<input type='text' name='email' className='email form-control' value={email} onChange={(evt)=>{setEmail(evt.target.value);}} />
			</div>
			<button className='btn' onClick={onPurchase}>{label}</button>
		</div>
	);
}

let stripePurchase = async function(description, priceCents, args, setNotification){
	let tokenHandler = async (token) => {
		// You can access the token ID with `token.id`.
		// Get the token ID to your server-side code for use.
		log.debug(`charging stripe. token.id:${token.id}`);
		let resp;
		try{
			let postArgs = {
				stripeToken:token.id,
				name:args.name,
				email:args.email
			};
			resp = await postFormData('/storage/stripeworkshopchargeajax', postArgs);

			if(!resp.ok){
				throw 'Error updating subscription';
			}
			let respData = await resp.json();
			log.debug(respData);
			setNotification({
				type: 'success',
				message: (<p>Success. Thanks for signing up for a Zotero workshop!</p>)
			});
		} catch(e) {
			log.debug(resp);
			setNotification({
				type: 'error',
				message: 'There was an error processing your payment. Please try again in a few minutes. If you continue to experience problems, email storage@zotero.org for assistance.'
			});
		}
	};

	let closedHandler = () => {
		return;
	};

	window.stripeHandler(description, tokenHandler, closedHandler, priceCents);
};

export {PurchaseWorkshop};
