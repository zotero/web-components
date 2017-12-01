
let collect = function(){

	var e = $('.illu-collect svg');

	var cursor = e.find('#cursor');
	var url = e.find('#url');
	var spinner = e.find('#spinner');
	var content = e.find('#content');
	var journalIcon = e.find('#journal-icon');
	var zIcon = e.find('#z-icon');
	var clipPath = e.find('#clip-path circle');
	var magnifier = e.find('#magnifier');

	TweenLite.defaultEase = Linear.easeNone;
	var tl = new TimelineLite();

	tl.to(cursor, 0.35, {x: 7, y: -47, ease: Power1.easeInOut})

	  .set(cursor, {scale: 0.8, transformOrigin: 'center'}, '+=0.125')

	  .set(cursor, {scale: 1, transformOrigin: 'center'}, '+=0.05')

	  .set(cursor, {scale: 1, opacity: 0}, '+=0.05')

	  .set(url, {opacity: 1, attr: {width: 0}}, '+=0.125')

	  .to(url, 0.5, {attr: {width: 128}, ease: SteppedEase.config(8)})

	  .set(spinner, {opacity: 1})

	  .to(spinner, 0.5, {rotation: 180, transformOrigin: 'center'})

	  .set(spinner, {opacity: 0})
	  .set(content, {opacity: 1})
	  .set(journalIcon, {opacity: 1})
	  .set(zIcon, {opacity: 0})

	  .set(cursor, {opacity: 1}, '+=0.25')
		.set(magnifier, {scale: 0.67, transformOrigin: 'center'})

	  .to(cursor, 0.5, {x: 155, ease: Power1.easeInOut})

	  .to(clipPath, 0.2, {attr: {r: 100}, ease: Power3.easeOut}, "-=0.25")
		.to(magnifier, 0.2, {scale: 1, transformOrigin: 'center', ease: Power3.easeOut}, "-=0.2");

	};

export {collect};
