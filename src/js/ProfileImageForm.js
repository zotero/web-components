import { log as logger } from './Log.js';
let log = logger.Logger('ProfileImageForm');

import { CroppedImagePicker, getCroppedImg } from './components/CroppedImagePicker.jsx';

import { postFormData, ajax } from './ajax.js';
import { buildUrl } from './wwwroutes.js';
import { Notifier } from './Notifier.js';
import { useState } from 'react';
import { Button } from 'reactstrap';
import { PropTypes } from 'prop-types';
import { randomString } from './Utils.js';

function ProfileImageForm(props) {
	const { type, entityID } = props;
	const updateUrl = (type == 'group') ? buildUrl('updateGroupImage', { groupID: entityID }) : buildUrl('updateProfileImage');
	
	const [hasImage, setHasImage] = useState(props.hasImage);
	const [changeSuccessful, setChangeSuccessful] = useState(null);
	const [formError, setFormError] = useState(null);

	let value = null;
	if (hasImage) {
		value = type == 'group'
			? buildUrl('groupImage', { groupID: entityID, purpose: 'profile' }) + `?r=${randomString(10)}`
			: buildUrl('profileImage', { userID: entityID, purpose: 'profile' }) + `?r=${randomString(10)}`;
	}
	
	const save = async (imageRef, crop) => {
		let croppedImg = await getCroppedImg(imageRef, crop, 'cropped.jpg');
		let croppedImgFile = new File([croppedImg], 'cropped.jpg');
		let imageFile = croppedImgFile;

		if (imageFile.size > 1000000) {
			setChangeSuccessful(false);
			setFormError('Image too large. Must be less than 1 MB');
			throw new Error('Image too large. Must be less than 1 MB');
		}
		
		try {
			// eslint-disable-next-line camelcase
			let resp = await postFormData(updateUrl, { profile_image: imageFile }, { withSession: true });
			let data = await resp.json();
			if (data.success) {
				setChangeSuccessful(true);
				setHasImage(true);
				let imgSrc = type == 'group'
					? buildUrl('groupImage', { groupID: entityID, purpose: 'profile' }) + `?r=${randomString(10)}`
					: buildUrl('profileImage', { userID: entityID, purpose: 'profile' }) + `?r=${randomString(10)}`;
				return imgSrc;
			} else {
				throw resp;
			}
		} catch (error) {
			setFormError('Failed to upload image');
			throw new Error('Failed to upload image');
		}
	};

	const deleteImage = async () => {
		try {
			let resp = await ajax({ url: updateUrl, type: 'DELETE', withSession: true });
			let data = await resp.json();
			if (data.success) {
				setChangeSuccessful(true);
				setHasImage(false);
				return true;
			} else {
				throw resp;
			}
		} catch (e) {
			log.error(e);
			setChangeSuccessful(false);
			setFormError('There was an error deleting your image');
		}
		return false;
	};
	
	let notifier = null;
	if (changeSuccessful) {
		let message = 'Image updated';
		notifier = <Notifier type='success' message={message} />;
	} else if (formError) {
		notifier = <Notifier type='error' message={formError} />;
	}

	// let image = <ProfileImage hasImage={hasImage} type={type} entityID={entityID} cacheBuster={changeSuccessful} />;

	log.debug(`rendering ProfileImageForm with value ${value}`);
	return (
		<div className='profile-image-form'>
			{notifier}
			<CroppedImagePicker value={value} save={save} deleteImage={deleteImage} crop={{ aspect: 1, unit: '%', width: 100 }}></CroppedImagePicker>
			{hasImage ? <Button color='danger' size='sm' className='mt-1' onClick={deleteImage}>Delete</Button> : null}
		</div>
	);
}
ProfileImageForm.defaultProps = {
	hasImage: 0,
	type: 'user'
};
ProfileImageForm.propTypes = {
	type: PropTypes.oneOf(['user', 'group']),
	hasImage: PropTypes.bool,
	entityID: PropTypes.number,
};


export { ProfileImageForm };
