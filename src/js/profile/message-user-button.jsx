// import {log as logger} from '../Log.js';
// let log = logger.Logger('MessageUserButton');

import { PropTypes } from 'prop-types';
import { getCurrentUser } from '../Utils.js';

function MessageUserButton(props) {
	const { username } = props;
	const curUser = getCurrentUser();
	if (!curUser) {
		return null;
	}
	if (curUser.username == username) {
		return null;
	}
	return (<a id='message-user' className='btn btn-secondary' href={`//forums.zotero.org/messages/add/${username}`} >Send Message</a>);
}
MessageUserButton.propTypes = {
	username: PropTypes.string.isRequired
};

export { MessageUserButton };
