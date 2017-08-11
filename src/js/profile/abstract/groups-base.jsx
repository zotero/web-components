/* global Zotero:false */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';

var cache = {};

export default class GroupsBase extends React.Component {
	fetchUserGroups(userid) {
		if(!cache[userid]) {
			let groups = new Zotero.Groups();
			cache[userid] = groups.fetchUserGroups(this.props.userid);
		}
		
		return cache[userid];
	}

	static get GROUPS_CACHE() {
		return cache;
	}
}

GroupsBase.propTypes = {
	userid: PropTypes.number.isRequired
};