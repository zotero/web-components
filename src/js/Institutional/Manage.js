// TODO:
// manage subscription/customer

import { log as logger } from '../Log.js';
let log = logger.Logger('Manage');

import { useEffect, useState } from 'react';

import { Button, Collapse, Row, Col, FormGroup, Label, Input, FormText } from 'reactstrap';
import { Notifier } from '../Notifier.js';
import PropTypes from 'prop-types';
import { ButtonEditable } from '../components/ButtonEditable.js';
import { getCurrentUser } from '../Utils.js';

import { postFormData } from '../ajax.js';
import { buildUrl } from '../wwwroutes.js';
import { Invoices } from '../storage/Invoices.jsx';
import { ReceiptsTable } from '../storage/NonInvoiceReceipts.jsx';
import { LabRenew } from './LabRenew.jsx';
import { getUserCustomer } from '../storage/actions.js';

function InstitutionData(props) {
	const { setPageNotification, saveInstitutionName, name, numUsers, userEmails, expirationDate, institutionID, detectedLocation, stripeCustomer } = props;
	let expdate = new Date(expirationDate * 1000);
	
	const userCount = userEmails.filter(e => e.length > 2).length;
	
	return (
		<div>
			<FormGroup row>
				<Col sm={3}><Label htmlFor='lab_name'>Name:</Label></Col>
				<Col sm={9}>
					<ButtonEditable save={saveInstitutionName} value={name} />
					<FormText color='muted'>This name will appear as the provider of storage for your users.</FormText>
				</Col>
			</FormGroup>
			<FormGroup row>
				<Col sm={3}><Label htmlFor='lab_num_users'>Users:</Label></Col>
				<Col sm={9}><p>{userCount} / {numUsers}</p></Col>
			</FormGroup>
			<FormGroup row>
				<Col sm={3}><Label>Expiration:</Label></Col>
				<Col sm={9}><p>{`${expdate.getFullYear()}-${expdate.getMonth() + 1}-${expdate.getDate()}`}</p></Col>
			</FormGroup>
			<LabRenew
				{...{
					stripeCustomer,
					detectedLocation,
					institutionID,
					numUsers,
					name,
					setPageNotification,
				}}
			/>
		</div>
	);
}
InstitutionData.defaultProps = {
	userEmails: [],
	numUsers: 15,
	name: '',
	expirationDate: PropTypes.number,
	institutionID: PropTypes.number
};
InstitutionData.propTypes = {
	userEmails: PropTypes.arrayOf(PropTypes.string),
	numUsers: PropTypes.number,
	name: PropTypes.string,
	expirationDate: PropTypes.number,
	institutionID: PropTypes.number,
	saveInstitutionName: PropTypes.func
};

const currentUser = getCurrentUser();

function Manage(props) {
	const { institutionID, expirationDate, labInvoices, charges, detectedLocation, numUsers } = props;
	log.debug(props);

	const [pageNotification, setPageNotification] = useState(null);
	const [stripeCustomer, setStripeCustomer] = useState(props.stripeCustomer);
	const [name, setName] = useState(props.name);
	const [emails, setEmails] = useState(props.userEmails);

	/** Effect calls */
	// load stripe customer at start for logged in user if there is one
	useEffect(
		() => {
			if (currentUser && !stripeCustomer) {
				refreshCustomer();
			}
		},
		[props.stripeCustomer]
	);

	//re-fetch the stripe customer for logged in user if there is one, and figure out a location
	//based on their payment data if there is.
	const refreshCustomer = async () => {
		log.debug("refreshCustomer");
		if (currentUser) {
			let customerResponse = await getUserCustomer();
			if(!customerResponse.success) {
				setStripeCustomer(null);
				setPageNotification(customerResponse);
			} else {
				setStripeCustomer(customerResponse.stripeCustomer);
			}
		}
	}

	// const { name, emails, numUsers } = labState;
	// update email list form
	const handleEmailChange = (evt) => {
		setEmails(evt.target.value.split('\n'));
	};

	// make request to server to save the updated emails
	const updateEmailList = async () => {
		let updateUrl = buildUrl('institutionemaillist', { institutionID });
		let resp;
		try {
			let filteredEmails = emails.filter(email => email.length > 0);
			resp = await postFormData(updateUrl, { emails: filteredEmails.join('\n') }, { withSession: true });

			log.debug(resp, 4);
			if (!resp.ok) {
				throw new Error('Error updating email list');
			}
			let respData = await resp.json();
			log.debug(respData, 4);
			setPageNotification({type: 'success', message: (<p>Email list updated</p>)});
		} catch (e) {
			log.debug(e);
			setPageNotification({type: 'error', message: (<p>There was an error updating the email list</p>)});
		}
	};
	
	const saveInstitutionName = async (name) => {
		let updateUrl = buildUrl('manageInstitution', { institutionID });
		let resp;
		try {
			resp = await postFormData(updateUrl, { institutionName: name }, { withSession: true });

			if (!resp.ok) {
				throw new Error('Error updating institution name');
			}
			let respData = await resp.json();
			if (respData.success) {
				setName(name);
				// labDispatch({ type: UPDATE_NAME, name });
				setPageNotification({type: 'success', message:(<p>Institution updated</p>)});
			} else {
				throw new Error('Request failed');
			}
		} catch (e) {
			log.debug(e);
			setPageNotification({type: 'error', message: (<p>There was an error updating the organization.</p>)});
		}
	};
	
	let emailsText = emails.join('\n');
	return (
		<div className='manage-institution'>
			<Notifier {...pageNotification} />
			<Row className='my-3'>
				<Col md='12'>
					<Invoices invoices={labInvoices} />
					<ReceiptsTable labInvoices={labInvoices} charges={charges} />
				</Col>
			</Row>
			<Row>
				<Col md='6'>
					<div className='email-list'>
						<h3>Email List</h3>
						<Input type='textarea'
							className='email-list'
							rows='10'
							value={emailsText}
							onChange={handleEmailChange}
						/>
						<FormText color='muted'>One email per line, no other separators</FormText>
						<Button className='btn update-list-button' onClick={updateEmailList}>Update List</Button>
					</div>
				</Col>
				<Col md='6'>
					<div className='current-storage'>
						<InstitutionData {...{
							stripeCustomer,
							userEmails: emails,
							numUsers,
							name,
							expirationDate,
							institutionID,
							saveInstitutionName,
							setPageNotification,
							detectedLocation,
						}} />
					</div>
				</Col>
			</Row>
		</div>
	);
}
Manage.propTypes = {
	institutionID: PropTypes.number.isRequired,
	userEmails: PropTypes.arrayOf(PropTypes.string).isRequired,
	numUsers: PropTypes.number,
	name: PropTypes.string,
	expirationDate: PropTypes.number,
	stripeCustomer: PropTypes.object,
	labInvoices: PropTypes.arrayOf(PropTypes.object),
	charges: PropTypes.arrayOf(PropTypes.string)
};
Manage.defaultProps = {
	userEmails: []
};

export { Manage };
