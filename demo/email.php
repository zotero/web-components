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
<main>
	<section class='section section-md'>
		<div class='container'>
			<div class='row'>
				<? $selectedTab = 'notifications';
				include('./partials/settingsTabs.php');?>
				<div class='col-lg-8 offset-lg-1 settings-form'>
					<p>Note that emails will only be sent to your primary email address indicated in your <a href='/settings/account'>account settings</a>.</p>
					<p><strong>Email me when:</strong></p>
					<form enctype="application/x-www-form-urlencoded" accept-charset="utf-8" method="post" class="zform" action="">
						<div class="form-group">
							<input type="hidden" name="email_groupmessage" value="0"><input type="checkbox" name="email_groupmessage" id="email_groupmessage" value="1" class="checkbox">
							<label for="email_groupmessage" class="optional">new post in group discussion</label></div>
							<div class="form-group">
							<input type="hidden" name="email_invitation" value="0"><input type="checkbox" name="email_invitation" id="email_invitation" value="1" checked="checked" class="checkbox">
							<label for="email_invitation" class="optional">someone invites me to a group</label></div>
							<div class="form-group">
							<input type="hidden" name="email_application" value="0"><input type="checkbox" name="email_application" id="email_application" value="1" checked="checked" class="checkbox">
							<label for="email_application" class="optional">someone applies to a group I own</label></div>
							<div class="form-group">
							<button name="submit" id="submit" type="submit" class="btn btn-secondary">Update Settings</button>
						</div>
					</form>
					<p>For notification settings involving private messages or Zotero forum discussions, <a href='/'>update your forum notification settings</a>.</p>
				</div>
			</div>
		</div>
	</section>
</main>

<script type="text/javascript" charset="utf-8">
	var zoterojsClass = "settings_notifications";
	ZoteroWebComponents.pageReady(function () {
		let tests = {
			test1: function () {
				console.log('test1');
			},
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

<? include('./layoutFooter.php')?>