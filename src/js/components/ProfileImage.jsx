// import { log as logger } from './Log.js';
// let log = logger.Logger('ProfileImage');

import { PropTypes } from 'prop-types';
import { buildUrl } from '../wwwroutes.js';
import { randomString } from '../Utils.js';

function EmptyImage(props) {
	const { width, height } = props;
	let style = {
		backgroundColor: '#CCC',
		width,
		height
	};
	return <div className='profile-image-placeholder' style={style}></div>;
}
EmptyImage.defaultProps = {
	width: '150px',
	height: '150px'
};
EmptyImage.propTypes = {
	width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	height: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};


function ProfileImage(props) {
	const { type, hasImage, purpose, entityID, width, height, usePlaceholder, cacheBuster } = props;
	const style = {
		width,
		height
	};
	
	let imgSrc = null;
	if (!hasImage) {
		if (usePlaceholder) {
			return <EmptyImage width={width} height={height} />;
		} else {
			return null;
		}
	}
	if (type == 'user') {
		imgSrc = hasImage ? buildUrl('profileImage', { userID: entityID, purpose: purpose }) : buildUrl('profileImage', { purpose: purpose });
	} else if (type == 'group') {
		imgSrc = hasImage ? buildUrl('groupImage', { groupID: entityID, purpose: purpose }) : '';
	}
	if (cacheBuster) {
		imgSrc += `?r=${randomString(10)}`;
	}
	return <img src={imgSrc} style={style} />;
}
ProfileImage.defaultProps = {
	width: '150px',
	height: '150px',
	usePlaceholder: true
};
ProfileImage.propTypes = {
	type: PropTypes.oneOf(['user', 'group']),
	hasImage: PropTypes.bool,
	purpose: PropTypes.oneOf(['thumb', 'original', 'profile']),
	entityID: PropTypes.number,
	width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	usePlaceholder: PropTypes.bool,
	cacheBuster: PropTypes.bool
};

export { ProfileImage };
