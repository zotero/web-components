'use strict';

const React = require('react');
const {Component} = React;

class SearchBox extends Component{
	constructor(props){
		super(props);
		this.state = {
			searchContext:'',
			q:''
		};
		this.clearQuery = this.clearQuery.bind(this);
		this.changeQuery = this.changeQuery.bind(this);
	}
	componentWillMount(){
		// Look for a context specific search
		if(undefined !== window.zoterojsSearchContext){
			this.setState({searchContext: window.zoterojsSearchContext});
		}
	}
	clearQuery() {
		this.setState({q:''});
	}
	changeQuery(evt) {
		this.setState({q:evt.target.value});
	}
	search(evt) {
		if(evt){
			evt.preventDefault();
		}
		let q = '';
		let url = '';
		switch(this.state.searchContext){
			case 'support':
			case 'documentation':
				q = encodeURIComponent(this.state.q + ' site:www.zotero.org/support');
				url = `https://duckduckgo.com/?q=${q}`;
				window.location = url;
				break;
			case 'forums':
				q = encodeURIComponent(this.state.q + ' site:forums.zotero.org');
				url = `https://duckduckgo.com/?q=${q}`;
				window.location = url;
				break;
			case 'people':
				q = encodeURIComponent(this.state.q);
				url = `/search/type/users?q=${q}`;
				window.location = url;
				break;
			case 'group':
				q = encodeURIComponent(this.state.q);
				url = `/search/type/groups?q=${q}`;
				window.location = url;
				break;
			case 'library':
			case 'grouplibrary':

				break;
		}
	}
	render(){
		let placeHolder = '';
		switch(this.state.searchContext){
			case 'people'        : placeHolder = 'Search People';    break;
			case 'group'         : placeHolder = 'Search Groups';    break;
			case 'documentation' : placeHolder = 'Search Documentation'; break;
			case 'library'       : placeHolder = 'Search Library';       break;
			case 'grouplibrary'  : placeHolder = 'Search Library';       break;
			case 'support'       : placeHolder = 'Search Support';       break;
			case 'forums'        : placeHolder = 'Search Forums';        break;
			default              : placeHolder = 'Search Support';
		}
		
		return (
			<form action="/search/" onSubmit={this.search} className="form-inline" role="search">
				<div className="input-group">
					<input onChange={this.changeQuery} value={this.state.q} type="text" name="q" id="header-search-query" className="search-query form-control" placeholder={placeHolder}/>
					<span onClick={this.clearQuery} class="input-group-btn">
						<button class="btn btn-secondary" type="button">&times;</button>
					</span>
				</div>
			</form>
		);
	}
}

export {SearchBox};