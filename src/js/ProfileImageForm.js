'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('ProfileImageForm');

import {postFormData, ajax} from './ajax.js';
import {getCurrentUser} from './Utils.js';
import {buildUrl} from './wwwroutes.js';
import {Notifier} from './Notifier.js';

let React = require('react');

const currentUser = getCurrentUser();
const config = window.zoteroConfig;

class EmptyImage extends React.Component{
	render(){
		let style = {
			 'backgroundColor':'#CCC',
			 'width': this.props.width,
			 'height': this.props.height,
		};
		return (
			<div className='profile-image-placeholder' style={style}>
			</div>
		)
	}
}
EmptyImage.defaultProps = {
	width: '150px',
	height: '150px'
};

class ProfileImage extends React.Component{
	constructor(props){
		super(props);
	}
	render(){
		let {type, hasImage, purpose, entityID, width, height, usePlaceholder} = this.props;
		let style = {
			'width': this.props.width,
			'height': this.props.height,
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
		return <img src={imgSrc} />
	}
}
ProfileImage.defaultProps = {
	width: '150px',
	height: '150px',
	usePlaceholder:true
};

class ProfileImageForm extends React.Component{
	constructor(props){
		super(props);
		let updateUrl = buildUrl('updateProfileImage');
		if(props.type == 'group'){
			updateUrl = buildUrl('updateGroupImage', {'groupID':props.entityID});
		}
		this.state = {
			hasImage: props.hasImage,
			updateUrl: updateUrl
		};
		this.chooseFile = this.chooseFile.bind(this);
		this.updateImage = this.updateImage.bind(this);
		this.deleteImage = this.deleteImage.bind(this);
	}
	updateImage() {
		const {updateUrl} = this.state;
		let imageFile = this.refs.imageFileInput.files[0];
		if(imageFile.size > 524288) {
			this.setState({
				changeSuccessful:false,
				formError:'Image too large. Must be less than 512KB'
			});
			return;
		}

		postFormData(updateUrl, {'profile_image': imageFile}, {withSession:true}).then((response)=>{
			response.json().then((data)=>{
				if(data.success){
					this.setState({
						changeSuccessful:true,
						hasImage:true
					});
				} else {
					this.setState({
						changeSuccessful:false,
						formError:'There was an error updating your image'
					});
				}
			});
		}).catch((response)=>{
			this.setState({
				changeSuccessful:false,
				formError:'There was an error updating your image'
			});
		});
	}
	deleteImage() {
		const {updateUrl} = this.state;
		ajax({url:updateUrl, type:'DELETE', withSession:true}).then((resp)=>{
			resp.json().then((data) => {
				if(data.success){
					this.setState({
						changeSuccessful:true,
						hasImage: false
					});
				} else {
					this.setState({
						changeSuccessful:false,
						formError:'There was an error deleting your image'
					});
				}
			});
		}).catch((response)=>{
			this.setState({
				changeSuccessful:false,
				formError:'There was an error deleting your image'
			});
		});
	}
	chooseFile() {
		this.refs.imageFileInput.click();
	}
	render() {
		const {hasImage, changeSuccessful, formError} = this.state;
		const {type, entityID} = this.props;

		let notifier = null;
		if(changeSuccessful){
			let message = 'Image updated';
			notifier = <Notifier type='success' message={message} />;
		} else if(formError){
			notifier = <Notifier type='error' message={formError} />;
		}

		let image = <ProfileImage hasImage={hasImage} type={type} entityID={entityID} />

		let updateButton = <button className='btn btn-secondary' onClick={this.chooseFile}>Choose Image</button>;
		return (
			<div className='profile-image-form'>
				<label htmlFor='imageFileInput'>Profile Image</label>
				{notifier}
				{image}
				<div>
					<input className='d-none' type='file' id='imageFileInput' ref='imageFileInput' onChange={this.updateImage} />
					{updateButton}
					<button className={!hasImage?'d-none':'btn btn-secondary'} onClick={this.deleteImage}>Delete</button>
				</div>
			</div>
		);
	}
}
ProfileImageForm.defaultProps = {
	hasImage: 0,
	type:'user'
}

export {ProfileImageForm, ProfileImage};