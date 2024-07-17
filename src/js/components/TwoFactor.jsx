'use strict';

import { useState } from 'react';
import {log as logger} from '../Log.js';
let log = logger.Logger('TwoFactor');

import { Notifier } from '../Notifier.js';
import { postFormData } from '../ajax.js';
import { Badge, Button, Card, CardBody, Input } from 'reactstrap';

const registerFidoUrl = '/settings/setverificationpreference';
const fidoUrl = '/user/verifymfa';
const setVerificationPrefUrl = '/settings/setverificationpreference';

function SavedSecurityKey(props) {
	const removeKey = async () => {
		log.debug("removeKey");
		log.debug(props);
		if (confirm('Are you sure you want to delete this security key from your account? This may make your account less secure.')) {
			let resp = await postFormData(
				registerFidoUrl,
				{
					verificationMethod: 'u2f',
					u2fAction: 'deleteKey',
					u2fNickname: props.nickname,
					u2fKeyID: props.keyID,
				},
				{method: 'POST', withSession:true}
			);
			let data = await resp.json();
			if(!resp.ok || data.success == false) {
				setNotification({type:'error', message:data.error});
				return;
			}
			window.location.reload();
		}
	};

	let d = new Date(props.dateAdded);

	return (
		<div className='security-key'>
			<span className='security-key-nickname'>{props.nickname}</span>
			<span className='security-key-note'>— registered on {d.toLocaleString()}</span>
			<Button className='btn btn-secondary' onClick={removeKey}>Remove Key</Button>
		</div>
	);
};

