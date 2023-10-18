<?
$bodyClass = '';

$testData = include('./testdata.php');
$user = null;
if($username = $_GET['user'] ?? false){
	// $username = $_GET['user'];
	if(isset($testData[$username])){
		$user = $testData[$username];
	}
}
?>
<script type="text/javascript" charset="utf-8">
	window.zoteroData = {currentUser: {
		"userID": 23870,
		"slug": "testuser2",
		"username": "testUser2"
	}};

</script>
<? include('./layoutHeader.php');?>
<main>
	<!-- Output the breadcrumb if it's set -->
	<div class="container">
		<!-- Output content -->
		<div id='react-groups-container'></div>
	</div>

		<script type="text/javascript" charset="utf-8">
			ZoteroWebComponents.pageReady(function() {
				window.userGroupsComponent = ReactDOM.createRoot(
					document.getElementById('react-groups-container'),
					{identifierPrefix: 'GroupsPageContainer'}
				);

				let testDataProps = {
					"dataNeeded": false,
					"userID": 23870,
					"groups": [
						{
						"id": 370,
						"version": 2,
						"links": {
							"self": {
							"href": "https://apidev.zotero.org/groups/370",
							"type": "application/json"
							},
							"alternate": {
							"href": "https://staging.zotero.net/groups/370",
							"type": "text/html"
							}
						},
						"meta": {
							"created": "2020-03-26T02:28:48Z",
							"lastModified": "2020-06-11T17:31:27Z",
							"numItems": 0
						},
						"data": {
							"id": 370,
							"version": 2,
							"name": "disposable",
							"owner": 23869,
							"type": "Private",
							"description": "",
							"url": "",
							"libraryEditing": "members",
							"libraryReading": "members",
							"fileEditing": "members",
							"members": [
							23870
							]
						}
						},
						{
						"id": 326,
						"version": 21,
						"links": {
							"self": {
							"href": "https://apidev.zotero.org/groups/326",
							"type": "application/json"
							},
							"alternate": {
							"href": "https://staging.zotero.net/groups/326",
							"type": "text/html"
							}
						},
						"meta": {
							"created": "2018-07-26T14:30:47Z",
							"lastModified": "2020-03-16T20:01:00Z",
							"numItems": 1
						},
						"data": {
							"id": 326,
							"version": 21,
							"name": "Goats",
							"owner": 23869,
							"type": "Private",
							"description": "<p><strong>Group Description <em>With italics</em></strong> <a title=\"zotero\" href=\"http://zotero.org\" rel=\"nofollow\">zotero.org</a><br /></p>",
							"url": "",
							"libraryEditing": "admins",
							"libraryReading": "members",
							"fileEditing": "members",
							"members": [
							23870
							]
						}
						},
						{
						"id": 383,
						"version": 4,
						"links": {
							"self": {
							"href": "https://apidev.zotero.org/groups/383",
							"type": "application/json"
							},
							"alternate": {
							"href": "https://staging.zotero.net/groups/private_llamas",
							"type": "text/html"
							}
						},
						"meta": {
							"created": "2020-06-17T20:38:14Z",
							"lastModified": "2020-06-17T20:40:43Z",
							"numItems": 0
						},
						"data": {
							"id": 383,
							"version": 4,
							"name": "Private Llamas",
							"owner": 23870,
							"type": "PublicClosed",
							"description": "",
							"url": "",
							"libraryEditing": "members",
							"libraryReading": "members",
							"fileEditing": "members"
						}
						},
						{
						"id": 382,
						"version": 2,
						"links": {
							"self": {
							"href": "https://apidev.zotero.org/groups/382",
							"type": "application/json"
							},
							"alternate": {
							"href": "https://staging.zotero.net/groups/382",
							"type": "text/html"
							}
						},
						"meta": {
							"created": "2020-06-17T20:38:01Z",
							"lastModified": "2023-06-28T20:08:11Z",
							"numItems": 0
						},
						"data": {
							"id": 382,
							"version": 2,
							"name": "一次性组",
							"owner": 23870,
							"type": "Private",
							"description": "",
							"url": "",
							"libraryEditing": "members",
							"libraryReading": "members",
							"fileEditing": "members"
						}
						}
					],
					"totalResults": 4,
					"groupsLoaded": true,
					"loading": false
				};

				// window.userGroupsComponent.render(React.createElement(ZoteroWebComponents.GroupsPageContainer, testDataProps));

				let tests = {
					test1: function(){
						let test1Data = Object.assign({}, testDataProps);
						window.userGroupsComponent.render(React.createElement(ZoteroWebComponents.GroupsPageContainer, test1Data));
					},
					test2: function() {
						let test2Data = Object.assign({}, testDataProps, {totalResults: 40});
						window.userGroupsComponent.render(React.createElement(ZoteroWebComponents.GroupsPageContainer, test2Data));
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
</main>
<? include('./layoutFooter.php')?>