'use strict';

import {log as logger} from '../Log.js';
let log = logger.Logger('OrcidProfile');

import {useState} from 'react';
import PropTypes from 'prop-types';
import {OrcidIcon} from '../Icons.js';
import {Notifier} from '../Notifier.js';
import {ajax} from '../ajax.js';
import {Row, Col, Button} from 'reactstrap';
import {PencilIcon} from '../Icons.js';

//const config = window.zoteroConfig;
//const orcidClientID = config.orcidClientID;
//const orcidRedirectUrl = config.orcidRedirectUrl;

const orcidStringValue = PropTypes.shape({
	value:PropTypes.string
});
const dateShape = PropTypes.shape({
	year: PropTypes.object.isRequired,
	month: PropTypes.object,
	day: PropTypes.object
});

const timespanShape = {
	startDate: dateShape,
	endDate: dateShape
};

const organizationShape = PropTypes.shape({
	name: PropTypes.string,
	address: PropTypes.shape({
		city: PropTypes.string,
		region: PropTypes.string,
		country: PropTypes.string,
	})
});

const nameShape = {
	person: PropTypes.shape({
		name: PropTypes.shape({
			'given-names': orcidStringValue,
			'family-name': orcidStringValue
		})
	})
};

const organizationEntryShape = PropTypes.shape({
	startDate:dateShape,
	endDate:dateShape,
	organization:PropTypes.object
});

const workShape = PropTypes.shape({
	'work-summary': PropTypes.arrayOf(PropTypes.shape({
		type:PropTypes.string,
		title:PropTypes.shape({
			title: orcidStringValue,
			subtitle: orcidStringValue
		}),
		'publication-date': dateShape
	}))
});

const fundingShape = PropTypes.shape({
	'funding-summary': PropTypes.arrayOf(PropTypes.shape({
		type:PropTypes.string,
		title:PropTypes.shape({
			title: orcidStringValue
		}),
		organization: organizationShape,
		'start-date': dateShape,
		'end-date': dateShape
	}))
});

