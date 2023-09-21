
function defaultPayment(stripeCustomer) {
	let defaultPM = null;
	if (stripeCustomer) {
		if (stripeCustomer.default_source) {
			defaultPM = stripeCustomer.default_source;
		} else if(stripeCustomer.invoice_settings.default_payment_method) {
			defaultPM = stripeCustomer.invoice_settings.default_payment_method;
		}
	}
	return defaultPM;
};

export {
    defaultPayment
};
