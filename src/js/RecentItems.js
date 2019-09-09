'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('RecentItems');

import {PureComponent, useEffect, useState} from 'react';
import {PropTypes} from 'prop-types';

import {ItemMaps} from './ItemMaps.js';
import {loadRecentGroupItems} from './ajaxHelpers.js';
import {formatItemField, getCurrentUser} from './Utils.js';
import {buildUrl} from './wwwroutes.js';
import {LoadingSpinner} from './LoadingSpinner.js';
import {groupIsReadable} from './GroupInfo.js';
import {jsError} from './Utils.js';

const currentUser = getCurrentUser();

class ItemTypeIcon extends PureComponent{
	render(){
		let c = `sprite-icon sprite-treeitem-${this.props.itemType} left`;
		return (<span className={c}></span>);
	}
}
ItemTypeIcon.propTypes = {
	itemType: PropTypes.string
};

function RecentItemRow(props) {
	const {item, displayFields} = props;
	const itemHref = buildUrl('itemUrl', {item});
	let fields = displayFields.map((field)=>{
		let icon = null;
		if(field == 'title'){
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
		data: PropTypes.object,
	}),
	displayFields: PropTypes.arrayOf(PropTypes.string),
};


function RecentItems(props) {
	const {group, displayFields} = props;
	const [items, setItems] = useState(props.items);
	const [loading, setLoading] = useState(false);
	const [totalResults, setTotalResults] = useState(props.totalResults);
	const [notReadable, setNotReadable] = useState(false);

	useEffect(() => {
		let loadItems = async () => {
			let userID = null;
			if(currentUser){
				userID = currentUser.userID;
			}

			if(groupIsReadable(group, userID) && items.length == 0){
				setLoading(true);
				try{
					const resp = await loadRecentGroupItems(group);
					const data = await resp.json();
					const totalResults = parseInt(resp.headers.get('Total-Results'));
					setLoading(false);
					setItems(data);
					setTotalResults(totalResults);
				} catch(e) {
					setLoading(false);
					jsError('There was an error loading the group library. Please try again in a few minutes');
				}
			} else {
				setNotReadable(true);
			}
		};
		loadItems();
	}, []);

	//short-circuit if user doesn't have access
	if(notReadable === true){
		return (
			<p>Library will be viewable after joining this group.</p>
		);
	}
	
	let table = null;
	let totalResultsNode = null;
	if(totalResults === 0){
		totalResultsNode = <p>There are not yet any items in this collection</p>;
	} else if(totalResults){
		totalResultsNode = (
			<p>
				See all {totalResults} items for this group in the <a href={buildUrl('groupLibrary', {group})}>Group Library</a>.
			</p>
		);

		let itemRows = items.map((item)=>{
			return (
				<RecentItemRow key={item.key} displayFields={displayFields} item={item} />
			);
		});
	
		let headers = displayFields.map((header)=>{
			return (
				<th key={header} className="field-table-header">
					{ItemMaps.fieldMap[header] ? ItemMaps.fieldMap[header] : header}
				</th>
			);
		});
	
		table = (
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
	}

	return (
		<div>
			{table}
			{totalResultsNode}
			<LoadingSpinner loading={loading} />
		</div>
	);
}
RecentItems.defaultProps = {
	displayFields: ['title', 'addedBy', 'dateModified'],
	items: [],
	totalResults:null
};
RecentItems.propTypes = {
	group: PropTypes.object,
	displayFields:PropTypes.arrayOf(PropTypes.string),
	items:PropTypes.arrayOf(PropTypes.object),
	totalResults:PropTypes.number,
};

export {RecentItems};