function EnabledTag(props) {
	let classes = 'security-enabled-tag';
	let text = '';
	let color;
	if (props.pending) {
		text = 'Pending';
		classes += ' pending';
		color = 'warning';
	} else if(props.enabled) {
		text = 'Enabled';
		classes += ' enabled';
		color = 'success';
	}
	return (
		<Badge color={color} className={classes}>{text}</Badge>
	)
}

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

			props.setPrefResponseData(Object.assign({}, props.prefResponseData, data));

			switch (props.verificationMethod) {
				case 'totp':
					props.removeVerificationRequirement('totp');
					if (data.message) {
						props.setNotification({type: 'success', message: data.message});
					}
					if (data.enabled === false) {
						props.setTOTPVerificationEnabled(false);
					}
					break;
				case 'email':
					props.removeVerificationRequirement('email');
					if (data.message) {
						props.setNotification({type: 'success', message: data.message});
					}
					if (data.enabled === false) {
						props.setEmailVerificationEnabled(false);
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
				<Input type="hidden" name="remember_device" value="0" />
				<Input type="checkbox" name="remember_device" id="remember_device" value="1" className="checkbox" onChange={(evt)=>{setRememberDevice(evt.target.value);}} />
			</label>
			<p className="hint">Don't require two-step verification on this device in the future.</p>
		</li>
	) : null;

	return (
		<div className='verifier-form-container'>
			<form className='verifier-form zform' encType="application/x-www-form-urlencoded" acceptCharset="utf-8" method="post" onSubmit={submitFunc}>
				<ol>
					<li><label htmlFor="verifier_code">Multifactor Code <Input type="text" name="verifier_code" id="verifier_code" maxLength="6" autoFocus="1" value={verifierCode} onChange={(evt)=>{setVerifierCode(evt.target.value);}} /></label>
						<p className="hint">Enter the six digit code from your email or authenticator app</p>
					</li>
					{rememberEl}
					<li>
						<Button className='btn btn-secondary' name="verify_multifactor_submit" id="verify_multifactor_submit" type="submit" value="verify_multifactor_submit">Verify</Button>
						<Button className='btn btn-secondary' name="verify_multifactor_cancel" id="verify_multifactor_cancel" type="submit" value="1" onClick={props.cancel}>Cancel</Button>
					</li>
				</ol>
			</form>
		</div>
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
					message = 'Registration failed. Authenticator may have already been registered for this user.';
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
			// prompt server response
			if (verificationJSON.success) {
				props.setNotification({type:'success', message:'Security Key Registered'});
				window.location.reload();
			} else {
				let message = verificationJSON.message ?? 'Security Key Registration Failed';
				props.setNotification({type:'error', message});
				return;
			}
		} catch (err) {
			log.error(err);
			if (err instanceof Response) {
				let data = await err.json();
				let message = data.message ?? 'Security Key Registration Failed';
				props.setNotification({type:'error', message});
			} else {
				props.setNotification({type:'error', message:'Security Key Registration Failed'});
			}
			return;
		}
	}
	

	return (
		<div id='new-security-key'>
			<form onSubmit={createFidoRegistration}>
				<Input 
					type='text'
					name='nickname'
					placeholder='Security Key Nickname'
					value={newKeyNickname} onChange={(evt) => { setNewKeyNickname(evt.target.value); }} />
				<Button id='create-security-key-button' disabled={(newKeyNickname.length == 0)}>Add Key</Button>
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
	const [editKeys, setEditKeys] = useState(false);
	const [verificationTestRequired, setVerificationTestRequired] = useState(props.verificationTestRequired);
	
	const removeVerificationRequirement = (method) => {
		setVerificationTestRequired(verificationTestRequired.filter((val) => val != method));
	};

	const enableEmail = async () => {
		setVerificationPreference('email', true);
	};
	const disableEmail = async () => {
		if (confirm('Are you sure you want to disable two-step verification using email? This may make your account less secure.')) {
			setVerificationPreference('email', false);
			// removeVerificationRequirement('email');
		}
	}

	const enableTOTP = async () => {
		setVerificationPreference('totp', true);
	};
	const disableTOTP = async () => {
		if (confirm('Are you sure you want to disable two-step verification using an authenticator app? This may make your account less secure.')) {
			setVerificationPreference('totp', false);
			// removeVerificationRequirement('totp');
		}
	}

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
			setPrefResponseData(Object.assign({}, prefResponseData, data));
			setNotification({type:'success', message:data.message});
			switch (verificationMethod) {
				case 'email':
					setEmailVerificationEnabled(enabled);
					if (enabled) {
						setVerificationTestRequired(verificationTestRequired.concat('email'))
					} else {
						removeVerificationRequirement('email');
					}
					break;
				case 'totp':
					setTOTPVerificationEnabled(enabled);
					if (enabled) {
						setVerificationTestRequired(verificationTestRequired.concat('totp'))
					} else {
						removeVerificationRequirement('totp');
					}
					break;
				default:
					throw "Unexpected verificationMethod";
			}
			
		} catch (e) {
			log.error(e);
			setNotification({type:'error', message:'Error updating preferences'});
		}
	};

	let verifierProps = {
		setNotification,
		prefResponseData,
		setPrefResponseData,
		setEmailVerificationEnabled,
		setTOTPVerificationEnabled,
		removeVerificationRequirement,
	};

	let activateTOTPEl = null;
	if (verificationTestRequired.includes('totp') && prefResponseData && prefResponseData['qrDataUrl']) {
		activateTOTPEl = (
			<div id='activate-totp' className='activation-section'>
				<div id='secret-code'>
					<p className='text-center'>Scan the QR code below using your authenticator app, such as Google Authenticator or Microsoft Authenticator.
						After you add the key, enter the generated code to verify and activate 2-step verification.</p>
					<img id='qr-code-img' src={prefResponseData['qrDataUrl']} />
					<br />
					<p id='secret-text'>{prefResponseData['secretText']}</p>
					<VerifierForm {...Object.assign({},verifierProps, {verificationMethod:'totp'})} />
				</div>
			</div>
		);
	}

	let activateEmailEl = null;
	if (verificationTestRequired.includes('email')) {
		activateEmailEl = (
			<div id='activate-email' className='activation-section'>
				<Card>
					<CardBody>
						<div id='secret-code'>
							<p className='text-center'>Email authentication chosen. We've sent a code to {props.primaryEmail}. Enter it below to complete 2-step verification setup.</p>
							<VerifierForm {...Object.assign({},verifierProps, {verificationMethod:'email'})} />
						</div>
					</CardBody>
				</Card>
			</div>
		);
	}

	const savedKeyEls = fidoKeys.map((key) => {
		return <SavedSecurityKey key={key.keyID} {...key} />;
	});

	return (
		<div className='manage-two-factor-container'>
			<Notifier {...notification} />
			<div id='verifications'>
				<div className='verification-method-section' id='email'>
					<h4>Email Authentication</h4><EnabledTag enabled={emailVerificationEnabled} pending={verificationTestRequired.includes('email')} />
					<p>Receive an authentication code emailed to: <span id='user-email'>{props.primaryEmail}</span></p>
					{emailVerificationEnabled|verificationTestRequired.includes('email') ?
							<Button className='btn btn-secondary' id='disable-email-verification-button' onClick={disableEmail}>Disable</Button> :
							<Button className='btn btn-secondary' id='enable-email-button' onClick={enableEmail}>Enable</Button>
						}
					{activateEmailEl}
				</div>
				<div className='verification-method-section' id='totp'>
					<h4>Authenticator App</h4><EnabledTag enabled={TOTPVerificationEnabled} pending={verificationTestRequired.includes('totp')} />
					<p>Use an authenticator app or browser extension to get two-factor authentication codes when prompted.</p>
					{TOTPVerificationEnabled|verificationTestRequired.includes('totp') ?
						<Button className='btn btn-secondary' id='disable-totp-button' onClick={disableTOTP}>Disable</Button> :
						<Button className='btn btn-secondary' id='enable-totp-button' onClick={enableTOTP}>Enable</Button>
					}
					{activateTOTPEl}
				</div>
				<div className='verification-method-section' id='fido'>
					<h4>Security Key</h4><EnabledTag enabled={savedKeyEls.length > 0} />
					{editKeys ? 
						<Button className='btn btn-secondary float-right' onClick={()=>{setEditKeys(false);}}>Hide</Button>
						:<Button className='btn btn-secondary float-right' onClick={()=>{setEditKeys(true);}}>Edit</Button>
					}
					<p>Use a hardware device that can act as your second factor of authentication.</p>
					{editKeys ?
						<div id='edit-security-keys'>
							<div id='saved-security-keys'>
								{savedKeyEls}
							</div>
							<div className='security-key'>
								<Button className='btn btn-secondary' id='show-add-security-key-button' onClick={()=>{setNewKey(true);}}>Register a new security key</Button>
								{newKey ? 
									<RegisterFidoKey {...{setNotification}} />
									: null
								}
							</div>
						</div>
						:null
					}
				</div>
				<div className='recovery-section'>

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
				<Button className='btn btn-secondary' id='begin-u2f-button' onClick={verify}>Use Security Key</Button>
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
