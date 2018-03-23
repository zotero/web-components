'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import EditableBase from '../abstract/editable-base.jsx';
import profileEventSystem from '../profile-event-system.js';
import {PencilIcon, TrashIcon, CheckIcon, XIcon, PlusIcon} from '../../Icons.js';

export default class EditableAvatar extends EditableBase {
	constructor(props) {
		super(props);
		this.state = {
			value: this.props.value,
			editing: false,
			processing: false
		};
	}

	edit() {
		this.setState({
			editing: true,
			previous: this.props.value
		}, () => {
			this.input.click();
		});
	}

	cancel() {
		this.setState({
			editing: false,
			value: this.props.previous
		});
	}

	update() {
		var file = this.input.files[0];
		var reader = new FileReader();
		reader.onload = (changeEv) => {
			this.setState({
				value: changeEv.target.result
			});
		};
		reader.readAsDataURL(file);
	}

	save() {
		var data = new FormData(),
			file = this.input.files[0],
			promise;

		data.append('profile-avatar', file);

		promise = this.updateProfileImageOnServer(data);

		this.setState({
			processing: true
		});

		promise.done(response => {
			this.setState({
				processing: false,
				editing: false,
				value: response.data + `?${Date.now()}`
			});			
		});

		promise.fail(error => {
			profileEventSystem.trigger('alert', {
				level: 'danger',
				message: error.responseJSON ? error.responseJSON.message : 'Failed to upload an image.'
			});
			this.setState({
				processing: false,
				editing: true
			});
		});
	}

	updateProfileImageOnServer(data) {
		return $.ajax({
			url: this.constructor.AVATAR_UPLOAD_HANDLER_URL,
			data: data,
			cache: false,
			contentType: false,
			processData: false,
			type: 'POST'
		});
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
					<input ref={(c) => this.input = c} onChange={ () => this.update() } type="file" />
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