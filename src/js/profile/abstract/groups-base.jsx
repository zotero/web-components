/* global Zotero:false */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import {ajax} from '../../ajax.js';
import {apiRequestString} from '../../ApiRouter.js';
import {buildUrl} from '../../wwwroutes.js';

var cache = {};

export default class GroupsBase extends React.Component {
	fetchUserGroups(userid) {
		if(!cache[userid]) {
			let url = apiRequestString({
				'target':'userGroups',
				'libraryType':'user',
				'libraryID': userid,
				'order':'title',
				'limit':25,
				'start':0
			});
			cache[userid] = ajax({url: url, credentials:'omit'}).then((resp)=>{
				let totalResults = parseInt(resp.headers.get('Total-Results'));
				return resp.json().then((data) => {
					return {
						fetchedGroups:data,
						totalResults:totalResults
					};
				});
			});
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