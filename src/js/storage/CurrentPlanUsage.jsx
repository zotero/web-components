import PropTypes from 'prop-types';
import { dateFormatOptions, userSubscriptionShape } from './constants.js';
import { Progress } from 'reactstrap';

//usage meter showing proportion of storage quota being currently used
function StorageMeter(props) {
	const { userSubscription } = props;
	
	let quota = userSubscription.quota;
	if (quota >= 1000000) {
		return null;
	}

	let quotaPercentage = parseFloat(userSubscription.usage.total) / parseFloat(quota) * 100.0;
	quotaPercentage = quotaPercentage.toFixed(1);

	let color;
	switch (true) {
	case (quotaPercentage < 40):
		color = 'success';
		break;
	case (quotaPercentage < 70):
		color = 'warning';
		break;
	case (quotaPercentage >= 70):
		color = 'danger';
		break;
	default:
		color = 'success';
	}

	return (
		<div>
			<div className='text-center'>{quotaPercentage}%</div>
			<Progress value={quotaPercentage} max='100' color={color} />
		</div>
	);
}
StorageMeter.propTypes = {
	userSubscription: userSubscriptionShape,
}

//text saying how much storage the given group is using
function GroupUsage(props) {
	const { group, usage } = props;
	if (!group) {
		return null;
	}
	return (
		<p>{group.title} - {usage} MB</p>
	);
}
GroupUsage.propTypes = {
	group: PropTypes.shape({
		title: PropTypes.string
	}),
	usage: PropTypes.number
};

//rows in storage page listing current plan and usage details
function CurrentPlanUsageRows(props) {
	const { userSubscription, storageGroups } = props;

	let expirationDate = <td>Never</td>;
	if (userSubscription.expirationDate && (userSubscription.expirationDate != '0')) {
		let d = new Date(parseInt(userSubscription.expirationDate) * 1000);
		let dateString = <p>{d.toLocaleDateString('en-US', dateFormatOptions)}</p>;
		let numDateFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric' };
		
		if (d < Date.now()) {
			expirationDate = (<td>
				{dateString}
				<p>Your previous Zotero storage subscription has expired.</p>
			</td>);
		} else if (userSubscription.recur) {
			expirationDate = (<td>
				{dateString}
				<p>Your Zotero storage subscription is set to automatically renew {d.toLocaleDateString('en-US', numDateFormatOptions)}.</p>
			</td>);
		} else {
			expirationDate = (<td>
				{dateString}
				<p>Your Zotero storage subscription will expire {d.toLocaleDateString('en-US', numDateFormatOptions)} if you don&apos;t renew before then.</p>
			</td>);
		}
	}

	//number of MB or "Unlimited"
	let quotaDescription = userSubscription.quota + ' MB';
	if (userSubscription.quota >= 1000000) {
		quotaDescription = 'Unlimited';
	}

	//build list of storage usage by groups owned the this user
	let groupUsageNodes = [];
	for (let groupID in userSubscription.usage.groups) {
		let usage = parseInt(userSubscription.usage.groups[groupID]);
		groupUsageNodes.push(<GroupUsage key={groupID} group={storageGroups[groupID]} usage={usage} />);
	}

	return (
		<>
			<tr>
				<th>Quota</th>
				<td>{quotaDescription}</td>
			</tr>
			<tr>
				<th>Expiration</th>
				{expirationDate}
			</tr>
			<tr>
				<th>Current Usage</th>
				<td>
					<p>My Library - {userSubscription.usage.library} MB</p>
					{groupUsageNodes}
					<p>Total - {userSubscription.usage.total} MB</p>
					<StorageMeter {...{userSubscription}} />
				</td>
			</tr>
		</>
	)
}

export { CurrentPlanUsageRows };
