<!DOCTYPE html>
<html lang="en">
	<head>
		<!-- Required meta tags -->
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
		<title>Zotero Home | Your personal research assistant</title>
		<link rel="stylesheet" href="../build/web-components.css" type="text/css" media="screen"/>
		<?php $UAString = $_SERVER['HTTP_USER_AGENT'];
		$os = 'unknown';
		if(stripos($UAString, 'windows') !== false){
			$os = 'windows';
		}
		?>
		<?php if($os == 'windows'):?>
			<link rel="stylesheet" href="../build/fonts-win.css">
		<?php else:?>
			<link rel="stylesheet" href="../build/fonts-mac.css">
		<?php endif;?>

		<?php 
		$testData = include('./testdata.php');
		$user = null;
		if($_GET['user']){
			$username = $_GET['user'];
			if(isset($testData[$username])){
				$user = $testData[$username];
			}
		}
		?>

		<!-- set jsConfig on window.zoteroConfig -->
		<?php $jsConfig = include('./jsConfig.php');?>
		<script type="text/javascript">
			window.zoteroConfig = <?=json_encode($jsConfig);?>;

			if(!window.Zotero){
				window.Zotero = {};
			}
		</script>

		<script src="../build/web-components.js"></script>
		<script>
			WebFont.load({
				custom: {
					families: ['AvenirLTPro:n3', 'AvenirLTPro:n4']
				}
			});
		</script>
	</head>
	<body class="home">
		<header class="mobile-header d-lg-none d-xl-none">
			<nav>
				<ul class="mobile-nav">
					<li class="active"><a class="nav-link" href="/">Zotero</a></li>
					<li><a class="nav-link" href="https://www.zotero.org/groups/">Groups</a></li>
					<li><a class="nav-link" href="https://www.zotero.org/support/">Documentation</a></li>
					<li><a class="nav-link" href="https://forums.zotero.org/discussions">Forums</a></li>
					<li><a class="nav-link" href="https://www.zotero.org/getinvolved">Get Involved</a></li>
					<? if(!$user):?>
					<li><a class="nav-link" href="https://www.zotero.org/user/login/">Log In</a></li>
					<? else:?>
					<? endif;?>
					<li><a class="nav-link" href="/settings/storage?ref=usb">Upgrade Storage</a></li>
				</ul>
			</nav>
		</header>
		<div class="nav-cover"></div>
		<div class="site-wrapper">
			<header class="main-header">
				<div class="container">
					<a href="/" class="brand">
						<img src="../assets/images/zotero-logo.svg" width="113" height="32" alt="Zotero">
					</a>
					<nav>
						<ul class="main-nav d-none d-lg-flex">
							<li class="nav-item active"><a href="https://www.zotero.org/groups/" class="nav-link">Groups</a></li>
							<li class="nav-item"><a href="https://www.zotero.org/support/" class="nav-link">Documentation</a></li>
							<li class="nav-item"><a href="https://forums.zotero.org/discussions" class="nav-link">Forums</a></li>
							<li class="nav-item"><a href="https://www.zotero.org/getinvolved" class="nav-link">Get Involved</a></li>
							<? if(!$user):?>
							<li class="nav-item"><a href="https://www.zotero.org/user/login/" class="nav-link log-in">Log In</a></li>
							<? else:?>
							<? endif;?>
							<li class="nav-item"><a href="/settings/storage?ref=usb" class="btn btn-secondary btn-sm upgrade-storage">Upgrade Storage</a></li>
						</ul>
					</nav>
					<button class="btn btn-link nav-toggle d-lg-none">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">
						  <path d="M1,1H23M1,9H23M1,17H23" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2"/>
						</svg>
					</button>
				</div>
			</header>
			<main>
				<section class="jumbotron jumbotron-fluid">
					<div class="container">
						<h1 class="display-1"><span class="kern">Yo</span>ur personal<br>research assistant.</h1>
						<p class="lead"><span class="d-sm-block">Zotero is free software that helps you</span> <span class="d-sm-block">collect, cite, and share research.</span></p>
						<p class="download"><a href="/download" class="btn btn-primary btn-lg">Download</a></p>
						<p class="platforms">Available for Mac, Windows, and Linux</p>
					</div>
				</section>
				<section class="section-screenshot">
					<div class="container">
						<figure class="screenshot">
							<img
							  class="img-fluid"
							  src="../assets/images/home/screenshot-1.1.png"
							  srcset="../assets/images/home/screenshot-1.1.png 1170w, ../assets/images/home/screenshot-1.1@2x.png 2340w"
							  sizes="(min-width: 1234px) 1170px, 100vw"
							  width="1170"
							  height="658"
							  alt="Screenshot of the Zotero desktop application">
						</figure>
					</div>
				</section>
				<section class="features">
					<div class="container">
						<div class="page-header">
							<h1 class="display-1 text-center">Meet Zotero.</h1>
						</div>
						<section class="section-md">
							<div class="row align-items-center">
								<div class="feature-col col-md-6 col-xl-5 text-center right">
									<img class="img-fluid illu-collect" src="../assets/images/home/collect.svg" width="444" height="514">
								</div>
								<div class="feature-col col-md-6 order-md-first col-xl-5 offset-xl-1 left">
									<h2 class="display-2">Collect with a click.</h2>
									<p>Zotero is the only software that automatically senses research on the web. Need an article from JSTOR or a preprint from arXiv.org? A news story from the New York Times or a book from a library? Zotero has you covered, everywhere.</p>
								</div>
							</div>
						</section>
						<section class="section-md">
							<div class="row align-items-center">
								<div class="feature-col col-md-6 col-xl-5 offset-xl-1 text-center left">
									<img class="img-fluid" src="../assets/images/home/organize.svg" width="444" height="335">
								</div>
								<div class="feature-col col-md-6 col-xl-5 right">
									<h2 class="display-2">Organize your way.</h2>
									<p>Zotero helps you organize your research any way you want. You can sort items into collections and tag them with keywords. Or create saved searches that automatically fill with relevant materials as you work.</p>
								</div>
							</div>
						</section>
						<section class="section-md">
							<div class="row align-items-center">
								<div class="feature-col col-md-6 col-xl-5 text-center right">
									<img class="img-fluid" src="../assets/images/home/cite.svg" width="444" height="370">
								</div>
								<div class="feature-col col-md-6 order-md-first col-xl-5 offset-xl-1 left">
									<h2 class="display-2">Cite in style.</h2>
									<p>Zotero instantly creates references and bibliographies for any text editor, and directly inside Word and OpenOffice. With support for over 8000 citation styles, you can format your work to match any style guide or publication.</p>
								</div>
							</div>
						</section>
						<section class="section-md">
							<div class="row align-items-center">
								<div class="feature-col col-md-6 col-xl-5 offset-xl-1 text-center left">
									<picture class="illu-sync">
										<source srcset="../assets/images/home/sync-xl.svg" media="(min-width: 1234px)">
										<source srcset="../assets/images/home/sync-lg.svg" media="(min-width: 994px)">
										<img src="../assets/images/home/sync-md.svg">
									</picture>
								</div>
								<div class="feature-col col-md-6 col-xl-5 right">
									<h2 class="display-2">Stay in sync.</h2>
									<p>Zotero automatically synchronizes your data across your devices, keeping your notes, files, and bibliographic data seamlessly up to date. Even without Zotero installed, you can always access your research from any web browser.</p>
								</div>
							</div>
						</section>
						<section class="section-md last">
							<div class="row align-items-center">
								<div class="feature-col col-md-6 col-xl-5 text-center right">
									<img class="img-fluid" src="../assets/images/home/collaborate.svg" width="444" height="331">
								</div>
								<div class="feature-col col-md-6 order-md-first col-xl-5 offset-xl-1 left">
									<h2 class="display-2">Collaborate freely.</h2>
									<p>Zotero lets you freely collaborate with fellow researchers and distribute class materials to your students. With no restrictions on membership, you can share files, notes, and discussion threads in public or in private.</p>
								</div>
							</div>
						</section>
					</div>
				</section>
				<section class="section-sm separated call-to-action">
					<div class="container">
						<div class="row align-items-center">
							<div class="col text-center d-md-flex justify-content-center align-items-center">
								<h2 class="display-2">Ready to try Zotero?</h2>
								<a class="btn btn-primary btn-lg ml-md-6" href="/download">Download</a>
							</div>
						</div>
					</div>
				</section>
			</main>
			<footer class="main-footer">
				<div class="container">
					<nav>
						<ul class="footer-nav">
							<li class="nav-item"><a href="https://www.zotero.org/blog/" class="nav-link">Blog</a></li>
							<li class="nav-item"><a href="https://forums.zotero.org/" class="nav-link">Forums</a></li>
							<li class="nav-item"><a href="https://www.zotero.org/support/dev/start" class="nav-link">Developers</a></li>
							<li class="nav-item"><a href="https://www.zotero.org/support/" class="nav-link">Documentation</a></li>
							<li class="nav-item"><a href="https://www.zotero.org/support/terms/privacy" class="nav-link">Privacy</a></li>
							<li class="nav-item"><a href="https://www.zotero.org/getinvolved/" class="nav-link">Get Involved</a></li>
							<li class="nav-item"><a href="https://www.zotero.org/jobs" class="nav-link">Jobs</a></li>
							<li class="nav-item"><a href="https://www.zotero.org/about/" class="nav-link">About</a></li>
						</ul>
						<ul class="social-nav">
							<li class="nav-item follow-us">Follow us</li>
							<li class="nav-item twitter"><a href="https://twitter.com/zotero"><img src="../assets/images/twitter-icon.svg"></a></li>
							<li class="nav-item fb"><a href="https://www.facebook.com/zotero/"><img src="../assets/images/fb-icon.svg"></a></li>
							<li class="nav-item rss"><a href="https://www.zotero.org/blog/"><img src="../assets/images/rss-icon.svg"></a></li>
						</ul>
					</nav>
					<div class="credits">
						<a href="https://rrchnm.org/" class="chnm-link"><img src="../assets/images/chnm-logo.svg"></a>
						<p class="about"><span>Zotero is a project of the</span> <a href="https://rrchnm.org/">Roy Rosenzweig Center for History and New Media</a><span>, and was initially funded by the</span> <a href="https://mellon.org/">Andrew W. Mellon Foundation</a><span>, the</span> <a href="https://www.imls.gov/">Institute of Museum and Library Services</a><span>, and the </span><a href="https://sloan.org/">Alfred P. Sloan Foundation.</a></p>
					</div>
				</div>
			</footer>
		</div>
	</body>
</html>
