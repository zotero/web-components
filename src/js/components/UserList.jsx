import { log as logger } from '../Log.js';
let log = logger.Logger('UserList');

const React = require('react');
import { PropTypes } from 'prop-types';
import { buildUrl } from '../wwwroutes.js';

import { CardGroup } from 'reactstrap';
import { ProfileImage } from './ProfileImage.jsx';

const userShape = PropTypes.shape({
	username: PropTypes.string.isRequired,
	slug: PropTypes.string.isRequired,
	userID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
	displayName: PropTypes.string.isRequired,
	meta: PropTypes.object,
});

function SmallUser(props) {
	const { user } = props;
	const { slug, hasImage, userID, displayName } = user;
	const { affiliation, location, title } = user.meta.profile;
	const profileUrl = buildUrl('profileUrl', { slug });
	
	return (
		<div className='nugget-user-small card border-0'>
			<div className='row no-gutters border-top align-items-center'>
				<div className='col-md-3'>
					<a className='my-auto' href={profileUrl}>
						<ProfileImage hasImage={hasImage} type='user' entityID={userID} width='64px' height='64px' usePlaceholder={true} />
					</a>
				</div>
				<div className='col-md-9'>
					<div className='card-body'>
						<div className='nugget-name card-title'>
							<a href={profileUrl}>{displayName}</a>
						</div>
						{title
							? <div className='nugget-title card-subtitle text-muted'>{title}</div>
							: null}
						{affiliation
							? <div className='nugget-affiliation card-subtitle text-muted'>{user.affiliation}</div>
							: null}
						{location
							? <div className='nugget-location card-subtitle text-muted'>{location}</div>
							: null}
					</div>
				</div>
			</div>
		</div>
	);
}
SmallUser.propTypes = {
	user: userShape
};

function LargeUser(props) {
	const { user } = props;
	const { slug, hasImage, userID, displayName } = user;
	const { affiliation, location, title } = user.meta.profile;
	const profileUrl = buildUrl('profileUrl', { slug });
	
	return (
		<div className='nugget-user-small media border-top p-4'>
			<a href={profileUrl}>
				<ProfileImage hasImage={hasImage} type='user' entityID={userID} width='100px' height='100px' usePlaceholder={true} />
			</a>
			<div className='media-body mx-4'>
				<h5 className='nugget-name'>
					<a href={profileUrl}>{displayName}</a>
				</h5>
				{title
					? <div className='nugget-title text-muted'>{title}</div>
					: null}
				{affiliation
					? <div className='nugget-affiliation text-muted'>{affiliation}</div>
					: null}
				{location
					? <div className='nugget-location text-muted'>{location}</div>
					: null}
			</div>
		</div>
	);
}
LargeUser.propTypes = {
	user: userShape
};

function UserList(props) {
	const { users, title, perRow } = props;
	log.debug(users, 4);
	if (!users.length) {
		return null;
	}

	let userNodes = users.map((user) => {
		return <SmallUser key={user.userID} user={user} />;
	});

	let rowGroups = [];
	let children = [];
	for (let i = 0; i < userNodes.length; i++) {
		children.push(userNodes[i]);
		if ((children.length == perRow) || (i == userNodes.length - 1)) {
			rowGroups.push(
				<CardGroup key={children[0].key}>
					{children}
				</CardGroup>
			);
			children = [];
		}
	}

	return (
		<div className='userlist'>
			{title ? <h3>{title}</h3> : null}
			{rowGroups}
		</div>
	);
}
UserList.defaultProps = {
	users: [],
	title: null,
	perRow: 3,
};
UserList.propTypes = {
	users: PropTypes.arrayOf(userShape),
	title: PropTypes.string,
	perRow: PropTypes.number
};

export { UserList, SmallUser, LargeUser };
