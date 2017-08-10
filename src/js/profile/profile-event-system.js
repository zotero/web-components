'use strict';

function ProfileEventSystem() {
	this.handlers = {};
};

ProfileEventSystem.prototype.trigger = function(name, value) {
	if(Array.isArray(this.handlers[name])) {
		this.handlers[name].forEach(handler => {
			if(typeof handler === 'function') {
				handler(value);	
			}
		});
	}
};

ProfileEventSystem.prototype.addListener = function(name, callback) {
	if(!Array.isArray(this.handlers[name])) {
		this.handlers[name] = [];
	}

	var count = this.handlers[name].push(callback);
	return count - 1;
};

ProfileEventSystem.prototype.removeListener = function(name, index) {
	if(Array.isArray(this.handlers[name])) {
		delete this.handlers[name][index];
	}
};


module.exports = new ProfileEventSystem();