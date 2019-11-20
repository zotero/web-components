import { useState, useRef } from 'react';
import PropTypes from 'prop-types';

import { eventSystem } from '../EventSystem.js';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import ReactCrop from 'react-image-crop';
import { LoadingSpinner } from '../LoadingSpinner.js';
import { PencilIcon } from '../Icons.js';
import { postFormData, ajax } from '../ajax.js';
import { buildUrl } from '../wwwroutes.js';

let updateUrl = buildUrl('updateProfileImage');

const FALLBACK_PORTRAIT = '/static/images/theme/portrait-fallback.png';
// const AVATAR_UPLOAD_HANDLER_URL = '/settings/profileimage';

function EditableAvatar(props) {
	const [value, setValue] = useState(props.value || FALLBACK_PORTRAIT);
	const [editing, setEditing] = useState(false);
	const [previous, setPrevious] = useState(null);
	const [processing, setProcessing] = useState(false);
	const [crop, setCrop] = useState({ aspect: 1, unit: '%', width: 100 });
	const [cImage, setCImage] = useState(null);
	
	const fileRef = useRef(null);

	const edit = () => {
		setPrevious(props.value);
		// setEditing(true);

		// click file input after changing state, could be problematic based on state updates delays,
		// but can't be moved to useEffect because it must be in response to user-input, which is lost if indirected
		// to useEffect
		fileRef.current.click();
	};

	const cancel = () => {
		setEditing(false);
		setValue(previous);
	};

	const deleteImage = async () => {
		setProcessing(true);
		try {
			let response = await ajax({ type: 'DELETE', url: updateUrl, withSession: true });
			let data = await response.json();
			if (data.success) {
				setProcessing(false);
				setEditing(false);
				setValue(FALLBACK_PORTRAIT);
			} else {
				setProcessing(false);
				setEditing(true);
			}
		} catch (error) {
			eventSystem.trigger('alert', {
				level: 'danger',
				message: error.responseJSON ? error.responseJSON.message : 'Failed to upload an image.'
			});
			setProcessing(false);
			setEditing(true);
		}
	};

	const update = () => {
		setEditing(true);
	};

	const save = async () => {
		let croppedImg = await getCroppedImg(cImage, crop, 'cropped.jpg');
		let croppedImgFile = new File([croppedImg], 'cropped.jpg');
		let imageFile = croppedImgFile;

		if (imageFile.size > 1000000) {
			setProcessing(false);
			setEditing(true);
			eventSystem.trigger('alert', {
				level: 'danger',
				message: 'Image too large. Must be less than 1 MB'
			});
			return;
		}
		
		setProcessing(true);

		try {
			// eslint-disable-next-line camelcase
			let response = await postFormData(updateUrl, { profile_image: imageFile }, { withSession: true });
			let data = await response.json();
			if (data.success) {
				setProcessing(false);
				setEditing(false);
				setValue(data.url + `?${Date.now()}`);
			} else {
				setProcessing(false);
				setEditing(true);
			}
		} catch (error) {
			eventSystem.trigger('alert', {
				level: 'danger',
				message: error.responseJSON ? error.responseJSON.message : 'Failed to upload an image.'
			});
			setProcessing(false);
			setEditing(true);
		}
	};
	
	let file = fileRef.current ? fileRef.current.files[0] : false;

	let cropper = null;
	if (file) {
		let fileUrl = window.URL.createObjectURL(file);
		cropper = <ReactCrop src={fileUrl} crop={crop} onChange={newCrop => setCrop(newCrop)} onImageLoaded={(imgEl) => { setCImage(imgEl); }} />;
	}

	const modal = (
		<Modal isOpen={editing} toggle={cancel}>
			<ModalHeader toggle={cancel}>

			</ModalHeader>
			<ModalBody>
				<div>
					{cropper}
				</div>
			</ModalBody>
			<ModalFooter>
				<Button color='danger' className='mr-8' onClick={deleteImage}>Delete Image</Button>
				<Button onClick={() => { fileRef.current.click(); }}>Choose File...</Button>
				<Button onClick={save}>Save</Button>
				<Button onClick={close}>Cancel</Button>
			</ModalFooter>
		</Modal>
	);

	return (
		<div className='profile-avatar'>
			<img className='user-profile-avatar' src={value} />
			<input ref={fileRef} onChange={ () => update() } type='file' name='profile-avatar-file' id='profile-avatar-file' accept='image/png, image/jpeg' />
			<div className='profile-editable-actions'>
				<LoadingSpinner loading={processing} />
				<a className='profile-editable-action' onClick={ () => edit() }>
					<PencilIcon />
				</a>
			</div>
			{modal}
		</div>
	);
}

EditableAvatar.propTypes = {
	value: PropTypes.string
};

/**
 * @param {HTMLImageElement} image - Image File Object
 * @param {Object} crop - crop Object
 * @param {String} fileName - Name of the returned file in Promise
 */
function getCroppedImg(image, crop, fileName) {
	const canvas = document.createElement('canvas');
	const scaleX = image.naturalWidth / image.width;
	const scaleY = image.naturalHeight / image.height;
	canvas.width = crop.width;
	canvas.height = crop.height;
	const ctx = canvas.getContext('2d');

	ctx.drawImage(
		image,
		crop.x * scaleX,
		crop.y * scaleY,
		crop.width * scaleX,
		crop.height * scaleY,
		0,
		0,
		crop.width,
		crop.height,
	);

	// As Base64 string
	// const base64Image = canvas.toDataURL('image/jpeg');

	// As a blob
	return new Promise((resolve, _) => {
		canvas.toBlob((blob) => {
			blob.name = fileName;
			resolve(blob);
		}, 'image/jpeg', 1);
	});
}

export { EditableAvatar };
