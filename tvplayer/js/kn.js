(function() {

if (!window.VMSUI) {
	window.VMSUI = {};
}

var gKeyEventHandlers=[];

//提供给外部的Key处理函数和接口
window.VMSUI.KN = function(e) {
			var focus = $('.kn_focus');
			if (e.target != focus[0] && focus.length != 0) {
				var ne = new $.Event('keydown');
				ne.keyCode = e.keyCode;
				$(focus[0]).trigger(ne);
				if (e.preventDefault) e.preventDefault();
				return;
			}
			var handle = false;
			if (knKeyHandler(e.keyCode)) {
				handle = true;
				if (e.preventDefault) e.preventDefault();
			}
			for(var i=0; i<gKeyEventHandlers.length; ++i) {
				gKeyEventHandlers[i](e, handle);
			}
}

//安装键盘事件
window.VMSUI.KN.install = function()
{
		$(document.body).on('keydown', VMSUI.KN);
}

var lastKeyTime = (new Date()).getTime();

//更新按键时间
VMSUI.KN.updateKeyTime = function()
{
	lastKeyTime = (new Date()).getTime();
}

//获取当前时间减按键时间
VMSUI.KN.subKeyTimeFromNow = function()
{
	var t = (new Date()).getTime();
	if (t < lastKeyTime) { //时间错误，重置时间
		lastKeyTime = t;
		return 0;
	} else if  (t - lastKeyTime > 30*24*3600*1000) { //超出一个月我们认为是时间错误，重置时间
		lastKeyTime = t;
		return 0;
	}
	return t - lastKeyTime;
}

//安装或卸载按键事件处理器
VMSUI.KN.keyEvent = function(cb)
{
	for(var i=0; i<gKeyEventHandlers.length; ++i) {
		if (gKeyEventHandlers[i] == cb) {
			gKeyEventHandlers.splice(i, 1);
			return;
		}
	}
	gKeyEventHandlers.push(cb);
}

	var focusItem;
	var lastContainer;
	var currentContainer;

	function getContainer(it)
	{
		for(; it != null;) {
			var v = $(it).attr('kn_style');
			if (v  == 'vertical' || v == 'horizontal') {
				return it;
			}
			it = it.parentNode;
		}
		return null;
	}

		function forceFocus(it, old)
		{
			if (it == null) return;
			if (old == 1) { //set kn_old_focus
				if ($(it).hasClass('kn_focus')) return;
				var cc = getContainer(it);
				var cfit = $('.kn_focus', cc)[0];
				var ofit = $('.kn_old_focus', cc)[0];
				if (cfit) { //存在当前按激活项目
					return forceFocus(it, false);
				}
				if (ofit == it) return;
				if (ofit) {
					$(ofit).removeClass('kn_old_focus');
				}
				$(it).addClass('kn_old_focus');
				return;
			} else if (old == 2) { //set kn_current
				if ($(it).hasClass('kn_current')) return;
				var cc = getContainer(it);
				var ofit = $('.kn_current', cc)[0];
				if (ofit == it) return;
				if (ofit) {
					$(ofit).removeClass('kn_current');
				}
				$(it).addClass('kn_current');
				return;
			}
			if ($(it).is(':hidden')) { //隐藏元素不可激活
				if (it == focusItem) {
					focusItem = null;
				}
				$(it).removeClass('kn_focus');
				$(it).addClass('kn_old_focus');
				return;
			}
			var  qit = $(it);
			var qfocus = $(focusItem);
			if (focusItem == it)  {
				qit.addClass("kn_focus");
				it.focus();
				return false;
			}
			var parentChanged = false;
			var cc = getContainer(it);
			if (focusItem) {
				qfocus.removeClass("kn_focus");
				var oc = getContainer(focusItem);
				if (oc != cc) { //跨容器
					qfocus.addClass("kn_old_focus");
					parentChanged = true;
					var ne = new $.Event('kn_blur');
					ne.bubbles = false;
					$(oc).trigger(ne);
					lastContainer = oc;
				}
			}
			focusItem = it;
			currentContainer = cc;
			qit.addClass("kn_focus");
			qit.removeClass("kn_old_focus");
			it.focus();
			if (parentChanged && cc) {
				var ne = new $.Event('kn_focus');
				ne.bubbles = false;
				$(cc).trigger(ne);
			}
			if (cc) {
				var ne = new $.Event('kn_child_focus_changed');
				ne.bubbles = false;
				ne.item = it;
				$(cc).trigger(ne);
			}
			return true;
		}

function knKeyHandler(code)
		{
			VMSUI.KN.updateKeyTime();
			if (focusItem) {
				if ($(focusItem).is(':hidden')) {
					focusItem = null;
				}
			}
			var fi = focusItem;
			if (!fi) {
				fi = $('.kn_focus:visible')[0];
			}
			if (!fi) {
				fi = $(':focus')[0];
			}
			if (!fi) {
				var  kn = $('[kn_style]:visible')[0];
				if (kn) {
					fi = $('[tabindex]:visible', kn)[0];
				}
			}
			if (!fi) return false;
			if (fi != focusItem) {
				forceFocus(fi);
			}
			if (code == 13) { //回车
				$(fi).trigger('click');
				return true;
			}
			var fp = getContainer(fi);
			if (!fp) return false;
			var kn_style = $(fp).attr('kn_style');
			var ver;
			if (kn_style == 'vertical') {
				ver = true;
			} else if (kn_style == 'horizontal') {
				ver = false;
			}  else return false;

			var next;
			if (ver) { //竖向导航
				if (code == 38) { //up
					next = findPreNode(fp, fi);
					if (next) {
						forceFocus(next);
					}
				} else if (code == 40) { //down
					next = findNextNode(fp, fi);
					if (next) {
						forceFocus(next);
					}
				}
			} else { //横向导航
				if (code == 37) { //left
					next = findPreNode(fp, fi);
					if (next) {
						forceFocus(next);
					}
				} else if (code == 39) { //right
					next = findNextNode(fp, fi);
					if (next) {
						forceFocus(next);
					}
				}
			}
			if (next) return true; //导航成功
			var kn_name;
			switch(code) {
				case 37:
					kn_name = 'kn_left';
					break;
				case 38:
					kn_name = 'kn_up';
					break;
				case 39:
					kn_name = 'kn_right';
					break;
				case 40:
					kn_name = 'kn_down';
					break;
				case 27:
					kn_name = 'kn_back';
					break;
			}
			if (kn_name == null) return false;
			var kn_val = $(fp).attr(kn_name);
			if (kn_val == null || kn_val == '') return false;
			return activateKN(kn_val);
		}
		//寻找最小的tabindex的直接子元素
		function findMinTabIndex(n)
		{
			var items=[];
			var its = $('[tabindex]:visible', n);
			for(var i=0; i<its.length; ++i) {
				var it = its[i];
				var tab = parseInt($(it).attr('tabindex'));
				if (!isNaN(tab)) {
					items.push({tab: tab, n: it});
				}
			}
			items.sort(function(a, b) { return a.tab - b.tab});
			if (items.length == 0) return null;
			else return items[0].n;
		}

		function activateKN(kn)
		{
			if (typeof kn == 'string') {
				kn += ":visible";
				kn = $(kn)[0];
				if (!kn) return false;
			}
			kn = getContainer(kn);
			if (!kn) return false;
			var cur = $('.kn_old_focus', kn)[0];
			if (cur) {
				forceFocus(cur);
				return true;
			}
			cur = $('.kn_current', kn)[0];
			if (cur) {
				forceFocus(cur);
				return true;
			}
			cur = findMinTabIndex(kn);
			if (cur) {
				forceFocus(cur);
				return true;
			}
			return false;
		}

		//导出激活容器的函数
		VMSUI.KN.activateContainer = activateKN;

		//激活前一次激活的容器
		VMSUI.KN.activateLastContainer = function()
		{
			if (lastContainer != null) {
				return activateKN(lastContainer);
			} else return false;
		}

		function findPreNode(c, n)
		{
			var firstTab = parseInt($(n).attr('tabindex'));
			var items=[];
			var its = $('[tabindex]:visible', c);
			for(var i=0; i<its.length; ++i) {
				var it = its[i];
				var tab = parseInt($(it).attr('tabindex'));
				if (!isNaN(tab)) {
					items.push({tab: tab, n: it});
				}
			}
			items.sort(function(a, b) { return a.tab - b.tab});
			for(var i=items.length-1; i >= 0; --i) {
				if (items[i].tab <= firstTab && items[i].n != n) return items[i].n;
			}
			return null;
		}

		function findNextNode(c, n)
		{
			var firstTab = parseInt($(n).attr('tabindex'));
			var items=[];
			var its = $('[tabindex]:visible', c);
			for(var i=0; i<its.length; ++i) {
				var it = its[i];
				var tab = parseInt($(it).attr('tabindex'));
				if (!isNaN(tab)) {
					items.push({tab: tab, n: it});
				}
			}
			items.sort(function(a, b) { return a.tab - b.tab});
			for(var i=0; i  < items.length; ++i) {
				if (items[i].tab >= firstTab && items[i].n != n) {
					return items[i].n;
				}
			}
			return null;
		}

//设置激活DOM
window.VMSUI.KN.setFocus = forceFocus;
//获取激活DOM
window.VMSUI.KN.getFocus = function()
{
	return focusItem;
}
//保存容器状态
VMSUI.KN.saveState = function(container)
{
	var o={};
	var cdom = $(container)[0];
	var its = $('.kn_current', cdom);
	if (its.length != 0) {
		o.current = [];
		for(var i=0; i<its.length; ++i) {
			o.current.push(its[i]);
		}
	}
	o.focus = $('.kn_focus', cdom)[0];
	its = $('.kn_old_focus', cdom);
	if (its.length != 0) {
		o.old_focus = [];
		for(var i=0; i<its.length; ++i) {
			o.old_focus.push(its[i]);
		}
	}
	o.container = cdom;
	return o;
}

//恢复容器状态
VMSUI.KN.restoreState = function(state, container, cmp)
{
	var cdom = $(container)[0];
	var items=$('[tabindex]', cdom);
	var custom={};
	var ocustom = state.custom;
	var hasFocus = state.focus != null;

	if (state.custom != null) {
		hascustom = true;
		for(var name in state.custom) {
			if (!state.custom[name]) delete state.custom[name];
			custom[name] = null;
		}
	}
	for(var i=0; i<items.length; ++i) {
		var it = items[i];
		if (state.current) {
			for(var j=0; j<state.current.length; ++j) {
				if (cmp(state.current[j], it)) {
					$(it).addClass('kn_current');
					state.current.splice(j, 1);
					break;
				}
			}
			if (state.current.length == 0) {
				state.current = null;
			}
		}
		if (state.focus) {
			if (cmp(state.focus, it)) {
				state.focus = null;
				VMSUI.KN.setFocus(it);
			}
		}
		if (state.old_focus) {
			for(var j=0; j<state.old_focus.length; ++j) {
				if (cmp(state.old_focus[j], it)) {
					state.old_focus.splice(j, 1);
					$(it).addClass('kn_old_focus');
					break;
				}
			}
			if (state.old_focus.length == 0) {
				state.old_focus = null;
			}
		}

		if (state.custom) {
			var pcount=0;
			for(var k in state.custom) {
				pcount++;
				if (cmp(state.custom[k], it)) {
					custom[k] = it;
					delete state.custom[k];
					break;
				}
			}
			if (pcount == 0) {
				state.custom = null;
			}
		}
	}

	if (ocustom) {
		for(var k in custom) {
			ocustom[k] = custom[k];
		}
		state.custom = ocustom;
	}

	if (hasFocus && state.focus) {  //focus元素丢失, 激活容器
		VMSUI.KN.activateContainer(state.container);
	}
}

})();
