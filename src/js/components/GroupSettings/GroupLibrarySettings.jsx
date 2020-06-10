import { log as logger } from '../../Log.js';
let log = logger.Logger('GroupLibrarySettings');

import { useState, useEffect } from 'react';

import { Button, FormGroup, CustomInput, Label } from 'reactstrap';
import { BatchDelete } from './BatchDelete.jsx';
import { postFormData } from '../../ajax.js';
import { loadAttachmentItems } from '../../ajaxHelpers.js';
import { Notifier } from '../../Notifier.js';
import PropTypes from 'prop-types';

function GroupTypeRadio(props) {
	const { onChange, currentValue } = props;
	return (
		<FormGroup>
			<legend>Group Type</legend>
			<div>
				<CustomInput type='radio' id='gtprivate' name='groupType' onChange={onChange} value='Private' label='Private' checked={'Private' == currentValue} />
				<CustomInput type='radio' id='gtpubliccosed' name='groupType' onChange={onChange} value='PublicClosed' label='Public Closed' checked={'PublicClosed' == currentValue} />
				<CustomInput type='radio' id='gtpublicopen' name='groupType' onChange={onChange} value='PublicOpen' label='Public Open' checked={'PublicOpen' == currentValue} />
			</div>
			<p className='hint'>Controls who can see and join your group</p>
		</FormGroup>
	);
}

function LibraryReadingRadio(props) {
	const { onChange, currentValue } = props;
	return (
		<FormGroup>
			<legend>Library Reading</legend>
			<div>
				<CustomInput type='radio' id='lrall' name='libraryReading' onChange={onChange} value='all' label='Anyone on the internet' checked={'all' == currentValue} />
				<CustomInput type='radio' id='lrmembers' name='libraryReading' onChange={onChange} value='members' label='Any group member' checked={'members' == currentValue} />
			</div>
			<p className='hint'>Who can see items in this group&apos;s library?</p>
		</FormGroup>
	);
}

function LibraryEditingRadio(props) {
	const { onChange, currentValue } = props;
	return (
		<FormGroup>
			<legend>Library Editing</legend>
			<div>
				<CustomInput type='radio' id='lemembers' name='libraryEditing' onChange={onChange} value='members' label='Any group member' checked={'members' == currentValue} />
				<CustomInput type='radio' id='leadmins' name='libraryEditing' onChange={onChange} value='admins' label='Only group admins' checked={'admins' == currentValue} />
			</div>
			<p className='hint'>Who can add, edit, and remove items from this group&apos;s library?</p>
		</FormGroup>
	);
}

function FileEditingRadio(props) {
	const { onChange, currentValue, type } = props;
	const fedisabled = (type == 'PublicOpen');
	return (
		<FormGroup>
			<legend>File Editing</legend>
			<div>
				<CustomInput type='radio' id='femembers' name='fileEditing' onChange={onChange} value='members' label='Any group member' checked={'members' == currentValue} disabled={fedisabled} />
				<CustomInput type='radio' id='feadmins' name='fileEditing' onChange={onChange} value='admins' label='Only group admins' checked={'admins' == currentValue} disabled={fedisabled} />
				<CustomInput type='radio' id='fenone' name='fileEditing' onChange={onChange} value='none' label='No group file storage' checked={'none' == currentValue} disabled={fedisabled} />
			</div>
			<p className='hint'>Who can work with files stored in the group? Public Open groups cannot have file storage enabled.</p>
		</FormGroup>
	);
}

// Deletion of attachments is required if group type is PublicOpen or if fileEditing is set to 'none'
function GroupLibrarySettings(props) {
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

	const changeType = (evt) => {
		let type = evt.target.value;
		let newLibrarySettings = Object.assign({}, librarySettings);
		if (type == 'PublicOpen' && props.type !== 'PublicOpen') {
			if (!confirm("Changing a group to 'Public Open' will disallow storing of files for the group. Before settings can be applied, all file attachments for the group will be deleted")) {
				return;
			} else {
				newLibrarySettings.fileEditing = 'none';
			}
		}
		if (type == 'Private' && props.type !== 'Private') {
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

	const changeReading = (evt) => {
		let value = evt.target.value;
		let newLibrarySettings = Object.assign({}, librarySettings);
		newLibrarySettings.libraryReading = value;
		setLibrarySettings(newLibrarySettings);
	};

	const changeEditing = (evt) => {
		let value = evt.target.value;
		let newLibrarySettings = Object.assign({}, librarySettings);
		newLibrarySettings.libraryEditing = value;
		setLibrarySettings(newLibrarySettings);
	};

	const changeFileEditing = (evt) => {
		let value = evt.target.value;
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
				setNotification({ type: 'error', message: 'Error saving settings' });
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
		if ((originalFileEditing != 'none') && (type == 'PublicOpen')) {
			setDeletionRequired(true);
		} else if (fileEditing == 'none' && originalFileEditing != 'none') {
			setDeletionRequired(true);
		} else {
			setDeletionRequired(false);
		}
	}, [originalFileEditing, type, fileEditing]);
	
	if (fileSettingsChanged && deletionRequired) {
		batchDelete = <BatchDelete groupID={groupID} save={submitForm} />;
	}

	let notifier = <Notifier {...notification} />;

	return (
		<div>
			{notifier}
			<div className='group-type'>
				<GroupTypeRadio onChange={changeType} currentValue={type} />
			</div>
			<LibraryReadingRadio onChange={changeReading} currentValue={libraryReading} />
			<LibraryEditingRadio onChange={changeEditing} currentValue={libraryEditing} />
			<FileEditingRadio onChange={changeFileEditing} currentValue={fileEditing} type={type} />
			{(deletionRequired && fileSettingsChanged) ? batchDelete : <Button onClick={submitForm}>Save Settings</Button>}
		</div>
	);
}
GroupLibrarySettings.propTypes = {
	groupID: PropTypes.number,
	type: PropTypes.oneOf(['Private', 'PublicOpen', 'PublicClosed']),
	fileEditing: PropTypes.oneOf(['members', 'admins', 'none']),
	libraryReading: PropTypes.oneOf(['all', 'members']),
	libraryEditing: PropTypes.oneOf(['members', 'admins'])
};

export { GroupLibrarySettings };
