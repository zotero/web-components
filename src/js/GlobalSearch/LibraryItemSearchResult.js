'use strict';

//import {log as logger} from '../Log.js';
//let log = logger.Logger('LibraryItemSearchResult');

let React = require('react');
import {ItemMaps} from '../maps/ItemMaps.js';

class LibraryItem extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			showDetails:false
		};
		this.toggleDetails = this.toggleDetails.bind(this);
	}
	toggleDetails() {
		this.setState({showDetails:(!this.state.showDetails)});
	}
	render() {
		if(this.props.item == null){
			return null;
		}
		let item = this.props.item;
		let title = item.data.title;
		if(title == ''){
			title = '<untitled>';
		}
		let keys = Object.keys(item.data);
		let dataFields = [];
		dataFields = keys.map(function(key){
			let val = item.data[key];
			if(val === ''){
				return null;
			}
			if(key == 'creators') {
				if(!val){
					return null;
				}

				let creatorRows = val.map(function(k, i) {
					if(k.name){
						return (
							<tr key={'creator_' + i}>
								<th>{ItemMaps.creatorMap[k.creatorType]}</th>
								<td>{k.name}</td>
							</tr>
						);
					} else {
						return (
							<tr key={'creator_' + i}>
								<th>{ItemMaps.creatorMap[k.creatorType]}</th>
								<td>{k.lastName}, {k.firstName}</td>
							</tr>
						);
					}
				});
				return creatorRows;
			} else if(typeof val == 'string'){
				let fieldName = ItemMaps.fieldMap[key];
				if(fieldName == undefined){
					fieldName = key;
				}
				return (
					<tr key={key}>
						<th>{fieldName}</th>
						<td>{val}</td>
					</tr>
				);
			}
			return null;
		});
		
		let detailsClass = 'search-result-body panel-body hidden';
		if(this.state.showDetails){
			detailsClass = 'search-result-body panel-body';
		}

		let itemLink = (<a href={item.links.self.href}>{item.links.self.href}</a>);
		return (
			<div className="canonicalItem">
				<div className="panel panel-default">
					<div className="panel-heading" onClick={this.toggleDetails}>
						<h4 className="panel-title">
							<a role="button">
								{title}
							</a>
						</h4>
					</div>
					<div className={detailsClass}>
						<div className="data">
							<table>
								<tbody>
									<tr><th>Link</th><td>{itemLink}</td></tr>
									{dataFields}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
LibraryItem.defaultProps = {
	item:null
};

export {LibraryItem};
