import { log as logger } from '../Log.js';
var log = logger.Logger('PaymentDetails.jsx');

import { formatCurrency } from '../Utils.js';
import { Card, CardHeader, CardBody, Row, Col, Button } from 'reactstrap';
import { useStorageContext } from './Storage.js';
import { LoadingSpinner } from '../LoadingSpinner.js';
import { PaymentMethod } from './PaymentMethod.jsx';

//Show the payment details for the user's stripe customer which will be charged
//include a link to change the payment details
function PaymentDetails(props) {
	log.debug("PaymentSection");
	log.debug(props);
	const { storageState } = useStorageContext();
	const { payment, purchase } = storageState;
	
	let buttonLabel = `Pay ${formatCurrency(payment.state.price.total, payment.state.currency)}`;
	if (!purchase.immediateCharge) {
		buttonLabel = 'Confirm Change';
	}

	const cancelButton = payment.state.cancelable ? <Col className='text-center'><Button className='m-auto' onClick={payment.callbacks.cancelPurchase}>Cancel</Button></Col> : null;

	// show existing payment method on file that will be charged, with link to change it if desired
	if (payment.state.defaultPaymentMethod) {
		log.debug('stripeCustomer defaultPaymentMethod');
		return (
			<div className='currentPaymentMethod'>
				<Card>
					<CardHeader>
						Payment Method
					</CardHeader>
					<CardBody>
						<PaymentMethod source={payment.state.defaultPaymentMethod} />
						<Button color='link' onClick={() => { payment.callbacks.setEditPayment(true); }}>Change Payment Details</Button>
					</CardBody>
				</Card>
				<Row className='tax-price-details mt-2'>
					<Col>
						<table className='table table-striped'>
							<tbody>
								{payment.state.operationPending ? 
									<>
										<tr>
											<th>Price:</th>
											<td></td>
										</tr>
										<tr>
											<td colSpan={2}><LoadingSpinner className='m-auto' loading={true} /></td>
										</tr>
									</>
									:
									<>
									<tr>
										<th>Price:</th>
										<td>{formatCurrency(payment.state.price.base, payment.state.currency)}</td>
									</tr>
									<tr>
										<th>Tax:</th>
										<td>{formatCurrency(payment.state.price.tax, payment.state.currency)}</td>
									</tr>
									<tr>
										<th>Total:</th>
										<td>{formatCurrency(payment.state.price.total, payment.state.currency)}</td>
									</tr>
									</>
								}
							</tbody>
						</table>
					</Col>
				</Row>
				{payment.state.taxPriceError ?
				null :
				<Row className='complete-transaction-buttons mt-2'>
					<Col className='text-center'><Button className='m-auto' onClick={() => { payment.callbacks.handleConfirmPurchase(); }}>{buttonLabel}</Button></Col>
					{cancelButton}
				</Row>}
			</div>
		);
	} else {
		return (
			<div className='PaymentMethodPending'>
				<Card>
					<CardHeader>
						Payment Method
					</CardHeader>
					<CardBody>
						<LoadingSpinner className='m-auto' loading={true} />
						<p>Adding payment method...</p>
					</CardBody>
				</Card>
			</div>
		);
	}
}

export { PaymentDetails };
