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
	const { storageState, callbacks } = useStorageContext();
	const { purchase, price, defaultPaymentMethod, /*previewPriceMismatch,*/ operationPending, taxPriceError } = storageState;
	const { handleConfirmPurchase, setEditPayment, setOperationPending, cancelPurchase } = callbacks;
	
	log.debug("PaymentSection");
	log.debug(props);
	const cancel = () => {
		setOperationPending(false);
		cancelPurchase();
	};
	let buttonLabel = `Pay ${formatCurrency(price.total, purchase.currency)}`;
	if (!purchase.immediateCharge) {
		buttonLabel = 'Confirm Change';
	}

	// if (stripeCustomer) {
		// show existing payment method on file that will be charged, with link to change it if desired
		if (defaultPaymentMethod) {
			log.debug('stripeCustomer defaultPaymentMethod');
			return (
				<div className='currentPaymentMethod'>
					<Card>
						<CardHeader>
							Payment Method
						</CardHeader>
						<CardBody>
							<PaymentMethod source={defaultPaymentMethod} />
							<Button color='link' onClick={() => { setEditPayment(true); }}>Change Payment Details</Button>
						</CardBody>
					</Card>
					<Row className='mt-2'>
						<Col>
							<table className='table table-striped'>
								<tbody>
									{operationPending ? 
										<>
											<tr>
												<th>Price:</th>
												<td></td>
											</tr>
											<tr>
												<LoadingSpinner className='m-auto' loading={true} />
											</tr>
										</>
										:
										<>
										<tr>
											<th>Price:</th>
											<td>{formatCurrency(price.base, purchase.currency)}</td>
										</tr>
										<tr>
											<th>Tax:</th>
											<td>{formatCurrency(price.tax, purchase.currency)}</td>
										</tr>
										<tr>
											<th>Total:</th>
											<td>{formatCurrency(price.total, purchase.currency)}</td>
										</tr>
										</>
									}
								</tbody>
							</table>
						</Col>
					</Row>
					{/* {previewPriceMismatch ? 
					<Row className='mt-2'>
						<Col><p className='text-danger'>Note that the price has updated. The price charged is based on the payment method's country.</p></Col>
					</Row>
					: null} */}
					{taxPriceError ?
					null :
					<Row className='mt-2'>
						<Col className='text-center'><Button className='m-auto' onClick={() => { handleConfirmPurchase(); }}>{buttonLabel}</Button></Col>
						<Col className='text-center'><Button className='m-auto' onClick={cancel}>Cancel</Button></Col>
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
		}/* else {
			return (
				<div className='confirmChange'>
					<Row className='mt-2'>
						<Col className='text-center'><Button className='m-auto' onClick={() => { handleConfirmPurchase(); }}>{buttonLabel}</Button></Col>
						<Col className='text-center'><Button className='m-auto' onClick={cancel}>Cancel</Button></Col>
					</Row>
				</div>
			);
		}*/
	return <p>There was an error showing payment details</p>;
}

export { PaymentDetails };