function FuzzyDate(props){
	const {date} = props;
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
FuzzyDate.propTypes = {
	date:dateShape
};
function TimeSpan(props){
	const getDuration = () => {
		const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		//don't just grab props because they will be references
		let startDate = Object.assign({}, props.startDate);
		let endDate = Object.assign({}, props.endDate);

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
	};
	
	if(!props.startDate.year.value){
		return null;
	}
	let duration = null;
	try {
		duration = getDuration();
	} catch(e){
		log.error('failed to calculate duration:' + e);
	}
	return (
		<span className='time-span'>
			<FuzzyDate date={props.startDate} /> to <FuzzyDate date={props.endDate} />
			<br />
			{duration}
		</span>
	);
}
TimeSpan.propTypes = timespanShape;

function Organization(props) {
	const {name, address} = props.organization;
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
Organization.propTypes = {
	organization: organizationShape
};
function OrganizationEntry(props){
	const {entry, editable, edit} = props;
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
					{editable ? <Button outline size='sm' onClick={edit} ><PencilIcon /></Button> : null}
				</Col>
			</Row>
		</div>
	);
}
OrganizationEntry.defaultProps = {
	edit: function(){}
};
OrganizationEntry.propTypes = {
	editable: PropTypes.bool,
	edit: PropTypes.func,
	entry: organizationEntryShape
};

function Name(props){
	return (
		<h2>{props.person.name['given-names'].value} {props.person.name['family-name'].value}</h2>
	);
}
Name.propTypes = nameShape;

function Biography(props){
	let bio = props.biography.content;
	if(!bio){
		return null;
	}
	let bioEntries = bio.split('\n');
	bioEntries = bioEntries.map((entry)=>{
		return <>{entry}<br /></>;
	});
	return (
		<div className='biography'>
			{bioEntries}
		</div>
	);
}
Biography.propTypes = {
	biography:PropTypes.shape({
		content:PropTypes.string
	})
};

function Educations(props){
	if(!props.educations.length){
		return null;
	}
	return (
	<div className='orcid-educations'>
		<h2>Education</h2>
		{props.educations.map(
			(edu)=>{
				return <OrganizationEntry key={edu.path} entry={edu} />;
			}
		)}
	</div>
	);
}
Educations.propTypes = {
	educations: PropTypes.arrayOf(organizationEntryShape)
};

function Employments(props){
	if(!props.employments.length){
		return null;
	}
	return (
	<div className='orcid-employments'>
		<h2>Employment</h2>
		{props.employments.map(
			(emp)=>{
				return <OrganizationEntry key={emp.path} entry={emp} />;
			}
		)}
	</div>
	);
}
Employments.propTypes = {
	employments: PropTypes.arrayOf(organizationEntryShape)
};


function ResearcherUrls(props){
	if(!props.urls.length){
		return null;
	}
	return (
	<div className='researcher-urls'>
		<h4>Researcher Websites</h4>
		{props.urls.map((website)=>{
			return <a key={website.url.value} className='orcid-researcher-url' href={website.url.value} rel='nofollow'>{website.url.value}</a>;
		})}
	</div>
	);
}
ResearcherUrls.propTypes = {
	urls: PropTypes.arrayOf(PropTypes.shape({
		url:PropTypes.shape({
			value:PropTypes.string
		})
	}))
};

function Work(props){
	let workSummary = props.work['work-summary'];
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
Work.propTypes = {
	work:workShape
};
function Works(props){
	if(!props.works.length){
		return null;
	}
	return (
	<div className='orcid-works'>
		<h2>Works</h2>
		{props.works.map(
			(work)=>{
				return <Work key={work['work-summary'][0].path} work={work} />;
			}
		)}
	</div>
	);
}
Works.propTypes = {
	works: PropTypes.arrayOf(workShape)
};

function Funding(props){
	let f = props.funding['funding-summary'][0];
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
Funding.propTypes = {
	funding: fundingShape
};

function Fundings(props){
	if(!props.fundings.length){
		return null;
	}
	return (
	<div className='orcid-fundings'>
		<h2>Fundings</h2>
		{props.fundings.map(
			(funding)=>{
				return <Funding key={funding['funding-summary'][0].path} funding={funding} />;
			}
		)}
	</div>
	);
}
Fundings.propTypes = {
	fundings: PropTypes.arrayOf(fundingShape)
};

function Keywords(props){
	if(!props.keywords.length){
		return null;
	}
	return (
	<div className='orcid-keywords'>
		<h4>Keywords</h4>
		<ul className='researcher-keywords'>
			{props.keywords.map((keyword)=>{
				return <li key={keyword.content}>{keyword.content}</li>;
			})}
		</ul>
	</div>
	);
}
Keywords.propTypes = {
	keywords: PropTypes.arrayOf(PropTypes.shape({
		content: PropTypes.string
	}))
};

function OrcidProfile(props){
	let {orcidProfile} = props;
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
OrcidProfile.propTypes = {
	orcidProfile: PropTypes.object.isRequired
};

function OrcidProfileControl(props){
	/*
	constructor(props){
		super(props);
		this.state = {
			notification:null,
			orcidProfile:props.orcidProfile
		};
	}
	*/
	/*
	linkOrcid = () => {
		let oauthWindow = window.open(`https://orcid.org/oauth/authorize?client_id=${orcidClientID}&response_type=code&scope=/authenticate&show_login=false&redirect_uri=${orcidRedirectUrl}`, "_blank", "toolbar=no, scrollbars=yes, width=500, height=600, top=500, left=500");
	}
	*/
	const unlinkOrcid = async (evt) => {
		evt.preventDefault();
		let resp = await ajax({url:`/settings/unlinkorcid`});
		let data = await resp.json();
		if(!data.success){
			setNotification({
				type: 'error',
				message: 'We encountered an error unlinking your Orcid ID. Please try again in a few minutes.'
			});
		} else {
			window.location.reload();
		}
	};
	const refreshOrcid = async (evt) => {
		evt.preventDefault();
		let resp = await ajax({url:`/settings/refreshorcid`});
		//let resp = await fetch(`https://zotero.live/settings/refreshorcid`, {credentials: 'same-origin'});
		let data = await resp.json();
		if(!data.success){
			setNotification({
				type: 'error',
				message: 'We encountered an error refreshing your Orcid profile. Please try again in a few minutes.'
			});
		} else {
			let psummary = data.profileSummary;
			let orcid = this.props.orcidProfile.orcid;
			setNotification({
				type: 'success',
				message: 'Orcid profile updated'
			});
			setOrcidProfile({
				orcid,
				profile:psummary
			});
		}
	};
	
	const [orcidProfile, setOrcidProfile] = useState(props.orcidProfile);
	const [notification, setNotification] = useState(null);
	//let {orcidProfile, notification} = this.state;
	if(orcidProfile){
		let fullProfile = null;
		if(this.props.showFull){
			fullProfile = <OrcidProfile orcidProfile={orcidProfile} />;
		}
		return (
			<div className='orcid-profile-control'>
				<Notifier {...notification} />
				<p>Your Zotero profile is currently linked to an ORCID iD.</p>
				<p><a href='https://orcid.org/my-orcid'>Edit ORCID profile</a> | <a href='#' onClick={refreshOrcid}>Refresh ORCID profile</a> | <a onClick={unlinkOrcid} href='#'>Unlink Orcid iD</a></p>
				{fullProfile}
			</div>
		);
	} else {
		return (
			<div className='orcid-profile-control'>
				<Notifier {...notification} />
				<OrcidIcon /> <a href='/settings/linkorcid'>Use data from your ORCID iD profile</a>
				<p>ORCID is an independent non-profit effort to provide an open registry of unique researcher identifiers and open services to link research activities and organizations to these identifiers. Learn more at <a href='https://orcid.org'>orcid.org</a>.</p>
			</div>
		);
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
