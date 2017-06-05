'use strict';

import {log as logger} from './Log.js';
var log = logger.Logger('ApiRouter');

const config = window.zoteroConfig;
const base = config.baseApiUrl;

let Validator = {
	patterns: {
		//'itemKey': /^([A-Z0-9]{8,},?)+$/,
		'itemKey': /^.+$/,
		'collectionKey': /^([A-Z0-9]{8,})|trash$/,
		//'tag': /^[^#]*$/,
		'libraryID': /^[0-9]+$/,
		'libraryType': /^(user|group|)$/,
		'target': /^(items?|collections?|tags|children|deleted|userGroups|key|settings|publications|group)$/,
		'targetModifier': /^(top|file|file\/view)$/,
		
		//get params
		'sort': /^(asc|desc)$/,
		'start': /^[0-9]*$/,
		'limit': /^[0-9]*$/,
		'order': /^\S*$/,
		'content': /^((html|json|data|bib|none|bibtex|bookmarks|coins|csljson|mods|refer|rdf_bibliontology|rdf_dc|rdf_zotero|ris|tei|wikipedia),?)+$/,
		'include': /^((html|json|data|bib|none|bibtex|bookmarks|coins|csljson|mods|refer|rdf_bibliontology|rdf_dc|rdf_zotero|ris|tei|wikipedia),?)+$/,
		'format': /^((atom|bib|json|keys|versions|bibtex|bookmarks|coins|csljson|mods|refer|rdf_bibliontology|rdf_dc|rdf_zotero|ris|tei|wikipedia),?)+$/,
		'q': /^.*$/,
		'fq': /^\S*$/,
		'itemType': /^\S*$/,
		'locale': /^\S*$/,
		'tag': /^.*$/,
		'tagType': /^(0|1)$/,
		'key': /^\S*/,
		'style': /^\S*$/,
		'linkwrap': /^(0|1)*$/
	},
	
	validate: function(arg, type){
		log.debug('Zotero.validate', 4);
		if(arg === ''){
			return null;
		}
		else if(arg === null){
			return true;
		}
		log.debug(arg + ' ' + type, 4);
		var patterns = this.patterns;
		
		if(patterns.hasOwnProperty(type)){
			return patterns[type].test(arg);
		}
		else{
			return null;
		}
	}
};

/*
 * Requires {target:items|collections|tags, libraryType:user|group, libraryID:<>}
 */
let apiRequestUrl = function(params){
	log.debug('apiRequestUrl', 3);
	log.debug(params, 2);
	Object.keys(params).forEach(function(key){
		var val = params[key];
		//should probably figure out exactly why I'm doing this, is it just to make sure no hashes snuck in?
		//if so the new validation below takes care of that instead
		if(typeof val == 'string'){
			val = val.split('#', 1);
			params[key] = val[0];
		}
		
		//validate params based on patterns in Zotero.Validator
		if(Validator.validate(val, key) === false){
			//warn on invalid parameter and drop from params that will be used
			log.warn('API argument failed validation: ' + key + ' cannot be ' + val);
			log.warn(params);
			delete params[key];
		}
	});
	
	if(!params.target) throw new Error('No target defined for api request');
	if(!(params.libraryType == 'user' ||
		params.libraryType == 'group' ||
		params.libraryType === '')) {
		throw new Error('Unexpected libraryType for api request ' + JSON.stringify(params));
	}
	if((params.libraryType) && !(params.libraryID)) {
		throw new Error('No libraryID defined for api request');
	}
	if((params.target == 'publications') && (params.libraryType != 'user')){
		throw new Error('publications is only valid for user libraries');
	}
	
	var url;
	
	if(params.libraryType !== ''){
		url = base + '/' + params.libraryType + 's/' + params.libraryID;
		if(params.collectionKey){
			if(params.collectionKey == 'trash'){
				url += '/items/trash';
				return url;
			}
			else if(params.collectionKey.indexOf(',') !== -1){
				//noop
			}
			else if(params.target != 'collections'){
				url += '/collections/' + params.collectionKey;
			}
		}
	}
	else{
		url = base;
	}
	
	switch(params.target){
		case 'items':
			url += '/items';
			break;
		case 'item':
			if(params.itemKey){
				url += '/items/' + params.itemKey;
			}
			else{
				url += '/items';
			}
			break;
		case 'collections':
			url += '/collections';
			break;
		case 'childCollections':
			url += '/collections';
			break;
		case 'collection':
			break;
		case 'tags':
			url += '/tags';
			break;
		case 'children':
			url += '/items/' + params.itemKey + '/children';
			break;
		case 'key':
			url = base + '/keys/' + params.apiKey;
			break;
		case 'deleted':
			url += '/deleted';
			break;
		case 'userGroups':
			url = base + '/users/' + params.libraryID + '/groups';
			break;
		case 'settings':
			url += '/settings/' + (params.settingsKey || '');
			break;
		case 'publications':
			url += '/publications/items';
			break;
		case 'group':
			url = `${base}/groups/${params.libraryID}`;
			break;
		default:
			return false;
	}
	switch(params.targetModifier){
		case 'top':
			url += '/top';
			break;
		case 'file':
			url += '/file';
			break;
		case 'viewsnapshot':
			url += '/file/view';
			break;
	}
	return url;
};

