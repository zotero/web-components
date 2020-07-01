// import {log as logger} from './Log.js';
// let log = logger.Logger('Search.jsx');

import { useState, useEffect } from 'react';

import { PropTypes } from 'prop-types';
import { Row, Col, Form, Input, InputGroup, Button, Nav, NavItem, NavLink, InputGroupAddon, Pagination, PaginationItem, PaginationLink } from 'reactstrap';
import { postFormData } from './ajax.js';
import { LargeUser } from './components/UserList.jsx';
import { GroupNugget } from './Groups/UserGroups.jsx';
import { LocationState } from './LocationState.js';
import { LoadingSpinner } from './LoadingSpinner.js';

function SearchPagination(props) {
	let { locationState, totalResults, page, resultsPerPage, pageVar, changePage } = props;
	let numPages = Math.min(Math.ceil(totalResults / resultsPerPage), 10);
	let pageLinks = [];
	for (let i = 1; i < numPages + 1; i++) {
		if (changePage) {
			pageLinks.push(<PaginationItem key={i} active={i == page}>
				<PaginationLink href='#' onClick={() => { changePage(i); }}>{i}</PaginationLink>
			</PaginationItem>);
		} else {
			locationState.setQueryVar(pageVar, i);
			let url = locationState.buildUrl({}, locationState.vars.q);

			pageLinks.push(<PaginationItem key={url} active={i == page}>
				<PaginationLink href={url}>{i}</PaginationLink>
			</PaginationItem>);
		}
	}
	return (
		<Pagination>
			{pageLinks}
		</Pagination>
	);
}
SearchPagination.defaultProps = {
	pageVar: 'p',
	pageType: 'query',
	page: 1,
	resultsPerPage: 10,
};
SearchPagination.propTypes = {
	locationState: PropTypes.object,
	totalResults: PropTypes.number,
	page: PropTypes.number,
	resultsPerPage: PropTypes.number,
	pageVar: PropTypes.string,
	changePage: PropTypes.func,
};

function Search(props) {
	const { basePath, searchTypes, defaultType, resultsPerPage } = props;
	const ls = new LocationState(basePath);
	ls.parseVars();
	const [type, setType] = useState(ls.getVar('type') ?? defaultType);
	const [query, setQuery] = useState(ls.getVar('q') ?? '');
	const [totalResults, setTotalResults] = useState(null);
	const [results, setResults] = useState([]);
	const [page, setPage] = useState(parseInt(ls.getVar('p') || 1) ?? 1);
	const [searchPerformed, setSearchPerformed] = useState(false);
	const [searchSubmitted, setSearchSubmitted] = useState(true);

	const search = async (evt) => {
		if (evt) {
			evt.preventDefault();
		}
		setSearchSubmitted(true);
	};
	const changeType = (evt) => {
		evt.preventDefault();
		let newType = evt.target.getAttribute('data-type');
		setResults([]);
		setTotalResults(null);
		setSearchPerformed(false);
		setType(newType);
		
		ls.setQueryVar('type', newType);
		ls.pushState();
		search();
	};
	const handleQueryChange = (evt) => {
		setQuery(evt.target.value);
	};
	const changePage = (newPage) => {
		setPage(newPage);
		ls.setQueryVar('p', newPage);
		ls.pushState();
		search();
	};
	
	// perform search when searchType changes or query is submitted
	useEffect(() => {
		const performSearch = async () => {
			if (query && searchSubmitted) {
				// change url
				ls.setQueryVar('q', query);
				ls.pushState();
				
				// perform query
				let resp = await postFormData('/searchresults', { type, query, page });
				let results = await resp.json();
				setTotalResults(results.total);
				setResults(results.results);
				setSearchPerformed(true);
			}
			setSearchSubmitted(false);
		};
		performSearch();
	}, [type, searchSubmitted]);

	let resultNodes = null;
	if (searchPerformed && results.length === 0) {
		resultNodes = (
			<div className='card border-0'>
				<div className='card-body border-top'>
					No results
				</div>
			</div>
		);
	} else if (searchPerformed) {
		if (type == 'people') {
			resultNodes = results.map((user) => {
				return <LargeUser key={user.userID} user={user} />;
			});
		} else if (type == 'group') {
			resultNodes = results.map((group) => {
				return <GroupNugget key={group.apiObj.id} group={group.apiObj} className='m-2' />;
			});
		}
	} else if (type == 'people') {
		resultNodes = <p className='my-6 text-center'>Use &quot;double quotes&quot; to search for exact phrases. Otherwise we will search for users with any of the search terms.</p>;
	} else {
		resultNodes = null;
	}

	let pagination = null;
	if (totalResults > resultsPerPage) {
		pagination = <SearchPagination locationState={ls} totalResults={totalResults} page={page} changePage={changePage} resultsPerPage={resultsPerPage} />;
	}
	
	let typeNavRow = (
		<Row>
			<Col className='search-form'>
				<Nav tabs>
					<NavItem>
						<NavLink active={type == 'people'} data-type='people' onClick={changeType} href='#'>People</NavLink>
					</NavItem>
					<NavItem>
						<NavLink active={type == 'group'} data-type='group' onClick={changeType} href='#'>Groups</NavLink>
					</NavItem>
				</Nav>
			</Col>
		</Row>
	);
	
	return (
		<div className='search'>
			{searchTypes.length > 1 ? typeNavRow : null}
			<Row>
				<Col className='search-form'>
					<Form onSubmit={search} className='my-3'>
						<InputGroup>
							<Input type='text' name='q' onChange={handleQueryChange} defaultValue={query} />
							<InputGroupAddon addonType='append'><Button onClick={search}>Search</Button></InputGroupAddon>
						</InputGroup>
					</Form>
				</Col>
			</Row>
			<Row>
				<Col>
					<div id='search-results'>
						<LoadingSpinner className='mx-auto my-5' loading={searchSubmitted} />
						{resultNodes}
					</div>
					{pagination}
				</Col>
			</Row>
		</div>
	);
}

Search.defaultProps = {
	basePath: '/search',
	searchTypes: ['people', 'groups'],
	defaultType: 'people',
	resultsPerPage: 10,
};
Search.propTypes = {
	basePath: PropTypes.string,
	searchTypes: PropTypes.arrayOf(PropTypes.string),
	defaultType: PropTypes.oneOf(['people', 'group']),
	resultsPerPage: PropTypes.number,
};

export { Search };
