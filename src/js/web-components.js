'use strict';

import 'babel-polyfill';
import 'whatwg-fetch';
import 'picturefill';
import 'picturefill/dist/plugins/mutation/pf.mutation.min';
import {init} from './Theme.js';
var WebFont = require('webfontloader');
//import {log as logger} from './Log.js';
//var log = logger.Logger('WebComponents');

var globalScope;
if(typeof window === 'undefined') {
	globalScope = global;
} else {
	globalScope = window;
	init();
}

const React = require('react');
const ReactDOM = require('react-dom');

let jQuery = require('jquery');

globalScope.ReactDOM = ReactDOM;
globalScope.React = React;
globalScope.jQuery = jQuery;
globalScope.$ = jQuery;
globalScope.Popper = require('popper.js');
globalScope.WebFont = WebFont;
require('bootstrap');

import {TweenMax} from 'gsap';
globalScope.TweenMax = TweenMax;

const TWEEN = require('@tweenjs/tween.js');
globalScope.TWEEN = TWEEN;

const BezierEasing = require('bezier-easing');
globalScope.BezierEasing = BezierEasing;

import {Storage} from './Storage.js';
import {MakeEditable} from './MakeEditable.js';
import {UserGroups} from './UserGroups.js';
import {GroupInvitations} from './GroupInvitations.js';
import {NewGroupDiscussions} from './NewGroupDiscussions.js';
import {InviteToGroups} from './InviteToGroups.js';
import {Start, RegisterForm} from './Start.js';
import {Downloads} from './Downloads.js';
import {ExtensionsPicker} from './ExtensionsPicker.js';
import {CreateGroup} from './CreateGroup.js';
import {GroupInfo} from './GroupInfo.js';
import {RecentItems} from './RecentItems.js';
import {ApiKeyEditor} from './ApiKeyEditor.js';
import {pageReady, jsError} from './Utils.js';
import {cycleTestCases, cycleTestFuncs} from './TestUtils.js';
import {Combined} from './GlobalSearch/Combined.js';
import Profile from './profile/profile.jsx';
import {ChangeUsername} from './ChangeUsername.js';
import * as Institutional from './Institutional/Institutional.js';
import {collect} from './animations/collect.js';
import {organize} from './animations/organize.js';
let animations = {
	collect,
	organize
};

let ZoteroWebComponents = {
	Storage,
	MakeEditable,
	UserGroups,
	GroupInvitations,
	NewGroupDiscussions,
	InviteToGroups,
	Start,
	RegisterForm,
	Downloads,
	ExtensionsPicker,
	CreateGroup,
	GroupInfo,
	RecentItems,
	ApiKeyEditor,
	pageReady,
	jsError,
	cycleTestCases,
	cycleTestFuncs,
	Combined,
	Profile,
	ChangeUsername,
	animations,
	Institutional
};

globalScope.ZoteroWebComponents = ZoteroWebComponents;

export {ZoteroWebComponents};
