'use strict';

import {SearchBox} from './SearchBox.js';
import {pageReady} from '../Utils.js';

let React = require('react');
let ReactDOM = require('react-dom');

pageReady(function(){
	//set up search box
	let searchboxElement = document.getElementById('searchbox');
	if(searchboxElement){
		ReactDOM.render(
			React.createElement(SearchBox, null),
			searchboxElement
		);
	}
});
