
let collect = function(){
	let cursor = document.querySelector('#cursor');
	let url = document.querySelector('#url');
	let spinner = document.querySelector('#spinner');
	let content = document.querySelector('#content');
	let clipPath = document.querySelector('#clip-path circle');

	let easeInOut = BezierEasing(0.42, 0, 0.58, 1);

	let stepEasing = function(k) {
		return Math.floor(k * 8) / 8;
	};

	let animate = function(time) {
		requestAnimationFrame(animate);
		TWEEN.update(time);
	};

	requestAnimationFrame(animate);

	let coords1 = { x: 0, y: 0 };
	let duration1 = 350;
	let delay1 = 0;
	let tween1 = new TWEEN.Tween(coords1)
		.to({ x: 7, y: -47 }, duration1)
		.easing(easeInOut)
		.onUpdate(function() {
			cursor.style.setProperty('transform',
				`translate(${coords1.x}px, ${coords1.y}px`);
		})
		.start();

	let coords2 = { s: 1 };
	let duration2 = 0;
	let delay2 = delay1 + duration1 + 125;
	let tween2 = new TWEEN.Tween(coords2)
		.to({ s: 0.8 }, duration2)
		.onUpdate(function() {
			cursor.style.setProperty('transform-origin', '195px 156px');
			cursor.style.setProperty('transform',
				`translate(${coords1.x}px, ${coords1.y}px) scale(${coords2.s}`);
		})
		.delay(delay2)
		.start();

	let delay3 = delay2 + duration2 + 50;
	setTimeout(function() {
		cursor.style.setProperty('transform',
			`translate(${coords1.x}px, ${coords1.y}px) scale(1)`);
	}, delay3);

	let delay4 = delay3 + 50;
	setTimeout(function() {
		cursor.style.setProperty('opacity', 0);
	}, delay4);

	let delay5 = delay4 + 62.5;
	setTimeout(function(){
		url.setAttribute('width', 0);
		url.style.setProperty('opacity', 1);
	}, delay5);

	let coords6 = { w: 0 };
	let duration6 = 500;
	let delay6 = delay5;
	let tween6 = new TWEEN.Tween(coords6)
		.to({ w: 128 }, duration6)
		.easing(stepEasing)
		.onUpdate(function() {
			url.setAttribute('width', coords6.w);
		})
		.delay(delay6)
		.start();

	let delay7 = delay6 + duration6 + 62.5;
	setTimeout(function() {
		spinner.style.setProperty('transform-origin', '71px 77px');
		spinner.style.setProperty('opacity', 1);
	}, delay7);

	let coords8 = { r: 0 };
	let duration8 = 500;
	let delay8 = delay7;
	let tween8 = new TWEEN.Tween(coords8)
		.to({ r: 180 }, duration8)
		.onUpdate(function() {
			spinner.style.setProperty('transform', `rotate(${coords8.r}deg)`);
		})
		.delay(delay8)
		.start()

	let delay9 = delay8 + duration8;
	setTimeout(function() {
		spinner.style.setProperty('opacity', 0);
		content.style.setProperty('opacity', 1);
	}, delay9);

	//let coords3 = { r: clipPath.getAttribute('r') };
	//let delay3 = delay2 + 500;
	//let tween3 = new TWEEN.Tween(coords3)
	//  .to({ r: "+50"}, 500)
	//  .easing(bezier1)
	//  .onUpdate(function(coords3) {
	// 		clipPath.setAttribute('r', coords3.r);
	//  })
	//  .delay(delay3)
	//  .start();

};

export {collect};



