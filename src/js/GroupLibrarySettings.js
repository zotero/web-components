'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('GroupLibrarySettings');

let React = require('react');
const {Component} = React;

import {RadioGroup, Radio} from './react-radio-group.js';
import {BatchDelete} from './BatchDelete.jsx';
import { postFormData } from './ajax.js';
import {loadAttachmentItems} from './ajaxHelpers.js';
import { jsError } from './Utils.js';

//Deletion of attachments is required if group type is PublicOpen or if fileEditing is set to 'none'
class GroupLibrarySettings extends Component{
	constructor(props){
		super(props);
		this.state = {
			librarySettings:{
				type:this.props.type,
				libraryReading:this.props.libraryReading,
				libraryEditing:this.props.libraryEditing,
				fileEditing:this.props.fileEditing
			},
			deletionRequired:false,
			fileSettingsChanged:false
		};
	}
	changeType = (type) => {
		let {librarySettings} = this.state;
		if(type == 'PublicOpen'){
			if(!confirm("Changing a group to 'Public Open' will disallow storing of files for the group. Before settings can be applied, all file attachments for the gorup will be deleted")){
				return;
			} else {
				librarySettings['fileEditing'] = 'none';
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
		this.setState({librarySettings, fileSettingsChanged:true});
	}
	changeReading = (value) => {
		let {librarySettings} = this.state;
		librarySettings['libraryReading'] = value;
		this.setState({librarySettings});
	}
	changeEditing = (value) => {
		let {librarySettings} = this.state;
		librarySettings['libraryEditing'] = value;
		this.setState({librarySettings});
	}
	changeFileEditing = (value) => {
		let {librarySettings} = this.state;
		librarySettings['fileEditing'] = value;
		this.setState({librarySettings, fileSettingsChanged:true});
	}
	submitForm = async () => {
		//after verifying, if deletion is required, that there are no attachments, submit the form
		let {librarySettings} = this.state;
		let {groupID} = this.props;

		let resp = await loadAttachmentItems(groupID, 0);
		let totalResults = parseInt(resp.headers.get('Total-Results'));
		if(totalResults == 0){
			try{
				let settingsResp = await postFormData(`/group/updatesettings?groupID=${groupID}&settingsType=library`, librarySettings, {withSession:true});
				if(settingsResp.ok){
					window.location.reload();
				}
			} catch(e){
				jsError('Error saving settings');
			}
		}
	}
	render(){
		const {librarySettings, fileSettingsChanged} = this.state;
		const {type, libraryReading, libraryEditing, fileEditing} = librarySettings;
		const {groupID} = this.props;
		const originalFileEditing = this.props.fileEditing;

		let batchDelete = null;
		let deletionRequired = (originalFileEditing != 'none') && ((type == 'PublicOpen') || (fileEditing == 'none'));
		if(fileSettingsChanged && deletionRequired){
			batchDelete = <BatchDelete groupID={groupID} save={this.submitForm} />;
		}

		let radioName = 'type';
		let groupTypeRadioNode = (
			<div className="group-type-radio">
				<legend>Group Type</legend>
				<label htmlFor={radioName}>All Groups
					<RadioGroup name={radioName} selectedValue={type} onChange={this.changeType}>
						<label>
							<Radio value="Private" className="radio" />
							Private
						</label>
						<br />
						<label>
							<Radio value="PublicClosed" className="radio" />
							Public Closed
						</label>
						<br />
						<label>
							<Radio value="PublicOpen" className="radio" />
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
					<label>
						<Radio value="all" className="radio" disabled={type=='Private' ? 'disabled' : ''} />
						Anyone on the internet
					</label>
					<br />
					<label>
						<Radio value="members" className="radio" />
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
					<label>
						<Radio value="members" className="radio" />
						Any group members
					</label>
					<br />
					<label>
						<Radio value="admins" className="radio" />
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
					<label>
						<Radio value="members" className="radio" disabled={type == 'PublicOpen'} />
						Any group members
					</label>
					<br />
					<label>
						<Radio value="admins" className="radio" disabled={type == 'PublicOpen'} />
						Only group admins
					</label>
					<br />
					<label>
						<Radio value="none" className="radio" disabled={type == 'PublicOpen'} />
						No group file storage
					</label>
				</RadioGroup>
				<p className="hint">Who can work with files stored in the group? Public Open groups cannot have file storage enabled.</p>
			</div>
		);

		return (
			<div>
				<div className='group-type'>
					{groupTypeRadioNode}
				</div>
				{readingRadioNode}
				{libraryEditingRadioNode}
				{fileEditingRadioNode}
				{(deletionRequired && fileSettingsChanged) ? batchDelete : <button onClick={this.submitForm}>Save Settings</button>}
			</div>
		);
	}
}

export {GroupLibrarySettings};
