'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('ProfileImageForm');

import {postFormData, ajax} from './ajax.js';
import {buildUrl} from './wwwroutes.js';
import {Notifier} from './Notifier.js';
import {useState, createRef} from 'react';
import {PropTypes} from 'prop-types';
import {Button} from 'reactstrap';
import { randomString } from './Utils.js';

function EmptyImage(props){
	const {width, height} = props;
	let style = {
		'backgroundColor':'#CCC',
		width,
		height
	};
	return <div className='profile-image-placeholder' style={style}></div>;
}
EmptyImage.defaultProps = {
	width: '150px',
	height: '150px'
};
EmptyImage.propTypes = {
	width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	height: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};


function ProfileImage(props){
	const {type, hasImage, purpose, entityID, width, height, usePlaceholder, cacheBuster} = props;
	const style = {
		width,
		height
	};
	
	let imgSrc = null;
	if(!hasImage){
		if(usePlaceholder){
			return <EmptyImage width={width} height={height} />;
		} else {
			return null;
		}
	}
	if(type == 'user'){
		imgSrc = hasImage ? buildUrl('profileImage', {userID: entityID, 'purpose':purpose}) : buildUrl('profileImage', {'purpose':purpose});
	} else if(type == 'group'){
		imgSrc = hasImage ? buildUrl('groupImage', {groupID: entityID, 'purpose': purpose}) : '';
	}
	if(cacheBuster){
		imgSrc += `?r=${randomString(10)}`;
	}
	return <img src={imgSrc} style={style} />;
}
ProfileImage.defaultProps = {
	width: '150px',
	height: '150px',
	usePlaceholder:true
};
ProfileImage.propTypes = {
	type: PropTypes.oneOf(['user', 'group']),
	hasImage: PropTypes.bool,
	purpose: PropTypes.oneOf(['thumb', 'original', 'profile']),
	entityID: PropTypes.number,
	width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	usePlaceholder: PropTypes.bool,
	cacheBuster: PropTypes.bool
};

function ProfileImageForm(props){
	const {type, entityID} = props;
	const updateUrl = (type == 'group') ? buildUrl('updateGroupImage', {'groupID':entityID}) : buildUrl('updateProfileImage');
	
	const [hasImage, setHasImage] = useState(props.hasImage);
	const [changeSuccessful, setChangeSuccessful] = useState(null);
	const [formError, setFormError] = useState(null);
	
	const fileInputRef = createRef('imageFileInput');
	
	const updateImage = async (evt) => {
		let imageFile = evt.target.files[0];
		if(imageFile.size > 1048576) {
			setChangeSuccessful(false);
			setFormError('Image too large. Must be less than 1 MB');
			return;
		}

		try{
			let resp = await postFormData(updateUrl, {'profile_image': imageFile}, {withSession:true});
			let data = await resp.json();
			if(data.success){
				setChangeSuccessful(true);
				setHasImage(true);
			} else {
				throw resp;
			}
		} catch (e) {
			log.error(e);
			setChangeSuccessful(false);
			setFormError('There was an error updating your image');
		}
	};
	const deleteImage = async () => {
		try {
			let resp = await ajax({url:updateUrl, type:'DELETE', withSession:true});
			let data = await resp.json();
			if(data.success){
				setChangeSuccessful(true);
				setHasImage(false);
			} else {
				throw resp;
			}
		} catch (e) {
			log.error(e);
			setChangeSuccessful(false);
			setFormError('There was an error deleting your image');
		}
	};
	const chooseFile = () => {
		fileInputRef.current.click();
	};
	
	let notifier = null;
	if(changeSuccessful){
		let message = 'Image updated';
		notifier = <Notifier type='success' message={message} />;
	} else if(formError){
		notifier = <Notifier type='error' message={formError} />;
	}

	let image = <ProfileImage hasImage={hasImage} type={type} entityID={entityID} cacheBuster={changeSuccessful} />;

	return (
		<div className='profile-image-form'>
			<label htmlFor='imageFileInput'>Profile Image</label>
			{notifier}
			{image}
			<div>
				<input className='d-none' type='file' id='imageFileInput' ref={fileInputRef} onChange={updateImage} />
				<Button color='secondary' size='sm' className='mt-1' onClick={chooseFile}>Choose Image</Button>
				{hasImage ? <Button color='danger' size='sm' className='mt-1' onClick={deleteImage}>Delete</Button> : null}
			</div>
		</div>
	);
}
ProfileImageForm.defaultProps = {
	hasImage: 0,
	type:'user'
};
ProfileImageForm.propTypes = {
	type: PropTypes.oneOf(['user', 'group']),
	hasImage: PropTypes.bool,
	entityID: PropTypes.number,
};


export {ProfileImageForm, ProfileImage};