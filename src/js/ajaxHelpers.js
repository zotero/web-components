'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('ajaxHelpers.js');

import {ajax} from './ajax.js';
import {apiRequestString} from './ApiRouter.js';

let loadAttachmentItems = function(groupID, start=0){
	let url = apiRequestString({
		target:'items',
		libraryType:'group',
		libraryID:groupID,
		itemType: 'attachment',
		limit:10,
		order:'dateModified',
		start
	});
	
	return ajax({url:url, credentials:'omit'});
};

let deleteSlice = function(groupID, itemKeys) {
	log.debug('deleteSlice');
	let url = apiRequestString({
		target:'items',
		libraryType:'group',
		libraryID:groupID,
		itemKey:itemKeys.join(',')
	});
	log.debug(url);
	//return Promise.resolve({ok:true});
	return ajax({type:'DELETE', url:url, credentials:'omit'});
};

let loadRecentGroupItems = function(group){
	let url = apiRequestString({
		target:'items',
		targetModifier:'top',
		libraryType:'group',
		libraryID:group.id,
		limit:10,
		order:'dateModified'
	});
	
	return ajax({url:url, credentials:'omit'});
};

let loadUserGroups = function(userID){
	let userGroupsUrl = apiRequestString({
		'target':'userGroups',
		'libraryType':'user',
		'libraryID': userID,
		'order':'title'
	});
	return ajax({url: userGroupsUrl, credentials:'omit'});
};

let loadGroupInfo = function(groupID){
	let groupUrl = apiRequestString({target:'group', libraryType:'group', libraryID:groupID});
	return ajax({url:groupUrl, credentials:'omit'});
};

export {loadAttachmentItems, deleteSlice, loadRecentGroupItems, loadUserGroups, loadGroupInfo};