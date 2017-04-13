'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('wwwroutes');

import {slugify} from './Utils.js';

let config = window.zoteroConfig;
let baseZoteroWebsiteUrl = config.baseZoteroWebsiteUrl;

let buildUrl = function(name, params){
	switch(name){
		case 'groupJoin':
			return `/groups/${params.group.id}/join`;
		case 'groupDecline':
			return `/groups/${params.group.id}/decline/${params.token}`;
		case 'groupView':
			if(params.group.type == 'Private') {
				return `/groups/${params.group.id}`;
			} else {
				let slug = slugify(params.group.name);
				return `/groups/${slug}`;
			}
		case 'groupLibrary':{
			let groupView = buildUrl('groupView', params);
			return `${groupView}/items`;
		}
		case 'groupImage':
			return groupImageSrc(params.groupID, params.purpose);
		case 'groupSettings':
			return `/groups/${params.group.id}/settings`;
		case 'groupMemberSettings':
			return `/groups/${params.group.id}/settings/members`;
		case 'groupLibrarySettings':
			return `/groups/${params.group.id}/settings/library`;
		case 'saveKey':
			return `/settings/savekey?key=${params.key}`;
		case 'checkGroupName':
			return `/groups/checkname?input=${params.name}`;
		case 'checkUsername':
			return `/user/checkusername?username=${encodeURIComponent(params.username)}`;
		case 'registerAsync':
			return '/user/registerasync';
		case 'profileUrl':
			return `${baseZoteroWebsiteUrl}/${params.slug}`;
		case 'quickstartGuide':
			return '/support/quickstartguide';
	}
};

let groupImageSrc = function(groupID, purpose) {
	if(config.useS3){
		var s3Path = `https://s3.amazonaws.com/${config.s3bucketName}/`;
	}
	let {groupPath, groupImagePath} = config;
	
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

	if(config.useS3){
		return `${s3Path}${groupImagePath}${filename}`;
	}

	return `${groupPath}${filename}`;
};

export {buildUrl};