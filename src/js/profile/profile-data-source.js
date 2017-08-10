'use strict';

function ProfileDataSource(userslug) {
	this.userslug = userslug;
}

ProfileDataSource.prototype.getData = function(key, page) {
	return $.ajax({
		url: `/${this.userslug}/data/${key}/${page}`,
		type: 'GET'
	});
};

ProfileDataSource.prototype.getFollowers = function(page) {
	return this.getData('followers', page);
};

ProfileDataSource.prototype.getFollowing = function(page) {
	return this.getData('following', page);	
};

ProfileDataSource.prototype.getAllFollowers = function(page) {
	return this.getData('followers', 'all');
};

ProfileDataSource.prototype.getAllFollowing = function(page) {
	return this.getData('following', 'all');
};

module.exports = ProfileDataSource;