'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('GroupLibrarySettings');

let React = require('react');
const {Component} = React;

import {RadioGroup, Radio} from './react-radio-group.js';

class GroupLibrarySettings extends Component{
	constructor(props){
		super(props);
		this.state = {
			librarySettings:{
				type:this.props.type,
				libraryReading:this.props.libraryReading,
				libraryEditing:this.props.libraryEditing,
				fileEditing:this.props.fileEditing
			}
		};
		this.changeType = this.changeType.bind(this);
		this.changeReading = this.changeReading.bind(this);
		this.changeEditing = this.changeEditing.bind(this);
		this.changeFileEditing = this.changeFileEditing.bind(this);
	}
	changeType(type){
		let {librarySettings} = this.state;
		if(type == 'PublicOpen'){
			if(!confirm("Changing a group to 'Public Open' will remove all files from Zotero Storage")){
				return;
			}
		}
		if(type == 'Private'){
			if(librarySettings.libraryReading == 'all'){
				if(!confirm("Changing a group to 'Private' will no longer allow it to be read by the public")){
					return;
				} else {
					librarySettings.libraryReading = 'members';
				}
			}
		}
		librarySettings['type'] = type;
		this.setState({librarySettings});
	}
	changeReading(value){
		let {librarySettings} = this.state;
		librarySettings['libraryReading'] = value;
		this.setState({librarySettings});
	}
	changeEditing(value){
		let {librarySettings} = this.state;
		librarySettings['libraryEditing'] = value;
		this.setState({librarySettings});
	}
	changeFileEditing(value){
		let {librarySettings} = this.state;
		librarySettings['fileEditing'] = value;
		this.setState({librarySettings});
	}
	render(){
		const {librarySettings} = this.state;
		const {type, libraryReading, libraryEditing, fileEditing} = librarySettings;
		
		let radioName = 'type';
		let groupTypeRadioNode = (
			<div className="group-type-radio">
				<legend>Group Type</legend>
				<label htmlFor={radioName}>All Groups
					<RadioGroup name={radioName} selectedValue={type} onChange={this.changeType}>
						<label htmlFor={radioName+'-Private'}>
							<Radio value="Private" id={radioName+'-Private'} className="radio" />
							Private
						</label>
						<br />
						<label htmlFor={radioName+'-PublicClosed'}>
							<Radio value="PublicClosed" id={radioName+'-PublicClosed'} className="radio" />
							Public Closed
						</label>
						<br />
						<label htmlFor={radioName+'-Public'}>
							<Radio value="PublicOpen" id={radioName+'-Public'} className="radio" />
							Public Open
						</label>
					</RadioGroup>
				</label>
				<p className="hint">Controls who can see and join your group</p>
			</div>
		);

		radioName = 'libraryReading';
		let readingRadioNode = (
			<div className="library-reading-radio">
				<legend>Library Reading</legend>
				<RadioGroup name={radioName} selectedValue={libraryReading} onChange={this.changeReading}>
					<label htmlFor={radioName+'-all'}>
						<Radio value="all" id={radioName+'-all'} className="radio" disabled={type=='Private' ? 'disabled' : ''} />
						Anyone on the internet
					</label>
					<br />
					<label htmlFor={radioName+'-members'}>
						<Radio value="members" id={radioName+'-members'} className="radio" />
						Any group member
					</label>
				</RadioGroup>
				<p className="hint">Who can see items in this group's library?</p>
			</div>
		);

		radioName = 'libraryEditing';
		let libraryEditingRadioNode = (
			<div className="library-editing-radio">
				<legend>Library Editing</legend>
				<RadioGroup name={radioName} selectedValue={libraryEditing} onChange={this.changeEditing}>
					<label htmlFor={radioName+'-members'}>
						<Radio value="members" id={radioName+'-members'} className="radio" />
						Any group members
					</label>
					<br />
					<label htmlFor={radioName+'-admins'}>
						<Radio value="admins" id={radioName+'-admins'} className="radio" />
						Only group admins
					</label>
				</RadioGroup>
				<p className="hint">Who can add, edit, and remove items from this group's library?</p>
			</div>
		);

		radioName = 'fileEditing';
		let fileEditingRadioNode = (
			<div className="file-editing-radio">
				<legend>File Editing</legend>
				<RadioGroup name={radioName} selectedValue={fileEditing} onChange={this.changeFileEditing}>
					<label htmlFor={radioName+'-members'}>
						<Radio value="members" id={radioName+'-members'} className="radio" />
						Any group members
					</label>
					<br />
					<label htmlFor={radioName+'-admins'}>
						<Radio value="admins" id={radioName+'-admins'} className="radio" />
						Only group admins
					</label>
					<br />
					<label htmlFor={radioName+'-none'}>
						<Radio value="none" id={radioName+'-none'} className="radio" />
						No group file storage
					</label>
				</RadioGroup>
				<p className="hint">Who can work with files stored in the group? Public Open groups cannot have file storage enabled.</p>
			</div>
		);

		return (
			<div>
				<form method='POST'>
					{groupTypeRadioNode}
					{readingRadioNode}
					{libraryEditingRadioNode}
					{fileEditingRadioNode}
					<button className='btn btn-secondary' type='submit'>Save Settings</button>
				</form>
			</div>
		);
	}
}

export {GroupLibrarySettings};
