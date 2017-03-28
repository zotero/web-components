'use strict';

import {log as logger} from './Log.js';
var log = logger.Logger('ajax');

//perform a network request defined by config, and return a promise for a Response
//resolve with a successful status (200-300) reject, but with the same Response object otherwise
let ajax = function(config){
	config = Object.assign({type:'GET', credentials:'include'}, config);
	let headersInit = config.headers || {};
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
