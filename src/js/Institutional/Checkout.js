// import { log as logger } from '../Log.js';
// let log = logger.Logger('Checkout');

import { useState } from 'react';

// import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap';
import cx from 'classnames';

import { LabCheckout } from './LabCheckout.js';
import { InstitutionCheckout } from './InstitutionCheckout.jsx';

// Checkout is a component that allows a user to enter a number of FTE for their institution and preview
// the price for an institutional plan with that many users, then make the purchase or request an invoice
function Checkout() {
	const [activeTab, setActiveTab] = useState('Lab');

	return (
		<div className='institution-checkout'>
			<h1>Zotero Lab and Zotero Institution</h1>
			<p>Zotero offers two types of unlimited <a href='https://www.zotero.org/support/storage'>storage</a> plans for organizations: Zotero Lab and Zotero Institution. These subscriptions provide members of your organization with unlimited personal and group cloud storage. And as is always the case with Zotero, your users can create as many research groups as they like, with as many members as they need.</p>
			<p>To request more information, please contact <a href='mailto:storage@zotero.org'>storage@zotero.org</a>.</p>
			<Nav tabs>
				<NavItem>
					<NavLink className={cx({ active: activeTab == 'Lab' })} onClick={() => { setActiveTab('Lab'); }}>Lab</NavLink>
				</NavItem>
				<NavItem>
					<NavLink className={cx({ active: activeTab == 'Institution' })} onClick={() => { setActiveTab('Institution'); }}>Institution</NavLink>
				</NavItem>
			</Nav>
			<div className='m-8'>
				<TabContent activeTab={activeTab} className='text-left'>
					<TabPane tabId='Lab'>
						<LabCheckout />
					</TabPane>
					<TabPane tabId='Institution'>
						<InstitutionCheckout />
					</TabPane>
				</TabContent>
			</div>
		</div>
	);
}


export { Checkout };
