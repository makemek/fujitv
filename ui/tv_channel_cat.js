//处理直播分类

//视图对象
var _view;
//频道控件
var _channelsCtl;
//记录最后一次记录的分类索引
var _lastCatIndex = -1;
var _liveCatDoms=[];
//视图加载
exports.onLoad = function(view, params)
{
	_view = view;
	_channelsCtl = params.channels_ctl;
	$(_channelsCtl.view).on('data_updated', handleChannelsUpdate);
	$(_channelsCtl.view).on('item_scroll', handleChanelFocus);
	$(_channelsCtl.view).on('playnew', function(e, d) {
		VMSUI.KN.setFocus(_liveCatDoms[d.live_cat_index].dom, 1);
		VMSUI.KN.setFocus(_liveCatDoms[d.live_cat_index].dom, 2);
	});
	handleChannelsUpdate();
}

//频道数据发生变化
function handleChannelsUpdate()
{
	$(_view).empty();
	_liveCatDoms=[];
	var cats = _channelsCtl.getChannelCats();
	if (cats.length == 0) {
		_lastCatIndex = -1;
		return;
	}
	var tab=1;
	for(var i=0; i<cats.length; ++i) {
		var catDiv = $("<div class=\"live_cat\"></div>");
		catDiv.text(cats[i].name);
		catDiv.prop("channel_start", cats[i].start);
		catDiv.attr("tabindex", tab++);
		if (i == cats.length-1) {
			catDiv.removeClass("live_cat");
			catDiv.addClass("live_cat_last");
		}
		_view.appendChild(catDiv[0]);
		_liveCatDoms.push({dom: catDiv[0]});
		catDiv.click(handleCatFocus);
	}
	var chn = _channelsCtl.getCurrentChannel();
	if (chn != null) {
		VMSUI.KN.setFocus(_liveCatDoms[chn.live_cat_index].dom, 1);
		VMSUI.KN.setFocus(_liveCatDoms[chn.live_cat_index].dom, 2);
	}
	$(_view).trigger('data_updated');
}

function handleChanelFocus(e, item)
{
	if (item.__model.live_cat_index != _lastCatIndex) {
		_lastCatIndex = item.__model.live_cat_index;
		VMSUI.KN.setFocus(_liveCatDoms[_lastCatIndex].dom, 2);
	}
	VMSUI.KN.setFocus(_liveCatDoms[_lastCatIndex].dom, 1);
}

function handleCatFocus(e)
{
	VMSUI.KN.setFocus(this);
	VMSUI.KN.setFocus(this, 2);
	_channelsCtl.scrollToChannel(this.channel_start);
}
