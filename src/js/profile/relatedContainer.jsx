import {log as logger} from '../Log.js';
let log = logger.Logger('RelatedContainer');

import {useState} from 'react';
import PropTypes from 'prop-types';
import {SmallUser, LargeUser} from '../components/UserList.jsx';
import {LoadingSpinner} from '../LoadingSpinner.js';
import {ajax} from '../ajax.js';


function RelatedContainer (props) {
	const [related, setRelated] = useState(props.related);
	const [loadingFollowers, setLoadingFollowers] = useState(false);
	const [loadingFollowing, setLoadingFollowing] = useState(false);
	
	const loadRelatedUsers = async (type) => {
		let start = 0;
		let limit = 10;
		switch(type){
			case 'followers':
				setLoadingFollowers(true);
				start = related.followers.length;
				break;
			case 'following':
				setLoadingFollowing(true);
				start = related.following.length;
				break;
			default:
				throw 'Unrecognized related user type';
		}

		let slug = props.user.slug;
		let url = `/${slug}/data/${type}?start=${start}&limit=${limit}`;
		try{
			let resp = await ajax({url: url, credentials:'omit'});
			let data = await resp.json();
			let followUsers = data['users'];
			let newRelated = related[type].concat(followUsers);
			switch(type){
				case 'followers':
					related.followers = newRelated;
					setRelated(related);
					setLoadingFollowers(false);
					return;
				case 'following':
					related.following = newRelated;
					setRelated(related);
					setLoadingFollowing(false);
					return;
				default:
					throw 'Unrecognized related user type';
			}
		} catch (err){
			log.error(err);
		}
	};
	
	let followersNode = related.followers.length ? (
		<div className='followers'>
			<h2>Followers</h2>
			{related.followers.map((user) => {
				return (<SmallUser key={user.userID} user={user} />);
			})}
			{related.followersTotal > related.followers.length ? 
				<a href='#' onClick={()=>{
					loadRelatedUsers('followers');
				}}>More</a> :
				null}
			<LoadingSpinner loading={loadingFollowers} />
		</div>
	) : null;
	
	let followingNode = related.following.length ? (
		<div className='following'>
			<h2>Following</h2>
			{related.following.map((user) => {
				switch (props.nuggetSize) {
					case 'small':
						return (<SmallUser key={user.userID} user={user} />);
					case 'large':
						return (<LargeUser key={user.userID} user={user} />);
				}
			})}
			{related.followingTotal > related.following.length ? 
				<a href='#' onClick={()=>{
					loadRelatedUsers('following');
				}}>More</a> :
				null}
			<LoadingSpinner loading={loadingFollowing} />
		</div>
	) : null;
	return (
		<div className='related-people'>
			{followersNode}
			{followingNode}
		</div>
	);
}

RelatedContainer.propTypes = {
	user: PropTypes.object.isRequired,
	nuggetSize: PropTypes.oneOf(['small', 'large']),
	related: PropTypes.shape({
		following: PropTypes.array,
		followers: PropTypes.array
	}),
};
RelatedContainer.defaultProps = {
	nuggetSize: 'small'
};

export {RelatedContainer};