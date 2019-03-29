'use strict';

// import {log as logger} from '../Log.js';
// let log = logger.Logger('Collection');

const React = require('react');
const {Component} = React;

import {CustomInput} from 'reactstrap';

class Collection extends Component {
	constructor(props) {
		super(props);
	}
	collectionChange = (evt) => {
		let v = evt.target.value;
		this.props.updateEntry(this.props.section.tracking, 'value', v);
	}
	render() {
		let collections = this.props.collections;
		let collectionNames = function(collections, depth=0){
			let names = [];
			for(let i = 0; i < collections.length; i++){
				let collection = collections[i];
				names.push({
					name:' '.repeat(depth) + collection.data.name,
					key:collection.key,
					depth:depth
				});
				if(collection.children){
					names = names.concat(...collectionNames(collection.children, depth+1));
				}
			}
			return names;
		};

		let names = collectionNames(collections);
		let options = names.map((collectionName)=>{
			let name = collectionName.name;
			let key = collectionName.key;
			return (
				<option key={key} value={key} label={name}>
					{`${' '.repeat(collectionName.depth)}${name}`}
				</option>
			);
		});

		let collectionKey = this.props.section.value;
		
		return (
			<div className='cv-collection'>
				<CustomInput
					type="select"
					name='collectionKey'
					id="collectionKey"
					onChange={this.collectionChange}
					value={collectionKey}
					clearable='false'
				>
					<option value=''>Choose a collection</option>
					{options}
				</CustomInput>
				<p className='text-muted'>Collection from your library that will be formatted as a bibliography</p>
				{(this.props.section.collectionPreview !== undefined) && true }
				<div dangerouslySetInnerHTML={{__html:this.props.collectionPreviews[collectionKey]}}></div>
			</div>
		);
	}
}

export {Collection};