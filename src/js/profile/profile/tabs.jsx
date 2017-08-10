'use strict';

export default class Tabs extends React.Component {
	render() {
		if(this.props.extended) {
			return <div className="profile-tabs">
				<ul className="profile-tabs-tablist nav nav-tabs">
				{ this.props.children.map(children =>
					<li key={ children.props.title } className={ children.props.active ? 'active' : '' }>
						<a onClick={ () => children.props.onMakeActive() }>{ children.props.title }</a>
					</li>
				) }
				</ul>
				<div className="profile-tabs-content tab-content">
					{ this.props.children }
				</div>
			</div>;
		} else {
			return <div>{ this.props.children }</div>;
		}
	}
}

Tabs.propTypes = {
	active: React.PropTypes.bool,
	extended: React.PropTypes.bool,
	children: React.PropTypes.node
}