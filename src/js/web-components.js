

import { init } from './Theme.js';
import WebFont from 'webfontloader';
// import {log as logger} from './Log.js';
// var log = logger.Logger('WebComponents');

var globalScope;
if (typeof window === 'undefined') {
	globalScope = global;
} else {
	globalScope = window;
	init();
}

import React from 'react';
import ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import jQuery from 'jquery';
import Popper from 'popper.js';
import TWEEN from '@tweenjs/tween.js';
import BezierEasing from 'bezier-easing';

globalScope.ReactDOM = ReactDOM;
globalScope.ReactDOMClient = ReactDOMClient;
globalScope.React = React;
globalScope.jQuery = jQuery;
globalScope.$ = jQuery;
globalScope.Popper = Popper;
globalScope.WebFont = WebFont;
globalScope.TWEEN = TWEEN;
globalScope.BezierEasing = BezierEasing;

import * as bootstrap from 'bootstrap';
globalScope.bootstrap = bootstrap;

import { Storage, StorageSummary } from './storage/Storage.js';
import { MakeEditable } from './MakeEditable.js';
import { GroupInvitations } from './Groups/GroupInvitations.jsx';
import { NewGroupDiscussions } from './Groups/NewGroupDiscussions.jsx';
import { InviteToGroups } from './InviteToGroups.js';
import { Start, RegisterForm } from './Start.js';
import { Downloads } from './Downloads.js';
import { ExtensionsPicker } from './ExtensionsPicker.js';
import { CreateGroup } from './CreateGroup.js';
import { GroupInfo } from './Groups/GroupInfo.jsx';
import { RecentItems } from './RecentItems.js';
import { ApiKeyEditor } from './ApiKeyEditor.js';
import { pageReady, jsError, readCookie } from './Utils.js';
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
import { U2FVerifier, ManageTwoFactor } from './components/TwoFactor.jsx';
import { PaymentDetails } from './storage/PaymentDetails.jsx';

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
	readCookie,
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
	U2FVerifier,
	ManageTwoFactor,
	PaymentDetails,
};

globalScope.ZoteroWebComponents = ZoteroWebComponents;

export { ZoteroWebComponents };
