// import {log as logger} from '../Log.js';
// var log = logger.Logger('constants.js');


const priceCents = {1: 0, 2: 2000, 3: 6000, 4: 10000, 5: 24000, 6: 12000};
const discountTiers = {
	'10': {2: 200, 3: 600, 6: 1200},
	'25': {2: 500, 3: 1500, 6: 3000},
	'50': {2: 1000, 3: 3000, 6: 6000},
};

const discountedCountries = {
	'BR': '25',
	'MX': '25',
	'IN': '10',
	'EC': '25',
	'PE': '25'
};

const discountedPriceStrings = {
	'10': { 1: 'Free', 2: '$2', 3: '$6', 6: '$12' },
	'25': { 1: 'Free', 2: '$5', 3: '$15', 6: '$30' },
	'50': { 1: 'Free', 2: '$10', 3: '$30', 6: '$60' },
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


export {
    priceCents,
    discountTiers,
	discountedCountries,
    discountedPriceStrings,
    storagePlans,
    storageLevelDescriptions,
};
