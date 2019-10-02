import { log as logger } from '../Log.js';
let log = logger.Logger('InstitutionCheckout');

import { useState } from 'react';
import { PropTypes } from 'prop-types';

import { Notifier } from '../Notifier.js';
import { formatCurrency } from '../Utils.js';

import { postFormData } from '../ajax.js';

let institutionPrice = function (fte) {
	return (200000 + ((Math.max(500, fte) - 500) * 40));
};

function FormFieldErrorMessage(props) {
	return (
		<p className='form-field-error'>{props.message}</p>
	);
}
FormFieldErrorMessage.propTypes = {
	message: PropTypes.string
};

function InstitutionCheckout(props) {
	const [fte, setFTE] = useState(props.fte);
	const [contact, setContact] = useState(props.contact);
	const [domain, setDomain] = useState(props.domain);
	const [name, setName] = useState(props.name);
	const [formErrors, setFormErrors] = useState({});
	const [notification, setNotification] = useState(null);

	const handleFTEChange = (evt) => {
		let nv = evt.target.value;
		nv = nv.replace(/\D/g, '');
		if (nv != '') {
			nv = parseInt(nv);
			if (isNaN(nv)) {
				nv = 15;
			}
		}
		setFTE(nv);
	};

	const validateForm = () => {
		if (fte == '' || isNaN(parseInt(fte))) {
			return {
				valid: false,
				field: 'fte',
				reason: 'Please specify a number of full time equivalents at your institution.'
			};
		}
		if (contact == '') {
			return {
				valid: false,
				field: 'contact',
				reason: 'Please specify an email address to contact you with.'
			};
		}
		if (name == '') {
			return {
				valid: false,
				field: 'name',
				reason: 'Please specify the name of your institution.'
			};
		}
		if (domain == '') {
			return {
				valid: false,
				field: 'domain',
				reason: 'Please specify one or more domains that your institution uses for email addresses.'
			};
		}
		return { valid: true };
	};
	
	const requestInvoice = async () => {
		let resp;
		let validated = validateForm();
		if (!validated.valid) {
			// show error
			let formErrors = {};
			formErrors[validated.field] = validated.reason;
			setFormErrors(formErrors);
			return;
		}

		try {
			resp = await postFormData('/storage/requestinstitutionalinvoice', {
				subscriptionType: 'lab',
				fte: fte,
				institutionName: name,
				institutionDomain: domain,
				contactEmail: contact
			});

			log.debug(resp, 4);
			if (!resp.ok) {
				throw new Error('Error requesting invoice');
			}
			let respData = await resp.json();
			log.debug(respData, 4);
			setNotification({
				type: 'success',
				message: (<p>We&apos;ll contact you shortly about your Zotero Institution subscription</p>)
			});
		} catch (e) {
			log.debug(resp, 4);
			setNotification({
				type: 'error',
				message: <>There was an error requesting an invoice. If you continue to experience problems, email <a href='mailto:storage@zotero.org'>storage@zotero.org</a> for assistance.</>
			});
		}
	};
	
	return (
		<div id='institutional-checkout'>
			<p>
				Zotero Institution provides unlimited storage for entire universities, research institutions, and corporations. All members of your organization are automatically added to your Zotero Institution subscription, based on their organizational email addresses.
			</p>
			<p>
				Zotero Institution costs $2000 for the first 500 FTE, plus $0.40 per additional FTE.
			</p>
			<div className='form-group row'>
				<label className='col-sm-2 col-form-label' htmlFor='institution_fte'>FTE:</label>
				<div className='col-sm-9'>
					<input type='text' className='institution_fte form-control' value={fte} onChange={handleFTEChange} />
				</div>
			</div>
			<FormFieldErrorMessage message={formErrors.fte} />
			<div className='form-group row'>
				<label className='col-sm-2 col-form-label'>Price</label>
				<div className='col-sm-9'>
					{formatCurrency(institutionPrice(fte))}
					<span>&nbsp;per year, billed annually</span>
				</div>
			</div>
			<div className='form-group row'>
				<label className='col-sm-2 col-form-label'>Contact Email:</label>
				<div className='col-sm-9'>
					<input type='text' className='institution_contact_email form-control' value={contact} onChange={(evt) => { setContact(evt.target.value); }} />
				</div>
				<FormFieldErrorMessage message={formErrors.contact} />
			</div>
			<div className='form-group row'>
				<label className='col-sm-2 col-form-label' htmlFor='institution_name'>Institution Name:</label>
				<div className='col-sm-9'>
					<input type='text' name='institution_name' className='institution_name form-control' value={name} onChange={(evt) => { setName(evt.target.value); }} />
					<p className='text-muted'>This name will appear as the provider of storage for your users.</p>
				</div>
				<FormFieldErrorMessage message={formErrors.name} />
			</div>
			<div className='form-group row'>
				<label className='col-sm-2 col-form-label' htmlFor='institution_domain'>Domain(s):</label>
				<div className='col-sm-9'>
					<input type='text' name='institution_domain' className='form-control' value={domain} onChange={(evt) => { setDomain(evt.target.value); }} placeholder='@my-institution.edu' />
					<p className='text-muted'>The domain(s) you use for your institution&apos;s email addresses. This is how we&apos;ll identify your users.</p>
				</div>
				<FormFieldErrorMessage message={formErrors.domain} />
			</div>
			
			<div className='form-group row purchase-line text-center'>
				<button className='btn btn-secondary m-auto' onClick={requestInvoice}>Request Invoice</button>
			</div>
			<Notifier {...notification} />
		</div>
	);
}
InstitutionCheckout.defaultProps = {
	fte: 500,
	name: '',
	domain: '',
	contact: ''
};

export { InstitutionCheckout };
