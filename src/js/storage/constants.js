// import {log as logger} from '../Log.js';
// var log = logger.Logger('constants.js');

import PropTypes from 'prop-types';

const priceCents = {1: 0, 2: 2000, 3: 6000, 4: 10000, 5: 24000, 6: 12000};
const discountTiers = {
	'10': {2: 200, 3: 600, 6: 1200},
	'25': {2: 500, 3: 1500, 6: 3000},
	'50': {2: 1000, 3: 3000, 6: 6000},
};

const euroPaymentMethods = ['sepa_debit', 'bancontact', 'eps', 'giropay', 'ideal', 'p24', 'sofort'];

const discountedCountries = {
	// 'BR': '25',
	// 'MX': '25',
	// 'IN': '10',
	// 'EC': '25',
	// 'PE': '25'
};

const discountedPriceStrings = {
	'10': { 1: 'Free', 2: '$2', 3: '$6', 6: '$12' },
	'25': { 1: 'Free', 2: '$5', 3: '$15', 6: '$30' },
	'50': { 1: 'Free', 2: '$10', 3: '$30', 6: '$60' },
};

const discountedLabPriceStrings = {

};


//price per user for different lab discount tiers
const discountLabTiers = {
	'10': 300,
	'25': 750,
	'50': 1500,
};

const storagePlans = [
	{
		storageLevel: 1,
		description: '300 MB',
		priceString: 'Free',
	},
	{
		storageLevel: 2,
		description: '2 GB',
		priceString: '$20',
	},
	{
		storageLevel: 3,
		description: '6 GB',
		priceString: '$60',
	},
	{
		storageLevel: 6,
		description: 'Unlimited',
		priceString: '$120',
	}
];

const storageLevelDescriptions = {
	2: '2 GB',
	3: '6 GB',
	6: 'Unlimited storage'
};

const dateFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

const userSubscriptionShape = PropTypes.shape({
	quota: PropTypes.number,
	storageLevel: PropTypes.number,
	usage: PropTypes.shape({
		total: PropTypes.number
	}),
	institutionUnlimited: PropTypes.bool,
	recur: PropTypes.bool,
	expirationDate: PropTypes.number,
});

export {
    priceCents,
    discountTiers,
	euroPaymentMethods,
	discountedCountries,
    discountedPriceStrings,
	discountLabTiers,
    storagePlans,
    storageLevelDescriptions,
	dateFormatOptions,
	userSubscriptionShape,
};
