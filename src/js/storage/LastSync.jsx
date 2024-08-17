'use strict';

// import {log as logger} from '../Log.js';
// let log = logger.Logger('LastSync.jsx');

import React, { useState, useEffect } from 'react';
import {ajax} from '../ajax.js';

function LastSync(){
    const [loaded, setLoaded] = useState(false);
	const [lastSync, setLastSync] = useState({});
	
	useEffect(()=>{
		const fetchData = async ()=>{
            // log.debug("fetching lastSync data");
			//load lastSync information once
			let resp = await ajax({url:`/storage/lastsync`, credentials:'include'});
			let data = await resp.json();
			setLastSync(data);
			setLoaded(true);
		};
		
		fetchData();
	}, []);

	if(!loaded) {
		return null;
	}
	if (lastSync.lastSyncData === null) {
		return (
			<div className='lastSync'>
				<p>No currently active clients that have synced.</p>
			</div>
		);
	}

	let {lastUsedRelative, recentIPs, locations} = lastSync.lastSyncData;
	let lastIP = recentIPs[0]['ip'];
	let lastLocation = locations[lastIP];

	if (!(lastIP && lastLocation && lastUsedRelative)) {
		return (
			<div className='lastSync'>
				<p>There was an error retrieving last sync data.</p>
			</div>
		);
	}

	return (
		<div className='lastSync'>
			<p>Last Zotero client sync: {lastUsedRelative} from {lastIP} ({lastLocation})</p>
		</div>
	);
}

export {LastSync};
