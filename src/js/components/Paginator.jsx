// import {log as logger} from '../Log.js';
// let log = logger.Logger('Paginator');

import { PropTypes } from 'prop-types';

function Paginator(props) {
	// log.debug(props);
	let { page, pageSize, total, setPage } = props;
	let totalPages = Math.ceil(total / pageSize);
	
	if (totalPages < 2) {
		return null;
	}
	let pageLinks = [];
	if (totalPages < 5) {
		for (let i = 1; i <= totalPages; i++) {
			if (i == page) {
				let l = <a key={i} className="paginator-link current" onClick={() => {
					setPage(i);
				}}>{i}</a>;
				pageLinks.push(l);
			}
			else {
				let l = <a key={i} className="paginator-link" onClick={() => {
					setPage(i);
				}}>{i}</a>;
				pageLinks.push(l);
			}
		}
	}
	else {
		if (page > 1) {
			pageLinks.push(<a key={'first'} className="paginator-link first" onClick={() => {
				setPage(1);
			}}>First</a>);
		}
		for (let i = Math.max(1, page - 2); i <= totalPages && i <= page + 2; i++) {
			if (i == page) {
				let l = <a key={i} className="paginator-link current" onClick={() => {
					setPage(i);
				}}>{i}</a>;
				pageLinks.push(l);
			}
			else {
				let l = <a key={i} className="paginator-link" onClick={() => {
					setPage(i);
				}}>{i}</a>;
				pageLinks.push(l);
			}
		}
		if (totalPages > (page + 2)) {
			pageLinks.push(<a key={'last'} className="paginator-link last" onClick={() => {
				setPage(totalPages);
			}}>Last</a>);
		}
	}
	return (<div className="paginator">
		{pageLinks}
	</div>);
}
Paginator.defaultProps = {
	pageSize: 10
};
Paginator.propTypes = {
	page: PropTypes.number,
	pageSize: PropTypes.number,
	total: PropTypes.number,
	setPage: PropTypes.func,
};

export { Paginator };
