'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('RecentItems');

import {ItemMaps} from './ItemMaps.js';
import {ajax} from './ajax.js';
import {apiRequestString} from './ApiRouter.js';
import {formatItemField} from './Utils.js';
import {buildUrl} from './wwwroutes.js';
import {LoadingSpinner} from './LoadingSpinner.js';

let React = require('react');

const apiKey = window.zoteroConfig.apiKey;

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
	let headers = {'Zotero-Api-Key':apiKey};

	return ajax({url:url, credentials:'omit', headers:headers});
};

class RecentItems extends React.Component{
	constructor(props){
		super(props);

		this.state = {
			loading:false,
			items:this.props.items,
			totalResults:this.props.totalResults
		};
	}
	componentWillMount() {
		if(this.state.items.length == 0){
			this.setState({loading:true});
			loadRecentItems(this.props.group).then((resp)=>{
				resp.json().then((data) => {
					let totalResults = resp.headers.get('Total-Results');
					this.setState({loading:false, items:data, totalResults:totalResults});
				});
			});
		}
	}
	render() {
		log.debug(this.state.items);
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
		
		let totalResults = null;
		if(this.state.totalResults === 0){
			totalResults = <p>There are no items in this collection</p>;
		} else if(this.state.totalResults){
			totalResults = (
				<p>See all {this.state.totalResults} items for this group in the <a href={buildUrl('groupLibrary', {group:this.props.group})}>Group Library</a>.
				</p>
			);
		}

		return (
			<div>
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
