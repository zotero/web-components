// import {log as logger} from '../../Log.js';
// let log = logger.Logger('DeleteGroup');

import { useState } from 'react';
import { PropTypes } from 'prop-types';

import { Button } from 'reactstrap';
import { postFormData } from '../../ajax.js';
import { buildUrl } from '../../wwwroutes.js';
import { Notifier } from '../../Notifier.js';

function DeleteGroup(props) {
	const { group } = props;
	const [notification, setNotification] = useState(null);
	
	let submitDelete = async () => {
		if (confirm('Are you sure you want to permanently delete this group?')) {
			const deleteUrl = buildUrl('groupDelete', { group });
			try {
				let resp = await postFormData(deleteUrl, { confirmDelete: 'confirmed', ajax: true }, { withSession: true });
				let d = await resp.json();
				if (!d.success) {
					throw d.message;
				} else {
					setNotification({ type: 'success', message: 'Group deleted. Redirecting...' });
					window.location.href = '/groups';
				}
			} catch (e) {
				setNotification({ type: 'error', message: 'There was an error deleting your group. Please try again in a few minutes.' });
			}
		}
	};
	
	return (
		<div className='delete-group'>
			<Notifier {...notification} />
			<Button onClick={submitDelete}>Delete Group</Button>
		</div>
	);
}
DeleteGroup.propTypes = {
	group: PropTypes.shape({
		data: PropTypes.shape({
			id: PropTypes.number
		})
	})
};

export { DeleteGroup };
