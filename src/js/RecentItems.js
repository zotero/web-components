'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('RecentItems');

import {ItemMaps} from './maps/ItemMaps.js';
import {ajax} from './ajax.js';
import {apiRequestString} from './ApiRouter.js';
import {formatItemField, getCurrentUser} from './Utils.js';
import {buildUrl} from './wwwroutes.js';
import {LoadingSpinner} from './LoadingSpinner.js';
import {groupIsReadable} from './GroupInfo.js';
import {jsError} from './Utils.js';

const currentUser = getCurrentUser();

let React = require('react');

class ItemTypeIcon extends React.PureComponent{
	render(){
		let c = `sprite-icon sprite-treeitem-${this.props.itemType} left`;
		return (<span className={c}></span>);
	}
}

class RecentItemRow extends React.Component{
	render() {
		let item = this.props.item;
		let itemHref = buildUrl('itemUrl', {item:item});
		let fields = this.props.displayFields.map((field)=>{
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
}
RecentItemRow.defaultProps = {
	item: {}
};

let loadRecentItems = function(group){
	let url = apiRequestString({
		target:'items',
		targetModifier:'top',
		libraryType:'group',
		libraryID:group.id,
		limit:10,
		order:'dateModified'
	});
	
	return ajax({url:url, credentials:'omit'});
};

class RecentItems extends React.Component{
	constructor(props){
		super(props);

		this.state = {
			loading:false,
			items:this.props.items,
			totalResults:parseInt(this.props.totalResults, 10)
		};
	}
	componentWillMount() {
		let group = this.props.group;
		//load items iff we have access
		let userID = null;
		if(currentUser){
			userID = currentUser.userID;
		}

		if(groupIsReadable(group, userID) && this.state.items.length == 0){
			this.setState({loading:true});
			loadRecentItems(this.props.group).then((resp)=>{
				resp.json().then((data) => {
					let totalResults = parseInt(resp.headers.get('Total-Results'));
					this.setState({loading:false, items:data, totalResults:totalResults});
				});
			}).catch(()=>{
				this.setState({loading:false});
				jsError('There was an error loading the group library. Please try again in a few minutes');
			});
		} else {
			this.setState({notReadable:true});
		}
	}
	render() {
		if(this.state.notReadable === true){
			return (
				<p>Library will be viewable after joining this group.</p>
			);
		}
		let itemRows = this.state.items.map((item)=>{
			return (
				<RecentItemRow key={item.key} displayFields={this.props.displayFields} item={item} />
			);
		});

		let headers = this.props.displayFields.map((header)=>{
			return (
				<th key={header} className="field-table-header">
					{ItemMaps.fieldMap[header] ? ItemMaps.fieldMap[header] : header}
				</th>
			);
		});

		let table = (
			<table id='field-table' ref="itemsTable" className='wide-items-table table table-striped'>
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

		let totalResults = null;
		if(this.state.totalResults === 0){
			table = null;
			totalResults = <p>There are not yet any items in this collection</p>;
		} else if(this.state.totalResults){
			totalResults = (
				<p>See all {this.state.totalResults} items for this group in the <a href={buildUrl('groupLibrary', {group:this.props.group})}>Group Library</a>.
				</p>
			);
		}

		return (
			<div>
				{table}
				{totalResults}
				<LoadingSpinner loading={this.state.loading} />
			</div>
		);
	}
}
RecentItems.defaultProps = {
	displayFields: ['title', 'addedBy', 'dateModified'],
	items: [],
	totalResults:null
};

export {RecentItems};
