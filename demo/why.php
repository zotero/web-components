<?
$bodyClass = 'why-zotero';

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
<main>
	<div class="container-fluid container-fluid-col-8">
		<img class="img-fluid signpost" src="../assets/images/whyzotero/why-zotero.svg" width="240" height="234" alt="Signpost with three signs, one pointing to Zotero">
		<h1>Why Zotero?</h1>
		<p class="lead text-center">We want to create the best research software available, and we think that means not only producing great, powerful tools, but also providing the best support and making decisions that put you in control of your data.</p>
		<nav class="section-nav text-center">
			<ul>
				<li><a href="#unparalleled-support">Unparalleled Support</a></li>
				<li><a href="#constant-improvement">Constant Improvement</a></li>
				<li><a href="#privacy">Privacy</a></li>
				<li><a href="#free-and-open-source">Free and Open Source</a></li>
				<li><a href="#advanced-features">Advanced Features</a></li>
				<li><a href="#why-not-zotero">Why Not Zotero?</a></li>
			</ul>
		</nav>
		<h2 id="unparalleled-support">Unparalleled Support</h2>
		<p>The software you rely on for your research needs to work. When you have a Zotero question, you can often get a response directly from a Zotero developer or expert community member within minutes. We don’t have customer support representatives — Zotero developers are directly accountable for the software they create, and if you use Zotero for a while there’s a good chance you’ll know some of us by name.</p>
		<p>Other reference managers make you go through customer support representatives who aren’t involved in the development of the software and whose communications are often limited to <a href="https://twitter.com/wesley_holland/status/1003934847138611200">generic Twitter responses</a>.</p>
		<p>See <a href="/support/zotero_support">How Zotero Support Works</a> for more information.</p>
		<h2 id="constant-improvement">Constant Improvement</h2>
		<p>Zotero has been around since 2006, and we’ve worked every day since to make it better. We add new features regularly, and if you find a bug, we’ll often have a fix available for you within a day or two. We’re diligent about supporting new versions of operating systems, browsers, and word processors as they become available.<sup data-footnote="1">1</sup> Zotero developers work in the open, so you can follow along <a href="https://github.com/zotero">on GitHub</a> to see what’s being worked on at any given time, and you can directly influence the direction of the software by participating in discussions in the Zotero Forums.</p>
		<h2 id="privacy">Privacy</h2>
		<p>Zotero is developed by an independent, nonprofit organization with no financial interest in your data, and we consider privacy in every decision we make. Zotero is a local program that stores your data on your own computer, and it can be used without sharing any data with us — you don’t even need to create a Zotero account to use it.<sup data-footnote="2">2</sup> If you do choose to share your data, such as by using Zotero sync, you can take comfort in the knowledge that we’re using it solely to provide you with the best experience and that we don’t view it as a potential revenue stream.</p>
		<p>Read our <a href="/support/privacy">privacy policy</a>.</p>
		<h2 id="free-and-open-source">Free and Open Source</h2>
		<p>As an open-source tool, Zotero is free in two senses of the word: you don’t need to pay to use it, and you’re free to make changes to its code to make it do what you want. The benefits of the first one are obvious, but the second is critical for a program you’re entrusting with your research data. Zotero has always guaranteed users complete access to their own data, but open source means you don’t need to take our word for it. If the organization that runs Zotero disappeared tomorrow, or if we made a decision that didn’t put users’ interests first, others would be free to take Zotero’s source code and continue to maintain and improve it.<sup data-footnote="3">3</sup></p>
		<p>As part of the broader open-source community, we’re committed to supporting open software and open standards. We helped create the Citation Style Language now used in most reference software, and we’re currently contributing to the <a href="https://jrost.org/">Joint Roadmap for Open Science Tools</a>. A tool we built is used by Wikipedia editors to cite sources using Zotero’s powerful web-saving abilities. All the software we create is freely available for others to use and modify.<sup data-footnote="4">4</sup></p>
		<h2 id="advanced-features">Advanced Features</h2>
		<p>The best policies wouldn’t matter if Zotero weren’t also a powerful, professional tool. Zotero has an unmatched ability to save high-quality publication data from websites, journal articles, newspapers, and more, or to retrieve publication data for PDFs you drag in. Word processor integration for Word, LibreOffice, and Google Docs make it easy to manage citations as you write. Zotero can automatically add publication data by DOI or ISBN and find open-access PDFs when you don’t have access to a paper. You can create advanced searches — say, all articles mentioning a certain keyword added in the last month — and save them as auto-updating collections. When you open a paywalled page in your browser, Zotero can automatically redirect you through your institution’s proxy so that you can access the PDF.</p>
		<p>Beyond Zotero’s own features, a plugin system allows outside developers to add advanced functionality to Zotero, such as <a href="http://zotfile.com/">more flexible file management</a> and <a href="https://retorque.re/zotero-better-bibtex/">improved BibTeX support</a>.</p>
		<hr>
		<h2 id="why-not-zotero">Why Not Zotero?</h2>
		<p>Zotero is designed to be a powerful, flexible tool that can accommodate nearly any workflow, but no tool can be perfect for everyone. Here are some of the reasons people choose to use other tools:</p>
		<h3 id="too-complicated">Too complicated</h3>
		<p>People use Zotero in all sorts of ways, and while we strive to make it as easy to use as possible, it includes a lot of advanced functionality that can be intimidating at first.</p>
		<p>If you’re having trouble using Zotero, we strongly encourage you to post to the <a href="https://forums.zotero.org">Zotero Forums</a>, where Zotero developers and experts from the community can walk you through any problems you’re having and help you figure out the best workflow.</p>
		<p>At the end of the day, if you still find Zotero to be more than you need, take a look at <a href="https://zbib.org">ZoteroBib</a>, our free, simple, web-based tool for creating bibliographies, based on the same advanced saving and citation functionality in Zotero.</p>
		<h3 id="not-entirely-web-based">Not entirely web-based</h3>
		<p>Zotero is primarily a program that runs on your own computer. If you choose to create an account and sync your data, you’ll also have access to your web library on zotero.org. However, while the web library allows you to view and edit your data and access synced files, for full functionality you’ll want to install Zotero on each synced computer.</p>
		<p>If you’re not able to install software and just need to create bibliographies, try <a href="https://zbib.org">ZoteroBib</a>.</p>
		<h3 id="no-built-in-pdf-annotation">No built-in PDF annotation</h3>
		<p>Some other programs let you annotate PDFs without leaving the app. In Zotero, you simply double-click an item to open the PDF in whatever PDF reader you prefer, such as Preview on macOS or Acrobat Reader on Windows. We believe this approach lets you choose the best tool for your platform and workflow. External PDF readers also tend to store data in interoperable formats, ensuring that your annotations can be viewed elsewhere if you decide to stop using Zotero. But if you value a built-in PDF reader, Zotero may not be the best tool for you.</p>
		<h3 id="no-mobile-apps">No mobile app</h3>
		<p>Zotero doesn’t currently have an official app for iOS or Android, though <a href="/support/mobile">third-party apps exist</a>.</p>
		<p>The Zotero mobile website allows basic library editing from your phone or tablet, and a <a href="/downloadbookmarklet">bookmarklet</a> allows you to save to your library.</p>
		<p>For annotating PDFs in your Zotero library from a tablet, a common approach is to save PDFs as <a href="https://www.zotero.org/support/attaching_files#file_copies_and_links">linked files</a> in a cloud storage folder such as Dropbox and then annotate them using a PDF annotation app on your tablet. The third-party <a href="http://zotfile.com/">ZotFile plugin</a> makes it easy to manage a linked-file workflow in Zotero.</p>
		<h3 id="no-private-support">No private support</h3>
		<p>Nearly all Zotero support is public, which we feel lets us provide far superior support to that offered by most software. Note that “public” doesn’t mean you’re at the mercy of the crowd: when you ask a question in the Zotero Forums, you’ll get fast, direct support from Zotero developers as well as trusted experts in the community, who bring an incredible depth of knowledge of both Zotero and related academic subjects.</p>
		<p>If you don’t want to post publicly under your name, you can choose a different username for the forums from your account settings, and it’s never necessary to post identifying information publicly.</p>
		<p>See <a href="/support/zotero_support">How Zotero Support Works</a> for more information.</p>
		<p>If you want in-person help, most university libraries offer Zotero instruction and support. It might even be enough to ask a technically inclined friend or colleague to read through the <a href="/support">detailed documentation</a> we provide on many topics.</p>
		<p>But if you’re still committed to telephone- or email-based support, you’ll need to look elsewhere.</p>

		<hr>
		<h2>Ready to try Zotero?</h2>
		<p class="download text-center"><a href="/download" class="btn btn-primary btn-lg">Download</a></p>

		<ol id="footnotes" class="footnotes">
			<li>Other reference managers go through long periods of little to no development that disrupt productivity and even prevent access to research data. For example, EndNote didn’t support Word 2016 <a href="https://twitter.com/EndNoteNews/status/694563436408143872">until 7 months after its release</a>. Mendeley has <a href="https://www.mendeley.com/release-notes/v1_18">taken years to support the latest versions of macOS</a>, and <a href="https://blog.mendeley.com/2018/07/18/how-to-recover-your-files-and-annotations-in-mendeley-desktop-july-2018/">took two months</a> to address reports of PDFs disappearing from users’ libraries.</li>
			<li>Mendeley, RefWorks, and EndNote Web require you to be logged in, so if their owners decided to stop supporting their software, or even if their services were down temporarily, you would be unable to open your library.</li>
			<li><a href="/support/kb/mendeley_import">Mendeley encrypts your database</a>, preventing you from exporting your data in full to other tools and even from accessing your data at all if you can’t open the program. <a href="https://en.wikipedia.org/wiki/EndNote#Legal_dispute_with_Zotero">EndNote has claimed</a> that no one can open EndNote files without their software.</li>
			<li>Though Mendeley, Papers, and Paperpile are proprietary and closed source, they depend on open-source software created by the Zotero community. All use <a href="https://github.com/Juris-M/citeproc-js">the citation processor</a> that was developed to enhance Zotero’s citation abilities. Most of the <a href="https://github.com/citation-style-language/styles">thousands of citation styles</a> they offer were requested or created by Zotero users. The Mendeley word processor plugin is <a href="https://www.mendeley.com/release-notes/v1_19_2">based on an early version of Zotero’s plugin</a>. By using Zotero, you’ll get better support and earlier updates, as well as the chance to influence the development of these tools.</li>
		</ol>
	</div>
</main>
<script>
	ZoteroWebComponents.activateFootnotes();
</script>
<? include('./layoutFooter.php')?>
