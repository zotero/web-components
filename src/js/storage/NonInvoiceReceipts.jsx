
import PropTypes from 'prop-types';

function ReceiptsTable(props) {
	// link to all charges that are not already being shown as invoices
	const { charges, labInvoices } = props;
	let receiptRows = [];
	charges.forEach((charge) => {
		let found = false;
		for (let i = 0; i < labInvoices.lenghth; i++) {
			if (labInvoices[i].stripeCharge == charge) {
				found = true;
				break;
			}
		}
		if (!found) {
			receiptRows.push(<tr key={charge}><td><a key={charge} href={`/settings/storage/invoice?chargeID=${charge}`}>Receipt for {charge}</a></td></tr>);
		}
	});
	if (receiptRows.length) {
		return (
			<table className='table striped'>
				{receiptRows}
			</table>
		);
	}
	return null;
}
ReceiptsTable.propTypes = {
	labInvoices: PropTypes.arrayOf(PropTypes.object),
	charges: PropTypes.arrayOf(PropTypes.string)
};

export { ReceiptsTable };
