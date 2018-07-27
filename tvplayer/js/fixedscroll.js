(function() {
if (!window.VMSUI) {
	window.VMSUI = {};
}

/*!
@brief 修正滚动
@param  filter dom 元素过滤器
@param height 每次滚动的滚动粒度
*/
window.VMSUI.fixedScroll = function(filter, height)
{
	var doms = $(filter);
	for(var i=0; i<doms.length; ++i) {
		var dom = doms[i];
		if (dom.__fixedScroll) continue;
		dom.__fixedScroll = {};
		setDOM(dom);
	}

	function setDOM(dom)
	{
		dom.__fixedScroll.last = dom.scrollTop;
		function handleScroll(e) {
			if  (dom.__fixedScroll.last == dom.scrollTop) return;
			var scrollDown = dom.__fixedScroll.last < dom.scrollTop;
			var offset = dom.scrollTop % height;
			if (offset != 0) {
				if (e.stopImmediatePropagation) e.stopImmediatePropagation();
				if (e.stopPropagation) e.stopPropagation();
				if (scrollDown) {
					dom.scrollTop += height - offset;
				} else {
					if (dom.scrollTop < offset) {
						dom.scrollTop = 0;
					} else {
						dom.scrollTop -= offset;
					}
				}
			}
			dom.__fixedScroll.last = dom.scrollTop;
		}
		var scrollTimer;
		function handleScroll2(e) {
			if (scrollTimer) {
				clearTimeout(scrollTimer);
				scrollTimer = null;
			}
			scrollTimer = setTimeout(function() {
				handleScroll(e);
			}, 100);
		}
		$(dom).scroll(handleScroll);
		function handleWheel(e) {
			var delta=0;
			var oe = e.originalEvent;
		    if (oe) {
			   if (oe.wheelDelta != undefined) delta=-oe.wheelDelta;
			   else if (oe.deltaY != undefined)  {
					if (e.type == 'wheel') {
						delta = oe.deltaY;
					} else {
						delta =-oe.deltaY;
					}
				}
			}
			var top = dom.scrollTop;
			top += delta;
			if (top < 0) top = 0;
			else if (top + dom.clientHeight > dom.scrollHeight) {
				top = dom.scrollHeight - dom.clientHeight;
			}
			dom.scrollTop = top;
			e.preventDefault();
		}
		$(dom).on('mousewheel', handleWheel);
		$(dom).on('wheel', handleWheel);
	}
}


})();
