'use strict';

import {log as logger} from './Log.js';
let log = logger.Logger('GroupInvitations');

import {ajax, postFormData} from './ajax.js';
import {getCurrentUser} from './Utils.js';
import {Button, Card, CardHeader, CardBody, Row, Col} from 'reactstrap';

const currentUser = getCurrentUser();

import {Component, Fragment} from 'react';

import {buildUrl} from './wwwroutes.js';

class GroupInvitation extends Component{
	constructor(props){
		super(props);
		this.state = {
			done:false
		};
	}
	acceptInvitation = () => {
		let group = this.props.group;
		let invitation = this.props.invitation;
		let url = buildUrl('groupJoin', {group});
		postFormData(url, {token:invitation.token}).then(()=>{
			this.setState({done:true});
		});
	}
	declineInvitation = () => {
		let group = this.props.group;
		let invitation = this.props.invitation;
		let url = buildUrl('groupDecline', {group, token:invitation.token});
		postFormData(url, {token:invitation.token}).then(()=>{
			this.setState({done:true});
		});
	}
	render(){
		const {done} = this.state;
		if(done){
			return null;
		}
		const {group} = this.props;

		return (
			<Fragment>
				<strong className="group-title"><a href={buildUrl('groupView', {group})}>{group.data.name}</a></strong> 
				{/*<span className="group-description">{group.data.description}</span>*/}
				<div className="group-buttons">
					<Button outline onClick={this.acceptInvitation} className='accept-invitation'>Join</Button>{' '}
					<Button outline onClick={this.declineInvitation} className='ignore-invitation'>Ignore</Button>
				</div>
			</Fragment>
		);
	}
}

class GroupInvitations extends Component{
	constructor(props){
		super(props);
		this.state = {
			invitations:[],
			invitationGroups:[],
			loaded:false
		};
	}
	componentDidMount(){
		this.loadInvitations();
	}
	loadInvitations = () => {
		if(currentUser){
			ajax({url:'/groups/invitations'}).then((resp)=>{
				resp.json().then((data) => {
					let invitationGroups = {};
					data.invitations.forEach((val) => {
						invitationGroups[val.groupID] = data.invitationGroups[val.groupID].apiObj;
					});
					this.setState({
						invitations:data.invitations,
						invitationGroups:invitationGroups,
						loaded:true
					});
				});
			});
		}
	}
	render() {
		let {invitationGroups, invitations, loaded} = this.state;
		if(!loaded){return null;}

		let invitationNodes = invitations.map((invitation)=>{
			let group = invitationGroups[invitation.groupID];
			return (
				<Row key={invitation.groupID}>
					<Col>
						<GroupInvitation key={invitation.groupID} group={group} invitation={invitation} />
					</Col>
				</Row>
			);
		});

		if(invitations.length == 0) {
			return <span className='group-invitations d-none'></span>;
		}
		return (
			<Card className='group-invitations'>
				<CardHeader>Group Invitations</CardHeader>
				<CardBody>
					{invitationNodes}
				</CardBody>
			</Card>
		);
	}
}

export {GroupInvitations};
