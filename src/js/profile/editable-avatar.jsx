// import { log as logger } from '../Log.js';
// let log = logger.Logger('EditableAvatar');

import { CroppedImagePicker, getCroppedImg } from '../components/CroppedImagePicker.jsx';

// import PropTypes from 'prop-types';

import { eventSystem } from '../EventSystem.js';
import { postFormData, ajax } from '../ajax.js';
import { buildUrl } from '../wwwroutes.js';

let updateUrl = buildUrl('updateProfileImage');

// const AVATAR_UPLOAD_HANDLER_URL = '/settings/profileimage';

function EditableAvatar(props) {
	const save = async (imageRef, crop) => {
		let croppedImg = await getCroppedImg(imageRef, crop, 'cropped.jpg');
		let croppedImgFile = new File([croppedImg], 'cropped.jpg');
		let imageFile = croppedImgFile;

		if (imageFile.size > 1000000) {
			eventSystem.trigger('alert', {
				level: 'danger',
				message: 'Image too large. Must be less than 1 MB'
			});
			throw new Error('Image too large. Must be less than 1 MB');
		}
		
		try {
			// eslint-disable-next-line camelcase
			let response = await postFormData(updateUrl, { profile_image: imageFile }, { withSession: true });
			let data = await response.json();
			if (data.success) {
				const newV = data.url + `?${Date.now()}`;
				return newV;
			} else {
				throw new Error('Failed to upload image');
			}
		} catch (error) {
			eventSystem.trigger('alert', {
				level: 'danger',
				message: error.responseJSON ? error.responseJSON.message : 'Failed to upload an image.'
			});
			throw new Error('Failed to upload image');
		}
	};

	const deleteImage = async () => {
		try {
			let response = await ajax({ type: 'DELETE', url: updateUrl, withSession: true });
			let data = await response.json();
			if (data.success) {
				return true;
			} else {
				return false;
			}
		} catch (error) {
			eventSystem.trigger('alert', {
				level: 'danger',
				message: error.responseJSON ? error.responseJSON.message : 'Failed to upload an image.'
			});
			return false;
		}
	};
	
	return (<CroppedImagePicker {...props} save={save} deleteImage={deleteImage} crop={{ aspect: 1, unit: '%', width: 100 }}></CroppedImagePicker>);
}

export { EditableAvatar };
