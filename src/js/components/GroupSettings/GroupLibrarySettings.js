// import {log as logger} from './Log.js';
// let log = logger.Logger('GroupLibrarySettings');

import { useState, useEffect } from 'react';

import { Button } from 'reactstrap';
import { RadioGroup, Radio } from '../../react-radio-group.js';
import { BatchDelete } from './BatchDelete.jsx';
import { postFormData } from '../../ajax.js';
import { loadAttachmentItems } from '../../ajaxHelpers.js';
import { Notifier } from '../../Notifier.js';

// Deletion of attachments is required if group type is PublicOpen or if fileEditing is set to 'none'
function GroupLibrarySettings (props) {
	const { groupID } = props;
	const originalFileEditing = props.fileEditing;

	const [librarySettings, setLibrarySettings] = useState({
		type: props.type,
		libraryReading: props.libraryReading,
		libraryEditing: props.libraryEditing,
		fileEditing: props.fileEditing
	});
	const [deletionRequired, setDeletionRequired] = useState(false);
	const [fileSettingsChanged, setFileSettingsChanged] = useState(false);
	const [notification, setNotification] = useState(null);

	const changeType = (type) => {
		let newLibrarySettings = Object.assign({}, librarySettings);
		if (type == 'PublicOpen') {
			if (!confirm("Changing a group to 'Public Open' will disallow storing of files for the group. Before settings can be applied, all file attachments for the gorup will be deleted")) {
				return;
			} else {
				newLibrarySettings.fileEditing = 'none';
			}
		}
		if (type == 'Private') {
			if (newLibrarySettings.libraryReading == 'all') {
				if (!confirm("Changing a group to 'Private' will no longer allow it to be read by the public")) {
					return;
				} else {
					newLibrarySettings.libraryReading = 'members';
				}
			}
		}
		newLibrarySettings.type = type;
		setLibrarySettings(newLibrarySettings);
		setFileSettingsChanged(true);
	};

	const changeReading = (value) => {
		let newLibrarySettings = Object.assign({}, librarySettings);
		newLibrarySettings.libraryReading = value;
		setLibrarySettings(newLibrarySettings);
	};

	const changeEditing = (value) => {
		let newLibrarySettings = Object.assign({}, librarySettings);
		newLibrarySettings.libraryEditing = value;
		setLibrarySettings(newLibrarySettings);
	};

	const changeFileEditing = (value) => {
		let newLibrarySettings = Object.assign({}, librarySettings);
		newLibrarySettings.fileEditing = value;
		setLibrarySettings(newLibrarySettings);
		setFileSettingsChanged(true);
	};

	const submitForm = async () => {
		// after verifying, if deletion is required, that there are no attachments, submit the form
		let resp = await loadAttachmentItems(groupID, 0);
		let totalResults = parseInt(resp.headers.get('Total-Results'));
		if (totalResults == 0) {
			try {
				let settingsResp = await postFormData(`/group/updatesettings?groupID=${groupID}&settingsType=library`, librarySettings, { withSession: true });
				if (settingsResp.ok) {
					let data = await settingsResp.json();
					if (data.success) {
						setNotification({ type: 'success', message: 'Settings saved' });
						window.location.reload();
						return;
					} else if (data.message) {
						setNotification({ type: 'error', message: data.message });
						return;
					}
				}
				setNotification({ type: 'error', message: 'Error saving settings'});
			} catch (e) {
				setNotification({ type: 'error', message: 'Error saving settings' });
			}
		} else {
			setNotification({ type: 'error', message: 'Error saving settings. Not all attachments have been deleted.' });
		}
	};

	const { type, libraryReading, libraryEditing, fileEditing } = librarySettings;
	
	let batchDelete = null;
	
	// set deletionRequired flag if type and fileEditing change and now require it
	useEffect(() => {
		if ((originalFileEditing != 'none') && ((type == 'PublicOpen') || (fileEditing == 'none'))) {
			setDeletionRequired(true);
		}
	}, [originalFileEditing, type, fileEditing]);
	
	if (fileSettingsChanged && deletionRequired) {
		batchDelete = <BatchDelete groupID={groupID} save={submitForm} />;
	}

	let notifier = <Notifier {...notification} />;

	let groupTypeRadioNode = (
		<div className='group-type-radio'>
			<legend>Group Type</legend>
			<RadioGroup name='type' selectedValue={type} onChange={changeType}>
				<label>
					<Radio value='Private' className='radio' />
					Private
				</label>
				<br />
				<label>
					<Radio value='PublicClosed' className='radio' />
					Public Closed
				</label>
				<br />
				<label>
					<Radio value='PublicOpen' className='radio' />
					Public Open
				</label>
			</RadioGroup>
			<p className='hint'>Controls who can see and join your group</p>
		</div>
	);

	let readingRadioNode = (
		<div className='library-reading-radio'>
			<legend>Library Reading</legend>
			<RadioGroup name='libraryReading' selectedValue={libraryReading} onChange={changeReading}>
				<label>
					<Radio value='all' className='radio' disabled={type == 'Private' ? 'disabled' : ''} />
					Anyone on the internet
				</label>
				<br />
				<label>
					<Radio value='members' className='radio' />
					Any group member
				</label>
			</RadioGroup>
			<p className='hint'>Who can see items in this group&apos;s library?</p>
		</div>
	);

	let libraryEditingRadioNode = (
		<div className='library-editing-radio'>
			<legend>Library Editing</legend>
			<RadioGroup name='libraryEditing' selectedValue={libraryEditing} onChange={changeEditing}>
				<label>
					<Radio value='members' className='radio' />
					Any group members
				</label>
				<br />
				<label>
					<Radio value='admins' className='radio' />
					Only group admins
				</label>
			</RadioGroup>
			<p className='hint'>Who can add, edit, and remove items from this group&apos;s library?</p>
		</div>
	);

	let fileEditingRadioNode = (
		<div className='file-editing-radio'>
			<legend>File Editing</legend>
			<RadioGroup name='fileEditing' selectedValue={fileEditing} onChange={changeFileEditing}>
				<label>
					<Radio value='members' className='radio' disabled={type == 'PublicOpen'} />
					Any group members
				</label>
				<br />
				<label>
					<Radio value='admins' className='radio' disabled={type == 'PublicOpen'} />
					Only group admins
				</label>
				<br />
				<label>
					<Radio value='none' className='radio' disabled={type == 'PublicOpen'} />
					No group file storage
				</label>
			</RadioGroup>
			<p className='hint'>Who can work with files stored in the group? Public Open groups cannot have file storage enabled.</p>
		</div>
	);

	return (
		<div>
			{notifier}
			<div className='group-type'>
				{groupTypeRadioNode}
			</div>
			{readingRadioNode}
			{libraryEditingRadioNode}
			{fileEditingRadioNode}
			{(deletionRequired && fileSettingsChanged) ? batchDelete : <Button onClick={submitForm}>Save Settings</Button>}
		</div>
	);
}

export { GroupLibrarySettings };
