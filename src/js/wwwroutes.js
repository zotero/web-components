'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('wwwroutes');

import {slugify} from './Utils.js';

let config = window.zoteroConfig;
let baseZoteroWebsiteUrl = config.baseZoteroWebsiteUrl;

let buildUrl = function(name, params){
	switch(name){
		case 'groupCreate':
			return `/groups/new`;
		case 'groupInvite':
			return `/groups/inviteuser`;
		case 'groupJoin':
			return `/groups/${params.group.data.id}/join`;
		case 'groupLeave':
			return `/groups/${params.group.data.id}/leave`;
		case 'groupDecline':
			return `/groups/${params.group.data.id}/decline/${params.token}`;
		case 'groupAcceptOwnership':
			return `/groups/${params.group.data.id}/acceptownership`;
		case 'groupDeclineInvitation':
			return `/groups/${params.group.data.id}/decline`;
		case 'groupView':{
			let slug = slugify(params.group.data.name);
			return `/groups/${params.group.data.id}/${slug}`;
		}
		case 'groupLibrary':{
			let groupView = buildUrl('groupView', params);
			return `${groupView}/items`;
		}
		case 'groupImage':
			return groupImageSrc(params.groupID, params.purpose);
		case 'updateGroupImage':
			return `/groups/${params.groupID}/settings/image`;
		case 'groupSettings':
			return `/groups/${params.group.data.id}/settings`;
		case 'groupMemberSettings':
			return `/groups/${params.group.data.id}/settings/members`;
		case 'groupLibrarySettings':
			return `/groups/${params.group.data.id}/settings/library`;
		case 'saveKey':
			if(params.key){
				return `/settings/savekey?key=${params.key}`;
			} else {
				if(params.oauth){
					return `/settings/savekey?oauth=1`;
				}
				return `/settings/savekey`;
			}
		case 'revokeKey':
			if(params.key){
				return `/settings/revokekey?key=${params.key}`;
			} else {
				throw 'No key specified in revokeKey';
			}
		case 'checkGroupName':
			return `/groups/checkname?input=${params.name}`;
		case 'checkUsername':
			return `/user/checkusername?username=${encodeURIComponent(params.username)}`;
		case 'changeUsername':
			return `/settings/changeusername`;
		case 'completeUsername':
			return `/users/completeusername`;
		case 'updateEmail':
			return `/settings/updateemail`;
		case 'manageInstitution':
			return `/settings/storage/institution/${params.institutionID}`;
		case 'institutionemaillist':
			return `/settings/storage/institution/${params.institutionID}/emaillist`;
		case 'updateProfileImage':
			return `/settings/profileimage`;
		case 'profileImage':
			return profileImageSrc(params.userID, params.purpose);
		case 'itemUrl':
			if(params.item.library.type == 'group'){
				return `/groups/${params.item.library.id}/${slugify(params.item.library.name)}/items/itemKey/${params.item.key}`;
			} else if(params.item.library.type == 'user'){
				return `/${slugify(params.item.library.name)}/items/itemKey/${params.item.key}`;
			} else {
				throw new Error('Unknown library type');
			}
		case 'registerAsync':
			return '/user/registerasync';
		case 'profileUrl':
			return `${baseZoteroWebsiteUrl}/${params.slug}`;
		case 'quickstartGuide':
			return '/support/quickstartguide';
		case 'pluginSupport':
			return '/support/plugins';
		case 'connectors':
			return '/download/connectors';
		case 'download':
			return '/download';
		case 'login':
			return '/user/login';
		case 'register':
			return '/user/register';
		case 'updateCv':
			return '/settings/updatecv';
		case 'followUser':
			return '/user/follow';
	}
	throw new Error('Unknown route in buildUrl');
};

let groupImageSrc = function(groupID, purpose) {
	let {useS3, groupImagePath, s3bucketName, staticPath} = config;
	if(useS3){
		var s3Path = `https://s3.amazonaws.com/${s3bucketName}/`;
	}

	let size;
	switch(purpose) {
		case 'thumb':
			size = '_squarethumb.png';
			break;
		case 'original':
			size = '_original.png';
			break;
		case 'profile':
		default:
			size = '_200px.png';
	}

	let filename = `/${groupID ? groupID : 'default'}${size}`;

	if(useS3){
		return `${s3Path}${groupImagePath}${filename}`;
	}

	return `${staticPath}${groupImagePath}${filename}`;
};

let profileImageSrc = function(userID, purpose){
	let {useS3, profileImagePath, s3bucketName, staticPath} = config;
	if(useS3){
		var s3Path = `https://s3.amazonaws.com/${s3bucketName}/`;
	}

	let size;
	switch(purpose) {
		case 'thumb':
			size = '_squarethumb.png';
			break;
		case 'original':
			size = '_original.png';
			break;
		case 'profile':
		default:
			size = '_200px.png';
	}

	let filename = `/${userID ? userID : 'default'}${size}`;

	if(useS3){
		return `${s3Path}${profileImagePath}${filename}`;
	}

	return `${staticPath}/${profileImagePath}${filename}`;
}

export {buildUrl};