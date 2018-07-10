'use strict';

let accessMap = {
	'all'     : {
		'members' : 'Anyone can view, only members can edit',
		'admins'  : 'Anyone can view, only admins can edit'
	},
	'members' : {
		'members' : 'Only members can view and edit',
		'admins'  : 'Only members can view, only admins can edit'
	},
	'admins'  : {
		'members' : 'Only admins can view, only members can edit',
		'admins'  : 'Only admins can view and edit'
	}
};

let typeMap = {
	'Private': 'Private',
	'PublicOpen': 'Public, Open Membership',
	'PublicClosed': 'Public, Closed Membership'
};

export {accessMap, typeMap};