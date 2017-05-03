'use strict';

import {log as logger} from './Log.js';
var log = logger.Logger('TestUtil');

let nextTestCase = function(component, testStates){
	let testKeys = Object.keys(testStates);
	let currentCase = window.location.hash.substr(1);
	let nextCase = testKeys[0];
	for(let ind = 0; ind < testKeys.length; ind++){
		if(testKeys[ind] == currentCase){
			let nextInd = (ind + 1) % testKeys.length;
			nextCase = testKeys[nextInd];
			break;
		}
	}
	component.setState(testStates[nextCase]);
	window.location.hash = nextCase;
};

let prevTestCase = function(component, testStates){
	let testKeys = Object.keys(testStates);
	let currentCase = window.location.hash.substr(1);
	let prevCase = testKeys[0];
	for(let ind = 0; ind < testKeys.length; ind++){
		if(testKeys[ind] == currentCase){
			let prevInd = ind - 1;
			if(prevInd < 0){
				prevInd = testKeys.length - 1;
			}
			prevCase = testKeys[prevInd];
			break;
		}
	}
	component.setState(testStates[prevCase]);
	window.location.hash = prevCase;
};

let cycleTestCases = function(component=false, testStates=false) {
	if(component === false || testStates === false){
		log.error('required component or testStates is unspecified in cycleTestCases');
		return;
	}
	window.onkeypress = function(evt){
		//log.debug(evt);
		if(evt.key == 'n'){
			nextTestCase(component, testStates);
		} else if(evt.key == 'p'){
			prevTestCase(component, testStates);
		}
	};
};

export {cycleTestCases};