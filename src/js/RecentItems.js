// import {log as logger} from './Log.js';
// let log = logger.Logger('RecentItems');

import { ItemMaps } from './maps/ItemMaps.js';
import { loadRecentGroupItems } from './ajaxHelpers.js';
import { formatItemField, getCurrentUser, jsError } from './Utils.js';
import { buildUrl } from './wwwroutes.js';
import { LoadingSpinner } from './LoadingSpinner.js';
import { groupIsReadable } from './Groups/GroupInfo.jsx';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const currentUser = getCurrentUser();

function ItemTypeIcon(props) {
	let c = `sprite-icon sprite-treeitem-${props.itemType} left`;
	return (<span className={c}></span>);
}
ItemTypeIcon.propTypes = {
	itemType: PropTypes.string
};

function RecentItemRow(props) {
	const { item, displayFields } = props;
	let itemHref = buildUrl('itemUrl', { item: item });
	let fields = displayFields.map((field) => {
		let icon = null;
		if (field == 'title') {
			icon = <ItemTypeIcon itemType={item.data.itemType} />;
		}
		return (
			<td key={field} className={field} data-itemkey={item.key}>
				<a data-itemkey={item.key} href={itemHref}>
					{icon}
					{formatItemField(field, item, true)}
				</a>
			</td>
		);
	});
	return (
		<tr>
			{fields}
		</tr>
	);
}
RecentItemRow.defaultProps = {
	item: {}
};
RecentItemRow.propTypes = {
	item: PropTypes.shape({
		key: PropTypes.string,
		data: PropTypes.shape({
			itemType: PropTypes.string,
		})
	}),
	displayFields: PropTypes.arrayOf(PropTypes.string)
};

function RecentItems(props) {
	const { group, displayFields } = props;
	const [loading, setLoading] = useState(false);
	const [items, setItems] = useState(props.items);
	const [totalResults, setTotalResults] = useState(props.totalResults);
	const [notReadable, setNotReadable] = useState(false);
	
	useEffect(() => {
		const fetchData = async () => {
			// load items iff we have access
			let userID = null;
			if (currentUser) {
				userID = currentUser.userID;
			}

			if (groupIsReadable(group, userID) && items.length == 0) {
				setLoading(true);
				try {
					let resp = await loadRecentGroupItems(group);
					let data = await resp.json();
					let totalResults = parseInt(resp.headers.get('Total-Results'));
					setItems(data);
					setTotalResults(totalResults);
					setLoading(false);
				} catch (e) {
					setLoading(false);
					jsError('There was an error loading the group library. Please try again in a few minutes');
				}
			} else {
				setNotReadable(true);
			}
		};
		
		fetchData();
	}, []);
	
	if (notReadable) {
		return (<p>Library will be viewable after joining this group.</p>);
	}
	let itemRows = items.map((item) => {
		return (
			<RecentItemRow key={item.key} displayFields={displayFields} item={item} />
		);
	});

	let headers = displayFields.map((header) => {
		return (
			<th key={header} className='field-table-header'>
				{ItemMaps.fieldMap[header] ? ItemMaps.fieldMap[header] : header}
			</th>
		);
	});

	let table = (
		<table id='field-table' className='wide-items-table table table-striped'>
			<thead>
				<tr>
					{headers}
				</tr>
			</thead>
			<tbody>
				{itemRows}
			</tbody>
		</table>
	);

	let totalNode = null;
	if (totalResults === 0) {
		table = null;
		totalNode = <p>There are not yet any items in this collection</p>;
	} else if (totalResults) {
		totalNode = (
			<p>See all {totalResults} items for this group in the <a href={buildUrl('groupLibrary', { group })}>Group Library</a>.</p>
		);
	}

	return (
		<div>
			{table}
			{totalNode}
			<LoadingSpinner loading={loading} className='m-auto' />
		</div>
	);
}
RecentItems.defaultProps = {
	displayFields: ['title', 'addedBy', 'dateModified'],
	items: [],
	totalResults: null
};
RecentItems.propTypes = {
	group: PropTypes.shape({
		data: PropTypes.shape({
			type: PropTypes.string,
			members: PropTypes.array,
			admins: PropTypes.array,
			owner: PropTypes.number
		})
	}),
	displayFields: PropTypes.arrayOf(PropTypes.string),
	items: PropTypes.arrayOf(
		PropTypes.shape({
			data: PropTypes.object,
			key: PropTypes.string,
		}),
	),
	totalResults: PropTypes.number
};

export { RecentItems };
