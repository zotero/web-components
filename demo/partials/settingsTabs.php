<?$s = (empty($selectedTab) ? '' : $selectedTab);?>
<?$navLink = "class='nav-item nav-link'";
$selected = "class='nav-item nav-link active'";?>
<div class="col-lg-2 d-none d-lg-block">
	<h2>Settings</h2>
	<nav id="settings-nav-side" class="nav flex-column nav-pills">
		<a <?=($s=='account') ? $selected : $navLink;?> href="/settings/account">Account</a>
		<a <?=($s=='profile') ? $selected : $navLink;?> href="/settings/profile">Profile</a>
		<a <?=($s=='cv') ? $selected : $navLink;?> href="/settings/cv">C.V.</a>
		<a <?=($s=='privacy') ? $selected : $navLink;?> href="/settings/privacy">Privacy</a>
		<a <?=($s=='notifications') ? $selected : $navLink;?> href="/settings/notifications">Email</a>
		<a <?=($s=='keys') ? $selected : $navLink;?> href="/settings/keys">Feeds/API</a>
		<a <?=($s=='storage') ? $selected : $navLink;?> href="/settings/storage">Storage</a>
	</nav>
</div>

<div class="d-block d-lg-none">
	<h2>Settings</h2>
	<nav id="settings-nav-top" class="nav d-lg-none mb-4">
	<a <?=($s=='account') ? $selected : $navLink;?> href="/settings/account">Account</a>
		<a <?=($s=='profile') ? $selected : $navLink;?> href="/settings/profile">Profile</a>
		<a <?=($s=='cv') ? $selected : $navLink;?> href="/settings/cv">C.V.</a>
		<a <?=($s=='privacy') ? $selected : $navLink;?> href="/settings/privacy">Privacy</a>
		<a <?=($s=='notifications') ? $selected : $navLink;?> href="/settings/notifications">Email</a>
		<a <?=($s=='keys') ? $selected : $navLink;?> href="/settings/keys">Feeds/API</a>
		<a <?=($s=='storage') ? $selected : $navLink;?> href="/settings/storage">Storage</a>
	</nav>
</div>