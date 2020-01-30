/* global tinymce */

import { log as logger } from '../Log.js';
let log = logger.Logger('CVEditor');

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { DndProvider } from 'react-dnd';
import Backend from 'react-dnd-html5-backend';

import { ajax, postFormData } from '../ajax.js';
import { buildUrl } from '../wwwroutes.js';
import { randomString, jsError, getCurrentUser } from '../Utils.js';

import { StyleChooser } from './styleChooser.js';
import Section from './section.js';
import { apiRequestString } from '../ApiRouter.js';
import { Button, Row, Col } from 'reactstrap';

const currentUser = getCurrentUser();

// take an array of collections and create a tree with subcollections put into 'children'
function nestCollections(collections) {
	let map = {};
	let topLevel = [];
	collections.forEach((collection) => {
		map[collection.key] = collection;
	});
	collections.forEach((collection) => {
		let parentKey = collection.data.parentCollection;
		if (!parentKey) {
			topLevel.push(collection);
		} else {
			let parentCollection = map[parentKey];
			if (Array.isArray(parentCollection.children)) {
				parentCollection.children.push(collection);
			} else {
				parentCollection.children = [collection];
			}
		}
	});
	return topLevel;
}

// very ugly. just keep updated entries outside component state so RTE edits don't force
// re-renders that break tinymce
let CVEntryMap = {};
function CVEditor(props) {
	const { entries } = props;

	const [collections, setCollections] = useState([]);
	const [collectionPreviews, setCollectionPreviews] = useState({});
	const [previewsLoading, setPreviewsLoading] = useState(false);
	const [entryMap, setEntryMap] = useState({});
	const [entryOrder, setEntryOrder] = useState([]);
	const [style, setStyle] = useState(props.style);
	const [editing, setEditing] = useState(false);
	
	useEffect(() => {
		let newEntryMap = {};
		let newEntryOrder = [];
		entries.forEach(function (entry) {
			let tracking = randomString(8);
			entry.tracking = tracking;
			newEntryMap[tracking] = entry;
			newEntryOrder.push(tracking);
		}, this);
		CVEntryMap = newEntryMap;
		setEntryMap(newEntryMap);
		setEntryOrder(newEntryOrder);

		document.documentElement.className += ' react-mounted';
		// activateEditors();
		loadCollections();
	}, []);// , [entries, loadCollections, previewCollection, style]);

	// load the collection styled with the current style
	const previewCollection = useCallback(async (collectionKey, style) => {
		try {
			let userID = false;
			if (props.userID) {
				userID = props.userID;
			} else if (currentUser) {
				userID = currentUser.userID;
			}

			let collectionsUrl = apiRequestString({
				format: 'bib',
				style,
				linkwrap: 1,
				target: 'items',
				collectionKey,
				libraryType: 'user',
				libraryID: userID
			});
			let resp = await ajax({ url: collectionsUrl, credentials: 'omit' });
			let preview = await resp.text();
			return preview;
		} catch (err) {
			jsError('Error loading collection preview');
			return null;
		}
	}, [props.userID]);

	// load previews when entryMap or style change
	useEffect(() => {
		const loadPreviews = async (entryMap) => {
			setPreviewsLoading(true);
			try {
				let newCollectionPreviews = {};
				await Promise.all(Object.keys(entryMap).map(async (tracking) => {
					let section = entryMap[tracking];
					if (section.type == 'collection') {
						let preview = await previewCollection(section.value, style);
						newCollectionPreviews[section.value] = preview;
						return preview;
					}
					return null;
				}));
				setCollectionPreviews(newCollectionPreviews);
			} catch (err) {
				jsError('Error initializing previews');
			}
			setPreviewsLoading(false);
		};
		
		loadPreviews(entryMap);
	}, [entryMap, previewCollection, style]);

	// activate editors when entries are updated
	// this is necessary to reactivate the editor if it has been removed to move a section
	useEffect(() => {
		activateEditors();
	}, [entryMap, entryOrder, editing]);

	const loadCollections = useCallback(async () => {
		let userID = false;
		if (props.userID) {
			userID = props.userID;
		} else if (currentUser) {
			userID = currentUser.userID;
		}

		// load collections of personal library
		try {
			let expected = 1;
			let allCollections = [];
			let count = 0;
			while ((allCollections.length < expected) && count < 5) {
				count++;
				let collectionsUrl = apiRequestString({
					target: 'collections',
					libraryType: 'user',
					libraryID: userID,
					order: 'title',
					limit: 100,
					start: allCollections.length
				});
				let resp = await ajax({ url: collectionsUrl, credentials: 'omit' });
				expected = parseInt(resp.headers.get('Total-Results'));
				let collections = await resp.json();
				allCollections = allCollections.concat(...collections);
			}
			let nested = nestCollections(allCollections);
			setCollections(nested);
			return nested;
		} catch (err) {
			jsError('Error loading collections');
			return null;
		}
	}, [props.userID]);

	const appendSection = (type) => {
		let section = {
			type: type,
			heading: '',
			value: '',
			tracking: randomString(8)
		};
		CVEntryMap[section.tracking] = section;
		let newEntryOrder = [...entryOrder];
		newEntryOrder.push(section.tracking);

		setEntryOrder(newEntryOrder);
		setEntryMap(CVEntryMap);
	};

	const insertTextSection = (evt) => {
		evt.preventDefault();
		appendSection('text');
	};

	const insertCollection = (evt) => {
		evt.preventDefault();
		appendSection('collection');
	};

	const moveEntry = (index, newIndex) => {
		let newEntryOrder = [...entryOrder];
		let removed = newEntryOrder.splice(index, 1);
		newEntryOrder.splice(newIndex, 0, removed[0]);
		// remove tinyMCE editors before moving around the dom which could break them
		tinymce.remove('textarea');
		setEntryOrder(newEntryOrder);
		setEntryMap(CVEntryMap);
	};

	const removeEntry = (index) => {
		let newEntryOrder = [...entryOrder];
		let removed = newEntryOrder.splice(index, 1);
		let removedId = removed[0];

		// remove tinyMCE editors before moving around the dom which could break them
		tinymce.remove('textarea');
		delete CVEntryMap[removedId];
		setEntryMap(CVEntryMap);
		setEntryOrder(newEntryOrder);
	};

	const activateEditors = () => {
		tinymce.init({
			selector: `textarea.rte`,
			toolbar: 'undo redo | bold italic underline | alignleft aligncenter alignright | subscript superscript blockquote',
			branding: false,
			menubar: false,
			statusbar: true
		});
	};

	const updateEntry = async (tracking, field, value) => {
		// log.debug('updateEntry');
		CVEntryMap[tracking][field] = value;
		if (CVEntryMap[tracking].type == 'collection') {
			let newCollectionPreviews = Object.assign({}, collectionPreviews);
			let preview = await previewCollection(CVEntryMap[tracking].value, style);
			newCollectionPreviews[CVEntryMap[tracking].value] = preview;
			setCollectionPreviews(newCollectionPreviews);
		}
		setEntryMap(CVEntryMap);
	};

	const edit = (index) => {
		setEditing(index);
	};

	const save = async () => {
		let cventries = [];
		entryOrder.forEach((tracking) => {
			let entry = CVEntryMap[tracking];
			if (entry.type !== 'text') {
				cventries.push(CVEntryMap[tracking]);
				return;
			}
			let id = `cv_${tracking}`;
			let tinyInstance = tinymce.get(id);
			if (tinyInstance !== null) {
				CVEntryMap[tracking].value = tinyInstance.getContent();
			}
			cventries.push(CVEntryMap[tracking]);
		});
		// make a copy of cv entries without the tracking so it won't be saved
		let cleancventries = cventries.map((entry) => {
			entry = Object.assign({}, entry);
			delete entry.tracking;
			// delete entry.collectionPreview;
			return entry;
		});
		let saveObj = {
			style,
			entries: cleancventries
		};
		let savestr = JSON.stringify(saveObj);
		try {
			// eslint-disable-next-line camelcase
			let resp = await postFormData(buildUrl('updateCv'), { json_cv: savestr }, { withSession: true });
			let respData = await resp.json();
			if (respData.success) {
				// log.debug('saved');
			}
		} catch (e) {
			log.error('error saving');
			log.error(e);
		}
	};

	// render:
	let sections = entryOrder.map((tracking, index) => {
		let section = CVEntryMap[tracking];
		let editingSection = (editing == index);
		let sectionProps = {
			section,
			index,
			key: tracking,
			id: `cv_${tracking}`,
			collections,
			collectionPreviews,
			previewsLoading,
			moveEntry,
			removeEntry,
			updateEntry,
			editing: editingSection,
			edit,
		};
		return <Section
			key={tracking}
			{...sectionProps}
		/>;
	});
	return (
		<div className='CVEditor'>
			<DndProvider backend={Backend}>
				<Row>
					<Col xs='12'>
						<StyleChooser style={style} changeStyle={(newStyle) => { setStyle(newStyle); }}/>
						{sections}
						<a href='#' onClick={insertTextSection}>Insert a new text section</a>
						{' | '}
						<a href='#' onClick={insertCollection}>Insert a new collection from library</a>
						<p><Button onClick={save}>Save C.V.</Button></p>
					</Col>
				</Row>
			</DndProvider>
		</div>
	);
}
CVEditor.propTypes = {
	entries: PropTypes.arrayOf(PropTypes.object),
	style: PropTypes.string,
	userID: PropTypes.number,
};

export { CVEditor };
// module.exports = { CVEditor: DragDropContext(HTML5Backend)(CVEditor) };
