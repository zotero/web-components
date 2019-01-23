'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('BatchDelete');

import {chunkArray} from './Utils.js';
import {LoadingSpinner} from './LoadingSpinner.js';
import {loadAttachmentItems, deleteSlice} from './ajaxHelpers.js';
import { Notifier } from './Notifier.js';

let React = require('react');

class Progress extends React.PureComponent {
	render() {
		log.debug(this.props);
		let {message, progress, max} = this.props;
		let meter = null;
		if(progress != null){
			meter = (<meter min="0" max={max} value={progress}>{progress}/{max}</meter>);
		}
		return (
			<div className='progress'>
				<span className='message'>{message}</span>
				{meter}
				<LoadingSpinner loading={true} />
			</div>
		);
	}
}
Progress.defaultProps = {
	progress:0,
	max:100
};

class BatchDelete extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			error:null,
			loading:false,
			totalAttachments:null,
			relevantAttachments:null,
			deleteFinished:false
		};
	}
	componentDidMount = () => {
		this.getAttachments();
	}
	getAttachments = async () => {
		let {groupID} = this.props;
		let {totalAttachments} = this.state;
		let attachments = [];
		this.setState({
			loading:true,
			progress:{
				message:'Checking all attachments'
			}
		});
		this.setState({loading:true});
		do {
			let start = attachments.length;
			let response = await loadAttachmentItems(groupID, start);
			if(!totalAttachments){
				totalAttachments = response.headers.get('total-results');
				this.setState({totalAttachments});
			}
			let data = await response.json();
			attachments = attachments.concat(data);
			this.setState({
				progress:{
					message:'Checking all attachments',
					max: totalAttachments,
					progress:attachments.length
				}
			});
		} while (attachments.length < totalAttachments);
		
		log.debug('got all attachments, finding relevant ones');
		let relevantAttachments = attachments.filter((item) => {
			return (item.data.linkMode == 'imported_url' || item.data.linkMode == 'imported_file');
		});
		log.debug(relevantAttachments);
		this.setState({relevantAttachments, loading:false, progress:null});
	}
	deleteAttachments = async () => {
		let {groupID} = this.props;
		let {relevantAttachments} = this.state;
		let itemKeys = relevantAttachments.map((item) => {
			return item.key;
		});
		let itemKeySlices = chunkArray(itemKeys, 10);
		for(let i=0; i < itemKeySlices.length; i++){
			this.setState({
				progress:{
					message: 'Deleting attachments',
					progress:i,
					max:itemKeySlices.length
				}
			});
			let resp = await deleteSlice(groupID, itemKeySlices[i]);
			if(!resp.ok){
				log.debug('There was an error deleting attachment items. Please try again in a few minutes.');
				this.setState({error:'There was an error deleting attachment items. Please try again in a few minutes.'});
				return;
			}
		}
		this.setState({
			progress:null,
			deleteFinished:true
		});
	}
	render() {
		let {error, totalAttachments, relevantAttachments, progress, deleteFinished} = this.state;
		let notification = null;
		let attachmentSummary = null;
		let relAttachmentSummary = null;
		let progressNode = null;
		if(error){
			notification = <Notifier message={error} type='error' />;
		}
		if(progress) {
			progressNode = <Progress {...progress} />;
		}
		if(totalAttachments !== null) {
			attachmentSummary = <p>This library has {totalAttachments} total attachments.</p>;
			if(relevantAttachments !== null) {
				if(deleteFinished || relevantAttachments.length == 0){
					relAttachmentSummary = (
						<div>
							<p>No attachments need to be deleted</p>
							<button onClick={this.props.save}>Save Settings</button>
						</div>
					);
				} else {
					relAttachmentSummary = (
						<div>
							<p>{relevantAttachments.length} attachments will be deleted.</p>
							<button onClick={this.deleteAttachments}>Delete Attachments</button>
						</div>
					);
				}
			}
		}
		return (
			<div className='batchDelete'>
				{notification}
				<p>Choosing the selected settings requires deleting any stored attachment files for this library.</p>
				{attachmentSummary}
				{relAttachmentSummary}
				{progressNode}
			</div>
		);
	}
}

export {BatchDelete};
