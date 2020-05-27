
const dataBrowser = [
	{ // new Edge
		string: navigator.userAgent,
		subString: 'Edg/',
		identity: 'Edge'
	}, {
		string: navigator.userAgent,
		subString: 'Chrome',
		identity: 'Chrome'
	}, {
		string: navigator.userAgent,
		subString: 'OmniWeb',
		versionSearch: 'OmniWeb/',
		identity: 'OmniWeb',
	}, {
		string: navigator.vendor,
		subString: 'Apple',
		identity: 'Safari',
		versionSearch: 'Version'
	}, {
		prop: window.opera,
		identity: 'Opera',
		versionSearch: 'Version'
	}, {
		string: navigator.vendor,
		subString: 'iCab',
		identity: 'iCab'
	}, {
		string: navigator.vendor,
		subString: 'KDE',
		identity: 'Konqueror'
	}, {
		string: navigator.userAgent,
		subString: 'Firefox',
		identity: 'Firefox'
	}, {
		string: navigator.vendor,
		subString: 'Camino',
		identity: 'Camino'
	}, { // for newer Netscapes (6+)
		string: navigator.userAgent,
		subString: 'Netscape',
		identity: 'Netscape'
	}, {
		string: navigator.userAgent,
		subString: 'MSIE',
		identity: 'Explorer',
		versionSearch: 'MSIE'
	}, {
		string: navigator.userAgent,
		subString: 'Gecko',
		identity: 'Mozilla',
		versionSearch: 'rv'
	}, { // for older Netscapes (4-)
		string: navigator.userAgent,
		subString: 'Mozilla',
		identity: 'Netscape',
		versionSearch: 'Mozilla'
	}
];
const dataOS = [
	{
		string: navigator.platform,
		subString: 'Win',
		identity: 'Windows'
	}, {
		string: navigator.platform,
		subString: 'Mac',
		identity: 'Mac'
	}, {
		string: navigator.userAgent,
		subString: 'iPhone',
		identity: 'iPhone/iPod'
	}, {
		string: navigator.platform,
		subString: 'Linux',
		identity: 'Linux'
	}
];

class BrowserDetect {
	init() {
		this.browser = this.searchString(dataBrowser) || 'An unknown browser';
		this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || 'an unknown version';
		this.OS = this.searchString(dataOS) || 'an unknown OS';
		// this.oldMac = (this.OS == 'Mac' && navigator.userAgent.includes('OS X 10.6;'));
	}

	searchString(data) {
		for (var i = 0; i < data.length; i++) {
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (dataString.indexOf(data[i].subString) != -1) return data[i].identity;
			} else if (dataProp) return data[i].identity;
		}
		return false;
	}

	searchVersion(dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if (index == -1) return false;

		return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
	}
}

let browserDetect = new BrowserDetect();

if (typeof window == 'undefined') {
	// no browser, just fill in the OS and browser and export that
	browserDetect = {
		OS: 'Windows',
		browser: 'Chrome'
	};
} else {
	browserDetect.init();
	window.BrowserDetect = browserDetect;
}

export { browserDetect as BrowserDetect };
