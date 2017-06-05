'use strict';

import {log as logger} from '../Log.js';
let log = logger.Logger('GlobalSearch:CanonicalSearchResult');

let React = require('react');
import {ItemMaps} from '../ItemMaps.js';

import {ajax} from '../ajax.js';
import JSONTree from 'react-json-tree';


class CanonicalItem extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			showDetails:this.props.showDetails
		};
		this.toggleDetails = this.toggleDetails.bind(this);
		this.getCrossrefData = this.getCrossrefData.bind(this);
	}
	toggleDetails() {
		this.setState({showDetails:(!this.state.showDetails)});
	}
	getCrossrefData() {
		log.debug('getCrossrefData');
		let item = this.props.item;
		if(!item){
			log.debug('no item');
			return;
		}
		if(item.data.DOI == '') {
			log.debug('no DOI');
			return;
		}
		let doi = item.data.DOI;
		log.debug(`looking up DOI ${doi}`);
		let doiLookupUrl = `https://api.crossref.org/works/${doi}`;
		ajax({url:doiLookupUrl, credentials:'omit'}).then((resp) => {
			log.debug(resp);
			resp.json().then((data)=>{
				log.debug(data);
				this.setState({crossrefData:data});
			});
		});
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
		let canonicalDataFields = [];
		canonicalDataFields = keys.map(function(key){
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
				return (
					<tr key={key}>
						<th>{ItemMaps.fieldMap[key]}</th>
						<td>{val}</td>
					</tr>
				);
			}
			return null;
		});
		
		let datesAdded = item.meta.datesAdded.map(function(da){
			return (
				<li key={da.month}>
					{da.month} : {da.numAdded}
				</li>
			);
		});

		let instances = null;
		if(item.libraryItems) {
			//log.debug(`${item.libraryItems.length} public library item instances`);
			instances = item.libraryItems.map(function(instance){
				return (
					<div key={instance}>
						<a href={instance}>{instance}</a>
					</div>
				);
			});
		}

		let detailsClass = 'search-result-body panel-body hidden';
		if(this.state.showDetails){
			detailsClass = 'search-result-body panel-body';
		}

		let panelHeading = null;
		if(this.props.separateHeading){
			panelHeading = (
				<div className="panel-heading" onClick={this.toggleDetails}>
					<h4 className="panel-title">
						<a role="button">
							{title}
						</a>
					</h4>
				</div>
			);
		}

		let bespinTheme = {
			scheme: 'bespin',
			author: 'jan t. sott',
			base00: '#28211c',
			base01: '#36312e',
			base02: '#5e5d5c',
			base03: '#666666',
			base04: '#797977',
			base05: '#8a8986',
			base06: '#9d9b97',
			base07: '#baae9e',
			base08: '#cf6a4c',
			base09: '#cf7d34',
			base0A: '#f9ee98',
			base0B: '#54be0d',
			base0C: '#afc4db',
			base0D: '#5ea6ea',
			base0E: '#9b859d',
			base0F: '#937121'
		};
		let crossrefDataNode = null;
		if(this.state.crossrefData){
			crossrefDataNode = <JSONTree data={this.state.crossrefData} theme={bespinTheme} invertTheme={true} />;
		}
		return (
			<div className="canonicalItem">
				<div className="panel panel-default">
					{panelHeading}
					<div className={detailsClass}>
						<div className="canonicalMeta">
							<h3>Canonical Meta</h3>
							<table>
								<tbody>
									<tr>
										<th>Canonical ID</th>
										<td>{item.id}</td>
									</tr>
									<tr>
										<th>Instances</th>
										<td>{item.meta.instanceCount}</td>
									</tr>
									<tr>
										<th>Libraries Count</th>
										<td>{item.meta.librariesCount}</td>
									</tr>
									<tr>
										<th>Dates Added</th>
										<td><ul>{datesAdded}</ul></td>
									</tr>
								</tbody>
							</table>
						</div>
						<div className="instances">
							{instances}
						</div>
						<div className="canonicalData">
							<h3>Canonical Data</h3>
							<table>
								<tbody>
									{canonicalDataFields}
								</tbody>
							</table>
						</div>
						<button type="button" onClick={this.getCrossrefData}>Get Crossref</button>
						{crossrefDataNode}
					</div>
				</div>
			</div>
		);
	}
}
CanonicalItem.defaultProps = {
	item:null,
	separateHeading: true,
	showDetails:false
};

export {CanonicalItem};
