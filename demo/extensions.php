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

	<!-- Output content -->
	<!-- Extensions page -->
	<div class='extensions react'>
		<div id='extensions-picker'></div>

		<section class="features features-1">
			<div class="container">
				<h2>One button does it all</h2>
				<p class="lead">
					<span class="line">Save references, PDFs, and webpage snapshots to Zotero</span>
					<span class="line">as you browse the web.</span>
				</p>
				<picture>
				  <source srcset="../assets/images/extensions/screenshot-1@2x.jpg" media="(min-width: 768px) and (min-device-pixel-ratio: 2)">
				  <source srcset="../assets/images/extensions/screenshot-1@2x.jpg" media="(min-width: 768px) and (min-resolution: 192dpi)">
				  <source srcset="../assets/images/extensions/screenshot-1@2x.jpg" media="(min-width: 768px) and (min-resolution: 2dppx)">
				  <source srcset="../assets/images/extensions/screenshot-1.jpg" media="(min-width: 768px)">
				  <img class="magnifier" src="../assets/images/extensions/magnifier.svg" alt="Zotero Connector button">
				</picture>
				<div class="row compact clearfix">
					<div class="col-4">
						<h3>Zotero Connector</h3>
						<p>Built right into your browser, save any website with a single click.</p>
					</div>
					<div class="col-4">
						<h3>A better button</h3>
						<p>Save complete, high-quality metadata if it's available on the page; or fall back on saving a basic webpage item.</p>
					</div>
					<div class="col-4">
						<h3>Choose what to save</h3>
						<p>Choose which of multiple options to use, when metadata is available on the page you're browsing, or a unique identifier is present in the page content.</p>
					</div>
				</div>
			</div>
		</section>
		<section class="features features-2">
			<div class="container">
				<hr>
				<h2>Heading 2</h2>
				<p class="lead">Lead text</p>
				<div class="row loose">
					<div class="col-6">
						<img
							width="390"
							height="260"
							alt=""
							src="../assets/images/extensions/screenshot-2.jpg"
							srcset="../assets/images/extensions/screenshot-2@2x.jpg 2x" />
						<h3>Add PDFs with a single click</h3>
						<p>When you’re viewing a PDF directly in your browser, you can save it to Zotero with a single click.</p>
					</div>
					<div class="col-6">
						<img
							width="390"
							height="260"
							alt=""
							src="../assets/images/extensions/screenshot-3.jpg"
							srcset="../assets/images/extensions/screenshot-3@2x.jpg 2x" />
						<h3>Automatically use your university’s proxy</h3>
						<p>Seamlessly access paywalled content by saving your univerity’s proxy details to the Zotero connector.</p>
					</div>
				</div>
			</div>
		</section>
	</div>

	<script type="text/javascript" charset="utf-8">
		ZoteroWebComponents.pageReady(function() {
			window.extensionsPickerElement = ReactDOM.render(
				React.createElement(ZoteroWebComponents.ExtensionsPicker, null),
				document.getElementById('extensions-picker')
			);

			let tests = {
				test1: function(){
					window.extensionsPickerElement.refs.installConnectorPrompt.setState({
						browser:'Safari',
						oldSafari:true
					});
				},
				test2: function(){
					window.extensionsPickerElement.refs.installConnectorPrompt.setState({
						browser:'Safari',
						oldSafari:false
					});
				},
				test3: function(){
					window.extensionsPickerElement.refs.installConnectorPrompt.setState({
						browser:'Chrome',
						oldSafari:false
					});
				},
				test4: function(){
					window.extensionsPickerElement.refs.installConnectorPrompt.setState({
						browser:'Firefox'
					});
				},
				test5: function(){
					window.extensionsPickerElement.refs.installConnectorPrompt.setState({
						browser:'Opera',
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
