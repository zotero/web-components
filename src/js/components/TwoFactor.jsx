'use strict';

import { useState } from 'react';
import {log as logger} from '../Log.js';
let log = logger.Logger('TwoFactor');

import { Notifier } from '../Notifier.js';
import { postFormData } from '../ajax.js';

const registerFidoUrl = '/settings/setverificationpreference';
const fidoUrl = '/user/authenticateu2f';
const setVerificationPrefUrl = '/settings/setverificationpreference';

function SavedSecurityKey(props) {
	const removeKey = () => {
		//TODO
	};

	return (
		<div className='security-key striped clearfix'>
			<span className='security-key-nickname'>{props.nickname}</span>
			<span className='security-key-note'>— registered on {props.dateAdded}</span>
			<button className='btn btn-secondary float-right' onClick={removeKey}>Remove Key</button>
		</div>
	);
};

function VerifierForm(props) {
	const [verifierCode, setVerifierCode] = useState('');
	const [rememberDevice, setRememberDevice] = useState('0');

	const verifyActivate = async (evt) => {
		evt.preventDefault();
		try {
			let resp = await postFormData(setVerificationPrefUrl,
				{
					verificationMethod: props.verificationMethod,
					verifier_code: verifierCode,
					remember_device: rememberDevice,
				},
				{
					method:'POST',
					withSession: true,
				}
			);

			const data = await resp.json();
			if(!resp.ok || data.success == false) {
				log.error(data.error ?? resp);
				props.setNotification({type: 'error', message: data.error ?? "Error verifying code"});
				return;
			}

			props.setPrefResponseData(data);

			switch (props.verificationMethod) {
				case 'totp':
					if (data.message) {
						props.setNotification({type: 'success', message: data.message});

						if (data.enabled === false) {
							props.setTOTPVerificationEnabled(false);
						}
					}
					break;
				case 'email':
					if (data.message) {
						props.setNotification({type: 'success', message: data.message});
						if (data.enabled === false) {
							props.setEmailVerificationEnabled(false);
						}
					}
			}
		} catch(err) {
			// Error. Inform the user
			log.error(err);
			props.setNotification({type: 'error', message: 'Error verifying code'});
		};
	};
	
	const submitFunc = props.onSubmit || verifyActivate;
	const rememberEl = props.remember ? (
		<li>
			<label for="remember_device">Remember Device
				<input type="hidden" name="remember_device" value="0" />
				<input type="checkbox" name="remember_device" id="remember_device" value="1" className="checkbox" onChange={(evt)=>{setRememberDevice(evt.target.value);}} />
			</label>
			<p className="hint">Don't require two-step verification on this device in the future.</p>
		</li>
	) : null;

	return (
		<form className='verifier-form zform' encType="application/x-www-form-urlencoded" acceptCharset="utf-8" method="post" onSubmit={submitFunc}>
			<ol>
				<li><label htmlFor="verifier_code">Multifactor Code <input type="text" name="verifier_code" id="verifier_code" maxLength="6" autoFocus="1" value={verifierCode} onChange={(evt)=>{setVerifierCode(evt.target.value);}} /></label>
					<p className="hint">Enter the six digit code from your email or authenticator app</p>
				</li>
				{rememberEl}
				<li>
					<button className='btn btn-secondary' name="verify_multifactor_submit" id="verify_multifactor_submit" type="submit" value="verify_multifactor_submit">Verify</button>
					<button className='btn btn-secondary' name="verify_multifactor_cancel" id="verify_multifactor_cancel" type="submit" value="1" onClick={props.cancel}>Cancel</button>
				</li>
			</ol>
		</form>
	);
}

