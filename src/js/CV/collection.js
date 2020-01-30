// import { log as logger } from '../Log.js';
// let log = logger.Logger('Collection');

import { PropTypes } from 'prop-types';
import { CustomInput } from 'reactstrap';
import { LoadingSpinner } from '../LoadingSpinner';

function Collection(props) {
	const { updateEntry, section, collections, collectionPreviews, previewsLoading } = props;

	const collectionChange = (evt) => {
		let v = evt.target.value;
		updateEntry(section.tracking, 'value', v);
	};

	const collectionNames = function (collections, depth = 0) {
		let names = [];
		for (let i = 0; i < collections.length; i++) {
			let collection = collections[i];
			names.push({
				name: ' '.repeat(depth) + collection.data.name,
				key: collection.key,
				depth: depth
			});
			if (collection.children) {
				names = names.concat(...collectionNames(collection.children, depth + 1));
			}
		}
		return names;
	};

	let names = collectionNames(collections);
	let options = names.map((collectionName) => {
		let name = collectionName.name;
		let key = collectionName.key;
		return (
			<option key={key} value={key} label={name}>
				{`${' '.repeat(collectionName.depth)}${name}`}
			</option>
		);
	});

	let collectionKey = section.value;
	let previewDiv = null;
	if (collectionPreviews[collectionKey]) {
		previewDiv = <div dangerouslySetInnerHTML={{ __html: collectionPreviews[collectionKey] }}></div>;
	}

	return (
		<div className='cv-collection'>
			<CustomInput
				type='select'
				name='collectionKey'
				id='collectionKey'
				onChange={collectionChange}
				value={collectionKey}
				clearable='false'
			>
				<option value=''>Choose a collection</option>
				{options}
			</CustomInput>
			<p className='text-muted'>Collection from your library that will be formatted as a bibliography</p>
			<LoadingSpinner loading={previewsLoading} />
			{/* {(section.collectionPreview !== undefined) && true } */}
			{previewDiv}
		</div>
	);
}
Collection.propTypes = {
	updateEntry: PropTypes.func.isRequired,
	section: PropTypes.shape({
		tracking: PropTypes.string,
		value: PropTypes.string,
	}),
	collections: PropTypes.arrayOf(PropTypes.shape({
		key: PropTypes.string,
		children: PropTypes.arrayOf(PropTypes.object),
		data: PropTypes.shape({
			name: PropTypes.string
		})
	})),
	collectionPreviews: PropTypes.object,
	previewsLoading: PropTypes.bool,
};

export { Collection };
