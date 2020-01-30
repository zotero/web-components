// import {log as logger} from '../Log.js';
// let log = logger.Logger('Text');

import { EditableRichText } from './editableTextInput.js';
import { PropTypes } from 'prop-types';

function RTE(props) {
	const { id, updateEntry, section } = props;
	
	const editorChange = (content) => {
		updateEntry(section.tracking, 'value', content);
	};

	return <EditableRichText id={id} value={section.value} save={editorChange} />;
}
RTE.propTypes = {
	id: PropTypes.string,
	updateEntry: PropTypes.func.isRequired,
	section: PropTypes.shape({
		tracking: PropTypes.string.isRequired,
		value: PropTypes.string.isRequired,
	}).isRequired
};

export { RTE };
