'use strict';

import {log as logger} from './Log.js';
var log = logger.Logger('ajax');

import {readCookie} from './Utils.js';

const zoteroConfig = window.zoteroConfig;
const apiKey = zoteroConfig.apiKey;

//perform a network request defined by config, and return a promise for a Response
//resolve with a successful status (200-300) reject, but with the same Response object otherwise
let ajax = function(config){
	config = Object.assign({type:'GET', credentials:'include'}, config);

	//get headers from config, or blank, and optionally add auth header for session postback
	let headersInit = config.headers || {};
	if(config.withSession){
		let sessionCookie = readCookie(zoteroConfig.sessionCookieName);
		headersInit.Authorization = sessionCookie;
	} else if(apiKey != ''){
		if(!zoteroConfig.sessionAuth) {
			headersInit['Zotero-Api-Key'] = apiKey;
		}
	}
	let headers = new Headers(headersInit);

	var request = new Request(config.url, {
		method:config.type,
		headers: headers,
		mode:'cors',
		credentials:config.credentials,
		body:config.data
	});

	return fetch(request).then(function(response){
		if (response.status >= 200 && response.status < 300) {
			log.debug('200-300 response: resolving Net.ajax promise', 3);
			// Performs the function "resolve" when this.status is equal to 2xx
			return response;
		} else {
			log.debug('not 200-300 response: rejecting Net.ajax promise', 3);
			// Performs the function "reject" when this.status is different than 2xx
			throw response;
		}
	}, function(err){
		log.error(err);
		throw(err);
	});
};

let postFormData = function(url, data, config={}){
	let fd = new FormData();
	for(let key in data){
		fd.append(key, data[key]);
	}
	
	config.url = url;
	config.type = 'POST';
	config.data = fd;
	
	return ajax(config);
};

export {ajax, postFormData};
