import { log as logger } from './Log.js';
let log = logger.Logger('SubscribedLibraries.jsx');

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
// import { ajax } from './ajax.js';
import { loadUpdatedItems } from './ajaxHelpers.js';

let getTitle = function (item) {
	let title = '';
	if (item.data.itemType == 'note') {
		title = item.data.note.substring(3, 40);
	} else {
		title = item.data.title;
	}

	if (title == '') {
		title = '[Untitled]';
	}
	return title;
};

// infer what kind of activity a library item implies (created, edited, attached, itemType)
let inferActivity = function (item) {
	const { itemType, dateAdded, dateModified, parentItem } = item.data;
	const { createdByUser, modifiedByUser } = item.meta;
	const title = getTitle(item);

	let update = false;
	if (dateAdded != dateModified) {
		update = true;
	}
	const activityDate = new Date(dateModified);

	const topLevel = (typeof parentItem === 'undefined');
	if (!update) {
		if (createdByUser) {
			return `${itemType} '${title}' added by ${createdByUser.name} on ${activityDate.toLocaleDateString()}`;
		} else {
			return `${itemType} '${title}' added on ${activityDate.toLocaleDateString()}`;
		}
	} else if (modifiedByUser) {
		return `${itemType} '${title}' updated by ${modifiedByUser.name} on ${activityDate.toLocaleDateString()}`;
	} else {
		return `${itemType} '${title}' modified on ${activityDate.toLocaleDateString()}`;
	}
};

let getLibraryUpdates = async function (libraryData) {
	log.debug('getLibraryUpdates');
	log.debug(libraryData);
	let { libraryType, entityID, libraryVersion, recentItems } = libraryData;
	
	// get updates since libraryVersion
	try {
		let resp = await loadUpdatedItems(libraryType, entityID, libraryVersion);
		let freshItems = await resp.json();
		let allItems = [].concat(recentItems, freshItems);
		let libraryVersion = resp.headers.get('last-modified-version');
		
		log.debug(allItems);
		return {
			libraryType,
			entityID,
			libraryVersion,
			recentItems: allItems
		};
	} catch (e) {
		log.error(`Error getting library updates for ${libraryType} ${entityID}`);
		log.debug(e);
		return null;
	}
};

function LibraryActivity(props) {
	const { activity } = props;

	let rows = activity.recentItems.map((item) => {
		return (
			<tr key={item.key}>
				<td>{inferActivity(item)}</td>
			</tr>
		);
		// return <p key={item.key}>{item.data.title}</p>;
	});
	return (
		<div>
			<h3>{activity.recentItems[0].library.name}</h3>
			<table className='table table-striped'>
				<tbody>
					{rows}
				</tbody>
			</table>
		</div>
	);
}
LibraryActivity.propTypes = PropTypes.shape({
	activity: PropTypes.shape({
		recentItems: PropTypes.arrayOf(PropTypes.shape({
			key: PropTypes.string,
			data: PropTypes.shape({
				itemType: PropTypes.string.isRequired,
				dateAdded: PropTypes.string.isRequired,
				dateModified: PropTypes.string.isRequired,
				parentItem: PropTypes.string,
			}),
			meta: PropTypes.shape({
				createdByUser: PropTypes.object,
				modifiedByUser: PropTypes.object,
			}),
		}))
	})
});

function SubscribedLibraries(props) {
	const { subscriptions, userID } = props;
	const [libraryData, setLibraryData] = useState({});
	const [loaded, setLoaded] = useState(false);
	
	log.debug(subscriptions);

	useEffect(() => {
		const fetchData = async () => {
			// load libraryData from local cache
			let cachedData = subscriptions;
			let cachedDataStr = localStorage.getItem('subscribedLibraries');
			if (cachedDataStr) {
				cachedData = JSON.parse(cachedDataStr);
				log.debug('got cached data');
				log.debug(cachedData);
				setLibraryData(cachedData);
			}

			let freshData = [];
			// check libraries for updates
			for (let i = 0; i < cachedData.length; i++) {
				let library = cachedData[i];
				let updatedData = await getLibraryUpdates(library);
				log.debug('got updated data');
				freshData.push(updatedData);
			}

			log.debug(freshData);
			log.debug('saving freshData into libraryData');
			setLibraryData(freshData);
			setLoaded(true);
		};
		
		fetchData();
	}, [subscriptions]);

	if (!loaded) {
		return null;
	}
	log.debug(libraryData);
	let activityNodes = libraryData.map((activity) => {
		return <LibraryActivity key={activity.entityID} activity={activity} />;
	});

	return (
		<div className='subscribedLibraries'>
			{activityNodes}
		</div>
	);
}

export { SubscribedLibraries };
