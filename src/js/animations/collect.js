
let collect = function(){
	let cursor = document.querySelector('#cursor');
	let url = document.querySelector('#url');
	let spinner = document.querySelector('#spinner');
	let content = document.querySelector('#content');
	let journalIcon = document.querySelector('#journal-icon');
	let zIcon = document.querySelector('#z-icon');
	let clipPath = document.querySelector('#clip-path circle');
	let magnifier = document.querySelector('#magnifier');

	let easeInOut = BezierEasing(0.42, 0, 0.58, 1);
	let strongEaseOut = BezierEasing(0.23, 1, 0.32, 1);

	let stepEasing = function(k) {
		return Math.floor(k * 8) / 8;
	};

	let groupA = new TWEEN.Group();
	let groupB = new TWEEN.Group();

	let animate = function(time) {
		requestAnimationFrame(animate);
		groupA.update(time);
		groupB.update(time);
	};

	requestAnimationFrame(animate);

	// Group A

	let moveToAddressBarCoords = { x: 0, y: 0 };
	let moveToAddressBarDuration = 350;
	let moveToAddressBar = new TWEEN.Tween(moveToAddressBarCoords, groupA)
		.to({ x: 7, y: -47 }, moveToAddressBarDuration)
		.easing(easeInOut)
		.onUpdate(function() {
			cursor.style.setProperty('transform',
				`translate(${moveToAddressBarCoords.x}px, \n
				${moveToAddressBarCoords.y}px`);
		})

	let mouseDownCoords = { s: 1 };
	let mouseDownDuration = 0;
	let mouseDown = new TWEEN.Tween(mouseDownCoords, groupA)
		.to({ s: 0.8 }, mouseDownDuration)
		.onStart(function() {
			cursor.style.setProperty('transform-origin', '195px 156px');
		})
		.onUpdate(function() {
			cursor.style.setProperty('transform',
				`translate(${moveToAddressBarCoords.x}px, \n
				${moveToAddressBarCoords.y}px) scale(${mouseDownCoords.s}`);
		})
		.delay(125)

	let mouseUpCoords = { s: 0.8 };
	let mouseUpDuration = 0;
	let mouseUp = new TWEEN.Tween(mouseUpCoords, groupA)
		.to({ s: 1 }, mouseUpDuration)
		.onUpdate(function() {
			cursor.style.setProperty('transform',
				`translate(${moveToAddressBarCoords.x}px, \n
				${moveToAddressBarCoords.y}px) scale(${mouseUpCoords.s}`);
		})
		.delay(50)

	let hideCursorCoords = { o: 1 };
	let hideCursorDuration = 0;
	let hideCursor = new TWEEN.Tween(hideCursorCoords, groupA)
		.to({ o: 0 }, hideCursorDuration)
		.onUpdate(function() {
			cursor.style.setProperty('opacity', hideCursorCoords.o);
		})
		.delay(50)

	let showUrlCoords = { w: 128, o: 0};
	let showUrlDuration = 0;
	let showUrl = new TWEEN.Tween(showUrlCoords, groupA)
		.to({ w: 0, o: 1}, showUrlDuration)
		.onUpdate(function(){
			url.setAttribute('width', showUrlCoords.w);
			url.style.setProperty('opacity', showUrlCoords.o);
		})
		.delay(62.5)

	let typeUrlCoords = { w: 0 };
	let typeUrlDuration = 500;
	let typeUrl = new TWEEN.Tween(typeUrlCoords, groupA)
		.to({ w: 128 }, typeUrlDuration)
		.easing(stepEasing)
		.onUpdate(function() {
			url.setAttribute('width', typeUrlCoords.w);
		})

	let spinCoords = { r: 0 };
	let spinDuration = 500;
	let spin = new TWEEN.Tween(spinCoords, groupA)
		.to({ r: 180 }, spinDuration)
		.onStart(function() {
			spinner.style.setProperty('transform-origin', '71px 77px');
			spinner.setAttribute('opacity', 1);
		})
		.onUpdate(function() {
			spinner.style.setProperty('transform', `rotate(${spinCoords.r}deg)`);
		})
		.onComplete(function() {
			spinner.setAttribute('opacity', 0);
			content.setAttribute('opacity', 1);
			journalIcon.setAttribute('opacity', 1);
			zIcon.setAttribute('opacity', 0);
			magnifierGrow.start();
		})
		.delay(62.5)

	let moveToConnectorCoords = { x: 7 }
	let moveToConnectorDuration = 500;
	let moveToConnector = new TWEEN.Tween(moveToConnectorCoords, groupA)
		.to({ x: 155}, moveToConnectorDuration)
		.easing(easeInOut)
		.onStart(function() {
			cursor.style.setProperty('opacity', 1);
		})
		.onUpdate(function() {
			cursor.style.setProperty('transform',
				`translate(${moveToConnectorCoords.x}px, -47px`);
		})
		.delay(250)

	moveToAddressBar.chain(mouseDown);
	mouseDown.chain(mouseUp);
	mouseUp.chain(hideCursor);
	hideCursor.chain(showUrl);
	showUrl.chain(typeUrl);
	typeUrl.chain(spin);
	spin.chain(moveToConnector);

	moveToAddressBar.start();

	// Group B

	let magnifierCoords = { r: 0, s: 0.67 };
	let magnifierDuration = 250;
	let magnifierGrow = new TWEEN.Tween(magnifierCoords, groupB)
	  .to({ r: 100, s: 1 }, magnifierDuration)
	  .easing(strongEaseOut)
		.onStart(function() {
			magnifier.style.setProperty('transform-origin', '344px 100px')
		})
	  .onUpdate(function() {
		  clipPath.setAttribute('r', magnifierCoords.r);
		  magnifier.style.setProperty('transform', `scale(${magnifierCoords.s})`)
	  })
	  .delay(500)
};

export {collect};



