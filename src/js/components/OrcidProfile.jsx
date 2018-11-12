'use strict';

import {log as logger} from '../Log.js';
let log = logger.Logger('OrcidProfile');

const React = require('react');
const {Component, PureComponent, Fragment} = React;
import {OrcidIcon} from '../Icons.js';
import {Notifier} from '../Notifier.js';
import {ajax} from '../ajax.js';
import {Row, Col, Button} from 'reactstrap';
import {PencilIcon} from '../Icons.js';

//const config = window.zoteroConfig;
//const orcidClientID = config.orcidClientID;
//const orcidRedirectUrl = config.orcidRedirectUrl;

class FuzzyDate extends PureComponent{
	render(){
		const {date} = this.props;
		if(date === null){
			return 'present';
		}

		let s = date.year.value;
		if(date.month != null){
			s += '-' + date.month.value;
		}
		if(date.day != null){
			s += '-' + date.day.value;
		}
		return s;
	}
}

class TimeSpan extends PureComponent{
	getDuration = () => {
		const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		//don't just grab props because they will be references
		let startDate = Object.assign({}, this.props.startDate);
		let endDate = Object.assign({}, this.props.endDate);

		if(!startDate.month){
			startDate.month = {value:'January'};
		}
		if(endDate && !endDate.month){
			endDate.month = {value:'January'};
		}

		let start, end;
		if(startDate.month && months.includes(startDate.month.value)){
			start = new Date(startDate.year.value, months.indexOf(startDate.month.value));
			end = endDate && endDate.year ? new Date(endDate.year.value, months.indexOf(endDate.month.value)) : new Date();
		} else {
			start = new Date(startDate.year.value, startDate.month.value);
			end = endDate && endDate.year ? new Date(endDate.year.value, endDate.month.value) : new Date();
		}

		let diffMonths = end.getMonth() - start.getMonth();
		let diffYears = end.getYear() - start.getYear();
		let retVal = '';

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
	render(){
		if(!this.props.startDate.year.value){
			return null;
		}
		let duration = null;
		try {
			duration = this.getDuration();
		} catch(e){
			log.error('failed to calculate duration:' + e);
		}
		return (
			<span className='time-span'>
				<FuzzyDate date={this.props.startDate} /> to <FuzzyDate date={this.props.endDate} />
				<br />
				{duration}
			</span>
		);
	}
}
class Organization extends PureComponent{
	render(){
		const {name, address} = this.props.organization;
		let locNode = null;
		if(address.city || address.region || address.country){
			let locStr = address.city ? `${address.city}, ` : '';
			locStr += address.region ? `${address.region}, ` : '';
			locStr += address.country ? address.country : '';
			locStr = locStr.trim();
			if(locStr.endsWith(',')){
				locStr = locStr.substring(0, locStr.length - 1);
			}
			locNode = (
				<span className='organization-location'>
					: {locStr}
				</span>
			);
		}
		return (
			<span className='organization'>
				<b>{name}</b>{locNode}
			</span>
		);
	}
}
class OrganizationEntry extends PureComponent{
	render(){
		const {entry, editable} = this.props;
		return (
			<div className='organization-entry profile-timeline-wrapper'>
				<Row>
					<Col sm={4} className='d-none d-sm-block'>
						<TimeSpan startDate={entry['start-date']} endDate={entry['end-date']} />
					</Col>
					<Col sm={7} className='profile-timeline'>
						<div className="profile-timeline-point" />
						<Organization organization={entry.organization} />
						<br />
						{entry['role-title']} {entry['department-name'] ? `(${entry['department-name']})` : null}
						<div className='d-block d-sm-none'>
							<TimeSpan startDate={entry['start-date']} endDate={entry['end-date']} />
						</div>
					</Col>
					<Col xs={1}>
						{editable ? <Button outline size='sm' onClick={this.props.edit} ><PencilIcon /></Button> : null}
					</Col>
				</Row>
			</div>
		);
	}
}
OrganizationEntry.defaultProps = {
	edit: function(){}
};

class Name extends PureComponent{
	render(){
		return (
			<h2>{this.props.person.name['given-names'].value} {this.props.person.name['family-name'].value}</h2>
		);
	}
}

class Biography extends PureComponent{
	render(){
		let bio = this.props.biography.content;
		if(!bio){
			return null;
		}
		let bioEntries = bio.split('\n');
		bioEntries = bioEntries.map((entry, i)=>{
			return <Fragment key={i}>{entry}<br /></Fragment>;
		});
		return (
			<div className='biography'>
				{bioEntries}
			</div>
		);
	}
}

class Educations extends PureComponent{
	render(){
		if(!this.props.educations.length){
			return null;
		}
		return (
		<div className='orcid-educations'>
			<h2>Education</h2>
			{this.props.educations.map(
				(edu)=>{
					return <OrganizationEntry key={edu.path} entry={edu} />;
				}
			)}
		</div>
		);
	}
}

class Employments extends PureComponent{
	render(){
		if(!this.props.employments.length){
			return null;
		}
		return (
		<div className='orcid-employments'>
			<h2>Employment</h2>
			{this.props.employments.map(
				(emp)=>{
					return <OrganizationEntry key={emp.path} entry={emp} />;
				}
			)}
		</div>
		);
	}
}


class ResearcherUrls extends PureComponent{
	render(){
		if(!this.props.urls.length){
			return null;
		}
		return (
		<div className='researcher-urls'>
			<h4>Researcher Websites</h4>
			{this.props.urls.map((website)=>{
				return <a key={website.url.value} className='orcid-researcher-url' href={website.url.value} rel='nofollow'>{website.url.value}</a>;
			})}
		</div>
		);
	}
}

class Work extends PureComponent{
	render(){
		let workSummary = this.props.work['work-summary'];
		let type = workSummary[0].type;
		type = type.replace('-', ' ').replace('_', ' ').toLowerCase();
		let typeStyle = {textTransform:'capitalize'};

		return (
			<div className='orcid-work'>
				<span className='title'>{workSummary[0].title.title.value}</span>
				{workSummary[0].title.subtitle ? <span className='subtitle'>{workSummary[0].title.subtitle.value}</span> : null}
				<br />
				<FuzzyDate date={workSummary[0]['publication-date']} /> | <span style={typeStyle}>{type}</span>
			</div>
		);
	}
}

class Works extends PureComponent{
	render(){
		if(!this.props.works.length){
			return null;
		}
		return (
		<div className='orcid-works'>
			<h2>Works</h2>
			{this.props.works.map(
				(work)=>{
					return <Work key={work['work-summary'][0].path} work={work} />;
				}
			)}
		</div>
		);
	}
}


class Funding extends PureComponent{
	render(){
		let f = this.props.funding['funding-summary'][0];
		let type = f.type.toLowerCase();
		let typeStyle = {textTransform:'capitalize'};
		return (
			<div className='orcid-funding'>
				<span className='title'>{f.title.title.value}</span>
				<br />
				<span className='funder'><Organization organization={f.organization} /></span>
				<br />
				<TimeSpan startDate={f['start-date']} endDate={f['end-date']} /> | <span style={typeStyle}>{type}</span>
			</div>
		);
	}
}

class Fundings extends PureComponent{
	render(){
		if(!this.props.fundings.length){
			return null;
		}
		return (
		<div className='orcid-fundings'>
			<h2>Fundings</h2>
			{this.props.fundings.map(
				(funding)=>{
					return <Funding key={funding['funding-summary'][0].path} funding={funding} />;
				}
			)}
		</div>
		);
	}
}

class Keywords extends PureComponent{
	render(){
		if(!this.props.keywords.length){
			return null;
		}
		return (
		<div className='orcid-keywords'>
			<h4>Keywords</h4>
			<ul className='researcher-keywords'>
				{this.props.keywords.map((keyword)=>{
					return <li key={keyword.content}>{keyword.content}</li>;
				})}
			</ul>
		</div>
		);
	}
}

class OrcidProfile extends PureComponent{
	/*
	loadOrcid = async (orcid) => {
		log.debug('loadOrcid');
		let resp = await fetch(`https://api.orcid.org/v2.1/${orcid}`);
		let data = await resp.json();
		console.log(data);
		this.setState({data});
	}
	*/
	render(){
		let {orcidProfile} = this.props;
		let orcidHref = `https://orcid.org/${orcidProfile.orcid}`;

		let person = orcidProfile.profile['person'];
		let urls = person['researcher-urls']['researcher-url'];
		let biography = person['biography'];
		let keywords = person.keywords.keyword;

		let acts = orcidProfile.profile['activities-summary'];
		let edus = acts['educations']['education-summary'];
		let emps = acts['employments']['employment-summary'];
		let works = acts['works']['group'];
		let fundings = acts['fundings']['group'];

		return (
			<div className='orcid-profile'>
				<Name person={person} />
				<p><OrcidIcon /> <a href={orcidHref}>{orcidHref}</a></p>
				<Biography biography={biography} />
				<Educations educations={edus} />
				<Employments employments={emps} />
				<Fundings fundings={fundings} />
				<Works works={works} />
				<ResearcherUrls urls={urls} />
				<Keywords keywords={keywords} />
			</div>
		);
	}
}

class OrcidProfileControl extends Component{
	constructor(props){
		super(props);
		this.state = {
			notification:null,
			orcidProfile:props.orcidProfile
		};
	}
	/*
	linkOrcid = () => {
		let oauthWindow = window.open(`https://orcid.org/oauth/authorize?client_id=${orcidClientID}&response_type=code&scope=/authenticate&show_login=false&redirect_uri=${orcidRedirectUrl}`, "_blank", "toolbar=no, scrollbars=yes, width=500, height=600, top=500, left=500");
	}
	*/
	unlinkOrcid = async (evt) => {
		evt.preventDefault();
		let resp = await ajax({url:`/settings/unlinkorcid`});
		let data = await resp.json();
		if(!data.success){
			this.setState({notification:{
				type: 'error',
				message: 'We encountered an error unlinking your Orcid ID. Please try again in a few minutes.'
			}});
		} else {
			window.location.reload();
		}
	}
	refreshOrcid = async (evt) => {
		evt.preventDefault();
		let resp = await ajax({url:`/settings/refreshorcid`});
		//let resp = await fetch(`https://zotero.live/settings/refreshorcid`, {credentials: 'same-origin'});
		let data = await resp.json();
		if(!data.success){
			this.setState({notification:{
				type: 'error',
				message: 'We encountered an error refreshing your Orcid profile. Please try again in a few minutes.'
			}});
		} else {
			let psummary = data.profileSummary;
			let orcid = this.props.orcidProfile.orcid;
			this.setState({
				notification:{
					type: 'success',
					message: 'Orcid profile updated'
				},
				orcidProfile:{
					orcid,
					profile:psummary
				}
			});
		}
	}
	render(){
		let {orcidProfile, notification} = this.state;
		if(orcidProfile){
			let fullProfile = null;
			if(this.props.showFull){
				fullProfile = <OrcidProfile orcidProfile={orcidProfile} />;
			}
			return (
				<div className='orcid-profile-control'>
					<Notifier {...notification} />
					<p>Your Zotero profile is currently linked to an ORCID iD.</p>
					<p><a href='https://orcid.org/my-orcid'>Edit ORCID profile</a> | <a href='#' onClick={this.refreshOrcid}>Refresh ORCID profile</a> | <a onClick={this.unlinkOrcid} href='#'>Unlink Orcid iD</a></p>
					{fullProfile}
				</div>
			);
		} else {
			return (
				<div className='orcid-profile-control'>
					<Notifier {...this.state.notification} />
					<OrcidIcon /> <a href='/settings/linkorcid'>Use data from your ORCID iD profile</a>
					<p>ORCID is an independent non-profit effort to provide an open registry of unique researcher identifiers and open services to link research activities and organizations to these identifiers. Learn more at <a href='https://orcid.org'>orcid.org</a>.</p>
				</div>
			);
		}
	}
}
OrcidProfileControl.defaultProps = {
	showFull:true
};

let orcidizeTimelineEntry = function(d){
	return {
		'department-name':d.department,
		organization:{
			address:{
				city:d.city,
				country:d.country,
				region:d.state,
			},
			name:d.institution
		},
		'role-title':d.degree_name,
		'start-date':{
			month:{
				value:d.start_month
			},
			year:{
				value:d.start_year
			}
		},
		'end-date': d.present ? null : {
			month:{
				value:d.end_month
			},
			year:{
				value:d.end_year
			}
		},
	};
};

export {OrcidProfile, OrcidProfileControl, Name, Biography, Educations, Employments, Fundings, Works, ResearcherUrls, Keywords, OrganizationEntry, TimeSpan, Organization, orcidizeTimelineEntry};
