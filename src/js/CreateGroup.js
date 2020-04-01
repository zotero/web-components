// import {log as logger} from './Log.js';
// let log = logger.Logger('CreateGroup');

import { ajax } from './ajax.js';
import { slugify, readCookie } from './Utils.js';
import { buildUrl } from './wwwroutes.js';
import cn from 'classnames';
import { useState, useEffect } from 'react';
import { CustomInput } from 'reactstrap';
import { LoadingSpinner } from './LoadingSpinner.js';

const config = window.zoteroConfig;

function CreateGroup(_props) {
	const [groupName, setGroupName] = useState('');
	const [selectedType, setSelectedType] = useState('PublicOpen');
	const [checkingName, setCheckingName] = useState(false);
	const [groupNameValid, setGroupNameValid] = useState(null);
	const [preview, setPreview] = useState('');
	const [timer, setTimer] = useState(null);

	useEffect(() => {
		checkName();
	}, [selectedType, groupName]);

	const changeType = (evt) => {
		let newType = evt.currentTarget.getAttribute('data-grouptype');
		setGroupNameValid(null);
		setSelectedType(newType);
	};

	const changeName = (evt) => {
		setGroupNameValid(null);
		setGroupName(evt.target.value);
	};

	const checkName = async () => {
		// update preview URL
		if (selectedType == 'Private') {
			setPreview(`Group URL: ${config.baseZoteroWebsiteUrl}/groups/<number>`);
		} else {
			let slug = slugify(groupName);
			setPreview(`Group URL: ${config.baseZoteroWebsiteUrl}/groups/${slug}`);
		}
		
		clearTimeout(timer);
		let slug = slugify(groupName);
		if (slug.length == 0) {
			setGroupNameValid(false);
			return;
		}
		setCheckingName(true);
		let timeout = setTimeout(async () => {
			if (selectedType != 'Private') {
				// Poll the server with the input value
				const resp = await ajax({ url: buildUrl('checkGroupName', { name: groupName }) });
				const data = await resp.json();
				setGroupNameValid(data.valid);
				setCheckingName(false);
			} else {
				setGroupNameValid(true);
				setCheckingName(false);
			}
		}, 300);
		setTimer(timeout);
	};
	
	let slugStyle = {};
	if (selectedType != 'Private') {
		if (groupNameValid === true) {
			slugStyle.color = 'green';
		} else if (groupNameValid === false) {
			slugStyle.color = 'red';
		}
	}

	let sessionKey = readCookie(config.sessionCookieName);
	if (sessionKey === null) {
		sessionKey = '';
	}
	return (
		<div id='create-group'>
			<h1>Create a New Group</h1>
			<form encType='application/x-www-form-urlencoded' acceptCharset='utf-8' method='post' className='zform' action=''>
				<div className='row'>
					<div className='col-md-6'>
						<div className='form-group'>
							<CustomInput
								className={cn('form-control', 'form-control-lg', { 'is-invalid': (groupNameValid === false), 'is-valid': (groupNameValid === true) })}
								type='text'
								name='name'
								id='groupName'
								placeholder='Group Name'
								onChange={changeName}
								onBlur={checkName}
								value={groupName}>
								<LoadingSpinner loading={checkingName} />
							</CustomInput>

							<label id='slugpreview' style={slugStyle}>{preview}</label>
						</div>
					</div>
				</div>
				<div className='row'>
					<div className='card-deck'>
						<div
							className={cn('card', { selected: (selectedType == 'PublicOpen') })}
							onClick={changeType}
							data-grouptype='PublicOpen'
						>
							<div id='public-open' className='card-body'>
								<h4 className='card-title'>Public, Open Membership</h4>
								<p className='muted small'>Anyone can view your group online and join the group instantly.</p>
								<div className='form-check'>
									<CustomInput name='group_type' type='radio' id='publicopenradio' value='PublicOpen' label='Select public, open membership' checked={selectedType == 'PublicOpen'} />
								</div>
							</div>
						</div>
						<div
							className={cn('card', { selected: (selectedType == 'PublicClosed') })}
							onClick={changeType}
							data-grouptype='PublicClosed'
						>
							<div id='public-closed' className='card-body'>
								<h4 className='card-title'>Public, Closed Membership</h4>
								<p className='muted small'>Anyone can view your group online, but members must apply or be invited.</p>
								<div className='form-check'>
									<CustomInput name='group_type' type='radio' id='publicclosedradio' value='PublicClosed' label='Select public, closed membership' checked={selectedType == 'PublicClosed'} />
								</div>
							</div>
						</div>
						<div
							className={cn('card', { selected: (selectedType == 'Private') })}
							onClick={changeType}
							data-grouptype='Private'
						>
							<div id='private' className='card-body'>
								<h4 className='card-title'>Private Membership</h4>
								<p className='muted small'>Only members can view your group online and must be invited to join.</p>
								<div className='form-check'>
									<CustomInput name='group_type' type='radio' id='privateradio' value='Private' label='Select private membership' checked={selectedType == 'Private'} />
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className='row mt-4'>
					<div className='col'>
						<button name='submit' id='submit' type='submit' className='btn btn-secondary'>Create Group</button>
					</div>
				</div>
				<input type='hidden' name='session' value={sessionKey} />
			</form>
		</div>
	);
}

export { CreateGroup };
