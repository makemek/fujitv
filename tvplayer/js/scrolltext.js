(function() {
if (!window.VMSUI) {
	window.VMSUI = {};
}
/**
 *
 * @param filter scroll filter or filter array [focus filter ,scroll filter]
 * @param speed scroll width
 * @param space add the number of Spaces
 * @param interval
 * @param isFocusToScroll whether need focus to scroll
 */
window.VMSUI.scrollText = function(filter, speed, space,interval,isFocusToScroll, delayToScroll)
{
    if(isFocusToScroll === undefined)isFocusToScroll=true;
    if(interval === undefined || isNaN(parseInt(interval))) interval= 50;
    var domFilter;
    var focusFilter;
    if (Array.isArray(filter)) {
        focusFilter = filter[0];
        domFilter = filter[1];
        if (!domFilter) domFilter = focusFilter;
    } else {
        domFilter = focusFilter = filter;
    }
    if (!speed) speed=2;
    if (!space) space=1;
	if (delayToScroll == null) delayToScroll = 0;
    var doms=$(domFilter);
    var focusDoms = doms;
    if (domFilter != focusFilter) {
        focusDoms = $(focusFilter);
    }
    for(var i=0; i<doms.length; ++i) {
        install(doms[i], focusDoms[i]);
    }

    function escapeXML(s)
    {
        if (s == null) s='';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function clearScroll(resumeOrgText)
    {
        if (resumeOrgText === undefined) resumeOrgText = true;
        if (this._scrollCtx) {
            clearInterval(this._scrollCtx.timer);
            if (resumeOrgText) {
                $(this).html(this._text);
            }
            $(this._scrollCtx.focusDom).unbind('focus', this._scrollCtx.onFocus);
            $(this._scrollCtx.focusDom).unbind('blur', this._scrollCtx.onBlur);
            delete this._scrollCtx;
        }
        delete this.clearScroll;
    }

    function install(dom, focusDom) {
        if (!focusDom) focusDom = dom;
        if (dom.clearScroll) {
            return;
            //dom.clearScroll(false);
        }
        if (dom.clientWidth >= dom.scrollWidth) return; //无需滚动
        dom._scrollCtx = {timer: null, pos: 0, running: false, focusDom: focusDom};
        dom._text = $(dom).html();
		var text = escapeXML($(dom).text());
        var scrollText = "<div style=\"position:relative;white-space: nowrap;\">" + text;
        for(var i=0; i<space; ++i) {
            scrollText += "&nbsp;";
        }
        scrollText += text + "</div>";

		var inited = false;
        dom.clearScroll = clearScroll;
        dom._scrollCtx.onFocus = function() { //开始滚动
			if (delayToScroll != 0) {
				dom._scrollCtx.timerDelayer = setTimeout(scroll, delayToScroll);
			} else scroll();
            function scroll() {
				dom._scrollCtx.running = true;
				clearInterval(dom._scrollCtx.timer);
				dom._scrollCtx.pos = 0;
				dom._scrollCtx.timer = setInterval(function() {
					if (!inited) {
						inited = true;
						dom._scrollCtx._noScrollWidth =  $(dom)[0].scrollWidth;
						$(dom).html(scrollText);
						dom._scrollCtx._scrollWidth =  $("div", dom)[0].scrollWidth;
					}
					if (!isFocusToScroll) {
						if ($(focusDom).is(':hidden')) { //隐藏态
							if (dom._scrollCtx.running) { //还在走，停止
								$(dom).html('');
								$(dom).html(dom._text);
								dom._scrollCtx.pos  = 0;
								dom._scrollCtx.running = false;
							}
							return;
						} else { //显示态
							if (!dom._scrollCtx.running) {
								dom._scrollCtx.onFocus();
								return;
							}
						}
					}
					if (-dom._scrollCtx.pos >= dom._scrollCtx._scrollWidth/2) { //已经滚过一半空格了
						dom._scrollCtx.pos = dom._scrollCtx._scrollWidth + dom._scrollCtx.pos - dom._scrollCtx._noScrollWidth;
					}
					dom._scrollCtx.pos -= speed;
	//                console.log("timer: pos="+dom._scrollCtx.pos);
					$("div", dom).css('left', dom._scrollCtx.pos);
				}, interval);
			}
        };
        dom._scrollCtx.onBlur =  function() { //退出滚动
			if (dom._scrollCtx.timerDelayer) {
				clearTimeout(dom._scrollCtx.timerDelayer);
				dom._scrollCtx.timerDelayer = null;
			}
            dom._scrollCtx.running = false;
			if (inited) {
				$(dom).html(dom._text);
				inited = false;
			}
            clearInterval(dom._scrollCtx.timer);
            dom._scrollCtx.timer = null;
            dom._scrollCtx.pos  = 0;
        };
        if (isFocusToScroll) {
			var focus=$(focusDom);
			focus.on('focus', dom._scrollCtx.onFocus);
            $(focusDom).on('blur',dom._scrollCtx.onBlur);
			if (focus.length != 0) {
				var it = $(':focus')[0];
				for(var i=0; i<focus.length; ++i) {
					if (it == focus[i]) {
						dom._scrollCtx.onFocus();
						break;
					}
				}
			}
        } else {
            dom._scrollCtx.onFocus();
        }
    }
}

})();
