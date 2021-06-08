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
$group = $testData['group_370'];
$useTinyMce = false;

$applied = [
	$testData['testUser2'],
	$testData['testUser3']
]
?>
<? include('./layoutHeader.php');?>
<main>
	<section class='section section-md'>
		<div class='container'>
			<h1>Group Settings: <a href="/demo/viewgroup.php"><?=$group->name?></a></h1>
			<div class='row'>
				<div class='col-md-2'>
					<? $selectedTab = 'members'; ?>
					<? include('./partials/groupSettingsTabs.php');?>
				</div>
				<div class='col-md-8 offset-md-1 settings-form'>
					<!-- Current Members Section -->
					<div id='member-settings-container'></div>
					
					<p class='mb-5'>
						<a href="/demo/groupinvite.php">Send More Invitations</a>
					</p>
				</div>
			</div>
		</div>
	</section>
</main>

<script type="text/javascript" charset="utf-8">
	let zoterojsSearchContext = "group";
	
	// let props = {"members":[{"userID":23869,"username":"testUser1","dateRegistered":"2018-03-12 17:23:43","hasImage":false,"slug":"testuser1","displayName":"Test User","meta":{"privacy":{"publishLibrary":0,"publishNotes":0,"hideFromSearchEngines":0},"profile":{"bio":"<p>I am a test user that does things at George Mason University.<\/p>","orcid":"","location":"Fairfax, VA","disciplines":"","affiliation":"George Mason University","realname":"Test User","website":"","academic":"","education":"[{\"start_month\":\"January\",\"start_year\":\"2000\",\"degree_name\":\"BSE\",\"end_month\":\"January\",\"end_year\":\"2004\",\"institution\":\"George Mason University\",\"present\":false,\"id\":1},{\"start_month\":\"September\",\"start_year\":\"2004\",\"degree_name\":\"MS\",\"end_month\":\"June\",\"end_year\":\"2005\",\"institution\":\"University of Michigan\",\"present\":false,\"id\":171}]","experience":"[{\"start_month\":\"January\",\"start_year\":\"2004\",\"position_name\":\"First Job\",\"end_month\":\"January\",\"end_year\":\"2006\",\"institution\":\"Employer\",\"present\":false,\"id\":1},{\"start_month\":\"January\",\"start_year\":\"2006\",\"position_name\":\"Second Job\",\"end_month\":\"January\",\"end_year\":\"2009\",\"institution\":\"Second Employer\",\"present\":false,\"id\":2},{\"start_month\":\"January\",\"start_year\":\"2009\",\"position_name\":\"Current Job\",\"end_month\":\"January\",\"end_year\":\"\",\"institution\":\"Current Employer\",\"present\":true,\"id\":3}]","interests":"[{\"interest\":\"Science\",\"id\":1},{\"interest\":\"Humanities\",\"id\":2}]","social":"[{\"name\":\"ORCID\",\"value\":\"123456\",\"id\":1},{\"name\":\"Twitter\",\"value\":\"testuser\",\"id\":2},{\"name\":\"Mendeley\",\"value\":\"testuser\",\"id\":3},{\"name\":\"Facebook\",\"value\":\"testuser\",\"id\":4}]","title":""}}},{"userID":23870,"username":"testUser2","dateRegistered":"2018-03-12 17:30:53","hasImage":false,"slug":"testuser2","displayName":"Faolan C-P","meta":{"privacy":{"publishLibrary":0,"publishNotes":0,"hideFromSearchEngines":0},"profile":{"bio":"<p>something about me.<\/p>","orcid":"0000-0003-3817-0737","location":"yet somewhere else","disciplines":"","affiliation":"George Mason University","realname":"Faolan C-P","website":""}}}],"group":{"id":370,"version":2,"links":{"self":{"href":"https:\/\/apidev.zotero.org\/groups\/370","type":"application\/json"},"alternate":{"href":"https:\/\/staging.zotero.net\/groups\/370","type":"text\/html"}},"meta":{"created":"2020-03-26T02:28:48Z","lastModified":"2020-06-11T17:31:27Z","numItems":0},"data":{"id":370,"version":2,"name":"disposable","owner":23869,"type":"Private","description":"","url":"","libraryEditing":"members","libraryReading":"members","fileEditing":"members","members":[23870]}},"invitations":[],"applications":[],"displayNames":{"displayName":{"23869":"Test User","23870":"Faolan C-P"},"slug":{"23869":"testuser1","23870":"testuser2"}}};
	// let props = {"members":[{"userID":23869,"username":"testUser1","dateRegistered":"2018-03-12 17:23:43","hasImage":false,"slug":"testuser1","displayName":"Test User","meta":{"profile":{"realname":"Test User"}}}, {"userID":10150,"username":"fcheslack","dateRegistered":"2018-03-12 17:23:43","hasImage":false,"slug":"fcheslack","displayName":"Faolan Cheslack-Postava","meta":{"profile":{"realname":"Faolan Cheslack-Postava"}}}],"group":{"id":325,"version":2,"links":{"self":{"href":"https:\/\/apidev.zotero.org\/groups\/325","type":"application\/json"},"alternate":{"href":"https:\/\/staging.zotero.net\/groups\/llamas","type":"text\/html"}},"meta":{"created":"2018-07-26T14:30:35Z","lastModified":"2020-10-08T18:40:29Z","numItems":3},"data":{"id":325,"version":2,"members":[10150],"name":"Llamas","owner":23869,"type":"PublicClosed","description":"","url":"","libraryEditing":"members","libraryReading":"members","fileEditing":"members"}},"invitations":[{"groupID":"325","userID":"23870","email":null,"token":"f2454d850ba00bac0c9dab38cda31379","invitation":"1","hasImage":"0","dateSent":"2021-06-08 15:31:09","username":"testUser2","slug":"testuser2"}],"applications":[{"groupID":"325","userID":"23872","email":null,"token":"20d4a97f6cbdee2ee9b854267e278dc8","invitation":"0","hasImage":"0","dateSent":"2021-06-08 18:15:18","username":"testUserAdmin","slug":"testuseradmin"}],"displayNames":{"displayName":{"23869":"Test User","23870":"Faolan C-P","23872":"testUserAdmin"},"slug":{"23869":"testuser1","23870":"testuser2","23872":"testuseradmin"}}};
	let props = {"members":[{"userID":23869,"username":"testUser1","dateRegistered":"2018-03-12 17:23:43","hasImage":false,"slug":"testuser1","displayName":"Test User","meta":{"profile":{"realname":"Test User"}}}, {"userID":10150,"username":"fcheslack","dateRegistered":"2018-03-12 17:23:43","hasImage":false,"slug":"fcheslack","displayName":"Faolan Cheslack-Postava","meta":{"profile":{"realname":"Faolan Cheslack-Postava"}}}],"group":{"id":325,"version":2,"links":{"self":{"href":"https:\/\/apidev.zotero.org\/groups\/325","type":"application\/json"},"alternate":{"href":"https:\/\/staging.zotero.net\/groups\/llamas","type":"text\/html"}},"meta":{"created":"2018-07-26T14:30:35Z","lastModified":"2020-10-08T18:40:29Z","numItems":3},"data":{"id":325,"version":2,"members":[10150],"name":"Llamas","owner":23869,"type":"PublicClosed","description":"","url":"","libraryEditing":"members","libraryReading":"members","fileEditing":"members"}},"invitations":[{"groupID":"370","userID":null,"email":"testuser@example.com","token":"2896a89ce01c9e57923e0bc4a3ca1d20","invitation":"1","hasImage":"0","dateSent":"2021-06-08 18:47:04","username":null,"slug":null},{"groupID":"370","userID":"23871","email":null,"token":"7d661a449ecca1369087b9b42bd68c1f","invitation":"1","hasImage":"0","dateSent":"2021-06-08 18:07:26","username":"testUser3","slug":"testuser3"}],"applications":[{"groupID":"325","userID":"23872","email":null,"token":"20d4a97f6cbdee2ee9b854267e278dc8","invitation":"0","hasImage":"0","dateSent":"2021-06-08 18:15:18","username":"testUserAdmin","slug":"testuseradmin"}],"displayNames":{"displayName":{"23869":"Test User","23870":"Faolan C-P","23872":"testUserAdmin"},"slug":{"23869":"testuser1","23870":"testuser2","23872":"testuseradmin"}}};
	
	ZoteroWebComponents.pageReady(function() {
		if(document.getElementById('member-settings-container')) {
			window.memberSettingsComponent = ReactDOM.render(
				React.createElement(ZoteroWebComponents.MemberSettingsContainer, props),
				document.getElementById('member-settings-container')
			);
		}
	});
	
	
</script>

<? include('./layoutFooter.php')?>