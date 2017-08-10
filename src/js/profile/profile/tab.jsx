'use strict';

export default class Tab extends React.Component {
	render() {
		var classes = 'profile-tab-content tab-pane';

		if(this.props.active) {
			classes += ' active';
		}
		return <div className={classes}>
				{ this.props.children }
			</div>;
	}
}

Tab.propTypes = {
	active: React.PropTypes.bool,
	children: React.PropTypes.node
}