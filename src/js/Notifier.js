'use strict';

import {log as logger} from './Log.js';
var log = logger.Logger('Notifier');

import {useState, useEffect, useRef} from 'react';

//type is one of success, info, or error
let Notifier = function(props) {
	const {message, type, redirect, redirectLabel, id} = props;
	const [redirectSecs] = useState(props.redirectSecs || 3);//default seconds before redirect if redirecting
	const [counter, setCounter] = useState(0);
	const intervalRef = useRef();

	//periodically check how much time is left before we should redirect, then redirect
	const intervalCallback = () => {
		setCounter(curCount => curCount+1);
	};

	useEffect(() => {
		//start timer interval to count down if we have a redirect
		if (redirect) {
			intervalRef.current = setInterval(intervalCallback, 1000);
		}
	}, [redirect]);

	if(!message){
		return null;
	}
	let timerMessage = null;
	
	if (redirect) {
		let secsLeft = (redirectSecs - counter);
		if ((secsLeft) <= 0) {
			window.location.href = redirect;
		}
		if (redirectLabel) {
			timerMessage = <p>Redirecting to {redirectLabel} in {secsLeft}...</p>;
		} else {
			timerMessage = <p>Leaving in {secsLeft}...</p>;
		}
	}

	let className = `notifier ${type}`;
	let role = 'alert';
	return (
		<div {...{id, className, role}}>{message}{timerMessage}</div>
	);
};

export {Notifier};
