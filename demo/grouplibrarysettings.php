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
					<? $selectedTab = 'library'; ?>
					<? include('./partials/groupSettingsTabs.php');?>
				</div>
				<div class='col-md-8 offset-md-1 settings-form'>
					<div id='react-librarysettings'><? include('./partials/noscript.php');?></div>
				</div>
			</div>
		</div>
	</section>
</main>

<script type="text/javascript" charset="utf-8">
	var zoterojsClass = "group_library_settings";
	var zoterojsSearchContext = "group";

	ZoteroWebComponents.pageReady(function() {
		if(document.getElementById('react-librarysettings')) {
			window.librarySettingsComponent = ReactDOM.render(
				React.createElement(ZoteroWebComponents.GroupLibrarySettings, <?=json_encode([
					'groupID' => $group->groupID,
					'type' => $group->type,
					'libraryReading' => $group->libraryReading,
					'libraryEditing' => $group->libraryEditing,
					'fileEditing' => $group->fileEditing
				]);?>),
				document.getElementById('react-librarysettings')
			);
		}
	});
</script>

<? include('./layoutFooter.php')?>