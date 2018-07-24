'use strict';

import {log as logger} from '../../Log.js';
let log = logger.Logger('editable-social-item');

import React from 'react';
import PropTypes from 'prop-types';

import EditableBase from '../abstract/editable-base.jsx';
import EditableField from './editable-field.jsx';
import {PencilIcon, TrashIcon} from '../../Icons.js';
import {Row, Col, Form, CustomInput, Input, Button} from 'reactstrap';

let social_networks = {
	'ORCID': {
		iconClass: 'social social-orcid',
		getUrl: username => {
			return `http://orcid.org/${username}`;
		}
	},
	'Scopus Author ID': {
		iconClass: 'social social-scopus',
		getUrl: username => {
			return `https://www.scopus.com/authid/detail.uri?authorId=${username}`;
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

class EditableSocial extends EditableBase {
	constructor(props) {
		log.debug(props);
		super(props);
		this.state = {
			value:JSON.parse(props.value),
			addValue:'',
			editing:false,
		};
		this.state.counter = this.state.value.length;
	}

	edit = () => {
		const {value} = this.state;
		this.setState({
			editing:true,
			previous: value.slice(0)
		});
	}

	add = (evt) => {
		evt.preventDefault();
		let {value, addValue, counter} = this.state;
		value.push({interest:addValue, index:counter++});
		this.setState({value, addValue:'', counter});
	}

	remove = (index) => {
		let {value} = this.state;
		value.splice(index, 1);
		this.setState({value});
	}

	save = async () => {
		const {value} = this.state;

		this.setState({
			processing: true,
		});

		try {
			let response = await this.updateFieldOnServer('social', JSON.stringify(value));
			let respdata = await response.json();
			this.setState({
				processing: false,
				editing: false,
				value: JSON.parse(respdata.data['social']),
				previous:value.slice(0)
			});
		} catch (error) {
			log.error(error);
			profileEventSystem.trigger('alert', {
				level: 'danger',
				message: error.responseJSON ? error.responseJSON.message : 'Failed to update items editable'
			});
			this.setState({
				processing: false,
				editing: true,
			});
		}
	}

	cancel = () => {
		const {previous} = this.state;
		this.setState({
			value:previous,
			editing:false,
			processing:false
		});
	}

	handleInputChange = (evt) => {
		this.setState({addValue:evt.target.value});
	}

	handleKeyboard = () => {

	}

	handleBlur = () => {

	}

	render() {
		const {editable} = this.props;
		const {value, editing, addValue} = this.state;
		log.debug(this.state);

		let editNode = null;
		if(editable){
			if(editing){
				editNode = <Button outline color='secondary' onClick={this.save} className='ml-2'>Save</Button>
			} else {
				editNode = <PencilIcon onClick={this.edit} title="Edit" className='pointer' />;
			}
		}

		let socialNodes = value.map((socialEntry) => {
			if(editing) {
				return <Form key={socialEntry.id} inline className="profile-editable-social profile-editable-editing mb-2">
					<CustomInput
						type="select"
						id='social-select'
						onChange={this.handleNameChange }
						defaultValue={ socialEntry.name }
						clearable='false'
					>
						{ Object.keys(social_networks).map(network => 
							<option value={ network } key={ network }>{ network }</option>
						)}
					</CustomInput>{' '}
					<Input
						defaultValue={ socialEntry.value }
						onChange={ this.handleValueChange }
						placeholder={'User name on ' + socialEntry.name}
					/>
					<div className="profile-editable-actions">
						<a className="profile-editable-action" onClick={this.remove}>
							<TrashIcon title='Delete' />
						</a>
					</div>
				</Form>;
			} else {
				var entry = '';
				log.debug('not editing')
				if(this.state.value) {
					log.debug('not editing and have value');
					entry = <a href={social_networks[socialEntry.name].getUrl(socialEntry.value)}>
						<span className={social_networks[socialEntry.name]['iconClass']}></span>
					</a>;
				} else {
					log.debug('not editing and dont have value');
					entry = this.props.emptytext;
				}

				return <div key={socialEntry.id} className="profile-editable-social profile-editable-{this.state.value ? 'value' : 'emptytext'}">
					<span>{ entry }</span>
				</div>;
			}
		});

		return (
			<div className="editable-social">
				{socialNodes}
				{editNode}
			</div>
		);
	}
}

EditableSocial.defaultProps = {
	value: '[]'
};

export {EditableSocial};

class EditableSocialItem extends EditableField {
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
			return <Form inline className="profile-editable-social profile-editable-editing mb-2">
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
				</CustomInput>{' '}
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
			'Scopus Author ID': {
				iconClass: 'social social-scopus',
				getUrl: username => {
					return `https://www.scopus.com/authid/detail.uri?authorId=${username}`;
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
