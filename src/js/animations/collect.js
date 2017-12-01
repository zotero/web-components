
let collect = function(){
	var e = $('.illu-collect');
	var cursor = e.find('#cursor');

	var tl = new TimelineLite();

	tl.to(cursor, 1, {x: 100});
};

export {collect};
