
let collect = function(){
	let cursor = document.querySelector('#cursor');
	let url = document.querySelector('#url');
	let spinner = document.querySelector('#spinner');
	let content = document.querySelector('#content');
	let journalIcon = document.querySelector('#journal-icon');
	let zIcon = document.querySelector('#z-icon');
	let clipPath = document.querySelector('#clip-path circle');
	let magnifier = document.querySelector('#magnifier');
	let connectorButtonLg = document.querySelector('#connector-button-lg');
	let journalIconLg = document.querySelector('#journal-icon-lg');
	let tooltip = document.querySelector('#tooltip');
	let zoteroBack = document.querySelector('#zotero-back');
	let zoteroFront = document.querySelector('#zotero-front');
	let zoteroToolbar = document.querySelector('#zotero-toolbar');
	let chromeToolbar = document.querySelector('#chrome-toolbar');
	let newItem = document.querySelector('#new-item');
	let chromeMiddle = document.querySelector('#chrome-middle');

	// Helpers

	let originX = function(element) {
		return element.getBBox().x + element.getBBox().width / 2;
	}

	let originY = function(element) {
		return element.getBBox().y + element.getBBox().height / 2;
	}

	// Loop

	let loop = function() {
		let easeInOut = BezierEasing(0.42, 0, 0.58, 1);
		let strongEaseOut = BezierEasing(0.23, 1, 0.32, 1);
		let stepEasing = function(k) {
			return Math.floor(k * 8) / 8;
		};

		let groupA = new TWEEN.Group();
		let groupB = new TWEEN.Group();
		let groupC = new TWEEN.Group();

		let animate = function() {
			requestAnimationFrame(animate);
			groupA.update();
			groupB.update();
			groupC.update();
		};

		requestAnimationFrame(animate);

		// Group B

		let magnifierGrowCoords = { r: 0, s: 0.67 };
		let magnifierGrowDuration = 250;
		let magnifierGrow = new TWEEN.Tween(magnifierGrowCoords, groupB)
			.to({ r: 100, s: 1 }, magnifierGrowDuration)
			.easing(strongEaseOut)
			.onUpdate(function() {
				clipPath.setAttribute('r', magnifierGrowCoords.r);
				magnifier.setAttribute('transform',
					`matrix(${magnifierGrowCoords.s}, 0 , 0, ${magnifierGrowCoords.s},
					${originX(magnifier) - magnifierGrowCoords.s * originX(magnifier)},
					${originY(magnifier) - magnifierGrowCoords.s * originY(magnifier)})`);
			})
			.delay(500)

		let magnifierShrinkCoords = { r: 100, s: 1 };
		let magnifierShrinkDuration = 250;
		let magnifierShrink = new TWEEN.Tween(magnifierShrinkCoords, groupB)
			.to({ r: 0, s: 0.67 }, magnifierShrinkDuration)
			.easing(TWEEN.Easing.Sinusoidal.Out)
			.onUpdate(function() {
				clipPath.setAttribute('r', magnifierShrinkCoords.r);
				magnifier.setAttribute('transform',
					`matrix(${magnifierShrinkCoords.s}, 0 , 0, ${magnifierShrinkCoords.s},
					${originX(magnifier) - magnifierShrinkCoords.s * originX(magnifier)},
					${originY(magnifier) - magnifierShrinkCoords.s * originY(magnifier)})`);
			})
			.delay(1300) // 250 after moveToZotero

		magnifierGrow.chain(magnifierShrink);

		// Group C

		let connectorButtonLgMouseInCoords = { o: 0, r: 0, g: 105, b: 224 };
		let connectorButtonLgMouseInDuration = 150;
		let connectorButtonLgMouseIn =
			new TWEEN.Tween(connectorButtonLgMouseInCoords, groupC)
			.to({ o: 1, r: 255, g: 255, b: 255 }, connectorButtonLgMouseInDuration)
			.easing(easeInOut)
			.onUpdate(function() {
				connectorButtonLg.setAttribute('opacity',
					connectorButtonLgMouseInCoords.o);
				journalIconLg.setAttribute('fill',
					`rgb(
						${Math.floor(connectorButtonLgMouseInCoords.r)},
						${Math.floor(connectorButtonLgMouseInCoords.g)},
						${Math.floor(connectorButtonLgMouseInCoords.b)})
					`);
			})
			.delay(645)

		let connectorButtonLgMouseOutCoords = { o: 1, r: 255, g: 255, b: 255 };
		let connectorButtonLgMouseOutDuration = 150;
		let connectorButtonLgMouseOut =
			new TWEEN.Tween(connectorButtonLgMouseOutCoords, groupC)
			.to({ o: 0, r: 0, g: 105, b: 224 }, connectorButtonLgMouseOutDuration)
			.easing(easeInOut)
			.onUpdate(function() {
				connectorButtonLg.setAttribute('opacity',
					connectorButtonLgMouseOutCoords.o);
				journalIconLg.setAttribute('fill',
					`rgb(
						${Math.floor(connectorButtonLgMouseOutCoords.r)},
						${Math.floor(connectorButtonLgMouseOutCoords.g)},
						${Math.floor(connectorButtonLgMouseOutCoords.b)})
					`);
			})
			.delay(1085)

		connectorButtonLgMouseIn.chain(connectorButtonLgMouseOut);

		// Group A

		let moveToAddressBarCoords = { tx: 193, ty: 156 };
		let moveToAddressBarDuration = 350;
		let moveToAddressBar = new TWEEN.Tween(moveToAddressBarCoords, groupA)
			.to({ tx: 200, ty: 109 }, moveToAddressBarDuration)
			.easing(easeInOut)
			.onUpdate(function() {
				cursor.setAttribute('transform',
					`translate(${moveToAddressBarCoords.tx},
					${moveToAddressBarCoords.ty})`);
			})

		let clickAddressBarCoords = { s: 0.8 };
		let clickAddressBarDuration = 50;
		let clickAddressBar = new TWEEN.Tween(clickAddressBarCoords, groupA)
			.to({ s: 0.8 }, clickAddressBarDuration)
			.onUpdate(function() {
				cursor.setAttribute('transform',
					`translate(${moveToAddressBarCoords.tx}, ${moveToAddressBarCoords.ty})
					scale(${clickAddressBarCoords.s})`);
			})
			.onComplete(function() {
				cursor.setAttribute('transform',
					`translate(${moveToAddressBarCoords.tx}, ${moveToAddressBarCoords.ty})
					scale(1)`);
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

		let typeUrlCoords = { w: 0 };
		let typeUrlDuration = 500;
		let typeUrl = new TWEEN.Tween(typeUrlCoords, groupA)
			.to({ w: 128 }, typeUrlDuration)
			.easing(stepEasing)
			.onStart(function() {
				url.setAttribute('width', 0);
				url.setAttribute('opacity', 1);
			})
			.onUpdate(function() {
				url.setAttribute('width', typeUrlCoords.w);
			})
			.delay(62.5)

		let spinCoords = { r: 0 };
		let spinDuration = 500;
		let spin = new TWEEN.Tween(spinCoords, groupA)
			.to({ r: 180 }, spinDuration)
			.onStart(function() {
				spinner.setAttribute('opacity', 1);
			})
			.onUpdate(function() {
				spinner.setAttribute('transform', `rotate(${spinCoords.r},
					${originX(spinner)}, ${originY(spinner)})`);
			})
			.onComplete(function() {
				spinner.setAttribute('opacity', 0);
				content.setAttribute('opacity', 1);
				journalIcon.setAttribute('opacity', 1);
				zIcon.setAttribute('opacity', 0);
				magnifierGrow.start();
				connectorButtonLgMouseIn.start();
			})
			.delay(62.5)

		let moveToConnectorCoords = { tx: 200}
		let moveToConnectorDuration = 500;
		let moveToConnector = new TWEEN.Tween(moveToConnectorCoords, groupA)
			.to({ tx: 348 }, moveToConnectorDuration)
			.easing(easeInOut)
			.onStart(function() {
				cursor.setAttribute('opacity', 1);
			})
			.onUpdate(function() {
				cursor.setAttribute('transform',
					`translate(${moveToConnectorCoords.tx},
					${moveToAddressBarCoords.ty})`);
			})
			.onComplete(function() {
				tooltip.setAttribute('opacity', 1)
			})
			.delay(250)

		let clickConnectorCoords = { s: 0.8 };
		let clickConnectorDuration = 50;
		let clickConnector = new TWEEN.Tween(clickConnectorCoords, groupA)
			.to({ s: 0.8 }, clickConnectorDuration)
			.onStart(function() {
				connectorButtonLg.setAttribute('fill', '#002bc5');
			})
			.onUpdate(function() {
				cursor.setAttribute('transform',
					`translate(${moveToConnectorCoords.tx},
					${moveToAddressBarCoords.ty}) scale(${clickConnectorCoords.s})`);
			})
			.onComplete(function() {
				connectorButtonLg.setAttribute('fill', '#0069e0');
				cursor.setAttribute('transform',
					`translate(${moveToConnectorCoords.tx},
					${moveToAddressBarCoords.ty}) scale(1)`);
			})
			.delay(500)

		let moveToZoteroCoords = { tx: 348, ty: 109 };
		let moveToZoteroDuration = 500;
		let moveToZotero = new TWEEN.Tween(moveToZoteroCoords, groupA)
			.to({ tx: 245, ty: 384}, moveToZoteroDuration)
			.easing(easeInOut)
			.onUpdate(function() {
				cursor.setAttribute('transform',
					`translate(${moveToZoteroCoords.tx}, ${moveToZoteroCoords.ty})`);
			})
			.delay(500)

		let clickZoteroCoords = { s: 1 };
		let clickZoteroDuration = 50;
		let clickZotero = new TWEEN.Tween(clickZoteroCoords, groupA)
			.to({ s: 0.8}, clickZoteroDuration)
			.onUpdate(function() {
				cursor.setAttribute('transform',
					`translate(${moveToZoteroCoords.tx},
					${moveToZoteroCoords.ty}) scale(${clickConnectorCoords.s})`);
			})
			.onComplete(function() {
				cursor.setAttribute('transform',
					`translate(${moveToZoteroCoords.tx},
					${moveToZoteroCoords.ty}) scale(1)`);
			})
			.delay(250)

		let focusZoteroCoords = {};
		let focusZotero = new TWEEN.Tween({}, groupA)
			.to({}, 0)
			.onUpdate(function(){
				zoteroBack.setAttribute('opacity', 0);
				zoteroFront.setAttribute('opacity', 1);
				zoteroToolbar.setAttribute('fill', '#e6e6e6');
				chromeToolbar.setAttribute('fill', '#f6f6f6');
			})

		let showItemCoords = { o: 0, tx: 0, ty: -18 };
		let showItemDuration = 150;
		let showItem = new TWEEN.Tween(showItemCoords, groupA)
			.to({ o: 1, tx: 0, ty: 0 }, showItemDuration)
			.easing(TWEEN.Easing.Back.Out)
			.onUpdate(function() {
				newItem.setAttribute('opacity', showItemCoords.o);
				newItem.setAttribute('transform', `translate(${showItemCoords.tx},
					${showItemCoords.ty})`);
			})
			.delay(500)

		let moveToCloseButtonCoords = { tx: 245 , ty: 384 };
		let moveToCloseButtonDuration = 750;
		let moveToCloseButton = new TWEEN.Tween(moveToCloseButtonCoords, groupA)
			.to({ tx: 17, ty: 83 }, moveToCloseButtonDuration)
			.easing(easeInOut)
			.onUpdate(function() {
				cursor.setAttribute('transform',
					`translate(${moveToCloseButtonCoords.tx},
					${moveToCloseButtonCoords.ty})`);
			})
			.delay(500)

		let clickCloseButtonCoords = { s: 0.8 };
		let clickCloseButtonDuration = 50;
		let clickCloseButton = new TWEEN.Tween(clickCloseButtonCoords, groupA)
			.to({ s: 0.8 }, clickCloseButtonDuration)
			.onUpdate(function() {
				cursor.setAttribute('transform',
					`translate(17, 83) scale(${clickCloseButtonCoords.s})`);
			})
			.onComplete(function() {
				cursor.setAttribute('transform',
					`translate(${moveToCloseButtonCoords.tx},
					${moveToCloseButtonCoords.ty}) scale(1)`);
		})
		.delay(250)

		let closeChromeCoords = { o: 1, s: 1, tx: 0, ty: 0 }
		let closeChromeDuration = 250;
		let closeChrome = new TWEEN.Tween(closeChromeCoords, groupA)
			.to({ o: 0, s: 0.5, tx: 0, ty: 48 }, closeChromeDuration)
			.easing(strongEaseOut)
			.onUpdate(function() {
				chromeMiddle.setAttribute('opacity', closeChromeCoords.o);
				chromeMiddle.setAttribute('transform',
					`matrix(${closeChromeCoords.s}, 0, 0, ${closeChromeCoords.s}
					${188 - closeChromeCoords.s * 188},
					${originX(chromeMiddle) - closeChromeCoords.s * originX(chromeMiddle)
					+ closeChromeCoords.ty})`);
			})
			.onComplete(function() {
				content.setAttribute('opacity', 0);
				url.setAttribute('opacity', 0);
				journalIcon.setAttribute('opacity', 0);
				zIcon.setAttribute('opacity', 1);
				zoteroBack.setAttribute('opacity', 1);
				zoteroFront.setAttribute('opacity', 0);
			})

		let moveToStartCoords = { tx: 17, ty: 83 };
		let moveToStartDuration = 500;
		let moveToStart = new TWEEN.Tween(moveToStartCoords, groupA)
			.to({ tx: 193, ty: 156 }, moveToStartDuration)
			.easing(easeInOut)
			.onUpdate(function() {
				cursor.setAttribute('transform',
					`translate(${moveToStartCoords.tx}, ${moveToStartCoords.ty})`);
			})
			.delay(250)

		let openChromeCoords = { o: 0, s: 0.5};
		let openChromeDuration = 250;
		let openChrome = new TWEEN.Tween(openChromeCoords, groupA)
			.to({ o: 1, s: 1 }, openChromeDuration)
			.easing(TWEEN.Easing.Back.Out)
			.onStart(function() {
				chromeToolbar.setAttribute('fill', '#e6e6e6');
				zoteroToolbar.setAttribute('fill', '#f6f6f6');
			})
			.onUpdate(function() {
				chromeMiddle.setAttribute('opacity', openChromeCoords.o);
				chromeMiddle.setAttribute('transform',
					`matrix(${openChromeCoords.s}, 0, 0, ${openChromeCoords.s}
					${188 - openChromeCoords.s * 188},
					${originX(chromeMiddle) - openChromeCoords.s
					* originX(chromeMiddle)})`);
			})
			.onComplete(function() {
				newItem.setAttribute('opacity', 0);

				setTimeout(function() {
					loop();
				}, 500)
			})

		moveToAddressBar.chain(clickAddressBar);
		clickAddressBar.chain(hideCursor);
		hideCursor.chain(typeUrl);
		typeUrl.chain(spin);
		spin.chain(moveToConnector);
		moveToConnector.chain(clickConnector);
		clickConnector.chain(moveToZotero);
		moveToZotero.chain(clickZotero);
		clickZotero.chain(focusZotero);
		focusZotero.chain(showItem);
		showItem.chain(moveToCloseButton);
		moveToCloseButton.chain(clickCloseButton);
		clickCloseButton.chain(closeChrome);
		closeChrome.chain(moveToStart);
		moveToStart.chain(openChrome);

		moveToAddressBar.start();
	}

	loop();
};

export {collect};
