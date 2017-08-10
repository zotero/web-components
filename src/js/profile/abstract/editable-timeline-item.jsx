'use strict';

export default class EditableTimelineItem extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
		Object.keys(this.constructor.EDITABLE_PROPERTIES).forEach(property => {
			this.state[property] = props.value[property] || this.constructor.EDITABLE_PROPERTIES[property];
		});

		this.state['editing'] = false;
		this.state['previous'] = Object.assign({}, props.value);
	}

	edit() {
		this.setState({
			editing: true
		});
	}
	
	save() {
		var updatedItem = {};
		Object.keys(this.constructor.EDITABLE_PROPERTIES).forEach(property => {
			updatedItem[property] = this.state[property];
		});
		updatedItem['id'] = this.props.value.id;

		this.setState(Object.assign({}, updatedItem, {
			editing: false
		}), () => {
			this.props.onUpdate(updatedItem);
		});
	}

	remove() {
		this.props.onDelete(this.props.value.id);
	}

	cancel() {
		this.setState(Object.assign({}, this.state.previous, {
			editing: false
		}));
	}

	focus() {
		this.edit();
	}

	update() {
		var updatedItem = {};

		Object.keys(this.constructor.EDITABLE_PROPERTIES).forEach(property => {
			let inputName = property.replace(/_([a-z])/g, (match, word) => {
				return word.toUpperCase();
			}) + 'Input';
			
			if(this[inputName]) {
				switch(this[inputName].getAttribute('type')) {
					case 'checkbox':
						updatedItem[property] = this[inputName].checked ? true : false;
					break;
					
					default:
						updatedItem[property] = this[inputName].value;
					break;
				}
			}
		});

		this.setState(updatedItem);
	}

	getDuration() {
		var start = new Date(this.state.start_year, this.constructor.MONTHS.indexOf(this.state.start_month) + 1),
		end = this.state.present ? new Date() : new Date(this.state.end_year, this.constructor.MONTHS.indexOf(this.state.end_month) + 1),
		diffMonths = end.getMonth() - start.getMonth(),
		diffYears = end.getYear() - start.getYear(),
		retVal = '';

		if(end - start < 0) {
			return '';
		}

		if (diffMonths < 0) {
			diffYears -= 1;
			diffMonths += 12;
		}

		if(diffYears > 0) {
			retVal += diffYears;
			retVal += diffYears == 1 ? ' year' : ' years';
			diffMonths = diffMonths % 12;
		}

		if(diffMonths > 0) {
			retVal += ' ' + diffMonths;
			retVal += diffMonths == 1 ? ' month' : ' months';
		}

		return `(${retVal})`;
	}

	render() {
		return null;
	}

	static get MONTHS() {
		return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	}
}

EditableTimelineItem.propTypes = {
	value: React.PropTypes.object,
	onUpdate: React.PropTypes.func,
	onDelete: React.PropTypes.func
}
