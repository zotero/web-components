'use strict';

import {log as logger} from './Log.js';
var log = logger.Logger('LocationState');

var utils = require('./Utils');

var useLocation = true;

//LocationState manages the location using the History API, maintaining easy access to
//variables represented in path/query/fragment
var LocationState = function(basePath=''){
	this.vars={
		path:{},
		q:{},
		f:{}
	};
	this.basePath = basePath;
};

LocationState.prototype.setBasePath = function(basePath=''){
	this.basePath = basePath;
};

LocationState.prototype.unsetPathVar = function(unset){
	if(this.vars.path[unset]){
		delete(this.path.vars[unset]);
	}
};

LocationState.prototype.unsetVar = function(unset){
	if(this.vars.path[unset]){
		delete(this.vars.path[unset]);
	}
	if(this.vars.q[unset]){
		delete(this.vars.q[unset]);
	}
	if(this.vars.f[unset]){
		delete(this.vars.f[unset]);
	}
};

LocationState.prototype.clearPathVars = function(except=[]){
	let v = this.vars.path;
	for(let key in v){
		if(except.indexOf(key) == -1){
			delete(v[key]);
		}
	}
};

LocationState.prototype.clearQueryVars = function(except=[]){
	let v = this.vars.q;
	for(let key in v){
		if(except.indexOf(key) == -1){
			delete(v[key]);
		}
	}
};

LocationState.prototype.clearFragmentVars = function(except=[]){
	let v = this.vars.f;
	for(let key in v){
		if(except.indexOf(key) == -1){
			delete(v[key]);
		}
	}
};

LocationState.prototype.clearVars = function(except=[]){
	this.clearPathVars(except);
	this.clearQueryVars(except);
	this.clearFragmentVars(except);
};

//parse path, query, and fragment variables from an href.
//if no href is passed, use the current window's
LocationState.prototype.parseVars = function(href=false){
	if(href === false){
		href = window.location.href;
	}

	this.vars = this.parseHrefVars(href);
};

LocationState.prototype.parseHrefVars = function(href=false){
	if(href === false){
		return {};
	}

	let vars = {};
	vars.path = this.parsePathVars(href);
	vars.q = this.parseQueryVars(href);
	vars.f = this.parseFragmentVars(href);
	return vars;
};

//parse slash delimited strings into a key/value map
let parseSlashed = function(slashString=''){
	//remove leading slash
	if(slashString.startsWith('/')){
		slashString = slashString.substr(1);
	}
	let split = slashString.split('/');
	
	//pull out key/value pairs 
	let slashVars = {};
	for(let i=0; i<(split.length-1); i = i+2){
		let key = decodeURIComponent(split[i]);
		let val = decodeURIComponent(split[i+1]);
		
		let pathVar = slashVars[key];
		if(pathVar){
			//if var already present change to array and/or push
			if(Array.isArray(pathVar)){
				pathVar.push(val);
			}
			else{
				var ar = [pathVar];
				ar.push(val);
				pathVar = ar;
			}
		} else{
			//otherwise just set the value in the object
			pathVar = val;
		}
		slashVars[key] = pathVar;
	}

	return slashVars;
};

//parse variables out of a path using basePath/<key1>/<val1>/<key2>/<val2> pattern
LocationState.prototype.parsePathVars = function(href=''){
	//parse variables out of library urls
	//:userslug/items/:itemKey/*
	//:userslug/items/collection/:collectionKey
	//groups/:groupidentifier/items/:itemKey/*
	//groups/:groupidentifier/items/collection/:collectionKey/*
	
	let basePath = this.basePath;

	if(href.indexOf(basePath) == -1){
		log.debug(basePath);
		log.debug(href);
		throw 'basePath not found in href for parsePathVars';
	}

	//remove everything up to and including basePath
	let path = href.substr(href.indexOf(basePath));
	path = path.replace(basePath, '');
	//remove fragment and query if present
	if(path.includes('?')){
		path = path.substr(0, path.indexOf('?'));
	}
	if(path.includes('#')){
		path = path.substr(0, path.indexOf('#'));
	}

	var pathVars = parseSlashed(path);
	return pathVars;
};

LocationState.prototype.parseQueryVars = function(href=''){
	let querystring = utils.querystring(href);
	return utils.parseQuery(querystring);
};

LocationState.prototype.parseFragmentVars = function(href=''){
	let fragment = href;
	if(!href.includes('#')){
		return {};
	}
	if(href.indexOf('#') != -1){
		fragment = href.substr(href.indexOf('#'));
	}

	if(fragment.startsWith('#')){
		fragment = fragment.substr(1);
	}
	return parseSlashed(fragment);
};

