<?php

return [
	"librarySettings" => [
		"allowEdit" => 1,
		"allowUpload" => 1,
		"libraryPathString" => "",
	],
	"baseApiUrl" => 'https://apidev.zotero.org',
	"baseGlobalApiUrl" => 'http://localhost',
	"baseWebsiteUrl" => 'http://localhost:8000',
	"baseFeedUrl" => 'https://apidev.zotero.org',
	"baseZoteroWebsiteUrl" => 'http://localhost:8000',
	"baseDownloadUrl" => 'http://localhost:8000',
	"debugLogEndpoint" => 'https://test.zotero.net/user/submitdebug',
	//"directDownloads" => false,
	"proxyDownloads" => false,
	
	"staticPath" => '/assets',
	"proxyPath" => '',
	"ignoreLoggedInStatus" => false,
	"storePrefsRemote" => false,
	"proxy" => false,
	"sessionAuth" => false,
	"sessionCookieName" => "zotero_www_session_v2",
	"breadcrumbsBase" => [['label' =>'username', 'path' =>'/']],
	"apiKey" => '',
	"apiVersion" => 3,
	"useIndexedDB" => true,
	"preferUrlItem" => false,
	"CORSallowed" => true,
	"locale" => 'en-US',
	"cacheStoreType" => 'localStorage',
	"preloadCachedLibrary" => true,
	"rte" => 'ckeditor',
	"sortOrdering" => [
		'dateAdded' => 'desc',
		'dateModified' => 'desc',
		'date' => 'desc',
		'year' => 'desc',
		'accessDate' => 'desc',
		'title' => 'asc',
		'creator' => 'asc'
	],
	"defaultSortColumn" => 'title',
	"defaultSortOrder" => 'asc',
	"largeFields" => [
		'title' => 1,
		'abstractNote' => 1,
		'extra'  => 1
	],
	"richTextFields" => [
		'note' => 1
	],
	"maxFieldSummaryLength" => ["title" =>60],
	"exportFormats" => [
		"bibtex",
		"bookmarks",
		"mods",
		"refer",
		"rdf_bibliontology",
		"rdf_dc",
		"rdf_zotero",
		"ris",
		"wikipedia"
	],
	"exportFormatsMap" => [
		'bibtex' => 'BibTeX',
		'bookmarks' => 'Bookmarks',
		'mods' => 'MODS',
		'refer' => 'Refer/BibIX',
		'rdf_bibliontology' => 'Bibliontology RDF',
		'rdf_dc' => 'Unqualified Dublin Core RDF',
		'rdf_zotero' => 'Zotero RDF',
		'ris' => 'RIS',
		'wikipedia' => 'Wikipedia Citation Templates',
	],
	"defaultApiArgs" => [
		'order' => 'title',
		'sort' => 'asc',
		'limit' => 50,
		'start' => 0,
		'content' =>'json',
		'format' => 'json'
	],
	"defaultPrefs" => [
		"server_javascript_enabled" => true,
		"debug_level" => 3,
	],
	"recaptchaSitekey" => 'recaptchapublickey',
	"imagePath" => "/assets/images",
	"installData" => [
		"firefoxHash"=>"sha1:4d4c464d351a5c05d19746d271713670fe8939a8",
		"firefoxDownload"=>"https://download.zotero.org/extension/zotero-4.0.29.11.xpi",
		"safariDownloadUrl"=>"https://download.zotero.org/connector/safari/Zotero_Connector-4.0.28-1.safariextz",
		"operaDownloadUrl"=>"",
		"macDownloadUrl"=>"https://download.zotero.org/standalone/4.0.29.15/Zotero-4.0.29.15.dmg",
		"windowsDownloadUrl"=>"https://download.zotero.org/standalone/4.0.29.17/Zotero-4.0.29.17_setup.exe",
		"linux32DownloadUrl"=>"https://download.zotero.org/standalone/4.0.29.10/Zotero-4.0.29.10_linux-i686.tar.bz2",
		"linux64DownloadUrl"=>"https://download.zotero.org/standalone/4.0.29.10/Zotero-4.0.29.10_linux-x86_64.tar.bz2"
	]
];