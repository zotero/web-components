'use strict';

import React from 'react';

export default class EditableBase extends React.Component {
	updateFieldOnServer(field, value) {
		var data = {};
		data[field] = value;

		return $.post(this.constructor.PROFILE_DATA_HANDLER_URL, data);
	}

	static get PROFILE_DATA_HANDLER_URL() {
		return '/settings/profiledata';
	}
}