'use strict';

let slugify = function(name){
	var slug = name.trim();
	slug = slug.toLowerCase();
	slug = slug.replace( /[^a-z0-9 ._-]/g , '');
	slug = slug.replace(/\s/g, '_');
	
	return slug;
};

export {slugify};
