'use strict';

// import {log as logger} from './Log.js';
// let log = logger.Logger('Search.jsx');

const React = require('react');
const {Component} = React;

import {PropTypes} from 'prop-types';
import {Row, Col, Form, Input, InputGroup, Button, Nav, NavItem, NavLink, InputGroupAddon, Pagination, PaginationItem, PaginationLink} from 'reactstrap';
import {postFormData} from './ajax.js';
import {LargeUser} from './components/UserList.jsx';
import {GroupNugget} from './Groups/UserGroups.js';
import {LocationState} from './LocationState.js';

function SearchPagination (props) {
	let {locationState, totalResults, page, resultsPerPage, pageVar} = props;
	let numPages = Math.min(Math.ceil(totalResults / resultsPerPage), 10);
	let pageLinks = [];
	for(let i=1; i<numPages+1; i++){
		locationState.setQueryVar(pageVar, i);
		let url = locationState.buildUrl({}, locationState.vars.q);

		pageLinks.push(<PaginationItem active={i == page}>
			<PaginationLink href={url}>{i}</PaginationLink>
		</PaginationItem>);
	}
	return (
		<Pagination>
			{pageLinks}
		</Pagination>
	);
}
SearchPagination.defaultProps = {
	pageVar:'p',
	pageType:'query',
	page:1,
	resultsPerPage:10,
};
SearchPagination.propTypes = {
	locationState: PropTypes.function,
	totalResults: PropTypes.number,
	page: PropTypes.number,
	resultsPerPage: PropTypes.number,
	pageVar: PropTypes.string,
};

class Search extends Component{
	constructor(props){
		super(props);
		this.ls = new LocationState(props.basePath);
		this.state = {
			type:props.defaultType,
			query:'',
			totalResults:null,
			results:[],
			page:1
		};
		this.ls.parseVars();
		if(this.ls.getVar('type')){
			this.state.type = this.ls.getVar('type');
		}
		if(this.ls.getVar('p')){
			this.state.page = parseInt(this.ls.getVar('p'), 10);
		}
		if(this.ls.getVar('q')){
			this.state.query = this.ls.getVar('q');
			this.search();
		}
	}
	changeType = (evt) => {
		evt.preventDefault();
		let type = evt.target.getAttribute('data-type');
		this.setState({type, results:[], totalResults:null});
		this.ls.setQueryVar('type', type);
		this.ls.pushState();
	}
	handleQueryChange = (evt) => {
		this.setState({query:evt.target.value});
	}
	search = async(evt) => {
		if(evt){
			evt.preventDefault();
		}
		const {query, type, page} = this.state;

		//change url
		this.ls.setQueryVar('q', query);
		this.ls.pushState();
		
		//perform query
		let resp = await postFormData('/searchresults', {type, query, page});
		let results = await resp.json();
		this.setState({totalResults:results.total, results:results.results});
	}
	render() {
		const {type, results, query, totalResults, page} = this.state;
		let resultNodes = null;
		if(type == 'people'){
			resultNodes = results.map((user)=>{
				return <LargeUser key={user.userID} user={user} />;
			});
		} else if(type == 'group') {
			resultNodes = results.map((group)=>{
				return <GroupNugget key={group.apiObj.id} group={group.apiObj} className='m-2' />;
			});
		}

		let pagination = null;
		if(totalResults > 10) {
			pagination = <SearchPagination locationState={this.ls} totalResults={totalResults} page={page} />;
		}
		
		let typeNavRow = (
			<Row>
				<Col className='search-form'>
					<Nav tabs>
						<NavItem>
							<NavLink active={type=='people'} data-type='people' onClick={this.changeType} href='#'>People</NavLink>
						</NavItem>
						<NavItem>
							<NavLink active={type=='group'} data-type='group' onClick={this.changeType} href='#'>Groups</NavLink>
						</NavItem>
					</Nav>
				</Col>
			</Row>
		);
		
		return (
			<div className='search'>
				{this.props.searchTypes.length > 1 ? typeNavRow : null}
				<Row>
					<Col className='search-form'>
						<Form onSubmit={this.search} className='my-3'>
							<InputGroup>
								<Input type='text' name='query' onChange={this.handleQueryChange} defaultValue={query} />
								<InputGroupAddon addonType="append"><Button onClick={this.search}>Search</Button></InputGroupAddon>
							</InputGroup>
						</Form>
					</Col>
				</Row>
				<Row>
					<Col>
						<div id='search-results'>
							{resultNodes}
						</div>
						{pagination}
					</Col>
				</Row>
			</div>
		);
	}
}

Search.defaultProps = {
	basePath: '/search',
	searchTypes: ['people', 'groups'],
	defaultType: 'people'
};
Search.propTypes = {
	basePath: PropTypes.string,
	searchTypes: PropTypes.arrayOf(PropTypes.string),
	defaultType: PropTypes.oneOf(['people', 'group'])
};

export {Search};