let apiQueryString = function(passedParams){
	log.debug('apiQueryString', 4);
	log.debug(passedParams, 4);
	
	Object.keys(passedParams).forEach(function(key){
		var val = passedParams[key];
		if(typeof val == 'string'){
			val = val.split('#', 1);
			passedParams[key] = val[0];
		}
	});
	if(passedParams.hasOwnProperty('order') && passedParams['order'] == 'creatorSummary'){
		passedParams['order'] = 'creator';
	}
	if(passedParams.hasOwnProperty('order') && passedParams['order'] == 'year'){
		passedParams['order'] = 'date';
	}
	if(config.sessionAuth) {
		var sessionKey = Zotero.utils.readCookie(config.sessionCookieName);
		passedParams['session'] = sessionKey;
	}
	
	if(passedParams.hasOwnProperty('sort') && passedParams['sort'] == 'undefined' ){
		passedParams['sort'] = 'asc';
	}
	
	log.debug(passedParams, 4);
	
	var queryString = '?';
	var queryParamsArray = [];
	var queryParamOptions = ['start',
							'limit',
							'order',
							'sort',
							'content',
							'include',
							'format',
							'q',
							'fq',
							'itemType',
							'itemKey',
							'collectionKey',
							'searchKey',
							'locale',
							'tag',
							'tagType',
							'key',
							'style',
							'linkMode',
							'linkwrap',
							'session',
							'newer',
							'since'
	];
	queryParamOptions.sort();
	//build simple api query parameters object
	var queryParams = {};
	queryParamOptions.forEach(function(val){
		if(passedParams.hasOwnProperty(val) && (passedParams[val] !== '')){
			queryParams[val] = passedParams[val];
		}
	});
	
	//take out itemKey if it is not a list
	if(passedParams.hasOwnProperty('target') && passedParams['target'] !== 'items'){
		if(queryParams.hasOwnProperty('itemKey') && queryParams['itemKey'].indexOf(',') == -1){
			delete queryParams['itemKey'];
		}
	}
	
	//take out collectionKey if it is not a list
	if(passedParams.hasOwnProperty('target') && passedParams['target'] !== 'collections'){
		if(queryParams.hasOwnProperty('collectionKey') && queryParams['collectionKey'].indexOf(',') === -1){
			delete queryParams['collectionKey'];
		}
	}
	
	//add each of the found queryParams onto array
	Object.keys(queryParams).forEach(function(key){
		var value = queryParams[key];
		if(Array.isArray(value)){
			value.forEach(function(v){
				if(key == 'tag' && v[0] == '-'){
					v = '\\' + v;
				}
				queryParamsArray.push(encodeURIComponent(key) + '=' + encodeURIComponent(v));
			});
		}
		else{
			if(key == 'tag' && value[0] == '-'){
				value = '\\' + value;
			}
			queryParamsArray.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
		}
	});
	
	//build query string by concatenating array
	queryString += queryParamsArray.join('&');
	return queryString;
};

let apiRequestString = function(config){
	return apiRequestUrl(config) + apiQueryString(config);
};

export {apiRequestUrl, apiQueryString, apiRequestString, Validator};
