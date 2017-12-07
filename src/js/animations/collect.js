
let collect = function(){
	let cursor = document.querySelector('#cursor');
	let url = document.querySelector('#url');
	let spinner = document.querySelector('#spinner');
	let content = document.querySelector('#content');
	let journalIcon = document.querySelector('#journal-icon');
	let zIcon = document.querySelector('#z-icon');
	let clipPath = document.querySelector('#clip-path circle');
	let magnifier = document.querySelector('#magnifier');
	let tooltip = document.querySelector('#tooltip');
	let zoteroBack = document.querySelector('#zotero-back');
	let zoteroFront = document.querySelector('#zotero-front');
	let newItem = document.querySelector('#new-item');

	let easeInOut = BezierEasing(0.42, 0, 0.58, 1);
	let strongEaseOut = BezierEasing(0.23, 1, 0.32, 1);

	let stepEasing = function(k) {
		return Math.floor(k * 8) / 8;
	};

	let groupA = new TWEEN.Group();
	let groupB = new TWEEN.Group();

	let animate = function() {
	 requestAnimationFrame(animate);
	 groupA.update();
	 groupB.update();
	};

	requestAnimationFrame(animate);

	// Group A

	let moveToAddressBarCoords = { x: 193, y: 156 };
	let moveToAddressBarDuration = 350;
	let moveToAddressBar = new TWEEN.Tween(moveToAddressBarCoords, groupA)
		.to({ x: 200, y: 109 }, moveToAddressBarDuration)
		.easing(easeInOut)
		.onUpdate(function() {
			cursor.setAttribute('transform',
				`translate(${moveToAddressBarCoords.x}, \n
				${moveToAddressBarCoords.y})`);
		})
		.delay(3000)

	let clickAddressBarCoords = { s: 0.8 };
	let clickAddressBarDuration = 50;
	let clickAddressBar = new TWEEN.Tween(clickAddressBarCoords, groupA)
		.to({ s: 0.8 }, clickAddressBarDuration)
		.onUpdate(function() {
			cursor.setAttribute('transform',
				`translate(${moveToAddressBarCoords.x}, \n
				${moveToAddressBarCoords.y}) scale(${clickAddressBarCoords.s})`);
		})
		.onComplete(function() {
			cursor.setAttribute('transform',
				`translate(${moveToAddressBarCoords.x}, \n
				${moveToAddressBarCoords.y}) scale(1)`);
		})
		.delay(125)

	let hideCursorCoords = { o: 1 };
	let hideCursorDuration = 0;
	let hideCursor = new TWEEN.Tween(hideCursorCoords, groupA)
		.to({ o: 0 }, hideCursorDuration)
		.onUpdate(function() {
			cursor.setAttribute('opacity', hideCursorCoords.o);
		})
		.delay(50)

	let showUrlCoords = { w: 128, o: 0};
	let showUrlDuration = 0;
	let showUrl = new TWEEN.Tween(showUrlCoords, groupA)
		.to({ w: 0, o: 1}, showUrlDuration)
		.onUpdate(function(){
			url.setAttribute('width', showUrlCoords.w);
			url.setAttribute('opacity', showUrlCoords.o);
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
			spinner.setAttribute('opacity', 1);
		})
		.onUpdate(function() {
			spinner.setAttribute('transform', `rotate(${spinCoords.r}, 71, 77)`);
		})
		.onComplete(function() {
			spinner.setAttribute('opacity', 0);
			content.setAttribute('opacity', 1);
			journalIcon.setAttribute('opacity', 1);
			zIcon.setAttribute('opacity', 0);
			magnifierGrow.start();
		})
		.delay(62.5)

	let moveToConnectorCoords = { x: 200}
	let moveToConnectorDuration = 500;
	let moveToConnector = new TWEEN.Tween(moveToConnectorCoords, groupA)
		.to({ x: 348 }, moveToConnectorDuration)
		.easing(easeInOut)
		.onStart(function() {
			cursor.setAttribute('opacity', 1);
		})
		.onUpdate(function() {
			cursor.setAttribute('transform',
				`translate(${moveToConnectorCoords.x}, ${moveToAddressBarCoords.y})`);
		})
		.onComplete(function() {
			tooltip.setAttribute('opacity', 1)
		})
		.delay(250)

	let clickConnectorCoords = { s: 0.8 };
	let clickConnectorDuration = 50;
	let clickConnector = new TWEEN.Tween(clickConnectorCoords, groupA)
		.to({ s: 0.8 }, clickConnectorDuration)
		.onUpdate(function() {
			cursor.setAttribute('transform',
			`translate(${moveToConnectorCoords.x}, \n
			${moveToAddressBarCoords.y}) scale(${clickConnectorCoords.s})`);
		})
		.onComplete(function() {
			cursor.setAttribute('transform',
				`translate(${moveToConnectorCoords.x}, \n
				${moveToAddressBarCoords.y}) scale(1)`);
		})
		.delay(500)

	let moveToZoteroCoords = { x: 348, y: 109 };
	let moveToZoteroDuration = 500;
	let moveToZotero = new TWEEN.Tween(moveToZoteroCoords, groupA)
		.to({ x: 245, y: 384}, moveToZoteroDuration)
		.easing(easeInOut)
		.onUpdate(function() {
			cursor.setAttribute('transform',
			`translate(${moveToZoteroCoords.x}, ${moveToZoteroCoords.y})`)
		})
		.delay(500)

	let clickZoteroCoords = { s: 1 };
	let clickZoteroDuration = 50;
	let clickZotero = new TWEEN.Tween(clickZoteroCoords, groupA)
		.to({ s: 0.8}, clickZoteroDuration)
		.onUpdate(function() {
			cursor.setAttribute('transform',
			`translate(${moveToZoteroCoords.x}, \n
			${moveToZoteroCoords.y}) scale(${clickConnectorCoords.s})`);
		})
		.onComplete(function() {
			cursor.setAttribute('transform',
				`translate(${moveToZoteroCoords.x}, \n
				${moveToZoteroCoords.y}) scale(1)`);
		})
		.delay(250)

	let focusZoteroCoords = {};
	let focusZotero = new TWEEN.Tween({}, groupA)
		.to({}, 0)
		.onUpdate(function(){
			zoteroBack.setAttribute('opacity', 0);
			zoteroFront.setAttribute('opacity', 1);
		})

	//let newItemCoords = { y: -18 };
	//let newItemDuration = 150;
	//let newItem = new TWEEN.Tween(newItemCoords, groupA)
	//	.to({ y: 0 }, newItemDuration)
	//	.onStart(function() {
	//		zoteroBack.setAttribute('opacity', 0);
	//		zoteroFront.setAttribute('opacity', 1);
	//	})
	//	.onUpdate(function() {
	//		newitem.style.setProperty('transform', `translateY(${newItemCoords.y}px)`);
	//	})


	moveToAddressBar.chain(clickAddressBar);
	clickAddressBar.chain(hideCursor);
	hideCursor.chain(showUrl);
	showUrl.chain(typeUrl);
	typeUrl.chain(spin);
	spin.chain(moveToConnector);
	moveToConnector.chain(clickConnector);
	clickConnector.chain(moveToZotero);
	moveToZotero.chain(clickZotero);
	clickZotero.chain(focusZotero);

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



