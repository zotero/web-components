'use strict';

import '@babel/polyfill';
import 'whatwg-fetch';
//import {log as logger} from './Log.js';
//var log = logger.Logger('WebComponents');

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
import {ManageEmails} from './ManageEmails.js';
import {AddViaEmail} from './AddViaEmail';
import * as Institutional from './Institutional/Institutional.js';
import {ProfileImageForm} from './ProfileImageForm.js';
import {GroupLibrarySettings} from './GroupLibrarySettings.js';
import {OrcidProfile, OrcidProfileControl} from './components/OrcidProfile.jsx';
import {PurchaseWorkshop} from './PurchaseWorkshop.jsx';
import {LastSync} from './LastSync.jsx';

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
	ManageEmails,
	AddViaEmail,
	Institutional,
	ProfileImageForm,
	GroupLibrarySettings,
	OrcidProfile,
	OrcidProfileControl,
	PurchaseWorkshop,
	LastSync,
};

globalScope.ZoteroWebComponents = ZoteroWebComponents;

export {ZoteroWebComponents};
