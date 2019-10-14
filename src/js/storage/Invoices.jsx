import { log as logger } from '../Log.js';
var log = logger.Logger('Invoices.jsx', 3);

import { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Table, Collapse } from 'reactstrap';
import { postFormData } from '../ajax.js';

import { NotifierContext, notify } from './actions.js';


const dateFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

const deleteInvoice = async (invoiceID) => {
	let data = { invoiceID };
	let resp = await postFormData('/storage/deleteinvoice', data, { withSession: true });
	
	if (resp.ok) {
		return { type: 'success', message: <span>Invoice Deleted</span> };
	} else {
		throw resp;
	}
};

function Invoices(props) {
	let { invoices, type, collapseLabel } = props;
	const { notifyDispatch } = useContext(NotifierContext);
	const [isOpen, setIsOpen] = useState(false);

	if (!invoices) {
		return null;
	}
	const handleDelete = async (invoiceID) => {
		let result = await deleteInvoice(invoiceID);
		notifyDispatch(notify(result.type, result.message));
	};
	if (type) {
		log.debug(`filtering by type ${type}`, 4);
		invoices = invoices.filter((invoice) => {
			return invoice.invoiceType == type;
		});
	}
	if (invoices.length == 0) {
		return null;
	}
	
	const invoiceRows = invoices.map((invoice) => {
		const { invoiceID, created, stripeCharge } = invoice;
		const invoiceUrl = `/storage/invoice/${invoiceID}`;
		const createdDate = new Date(created);
		
		// show delete link to hide invoice if invoice hasn't been paid
		let deleteLink = null;
		if (!stripeCharge) {
			deleteLink = (<a href='#' onClick={(e) => {
				e.preventDefault(); handleDelete(invoiceID);
			}}>Delete</a>);
		}
		return (
			<tr key={invoiceID}>
				<td>
					<a href={invoiceUrl}>Invoice {invoice.invoiceID}</a>
				</td>
				<td>
					{createdDate.toLocaleDateString('en-US', dateFormatOptions)}
				</td>
				<td>
					{!stripeCharge ? 'Pending' : ''}
				</td>
				<td>
					{deleteLink}
				</td>
			</tr>
		);
	});
	return (
		<>
			<p><a href='#collapse' onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}>{collapseLabel}</a></p>
			<Collapse isOpen={isOpen}>
				<Table striped>
					<tbody>
						{invoiceRows}
					</tbody>
				</Table>
			</Collapse>
		</>
	);
}
Invoices.defaultProps = {
	collapseLabel: "Show Invoices",
	invoices: [],
};
Invoices.propTypes = {
	collapseLabel: PropTypes.string,
	invoices: PropTypes.array,
	type: PropTypes.oneOf(['individual', 'lab', 'institution', 'contribution'])
};

export { Invoices };
