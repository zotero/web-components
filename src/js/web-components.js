'use strict';

import 'babel-polyfill';
import 'whatwg-fetch';
import {log as logger} from './Log.js';
var log = logger.Logger('WebComponents');

var globalScope;
if(typeof window === 'undefined') {
	globalScope = global;
} else {
	globalScope = window;
}

const React = require('react');

globalScope.ReactDOM = require('react-dom');
globalScope.React = React;

import {Storage} from './Storage.js';
import {MakeEditable} from './MakeEditable.js';
import {UserGroups} from './UserGroups.js';
import {GroupInvitations} from './GroupInvitations.js';
import {NewGroupDiscussions} from './NewGroupDiscussions.js';
//import {InviteToGroups} from './InviteToGroups.js';
import {InviteToGroups} from './ServerSideInviteToGroups.js';
import {Start} from './Start.js';
import {CreateGroup} from './CreateGroup.js';

let ZoteroWebComponents = {
	Storage,
	MakeEditable,
	UserGroups,
	GroupInvitations,
	NewGroupDiscussions,
	InviteToGroups,
	Start,
	CreateGroup
};

globalScope.ZoteroWebComponents = ZoteroWebComponents;

export {ZoteroWebComponents};
