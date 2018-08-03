'use strict';

class EventSystem {
	constructor(){
		this.handlers = {};
	}
	trigger = (name, value) => {
		if(Array.isArray(this.handlers[name])) {
			this.handlers[name].forEach(handler => {
				if(typeof handler === 'function') {
					handler(value);	
				}
			});
		}
	}
	addListener = (name, callback) => {
		if(!Array.isArray(this.handlers[name])) {
			this.handlers[name] = [];
		}
	
		var count = this.handlers[name].push(callback);
		return count - 1;
	}
	removeListener = (name, index) => {
		if(Array.isArray(this.handlers[name])) {
			delete this.handlers[name][index];
		}
	}
}

let eventSystem = new EventSystem();
export {eventSystem, EventSystem};