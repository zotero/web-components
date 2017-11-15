'use strict';

import {pageReady} from './Utils.js';

//import {log as logger} from './Log.js';
//let log = logger.Logger('ChangeUsernameComponent');

let init = function(){
	if(document){
		pageReady(function(){
			//add type of user to html element on input events
			document.addEventListener('click', function(){
				document.documentElement.classList.add('mouse-user');
				document.documentElement.classList.remove('keyboard-user');
				document.documentElement.classList.remove('touch-user');
			});
			document.addEventListener('keydown', function(){
				document.documentElement.classList.add('keyboard-user');
				document.documentElement.classList.remove('mouse-user');
				document.documentElement.classList.remove('touch-user');
			});
			document.addEventListener('touchstart', function(){
				document.documentElement.classList.add('touch-user');
				document.documentElement.classList.remove('mouse-user');
				document.documentElement.classList.remove('keyboard-user');
			});

			//set up nav classes
			var navToggle = document.querySelector('.nav-toggle'),
			navCover = document.querySelector('.nav-cover'),
			body = document.querySelector('body');

			navToggle.addEventListener('click', function() {
				body.classList.add('nav-opened');
			});

			navCover.addEventListener('click', function() {
				body.classList.remove('nav-opened');
			});
		});
	}
};

export {init};
