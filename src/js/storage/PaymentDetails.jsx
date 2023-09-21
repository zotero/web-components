import { log as logger } from '../Log.js';
var log = logger.Logger('PaymentDetails.jsx');

import { formatCurrency } from '../Utils.js';
import { Card, CardHeader, CardBody, Row, Col, Button } from 'reactstrap';
import { LoadingSpinner } from '../LoadingSpinner.js';
import { PaymentSource } from './PaymentSource.jsx';

//Show the payment details for the user's stripe customer which will be charged
//include a link to change the payment details
function PaymentDetails(props) {
	const { purchase, stripeCustomer, defaultSource, chargeAmount, previewPriceMismatch, callbacks } = props;
	const { handleConfirmPurchase, setEditPayment, setOperationPending, cancelPurchase } = callbacks;
	
	log.debug("PaymentSection");
	log.debug(props);
	const cancel = () => {
		setOperationPending(false);
		cancelPurchase();
	};
	let buttonLabel = `Pay ${formatCurrency(chargeAmount, purchase.currency)}`;
	if (!purchase.immediateCharge) {
		buttonLabel = 'Confirm Change';
	}

	if (stripeCustomer) {
		// show existing payment method on file that will be charged, with link to change it if desired
		if (defaultSource) {
			return (
				<div className='currentPaymentSource'>
					<Card>
						<CardHeader>
							Payment Method
						</CardHeader>
						<CardBody>
							<PaymentSource source={defaultSource} />
							<Button color='link' onClick={() => { setEditPayment(true); }}>Change Payment Details</Button>
						</CardBody>
					</Card>
					{previewPriceMismatch ? 
					<Row className='mt-2'>
						<Col><p className='text-danger'>Note that the price has updated. The price charged is based on the payment method's country.</p></Col>
					</Row>
					: null}
					<Row className='mt-2'>
						<Col className='text-center'><Button className='m-auto' onClick={() => { handleConfirmPurchase(); }}>{buttonLabel}</Button></Col>
						<Col className='text-center'><Button className='m-auto' onClick={cancel}>Cancel</Button></Col>
					</Row>
				</div>
			);
		} else {
			return (
				<div className='paymentSourcePending'>
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
	}
	return <p>There was an error showing payment details</p>;
}

export { PaymentDetails };
