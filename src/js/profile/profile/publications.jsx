'use strict';

import ZoteroPublications from 'zotero-publications';

export default class Publications extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hidden: true,
			loading: true
		}
	}

	componentWillMount() {
		this.zp = new ZoteroPublications({
			'group': 'type',
			'zorgIntegration': true,
			'showBranding': false,
			'storeCitationPreference': true
		});

		this.slowLoadSpinnerTimeout = setTimeout(() => {
			this.setState({
				hidden: false,
				loading: true
			});
		}, this.constructor.SHOW_SPINNER_DELAY);

		this.zp.getPublications(this.props.userid)
			.then(data => {
				clearTimeout(this.slowLoadSpinnerTimeout);
				if(data.length) {
					this.setState({
						loading: false,
						hidden: false
					}, () => {
						this.zp.render(data, this.publicationsContainer);
					});
				} else {
					this.setState({
						loading: false,
						hidden: true
					})
				}
			})
			.catch(() => {
				clearTimeout(this.slowLoadSpinnerTimeout);
				this.setState({
					hidden: true,
					loading: false
				})
			});
	}

	render() {
		if(this.state.hidden) {
			return null;
		}

		if(this.state.loading) {
			return <div>
				<h2>Publications</h2>
				<div className="profile-editable-spinner"></div>
			</div>
		}

		return <div>
			<h2>Publications</h2>
			<div ref={ ref => this.publicationsContainer = ref}></div>
		</div>
	}

	static get SHOW_SPINNER_DELAY() {
		return 500;
	}
}

Publications.propTypes = {
	userid: React.PropTypes.number
}