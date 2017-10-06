'use strict';

//import {log as logger} from '../Log.js';
//let log = logger.Logger('StyleChooser');

const React = require('react');
const {Component} = React;

import Select from 'react-select';

class StyleChooser extends Component {
	render() {
		let styleOptions = {
			'american-political-science-association': 'American Political Science Association',
			'apa': 'American Psychological Association',
			'apa-cv': 'American Psychological Association (CV - sort by descending date)',
			'american-sociological-association': 'American Sociological Association',
			'chicago-author-date': 'Chicago Manual of Style (Author-Date format)',
			'chicago-fullnote-bibliography': 'Chicago Manual of Style Full Note with Bibliography',
			'chicago-note-bibliography': 'Chicago Manual of Style Note Bibliography',
			'harvard1': 'Harvard Reference Format 1',
			'ieee': 'IEEE',
			'modern-humanities-research-association': 'Modern Humanities Research Association',
			'modern-language-association': 'Modern Language Association',
			'nlm': 'National Library of Medicine',
			'nature': 'Nature Journal',
			'vancouver': 'Vancouver'
		};
		let def = this.props.style;

		let optionsArray = Object.keys(styleOptions).map((key)=>{
			return {value:key, label:styleOptions[key]};
		});
		

		let options = Object.keys(styleOptions).map((key)=>{
			let label = styleOptions[key];
			return <option key={key} value={key} label={label}>{label}</option>;
		});
		return (
			<div>
				<Select 
					options={optionsArray}
					onChange={(val)=>{this.props.changeStyle(val);}}
					value={this.props.style}
					clearable={false}
				/>
				{/*
				<select className='form-control' defaultValue={def} onChange={(evt)=>{this.props.changeStyle(evt.target.value);}}>
					{options}
				</select>*/}
				<p className='hint'>Style for bibliography sections</p>
			</div>
		);
	}
}
StyleChooser.defaultProps = {
	style: 'chicago-note-bibliography'
};

export {StyleChooser};