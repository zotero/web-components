'use strict';

import {log as logger} from './Log.js';
var log = logger.Logger('Utils');

import striptags from 'striptags';
const maxFieldSummaryLength = window.zoteroConfig.maxFieldSummaryLength;

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
	let matches = search.match(/doi:(\S+)/);
	if(matches){
		params.doi = matches[1];
	}

	matches = search.match(/isbn:(\S+)/);
	if(matches){
		params.isbn = matches[1];
	}

	matches = search.match(/pmid:(\S+)/);
	if(matches){
		params.pmid = matches[1];
	}

	matches = search.match(/pmcid:(\S+)/);
	if(matches){
		params.pmcid = matches[1];
	}

	matches = search.match(/url:(\S+)/);
	if(matches){
		params.url = matches[1];
	}

	matches = search.match(/urlbase:(\S+)/);
	if(matches){
		params.urlbase = matches[1];
	}

	matches = search.match(/title:(\S+)/);
	if(matches){
		params.title = matches[1];
	}

	matches = search.match(/creators:(\S+)/);
	if(matches){
		params.creators = matches[1];
	}

	matches = search.match(/itemType:(\S+)/);
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

let pageReadyStack = [];

let pageReady = function(fn) {
	if(document.readyState === 'interactive' || document.readyState === 'complete'){
		fn();
	} else {
		pageReadyStack.push(fn);
		document.onreadystatechange = ()=> {
			if (document.readyState === 'interactive' || document.readyState === 'complete') {
				let stackCopy = pageReadyStack;
				pageReadyStack = [];
				for(let i=0; i<stackCopy.length; i++){
					stackCopy[i]();
				}
			}
		};
	}
};

let jsError = function(msg) {
	let li = document.createElement('li');
	li.setAttribute('class', 'jsNotificationMessage-error');
	let newContent = document.createTextNode(msg);
	li.appendChild(newContent);
	document.querySelector('.messages').appendChild(li);
};

let jsSuccess = function(msg) {
	let li = document.createElement('li');
	li.setAttribute('class', 'jsNotificationMessage-confirm');
	let newContent = document.createTextNode(msg);
	li.appendChild(newContent);
	document.querySelector('.messages').appendChild(li);
};

let Delay = function(delay, val) {
	return new Promise(function (resolve) {
		setTimeout(function () {
			resolve(val);
		}, delay);
	});
};

let getItemField = function(key, item){
	switch(key) {
		case 'title':
			var title = '';
			if(item.data.itemType == 'note'){
				var len = 120;
				var notetext = striptags(item.data.note);
				var firstNewline = notetext.indexOf('\n');
				if((firstNewline != -1) && firstNewline < len){
					return notetext.substr(0, firstNewline);
				}
				else {
					return notetext.substr(0, len);
				}
			} else {
				title = item.data.title;
			}
			if(title === ''){
				return '[Untitled]';
			}
			return title;
		case 'creatorSummary':
		case 'creator':
			if(typeof item.meta.creatorSummary !== 'undefined'){
				return item.meta.creatorSummary;
			}
			return '';
		case 'year':
			if(item.parsedDate) {
				return item.parsedDate.getFullYear();
			}
			return '';
	}

	if(key in item.data){
		return item.data[key];
	} else if(key in item.meta){
		return item.meta[key];
	} else if(item.hasOwnProperty(key)){
		return item[key];
	}

	return null;
};

//parse a Zotero API date
let parseApiDate = function(datestr){
	var re = /([0-9]+)-([0-9]+)-([0-9]+)T([0-9]+):([0-9]+):([0-9]+)Z/;
	var matches = re.exec(datestr);
	if(matches === null){
		log.error(`error parsing api date: ${datestr}`, 2);
		return null;
	} else{
		var date = new Date(Date.UTC(matches[1], matches[2]-1, matches[3], matches[4], matches[5], matches[6]));
		return date;
	}
};

//take an item (Zotero API v3 format) and output a named field for display
let formatItemField = function(field, item, trim=false){
	var intlOptions = {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hour12: false
	};

	var formatDate;
	if(Intl) {
		var dateFormatter = new Intl.DateTimeFormat(undefined, intlOptions);
		formatDate = dateFormatter.format;
	} else {
		formatDate = function(date) {
			return date.toLocaleString();
		};
	}

	var trimLength = 0;
	var formattedString = '';
	var date;
	if(maxFieldSummaryLength[field]){
		trimLength = maxFieldSummaryLength[field];
	}
	switch(field){
		case 'itemType':
			formattedString = Zotero.localizations.typeMap[item.data.itemType];
			break;
		case 'dateModified':
			if(!item.data['dateModified']){
				formattedString = '';
			}
			date = parseApiDate(item.data['dateModified']);
			if(date){
				formattedString = formatDate(date);
			} else{
				formattedString = item.data['dateModified'];
			}
			break;
		case 'dateAdded':
			if(!item.data['dateAdded']){
				formattedString = '';
			}
			date = parseApiDate(item.data['dateAdded']);
			if(date){
				formattedString = formatDate(date);
			} else{
				formattedString = item.data['dateAdded'];
			}
			break;
		case 'title':
			formattedString = getItemField('title', item);
			break;
		case 'creator':
		case 'creatorSummary':
			formattedString = getItemField('creatorSummary', item);
			break;
		case 'addedBy':
			if(item.meta.createdByUser){
				if(item.meta.createdByUser.name !== '') {
					formattedString = item.meta.createdByUser.name;
				} else {
					formattedString = item.meta.createdByUser.username;
				}
			}
			break;
		case 'modifiedBy':
			if(item.meta.lastModifiedByUser){
				if(item.meta.lastModifiedByUser.name !== ''){
					formattedString = item.meta.lastModifiedByUser.name;
				} else {
					formattedString = item.meta.lastModifiedByUser.username;
				}
			}
			break;
		default:
		{
			let fv = getItemField(field, item);
			if(fv !== null && fv !== undefined) {
				formattedString = fv;
			}
		}
	}
	if(typeof formattedString == 'undefined'){
		log.error('formattedString for ' + field + ' undefined');
		log.error(item);
	}
	if(trim) {
		return trimString(formattedString, trimLength);
	} else{
		return formattedString;
	}
};

let formatCurrency = function(cents){
	let d = cents / 100;
	if(typeof(Intl) !== 'undefined') {
		return new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'}).format(d);
	} else {
		return `$${d.toFixed(2)}`;
	}
};

let trimString = function(s, trimLength=35){
	var formattedString = s;
	if(typeof s == 'undefined'){
		log.error('formattedString passed to trimString was undefined.');
		return '';
	}
	if((trimLength > 0) && (formattedString.length > trimLength) ) {
		return formattedString.slice(0, trimLength) + '…';
	} else{
		return formattedString;
	}
};

let getCurrentUser = function(){
	if(window.zoteroData && window.zoteroData.currentUser) {
		return window.zoteroData.currentUser;
	} else if(window.Zotero && window.Zotero.currentUser) {
		return window.Zotero.currentUser;
	}
	return false;
};

let randomString = function(len, chars) {
	if (!chars) {
		chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	}
	if (!len) {
		len = 8;
	}
	var randomstring = '';
	for (var i=0; i<len; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
};

export {slugify, parseQuery, buildQuery, querystring, parseSearchString, readCookie, loadInitialState, pageReady, jsError, jsSuccess, Delay, formatItemField, formatCurrency, getCurrentUser, randomString};
