<?
$bodyClass = '';

$testData = include('./testdata.php');
$user = null;
if(isset($_GET['user'])){
	$username = $_GET['user'];
	if(isset($testData[$username])){
		$user = $testData[$username];
	}
}
?>
<? include('./layoutHeader.php');?>
<main class='downloads'>
	<div id='react-download'><?include './noscript.php'?></div>
	<section id='download-mobile-section'>
		<div class='container'>
			<div class='row'>
				<div class='col-lg-5 offset-lg-1'>
					<img class='phone-tablet' src='../assets/images/downloads/phone-tablet.svg' />
				</div>
				<div class='col-lg-5 my-auto mobile-text'>
					<h1>Zotero for Mobile</h1>
					<p class='lead'>Collect, organize, and annotate research from your phone and tablet</p>
					<a href="https://apps.apple.com/us/app/zotero/id1513554812">
						<img class='apple-store-link' src='../assets/images/downloads/apple-store-link-badge.png' />
					</a>
					<p class='android-teaser'>Stay tuned — Android app is coming soon.</p>
				</div>
			</div>
		</div>
	</div>
</main>

<script type="text/javascript" charset="utf-8">
	ZoteroWebComponents.pageReady(function() {
		let standaloneVersions = {
			'mac':"7.0",
			'win32':"7.0",
			'win32-zip':"7.0",
			'win-x64':"7.0",
			'win-x64-zip':"7.0",
			'win-arm64':"7.0",
			'win-arm64-zip':"7.0",
			'linux-i686':"7.0",
			'linux-x86_64':"7.0",
			'iOS':"7.0",
		};
		window.downloadComponent = ReactDOMClient.createRoot(
			document.getElementById('react-download')
		);
		window.downloadComponent.render(React.createElement(ZoteroWebComponents.Downloads, {standaloneVersions}));

		let tests = {
			test1: function(){
				console.log('test1');
				let props = {
					standaloneVersions,
					featuredOS:'Mac',
					featuredBrowser:'Safari',
					arch:'x86_64',
					oldMac:false
				};
				window.downloadComponent.render(React.createElement(ZoteroWebComponents.Downloads, props));
			},
			test2: function(){
				let props = {
					featuredOS:'Windows',
					featuredBrowser:'Chrome',
					arch:'x86_64'
				};
				window.downloadComponent.render(React.createElement(ZoteroWebComponents.Downloads, props));
			},
			test3: function(){
				let props = {
					featuredOS:'Windows',
					featuredBrowser:'Edge',
					arch:'x86_64'
				};
				window.downloadComponent.render(React.createElement(ZoteroWebComponents.Downloads, props));
			},
			test4: function(){
				let props = {
					featuredOS:'Linux',
					featuredBrowser:'Firefox',
					arch:'x86_64'
				};
				window.downloadComponent.render(React.createElement(ZoteroWebComponents.Downloads, props));
			},
			test5: function(){
				let props = {
					featuredOS:'Windows',
					featuredBrowser:'Opera',
					arch:'x86_64'
				};
				window.downloadComponent.render(React.createElement(ZoteroWebComponents.Downloads, props));
			},
			test6: function(){
				let props = {
					featuredOS:'Mac',
					featuredBrowser:'Firefox',
					arch:'x86_64'
				};
				window.downloadComponent.render(React.createElement(ZoteroWebComponents.Downloads, props));
			},
			test7: function(){
				let props = {
					featuredOS:'Linux',
					featuredBrowser:'Firefox',
					arch:'i686'
				};
				window.downloadComponent.render(React.createElement(ZoteroWebComponents.Downloads, props));
			},
			test8: function(){
				let props = {
					featuredOS:'',
					featuredBrowser:'Edge',
					arch:'i686'
				};
				window.downloadComponent.render(React.createElement(ZoteroWebComponents.Downloads, props));
			},
			test9: function(){
				let props = {
					featuredOS:'',
					featuredBrowser:'Safari',
					arch:'x86_64',
					oldMac:false,
					mobile:true
				};
				window.downloadComponent.render(React.createElement(ZoteroWebComponents.Downloads, props));
			},
			test10: function(){
				let props = {
					featuredOS:'Mac',
					featuredBrowser:'Safari',
					arch:'x86_64',
					oldMac:true
				};
				window.downloadComponent.render(React.createElement(ZoteroWebComponents.Downloads, props));
			},
			test11: function(){
				let props = {
					featuredBrowser:'Safari',
					oldSafari:true
				};
				window.downloadComponent.render(React.createElement(ZoteroWebComponents.Downloads, props));
			},
			test12: function(){
				let props = {
					featuredOS:'Mac',
					featuredBrowser:'Firefox',
					arch:'x86_64',
					oldSafari:false,
					firefox45:true,
				};
				window.downloadComponent.render(React.createElement(ZoteroWebComponents.Downloads, props));
			},
			test13: function(){
				let props = {};
				navigator.userAgentData = {
					platform: ''
				}
				window.downloadComponent.render(React.createElement(ZoteroWebComponents.Downloads, props));
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
