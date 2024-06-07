import PropTypes from 'prop-types';
import { userSubscriptionShape } from './constants';
import { Button } from 'reactstrap';

//Row to select the corresponding storage plan
function StoragePlanRow(props) {
	const { plan, userSubscription, selectPlan, currencySymbol } = props;

	const current = plan.storageLevel == userSubscription.storageLevel;
	let button = (
		<Button color='secondary' size='sm' onClick={() => { selectPlan(plan); }}>Select Plan</Button>
	);
	
	let rowClass = '';
	if (current) {
		button = 'Current Plan';
		rowClass = 'current-plan';
	}
	if (plan.storageLevel == 1) {
		button = '';
	}
	return (
		<tr key={plan.storageLevel} className={rowClass}>
			<td>{plan.description}</td>
			<td>{plan.priceString.replace('$', currencySymbol)}</td>
			<td>
				{button}
			</td>
		</tr>
	);
}

StoragePlanRow.propTypes = {
	plan: PropTypes.shape({
		storageLevel: PropTypes.number,
		description: PropTypes.string,
		price: PropTypes.string
	}).isRequired,
	userSubscription: userSubscriptionShape,
	selectPlan: PropTypes.func.isRequired,
};


function StoragePlansSection(props) {
	const { location, setLocation, userSubscription, selectPlan, storagePlans, currency } = props;
	let currencySymbol = currency.toLowerCase() == 'eur' ? '€' : '$';
	let planRowNodes = storagePlans.map((plan) => {
		return <StoragePlanRow 
			{...{
				key: plan.storageLevel,
				plan,
				userSubscription,
				selectPlan,
				currencySymbol,
			}}
		/>;
	});

	let locationFooter = null;
	/*
	if (props.showLocation) {
		locationFooter = (
			<div className='section-footer'>
				<LocationSelector {...{
					location,
					setLocation,
				}} />
				<p>Prices shown require that the payment card address matches the selected country.</p>
			</div>
		);
	}
	*/

	return (
		<div className='change-storage-plan'>
			<div className='section-header'>
				<b>Change Plan</b>
			</div>
			<div className='section-body'>
				<table className='table table-striped'>
					<tbody>
						<tr>
							<th>Storage Amount</th>
							<th colSpan={2}>Annual Price ({currency.toUpperCase()}) <span className='hint text-muted small'>plus tax where applicable</span></th>
						</tr>
						{planRowNodes}
					</tbody>
				</table>
			</div>
			{locationFooter}
		</div>
	);
}

export { StoragePlansSection };
