
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
		string: navigator.vendor,
		subString: 'Apple',
		identity: 'Safari',
		versionSearch: 'Version'
	}, {
		string: navigator.userAgent,
		subString: 'Firefox',
		identity: 'Firefox'
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
		string: navigator.userAgentData?.platform ?? navigator.platform,
		subString: 'Win',
		identity: 'Windows'
	}, {
		string: navigator.userAgentData?.platform ?? navigator.platform,
		subString: 'Mac',
		identity: 'Mac'
	}, {
		string: navigator.userAgent,
		subString: 'iPhone',
		identity: 'iOS'
	}, {
		string: navigator.userAgent,
		subString: 'iPad',
		identity: 'iOS'
	}, {
		string: navigator.userAgent,
		subString: 'Android',
		identity: 'Android'
	}, {
		string: navigator.userAgentData?.platform ?? navigator.platform,
		subString: 'Linux',
		identity: 'Linux'
	}
];

const dataArch = [
	{
		string: navigator.userAgentData?.platform ?? navigator.platform,
		subString: 'x86_64',
		identity: 'x86_64',
	}, {
		string: navigator.userAgentData?.platform ?? navigator.platform,
		subString: 'x64',
		identity: 'x64',
	}, {
		string: navigator.userAgentData?.platform ?? navigator.platform,
		subString: 'i686',
		identity: 'i686',
	}, {
		string: navigator.userAgentData?.platform ?? navigator.platform,
		subString: 'x86',
		identity: 'x86',
	}, {
		string: navigator.userAgentData?.platform ?? navigator.platform,
		subString: 'arm',
		identity: 'arm',
	}, 
];

class BrowserDetect {
	init() {
		this.browser = this.searchString(dataBrowser) || 'An unknown browser';
		this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || 'an unknown version';
		this.OS = this.searchString(dataOS) || 'an unknown OS';
		this.arch = this.searchString(dataArch) || 'unknown';
		// this.oldMac = (this.OS == 'Mac' && navigator.userAgent.includes('OS X 10.6;'));
	}

	searchString(data) {
		for (var i = 0; i < data.length; i++) {
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (dataString.toLowerCase().indexOf(data[i].subString.toLowerCase()) != -1) return data[i].identity;
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
