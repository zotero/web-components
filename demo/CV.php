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
				<? $selectedTab = 'account';
				include('./partials/settingsTabs.php');?>
				<div class='col-lg-9 offset-lg-1 settings-form'>
					<div id='react-usernamechange'></div>

					<form enctype="application/x-www-form-urlencoded" accept-charset="utf-8" method="post" class="zform" action="">
						<div class="form-group"><label for="password" class="optional">Current Password</label>

							<input type="password" name="password" id="password" value="" class="form-control"></div>
							<div class="form-group"><label for="new_password" class="optional">New Password</label>

							<input type="password" name="new_password" id="new_password" value="" class="form-control"></div>
							<div class="form-group"><label for="new_password2" class="optional">Verify New Password</label>

							<input type="password" name="new_password2" id="new_password2" value="" class="form-control"></div>
							<div class="form-group">
							<button name="updatesettings" id="updatesettings" type="submit" value="update_password" class="btn btn-secondary">Change Password</button>
						</div>
					</form>

					<div class="user-emails">
						<p>You can log in using either your username or your primary email address. All account communications will go to your primary email address. You can reset your Zotero password using any verified email address.</p>
						<div id='react-manageemails'></div>
					</div>

					<div class="deleteaccount" style="margin-top:65px; padding:8px; border-top:2px solid rgb(119, 119, 119);">
						<a href="/settings/deleteaccount">Permanently Delete Account</a>
					</div>
				</div>
			</div>
		</div>
	</section>
</main>

<script type="text/javascript" charset="utf-8">
	var zoterojsClass = "settings_account";
	ZoteroWebComponents.pageReady(function () {
		console.log('pageReady');
		let tests = {
			test1: function () {
				console.log('test1');
				let usernamechangeProps = {
					forumUsername: 'testUser1',
					username: 'testUser1',
				};
				let emailProps = {
					emails: [{"emailID":"23613","email":"testUser1@example.com","validated":"1"}],
					primaryEmail: 'testUser@example.com',
					userValidated: true,
				};
				
				ReactDOM.unmountComponentAtNode(document.getElementById('react-usernamechange'));
				ReactDOM.unmountComponentAtNode(document.getElementById('react-manageemails'));

				window.changeUsernameComponent = ReactDOM.render(
					React.createElement(ZoteroWebComponents.ChangeUsername, usernamechangeProps),
					document.getElementById('react-usernamechange')
				);

				window.EmailManagerComponent = ReactDOM.render(
					React.createElement(ZoteroWebComponents.ManageEmails, emailProps),
					document.getElementById('react-manageemails')
				);
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