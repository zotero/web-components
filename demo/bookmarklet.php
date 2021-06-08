<?
$bodyClass = 'downloadbookmarklet';

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
		<h1>Bookmarklet</h1>
		<p>The Zotero Bookmarklet is a bookmark you add to your browser to save the page you are reading to your Zotero library.</p>
		<p>The process for installing and using the Zotero bookmarklet varies depending on the browser you are using.</p>
		<p>Note that third party cookies must be allowed for the bookmarklet to function.</p>

		<div class='row my-8 d-none d-sm-flex'>
			<div class='col-3'>
				<div class="nav flex-column nav-pills" id="v-pills-tab" role="tablist" aria-orientation="vertical">
					<a class="nav-link active" id="v-pills-desktop-tab" data-toggle="pill" href="#v-pills-desktop" role="tab" aria-controls="v-pills-desktop" aria-selected="true">
						<img src='/static/images/index/laptop-white.png' /> Desktop
					</a>
					<a class="nav-link" id="v-pills-ios-tab" data-toggle="pill" href="#v-pills-ios" role="tab" aria-controls="v-pills-ios" aria-selected="true">
						<img src='/static/images/theme/browser_icons/32-safari.png' width='32px' /> iPhone/iPad
					</a>
					<a class="nav-link" id="v-pills-chromeandroid-tab" data-toggle="pill" href="#v-pills-chromeandroid" role="tab" aria-controls="v-pills-chromeandroid" aria-selected="false">
						<img src='/static/images/theme/browser_icons/64-chrome.png' width='32px' /> Chrome for Android
					</a>
					<a class="nav-link" id="v-pills-firefoxmobile-tab" data-toggle="pill" href="#v-pills-firefoxmobile" role="tab" aria-controls="v-pills-firefoxmobile" aria-selected="false">
						<img src='/static/images/theme/browser_icons/64-firefox.png' width='32px' /> Firefox for Android
					</a>
					<a class="nav-link" id="v-pills-operamobile-tab" data-toggle="pill" href="#v-pills-operamobile" role="tab" aria-controls="v-pills-operamobile" aria-selected="false">
						<img src='/static/images/theme/browser_icons/64-opera.png' width='32px' /> Opera Mobile/Mini
					</a>
				</div>
			</div>
			<div class='col-7 offset-1 my-5'>
				<div class="tab-content" id="v-pills-tabContent">
					<div class="tab-pane fade show active" id="v-pills-desktop" role="tabpanel" aria-labelledby="v-pills-desktop-tab">
						<p>To install, <strong>click and drag</strong> the button to your browser's bookmarks toolbar.</p>
						<a class="btn btn-primary" href="<?=$this->bookmarkletLoader;?>">Save to Zotero</a>
					</div>
					<div class="tab-pane fade" id="v-pills-ios" role="tabpanel" aria-labelledby="v-pills-ios-tab">
						<div>
							<ol>
								<li>Bookmark this page</li>
								<li>Edit the bookmark you just created</li>
								<li>Change the title to something appropriate such as "Save to Zotero"</li>
								<li>Copy the code in the textbox below and paste it as the URL for the bookmark</li>
							</ol>
							<textarea class='form-control' style='width:100%; height:5rem;' onClick="this.setSelectionRange(0, this.value.length)"><?=$this->bookmarkletLoader;?></textarea>
						</div>
					</div>
					<div class="tab-pane fade" id="v-pills-chromeandroid" role="tabpanel" aria-labelledby="v-pills-chromeandroid-tab">
						<div>
							<ol>
								<li>Bookmark this page</li>
								<li>Edit the bookmark you just created</li>
								<li>Change the title to something appropriate such as "Save to Zotero"</li>
								<li>Copy the code in the textbox below and paste it as the URL for the bookmark</li>
								<li>To use the bookmarklet on a page, tap into the address bar for the page you want to grab and start typing the name you have saved the bookmarklet as. Tap the bookmarklet entry when it appears in the auto-suggest.</li>
							</ol>
							<textarea class='form-control' style='width:100%; height:5rem;' onClick="this.setSelectionRange(0, this.value.length)"><?=$this->bookmarkletLoader;?></textarea>
						</div>
					</div>
					<div class="tab-pane fade" id="v-pills-firefoxmobile" role="tabpanel" aria-labelledby="v-pills-firefoxmobile-tab">
						<div>
							<ol>
								<li>Long tap "Save to Zotero" button</li>
								<li>Save link as bookmark</li>
								<li>To save a page: tap the address bar, select bookmarks tab, select Zotero bookmarklet</li>
							</ol>
							<a class="btn btn-primary" href="<?=$this->bookmarkletLoader;?>">Save to Zotero</a>
						</div>
					</div>
					<div class="tab-pane fade" id="v-pills-operamobile" role="tabpanel" aria-labelledby="v-pills-operamobile-tab">
						<div>
							<ol>
								<li>Bookmark this page</li>
								<li>Edit the bookmark you just created</li>
								<li>Change the title to something appropriate such as "Save to Zotero"</li>
								<li>Copy the code in the textbox below and paste it as the URL for the bookmark</li>
							</ol>
							<textarea class='form-control' style='width:100%; height:5rem;' onClick="this.setSelectionRange(0, this.value.length)"><?=$this->bookmarkletLoader;?></textarea>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class='row my-8 d-flex d-sm-none'>
			<div class='col'>
			<div id="accordion">
				<div class="card">
					<div class="card-header clickable" id="desktopHeading" data-toggle="collapse" data-target="#desktopCollapse" aria-expanded="true" aria-controls="desktopCollapse">
						<h5 class="mb-0">
							<button class="btn btn-link"><img src='/static/images/index/laptop-white.png' /> Desktop</button>
						</h5>
					</div>

					<div id="desktopCollapse" class="collapse show" aria-labelledby="desktopHeading" data-parent="#accordion">
						<div class="card-body">
							<p>To install, <strong>click and drag</strong> the button to your browser's bookmarks toolbar.</p>
							<a class="btn btn-primary" href="<?=$this->bookmarkletLoader;?>">Save to Zotero</a>
						</div>
					</div>
				</div>
				<div class="card">
					<div class="card-header clickable" id="iosHeading" data-toggle="collapse" data-target="#iosCollapse" aria-expanded="false" aria-controls="iosCollapse">
						<h5 class="mb-0">
							<button class="btn btn-link"><img src='/static/images/theme/browser_icons/32-safari.png' width='32px' /> iPhone/iPad</button>
						</h5>
					</div>
					<div id="iosCollapse" class="collapse" aria-labelledby="iosHeading" data-parent="#accordion">
						<div class="card-body">
							<div>
								<ol>
									<li>Bookmark this page</li>
									<li>Edit the bookmark you just created</li>
									<li>Change the title to something appropriate such as "Save to Zotero"</li>
									<li>Copy the code in the textbox below and paste it as the URL for the bookmark</li>
								</ol>
								<textarea rows="4" onClick="this.setSelectionRange(0, this.value.length)"><?=$this->bookmarkletLoader;?></textarea>
							</div>
						</div>
					</div>
				</div>
				<div class="card">
					<div class="card-header clickable" id="chromeandroidHeading" data-toggle="collapse" data-target="#chromeandroidCollapse" aria-expanded="false" aria-controls="chromeandroidCollapse">
						<h5 class="mb-0">
							<button class="btn btn-link"><img src='/static/images/theme/browser_icons/64-chrome.png' width='32px' /> Chrome for Android</button>
						</h5>
					</div>
					<div id="chromeandroidCollapse" class="collapse" aria-labelledby="chromeandroidHeading" data-parent="#accordion">
						<div class="card-body">
							<div>
								<ol>
									<li>Bookmark this page</li>
									<li>Edit the bookmark you just created</li>
									<li>Change the title to something appropriate such as "Save to Zotero"</li>
									<li>Copy the code in the textbox below and paste it as the URL for the bookmark</li>
									<li>To use the bookmarklet on a page, tap into the address bar for the page you want to grab and start typing the name you have saved the bookmarklet as. Tap the bookmarklet entry when it appears in the auto-suggest.</li>
								</ol>
								<textarea class='form-control' style='width:100%; height:5rem;' onClick="this.setSelectionRange(0, this.value.length)"><?=$this->bookmarkletLoader;?></textarea>
							</div>
						</div>
					</div>
				</div>
				<div class="card">
					<div class="card-header clickable" id="firefoxandroidHeader" data-toggle="collapse" data-target="#firefoxandroidCollapse" aria-expanded="false" aria-controls="firefoxandroidCollapse">
						<h5 class="mb-0">
							<button class="btn btn-link"><img src='/static/images/theme/browser_icons/64-firefox.png' width='32px' /> Firefox for Android</button>
						</h5>
					</div>
					<div id="firefoxandroidCollapse" class="collapse" aria-labelledby="firefoxandroidHeader" data-parent="#accordion">
						<div class="card-body">
							<div>
								<ol>
									<li>Long tap "Save to Zotero" button</li>
									<li>Save link as bookmark</li>
									<li>To save a page: tap the address bar, select bookmarks tab, select Zotero bookmarklet</li>
								</ol>
								<a class="btn btn-primary" href="<?=$this->bookmarkletLoader;?>">Save to Zotero</a>
							</div>
						</div>
					</div>
				</div>
				<div class="card">
					<div class="card-header clickable" id="operaHeading" data-toggle="collapse" data-target="#operaCollapse" aria-expanded="false" aria-controls="operaCollapse">
						<h5 class="mb-0">
							<button class="btn btn-link"><img src='/static/images/theme/browser_icons/64-opera.png' width='32px' /> Opera Mobile/Mini</button>
						</h5>
					</div>
					<div id="operaCollapse" class="collapse" aria-labelledby="operaHeading" data-parent="#accordion">
						<div class="card-body">
							<div>
								<ol>
									<li>Bookmark this page</li>
									<li>Edit the bookmark you just created</li>
									<li>Change the title to something appropriate such as "Save to Zotero"</li>
									<li>Copy the code in the textbox below and paste it as the URL for the bookmark</li>
								</ol>
								<textarea class='form-control' style='width:100%; height:5rem;' onClick="this.setSelectionRange(0, this.value.length)"><?=$this->bookmarkletLoader;?></textarea>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		</div>
	</div>
</main>
