'use strict';

//TODO: make click to edit/blur to save
//add handle for dragging
//actually save the CV (currently not submitting form)

import {log as logger} from '../Log.js';
let log = logger.Logger('CVEditor');

const React = require('react');
const {Component} = React;
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import {ajax, postFormData} from '../ajax.js';
//import {buildUrl} from '../wwwroutes.js';
import {randomString} from '../Utils.js';

import {StyleChooser} from './styleChooser.js';
import Section from './section.js';
import {jsError, getCurrentUser} from '../Utils.js';
import {apiRequestString} from '../ApiRouter.js';

const currentUser = getCurrentUser();

//take an array of collections and create a tree with subcollections put into 'children'
function nestCollections(collections){
	let map = {};
	let topLevel = [];
	collections.map((collection)=>{
		map[collection.key] = collection;
	});
	collections.map((collection)=>{
		let parentKey = collection.data.parentCollection;
		if(!parentKey){
			topLevel.push(collection);
		} else {
			let parentCollection = map[parentKey];
			if(Array.isArray(parentCollection.children)){
				parentCollection.children.push(collection);
			} else {
				parentCollection.children = [collection];
			}
		}
	});
	return topLevel;
}

//very ugly. just keep updated entries outside component state so RTE edits don't force
//re-renders that break tinymce
let CVEntryMap = {};
class CVEditor extends Component{
	constructor(props){
		super(props);
		let entries = this.props.entries;
		let entryMap = {};
		let entryOrder = [];
		entries.forEach(function(entry) {
			let tracking = randomString(8);
			entry['tracking'] = tracking;
			entryMap[tracking] = entry;
			entryOrder.push(tracking);
		}, this);
		CVEntryMap = entryMap;
		this.state = {
			collections:[],
			collectionPreviews:{},
			entryMap:entryMap,
			entryOrder:entryOrder,
			style:this.props.style
		};
		this.insertTextSection = this.insertTextSection.bind(this);
		this.insertCollection = this.insertCollection.bind(this);
		this.appendSection = this.appendSection.bind(this);
		this.moveEntry = this.moveEntry.bind(this);
		this.updateEntry = this.updateEntry.bind(this);
		this.save = this.save.bind(this);
		this.loadCollections = this.loadCollections.bind(this);
		this.edit = this.edit.bind(this);
	}
	componentDidMount(){
		document.documentElement.className += ' react-mounted';
		this.activateEditors();
		this.loadCollections();
		this.initializePreviews();
	}
	async loadCollections() {
		let userID = false;
		if(this.props.userID){
			userID = this.props.userID;
		} else if(currentUser){
			userID = currentUser.userID;
		}

		//load collections of personal library
		try{
			let expected = 1;
			let allCollections = [];
			let count = 0;
			while((allCollections.length < expected) && count < 5){
				count++;
				let collectionsUrl = apiRequestString({
					'target':'collections',
					'libraryType':'user',
					'libraryID': userID,
					'order':'title',
					'limit':100,
					'start':allCollections.length
				});
				let resp = await ajax({url: collectionsUrl, credentials:'omit'});
				expected = parseInt(resp.headers.get('Total-Results'));
				let collections = await resp.json();
				allCollections = allCollections.concat(...collections);
			}
			let nested = nestCollections(allCollections);
			this.setState({
				collections:nested
			});
			return nested;
		} catch(err) {
			jsError('Error loading collections');
		}
	}
	async initializePreviews(){
		try{
			let collectionPreviews = {};
			for(let i = 0; i < this.state.entryOrder.length; i++){
				let tracking = this.state.entryOrder[i];
				let section = CVEntryMap[tracking];
				if(section.type == 'collection'){
					let preview = await this.previewCollection(section.value);
					collectionPreviews[section.value] = preview;
				}
			}
			this.setState({collectionPreviews});
		} catch(err) {
			jsError('Error initializing previews');
		}
	}
	//load the collection styled with the current style
	async previewCollection(collectionKey){
		log.debug('previewCollection');
		try{
			let userID = false;
			if(this.props.userID){
				userID = this.props.userID;
			} else if(currentUser){
				userID = currentUser.userID;
			}

			let collectionsUrl = apiRequestString({
				'format':'bib',
				'style':this.state.style,
				'linkwrap':1,
				'target':'items',
				'collectionKey':collectionKey,
				'libraryType':'user',
				'libraryID': userID
			});
			let resp = await ajax({url: collectionsUrl, credentials:'omit'});
			let preview = await resp.text();
			return preview;
		} catch(err) {
			jsError('Error loading collection preview');
		}
	}
	appendSection(type){
		let section = {
			type:type,
			heading:'',
			value:'',
			tracking:randomString(8)
		};
		CVEntryMap[section.tracking] = section;
		let entryOrder = this.state.entryOrder;
		entryOrder.push(section.tracking);
		this.setState({
			entryOrder:entryOrder,
			entryMap:CVEntryMap
		}, this.activateEditors);
	}
	insertTextSection(evt){
		evt.preventDefault();
		this.appendSection('text');
	}
	insertCollection(evt){
		evt.preventDefault();
		this.appendSection('collection');
	}
	moveEntry(index, newIndex){
		let entryOrder = this.state.entryOrder;
		let removed = entryOrder.splice(index, 1);
		entryOrder.splice(newIndex, 0, removed[0]);
		//remove tinyMCE editors before moving around the dom which could break them
		tinymce.remove('textarea');
		this.setState({entryOrder:entryOrder, entryMap:CVEntryMap}, this.activateEditors);
	}
	activateEditors(){
		tinymce.init({
			selector: `textarea.rte`,
			toolbar: 'undo redo | bold italic underline | alignleft aligncenter alignright | subscript superscript blockquote',
			branding:false,
			menubar:false,
			statusbar:true
		});
	}
	async updateEntry(tracking, field, value){
		log.debug('updateEntry');
		CVEntryMap[tracking][field] = value;
		if(CVEntryMap[tracking]['type'] == 'collection'){
			let preview = await this.previewCollection(CVEntryMap[tracking]['value']);
			CVEntryMap[tracking]['collectionPreview'] = preview;
			this.setState({preview:preview});
		}
	}
	edit(index){
		this.setState({editing:index}, this.activateEditors);
	}
	save(){
		let cventries = [];
		this.state.entryOrder.map((tracking)=>{
			let entry = CVEntryMap[tracking];
			if(entry.type !== 'text'){
				cventries.push(CVEntryMap[tracking]);
				return;
			}
			let id = `cv_${tracking}`;
			let updatedContent = tinymce.get(id).getContent();
			CVEntryMap[tracking]['value'] = updatedContent;
			cventries.push(CVEntryMap[tracking]);
		});
		let cleancventries = cventries.map((entry)=>{
			entry = Object.assign({}, entry);
			delete entry.tracking;
			return entry;
		});
		let saveObj = {
			style:this.state.style,
			entries:cleancventries
		};
		let savestr = JSON.stringify(saveObj);
	}
	render(){
		let sections = this.state.entryOrder.map((tracking, index)=>{
			let section = CVEntryMap[tracking];
			let editing = (this.state.editing == index);
			return <Section
				ref={tracking}
				section={section}
				index={index}
				key={tracking}
				id={`cv_${tracking}`}
				collections={this.state.collections}
				collectionPreviews={this.state.collectionPreviews}
				moveEntry={this.moveEntry}
				updateEntry={this.updateEntry}
				editing={editing}
				edit={this.edit}
			/>;
		});
		return (
			<div className='CVEditor'>
				<StyleChooser style={this.state.style} changeStyle={(style)=>{this.setState({style});}}/>
				{sections}
				<a href='#' onClick={this.insertTextSection}>Insert a new text section</a>
				{' | '}
				<a href='#' onClick={this.insertCollection}>Insert a new collection from library</a>
				<p><button className='btn' onClick={this.save}>Save C.V.</button></p>
			</div>
		);
	}
}

module.exports = {CVEditor: DragDropContext(HTML5Backend)(CVEditor)};
