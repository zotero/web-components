'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('Search.jsx');

const React = require('react');
const {Component} = React;

import {Row, Col, Form, Input, FormGroup, InputGroup, Button, Nav, NavItem, NavLink, InputGroupAddon} from 'reactstrap';
import {postFormData} from './ajax.js';
import {LargeUser} from './components/UserList.jsx';
import {GroupNugget} from './UserGroups.js';
import {LocationState} from './LocationState.js';

class Pagination extends Component{
	render(){
		let {basePath, totalResults, page, resultsPerPage} = this.props;
		let numPages = Math.ceil(totalResults / resultsPerPage);
		let lc = new LocationState(basePath);
		let links = [];
		for(let i=1; i<numPages+1; i++){
			lc.setPathVar(pageVar, i);
			let url = ls.buildUrl(lc.vars.path);

			links.push(<a href={url}>i</a>);
		}
		return (
			<div className='pagination'>
				{links}
			</div>
		);
	}
}
Pagination.defaultProps = {
	pageVar:'p',
	pageType:'path',
	page:1,
	resultsPerPage:10
};
class Search extends Component{
	constructor(props){
		super(props);
		this.state = {
			type:'people',
			query:'',
			totalResults:null,
			results:[]
		}
		this.lc = new LocationState('/search');
	}
	changeType = (evt) => {
		evt.preventDefault();
		let type = evt.target.getAttribute('data-type');
		this.setState({type, results:[], totalResults:null});
		this.lc.setPathVar('type', type);
		this.lc.pushState();
	}
	handleQueryChange = (evt) => {
		this.setState({query:evt.target.value});
	}
	search = async(evt) => {
		evt.preventDefault();
		const {query, type} = this.state;

		//change url
		this.lc.setPathVar('q', query);
		this.lc.pushState();
		
		//perform query
		let resp = await postFormData('/searchresults', {type, query});
		let results = await resp.json();
		this.setState({totalResults:results.total, results:results.results});
	}
	render() {
		const {type, results, totalResults} = this.state;
		let resultNodes = null;
		if(type == 'people'){
			resultNodes = results.map((user)=>{
				return <LargeUser key={user.userID} user={user} />;
			});
		} else if(type == 'group') {
			resultNodes = results.map((group)=>{
				return <GroupNugget key={group.apiObj.id} group={group.apiObj} />
			});
		}

		let pagination = null;
		if(totalResults > 10) {
			pagination = <Pagination totalResults={totalResults} />
		}
		
		return (
			<div className='search'>
				<Nav pills>
					<NavItem>
						<NavLink active={type=='people'} data-type='people' onClick={this.changeType} href='#'>People</NavLink>
					</NavItem>
					<NavItem>
						<NavLink active={type=='group'} data-type='group' onClick={this.changeType} href='#'>Groups</NavLink>
					</NavItem>
				</Nav>
				
				<Form inline onSubmit={this.search} className='my-3'>
					<InputGroup>
						<Input type='text' name='query' onChange={this.handleQueryChange} />
						<InputGroupAddon addonType="append"><Button onClick={this.search}>Search</Button></InputGroupAddon>
					</InputGroup>
				</Form>
				<div id='search-results'>
					{resultNodes}
				</div>
				{pagination}
			</div>
		);
	}
}

Search.defaultProps = {
	basePath: '/search'
};

export {Search};