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
				<? $selectedTab = 'privacy';
				include('./partials/settingsTabs.php');?>
				<div class='col-lg-8 offset-lg-1 settings-form'>
					<form enctype="application/x-www-form-urlencoded" accept-charset="utf-8" method="post" class="zform" action="">
						<div class="form-group">
							<input type="hidden" name="privacy_publishLibrary" value="0"><input type="checkbox" name="privacy_publishLibrary" id="privacy_publishLibrary" value="1" class="checkbox">
							<label for="privacy_publishLibrary" class="optional">Publish entire library</label>
							<p class="hint text-muted small">This will make all items in your library viewable by anyone visiting zotero.org. Your notes will not be viewable unless you select the option below.</p></div>
							<div class="form-group">
							<input type="hidden" name="privacy_publishNotes" value="0"><input type="checkbox" name="privacy_publishNotes" id="privacy_publishNotes" value="1" class="checkbox">
							<label for="privacy_publishNotes" class="optional">Publish notes</label>
							<p class="hint text-muted small">This will make all notes in your library viewable by anyone visiting zotero.org. Be very sure you want to do this.</p></div>
							<div class="form-group">
							<input type="hidden" name="privacy_hideFromSearchEngines" value="0"><input type="checkbox" name="privacy_hideFromSearchEngines" id="privacy_hideFromSearchEngines" value="1" class="checkbox">
							<label for="privacy_hideFromSearchEngines" class="optional">Hide from search engines</label>
							<p class="hint text-muted small">We will tell search engines not to index your zotero.org profile page.</p></div>
							<div class="form-group">
							<button name="submit_privacy" id="submit_privacy" type="submit" class="btn btn-secondary">Update Settings</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</section>
</main>

<script type="text/javascript" charset="utf-8">
	var zoterojsClass = "settings_privacy";
	ZoteroWebComponents.pageReady(function () {
		let tests = {
			test1: function () {
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