<?
$bodyClass = '';

$testData = include('./testdata.php');
$user = null;
if($_GET['user']){
	$username = $_GET['user'];
	if(isset($testData[$username])){
		$user = $testData[$username];
	}
}
?>
<? include('./layoutHeader.php');?>
<!-- Output the breadcrumb if it's set -->
<main>
	<div class='container my-4'>
		<h1 class='text-center'>Support Zotero</h1>
		<div class='row mb-5'>
			<div class='col-md-6 col-xs-12 m-auto'>
				<p>Zotero is a project of the <a href='http://digitalscholar.org/'>Corporation for Digital Scholarship</a>, a nonprofit organization dedicated to the development of software and services for researchers and cultural heritage institutions.</p>
				<p>Development, maintenance, support, and infrastructure costs for Zotero services are funded by <a href='https://www.zotero.org/storage/'>storage subscriptions</a> from individuals and organizations.</p>
				<p>If you’d like to support the development and maintenance of Zotero, including new features and services, but don’t need a storage subscription, you can make a one-time or recurring contribution instead.</p>

				<p class='text-muted'><small>While CDS is a nonprofit organization, it is not registered as a tax exempt entity, so contributions are not tax-deductible.</small></p>
			</div>
		</div>
		<div class='row'>
			<div class='col-md-6 col-xs-12 m-auto'>
				<div id='react-contribute'></div>
			</div>
		</div>
	</div>
</main>

