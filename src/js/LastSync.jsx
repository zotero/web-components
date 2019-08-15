'use strict';

// import {log as logger} from './Log.js';
// let log = logger.Logger('LastSync.jsx');

import React, { useState, useEffect } from 'react';
import {ajax} from './ajax.js';

function LastSync(){
	const [loaded, setLoaded] = useState(false);
	const [lastSync, setLastSync] = useState({});
	
	useEffect(()=>{
		const fetchData = async ()=>{
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

	return (
		<div className='lastSync'>
			<p>Last Zotero client sync: {lastUsedRelative} from {recentIPs[0]} ({locations[recentIPs[0]]})</p>
		</div>
	);
}

export {LastSync};
