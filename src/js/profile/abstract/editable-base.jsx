'use strict';

import React from 'react';
import {postFormData} from '../../ajax.js';

export default class EditableBase extends React.Component {
	updateFieldOnServer(field, value) {
		var data = {};
		data[field] = value;
		return postFormData(this.constructor.PROFILE_DATA_HANDLER_URL, data, {withSession:true});
	}

	static get PROFILE_DATA_HANDLER_URL() {
		return '/settings/profiledata';
	}
}