<script src="https://js.stripe.com/v3/"></script>
<script type="text/javascript" charset="utf-8">
    window.zoteroData = {
        planQuotas: {
            "1": 300,
            "2": 2000,
            "3": 6000,
            "4": 10000,
            "5": 25000,
            "6": 1000000
        },
        stripePublishableKey: "pk_test_u8WpYkXuG2X155p0rC4YqkvO",
    };
    
    ZoteroWebComponents.pageReady(function () {
        console.log('pageReady');
        window.stripe = Stripe(window.zoteroData.stripePublishableKey);

        let now = Date.now() / 1000;

        let tests = {
            test1: function () {
                let props = {
                    currentContribution: false,
                    currentUser: null,
                    stripeCustomer: false,
                };

                ReactDOM.unmountComponentAtNode(document.getElementById('react-contribute'));

                window.contributeElement = ReactDOM.render(
                    React.createElement(ZoteroWebComponents.ManageContribution, props),
                    document.getElementById('react-contribute')
                );
            },
            test2: function () {
                let props = {
                    currentContribution: false,
                    currentUser: {"userID":23869,"slug":"testuser1","username":"testUser1","displayName":"Test User","email":"testUser1@example.com"},
                    stripeCustomer: false,
                };

                ReactDOM.unmountComponentAtNode(document.getElementById('react-contribute'));

                window.contributeElement = ReactDOM.render(
                    React.createElement(ZoteroWebComponents.ManageContribution, props),
                    document.getElementById('react-contribute')
                );
            },
            test3: function () {
                let props = {
                    currentContribution: {"contributionID":3,"userID":23869,"amount":1000,"period":"month","stripeCustomer":"cus_HZE2H6VkKW2snp","stripeCharge":"ch_0H05aBrdtwTgWWPNmcmYjSRd","created":"2020-07-01 13:02:36","updated":null,"recur":true},
                    currentUser: {"userID":23869,"slug":"testuser1","username":"testUser1","displayName":"Test User","email":"testUser1@example.com"},
                    stripeCustomer: {"id":"cus_HZE2H6VkKW2snp","object":"customer","account_balance":0,"address":null,"balance":0,"created":1593608555,"currency":null,"default_source":{"id":"card_0H05aArdtwTgWWPNoNF91mYR","object":"card","address_city":"","address_country":null,"address_line1":"","address_line1_check":null,"address_line2":"","address_state":"","address_zip":"22222","address_zip_check":"pass","brand":"Visa","country":"US","customer":"cus_HZE2H6VkKW2snp","cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2021,"fingerprint":"sHJMZxiW6ER3tQSl","funding":"credit","last4":"4242","metadata":[],"name":"Faolan","tokenization_method":null},"delinquent":false,"description":"testUser1","discount":null,"email":"testUser1@example.com","invoice_prefix":"18EE45D9","invoice_settings":{"custom_fields":null,"default_payment_method":null,"footer":null},"livemode":false,"metadata":{"userID":"23869","email":"testUser1@example.com","username":"testUser1"},"name":null,"next_invoice_sequence":1,"phone":null,"preferred_locales":[],"shipping":null,"sources":{"object":"list","data":[{"id":"card_0H05aArdtwTgWWPNoNF91mYR","object":"card","address_city":"","address_country":null,"address_line1":"","address_line1_check":null,"address_line2":"","address_state":"","address_zip":"22222","address_zip_check":"pass","brand":"Visa","country":"US","customer":"cus_HZE2H6VkKW2snp","cvc_check":"pass","dynamic_last4":null,"exp_month":11,"exp_year":2021,"fingerprint":"sHJMZxiW6ER3tQSl","funding":"credit","last4":"4242","metadata":[],"name":"Faolan","tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_HZE2H6VkKW2snp/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_HZE2H6VkKW2snp/subscriptions"},"tax_exempt":"none","tax_ids":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_HZE2H6VkKW2snp/tax_ids"},"tax_info":null,"tax_info_verification":null},
                };

                ReactDOM.unmountComponentAtNode(document.getElementById('react-contribute'));

                window.contributeElement = ReactDOM.render(
                    React.createElement(ZoteroWebComponents.ManageContribution, props),
                    document.getElementById('react-contribute')
                );
            },
            test4: function () {
                let props = {
                    currentContribution: {"contributionID":4,"userID":23869,"amount":3500,"period":"year","stripeCustomer":"cus_HZELWtA12JVvpi","stripeCharge":"ch_0H05slrdtwTgWWPNoeN57hkE","created":"2020-07-01 13:21:48","updated":null,"recur":true},
                    currentUser: {"userID":23869,"slug":"testuser1","username":"testUser1","displayName":"Test User","email":"testUser1@example.com"},
                    stripeCustomer: {"id":"cus_HZELWtA12JVvpi","object":"customer","account_balance":0,"address":null,"balance":0,"created":1593609706,"currency":null,"default_source":{"id":"card_0H05skrdtwTgWWPNDYTy9izu","object":"card","address_city":"","address_country":null,"address_line1":"","address_line1_check":null,"address_line2":"","address_state":"","address_zip":"44444","address_zip_check":"pass","brand":"Visa","country":"US","customer":"cus_HZELWtA12JVvpi","cvc_check":"pass","dynamic_last4":null,"exp_month":5,"exp_year":2035,"fingerprint":"sHJMZxiW6ER3tQSl","funding":"credit","last4":"4242","metadata":[],"name":"FCP","tokenization_method":null},"delinquent":false,"description":"testUser1","discount":null,"email":"testUser1@example.com","invoice_prefix":"9AB9B0AB","invoice_settings":{"custom_fields":null,"default_payment_method":null,"footer":null},"livemode":false,"metadata":{"userID":"23869","email":"testUser1@example.com","username":"testUser1"},"name":null,"next_invoice_sequence":1,"phone":null,"preferred_locales":[],"shipping":null,"sources":{"object":"list","data":[{"id":"card_0H05skrdtwTgWWPNDYTy9izu","object":"card","address_city":"","address_country":null,"address_line1":"","address_line1_check":null,"address_line2":"","address_state":"","address_zip":"44444","address_zip_check":"pass","brand":"Visa","country":"US","customer":"cus_HZELWtA12JVvpi","cvc_check":"pass","dynamic_last4":null,"exp_month":5,"exp_year":2035,"fingerprint":"sHJMZxiW6ER3tQSl","funding":"credit","last4":"4242","metadata":[],"name":"FCP","tokenization_method":null}],"has_more":false,"total_count":1,"url":"/v1/customers/cus_HZELWtA12JVvpi/sources"},"subscriptions":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_HZELWtA12JVvpi/subscriptions"},"tax_exempt":"none","tax_ids":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/customers/cus_HZELWtA12JVvpi/tax_ids"},"tax_info":null,"tax_info_verification":null},
                };

                ReactDOM.unmountComponentAtNode(document.getElementById('react-contribute'));

                window.contributeElement = ReactDOM.render(
                    React.createElement(ZoteroWebComponents.ManageContribution, props),
                    document.getElementById('react-contribute')
                );
            },
            
        };

        let testCase = tests['test1'];
        if(window.location.hash.length > 0){
            let testLabel = window.location.hash.substr(1);
            testCase = tests[testLabel];
        }
        testCase();

        ZoteroWebComponents.cycleTestFuncs(tests);
    });
</script>
<? include('./layoutFooter.php')?>
