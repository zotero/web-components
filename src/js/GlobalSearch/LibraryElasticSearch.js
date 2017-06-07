'use strict';

import {log as logger} from '../Log.js';
let log = logger.Logger('LibraryElasticSearch');

import {ajax} from '../ajax.js';

let React = require('react');

const config = window.zoteroConfig;

let LibraryItemResult = require('./LibraryItemSearchResult.js');

let LocationState = require('../LocationState.js');
let locationState = new LocationState();

const baseSearchUrl = config.baseGlobalApiUrl;
const baseApiUrl = 'https://api.zotero.org';

var librarySearchUrl = function(type, entityID, query){
	return `${baseSearchUrl}/${type}/${entityID}/items?q=${query}`;
};

var LibraryElasticSearch = React.createClass({
	componentDidMount: function(){
		if(this.state.search != ''){
			this.search();
		}
		this.loadSavedSearches();
	},
	getDefaultProps: function() {
		return {
			item:null
		};
	},
	getInitialState: function() {
		let query = locationState.getVar('libq');
		if(!query){
			query = '';
		}
		let entityID = 0;
		if(window.zoteroData && window.zoteroData.loggedInUser){
			entityID = window.zoteroData.loggedInUser;
		}
		return {
			search:query,
			libraryType:'users',
			'entityID':entityID,
			'searchkey':'',
			savedSearches:[],
			results: []
		};
	},
	handleSearchChange: function(evt){
		this.setState({search:evt.target.value});
	},
	handleSearchKeyChange: function(evt){
		this.setState({searchkey:evt.target.value}, ()=>{this.search();});
	},
	handleTypeChange: function(evt){
		this.setState({libraryType:evt.target.value});
	},
	handleEntityChange: function(evt){
		this.setState({entityID:evt.target.value});
	},
	loadSavedSearches: function(){
		let type = this.state.libraryType;
		let entityID = this.state.entityID;
		let url = `${baseApiUrl}/${type}/${entityID}/searches`;
		ajax({url:url}).then((resp) => {
			return resp.json().then((data) => {
				this.setState({savedSearches:data});
			});
		});
	},
	search: function(evt=false){
		if(evt){
			evt.preventDefault();
		}

		let searchUrl = librarySearchUrl(this.state.libraryType, this.state.entityID, this.state.search);
		
		if(this.state.searchkey != '') {
			log.debug('using saved search');
			//get the saved search from the API
			let savedSearch = null;
			log.debug('finding saved search');
			for(let ss of this.state.savedSearches){
				log.debug(ss);
				if(ss.key == this.state.searchkey){
					savedSearch = ss;
				}
			}
			log.debug(savedSearch);
			ajax({type:'POST', url:searchUrl, data:JSON.stringify(savedSearch)}).then((resp) => {
				log.debug(resp);
				resp.json().then((data)=>{
					/*var resultItems = data.map(function(g){
						return g;
					});*/
					let resultItems = data;
					this.setState({results: resultItems});
				});
			});
			/*
			//load saved search by key from api, the POST it to the search server
			let ssurl = savedSearchUrl(this.state.libraryType, this.state.entityID, this.state.search);
			ajax({url:ssurl}).then((resp) => {
				//return just the saved search
				log.debug(resp);
				return resp.json().then((data)=>{
					return data[0];
				});
			}).then((savedSearch) => {
				log.debug(savedSearch);
				ajax({type:'POST', url:searchUrl, data:JSON.stringify(savedSearch)}).then((resp) => {
					log.debug(resp);
					resp.json().then((data)=>{
						var resultItems = data.map(function(g){
							return g;
						});
						this.setState({results: resultItems});
					});
				});
			});
			*/
		} else {
			log.debug('regular search');
			ajax({url:searchUrl}).then((resp) => {
				log.debug(resp);
				resp.json().then((data)=>{
					/*
					var resultItems = data.map(function(g){
						return g;
					});
					*/
					let resultItems = data;
					this.setState({results: resultItems});
				});
			});
		}
	},
	render: function() {
		var reactInstance = this;
		var resultNodes = reactInstance.state.results.map(function(resultItem){
			return (
				<LibraryItemResult key={resultItem.key} item={resultItem} />
			);
		});
		if(reactInstance.state.results.length == 0) {
			resultNodes = <span>No results</span>;
		}

		let savedSearches = this.state.savedSearches;
		let ssNodes = savedSearches.map(function(ss){
			return (
				<option key={ss.key} value={ss.key}>{ss.data.name}</option>
			);
		});

		let ssSelect = (
			<select name='savedSearchSelect' id='savedSearchSelect' onChange={this.handleSearchKeyChange}>
				<option key='none' value=''>None</option>
				{ssNodes}
			</select>
		);

		return (
			<div className='library-search'>
				<form className="global-search-form" onSubmit={this.search}>
					{/*
					<div>
					<label><input type="radio" name="libraryType" value="users" defaultChecked onChange={this.handleTypeChange} />User</label>
					</div>
					<div className="radio">
					<label><input type="radio" name="libraryType" value="groups" onChange={this.handleTypeChange} />Group</label>
					</div>
					<div className='form-group'>
						<label htmlFor='entityID'>EntityID:</label>
						<input type='text' id='entityID' name='entityID' value={this.state.entityID} onChange={this.handleEntityChange} />
					</div>
					<div className='form-group'>
						<label htmlFor='searchkey'>Saved search key:</label>
						<input type='text' id='searchkey' name='searchkey' value={this.state.searchkey} onChange={this.handleSearchKeyChange} />
					</div>
					*/}
					{ssSelect}
					<div className='input-group'>
						<input type='text' value={this.state.search} onChange={this.handleSearchChange} 
						placeholder='Search specific library'/>
						{/*
						<span className='input-group-btn'>
							<button type='submit' className='btn btn-default' onClick={this.search}>
								<IconSearch />
							</button>
						</span>
						*/}
					</div>
				</form>
				<div className='results'>
					{resultNodes}
				</div>
			</div>
		);
	}
});

export {LibraryElasticSearch};
