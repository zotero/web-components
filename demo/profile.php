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
				<? $selectedTab = 'profile';
				include('./partials/settingsTabs.php');?>
				<div class='col-lg-8 offset-lg-1 settings-form'>
				<form enctype="multipart/form-data" accept-charset="utf-8" method="post" class="zform" action="">
					<div class="form-group"><label for="profile_realname" class="optional">Real Name</label>

					<input type="text" name="profile_realname" id="profile_realname" value="" class="form-control">
					<p class="hint text-muted small">We're big on true identities at Zotero.</p></div>
					<div class="form-group"><label for="profile_location" class="optional">Location</label>

					<input type="text" name="profile_location" id="profile_location" value="" class="form-control">
					<p class="hint text-muted small">We'll take a city, postal code, state, or country.</p></div>
					<div class="form-group"><label for="profile_disciplines" class="optional">Disciplines</label>

					<select name="profile_disciplines[]" id="profile_disciplines" multiple="multiple" class="form-control">
						<optgroup id="profile_disciplines-optgroup-Humanities" label="Humanities">
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
						<optgroup id="profile_disciplines-optgroup-Social Sciences" label="Social Sciences">
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
						<optgroup id="profile_disciplines-optgroup-Natural and Formal Sciences" label="Natural and Formal Sciences">
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
						<optgroup id="profile_disciplines-optgroup-Engineering and Applied Sciences" label="Engineering and Applied Sciences">
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
						<optgroup id="profile_disciplines-optgroup-Professions" label="Professions">
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
					<div class="form-group"><label for="profile_affiliation" class="optional">Affiliation</label>

					<input type="text" name="profile_affiliation" id="profile_affiliation" value="" class="form-control">
					<p class="hint text-muted small">What, if any, institution are you associated with?</p></div>
					<div class="form-group"><label for="profile_bio" class="optional">About you</label>

					<textarea name="profile_bio" id="profile_bio" rows="6" cols="20" class="form-control"></textarea>
					<p class="hint text-muted small">So what is it that you do around here?</p></div>
					<div class="form-group">
					<button name="submit" id="submit" type="submit" class="btn btn-secondary">Save Profile</button></div>

					<input type="hidden" name="verify_session" value="68d686892ca4ff2c2f54aa822fc527cd16bda86e" id="verify_session"></form>
				</div>
				<div class='col-lg-1'>
					<div id='react-profileImageForm'></div>
				</div>
			</div>
		</div>
	</section>
</main>

<script type="text/javascript" charset="utf-8">
	var zoterojsClass = "settings_account";
	ZoteroWebComponents.pageReady(function () {
		console.log('pageReady');
		let tests = {
			test1: function () {
				console.log('test1');
				let imageProps = {
					type: 'user',
					entityID: 23456,
					hasImage: false
				};
				
				ReactDOM.unmountComponentAtNode(document.getElementById('react-profileImageForm'));

				window.profileImageFormComponent = ReactDOM.render(
					React.createElement(ZoteroWebComponents.ProfileImageForm, imageProps),
					document.getElementById('react-profileImageForm')
				);
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