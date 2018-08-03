'use strict';

import {log as logger} from '../../Log.js';
const log = logger.Logger('editable-social-item');

import React from 'react';
const {Fragment} = React;
import PropTypes from 'prop-types';

import {MultipleEditableBase} from '../abstract/editable-base.jsx';
import {PencilIcon, TrashIcon} from '../../Icons.js';
import {Form, CustomInput, Input, Button} from 'reactstrap';


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

class EditableSocial extends MultipleEditableBase {
	constructor(props) {
		super(props);
	}

	handleNameChange = (evt) => {
		let {value} = this.state;
		let index = evt.target.getAttribute('data-index');
		index = parseInt(index, 10);
		value[index].name = evt.target.value;
		this.setState({value});
	}
	handleValueChange = (evt) => {
		let {value} = this.state;
		let index = evt.target.getAttribute('data-index');
		index = parseInt(index, 10);
		value[index].value = evt.target.value;
		this.setState({value});
	}

	handleKeyboard = () => {

	}

	handleBlur = () => {

	}

	render() {
		const {editable} = this.props;
		const {value, editing} = this.state;

		let editNode = null;
		if(editable){
			if(editing){
				editNode = (
					<Fragment>
						<Button outline color='secondary' onClick={this.save} className='ml-2'>Save</Button>{' '}
						<Button outline color='secondary' onClick={this.addEmpty}>Add</Button>
					</Fragment>
				);
			} else {
				editNode = <PencilIcon onClick={this.edit} title="Edit" className='pointer' />;
			}
		}

		let socialNodes = value.map((socialEntry, index) => {
			if(editing) {
				return <Form key={socialEntry.id} inline className="profile-editable-social profile-editable-editing mb-2" onSubmit={this.save}>
					<CustomInput
						type="select"
						id='social-select'
						onChange={this.handleNameChange }
						defaultValue={ socialEntry.name }
						data-index={index}
						clearable='false'
					>
						{ Object.keys(social_networks).map(network => 
							<option value={ network } key={ network }>{ network }</option>
						)}
					</CustomInput>{' '}
					<Input
						defaultValue={ socialEntry.value }
						onChange={ this.handleValueChange }
						data-index={index}
						placeholder={'User name on ' + socialEntry.name}
					/>
					<div className="profile-editable-actions">
						<a className="profile-editable-action" onClick={()=>{this.remove(index);}}>
							<TrashIcon title='Delete' />
						</a>
					</div>
				</Form>;
			} else {
				var entry = '';
				if(this.state.value) {
					entry = <a href={social_networks[socialEntry.name].getUrl(socialEntry.value)}>
						<span className={social_networks[socialEntry.name]['iconClass']}></span>
					</a>;
				} else {
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

EditableSocial.propTypes = {
	value: PropTypes.string,
	field: PropTypes.string.isRequired,
	editable: PropTypes.bool.isRequired,
	template: PropTypes.object.isRequired
}

export {EditableSocial};
