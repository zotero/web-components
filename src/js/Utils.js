'use strict';

//import {log as logger} from './Log.js';
//var log = logger.Logger('Utils');

let slugify = function(name){
	var slug = name.trim();
	slug = slug.toLowerCase();
	slug = slug.replace( /[^a-z0-9 ._-]/g , '');
	slug = slug.replace(/\s/g, '_');
	
	return slug;
};

/**
 * Given a query string, parse keys/values into an object
 **/
let parseQuery = function(query) {
	var params = {};
	var match;
	var pl = /\+/g;  // Regex for replacing addition symbol with a space
	var search = /([^&=]+)=?([^&]*)/g;
	var decode = function (s) {
		return decodeURIComponent(s.replace(pl, ' '));
	};

	while((match = search.exec(query)) !== null) {
		let key = decode(match[1]);
		let val = decode(match[2]);
		if(params[key]){
			params[key] = [].concat(params[key], val);
		} else {
			params[key] = val;
		}
	}
	return params;
};

let buildQuery = function(params = {}) {
	let q = '?';
	let ar = [];
	for(let p in params) {
		ar.push(`${encodeURIComponent(p)}=${encodeURIComponent(params[p])}`);
		//q += `&${encodeURIComponent(p)}=${encodeURIComponent(params[p])}`;
	}
	q += ar.join('&');
	return q;
};

//extract the section of a url between ? and #
let querystring = function(href) {
	if(href.indexOf('?') == -1) {
		return '';
	}
	var hashindex = (href.indexOf('#') != -1) ? href.indexOf('#') : undefined;
	var q = href.substring(href.indexOf('?') + 1, hashindex);
	return q;
};

//parse the string from a search box to pull out variables for things other than a basic phrase search
let parseSearchString = function(search) {
	let params = {};
	let matches = search.match(/doi\:(\S+)/);
	if(matches){
		params.doi = matches[1];
	}

	matches = search.match(/isbn\:(\S+)/);
	if(matches){
		params.isbn = matches[1];
	}

	matches = search.match(/pmid\:(\S+)/);
	if(matches){
		params.pmid = matches[1];
	}

	matches = search.match(/pmcid\:(\S+)/);
	if(matches){
		params.pmcid = matches[1];
	}

	matches = search.match(/url\:(\S+)/);
	if(matches){
		params.url = matches[1];
	}

	matches = search.match(/urlbase\:(\S+)/);
	if(matches){
		params.urlbase = matches[1];
	}

	matches = search.match(/title\:(\S+)/);
	if(matches){
		params.title = matches[1];
	}

	matches = search.match(/creators\:(\S+)/);
	if(matches){
		params.creators = matches[1];
	}

	matches = search.match(/itemType\:(\S+)/);
	if(matches){
		params.itemType = matches[1];
	}

	params.q = search.replace(/\S+:\S+/g, '').trim();
	if(params.q == ''){
		delete params.q;
	}

	return params;
};

let readCookie = function(name) {
	var nameEQ = name + '=';
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
};

//check window's zoteroData object for initial state for react components
let loadInitialState = function(defaultState = {}) {
	if(window.zoteroData && window.zoteroData.state){
		return Object.assign({}, window.zoteroData.state);
	}
	return Object.assign({}, defaultState);
};

let pageReady = function(fn) {
	if (document.readyState != 'loading'){
		fn();
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
};

export {slugify, parseQuery, buildQuery, querystring, parseSearchString, readCookie, loadInitialState, pageReady};
