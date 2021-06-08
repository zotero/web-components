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
$useTinyMce = true;
?>
<? include('./layoutHeader.php');?>
<main>
	<section class='section section-md'>
		<div class='container'>
			<h1>Group Settings: <a href="/demo/viewgroup.php"><?=$group->name?></a></h1>
			<div class='row'>
				<div class='col-md-2'>
					<? $selectedTab = 'profile'; ?>
					<? include('./partials/groupSettingsTabs.php');?>
				</div>
				<div class='col-md-8 settings-form'>
					<h2 class='main-heading'>Group Information</h2>
					<form enctype="multipart/form-data" accept-charset="utf-8" method="post" class="zform" action="">
						<div class="form-group"><label for="name" class="required">Group Name</label>

						<input type="text" name="name" id="name" value="disposable" class="form-control"></div>
						<div class="form-group"><label for="description" class="optional">Description</label>

						<textarea name="description" id="description" rows="6" cols="40" class="form-control" style="display: none;" aria-hidden="true"></textarea><div role="application" class="tox tox-tinymce" style="visibility: hidden; height: 200px;"><div class="tox-editor-container"><div class="tox-editor-header"><div role="group" class="tox-toolbar-overlord"><div role="group" class="tox-toolbar__primary"><div title="" role="toolbar" data-alloy-tabstop="true" tabindex="-1" class="tox-toolbar__group"><button aria-label="Undo" title="Undo" type="button" tabindex="-1" class="tox-tbtn tox-tbtn--disabled" aria-disabled="true"><span class="tox-icon tox-tbtn__icon-wrap"><svg width="24" height="24"><path d="M6.4 8H12c3.7 0 6.2 2 6.8 5.1.6 2.7-.4 5.6-2.3 6.8a1 1 0 0 1-1-1.8c1.1-.6 1.8-2.7 1.4-4.6-.5-2.1-2.1-3.5-4.9-3.5H6.4l3.3 3.3a1 1 0 1 1-1.4 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 1.4L6.4 8z" fill-rule="nonzero"></path></svg></span></button><button aria-label="Redo" title="Redo" type="button" tabindex="-1" class="tox-tbtn tox-tbtn--disabled" aria-disabled="true"><span class="tox-icon tox-tbtn__icon-wrap"><svg width="24" height="24"><path d="M17.6 10H12c-2.8 0-4.4 1.4-4.9 3.5-.4 2 .3 4 1.4 4.6a1 1 0 1 1-1 1.8c-2-1.2-2.9-4.1-2.3-6.8.6-3 3-5.1 6.8-5.1h5.6l-3.3-3.3a1 1 0 1 1 1.4-1.4l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 0 1-1.4-1.4l3.3-3.3z" fill-rule="nonzero"></path></svg></span></button></div><div title="" role="toolbar" data-alloy-tabstop="true" tabindex="-1" class="tox-toolbar__group"><button aria-label="Bold" title="Bold" type="button" tabindex="-1" class="tox-tbtn" aria-pressed="false"><span class="tox-icon tox-tbtn__icon-wrap"><svg width="24" height="24"><path d="M7.8 19c-.3 0-.5 0-.6-.2l-.2-.5V5.7c0-.2 0-.4.2-.5l.6-.2h5c1.5 0 2.7.3 3.5 1 .7.6 1.1 1.4 1.1 2.5a3 3 0 0 1-.6 1.9c-.4.6-1 1-1.6 1.2.4.1.9.3 1.3.6s.8.7 1 1.2c.4.4.5 1 .5 1.6 0 1.3-.4 2.3-1.3 3-.8.7-2.1 1-3.8 1H7.8zm5-8.3c.6 0 1.2-.1 1.6-.5.4-.3.6-.7.6-1.3 0-1.1-.8-1.7-2.3-1.7H9.3v3.5h3.4zm.5 6c.7 0 1.3-.1 1.7-.4.4-.4.6-.9.6-1.5s-.2-1-.7-1.4c-.4-.3-1-.4-2-.4H9.4v3.8h4z" fill-rule="evenodd"></path></svg></span></button><button aria-label="Italic" title="Italic" type="button" tabindex="-1" class="tox-tbtn" aria-pressed="false"><span class="tox-icon tox-tbtn__icon-wrap"><svg width="24" height="24"><path d="M16.7 4.7l-.1.9h-.3c-.6 0-1 0-1.4.3-.3.3-.4.6-.5 1.1l-2.1 9.8v.6c0 .5.4.8 1.4.8h.2l-.2.8H8l.2-.8h.2c1.1 0 1.8-.5 2-1.5l2-9.8.1-.5c0-.6-.4-.8-1.4-.8h-.3l.2-.9h5.8z" fill-rule="evenodd"></path></svg></span></button></div><div title="" role="toolbar" data-alloy-tabstop="true" tabindex="-1" class="tox-toolbar__group"><button aria-label="Align left" title="Align left" type="button" tabindex="-1" class="tox-tbtn" aria-pressed="false"><span class="tox-icon tox-tbtn__icon-wrap"><svg width="24" height="24"><path d="M5 5h14c.6 0 1 .4 1 1s-.4 1-1 1H5a1 1 0 1 1 0-2zm0 4h8c.6 0 1 .4 1 1s-.4 1-1 1H5a1 1 0 1 1 0-2zm0 8h8c.6 0 1 .4 1 1s-.4 1-1 1H5a1 1 0 0 1 0-2zm0-4h14c.6 0 1 .4 1 1s-.4 1-1 1H5a1 1 0 0 1 0-2z" fill-rule="evenodd"></path></svg></span></button><button aria-label="Align center" title="Align center" type="button" tabindex="-1" class="tox-tbtn" aria-pressed="false"><span class="tox-icon tox-tbtn__icon-wrap"><svg width="24" height="24"><path d="M5 5h14c.6 0 1 .4 1 1s-.4 1-1 1H5a1 1 0 1 1 0-2zm3 4h8c.6 0 1 .4 1 1s-.4 1-1 1H8a1 1 0 1 1 0-2zm0 8h8c.6 0 1 .4 1 1s-.4 1-1 1H8a1 1 0 0 1 0-2zm-3-4h14c.6 0 1 .4 1 1s-.4 1-1 1H5a1 1 0 0 1 0-2z" fill-rule="evenodd"></path></svg></span></button><button aria-label="Align right" title="Align right" type="button" tabindex="-1" class="tox-tbtn" aria-pressed="false"><span class="tox-icon tox-tbtn__icon-wrap"><svg width="24" height="24"><path d="M5 5h14c.6 0 1 .4 1 1s-.4 1-1 1H5a1 1 0 1 1 0-2zm6 4h8c.6 0 1 .4 1 1s-.4 1-1 1h-8a1 1 0 0 1 0-2zm0 8h8c.6 0 1 .4 1 1s-.4 1-1 1h-8a1 1 0 0 1 0-2zm-6-4h14c.6 0 1 .4 1 1s-.4 1-1 1H5a1 1 0 0 1 0-2z" fill-rule="evenodd"></path></svg></span></button></div><div title="" role="toolbar" data-alloy-tabstop="true" tabindex="-1" class="tox-toolbar__group"><button aria-label="Subscript" title="Subscript" type="button" tabindex="-1" class="tox-tbtn" aria-pressed="false"><span class="tox-icon tox-tbtn__icon-wrap"><svg width="24" height="24"><path d="M10.4 10l4.6 4.6-1.4 1.4L9 11.4 4.4 16 3 14.6 7.6 10 3 5.4 4.4 4 9 8.6 13.6 4 15 5.4 10.4 10zM21 19h-5v-1l1-.8 1.7-1.6c.3-.4.5-.8.5-1.2 0-.3 0-.6-.2-.7-.2-.2-.5-.3-.9-.3a2 2 0 0 0-.8.2l-.7.3-.4-1.1 1-.6 1.2-.2c.8 0 1.4.3 1.8.7.4.4.6.9.6 1.5s-.2 1.1-.5 1.6a8 8 0 0 1-1.3 1.3l-.6.6h2.6V19z" fill-rule="nonzero"></path></svg></span></button><button aria-label="Superscript" title="Superscript" type="button" tabindex="-1" class="tox-tbtn" aria-pressed="false"><span class="tox-icon tox-tbtn__icon-wrap"><svg width="24" height="24"><path d="M15 9.4L10.4 14l4.6 4.6-1.4 1.4L9 15.4 4.4 20 3 18.6 7.6 14 3 9.4 4.4 8 9 12.6 13.6 8 15 9.4zm5.9 1.6h-5v-1l1-.8 1.7-1.6c.3-.5.5-.9.5-1.3 0-.3 0-.5-.2-.7-.2-.2-.5-.3-.9-.3l-.8.2-.7.4-.4-1.2c.2-.2.5-.4 1-.5.3-.2.8-.2 1.2-.2.8 0 1.4.2 1.8.6.4.4.6 1 .6 1.6 0 .5-.2 1-.5 1.5l-1.3 1.4-.6.5h2.6V11z" fill-rule="nonzero"></path></svg></span></button><button aria-label="Blockquote" title="Blockquote" type="button" tabindex="-1" class="tox-tbtn" aria-pressed="false"><span class="tox-icon tox-tbtn__icon-wrap"><svg width="24" height="24"><path d="M7.5 17h.9c.4 0 .7-.2.9-.6L11 13V8c0-.6-.4-1-1-1H6a1 1 0 0 0-1 1v4c0 .6.4 1 1 1h2l-1.3 2.7a1 1 0 0 0 .8 1.3zm8 0h.9c.4 0 .7-.2.9-.6L19 13V8c0-.6-.4-1-1-1h-4a1 1 0 0 0-1 1v4c0 .6.4 1 1 1h2l-1.3 2.7a1 1 0 0 0 .8 1.3z" fill-rule="nonzero"></path></svg></span></button></div></div></div><div class="tox-anchorbar"></div></div><div class="tox-sidebar-wrap"><div class="tox-edit-area"><iframe id="description_ifr" allowtransparency="true" title="Rich Text Area. Press ALT-0 for help." class="tox-edit-area__iframe" frameborder="0"></iframe></div><div role="complementary" class="tox-sidebar"><div data-alloy-tabstop="true" tabindex="-1" class="tox-sidebar__slider tox-sidebar--sliding-closed" style="width: 0px;"><div class="tox-sidebar__pane-container"></div></div></div></div></div><div class="tox-statusbar"><div class="tox-statusbar__text-container"><div role="navigation" data-alloy-tabstop="true" class="tox-statusbar__path"></div></div><div title="Resize" class="tox-statusbar__resize-handle"><svg width="10" height="10"><g fill-rule="nonzero"><path d="M8.1 1.1A.5.5 0 1 1 9 2l-7 7A.5.5 0 1 1 1 8l7-7zM8.1 5.1A.5.5 0 1 1 9 6l-3 3A.5.5 0 1 1 5 8l3-3z"></path></g></svg></div></div><div aria-hidden="true" class="tox-throbber" style="display: none;"></div></div>
						<p class="hint text-muted small">What is this group about?</p></div>
						<div class="form-group"><label for="disciplines" class="optional">Disciplines</label>

						<select name="disciplines[]" id="disciplines" multiple="multiple" class="form-control">
							<optgroup id="disciplines-optgroup-Humanities" label="Humanities">
							<option value="African American Studies">African American Studies</option>
							<option value="American Studies">American Studies</option>
							<option value="Art History">Art History</option>
							<option value="Classics and Classical Studies">Classics and Classical Studies</option>
							<option value="Creative Writing">Creative Writing</option>
							<option value="Digital Humanities">Digital Humanities</option>
							<option value="Film Studies">Film Studies</option>
							<option value="History">History</option>
							<option value="History of Science and Medicine">History of Science and Medicine</option>
							<option value="Humanities">Humanities</option>
							<option value="Languages">Languages</option>
							<option value="Linguistics">Linguistics</option>
							<option value="Literature">Literature</option>
							<option value="Music and Musicology">Music and Musicology</option>
							<option value="Performing Arts">Performing Arts</option>
							<option value="Philosophy">Philosophy</option>
							<option value="Religion">Religion</option>
							<option value="Theater Studies">Theater Studies</option>
							<option value="Visual Arts">Visual Arts</option>
							</optgroup>
							<optgroup id="disciplines-optgroup-Social Sciences" label="Social Sciences">
							<option value="Anthropology">Anthropology</option>
							<option value="Archaeology">Archaeology</option>
							<option value="Area Studies">Area Studies</option>
							<option value="Cultural Studies and Ethnic Studies">Cultural Studies and Ethnic Studies</option>
							<option value="Economics">Economics</option>
							<option value="Geography">Geography</option>
							<option value="Political Science">Political Science</option>
							<option value="Psychology">Psychology</option>
							<option value="Sociology">Sociology</option>
							<option value="Urban Studies">Urban Studies</option>
							<option value="Women's, Gender, and Sexuality Studies">Women's, Gender, and Sexuality Studies</option>
							</optgroup>
							<optgroup id="disciplines-optgroup-Natural and Formal Sciences" label="Natural and Formal Sciences">
							<option value="Astronomy and Astrophysics">Astronomy and Astrophysics</option>
							<option value="Biology">Biology</option>
							<option value="Chemistry">Chemistry</option>
							<option value="Computer Sciences">Computer Sciences</option>
							<option value="Geology and Geophysics">Geology and Geophysics</option>
							<option value="Mathematics">Mathematics</option>
							<option value="Molecular Biophysics and Biochemistry">Molecular Biophysics and Biochemistry</option>
							<option value="Neuroscience">Neuroscience</option>
							<option value="Physics">Physics</option>
							<option value="Systems Science">Systems Science</option>
							</optgroup>
							<optgroup id="disciplines-optgroup-Engineering and Applied Sciences" label="Engineering and Applied Sciences">
							<option value="Aeronautics">Aeronautics</option>
							<option value="Applied Mathematics">Applied Mathematics</option>
							<option value="Applied Physics">Applied Physics</option>
							<option value="Bioengineering">Bioengineering</option>
							<option value="Chemical Engineering">Chemical Engineering</option>
							<option value="Civil Engineering">Civil Engineering</option>
							<option value="Electrical Engineering">Electrical Engineering</option>
							<option value="Engineering">Engineering</option>
							<option value="Environmental Engineering">Environmental Engineering</option>
							<option value="Environmental Studies and Forestry">Environmental Studies and Forestry</option>
							<option value="Health Sciences">Health Sciences</option>
							<option value="Information Science and Technology">Information Science and Technology</option>
							<option value="Library and Museum Studies">Library and Museum Studies</option>
							<option value="Materials Science">Materials Science</option>
							<option value="Mechanical Engineering">Mechanical Engineering</option>
							<option value="Military Sciences">Military Sciences</option>
							<option value="Physical Education and Fitness">Physical Education and Fitness</option>
							<option value="Transportation">Transportation</option>
							</optgroup>
							<optgroup id="disciplines-optgroup-Professions" label="Professions">
							<option value="Agriculture">Agriculture</option>
							<option value="Architecture and Design">Architecture and Design</option>
							<option value="Business">Business</option>
							<option value="Education">Education</option>
							<option value="Divinity">Divinity</option>
							<option value="Journalism, Media, and Communication">Journalism, Media, and Communication</option>
							<option value="Law">Law</option>
							<option value="Medicine">Medicine</option>
							<option value="Public Affairs">Public Affairs</option>
							<option value="Social Work">Social Work</option>
							<option value="Veterinary Medicine and Science">Veterinary Medicine and Science</option>
							</optgroup>
						</select>
						<p class="hint text-muted small">Hold the Control key (Windows/Linux) or Command key (Mac) to select more than one discipline.</p></div>
						<div class="form-group"><label for="url" class="optional">Group URL</label>

						<input type="text" name="url" id="url" value="" class="form-control">
						<p class="hint text-muted small">Is there a webpage about this group?</p></div>
						<div class="form-group">
						<input type="hidden" name="enable_comments" value="0"><input type="checkbox" name="enable_comments" id="enable_comments" value="1">
						<label for="enable_comments" class="optional">Enable Comments</label></div>

						<input type="hidden" name="lastModified" value="" id="lastModified">
						<div class="form-group">
						<button name="settings_submit" id="settings_submit" type="submit" class="btn btn-secondary">Save Settings</button></div>
					</form>
				</div>
				<div class='col-md-2'>
					<div id='react-profileImageForm' data-editable='true'></div>
				</div>
			</div>
		</div>
	</section>
</main>
<script type="text/javascript" charset="utf-8">
	var zoterojsClass = "group_settings";
	var zoterojsSearchContext = "group";

	ZoteroWebComponents.pageReady(function() {
		if(document.getElementById('react-profileImageForm')) {
			window.profileImageFormComponent = ReactDOM.render(
				React.createElement(ZoteroWebComponents.ProfileImageForm, <?=json_encode([
					'type'=>'group',
					'entityID'=>(int)$group->groupID,
					'hasImage'=>(bool)$group->hasImage
				])?>),
				document.getElementById('react-profileImageForm')
			);
		}
		tinymce.init({
			selector: `textarea#description`,
			toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | subscript superscript blockquote',
			branding:false,
			menubar:false,
			statusbar:true
		});
	});

</script>

<? include('./layoutFooter.php')?>