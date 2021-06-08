<?php
$testData = [];

$testUser1 = new stdClass;
$testUser1->username = 'testUser1';
$testUser1->slug = 'testuser1';
$testUser1->userID = 12345;
$testUser1->unreadMessages = 3;
$testUser1->settings = ['profile_realname'=>'Test User'];
$testUser1->displayName = $testUser1->settings['profile_realname'];
$testUser1->dateSent = '2021-06-03';

$testData['testUser1'] = $testUser1;

$testUser2 = new stdClass;
$testUser2->username = 'testUser2';
$testUser2->slug = 'testuser2';
$testUser2->userID = 5684;
$testUser2->unreadMessages = 15;
$testUser2->settings = ['profile_realname'=>'John Smith'];
$testUser2->displayName = $testUser2->settings['profile_realname'];
$testUser2->dateSent = '2021-06-03';

$testData['testUser2'] = $testUser2;

$testUser3 = new stdClass;
$testUser3->username = 'testUser3';
$testUser3->slug = 'testuser3';
$testUser3->userID = 43587;
$testUser3->unreadMessages = 0;
$testUser3->settings = ['profile_realname'=>'Faolan Cheslack-Postava'];
$testUser3->displayName = $testUser3->settings['profile_realname'];
$testUser3->dateSent = '2021-06-03';

$testData['testUser3'] = $testUser3;

$group370 = new stdClass;
$group370->name = 'disposable';
$group370->groupID = 370;
$group370->hasImage = false;
$group370->owner = 12345;
$group370->type = 'PublicClosed';
$group370->libraryReading = 'members';
$group370->libraryEditing = 'members';
$group370->fileEditing = 'members';

$testData['group_370'] = $group370;

return $testData;