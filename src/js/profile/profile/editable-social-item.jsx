'use strict';

import EditableField from './editable-field.jsx';

export default class EditableSocialItem extends EditableField {
	constructor(props) {
		super(props);
		this.state = {
			name: this.props.value.name,
			value: this.props.value.value
		}
	}

	focus() {
		this.nameInput.focus();
	}

	save() {
		var updatedItem = {
			name: this.nameInput.value,
			value: this.valueInput.value,
			id: this.props.value.id
		}
	
		this.setState(updatedItem, () => {
			this.props.onUpdate(updatedItem);
		});
	}

	remove() {
		this.props.onDelete(this.props.value.id);
	}

	render() {
		if(this.props.editing) {
			return <form className="profile-editable-social profile-editable-editing form-inline" onSubmit={ ev => this.saveHandler(ev) }>
				<select className="form-control" ref={ ref => this.nameInput = ref} defaultValue={ this.props.value.name } onChange={ ev => this.saveHandler(ev) }>
					{ Object.keys(this.constructor.NETWORKS).map(network => 
						<option value={ network } key={ network }>{ network }</option>
					)}
				</select>
				<input className="form-control" ref={ ref => this.valueInput = ref } defaultValue={ this.props.value.value } onChange={ ev => this.saveHandler(ev) } placeholder={'User name on ' + this.props.value.name} />
				<div className="profile-editable-actions">
					<a className="profile-editable-action" onClick={ () => this.remove() }>
						<span className="glyphicon glyphicon-trash"></span>
					</a>
				</div>
			</form>;
		} else {
			var entry = '';
			if(this.state.value) {
				entry = <a href={this.constructor.NETWORKS[this.props.value.name].getUrl(this.props.value.value)}>
					<span className={this.constructor.NETWORKS[this.props.value.name]['iconClass']}></span>
				</a>
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
	value: React.PropTypes.object,
	editing: React.PropTypes.bool,
	emptytext: React.PropTypes.string,
	onUpdate: React.PropTypes.func,
	onDelete: React.PropTypes.func
}