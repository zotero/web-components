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
<main>
	<section class='section section-md'>
		<div class='container'>
			<div class='row'>
				<? $selectedTab = 'keys';
				include('./partials/settingsTabs.php');?>
				<div class='col-lg-9 offset-lg-1 settings-form'>
					Your userID for use in API calls is 12345<br />
					<a href="/settings/keys/new">Create new private key</a>
					<table id="api-keys-table" class="table table-striped">
						<tbody>
							<tr>
								<th>Name</th>
								<th>Last Used</th>
								<th>Last Used IPs</th>
								<th>Edit Key</th>
								<th>Delete Key</th>
							</tr>
						<tr class="pk_row" id="KKtI1">
								<!--Name-->
								<td>zotero.org Website Key</td>
								<!--Last Used Datetime-->
								<td>2 months ago</td>
								<!--Last Used IPs-->
								<td>55.555.55.555 (Newark, NJ, United States)<br>555.55.555.55 (London, England, United Kingdom)<br>55.555.55.555 (Newark, NJ, United States)<br>55.555.55.555 (Newark, NJ, United States)<br>55.555.55.555 (Newark, NJ, United States)</td>
								<!--Edit Key Link-->
								<td><a href="/settings/keys/edit/KKtI1">Edit Key</a></td>
								<!--Delete Key Link-->
								<td><a href="/settings/keys/delete/KKtI1">Delete Key</a></td>
							</tr>
							<tr class="pk_row" id="6vDCmV">
								<!--Name-->
								<td>zotero.org Website Key</td>
								<!--Last Used Datetime-->
								<td>11 months ago</td>
								<!--Last Used IPs-->
								<td>55.555.55.555 (Newark, NJ, United States)</td>
								<!--Edit Key Link-->
								<td><a href="/settings/keys/edit/6vDCmVO9y">Edit Key</a></td>
								<!--Delete Key Link-->
								<td><a href="/settings/keys/delete/6vDCmVO">Delete Key</a></td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</section>
</main>

<script type="text/javascript" charset="utf-8">
	var zoterojsClass = "settings_account";
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