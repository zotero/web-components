'use strict';

import {log as logger} from '../Log.js';
var log = logger.Logger('GlobalSearch');

let React = require('react');

const config = window.zoteroConfig;

import {ajax} from '../ajax.js';
import {LoadingSpinner} from '../LoadingSpinner.js';

import {LocationState} from '../LocationState.js';
let locationState = new LocationState();

import {CanonicalItem} from './CanonicalItem.js';
import {buildQuery, parseSearchString} from '../Utils.js';

const baseSearchUrl = config.baseGlobalApiUrl;

const globalSearchBase = `${baseSearchUrl}/global/items`;

class GlobalSearch extends React.Component {
	constructor(props){
		super(props);
		let query = locationState.getVar('q');
		if(!query){
			query = '';
		}
		this.state = {
			search:query,
			results: [],
			totalResults:0,
			loading:false
		};
		this.handleSearchChange = this.handleSearchChange.bind(this);
		this.search = this.search.bind(this);
		this.loadMore = this.loadMore.bind(this);
	}
	componentDidMount() {
		if(this.state.search != ''){
			this.search();
		}
	}
	handleSearchChange(evt){
		this.setState({search:evt.target.value});
	}
	search(evt=false){
		if(evt){
			evt.preventDefault();
		}
		var searchTerm = this.state.search;
		if(searchTerm == '') {
			this.setState({results:[], loading:false, totalResults:0});
			return;
		}
		//update querystring
		//Zotero.state.setQueryVar('q', this.state.search);
		//Zotero.state.pushState();

		let params = parseSearchString(searchTerm);
		log.debug(params);

		if(buildQuery(params) == '?') {
			this.setState({results:[], loading:false, totalResults:0});
			return;
		}
		
		let searchUrl = `${globalSearchBase}${buildQuery(params)}`;
		log.debug(searchUrl);
		
		this.setState({loading:true});
		ajax({url:searchUrl, credentials:'omit'}).then((resp) => {
			log.debug(resp);
			let totalResults = resp.headers.get('Total-Results');
			resp.json().then((data) => {
				var globalItems = data.map(function(g){
					return g;
				});
				this.setState({results: globalItems, totalResults: totalResults, loading:false});
			});
		});
	}
	loadMore(evt) {
		evt.preventDefault();
		let start = this.state.results.length;
		let searchTerm = this.state.search;
		let params = parseSearchString(searchTerm);
		params.start = start;
		log.debug(params);
		let searchUrl = `${globalSearchBase}${buildQuery(params)}`;
		log.debug(searchUrl);

		this.setState({loading:true});
		ajax({url:searchUrl, credentials:'omit'}).then((resp) => {
			log.debug(resp);
			let totalResults = resp.headers.get('Total-Results');
			let allResults = this.state.results;
			resp.json().then((data) => {
				var globalItems = data.map(function(g){
					return g;
				});
				allResults = allResults.concat(globalItems);
				this.setState({results: allResults, totalResults: totalResults, loading:false});
			});
		});
	}
	render() {
		var reactInstance = this;
		var resultNodes = reactInstance.state.results.map(function(globalItem){
			return (
				<CanonicalItem key={globalItem.id} item={globalItem} />
			);
		});
		
		let resultsCount = null;
		if(this.state.totalResults > 0){
			resultsCount = <div className='resultsCount'>Total Results:{this.state.totalResults}</div>;
		}

		if(reactInstance.state.results.length == 0) {
			resultNodes = <span>No results</span>;
		}
		
		let moreLink = null;
		if(this.state.totalResults > this.state.results.length && this.state.results.length < 300){
			moreLink = <a onClick={reactInstance.loadMore}>More</a>;
		}

		let searchUrlPreview = null;
		if(this.state.search){
			let params = parseSearchString(this.state.search);
			let searchUrl = `${globalSearchBase}${buildQuery(params)}`;
			searchUrlPreview = <div className="search-preview"><a href={searchUrl}>{searchUrl}</a></div>;
		}

		let suggestedSearches = null;
		if(this.state.results.length == 0){
			suggestedSearches = (<div className="suggested-searches">
				<p>You can try searches like:</p>
				<ul>
					<li>digital history</li>
					<li>itemType:book digital humanities</li>
					<li>itemType:book title:revolution</li>
					<li>creators:greenberg title:betamax</li>
					<li>doi:10.1038/srep03356</li>
				</ul>
			</div>);
		}

		return (
			<div className='global-search'>
				<form className="global-search-form" onSubmit={this.search}>
					<div className='input-group'>
						<input type='text' className='global-search-input' value={this.state.search} onChange={this.handleSearchChange} 
						placeholder='Search global items'/>
					</div>
				</form>
				<div className='results'>
					{searchUrlPreview}
					{resultsCount}
					{resultNodes}
					{moreLink}
					<LoadingSpinner loading={this.state.loading} />
					{suggestedSearches}
				</div>
			</div>
		);
	}
}

export {GlobalSearch};