function RegisterFidoKey(props) {
	const [newKeyNickname, setNewKeyNickname] = useState('');

	/**
	 * creates a new FIDO2 registration
	 */
	const createFidoRegistration = async (evt) => {
		evt.preventDefault();
		const nickname = newKeyNickname;
		try {
			// check browser support
			if (!window.SimpleWebAuthnBrowser.browserSupportsWebAuthn()) {
				throw new Error('Browser not supported.');
			}

			let resp = await postFormData(
				registerFidoUrl,
				{
					verificationMethod: 'u2f',
					enabled: '1',
					u2fAction: 'startCreate',
					u2fNickname: nickname
				},
				{method: 'POST', withSession:true}
			);

			let attResp;
			try {
				// Pass the options to the authenticator and wait for a response
				attResp = await window.SimpleWebAuthnBrowser.startRegistration(await resp.json());
			} catch (error) {
				log.error(error);
				let message;
				if (error.name === 'InvalidStateError') {
					message = 'Error: Authenticator was probably already registered by user';
				} else {
					message = error.name;
				}
				props.setNotification({type:'error', message});
				return;
			}

			const verificationResp = await postFormData(
				registerFidoUrl,
				{
					verificationMethod: 'u2f',
					enabled: '1',
					u2fAction: 'processCreate',
					u2fPayload: JSON.stringify(attResp)
				},
				{method:'POST', withSession:true}
			);
			const verificationJSON = await verificationResp.json();
			log.debug(verificationJSON);
			// prompt server response
			if (verificationJSON.success) {
				// reloadServerPreview();
				props.setNotification({type:'success', message:'Authenticator Registered'});
			} else {
				props.setNotification({type:'error', message:'Authenticator Registration Failed'});
				return;
			}
		} catch (err) {
			// reloadServerPreview();
			log.error(err);
			props.setNotification({type:'error', message:'Authenticator Registration Failed'});
			return;
		}
	}
	

	return (
		<div id='new-security-key' className='hidden'>
			<form onSubmit={createFidoRegistration}>
				<input 
					type='text'
					name='nickname'
					placeholder='Security Key Nickname'
					value={newKeyNickname} onChange={(evt) => { setNewKeyNickname(evt.target.value); }} />
				<button id='create-security-key-button' disabled={(newKeyNickname.length == 0)}>Add Key</button>
			</form>
		</div>
	);
}

function ManageTwoFactor(props) {
	log.debug(props);
	const [notification, setNotification] = useState(null);
	const [emailVerificationEnabled, setEmailVerificationEnabled] = useState(props.emailVerificationEnabled);
	const [TOTPVerificationEnabled, setTOTPVerificationEnabled] = useState(props.TOTPVerificationEnabled);
	const [fidoKeys, setFidoKeys] = useState(props.securityKeysSummary);
	const [prefResponseData, setPrefResponseData] = useState(props);
	const [newKey, setNewKey] = useState(false);
	
	/*
	const [qrDataUrl, setQrDataUrl] = useState(props.qrDataUrl);
	const [secretText, setSecretText] = useState(props.secretText);
	const [newTOTPRequired, setNewTOTPRequired] = useState(props.newTOTPRequired);
	const [TOTPVerificationTestRequired, setTOTPVerificationTestRequired] = useState(props.TOTPVerificationTestRequired);
	const [message, setMessage] = useState(props.message);

	this.qrDataUrl = data.qrDataUrl ?? this.qrDataUrl;
	this.secretText = data.secretText ?? this.secretText;
	this.newTOTPRequired = data.newTOTPRequired ?? this.newTOTPRequired;
	this.TOTPVerificationTestRequired = data.TOTPVerificationTestRequired ?? this.TOTPVerificationTestRequired;
	this.message = data.message ?? this.message;
	*/
	const toggleEmail = (evt) => {
		let enable = evt.target.checked;
		setVerificationPreference('totp', enable);
	};

	const toggleTOTP = (evt) => {
		let enable = evt.target.checked;
		setVerificationPreference('totp', enable);
	};

	const setVerificationPreference = async (verificationMethod, enabledVal) => {
		// console.log(`fetching ${config.uploadUrl}`);
		const enabled = enabledVal ? 1 : 0;
		try {
			let resp = await postFormData(setVerificationPrefUrl, {verificationMethod, enabled}, {method:'POST', withSession:true});
			let data = await resp.json();
			if(!resp.ok || data.success == false) {
				setNotification({type:'error', message:data.error});
				return;
			}
			setPrefResponseData(data);
			setNotification({type:'success', message:data.message});
			switch (verificationMethod) {
				case 'email':
					setEmailVerificationEnabled(enabled);
					break;
				case 'totp':
					setTOTPVerificationEnabled(enabled);
					break;
				default:
					throw "Unexpected verificationMethod";
			}
			
		} catch (e) {
			log.error(e);
			setNotification({type:'error', message:'Error updating preferences'});
		}
	};

	let activateTOTPEl = null;
	if (prefResponseData && prefResponseData['qrDataUrl']) {
		activateTOTPEl = (
			<div id='activate-totp' className='activation-section'>
				<div id='secret-code'>
					<p className='text-center'>Scan the QR code below using your authenticator app, such as Google Authenticator or Microsoft Authenticator.
						After you add the key, enter the generated code to verify and activate 2-step verification.</p>
					<img id='qr-code-img' src={prefResponseData['qrDataUrl']} />
					<br />
					<p id='secret-text'>{prefResponseData['secretText']}</p>
					<VerifierForm {...{setNotification, setPrefResponseData, setEmailVerificationEnabled, setTOTPVerificationEnabled, verificationMethod: 'totp'}} />
				</div>
			</div>
		);
	}

	let activateEmailEl = null;
	if (props.verificationTestRequired.includes('email')) {
		activateEmailEl = (
			<div id='activate-email' className='activation-section'>
				<div id='secret-code'>
					<p className='text-center'>Email authentication chosen. We've sent a code to {props.primaryEmail}. Enter it below to complete 2-step verification setup.</p>
					<VerifierForm {...{setNotification, setPrefResponseData, setEmailVerificationEnabled, setTOTPVerificationEnabled, verificationMethod: 'email'}} />
				</div>
			</div>
		);
	}

	const savedKeyEls = fidoKeys.map((key) => {
		return <SavedSecurityKey key={key.keyID} {...key} />;
	});

	return (
		<div>
			<Notifier {...notification} />
			<div id='verifications'>
				<div className='verification-method-section' id='email'>
					<h3>Email Authentication</h3>
					<p>You will receive an authentication code emailed to: <span id='user-email'></span></p>
					<label>
						<input type="checkbox" className='toggle-check' id='email-verification-check' onChange={toggleEmail} checked={emailVerificationEnabled|props.verificationTestRequired.includes('email')} />
						Email Verification
					</label>
					{activateEmailEl}
				</div>
				<div className='verification-method-section' id='totp'>
					<h3>Authenticator App</h3>
					<p>Use an authenticator app or browser extension to get two-factor authentication codes when prompted.</p>
					<label>
						<input type="checkbox" className='toggle-check' id='totp-verification-check' onChange={toggleTOTP} checked={TOTPVerificationEnabled|props.verificationTestRequired.includes('totp')} />
						Authenticator App
					</label>
					{activateTOTPEl}
				</div>
				<div className='verification-method-section' id='totp'>
					<h3>Security Key</h3>
					<p>Use a hardware device that can act as your second factor of authentication.</p>
					<div id='saved-security-keys' className='striped'>
								{savedKeyEls}
					</div>
					<div>
						<button className='btn btn-secondary' id='show-add-security-key-button' onClick={()=>{setNewKey(true);}}>Register a new security key</button>
						{newKey ? 
							<RegisterFidoKey {...{setNotification}} />
							: null
						}
					</div>
					<div id='activate-security-key' className='activation-section hidden'>
					</div>
				</div>
			</div>
		</div>
	);
}
ManageTwoFactor.defaultProps = {
	emailVerificationEnabled: false,
	TOTPVerificationEnabled: false,
	fidoKeys: [],
}

