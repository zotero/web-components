'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('BatchDelete');

import {chunkArray} from './Utils.js';
import {LoadingSpinner} from './LoadingSpinner.js';
import {loadAttachmentItems, deleteSlice} from './ajaxHelpers.js';
import { Notifier } from './Notifier.js';
import {Button, Card, CardBody, Progress} from 'reactstrap';

let React = require('react');

class ProgressCard extends React.PureComponent {
	render() {
		let {message, progress, max} = this.props;
		let meter = null;
		if(progress != null){
			meter = <Progress color='info' value={progress} max={max} />;
		}
		return (
			<Card className='progressCard'>
				<CardBody>
					<div className="text-center">{message}</div>
					{meter}
					<div className="text-center"><LoadingSpinner loading={true} /></div>
				</CardBody>
			</Card>
		);
	}
}
ProgressCard.defaultProps = {
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
					max: parseInt(totalAttachments),
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
			progressNode = <ProgressCard {...progress} />;
		}
		if(totalAttachments !== null) {
			attachmentSummary = <p>This library has {totalAttachments} total attachments.</p>;
			if(relevantAttachments !== null) {
				if(deleteFinished || relevantAttachments.length == 0){
					relAttachmentSummary = (
						<div>
							<p>No attachments need to be deleted</p>
							<Button onClick={this.props.save}>Save Settings</Button>
						</div>
					);
				} else {
					relAttachmentSummary = (
						<div>
							<p>{relevantAttachments.length} attachments will be deleted.</p>
							<Button onClick={this.deleteAttachments}>Delete Attachments</Button>
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
