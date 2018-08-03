'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import {EditableBase} from '../abstract/editable-base.jsx';
import {eventSystem} from '../../EventSystem.js';
import {PencilIcon, TrashIcon, CheckIcon, XIcon, PlusIcon} from '../../Icons.js';
import {postFormData, ajax} from '../../ajax.js';
import {buildUrl} from '../../wwwroutes.js';

let updateUrl = buildUrl('updateProfileImage');

class EditableAvatar extends EditableBase {
	constructor(props) {
		super(props);
		this.state = {
			value: this.props.value,
			editing: false,
			processing: false
		};
		this.fileRef = React.createRef();
	}

	edit() {
		this.setState({
			editing: true,
			previous: this.props.value
		}, () => {
			this.fileRef.current.click();
		});
	}

	cancel() {
		this.setState({
			editing: false,
			value: this.props.previous
		});
	}

	update() {
		var file = this.fileRef.current.files[0];
		var reader = new FileReader();
		reader.onload = (changeEv) => {
			this.setState({
				value: changeEv.target.result
			});
		};
		reader.readAsDataURL(file);
	}

	save = async () => {
		let imageFile = this.fileRef.current.files[0];

		if(imageFile.size > 524288) {
			this.setState({
				processing: false,
				editing: true
			});
			eventSystem.trigger('alert', {
				level: 'danger',
				message: error.responseJSON ? error.responseJSON.message : 'Image too large. Must be less than 512KB'
			});
			return;
		}

		this.setState({
			processing: true
		});

		try{
			let response = await postFormData(updateUrl, {'profile_image': imageFile}, {withSession:true});
			let data = await response.json();
			if(data.success){
				this.setState({
					processing: false,
					editing: false,
					value: response.data + `?${Date.now()}`
				});
			} else {
				this.setState({
					processing: false,
					editing: true
				});
			}
		}
		catch(error){
			eventSystem.trigger('alert', {
				level: 'danger',
				message: error.responseJSON ? error.responseJSON.message : 'Failed to upload an image.'
			});
			this.setState({
				processing: false,
				editing: true
			});
		}
	}

	render() {
		var actions;

		if(this.state.editing) {
			if(this.state.processing) {
				actions = <div className="profile-editable-spinner"></div>;
			} else {
				actions = <div className="profile-editable-actions">
						<a onClick={ () => this.edit() }>
							<PencilIcon />
						</a>
						<a className="profile-editable-action" onClick={ () => this.save() }>
							<CheckIcon />
						</a>
						<a className="profile-editable-action" onClick={ () => this.cancel() }>
							<XIcon />
						</a>
					</div>;
			}
			return (
				<div className="profile-avatar">
					<img className="user-profile-avatar" src={this.state.value} />
					<input ref={this.fileRef} onChange={ () => this.update() } type="file" />
					{ actions }
				</div>
			);
		} else {
			return (
				<div className="profile-avatar">
					<img src={this.state.value || this.constructor.FALLBACK_PORTRAIT} />
					<div className="profile-editable-actions">
						<a className="profile-editable-action" onClick={ () => this.edit() }>
							<PencilIcon />
						</a>
					</div>
				</div>
			);
		}
	}

	static get FALLBACK_PORTRAIT() {
		return '/static/images/theme/portrait-fallback.png';
	}

	static get AVATAR_UPLOAD_HANDLER_URL() {
		return '/settings/profileimage';
	}
}


EditableAvatar.propTypes = {
	value: PropTypes.string
};

export {EditableAvatar};