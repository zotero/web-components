<?$s = (empty($selectedTab) ? '' : $selectedTab);?>
<?$navLink = "class='nav-item nav-link'";
$selected = "class='nav-item nav-link active'";
$profileSettings = "/demo/groupsettings.php";
$memberSettings = "/demo/groupmembersettings.php";
$librarySettings = "/demo/grouplibrarysettings.php";
$ownerSettings = "/demo/groupownersettings.php";
?>
<nav id="settings-nav" class="nav flex-column nav-pills">
	<a <?=($s=='profile') ? $selected : $navLink;?> href="<?=$profileSettings?>">Profile</a>
	<a <?=($s=='members') ? $selected : $navLink;?> href="<?=$memberSettings?>">Members</a>
	<a <?=($s=='library') ? $selected : $navLink;?> href="<?=$librarySettings?>">Library</a>
	<?if($group->owner == $user->userID):?>
		<a <?=($s=='owner') ? $selected : $navLink;?> href="<?=$ownerSettings?>">Owner</a>
	<?endif;?>
</nav>
