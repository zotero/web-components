'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('ChangeUsernameComponent');

import {ajax} from './ajax.js';
import {buildUrl} from './wwwroutes.js';
import {getCurrentUser} from './Utils.js';
const currentUser = getCurrentUser();

let usernameValidation = async function(username, skipServer=false){
	if(username.indexOf('@') != -1){
		return {
			usernameChecked:true,
			usernameValid:false,
			usernameMessage: 'Your email address can be used to log in to your Zotero account, but not as your username.'
		};
	}
	if(username.trim().indexOf(' ') != -1){
		return {
			usernameChecked:true,
			usernameValid:false,
			usernameMessage: 'Your username can\'t contain spaces'
		};
	}
	if(!(/^[a-z0-9._-]{3,}$/i.test(username))){
		return {
			usernameChecked:true,
			usernameValid:false,
			usernameMessage: 'Username must be at least 3 characters and may only use upper and lower case letters, numbers, ., _, or -'
		};
	}
	if((/^[0-9]+$/i.test(username))){
		return {
			usernameChecked:true,
			usernameValid:false,
			usernameMessage: 'Username can not use exclusively numerals'
		};
	}
	if(!skipServer){
		let userID = null;
		if(currentUser){
			userID = currentUser.userID;
		}
		let checkUrl = buildUrl('checkUsername', {username, userID});
		try{
			let response = await ajax({url:checkUrl});
			let data = await response.json();
			if(data.valid){
				return {
					usernameChecked:true,
					usernameValid:true,
				};
			} else {
				return {
					usernameChecked:true,
					usernameValid:false,
					usernameMessage: 'Username is not available'
				};
			}
		} catch(e) {
			let formErrors = {username: 'Error checking username'};
			return {formErrors};
		}
	}
	return {};
};

export {usernameValidation};
