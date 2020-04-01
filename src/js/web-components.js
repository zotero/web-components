

import '@babel/polyfill';
import 'whatwg-fetch';
import 'picturefill';
import 'picturefill/dist/plugins/mutation/pf.mutation.min';
import { init } from './Theme.js';
var WebFont = require('webfontloader');
// import {log as logger} from './Log.js';
// var log = logger.Logger('WebComponents');

var globalScope;
if (typeof window === 'undefined') {
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

import { TweenMax } from 'gsap';
globalScope.TweenMax = TweenMax;

const TWEEN = require('@tweenjs/tween.js');
globalScope.TWEEN = TWEEN;

const BezierEasing = require('bezier-easing');
globalScope.BezierEasing = BezierEasing;

import { Storage, StorageSummary } from './storage/Storage.js';
import { MakeEditable } from './MakeEditable.js';
import { GroupInvitations } from './Groups/GroupInvitations.js';
import { NewGroupDiscussions } from './Groups/NewGroupDiscussions.js';
import { InviteToGroups } from './InviteToGroups.js';
import { Start, RegisterForm } from './Start.js';
import { Downloads } from './Downloads.js';
import { ExtensionsPicker } from './ExtensionsPicker.js';
import { CreateGroup } from './CreateGroup.js';
import { GroupInfo } from './Groups/GroupInfo.jsx';
import { RecentItems } from './RecentItems.js';
import { ApiKeyEditor } from './ApiKeyEditor.js';
import { pageReady, jsError } from './Utils.js';
import { cycleTestCases, cycleTestFuncs } from './TestUtils.js';
import { Profile } from './profile/profile.jsx';
import { ChangeUsername } from './ChangeUsername.js';
import { ManageEmails } from './ManageEmails.js';
import { AddViaEmail } from './AddViaEmail';
import * as Institutional from './Institutional/Institutional.js';
import { collect } from './animations/collect.js';
import { organize } from './animations/organize.js';
import { activateFootnotes } from './footnotes.js';
let animations = {
	collect,
	organize
};
import { ProfileImageForm } from './ProfileImageForm.js';
import { OrcidProfile, OrcidProfileControl } from './components/OrcidProfile.jsx';
import { CVEditor } from './CV/cv.js';
import { FollowButtons, FollowSection } from './FollowButtons.jsx';
import { Search } from './Search.jsx';
import { PurchaseWorkshop } from './PurchaseWorkshop.jsx';
import { GroupLibrarySettings, TransferOwnership } from './components/GroupSettings/GroupSettings.js';
import { DeleteGroup } from './components/GroupSettings/DeleteGroup.jsx';
import { GroupsPageContainer } from './Groups/GroupsPageContainer.jsx';
import { MemberSettingsContainer } from './Groups/MemberSettingsContainer.jsx';
import { ManageContribution } from './contribute/Contribute.jsx';
import { PayInvoice } from './storage/PayInvoice.jsx';
import { SuggestableInput } from './components/SuggestableInput.jsx';
import { RelatedContainer } from './profile/relatedContainer.jsx';
import { InviteMembers } from './components/GroupSettings/InviteMembers.jsx';

let ZoteroWebComponents = {
	Storage,
	StorageSummary,
	MakeEditable,
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
	Profile,
	ChangeUsername,
	animations,
	ManageEmails,
	AddViaEmail,
	Institutional,
	ProfileImageForm,
	GroupLibrarySettings,
	TransferOwnership,
	DeleteGroup,
	OrcidProfile,
	OrcidProfileControl,
	CVEditor,
	FollowButtons, FollowSection,
	activateFootnotes,
	Search,
	PurchaseWorkshop,
	GroupsPageContainer,
	MemberSettingsContainer,
	ManageContribution,
	PayInvoice,
	SuggestableInput,
	RelatedContainer,
	InviteMembers,
};

globalScope.ZoteroWebComponents = ZoteroWebComponents;

export { ZoteroWebComponents };
