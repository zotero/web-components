<?
$bodyClass = '';

$testData = include('./testdata.php');
$user = null;
if($_GET['user']){
	$username = $_GET['user'];
	if(isset($testData[$username])){
		$user = $testData[$username];
	}
}
?>
<? include('./layoutHeader.php');?>
<!-- Output the breadcrumb if it's set -->
<div class="container">
	<nav aria-label="breadcrumb" role="navigation">
		<ol class="breadcrumb">
			<li class="breadcrumb-item"><a href="/">Home</a></li>
			<li class="breadcrumb-item" aria-current="page"><a href="/settings">Settings</a></li>
			<li class="breadcrumb-item active" aria-current="page">Storage</li>
		</ol>
	</nav>
</div>
<main>
	<div class="container">
		<div class="row">
			<? $selectedTab = 'storage';
			include('./partials/settingsTabs.php');?>

			<div class='col-md-10 settings-form'>
				<p><a href="http://www.zotero.org/support/storage_faq">Frequently Asked Questions</a></p>
				<p class='mb-0'><a href="/settings/storage/invoice">View Payment Receipt</a></p>
				<p class="text-muted small">This is the receipt for your most recent payment. You can edit the contact information on the receipt if necessary.</p>

				<div id='react-storage'></div>

				<p>Subscriptions are billed annually<br />
				By using Zotero, you agree to be bound by its <a href="">Terms of Service</a>.</p>

				<hr />
				<div class='purge-storage'>
					<button class='btn btn-danger'>Purge Storage in My Library</button>
					<label class='small text-muted'>Use this to free up space for group libraries you own after disabling file syncing for My Library or switching to WebDAV storage.</label>
				</div>

				<script src="https://js.stripe.com/v3/"></script>
				<script type="text/javascript" charset="utf-8">
					window.zoteroData = {
						planQuotas: {
							"1": 300,
							"2": 2000,
							"3": 6000,
							"4": 10000,
							"5": 25000,
							"6": 1000000
						},
						stripePublishableKey: "pk_test_u8WpYkXuG2X155p0rC4YqkvO",
					};
					ZoteroWebComponents.pageReady(function () {
						window.stripe = Stripe(window.zoteroData.stripePublishableKey);

						let now = Date.now() / 1000;

						let tests = {
							test1: function () {
								let props = { 
									userSubscription: {
										userID: 10150, storageLevel: 3, quota: "6000", expirationDate: "1599569452", recur: 0, paymentType: "stripe", orderID: "ch_9qd2iqgmUkmRea", usage: {
											total: "2002.4", library: "1996.8", groups: {
												2413: "1.6", 8908: "4"
											}
										},
										discounted: false,
										discountEligible: false,
										institutions: [],
										hasExistingSubscription: false,
									},
									storageGroups: { 2413: { properties: null, id: "2413", groupID: "2413", owner: 10150, type: "Private", name: "Test group", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "none", hasImage: 0, description: "", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "Test group", dateAdded: "2009-06-29T17:16:35Z", dateUpdated: "2014-03-18T19:28:14Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/2413" } }, alternate: { "text/html": { href: "http://zotero.org/groups/2413" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "Test group", owner: 10150, type: "Private", description: "", url: "", libraryEditing: "admins", libraryReading: "all", fileEditing: "none" }, ownerID: 10150, groupType: "Private", numItems: "18", members: [], admins: [10150], userReadable: false, userEditable: false }, 8908: { properties: null, id: "8908", groupID: "8908", owner: 10150, type: "PublicClosed", name: "owned group library", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "members", hasImage: 1, description: "<p>purple</p>", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "owned group library", dateAdded: "2009-12-14T07:04:24Z", dateUpdated: "2016-12-15T17:39:16Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/8908" } }, alternate: { "text/html": { href: "http://zotero.org/groups/8908" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "owned group library", owner: 10150, type: "PublicClosed", description: "<p>purple</p>", url: "", hasImage: 1, libraryEditing: "admins", libraryReading: "all", fileEditing: "members" }, ownerID: 10150, groupType: "PublicClosed", numItems: "12", members: [], admins: [10150], userReadable: false, userEditable: false } },
									stripeCustomer: { id: "cus_9qd2rB9PeTn0H0", deleted: true },
									operationPending: false,
									notificationClass: "",
									notification: "",
								};
								ReactDOM.unmountComponentAtNode(document.getElementById('react-storage'));
								window.storageElement = ReactDOM.render(
									React.createElement(ZoteroWebComponents.Storage, props),
									document.getElementById('react-storage')
								);
							},
							test2: function () {
								document.getElementById('react-storage').setInner
								console.log('test2');
								let props = { userSubscription: { userID: 10150, storageLevel: 2, quota: "2000", expirationDate: "1454741243", recur: 0, paymentType: "stripe", orderID: "ch_9qd2iqgmUkmRea", usage: { total: "2002.4", library: "1996.8", groups: { 2413: "1.6", 8908: "4" } }, discounted: false, discountEligible: false, institutions: [], hasExistingSubscription: false },
									storageGroups: { 2413: { properties: null, id: "2413", groupID: "2413", owner: 10150, type: "Private", name: "Test group", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "none", hasImage: 0, description: "", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "Test group", dateAdded: "2009-06-29T17:16:35Z", dateUpdated: "2014-03-18T19:28:14Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/2413" } }, alternate: { "text/html": { href: "http://zotero.org/groups/2413" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "Test group", owner: 10150, type: "Private", description: "", url: "", libraryEditing: "admins", libraryReading: "all", fileEditing: "none" }, ownerID: 10150, groupType: "Private", numItems: "18", members: [], admins: [10150], userReadable: false, userEditable: false }, 8908: { properties: null, id: "8908", groupID: "8908", owner: 10150, type: "PublicClosed", name: "owned group library", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "members", hasImage: 1, description: "<p>purple</p>", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "owned group library", dateAdded: "2009-12-14T07:04:24Z", dateUpdated: "2016-12-15T17:39:16Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/8908" } }, alternate: { "text/html": { href: "http://zotero.org/groups/8908" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "owned group library", owner: 10150, type: "PublicClosed", description: "<p>purple</p>", url: "", hasImage: 1, libraryEditing: "admins", libraryReading: "all", fileEditing: "members" }, ownerID: 10150, groupType: "PublicClosed", numItems: "12", members: [], admins: [10150], userReadable: false, userEditable: false } },
									stripeCustomer: { id: "cus_9qd2rB9PeTn0H0", deleted: true },
									operationPending: false,
									notificationClass: "",
									notification: "",
								};
								console.log(props);
								ReactDOM.unmountComponentAtNode(document.getElementById('react-storage'));
								window.storageElement = ReactDOM.render(
									React.createElement(ZoteroWebComponents.Storage, props),
									document.getElementById('react-storage')
								);
							},
							test3: function () {
								let props = {
									userSubscription: { userID: 10150, storageLevel: 2, quota: "2000", expirationDate: "1599569452", recur: 1, paymentType: "stripe", orderID: "ch_9qd2iqgmUkmRea", usage: { total: "500.4", library: "406.8", groups: { 2413: "1.6", 8908: "4" } }, discounted: false, discountEligible: false, institutions: [], hasExistingSubscription: true },
									storageGroups: { 2413: { properties: null, id: "2413", groupID: "2413", owner: 10150, type: "Private", name: "Test group", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "none", hasImage: 0, description: "", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "Test group", dateAdded: "2009-06-29T17:16:35Z", dateUpdated: "2014-03-18T19:28:14Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/2413" } }, alternate: { "text/html": { href: "http://zotero.org/groups/2413" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "Test group", owner: 10150, type: "Private", description: "", url: "", libraryEditing: "admins", libraryReading: "all", fileEditing: "none" }, ownerID: 10150, groupType: "Private", numItems: "18", members: [], admins: [10150], userReadable: false, userEditable: false }, 8908: { properties: null, id: "8908", groupID: "8908", owner: 10150, type: "PublicClosed", name: "owned group library", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "members", hasImage: 1, description: "<p>purple</p>", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "owned group library", dateAdded: "2009-12-14T07:04:24Z", dateUpdated: "2016-12-15T17:39:16Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/8908" } }, alternate: { "text/html": { href: "http://zotero.org/groups/8908" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "owned group library", owner: 10150, type: "PublicClosed", description: "<p>purple</p>", url: "", hasImage: 1, libraryEditing: "admins", libraryReading: "all", fileEditing: "members" }, ownerID: 10150, groupType: "PublicClosed", numItems: "12", members: [], admins: [10150], userReadable: false, userEditable: false } },
									stripeCustomer: { id: "cus_9qd2rB9PeTn0H0", deleted: true },
									operationPending: false,
									notificationClass: "",
									notification: "",
								};
								ReactDOM.unmountComponentAtNode(document.getElementById('react-storage'));
								window.storageElement = ReactDOM.render(
									React.createElement(ZoteroWebComponents.Storage, props),
									document.getElementById('react-storage')
								);
							},
							unused: function () {
								let props = {
									userSubscription: { userID: 10150, storageLevel: 1, quota: "300", expirationDate: 0, recur: false, paymentType: "", orderID: "", usage: { total: "55", library: "55", groups: {} }, discounted: false, discountEligible: false, institutions: [], hasExistingSubscription: false },
									storageGroups: {},
									stripeCustomer: false,
									operationPending: false,
									notificationClass: "",
									notification: "",
								};
								ReactDOM.unmountComponentAtNode(document.getElementById('react-storage'));
								window.storageElement = ReactDOM.render(
									React.createElement(ZoteroWebComponents.Storage, props),
									document.getElementById('react-storage')
								);
							},
							overQuota: function () {
								let props = {
									userSubscription: { userID: 10150, storageLevel: 2, quota: "2000", expirationDate: "1599569452", recur: 0, paymentType: "stripe", orderID: "ch_9qd2iqgmUkmRea", usage: { total: "2002.4", library: "1996.8", groups: { 2413: "1.6", 8908: "4" } }, discounted: false, discountEligible: false, institutions: [], hasExistingSubscription: false },
									storageGroups: { 2413: { properties: null, id: "2413", groupID: "2413", owner: 10150, type: "Private", name: "Test group", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "none", hasImage: 0, description: "", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "Test group", dateAdded: "2009-06-29T17:16:35Z", dateUpdated: "2014-03-18T19:28:14Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/2413" } }, alternate: { "text/html": { href: "http://zotero.org/groups/2413" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "Test group", owner: 10150, type: "Private", description: "", url: "", libraryEditing: "admins", libraryReading: "all", fileEditing: "none" }, ownerID: 10150, groupType: "Private", numItems: "18", members: [], admins: [10150], userReadable: false, userEditable: false }, 8908: { properties: null, id: "8908", groupID: "8908", owner: 10150, type: "PublicClosed", name: "owned group library", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "members", hasImage: 1, description: "<p>purple</p>", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "owned group library", dateAdded: "2009-12-14T07:04:24Z", dateUpdated: "2016-12-15T17:39:16Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/8908" } }, alternate: { "text/html": { href: "http://zotero.org/groups/8908" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "owned group library", owner: 10150, type: "PublicClosed", description: "<p>purple</p>", url: "", hasImage: 1, libraryEditing: "admins", libraryReading: "all", fileEditing: "members" }, ownerID: 10150, groupType: "PublicClosed", numItems: "12", members: [], admins: [10150], userReadable: false, userEditable: false } },
									stripeCustomer: { id: "cus_9qd2rB9PeTn0H0", deleted: true },
									operationPending: false,
									notificationClass: "",
									notification: "",
								};
								ReactDOM.unmountComponentAtNode(document.getElementById('react-storage'));
								
								window.storageElement = ReactDOM.render(
									React.createElement(ZoteroWebComponents.Storage, props),
									document.getElementById('react-storage')
								);
							},
							expiringSoon: function () {
								let props = {
									userSubscription: { userID: 10150, storageLevel: 3, quota: "6000", expirationDate: `${now + 150000}`, recur: 0, paymentType: "stripe", orderID: "ch_9qd2iqgmUkmRea", usage: { total: "2002.4", library: "1996.8", groups: { 2413: "1.6", 8908: "4" } }, discounted: false, discountEligible: false, institutions: [], hasExistingSubscription: false, planQuotas: { 1: 300, 2: 2000, 3: 6000, 4: 10000, 5: 25000, 6: 1000000 }, },
									storageGroups: { 2413: { properties: null, id: "2413", groupID: "2413", owner: 10150, type: "Private", name: "Test group", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "none", hasImage: 0, description: "", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "Test group", dateAdded: "2009-06-29T17:16:35Z", dateUpdated: "2014-03-18T19:28:14Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/2413" } }, alternate: { "text/html": { href: "http://zotero.org/groups/2413" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "Test group", owner: 10150, type: "Private", description: "", url: "", libraryEditing: "admins", libraryReading: "all", fileEditing: "none" }, ownerID: 10150, groupType: "Private", numItems: "18", members: [], admins: [10150], userReadable: false, userEditable: false }, 8908: { properties: null, id: "8908", groupID: "8908", owner: 10150, type: "PublicClosed", name: "owned group library", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "members", hasImage: 1, description: "<p>purple</p>", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "owned group library", dateAdded: "2009-12-14T07:04:24Z", dateUpdated: "2016-12-15T17:39:16Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/8908" } }, alternate: { "text/html": { href: "http://zotero.org/groups/8908" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "owned group library", owner: 10150, type: "PublicClosed", description: "<p>purple</p>", url: "", hasImage: 1, libraryEditing: "admins", libraryReading: "all", fileEditing: "members" }, ownerID: 10150, groupType: "PublicClosed", numItems: "12", members: [], admins: [10150], userReadable: false, userEditable: false } },
									stripeCustomer: { id: "cus_9qd2rB9PeTn0H0", deleted: true },
									operationPending: false,
									notificationClass: "",
									notification: ""
								};
								
								ReactDOM.unmountComponentAtNode(document.getElementById('react-storage'));
								window.storageElement = ReactDOM.render(
									React.createElement(ZoteroWebComponents.Storage, props),
									document.getElementById('react-storage')
								);
							},
							unlimited: function () {
								let props = {
									userSubscription: { userID: 10150, storageLevel: 6, quota: "1000000", expirationDate: `${now + 1500000}`, recur: 0, paymentType: "stripe", orderID: "ch_9qd2iqgmUkmRea", usage: { total: "2002.4", library: "1996.8", groups: { 2413: "1.6", 8908: "4" } }, discounted: false, discountEligible: false, institutions: [], hasExistingSubscription: false },
									storageGroups: { 2413: { properties: null, id: "2413", groupID: "2413", owner: 10150, type: "Private", name: "Test group", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "none", hasImage: 0, description: "", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "Test group", dateAdded: "2009-06-29T17:16:35Z", dateUpdated: "2014-03-18T19:28:14Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/2413" } }, alternate: { "text/html": { href: "http://zotero.org/groups/2413" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "Test group", owner: 10150, type: "Private", description: "", url: "", libraryEditing: "admins", libraryReading: "all", fileEditing: "none" }, ownerID: 10150, groupType: "Private", numItems: "18", members: [], admins: [10150], userReadable: false, userEditable: false }, 8908: { properties: null, id: "8908", groupID: "8908", owner: 10150, type: "PublicClosed", name: "owned group library", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "members", hasImage: 1, description: "<p>purple</p>", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "owned group library", dateAdded: "2009-12-14T07:04:24Z", dateUpdated: "2016-12-15T17:39:16Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/8908" } }, alternate: { "text/html": { href: "http://zotero.org/groups/8908" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "owned group library", owner: 10150, type: "PublicClosed", description: "<p>purple</p>", url: "", hasImage: 1, libraryEditing: "admins", libraryReading: "all", fileEditing: "members" }, ownerID: 10150, groupType: "PublicClosed", numItems: "12", members: [], admins: [10150], userReadable: false, userEditable: false } },
									stripeCustomer: { id: "cus_9qd2rB9PeTn0H0", deleted: true },
									operationPending: false,
									notificationClass: "",
									notification: ""
								};
								ReactDOM.unmountComponentAtNode(document.getElementById('react-storage'));								
								window.storageElement = ReactDOM.render(
									React.createElement(ZoteroWebComponents.Storage, props),
									document.getElementById('react-storage')
								);
							},
							autoRenew: function () {
								let props = { userSubscription: { userID: 10150, storageLevel: 3, quota: "6000", expirationDate: `${now + 150000}`, recur: 1, paymentType: "stripe", orderID: "ch_9qd2iqgmUkmRea", usage: { total: "2002.4", library: "1996.8", groups: { 2413: "1.6", 8908: "4" } }, discounted: false, discountEligible: false, institutions: [], hasExistingSubscription: false },
									storageGroups: { 2413: { properties: null, id: "2413", groupID: "2413", owner: 10150, type: "Private", name: "Test group", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "none", hasImage: 0, description: "", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "Test group", dateAdded: "2009-06-29T17:16:35Z", dateUpdated: "2014-03-18T19:28:14Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/2413" } }, alternate: { "text/html": { href: "http://zotero.org/groups/2413" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "Test group", owner: 10150, type: "Private", description: "", url: "", libraryEditing: "admins", libraryReading: "all", fileEditing: "none" }, ownerID: 10150, groupType: "Private", numItems: "18", members: [], admins: [10150], userReadable: false, userEditable: false }, 8908: { properties: null, id: "8908", groupID: "8908", owner: 10150, type: "PublicClosed", name: "owned group library", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "members", hasImage: 1, description: "<p>purple</p>", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "owned group library", dateAdded: "2009-12-14T07:04:24Z", dateUpdated: "2016-12-15T17:39:16Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/8908" } }, alternate: { "text/html": { href: "http://zotero.org/groups/8908" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "owned group library", owner: 10150, type: "PublicClosed", description: "<p>purple</p>", url: "", hasImage: 1, libraryEditing: "admins", libraryReading: "all", fileEditing: "members" }, ownerID: 10150, groupType: "PublicClosed", numItems: "12", members: [], admins: [10150], userReadable: false, userEditable: false } },
									stripeCustomer: { id: "cus_9vs2nvCwQF4AVg", object: "customer", account_balance: 0, created: 1484434018, currency: null, default_source: { id: "card_9vszSVqQiMGHZr", object: "card", address_city: "-", address_country: "United States", address_line1: "-", address_line1_check: "pass", address_line2: null, address_state: "VA", address_zip: "22030", address_zip_check: "pass", brand: "JCB", country: "JP", customer: "cus_9vs2nvCwQF4AVg", cvc_check: "pass", dynamic_last4: null, exp_month: 11, exp_year: 2019, fingerprint: "LTvqImi4NeRLtT3g", funding: "credit", last4: "0000", metadata: [], name: "Faolan", tokenization_method: null }, delinquent: false, description: "fcheslack", discount: null, email: "fcheslack@gmail.com", livemode: false, metadata: [], shipping: null, sources: { object: "list", data: [{ id: "card_9vszSVqQiMGHZr", object: "card", address_city: "Falls Church", address_country: "United States", address_line1: "Covewood", address_line1_check: "pass", address_line2: null, address_state: "VA", address_zip: "22042", address_zip_check: "pass", brand: "JCB", country: "JP", customer: "cus_9vs2nvCwQF4AVg", cvc_check: "pass", dynamic_last4: null, exp_month: 11, exp_year: 2019, fingerprint: "LTvqImi4NeRLtT3g", funding: "credit", last4: "0000", metadata: [], name: "Faolan", tokenization_method: null }], has_more: false, total_count: 1, url: "/v1/customers/cus_9vs2nvCwQF4AVg/sources" }, subscriptions: { object: "list", data: [], has_more: false, total_count: 0, url: "/v1/customers/cus_9vs2nvCwQF4AVg/subscriptions" } },
									operationPending: false,
									notificationClass: "",
									notification: ""
								};
								ReactDOM.unmountComponentAtNode(document.getElementById('react-storage'));
								
								window.storageElement = ReactDOM.render(
									React.createElement(ZoteroWebComponents.Storage, props),
									document.getElementById('react-storage')
								);
							},
							recurOnExpired: function () {
								let props = { userSubscription: { userID: 10150, storageLevel: 3, quota: "6000", expirationDate: `${now - 150000}`, recur: 1, paymentType: "stripe", orderID: "ch_9qd2iqgmUkmRea", usage: { total: "2002.4", library: "1996.8", groups: { 2413: "1.6", 8908: "4" } }, discounted: false, discountEligible: false, institutions: [], hasExistingSubscription: false },
									storageGroups: { 2413: { properties: null, id: "2413", groupID: "2413", owner: 10150, type: "Private", name: "Test group", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "none", hasImage: 0, description: "", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "Test group", dateAdded: "2009-06-29T17:16:35Z", dateUpdated: "2014-03-18T19:28:14Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/2413" } }, alternate: { "text/html": { href: "http://zotero.org/groups/2413" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "Test group", owner: 10150, type: "Private", description: "", url: "", libraryEditing: "admins", libraryReading: "all", fileEditing: "none" }, ownerID: 10150, groupType: "Private", numItems: "18", members: [], admins: [10150], userReadable: false, userEditable: false }, 8908: { properties: null, id: "8908", groupID: "8908", owner: 10150, type: "PublicClosed", name: "owned group library", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "members", hasImage: 1, description: "<p>purple</p>", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "owned group library", dateAdded: "2009-12-14T07:04:24Z", dateUpdated: "2016-12-15T17:39:16Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/8908" } }, alternate: { "text/html": { href: "http://zotero.org/groups/8908" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "owned group library", owner: 10150, type: "PublicClosed", description: "<p>purple</p>", url: "", hasImage: 1, libraryEditing: "admins", libraryReading: "all", fileEditing: "members" }, ownerID: 10150, groupType: "PublicClosed", numItems: "12", members: [], admins: [10150], userReadable: false, userEditable: false } },
									stripeCustomer: { id: "cus_9vs2nvCwQF4AVg", object: "customer", account_balance: 0, created: 1484434018, currency: null, default_source: { id: "card_9vszSVqQiMGHZr", object: "card", address_city: "-", address_country: "United States", address_line1: "-", address_line1_check: "pass", address_line2: null, address_state: "VA", address_zip: "22030", address_zip_check: "pass", brand: "JCB", country: "JP", customer: "cus_9vs2nvCwQF4AVg", cvc_check: "pass", dynamic_last4: null, exp_month: 11, exp_year: 2019, fingerprint: "LTvqImi4NeRLtT3g", funding: "credit", last4: "0000", metadata: [], name: "Faolan", tokenization_method: null }, delinquent: false, description: "fcheslack", discount: null, email: "fcheslack@gmail.com", livemode: false, metadata: [], shipping: null, sources: { object: "list", data: [{ id: "card_9vszSVqQiMGHZr", object: "card", address_city: "Falls Church", address_country: "United States", address_line1: "Covewood", address_line1_check: "pass", address_line2: null, address_state: "VA", address_zip: "22042", address_zip_check: "pass", brand: "JCB", country: "JP", customer: "cus_9vs2nvCwQF4AVg", cvc_check: "pass", dynamic_last4: null, exp_month: 11, exp_year: 2019, fingerprint: "LTvqImi4NeRLtT3g", funding: "credit", last4: "0000", metadata: [], name: "Faolan", tokenization_method: null }], has_more: false, total_count: 1, url: "/v1/customers/cus_9vs2nvCwQF4AVg/sources" }, subscriptions: { object: "list", data: [], has_more: false, total_count: 0, url: "/v1/customers/cus_9vs2nvCwQF4AVg/subscriptions" } },
									operationPending: false,
									notificationClass: "",
									notification: ""
								};
								ReactDOM.unmountComponentAtNode(document.getElementById('react-storage'));
								
								window.storageElement = ReactDOM.render(
									React.createElement(ZoteroWebComponents.Storage, props),
									document.getElementById('react-storage')
								);
							},
							expired: function () {
								let props = { userSubscription: { userID: 10150, storageLevel: 3, quota: "6000", expirationDate: `${now - 150000}`, recur: 0, paymentType: "stripe", orderID: "ch_9qd2iqgmUkmRea", usage: { total: "2002.4", library: "1996.8", groups: { 2413: "1.6", 8908: "4" } }, discounted: false, discountEligible: false, institutions: [], hasExistingSubscription: false },
									storageGroups: { 2413: { properties: null, id: "2413", groupID: "2413", owner: 10150, type: "Private", name: "Test group", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "none", hasImage: 0, description: "", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "Test group", dateAdded: "2009-06-29T17:16:35Z", dateUpdated: "2014-03-18T19:28:14Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/2413" } }, alternate: { "text/html": { href: "http://zotero.org/groups/2413" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "Test group", owner: 10150, type: "Private", description: "", url: "", libraryEditing: "admins", libraryReading: "all", fileEditing: "none" }, ownerID: 10150, groupType: "Private", numItems: "18", members: [], admins: [10150], userReadable: false, userEditable: false }, 8908: { properties: null, id: "8908", groupID: "8908", owner: 10150, type: "PublicClosed", name: "owned group library", libraryEnabled: null, libraryEditing: "admins", libraryReading: "all", fileEditing: "members", hasImage: 1, description: "<p>purple</p>", disciplines: null, enableComments: null, url: "", adminIDs: [10150], memberIDs: [], title: "owned group library", dateAdded: "2009-12-14T07:04:24Z", dateUpdated: "2016-12-15T17:39:16Z", links: { self: { "application/atom+xml": { href: "https://api.zotero.org/groups/8908" } }, alternate: { "text/html": { href: "http://zotero.org/groups/8908" } } }, author: { name: "fcheslack", uri: "http://zotero.org/users/10150" }, contentArray: [], entries: [], apiObject: { name: "owned group library", owner: 10150, type: "PublicClosed", description: "<p>purple</p>", url: "", hasImage: 1, libraryEditing: "admins", libraryReading: "all", fileEditing: "members" }, ownerID: 10150, groupType: "PublicClosed", numItems: "12", members: [], admins: [10150], userReadable: false, userEditable: false } },
									stripeCustomer: { id: "cus_9vs2nvCwQF4AVg", object: "customer", account_balance: 0, created: 1484434018, currency: null, default_source: { id: "card_9vszSVqQiMGHZr", object: "card", address_city: "-", address_country: "United States", address_line1: "-", address_line1_check: "pass", address_line2: null, address_state: "VA", address_zip: "22030", address_zip_check: "pass", brand: "JCB", country: "JP", customer: "cus_9vs2nvCwQF4AVg", cvc_check: "pass", dynamic_last4: null, exp_month: 11, exp_year: 2019, fingerprint: "LTvqImi4NeRLtT3g", funding: "credit", last4: "0000", metadata: [], name: "Faolan", tokenization_method: null }, delinquent: false, description: "fcheslack", discount: null, email: "fcheslack@gmail.com", livemode: false, metadata: [], shipping: null, sources: { object: "list", data: [{ id: "card_9vszSVqQiMGHZr", object: "card", address_city: "Falls Church", address_country: "United States", address_line1: "Covewood", address_line1_check: "pass", address_line2: null, address_state: "VA", address_zip: "22042", address_zip_check: "pass", brand: "JCB", country: "JP", customer: "cus_9vs2nvCwQF4AVg", cvc_check: "pass", dynamic_last4: null, exp_month: 11, exp_year: 2019, fingerprint: "LTvqImi4NeRLtT3g", funding: "credit", last4: "0000", metadata: [], name: "Faolan", tokenization_method: null }], has_more: false, total_count: 1, url: "/v1/customers/cus_9vs2nvCwQF4AVg/sources" }, subscriptions: { object: "list", data: [], has_more: false, total_count: 0, url: "/v1/customers/cus_9vs2nvCwQF4AVg/subscriptions" } },
									operationPending: false,
									notificationClass: "",
									notification: "" };
								window.storageElement = ReactDOM.render(
									React.createElement(ZoteroWebComponents.Storage, props),
									document.getElementById('react-storage')
								);
							}
						};

						let testCase = tests['test1'];
						if(window.location.hash.length > 0){
							let testLabel = window.location.hash.substr(1);
							testCase = tests[testLabel];
						}
						testCase();

						ZoteroWebComponents.cycleTestFuncs(tests);
					});

				</script>
			</div>
		</div>
	</div>
</main>
<? include('./layoutFooter.php')?>