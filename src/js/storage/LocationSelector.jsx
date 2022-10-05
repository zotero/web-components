// import { log as logger } from '../Log.js';
// const log = logger.Logger('LocationSelector');

import { useState } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { getFlagEmoji } from '../Utils.js'

function LocationSelector(props) {
	const [ dropdownOpen, setDropdownOpen ] = useState(false);
	const { location, setLocation } = props;

	const toggle = () => {
		setDropdownOpen(!dropdownOpen);
	};

	const countries = [
		{code: "Other", string: "Other"},
		{code: "US", string: getFlagEmoji('US') + " US"},
		{code: "BR", string: getFlagEmoji('BR') + " BR"},
		{code: "IN", string: getFlagEmoji('IN') + " IN"},
		{code: "MX", string: getFlagEmoji('MX') + " MX"},
		{code: "EC", string: getFlagEmoji('EC') + " EC"},
		{code: "PE", string: getFlagEmoji('PE') + " PE"},
	];

	let currentCountry = countries.find((country) => country.code == location);
	if (!currentCountry) {
		currentCountry = countries[0];
	}
	let dropdownCountries = countries.filter((country) => country.code != location && country.code != "Other");
	let dropdownItems = dropdownCountries.map((country) => {
		return <DropdownItem key={country.code} onClick={()=>{setLocation(country.code);}}>{country.string}</DropdownItem>;
	});

	return (
		<Dropdown isOpen={dropdownOpen} toggle={toggle}>
			<DropdownToggle caret>
				{currentCountry.string}
			</DropdownToggle>
			<DropdownMenu>
				<DropdownItem header>Billing Location</DropdownItem>
				{dropdownItems}
				<DropdownItem divider />
				<DropdownItem onClick={()=>{setLocation("Other");}}>Other</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
}

export {LocationSelector};
