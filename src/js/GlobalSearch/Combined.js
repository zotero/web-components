'use strict';

//import {log as logger} from '../Log.js';
//var log = logger.Logger('Combined');

let React = require('react');
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import {GlobalSearch} from './GlobalSearch.js';
import {PublicLibraryElasticSearch} from './PublicLibraryElasticSearch.js';
//import {LibraryElasticSearch} from './LibraryElasticSearch.js';


class Combined extends React.Component{
	constructor(props){
		super(props);
	}
	render() {
		return (
			<Tabs onSelect={this.handleSelect} forceRenderTabPanel={true}>
				<TabList>
					<Tab>Global</Tab>
					<Tab>Public</Tab>
					{/*<Tab>Individual</Tab>*/}
				</TabList>
				<TabPanel>
					<GlobalSearch />
				</TabPanel>
				<TabPanel>
					<PublicLibraryElasticSearch />
				</TabPanel>
				{/*
				<TabPanel>
					<LibraryElasticSearch />
				</TabPanel>
				*/}
			</Tabs>
		);
	}
}

export {Combined};
