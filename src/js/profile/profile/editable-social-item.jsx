'use strict';

import {log as logger} from '../../Log.js';
let log = logger.Logger('editable-social-item');

import React from 'react';
import PropTypes from 'prop-types';

import EditableField from './editable-field.jsx';
import {TrashIcon} from '../../Icons.js';
import {Form, CustomInput, Input} from 'reactstrap';

export default class EditableSocialItem extends EditableField {
	constructor(props) {
		super(props);
		this.state = {
			name: this.props.value.name || 'ORCID',
			value: this.props.value.value,
			id: this.props.value.id
		};
	}

	focus() {
		//this.nameInput.focus();
	}

	handleNameChange = (evt) => {
		//log.debug(`handleNameChange: ${evt.target.value}`);
		this.setState({name:evt.target.value}, ()=>{this.props.onUpdate(this.state);});
	}
	handleValueChange = (evt) => {
		log.debug(`handleValueChange: ${evt.target.value}`);
		this.setState({value:evt.target.value}, ()=>{this.props.onUpdate(this.state);});
	}
	remove = () => {
		this.props.onDelete(this.props.value.id);
	}

	render() {
		if(this.props.editing) {
			return <Form inline className="profile-editable-social profile-editable-editing">
				<CustomInput
					type="select"
					id='social-select'
					onChange={this.handleNameChange }
					defaultValue={ this.props.value.name }
					clearable='false'
				>
					{ Object.keys(this.constructor.NETWORKS).map(network => 
						<option value={ network } key={ network }>{ network }</option>
					)}
				</CustomInput>
				<Input
					defaultValue={ this.props.value.value }
					onChange={ this.handleValueChange }
					placeholder={'User name on ' + this.props.value.name}
				/>
				<div className="profile-editable-actions">
					<a className="profile-editable-action" onClick={this.remove}>
						<TrashIcon title='Delete' />
					</a>
				</div>
			</Form>;
		} else {
			var entry = '';
			if(this.state.value) {
				entry = <a href={this.constructor.NETWORKS[this.props.value.name].getUrl(this.props.value.value)}>
					<span className={this.constructor.NETWORKS[this.props.value.name]['iconClass']}></span>
				</a>;
			} else {
				entry = this.props.emptytext;
			}

			return <div className="profile-editable-social profile-editable-{this.state.value ? 'value' : 'emptytext'}">
				<span>{ entry }</span>
			</div>;
		}
	}

	static get NETWORKS() {
		return {
			'ORCID': {
				iconClass: 'social social-orcid',
				getUrl: username => {
					return `http://orcid.org/${username}`;
				}
			},
			'Twitter': {
				iconClass: 'social social-twitter',
				getUrl: username => {
					return `https://twitter.com/${username}`;
				}
			},
			'Mendeley': {
				iconClass: 'social social-mendeley',
				getUrl: username => {
					return `https://www.mendeley.com/profiles/${username}`;
				}
			},
			'Facebook': {
				iconClass: 'social social-facebook',
				getUrl: username => {
					return `https://www.facebook.com/${username}`;
				}
			}
		};
	}
}

EditableSocialItem.propTypes = {
	value: PropTypes.object,
	editing: PropTypes.bool,
	emptytext: PropTypes.string,
	onUpdate: PropTypes.func,
	onDelete: PropTypes.func
};
