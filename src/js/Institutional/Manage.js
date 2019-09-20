// TODO:
// manage subscription/customer

import { log as logger } from '../Log.js';
let log = logger.Logger('Manage');

import { useState, useReducer, useContext } from 'react';

import { Button, Collapse, Row, Col, FormGroup, Label, Input, FormText } from 'reactstrap';
import { Notifier } from '../Notifier.js';
import PropTypes from 'prop-types';
import { ButtonEditable } from '../components/ButtonEditable.js';
import { labPrice, labUserPrice } from '../storage/calculations.js';
import { formatCurrency } from '../Utils.js';

import { postFormData } from '../ajax.js';
import { buildUrl } from '../wwwroutes.js';
import { InstitutionHandler } from '../storage/InstitutionHandler.jsx';
import { LabContext, labReducer, PaymentContext, paymentReducer, NotifierContext, notifyReducer, notify, setEmails, UPDATE_NAME, UPDATE_PURCHASE } from '../storage/actions.js';
import { PendingInvoices } from '../storage/PendingInvoices.jsx';


function LabRenew(_props) {
	const { labState } = useContext(LabContext);
	const { paymentDispatch, paymentState } = useContext(PaymentContext);
	const { notifyDispatch } = useContext(NotifierContext);
	
	const { purchase } = paymentState;
	const { fte, name, institutionID } = labState;
	const [showRenew, setShowRenew] = useState(false);
	const [showAddUsers, setShowAddUsers] = useState(false);
	const [renewFTE, setRenewFTE] = useState(fte);
	const [additionalFTE, setAdditionalFTE] = useState(1);

	const renewLab = () => {
		let renewFTENum = parseInt(renewFTE);
		if (renewFTENum < 15) {
			renewFTENum = 15;
		}
		paymentDispatch({ type: UPDATE_PURCHASE, purchase: {
			type: 'labRenew',
			fte: renewFTENum,
			name,
			institutionID
		} });
	};
	
	const purchaseUsers = () => {
		let addFTENum = parseInt(additionalFTE);
		if (!(addFTENum > 0)) {
			notifyDispatch(notify('error', 'Invalid number of additional users'));
			return;
		}
		paymentDispatch({ type: UPDATE_PURCHASE, purchase: {
			type: 'addLabUsers',
			additionalFTE,
			name,
			institutionID
		} });
	};
	
	const handleRenewFTEChange = (evt) => {
		let nv = evt.target.value;
		nv = nv.replace(/\D/g, '');
		if (nv != '') {
			nv = parseInt(nv);
			if (isNaN(nv)) {
				nv = 15;
			}
		}
		setRenewFTE(nv);
	};
	const handleAdditionalFTEChange = (evt) => {
		let nv = evt.target.value;
		nv = nv.replace(/\D/g, '');
		if (nv != '') {
			nv = parseInt(nv);
			if (isNaN(nv)) {
				nv = 15;
			}
		}
		setAdditionalFTE(nv);
	};
	
	let Payment = null;
	if (purchase) {
		Payment = (<InstitutionHandler
			institutionID={institutionID}
			purchase={purchase}
		/>);
	}

	return (
		<div>
			{Payment}
			<Button className='m-4' onClick={() => { setShowRenew(true); setShowAddUsers(false); }}>Renew</Button>
			<Button className='m-4' onClick={() => { setShowAddUsers(true); setShowRenew(false); }}>Add Users</Button>
			<Collapse isOpen={showRenew} className='p-5' timeout={{ exit: 0 }}>
				<FormGroup row>
					<Label htmlFor='lab_fte'>Users:</Label>
					<Input type='text' name='lab_fte' value={renewFTE} onChange={handleRenewFTEChange} />
				</FormGroup>
				<FormGroup row>
					<Label>Price</Label>
					{formatCurrency(labPrice(renewFTE))}
				</FormGroup>
				<Button onClick={renewLab}>Purchase</Button>
			</Collapse>
			<Collapse isOpen={showAddUsers} className='p-5' timeout={{ exit: 0 }}>
				<FormGroup row>
					<Label htmlFor='additionalFTE'>Additional Users:</Label>
					<Input type='text' name='additionalFTE' value={additionalFTE} onChange={handleAdditionalFTEChange} />
				</FormGroup>
				<FormGroup row>
					<Label>Price</Label>
					{formatCurrency(labUserPrice(additionalFTE))}
				</FormGroup>
				<Button onClick={purchaseUsers}>Purchase</Button>
			</Collapse>
		</div>
	);
}
LabRenew.defaultProps = {
	showRenew: false
};

