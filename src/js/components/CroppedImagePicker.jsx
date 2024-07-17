import { log as logger } from '../Log.js';
let log = logger.Logger('CroppedImagePicker');

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Row, Col } from 'reactstrap';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import { LoadingSpinner } from '../LoadingSpinner.js';
import { PencilIcon } from '../Icons.js';

// const FALLBACK_PORTRAIT = '/static/images/theme/portrait-fallback.png';
const FALLBACK_PORTRAIT = '/static/images/settings/profile/default_squarethumb.png';
// const AVATAR_UPLOAD_HANDLER_URL = '/settings/profileimage';

function CroppedImagePicker(props) {
	const [value, setValue] = useState(props.value || FALLBACK_PORTRAIT);
	const [croppedValue, setCroppedValue] = useState(value);
	const [modalOpen, setModalOpen] = useState(false);
	const [previous, setPrevious] = useState(null);
	const [processing, setProcessing] = useState(false);
	const [crop, setCrop] = useState(props.crop || { unit: '%', width: 100, x:25 });
	const [imageRef, setImageRef] = useState(null);
	const [aspect, setAspect] = useState(props.aspect || 1);
	
	const fileRef = useRef(null);

	useEffect(() => {
		onCropComplete(crop);
	}, [imageRef, crop]);

	
	useEffect(() => {
		if(!imageRef) {
			return;
		}

		let crop = centerCrop(
			makeAspectCrop({
				unit: '%',
				width: 100,
			}, 1, imageRef.naturalWidth, imageRef.naturalHeight),
		imageRef.naturalWidth, imageRef.naturalHeight);
		setCrop(crop);
	}, [value, imageRef]);
	
	useEffect(() => {
		// reset state value when props.value is null
		if (props.value === null) {
			setValue(FALLBACK_PORTRAIT);
			setCroppedValue(FALLBACK_PORTRAIT);
		}
	}, [props.value]);

	const edit = () => {
		setPrevious(props.value || FALLBACK_PORTRAIT);

		// click file input after changing state, could be problematic based on state updates delays,
		// but can't be moved to useEffect because it must be in response to user-input, which is lost if indirected
		// to useEffect
		fileRef.current.click();
	};

	const onSelectFile = (evt) => {
		log.debug('onSelectFile');
		if (evt.target.files && evt.target.files.length > 0) {
			const reader = new FileReader();
			reader.addEventListener('load', () => {
				setValue(reader.result);
			});
			reader.addEventListener('error', ()=>{
				log.debug('error event');
			});
			reader.readAsDataURL(evt.target.files[0]);
			setModalOpen(true);
		} else {
			log.debug('no file');
			cancel();
		}
	};

	const onCropComplete = async (crop) => {
		if (imageRef && crop.width && crop.height) {
			if (imageRef.hasAttribute('src') && imageRef.getAttribute('src').startsWith('data:')) {
				// only crop if image is local, otherwise the canvas operation is unsafe (and not very valuable)
				const croppedImageUrl = await getCroppedImgUrl(
					imageRef,
					crop,
					'newFile.jpeg'
				);
				setCroppedValue(croppedImageUrl);
			}
		}
	};

	const cancel = () => {
		setModalOpen(false);
		setValue(previous);
		setCroppedValue(previous);
	};

	const deleteImage = async () => {
		setProcessing(true);
		try {
			let success = await props.deleteImage();
			if (success) {
				setModalOpen(false);
				setValue(FALLBACK_PORTRAIT);
				setCroppedValue(FALLBACK_PORTRAIT);
			} else {

			}
		} catch (e) {
			log.error('Exception when deleting image');
		}
		setProcessing(false);
	};

	const save = async () => {
		setProcessing(true);
		try {
			let success = await props.save(imageRef, crop);
			if (success) {
				const newV = success;
				setValue(newV);
				setCroppedValue(newV);
				setModalOpen(false);
			}
		} catch (e) {
			log.error('Exception when saving image');
		}
		setProcessing(false);
	};

	let cropper = null;
	if (value) {
		// let fileUrl = window.URL.createObjectURL(file);
		cropper = (<ReactCrop
			src={value}
			crop={crop}
			aspect={aspect}
			onChange={(crop, percentCrop) => setCrop(crop)} >
			<img src={value} onLoad={(e) => { setImageRef(e.currentTarget); onCropComplete(crop); }} />
		</ReactCrop>);
	}

	const modal = (
		<Modal isOpen={modalOpen} toggle={cancel}>
			<ModalHeader toggle={cancel}>

			</ModalHeader>
			<ModalBody>
				<div>
					{cropper}
				</div>
			</ModalBody>
			<ModalFooter>
				<Button outline size='sm' onClick={save}>Save</Button>
				<Button outline size='sm' color='danger' onClick={cancel}>Cancel</Button>
			</ModalFooter>
		</Modal>
	);

	return (
		<div className='profile-avatar'>
			<Row>
				<Col>
					<img className='user-profile-avatar' src={croppedValue} />
				</Col>
			</Row>
			<Row>
				<Col>
					<Button outline color='secondary' size='sm' className='mt-1 mx-1' onClick={ () => edit() }>Upload</Button>
				</Col>
				<Col>
					{props.hasImage ? <Button outline color='danger' size='sm' className='mt-1 mx-1' onClick={deleteImage}>Remove</Button> : null}
				</Col>
			</Row>
			<input ref={fileRef} onChange={onSelectFile} type='file' name='profile-avatar-file' id='profile-avatar-file' accept='image/png, image/jpeg' />
			{modal}
		</div>
	);
}

CroppedImagePicker.propTypes = {
	value: PropTypes.string,
	crop: PropTypes.object,
	save: PropTypes.func.isRequired,
	deleteImage: PropTypes.func.isRequired,
};

/**
 * @param {HTMLImageElement} image - Image File Object
 * @param {Object} crop - crop Object
 * @param {String} fileName - Name of the returned file in Promise
 */
async function getCroppedImg(image, crop, fileName) {
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
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob == null) {
				reject("canvas.toBlob passed null. Could not create image.");
			}
			blob.name = fileName;
			resolve(blob);
		}, 'image/jpeg', 1);
	});
}

async function getCroppedImgUrl(image, crop, fileName) {
	const blob = await getCroppedImg(image, crop, fileName);
	const fileUrl = window.URL.createObjectURL(blob);
	return fileUrl;
}

export { CroppedImagePicker, getCroppedImg, getCroppedImgUrl };
