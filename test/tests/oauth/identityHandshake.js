'use strict';

let rp = require('request-promise-native');

const crypto = require('crypto');
const OAuth = require('oauth-1.0a');

var inquirer = require('inquirer');

//without callback so using oob verifier
const consumerKey = 'd78bd174f4e46178e09c';
const consumerSecret = '9bc5c2aaac7895045172';

const oauth = OAuth({
	consumer: { key: consumerKey, secret: consumerSecret},
	signature_method: 'HMAC-SHA1',
	hash_function(base_string, key) {
		return crypto.createHmac('sha1', key).update(base_string).digest('base64');
	}
});

const requestTokenEndpoint = 'https://dockerzotero.test:8081/oauth/request';
const access_token_endpoint = 'https://dockerzotero.test:8081/oauth/access';
const zotero_authorize_endpoint = 'https://dockerzotero.test:8081/oauth/authorize';
const oauthCallback = 'http://localhost/test2callback';

let handshake = async function(){
	let request_data = {
		url: requestTokenEndpoint,
		method: 'POST',
		data: {
			oauth_callback:'oob'
		}
	};
	let d = oauth.authorize(request_data);
	console.log(d);

	//ignore our self-signed cert
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

	let requestToken = [];

	try{
		let resp = await rp({
			url: request_data.url,
			method: request_data.method,
			form: d,
			resolveWithFullResponse:true
		});
		if(resp.statusCode != 200){
			console.log(resp.error);
			throw "Error getting request token";
		}
		let body = resp.body;
		let params = new URLSearchParams(body);
		requestToken['key'] = params.get('oauth_token');
		requestToken['secret'] = params.get('oauth_token_secret');

		let redirectUrl = `${zotero_authorize_endpoint}?oauth_token=${requestToken['key']}&identity=1`;
		console.log(redirectUrl);
	} catch(e){
		console.log(e);
	}
	let answers = await inquirer.prompt([{
		name:'verifier',
		message: 'OAuth Verifier:',
	}]);

	let verifier = answers['verifier'];
	//exchange the verifier for the api key
	try {
		let accessRequestData = {
			url: access_token_endpoint,
			method: 'POST',
			data: {
				oauth_token: requestToken['key'],
				//oauth_token_secret: requestToken['secret'],
				oauth_verifier:verifier
			}
		}
		let d = oauth.authorize(accessRequestData, requestToken);
		console.log(accessRequestData);
		console.log(d);

		let resp = await rp({
			url: accessRequestData.url,
			method: accessRequestData.method,
			form: d,
			resolveWithFullResponse:true
		});
		if(resp.statusCode != 200){
			//console.log(resp.error);
			console.log(resp.body);
			throw "Error getting access token";
		}
		let body = resp.body;
		let params = new URLSearchParams(body);
		console.log(body);

		console.log(`API key is ${params.get('oauth_token')}`);
		console.log(`userID is ${params.get('userID')}`);
		console.log(`username is ${params.get('username')}`);
		
		//let oauthToken = params.get('oauth_token');
		//let oauthTokenSecret = params.get('oauth_token_secret');

	} catch(e){
		console.log('caught access request exception');
		console.log(e);
		//console.log(e);
	}
};

handshake();