function InstitutionData(props) {
	const { saveInstitutionName, name } = props;
	
	const { fte, userEmails, expirationDate, institutionID } = props;
	let expdate = new Date(expirationDate * 1000);
	
	const userCount = userEmails.filter(e => e.length > 2).length;
	
	return (
		<div>
			<FormGroup row>
				<Col sm={3}><Label for='lab_name'>Name:</Label></Col>
				<Col sm={9}>
					<ButtonEditable save={saveInstitutionName} value={name} />
					<FormText color='muted'>This name will appear as the provider of storage for your users.</FormText>
				</Col>
			</FormGroup>
			<FormGroup row>
				<Col sm={3}><Label for='lab_fte'>Users:</Label></Col>
				<Col sm={9}><p>{userCount} / {fte}</p></Col>
			</FormGroup>
			<FormGroup row>
				<Col sm={3}><Label>Expiration:</Label></Col>
				<Col sm={9}><p>{`${expdate.getFullYear()}-${expdate.getMonth() + 1}-${expdate.getDate()}`}</p></Col>
			</FormGroup>
			<LabRenew
				fte={fte}
				institutionID={institutionID}
				name={name}
			/>
		</div>
	);
}
InstitutionData.defaultProps = {
	userEmails: [],
	fte: 15,
	name: '',
	expirationDate: PropTypes.number,
	institutionID: PropTypes.number
};
InstitutionData.propTypes = {
	userEmails: PropTypes.arrayOf(PropTypes.string),
	fte: PropTypes.number,
	name: PropTypes.string,
	expirationDate: PropTypes.number,
	institutionID: PropTypes.number,
	saveInstitutionName: PropTypes.func
};

function Manage(props) {
	const { institutionID, expirationDate } = props;
	const [paymentState, paymentDispatch] = useReducer(paymentReducer, {
		stripeCustomer: props.stripeCustomer,
	});
	const [notifyState, notifyDispatch] = useReducer(notifyReducer, {
		operationPending: false,
		notification: null
	});
	const [labState, labDispatch] = useReducer(labReducer, {
		institutionID,
		name: props.name,
		emails: props.userEmails,
		fte: props.fte
	});
	
	const { notification } = notifyState;
	const { name, emails, fte } = labState;
	// update email list form
	const handleEmailChange = (evt) => {
		labDispatch(setEmails(evt.target.value.split('\n')));
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
			notifyDispatch(notify('success', (<p>Email list updated</p>)));
			// labDispatch({type:SET_FTE, fte:emails.length});
		} catch (e) {
			log.debug(e);
			notifyDispatch(notify('error', (<p>There was an error updating the email list</p>)));
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
				labDispatch({ type: UPDATE_NAME, name });
				notifyDispatch(notify('success', <p>Institution updated</p>));
			} else {
				throw new Error('Request failed');
			}
		} catch (e) {
			log.debug(e);
			notifyDispatch(notify('error', <p>There was an error updating the email list</p>));
		}
	};
	
	let emailsText = emails.join('\n');
	return (
		<LabContext.Provider value={{ labDispatch, labState }}>
			<PaymentContext.Provider value={{ paymentDispatch, paymentState }}>
				<NotifierContext.Provider value={{ notifyDispatch, notifyState }}>
					<div className='manage-institution'>
						<Notifier {...notification} />
						<Row className='my-3'>
							<Col md='12'>
								<PendingInvoices invoices={props.labInvoices} />
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
										userEmails: emails,
										fte,
										name,
										expirationDate,
										institutionID,
										saveInstitutionName
									}} />
								</div>
							</Col>
						</Row>
					</div>
				</NotifierContext.Provider>
			</PaymentContext.Provider>
		</LabContext.Provider>
	);
}
Manage.propTypes = {
	institutionID: PropTypes.number.isRequired,
	userEmails: PropTypes.arrayOf(PropTypes.string).isRequired,
	fte: PropTypes.number,
	name: PropTypes.string,
	expirationDate: PropTypes.number,
	stripeCustomer: PropTypes.object,
	labInvoices: PropTypes.arrayOf(PropTypes.object)
};
Manage.defaultProps = {
	userEmails: []
};

export { Manage };
