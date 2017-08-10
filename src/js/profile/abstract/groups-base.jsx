/* global Zotero:false */
'use strict';

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
	userid: React.PropTypes.number.isRequired
}