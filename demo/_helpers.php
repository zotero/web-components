<?php
$helpers = new Std_Object();

//helper that in production returns a timestamped version of a static asset that busts caches,
//but apache understands to point to the unversioned asset filename.
$helpers->version = function($path){
	return "../assets{$path}";
};

