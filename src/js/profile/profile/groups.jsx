/* global Zotero:false */
'use strict';

import GroupsBase from '../abstract/groups-base.jsx';
import profileEventSystem from '../profile-event-system.js';

export default class Groups extends GroupsBase {
	constructor(props) {
		super(props);
		this.state = {
			groups: [],
			more: false,
			loading: true
		};
	}

	componentWillMount() {
		this.fetchUserGroups(this.props.userid)
			.then(response => {
				this.setState({
					more: response.fetchedGroups.length > this.props.count,
					groups: response.fetchedGroups.slice(0, this.props.count),
					loading: false
				});
			}).catch(error => {
				profileEventSystem.trigger('alert', {
					level: 'danger',
					message: error.responseJSON ? error.responseJSON.message : 'Failed to update items'
				});
			});
	}

	
	viewMoreHandler(ev) {
		ev.preventDefault();
		this.props.onViewMore();
	}

	render() {
		var viewAllButton;

		if(this.state.groups.length == 0) {
			return null;
		}

		if(this.state.more) {
			viewAllButton = <span className="profile-side-panel-header-link">
				<a onClick={ ev => this.viewMore(ev) } href="">View All</a>
			</span>
		}

		return <div className="profile-side-panel">
			<h3>Groups</h3>
			{ viewAllButton }
			<ul>
				{this.state.groups.map(group => 
					<li key={ group.get('id') }>
						<div>
							{ group.get('name') }
						</div>
						<div>
							<a href={ Zotero.url.groupViewUrl(group) }>Join</a>
						</div>
					</li>)}
			</ul>
		</div>
	}

	static get defaultProps() {
		return {
			count: 3
		};
	}
}

Groups.propTypes = {
	userid: React.PropTypes.number.isRequired,
	count: React.PropTypes.number,
	onViewMore: React.PropTypes.func.isRequired
}