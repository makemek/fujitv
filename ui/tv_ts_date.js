//处理直播日期

//视图对象
var _view;
//频道控件
var _epgCtl;
//记录最后一次记录的分类索引
var _lastDateIndex = -1;
var _liveDateDoms=[];
//视图加载
exports.onLoad = function(view, params)
{
	_view = view;
	_epgCtl = params.epg_ctl;
	$(_epgCtl.view).on('data_updated', handleEPGUpdate);
	$(_epgCtl.view).on('item_scroll', handleEPGFocus);
	VMSUI.fixedScroll($(".ts_date_wrapper", _view)[0], 110);
	$(_epgCtl.view).on('playnew', function(e, d) {
		_lastDateIndex = d.date_index;
		VMSUI.KN.setFocus(_liveDateDoms[d.date_index].dom, 1);
		VMSUI.KN.setFocus(_liveDateDoms[d.date_index].dom, 2);
		VMSUI.makeVisible(_liveDateDoms[d.date_index].dom);
	});
	handleEPGUpdate();
	//监听条目高亮事件，更新上下箭头状态
		$('.ts_date_wrapper', _view).on('scroll', handleScroll);
		$(_view).on('kn_child_focus_changed', handleScroll);
		function handleScroll(e) {
			var  chns = $('.ts_date_wrapper', _view)[0];
			if (chns.scrollTop > 0) {
				$('.tv_channels_header', _view).addClass('highlight');
			} else {
				$('.tv_channels_header', _view).removeClass('highlight');
			}
			if (chns.scrollTop + chns.clientHeight + 55 < chns.scrollHeight) { //下面还有
				$('.tv_channels_footer', _view).addClass('highlight');
			} else {
				$('.tv_channels_footer', _view).removeClass('highlight');
			}
		}
}

//频道数据发生变化
function handleEPGUpdate()
{
	var dateItems = $('.ts_date_items', _view);
	dateItems.empty();
	_liveDateDoms=[];
	var dates = _epgCtl.getDateList();
	if (dates.length == 0) {
		_lastDateIndex = -1;
		return;
	}
	var tab=1;
	for(var i=0; i<dates.length; ++i) {
		var d = dates[i];
		var catDiv = $("<div class=\"epg_date\"><div class=\"day_text\"></div><div class=\"date_text\"></div></div>");
		$('.day_text', catDiv[0]).text(d.dayText);
		$('.date_text', catDiv[0]).text(d.monthText+"/"+d.dateText);
		d.index = i;
		catDiv.prop("date_item", d);
		catDiv.attr("tabindex", tab++);
		dateItems[0].appendChild(catDiv[0]);
		_liveDateDoms.push({dom: catDiv[0]});
		catDiv.click(handleDateChange);
	}
	var playIdx = _epgCtl.getCurrentPlayIndex();
	if (playIdx == -1) {
		var ctEPG = _epgCtl.getCurrentTimeEPG();
		if (ctEPG != null) {
			playIdx = ctEPG.index;
		}
	}
	if (playIdx != -1) {
		var tss = _epgCtl.getCurrentTSS();
		_lastDateIndex = tss[playIdx].dateIndex;
		VMSUI.KN.setFocus(_liveDateDoms[_lastDateIndex].dom, 1);
		VMSUI.KN.setFocus(_liveDateDoms[_lastDateIndex].dom, 2);
		VMSUI.makeVisible(_liveDateDoms[_lastDateIndex].dom);
	}
	$(_view).trigger('data_updated');
}

function handleEPGFocus(e, it)
{
	var dateIdx = it.__model.dateIndex;
	if (dateIdx != _lastDateIndex) {
		_lastDateIndex = dateIdx;
		VMSUI.KN.setFocus(_liveDateDoms[dateIdx].dom, 1);
		VMSUI.KN.setFocus(_liveDateDoms[dateIdx].dom, 2);
		VMSUI.makeVisible(_liveDateDoms[dateIdx].dom);
	}
}

function handleDateChange(e)
{
	 _lastDateIndex = this.date_item.index;
	VMSUI.KN.setFocus(_liveDateDoms[_lastDateIndex].dom);
	VMSUI.KN.setFocus(_liveDateDoms[_lastDateIndex].dom, 2);
	if (this.date_item.epg_index == null) return;
	_epgCtl.scrollToEPG(this.date_item.epg_index);
}
