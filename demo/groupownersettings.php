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
?>
<? include('./layoutHeader.php');?>
<main>
	<section class='section section-md'>
		<div class='container'>
			<h1>Group Settings: <a href="/demo/viewgroup.php"><?=$group->name?></a></h1>
			<div class='row'>
				<div class='col-md-2'>
				<? $selectedTab = 'owner'; ?>
				<? include('./partials/groupSettingsTabs.php');?>
				</div>
				<div class='col-md-8 offset-md-1 settings-form'>
					<div id='react-transferOwnership'></div>
					<!-- allow user to delete group if they own it -->
					<form id="deleteForm" enctype="application/x-www-form-urlencoded" action="/groups/370/delete" accept-charset="utf-8" method="post" class="zform">
						<div class="form-group">
							<button name="confirm_delete" id="confirm_delete" type="submit" class="btn btn-secondary">Delete Group</button>
						</div>
					</form>
					<!-- Ownership Section -->
				</div>
			</div>
		</div>
	</section>
</main>

<script type="text/javascript" charset="utf-8">
	var zoterojsClass = "group_owner_settings";
	var zoterojsSearchContext = "group";

	let props = {"group":{"id":370,"version":2,"links":{"self":{"href":"https:\/\/apidev.zotero.org\/groups\/370","type":"application\/json"},"alternate":{"href":"https:\/\/staging.zotero.net\/groups\/370","type":"text\/html"}},"meta":{"created":"2020-03-26T02:28:48Z","lastModified":"2020-06-11T17:31:27Z","numItems":0},"data":{"id":370,"version":2,"name":"disposable","owner":23869,"type":"Private","description":"","url":"","libraryEditing":"members","libraryReading":"members","fileEditing":"members","members":[23870]}},"displayNames":{"23869":"Test User","23870":"Faolan C-P"},"pendingOwner":null};

	ZoteroWebComponents.pageReady(function() {
		if(document.getElementById('react-transferOwnership')) {
			window.transferOwnershipComponent = ReactDOM.render(
				React.createElement(ZoteroWebComponents.TransferOwnership, props),
				document.getElementById('react-transferOwnership')
			);
		}
	});
</script>

<? include('./layoutFooter.php')?>