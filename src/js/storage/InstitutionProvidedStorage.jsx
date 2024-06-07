import PropTypes from 'prop-types';

//row showing a single institution subscription note and asking user to verify email if not already done
function InstitutionProvides(props) {
	const { institution } = props;
	let quotaDescription = `${institution.storageQuota} MB of storage`;
	if (institution.storageQuota == 1000000) {
		quotaDescription = 'unlimited storage';
	}
	if (!institution.validated) {
		return (
			<p>{institution.name} provides {quotaDescription} for {institution.email}. <a href='/settings/account#manage-emails'>Confirm your email address</a> to take advantage.</p>
		);
	} else {
		return (
			<p>{institution.name} provides {quotaDescription} for {institution.email}</p>
		);
	}
}
InstitutionProvides.propTypes = {
	institution: PropTypes.shape({
		storageQuota: PropTypes.number,
		validated: PropTypes.bool,
		name: PropTypes.string,
		email: PropTypes.string
	})
};

//the row in storage settings listing all institution provided storage
function InstitutionalRow(props) {
	const { institutions } = props;
	if (!institutions) {
		return null;
	}
	if (institutions.length > 0) {
		let instNodes = institutions.map(function (institution) {
			return <InstitutionProvides key={`${institution.name}_${institution.expiration}`} institution={institution} />;
		});
		return (
			<tr>
				<th>Institutional Storage</th>
				<td>{instNodes}</td>
			</tr>
		);
	}
	return null;
}
InstitutionalRow.propTypes = {
	institutions: PropTypes.arrayOf(PropTypes.object)
};

export { InstitutionalRow };
