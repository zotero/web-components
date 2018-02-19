<?
$bodyClass = 'home';

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
				<section class="jumbotron jumbotron-fluid">
					<div class="container">
						<h1 class="display-1">Your personal<br>research assistant.</h1>
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
							  srcset="../assets/images/home/screenshot-1.4.png 1170w, ../assets/images/home/screenshot-1.4@2x.png 2340w"
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
  								<div class="collect-animation illu-container">
									  <?php include "collect-animation.php";?>
								  </div>
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
	<script>
		ZoteroWebComponents.pageReady(function() {
			ZoteroWebComponents.animations.collect();
		});
	</script>
<? include('./layoutFooter.php')?>
