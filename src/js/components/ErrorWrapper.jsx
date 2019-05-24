'use strict';

import {log as logger} from '../Log.js';
var log = logger.Logger('ErrorWrapper');

const React = require('react');

class ErrorWrapper extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false };
	}

	componentDidCatch(error, info) {
		// Display fallback UI
		this.setState({ hasError: true });
		// You can also log the error to an error reporting service
		log.error(error);
		log.debug(info);
	}

	render() {
		if (this.state.hasError) {
			// You can render any custom fallback UI
			return <h1>Something went wrong loading part of this page.</h1>;
		}
		return this.props.children;
	}
}

export {ErrorWrapper};
