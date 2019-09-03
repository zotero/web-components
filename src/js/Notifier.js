'use strict';

import {log as logger} from './Log.js';
var log = logger.Logger('Notifier');

import {useState, useEffect, useRef} from 'react';

let Notifier = function(props) {
	const {message, type, redirect, redirectLabel} = props;
	const [startTime, setStartTime] = useState(Date.now());
	const [timeLeft, setTimeLeft] = useState(5);
	const intervalRef = useRef();

	//periodically check how much time is left before we should redirect, then redirect
	const intervalCallback = () => {
		let nowMS = Date.now();
		let elapsedMS = nowMS - startTime;
		log.debug(`elapsedMS: ${elapsedMS}`);
		let secsLeft = Math.max(0, Math.floor((5500 - elapsedMS) / 1000));
		log.debug(`secsLeft: ${secsLeft}`);
		setTimeLeft(secsLeft);
		
		if(elapsedMS >= 5000) {
			clearInterval(intervalRef.current);
			window.location.href = redirect;
		}
	};

	useEffect(() => {
		//start timer interval to count down if we have a redirect
		if (redirect) {
			intervalRef.current = setInterval(intervalCallback, 500);
		}
	}, []);

	if(!message){
		return null;
	}
	let timerMessage = null;
	
	if (redirect) {
		if (timeLeft <= 0) {
			window.location.href = redirect;
		}
		if (redirectLabel) {
			timerMessage = <p>Redirecting to {redirectLabel} in {timeLeft}...</p>;
		} else {
			timerMessage = <p>Leaving in {timeLeft}...</p>;
		}
	}

	let className = `notifier ${type}`;
	return (
		<div className={className} role='alert'>{message}{timerMessage}</div>
	);
};

export {Notifier};
