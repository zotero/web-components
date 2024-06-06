
function defaultPayment(stripeCustomer) {
	let defaultPM = null;
	if (stripeCustomer) {
		if(stripeCustomer.invoice_settings.default_payment_method) {
			defaultPM = stripeCustomer.invoice_settings.default_payment_method;
		} else if (stripeCustomer.default_source) {
			defaultPM = stripeCustomer.default_source;
		}
	}
	return defaultPM;
};

export {
    defaultPayment
};
