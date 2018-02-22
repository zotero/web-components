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
					families: ['AvenirNextLTPro:n3', 'AvenirNextLTPro:n4']
				}
			});
		</script>
	</head>
	<body class="<?=$bodyClass?>">
		<header class="mobile-header d-lg-none d-xl-none">
			<nav>
				<ul class="mobile-nav">
					<li class="active"><a class="nav-link" href="/">Zotero</a></li>
					<? if($user):?>
					<li><a class="nav-link" href="https://www.zotero.org/mylibrary">My Library</a></li>
					<? endif;?>
					<li><a class="nav-link" href="https://www.zotero.org/groups/">Groups</a></li>
					<li><a class="nav-link" href="https://www.zotero.org/support/">Documentation</a></li>
					<li><a class="nav-link" href="https://forums.zotero.org/discussions">Forums</a></li>
					<li><a class="nav-link" href="https://www.zotero.org/getinvolved">Get Involved</a></li>
					<? if(!$user):?>
					<li><a class="nav-link separated" href="https://www.zotero.org/user/login/">Log In</a></li>
					<? else:?>
					<li><a class="nav-link separated" href="<?="/{$user->slug}"?>">My Profile</a></li>
					<li><a class="nav-link separated" href="https://forums.zotero.org/messages/inbox">Inbox<?=$user->unreadMessages > 0 ? " ({$user->unreadMessages})" : "";?></a></li>
					<li><a class="nav-link separated" href="/settings">Settings</a></li>
					<li><a class="nav-link" href="/user/logout">Log Out</a></li>
					<? endif;?>
					<li><a class="nav-link separated" href="/settings/storage?ref=usb">Upgrade Storage</a></li>
				</ul>
			</nav>
		</header>
		<div class="nav-cover"></div>
		<div class="site-wrapper">
			<header class="main-header">
				<div class="container">
					<a href="/" class="brand">
						<img src="../assets/images/zotero-logo.svg" width="108" height="32" alt="Zotero">
					</a>
					<nav>
						<ul class="main-nav d-none d-lg-flex">
							<? if($user):?>
							<li><a class="nav-link" href="https://www.zotero.org/mylibrary">My Library</a></li>
							<? endif;?>
							<li class="nav-item active"><a href="https://www.zotero.org/groups/" class="nav-link">Groups</a></li>
							<li class="nav-item"><a href="https://www.zotero.org/support/" class="nav-link">Documentation</a></li>
							<li class="nav-item"><a href="https://forums.zotero.org/discussions" class="nav-link">Forums</a></li>
							<li class="nav-item"><a href="https://www.zotero.org/getinvolved" class="nav-link">Get Involved</a></li>
							<? if(!$user):?>
							<li class="nav-item"><a href="https://www.zotero.org/user/login/" class="nav-link log-in">Log In</a></li>
							<? else:?>
							<div class="btn-group">
								<button type="button" class="nav-link btn btn-link text-truncate user-dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
									<?=$user->displayName?>
								</button>
								<div class="dropdown-menu">
								<a class="dropdown-item" href="<?="/{$user->slug}"?>">My Profile</a>
								<div role="separator" class="dropdown-divider"></div>
								<a class="dropdown-item" href="https://forums.zotero.org/messages/inbox">Inbox<?=$user->unreadMessages > 0 ? " ({$user->unreadMessages})" : "";?></a>
								<div role="separator" class="dropdown-divider"></div>
								<a class="dropdown-item" href="/settings">Settings</a>
								<a class="dropdown-item" href="/user/logout">Log Out</a>
								</div>
							</div>
							<? endif;?>
							<li class="nav-item"><a href="/settings/storage?ref=usb" class="btn btn-secondary upgrade-storage">Upgrade Storage</a></li>
						</ul>
					</nav>
					<button class="btn btn-link nav-toggle d-lg-none">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18">
						  <path d="M1,1H23M1,9H23M1,17H23" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2"/>
						</svg>
					</button>
				</div>
			</header>
