'use strict';

//import {log as logger} from './Log.js';
//let log = logger.Logger('CreateGroup');

import {ajax} from './ajax.js';
import {slugify, readCookie} from './Utils.js';
import {buildUrl} from './wwwroutes.js';
import cn from 'classnames';

let React = require('react');

const config = window.zoteroConfig;

class CreateGroup extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			groupName: '',
			selectedType: 'PublicOpen',
			checkingName:false,
			groupNameValid:null,
			preview:''
		};
	}
	changeType = (evt) => {
		let newType = evt.currentTarget.getAttribute('data-grouptype');
		this.setState({selectedType:newType, groupNameValid:null}, this.checkName);
	}
	changeName = (evt) => {
		this.setState({groupName:evt.target.value, groupNameValid:null}, this.checkName);
	}
	checkName = () => {
		let {groupName, selectedType, timer} = this.state;
		clearTimeout(timer);
		let timeout = setTimeout(() => {
			if(selectedType != 'Private'){
				// Poll the server with the input value
				ajax({url:buildUrl('checkGroupName', {name:groupName})}).then((resp)=>{
					resp.json().then((data) => {
						this.setState({groupNameValid:data.valid});
					});
				});
			} else {
				this.setState({groupNameValid:true});
			}
		}, 300);
		this.setState({timer:timeout});
	}
	render() {
		let slugPreview = '';
		const {selectedType, groupName, groupNameValid} = this.state;

		if(selectedType == 'Private') {
			slugPreview = `Group URL: ${config.baseZoteroWebsiteUrl}/groups/<number>`;
		} else {
			let slug = slugify(groupName);
			slugPreview = `Group URL: ${config.baseZoteroWebsiteUrl}/groups/${slug}`;
		}
		let slugStyle = {};
		if(selectedType != 'Private'){
			if(groupNameValid === true){
				slugStyle.color = 'green';
			} else if(groupNameValid === false){
				slugStyle.color = 'red';
			}
		}

		let sessionKey = readCookie(config.sessionCookieName);
		if (sessionKey == null) {
			sessionKey = '';
		}
		return (
			<div id='create-group'>
				<h1>Create a New Group</h1>
				<form encType="application/x-www-form-urlencoded" acceptCharset="utf-8" method="post" className="zform" action="">
					<div className="row">
						<div className="col-md-6">
							<div className="form-group">
								<input
									className={cn('form-control', 'form-control-lg', {'is-invalid':(groupNameValid === false), 'is-valid':(groupNameValid === true)})}
									type='text'
									name='groupName'
									id='groupName'
									placeholder='Group Name'
									onChange={this.changeName}
									onBlur={this.checkName}
									value={groupName}>
								</input>

								<label id='slugpreview' style={slugStyle}>{slugPreview}</label>
							</div>
						</div>
					</div>
					<div className="row">
						<div className='card-deck'>
							<div
								className={cn("card", {selected:(selectedType == 'PublicOpen')})}
								onClick={this.changeType}
								data-grouptype='PublicOpen'
								>
								<div id="public-open" className="card-body">
									<h4 className='card-title'>Public, Open Membership</h4>
									<p className='muted small'>Anyone can view your group online and join the group instantly.</p>
									<div className='form-check'>
										<input className="form-check-input" type="radio" id="publicopenradio" value='PublicOpen' checked={selectedType == 'PublicOpen'} />
										<label className="form-check-label" htmlFor="publicopenradio">
											Select public, open membership
										</label>
									</div>
								</div>
							</div>
							<div
								className={cn("card", {selected:(selectedType == 'PublicClosed')})}
								onClick={this.changeType}
								data-grouptype='PublicClosed'
								>
								<div id="public-closed" className="card-body">
									<h4 className='card-title'>Public, Closed Membership</h4>
									<p className='muted small'>Anyone can view your group online, but members must apply or be invited.</p>
									<div className='form-check'>
										<input className="form-check-input" type="radio" id="publicclosedradio" value='PublicClosed' checked={selectedType == 'PublicClosed'} />
										<label className="form-check-label" htmlFor="publicclosedradio">
											Select public, closed membership
										</label>
									</div>
								</div>
							</div>
							<div
								className={cn("card", {selected:(selectedType == 'Private')})}
								onClick={this.changeType}
								data-grouptype='Private'
								>
								<div id="private" className="card-body">
									<h4 className='card-title'>Private Membership</h4>
									<p className='muted small'>Only members can view your group online and must be invited to join.</p>
									<div className='form-check'>
										<input className="form-check-input" type="radio" id="privateradio" value='Private' checked={selectedType == 'Private'} />
										<label className="form-check-label" htmlFor="privateradio">
											Select private membership
										</label>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="row mt-4">
						<div className='col'>
							<button name="submit" id="submit" type="submit" className="btn btn-secondary">Create Group</button>
						</div>
					</div>
					<input type='hidden' name='session' value={sessionKey} />
				</form>
			</div>
		);
	}
}

export {CreateGroup};