//build a url based on key/val maps and the basePath
//key/value pairs in the path and the query will be sorted so given sets
//will always generate the same final url
LocationState.prototype.buildUrl = function(urlvars={}, queryVars=false, fragmentVars=false){
	let basePath = this.basePath;
	if(!basePath.endsWith('/')){
		basePath += '/';
	}
	
	let urlVarsArray = [];
	for(let index in urlvars){
		let value = urlvars[index];
		if(!value) {
			return;
		} else if(Array.isArray(value)) {
			value.forEach((v) => {
				urlVarsArray.push(index + '/' + encodeURIComponent(v) );
			});
		} else{
			urlVarsArray.push(index + '/' + encodeURIComponent(value) );
		}
	}
	urlVarsArray.sort();
	
	let queryVarsArray = [];
	for(let index in queryVars) {
		let value = queryVars[index];
		if(!value) {
			return;
		} else if(Array.isArray(value)) {
			value.forEach((v) => {
				queryVarsArray.push(index + '=' + encodeURIComponent(v) );
			});
		} else{
			queryVarsArray.push(index + '=' + encodeURIComponent(value) );
		}
	}
	queryVarsArray.sort();
	
	let fragmentVarsArray = [];
	for(let index in fragmentVars){
		let value = fragmentVars[index];
		if(!value) {
			return;
		} else if(Array.isArray(value)) {
			value.forEach((v) => {
				fragmentVarsArray.push(index + '/' + encodeURIComponent(v) );
			});
		} else{
			fragmentVarsArray.push(index + '/' + encodeURIComponent(value) );
		}
	}
	fragmentVarsArray.sort();
	
	let pathVarsString = urlVarsArray.join('/');
	let queryString = '';
	if(queryVarsArray.length){
		queryString = '?' + queryVarsArray.join('&');
	}
	let fragString = '';
	if(fragmentVarsArray.length){
		fragString = '#' + fragmentVarsArray.join('/');
	}
	let url = basePath + pathVarsString + queryString + fragString;
	return url;
};

//addvars is a key/value map to add to the url
//removevars is an array of var keys to remove
LocationState.prototype.mutateUrl = function(addvars, removevars){
	if(!addvars){
		addvars = {};
	}
	if(!removevars){
		removevars = [];
	}

	var urlvars = Object.assign({}, this.vars.path);
	for(let key in addvars) {
		urlvars[key] = addvars[key];
	}
	
	if(!Array.isArray(removevars)){
		log.error('removevars is not an array');
	}
	removevars.forEach((val) => {
		delete urlvars[val];
	});
	
	var url = this.buildUrl(urlvars, false);
	
	return url;
};

LocationState.prototype.pushState = function(){
	var history = window.history;
	var url;
	if(useLocation){
		url = this.buildUrl(this.vars.path, this.vars.q, this.vars.f);
	}
	
	//actually push state and manually call urlChangeCallback if specified
	history.pushState(this.vars, document.title, url);
	this.stateChanged();
};

LocationState.prototype.replaceState = function(){
	var history = window.history;
	var url;
	if(useLocation){
		url = this.buildUrl(this.vars.path, this.vars.q, this.vars.f);
	}
	
	history.replaceState(this.vars, document.title, url);
};

LocationState.prototype.updateStateTitle = function(title){
	document.title = title;
};

LocationState.prototype.getVar = function(key){
	if(this.vars.path[key]){
		return this.vars.path[key];
	} else if(this.vars.q[key]){
		return this.vars.q[key];
	} else if(this.vars.f[key]){
		return this.vars.f[key];
	}
	return undefined;
};

LocationState.prototype.setPathVar = function(key, val){
	this.vars.path[key] = val;
};

LocationState.prototype.setQueryVar = function(key, val){
	if(val === ''){
		delete this.vars.q[key];
	} else{
		this.vars.q[key] = val;
	}
};

LocationState.prototype.setFragmentVar = function(key, val){
	this.vars.f[key] = val;
};

LocationState.prototype.addQueryVar = function(key, val){
	let q = this.vars.q;
	if(q.hasOwnProperty(key)){
		//property exists
		if(Array.isArray(q[key])){
			q[key].push(val);
		} else{
			let newArray = [q[key], val];
			q[key] = newArray;
		}
	} else{
		//no value for that key yet
		q[key] = val;
	}
	return q[key];
};

LocationState.prototype.popstateCallback = function(evt){
	let prevHref = this.buildUrl(this.vars.path, this.vars.q, this.vars.f);
	let curHref = document.location;
	let state = evt.state;
	
	if(state){
		this.vars = state;
	} else {
		this.parseVars();
	}
	//reparse url to set vars in Z.ajax
	this.stateChanged(prevHref, curHref);
};

LocationState.prototype.stateChanged = function(prevHref, curHref){
	let changedVars = this.diffState(prevHref, curHref);
};

LocationState.prototype.diffState = function(prevHref, curHref){
	log.debug('State.diffState', 3);
	//check what has changed when a new state is pushed
	let prevVars = this.parseHrefVars(prevHref);
	let flatPrev = Object.assign({}, prevVars.f, prevVars.q, prevVars.path);
	let curVars = this.parseHrefVars(curHref);
	let flatCur = Object.assign({}, curVars.f, curVars.q, curVars.path);
	
	return changedProperties(flatPrev, flatCur);
};

let changedProperties = function(a, b){
	let presentKeys = [].concat(Object.keys(a), Object.keys(b));

	let changedVars = {};
	presentKeys.forEach((val) => {
		if(a[val] != b[val]){
			changedVars[val] = true;
		}
	});
	
	return Object.keys(changedVars).sort();
};

module.exports = LocationState;