function AppVerifier(props) {

}

function U2FVerifier(props) {
	const [notification, setNotification] = useState(null);
	
	const verify = async () => {
		try {
			const result = await verifyU2F();
			if (result.success) {
				setNotification({type: 'success', message: 'Authenticator Verified'});
				if (props.redirect) {
					let redirectUrl = result.redirectUrl;
					window.setTimeout(() => {
						window.location = redirectUrl;
					}, 750);
				}
			}
		} catch (e) {
			log.error(e);
			setNotification({type:'error', message:'Verification failed'});
		}
	};

	return (
		<div>
			<h2>Security Key</h2>
			<Notifier {...notification} />
			<p>
				When you are ready, authenticate using the button below.
			</p>
			<p>
				<button className='btn btn-secondary' id='begin-u2f-button' onClick={verify}>Use Security Key</button>
			</p>
		</div>
	);
};
U2FVerifier.defaultProps = {
	redirect: true,
};

async function verifyU2F() {
	log.debug('verifyU2F');

	try {
		if (!window.SimpleWebAuthnBrowser.browserSupportsWebAuthn()) {
			throw new Error('Browser not supported.');
		}
		
		// get auth check args
		log.debug('getting authArgs');
		let resp = await postFormData(fidoUrl, {u2fAction: 'startAuth'}, {type:'POST', withSession:true})
		
		let asseResp;
		try {
			// Pass the options to the authenticator and wait for a response
			asseResp = await window.SimpleWebAuthnBrowser.startAuthentication(await resp.json());
		} catch (error) {
			log.debug('error during SimpleWebAuthnBrownser.startAuthentication');
			throw error;
		}

		// log.debug(asseResp);
		
		resp = await postFormData(fidoUrl, {u2fAction: 'processAuth', u2fPayload: JSON.stringify(asseResp)}, {type:'POST', withSession:true});
		// log.debug(resp);
		const authServerResponse = await resp.json();
		// log.debug(authServerResponse);
		
		return authServerResponse;
	} catch (err) {
		// reloadServerPreview();
		log.error(err);
		throw err;
	}
}

export { verifyU2F, U2FVerifier, ManageTwoFactor };
