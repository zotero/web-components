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
	<div class='container'>
		<div class='row justify-content-center mb-5'>
			<nav class='nav'>
				<a class='nav-link' href="/user/register">Register for a free account</a>
				<a class='nav-link' href="/user/lostpassword">Forgot your password?</a>
			</nav>
		</div>
		<div class='row justify-content-center'>
			<div class='col-md-4'>
				<div class='mb-6'>
					<h3>Login</h3>
					<form enctype="application/x-www-form-urlencoded" accept-charset="utf-8" method="post" class="zform" action="">
						<div class="form-group">
							<label for="username" class="required">Username or Email</label>
							<input type="text" name="username" id="username" value="" class="form-control">
						</div>
						<div class="form-group">
							<label for="password" class="required">Password</label>
							<input type="password" name="password" id="password" value="" maxlength="500" class="form-control">
						</div>
						<div class="form-group">
							<input type="hidden" name="remember" value="0">
							<input type="checkbox" name="remember" id="remember" value="1" class="checkbox">
							<label for="remember" class="optional">Remember Me</label>
							<p class="hint text-muted small">Keep me signed in for 30 days</p>
						</div>
						<div class="form-group">
							<button name="login" id="login" type="submit" class="btn btn-secondary">Login to Zotero</button>
						</div>
					</form>
				</div>
				<a data-toggle="collapse" href="#openID" aria-expanded="false" aria-controls="openID">Log in with OpenID</a>
				<div class="collapse my-6" id="openID">
					<h3>Log in with OpenID</h3>
					<form enctype="application/x-www-form-urlencoded" accept-charset="utf-8" method="post" class="zform" action="">
						<div class="form-group">
							<label for="openid_identifier" class="required">OpenID</label>
							<input type="text" name="openid_identifier" id="openid_identifier" value="" class="form-control">
							<p class="hint text-muted small">To link your Zotero account with an OpenID, enter it here and click Login with OpenID</p>
						</div>
						<div class="form-group">
							<button name="loginOpenId" id="loginOpenId" type="submit" class="btn btn-secondary">Login with OpenID</button>
						</div>
						<div></div>
					</form>
				</div>
			</div>
		</div>
	</div>
</main>
<? include('./layoutFooter.php')?>
