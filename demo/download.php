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
	<!-- Output the breadcrumb if it's set -->
	<div class="container">
		<nav aria-label="breadcrumb" role="navigation">
			<ol class="breadcrumb">
				<li class="breadcrumb-item"><a href="/">Home</a></li>
				<li class="breadcrumb-item active" aria-current="page">Downloads</li>
			</ol>
		</nav>
	</div>

	<!-- hidden area for possible JS messages -->
	<div id="js-message">
		<ul id="js-message-list">
		</ul>
	</div>

	<div id='react-download' class='react'></div>

	<script type="text/javascript" charset="utf-8">
		ZoteroWebComponents.pageReady(function() {
			window.downloadElement = ReactDOM.render(
				React.createElement(ZoteroWebComponents.Downloads, null),
				document.getElementById('react-download')
			);

			let tests = {
				test1: function(){
					window.downloadElement.setState({
						featuredOS:'Mac',
						featuredBrowser:'Safari',
						arch:'x86_64',
						oldMac:false
					});
				},
				test2: function(){
					window.downloadElement.setState({
						featuredOS:'Windows',
						featuredBrowser:'Chrome',
						arch:'x86_64'
					});
				},
				test3: function(){
					window.downloadElement.setState({
						featuredOS:'Windows',
						featuredBrowser:'Edge',
						arch:'x86_64'
					});
				},
				test4: function(){
					window.downloadElement.setState({
						featuredOS:'Linux',
						featuredBrowser:'Firefox',
						arch:'x86_64'
					});
				},
				test5: function(){
					window.downloadElement.setState({
						featuredOS:'Windows',
						featuredBrowser:'Opera',
						arch:'x86_64'
					});
				},
				test6: function(){
					window.downloadElement.setState({
						featuredOS:'Mac',
						featuredBrowser:'Firefox',
						arch:'x86_64'
					});
				},
				test7: function(){
					window.downloadElement.setState({
						featuredOS:'Linux',
						featuredBrowser:'Firefox',
						arch:'i686'
					});
				},
				test8: function(){
					window.downloadElement.setState({
						featuredOS:'',
						featuredBrowser:'Edge',
						arch:'i686'
					});
				},
				test9: function(){
					window.downloadElement.setState({
						featuredOS:'',
						featuredBrowser:'Safari',
						arch:'x86_64',
						oldMac:false,
						mobile:true
					});
				},
				test10: function(){
					window.downloadElement.setState({
						featuredOS:'Mac',
						featuredBrowser:'Safari',
						arch:'x86_64',
						oldMac:true
					});
				},
				test11: function(){
					window.downloadElement.refs.downloadConnector.setState({
						featuredBrowser:'Safari',
						oldSafari:true
					});
				},
				test12: function(){
					window.downloadElement.setState({
						featuredOS:'Mac',
						featuredBrowser:'Firefox',
						arch:'x86_64'
					});
					window.downloadElement.refs.downloadConnector.setState({
						featuredBrowser:'Firefox',
						oldSafari:false,
						firefox45:true
					});
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

</main>
<? include('./layoutFooter.php')?>
