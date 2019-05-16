'use strict';

//auto-suggest within textarea component for inserting known strings into larger text inputs.
//forums username autocomplete
//group invitation autocomplete
//link to Zotero item autocomplete?

//TODO:allow multiple categories... username or real name

//import {log as logger} from '../Log.js';
//let log = logger.Logger('SuggestableInput');

import PropTypes from 'prop-types';
import {ajax} from '../ajax.js';
import ReactTextareaAutocomplete from '@webscopeio/react-textarea-autocomplete';

import classnames from 'classnames';

const SuggestionItem = ({ selected, entity }) => {
	return (
		<div className={classnames({selected}, 'suggestion-item')}>
			{`${entity}`}
		</div>
	);
};

const getUsernameCompletions = async function(token){
	let resp = await ajax({url:`/api/completename?prefix=${token}&limit=5`});
	let data = await resp.json();
	return data;
};

const forumUsernameOutput = function(username){
	if(username.includes(' ')){
		return `"${username}"`;
	} else {
		return username;
	}
};

const usernameSuggestions = async function(token, preferredSuggestions=[]) {
	let preferredMatches = preferredSuggestions.filter((suggestion)=>{return suggestion.includes(token);});
	let completions = await getUsernameCompletions(token);
	return preferredMatches.concat(completions.completions.map((c)=>c.username));
};

function SuggestableInput(props) {
	const {preferredSuggestions} = props;
	const dataProvider = (token) => {
		return props.getSuggestions(token, preferredSuggestions);
	};
	return (
		<ReactTextareaAutocomplete
			className='form-control'
			minChar={1}
			loadingComponent={() => <span>Loading</span>}
			trigger={{
				'@': {
					dataProvider,
					component: SuggestionItem,
					output: (item, _trigger) => {
						return {
							text:`@${item}`,
							caretPosition:'next'
						};
					}
				}
			}}
			dropdownClassName='suggestion-dropdown'
			listClassName='suggestion-list'
			containerClassName='suggestion-container'
		/>
	);
}
SuggestableInput.defaultProps = {
	value: '',
	getSuggestions: usernameSuggestions
};
SuggestableInput.propTypes = {
	preferredSuggestions: PropTypes.arrayOf(PropTypes.string),
	getSuggestions: PropTypes.func
};

export {SuggestableInput};