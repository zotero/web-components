'use strict';

/* global tinymce */
//TODO:
//fix collection preview behaviour
//decide what to do with editable select

import {log as logger} from '../Log.js';
let log = logger.Logger('CVEditor');

const React = require('react');
const {Component} = React;
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import {ajax, postFormData} from '../ajax.js';
import {buildUrl} from '../wwwroutes.js';
import {randomString} from '../Utils.js';

import {StyleChooser} from './styleChooser.js';
import Section from './section.js';
import {jsError, getCurrentUser} from '../Utils.js';
import {apiRequestString} from '../ApiRouter.js';
import {Button, Row, Col} from 'reactstrap';

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
	}
	componentDidMount(){
		document.documentElement.className += ' react-mounted';
		this.activateEditors();
		this.loadCollections();
		this.initializePreviews();
	}
	loadCollections = async () => {
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
	initializePreviews = async () => {
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
	previewCollection = async (collectionKey) => {
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
	appendSection = (type) => {
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
	insertTextSection = (evt) => {
		evt.preventDefault();
		this.appendSection('text');
	}
	insertCollection = (evt) => {
		evt.preventDefault();
		this.appendSection('collection');
	}
	moveEntry = (index, newIndex) => {
		let entryOrder = this.state.entryOrder;
		let removed = entryOrder.splice(index, 1);
		entryOrder.splice(newIndex, 0, removed[0]);
		//remove tinyMCE editors before moving around the dom which could break them
		tinymce.remove('textarea');
		this.setState({entryOrder:entryOrder, entryMap:CVEntryMap}, this.activateEditors);
	}
	removeEntry = (index) => {
		let {entryOrder} = this.state;
		let removed = entryOrder.splice(index, 1);
		let removedId = removed[0];

		//remove tinyMCE editors before moving around the dom which could break them
		tinymce.remove('textarea');
		delete CVEntryMap[removedId];
		this.setState({entryOrder, entryMap:CVEntryMap}, this.activateEditors);
	}
	activateEditors = () => {
		tinymce.init({
			selector: `textarea.rte`,
			toolbar: 'undo redo | bold italic underline | alignleft aligncenter alignright | subscript superscript blockquote',
			branding:false,
			menubar:false,
			statusbar:true
		});
	}
	updateEntry = async (tracking, field, value) => {
		CVEntryMap[tracking][field] = value;
		if(CVEntryMap[tracking]['type'] == 'collection'){
			let collectionPreviews = this.state.collectionPreviews;
			let preview = await this.previewCollection(CVEntryMap[tracking]['value']);
			CVEntryMap[tracking]['collectionPreview'] = preview;
			collectionPreviews[CVEntryMap[tracking]['value']] = preview;
			this.setState({collectionPreviews});
		}
	}
	edit = (index) => {
		this.setState({editing:index}, this.activateEditors);
	}
	save = async () => {
		const {entryOrder, style} = this.state;
		let cventries = [];
		entryOrder.map((tracking)=>{
			let entry = CVEntryMap[tracking];
			if(entry.type !== 'text'){
				cventries.push(CVEntryMap[tracking]);
				return;
			}
			let id = `cv_${tracking}`;
			let tinyInstance = tinymce.get(id);
			if(tinyInstance != null) {
				CVEntryMap[tracking]['value'] = tinyInstance.getContent();
			}
			cventries.push(CVEntryMap[tracking]);
		});
		//make a copy of cv entries without the tracking so it won't be saved
		let cleancventries = cventries.map((entry)=>{
			entry = Object.assign({}, entry);
			delete entry.tracking;
			delete entry.collectionPreview;
			return entry;
		});
		let saveObj = {
			style,
			entries:cleancventries
		};
		let savestr = JSON.stringify(saveObj);
		try{
			let resp = await postFormData(buildUrl('updateCv'), {json_cv:savestr}, {withSession:true});
			let respData = await resp.json();
			if(respData.success){
				log.debug('saved');
			}
		} catch (e) {
			log.error('error saving');
			log.error(e);
		}
	}
	render(){
		const {editing, collections, collectionPreviews, entryOrder, style} = this.state;

		let sections = entryOrder.map((tracking, index)=>{
			let section = CVEntryMap[tracking];
			let editingSection = (editing == index);
			return <Section
				ref={tracking}
				section={section}
				index={index}
				key={tracking}
				id={`cv_${tracking}`}
				collections={collections}
				collectionPreviews={collectionPreviews}
				moveEntry={this.moveEntry}
				removeEntry={this.removeEntry}
				updateEntry={this.updateEntry}
				editing={editingSection}
				edit={this.edit}
			/>;
		});
		return (
			<div className='CVEditor'>
				<Row>
					<Col xs='12'>
						<StyleChooser style={style} changeStyle={(newStyle)=>{this.setState({style:newStyle});}}/>
						{sections}
						<a href='#' onClick={this.insertTextSection}>Insert a new text section</a>
						{' | '}
						<a href='#' onClick={this.insertCollection}>Insert a new collection from library</a>
						<p><Button onClick={this.save}>Save C.V.</Button></p>
					</Col>
				</Row>
			</div>
		);
	}
}

module.exports = {CVEditor: DragDropContext(HTML5Backend)(CVEditor)};
