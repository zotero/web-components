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
				<li class="breadcrumb-item active" aria-current="page">Start</li>
			</ol>
		</nav>
	</div>

	<!-- hidden area for possible JS messages -->
	<div id="js-message">
		<ul id="js-message-list">
		</ul>
	</div>

	<!-- Output content -->
	<!-- NEW START PAGE -->
	<script src="https://www.google.com/recaptcha/api.js" async defer></script>

	<div id='react-start'></div>


	<script type="text/javascript" charset="utf-8">
		ZoteroWebComponents.pageReady(function() {
			window.startElement = ReactDOM.render(
				React.createElement(ZoteroWebComponents.Start, null),
				document.getElementById('react-start')
			);

			let tests = {
				test1: function(){
					window.startElement.refs.registerForm.setState({
						formData:{
							username:'zotero@zotero.org',
							email:'',
							email2:'',
							password:'',
							password2:''
						},
						usernameValidity:'invalid',
						usernameMessage: 'Your email address can be used to log in to your Zotero account, but not as your username.',
						registrationSuccessful:false
					});
				},
				test2: function(){
					window.startElement.refs.registerForm.setState({
						formData:{
							username:'valid-username',
							email:'',
							email2:'',
							password:'',
							password2:''
						},
						usernameValidity:'valid',
						usernameMessage: '',
						registrationSuccessful:false
					});
				},
				test3: function(){
					window.startElement.refs.registerForm.setState({
						formData:{
							username:'fcheslack',
							email:'',
							email2:'',
							password:'',
							password2:''
						},
						usernameValidity:'invalid',
						usernameMessage: 'Username is not available',
						registrationSuccessful:false
					});
				},
				test4: function(){
					window.startElement.refs.registerForm.setState({
						formData:{
							username:'fcheslack',
							email:'email@email.com',
							email2:'email2@email.com',
							password:'',
							password2:''
						},
						usernameValidity:'invalid',
						usernameMessage: 'Username is not available',
						registrationSuccessful:false
					});
				},
				test5: function(){
					window.startElement.refs.registerForm.setState({
						formData:{
							username:'valid',
							email:'email@email.com',
							email2:'email2@email.com',
							password:'',
							password2:''
						},
						formErrors:{
							email:['emails must match']
						},
						usernameValidity:'valid',
						usernameMessage: '',
						registrationSuccessful:false
					});
				},
				test6: function(){
					window.startElement.refs.registerForm.setState({
						formData:{
							username:'valid',
							email:'email@email.com',
							email2:'email@email.com',
							password:'',
							password2:''
						},
						usernameValidity:'valid',
						usernameMessage: '',
						registrationSuccessful:true
					});
				},
				test7: function(){
					window.startElement.refs.registerForm.setState({
						formData:{
							username:'valid',
							email:'email@email.com',
							email2:'email2@email.com',
							password:'',
							password2:''
						},
						formErrors:{},
						formError:'Error processing registration',
						usernameValidity:'valid',
						usernameMessage: '',
						registrationSuccessful:false
					});
				},
				test8: function(){
					window.startElement.refs.registerForm.setState({
						formData:{
							username:'valid',
							email:'email@email.com',
							email2:'email2@email.com',
							password:'',
							password2:''
						},
						formErrors:{},
						formError:'',
						usernameValidity:'valid',
						usernameMessage: '',
						registrationSuccessful:false,
					});
				},
				test9: function(){
					window.startElement.refs.installConnectorPrompt.setState({browser:'Safari', oldSafari:true});
				}
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