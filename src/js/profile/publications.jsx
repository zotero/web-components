import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import ZoteroPublications from 'zotero-publications';
import { Spinner } from '../LoadingSpinner.js';

const SHOW_SPINNER_DELAY = 500;

function Publications(props) {
	const [hidden, setHidden] = useState(true);
	const [loading, setLoading] = useState(true);
	const { userID, onPublicationsLoaded } = props;
	
	useEffect(() => {
		let loadPublications = async () => {
			let zp = new ZoteroPublications({
				group: 'type',
				// apiBase: 'apidev.zotero.org',
				apiBase: window.zoteroConfig.baseApiUrl.replace(/https?:\/\//, ''),
				zorgIntegration: true,
				showBranding: false,
				storeCitationPreference: true
			});

			let slowLoadSpinnerTimeout = setTimeout(() => {
				setHidden(false);
				setLoading(true);
			}, SHOW_SPINNER_DELAY);

			zp.getPublications(userID)
				.then((data) => {
					clearTimeout(slowLoadSpinnerTimeout);
					if (data.length) {
						setLoading(false);
						setHidden(false);
						zp.render(data, this.publicationsContainer);
						onPublicationsLoaded();
					} else {
						setLoading(false);
						setHidden(true);
					}
				})
				.catch(() => {
					clearTimeout(slowLoadSpinnerTimeout);
					setHidden(true);
					setLoading(false);
				});
		};
		loadPublications();
	}, [userID, onPublicationsLoaded]);

	if (hidden) {
		return null;
	}

	if (loading) {
		return (<div>
			<h2>Publications</h2>
			<Spinner color='blue' height='36px' width='36px' />
		</div>);
	}

	return (
		<div>
			<h2>Publications</h2>
			<div ref={ ref => this.publicationsContainer = ref}></div>
		</div>
	);
}

Publications.propTypes = {
	userID: PropTypes.number,
	onPublicationsLoaded: PropTypes.func,
};

export { Publications };
