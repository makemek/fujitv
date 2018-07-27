
var _view;
//播放主机
var _playhost;
//串流主机
var _streamHost="";

//频道滚动器
var _channelScroller;
//p2psr加载选项
var _options;
//当前播放频道的dom元素
var _lastPlayChannel;
//上次选中的频道dom元素
var _lastSelectedChannel;

//频道列表数据
var _channelsData;

var glastChannelTagName = 'last_played_channel';

//是否正在加载数据
var _loading = false;
//是否请求立即刷新数据
var _requestRefresh = false;

//是否暂停刷新
var _paused = false;

var _timerLoad = null;

//分类数据
var _liveCats=[];


exports.onLoad = function(view, params)
{
	_view = view;
	//初始化p2psr 加载数据
	p2psr.init(params.host,params.uid);
	p2psr.referer = params.referer;
	p2psr.p2pproxy = params.p2pproxy;
	p2psr.p2pstreamer = params.rtmfp_host;
	_options = {dom:$(".tv_channels_items", _view)[0], action: "listLives", type:["video"], page_size: 200, cid: params.cid, sort:["no asc","created_time desc"], details: 1};
	_options.tmpl = "<div class=\"tv_channel_item\" tabindex=\"$index\"><div class=\"tv_channel_no\">$no</div><div class=\"tv_channel_title\">$name</div></div>";
	_options.filter_data = FilterData;
	_options.do_cache = true;
	_options.use_cache = true;
	_loading = true;
	p2psr.render(_options);
	VMSUI.fixedScroll($(".tv_channels_items_wrapper", _view)[0], 54);
	//监听条目高亮事件，更新上下箭头状态
		$('.tv_channels_items_wrapper', _view).scroll(handleScroll2);
		$(_view).on('kn_child_focus_changed', handleScroll2);
		var focusResolved = false;
		function handleScroll(e) {
			var  chns = $('.tv_channels_items_wrapper', _view)[0];
			if (chns.scrollTop > 0) {
				$('.tv_channels_header', _view).addClass('highlight');
			} else {
				$('.tv_channels_header', _view).removeClass('highlight');
			}
			if (chns.scrollTop + chns.clientHeight < chns.scrollHeight) { //下面还有
				$('.tv_channels_footer', _view).addClass('highlight');
			} else {
				$('.tv_channels_footer', _view).removeClass('highlight');
			}
			if (e.type == 'kn_child_focus_changed') {
				focusResolved = true;
				$(_view).trigger('item_scroll', e.item);
			} else {
				var idx = Math.floor(chns.scrollTop / 54);
				var endIdx = Math.floor((chns.scrollTop + chns.clientHeight) / 54);
				if (idx >= 0 && idx < _channelsData.length) {
					var f = $('.kn_focus', _view)[0];
					if (f != null  && f.__model.index >= idx && f.__model.index < endIdx) {
						if (!focusResolved) {
							focusResolved = true;
							$(_view).trigger('item_scroll', f);
						}
						return;
					}
					focusResolved = true;
					$(_view).trigger('item_scroll', $('[tabindex='+idx+']', _view)[0] );
				}
			}
		}
		var scrollTimer;
		function handleScroll2(e)
		{
			if (e.type == 'kn_child_focus_changed') {
				focusResolved = false;
			}
			if (scrollTimer)  {
				clearTimeout(scrollTimer);
				scrollTimer = null;
			}
			scrollTimer = setTimeout(function() {
				handleScroll(e);
			}, 100);
		}
}

var gFirstTimeData = true;
var gLastLoadTime = null;
var oState;

function FilterData(phrase, data, xhr)
{
	if (phrase != 'validate') _options.use_cache = false;
	if (phrase == 'error') {
		if (window.showInformation) {
			window.showInformation("Load channel list error, please check the network");
		}
		_loading = false;
		if (_paused) return;
		if (_requestRefresh) {
			_requestRefresh = false;
			_loading = true;
			p2psr.render(_options);
			return;
		}
		clearTimeout(_timerLoad);
		_timerLoad = setTimeout(function() {
			_loading = true;
			p2psr.render(_options);
		}, 10000);
		return;
	}
	if (phrase == 'begin' && !gFirstTimeData) { //准备渲染数据了, 记录视图状态
		oState = VMSUI.KN.saveState(_options.dom);
		oState.custom = {last: _lastSelectedChannel};
	}
	if (phrase == 'end') {
		_loading = false;
		if (_requestRefresh) {
			if (!_paused) {
				_requestRefresh = false;
				_loading = true;
				p2psr.render(_options);
				return;
			}
		}
		_channelsData = xhr.result;
		var items = $(".tv_channel_item", _view);
		if (gFirstTimeData) {
			//频道滚动采用固定滚动
		} else { //恢复上次激活的条目
				VMSUI.KN.restoreState(oState, _options.dom, function(odom, ndom) {
					return odom.__model.id == ndom.__model.id;
				});
				if (_lastSelectedChannel) {
					_lastSelectedChannel = oState.custom.last;
					if (_lastPlayChannel) _lastPlayChannel = _lastSelectedChannel;
				} else {
					_lastPlayChannel = null;
				}
		}
		//频道超长文件滚动
		VMSUI.scrollText([".tv_channel_item", ".tv_channel_title"], 4, 1, 200, true, 500);
		//安装播放事件处理器
		items.click(function() {
			playChannel(this);
		});
		$(_view).trigger('data_updated', gFirstTimeData);
		if (gFirstTimeData) {
			setTimeout(function() {
				exports.playLastTimeChannel();
			}, 2000);
		}
		gFirstTimeData = false;
		if (_paused) return;
		clearTimeout(_timerLoad);
		_timerLoad = setTimeout(function() {
			_loading = true;
			p2psr.render(_options);
		}, data.is_cache?1000:300000);
		if(!data.is_cache) {
			gLastLoadTime = (new Date()).getTime();
		}
		return;
	}
	if (phrase != 'data') return;
	console.log("Done: data.result.length="+data.result.length);

	var no = 0;
	_playHost = data.play_host;
	_streamHost = data.play_host_rtmfp;
	if (_streamHost == null) _streamHost = "";
	//key=cat, val=[], 按分类组织好的频道
	var  tagedResult={
	};
	var noTagedResult=[];
	data.result.forEach(function(v) {
		//从tags中解析频道分类
		var cat = null;
		if  (v.tags != null) {
			var tags = v.tags.split(/[, ]+/g);
			for(var i=0; i<tags.length; ++i) {
				//$LIVE_CAT_
				if (tags[i].substr(0, 10) == "$LIVE_CAT_") {
					cat = tags[i].substr(10);
					if (cat.length == 0) cat = null;
					else break;
				}
			}
		}
		if (cat != null) {
			if (!tagedResult[cat]) tagedResult[cat] = [v];
			else tagedResult[cat].push(v);
		} else {
			noTagedResult.push(v);
		}
	});
	//频道分类表 {name: 分类名, start: 开始频道号}
	var cats=[];
	var catIndex=-1;
	//按分类重排频道号
	data.result = [];
	for(var cat in tagedResult) {
		var catChnls = tagedResult[cat];
		catIndex++;
		cats.push({name: cat, start: no});
		for(var i=0; i<catChnls.length; ++i) {
			var v = catChnls[i];
			data.result.push(v);
			v.index = no;
			no++;
			if (no < 10) {
				v.no = "00"+no;
			} else if (no < 100) {
				v.no = "0"+no;
			} else {
				v.no = no;
			}
			v.live_cat = cat;
			v.live_cat_index = catIndex;
		}
	}
	//增加一个全部分类
	if (noTagedResult.length != 0) {
		cats.push({name: PlayerCtx.translation.all_cat_name, start: no});
		catIndex++;
	}
	for(var i=0; i<noTagedResult.length; ++i) {
			var v = noTagedResult[i];
			data.result.push(v);
			v.index = no;
			no++;
			if (no < 10) {
				v.no = "00"+no;
			} else if (no < 100) {
				v.no = "0"+no;
			} else {
				v.no = no;
			}
			v.live_cat = null;
			v.live_cat_index = catIndex;
	}
	_liveCats = cats;
}

//播放直播频道, it 为频道条目dom
function playChannel(it) {
	if (_lastPlayChannel == it)  {
		$(_view).trigger('playsame', it.__model);
		return;
	}
	if (_lastSelectedChannel) $(_lastSelectedChannel).removeClass("kn_current");
	$(it).addClass("kn_current");
	VMSUI.KN.setFocus(it);
	_lastPlayChannel = _lastSelectedChannel = it;
	if (window.localStorage) {
		console.log('set lastChannel: ' + it.__model.no);
		window.localStorage.setItem(glastChannelTagName, it.__model.no);
	}
	setTimeout(function() {
			VMSUI.makeVisible(it);
	}, 0);
	$(_view).trigger('playnew', {title: it.__model.name, path: it.__model.playpath, live: true, m: it.__model, index: it.__model.index, live_cat_index: it.__model.live_cat_index});
}

//重置上次播放条目
exports.resetLastPlay = function()
{
	_lastPlayChannel = null;
}

//获取播放主机
exports.getPlayHost = function()
{
	return _playHost;
}

//获取串流主机
exports.getStreamHost = function()
{
	return _streamHost;
}

//播放前一个频道
exports.preChannel = function()
{
	if (_lastSelectedChannel) { //存在当前频道
		if (_lastSelectedChannel.previousSibling) {
			playChannel(_lastSelectedChannel.previousSibling);
			return;
		} else  {
			exports.playLastChannel();
			return;
		}
	}
	exports.playFirstChannel();
}


//播放后一个频道
exports.nextChannel = function()
{
	if (_lastSelectedChannel) { //存在当前频道
		if (_lastSelectedChannel.nextSibling) {
			playChannel(_lastSelectedChannel.nextSibling);
			return;
		}
	}
	exports.playFirstChannel();
}

exports.playFirstChannel = function()
{
	var chnls = $('.tv_channel_item', _view);
	if (chnls.length == 0)  {
		console.log("No first to play");
		return;
	}
	playChannel(chnls[0]);
}

exports.playLastChannel = function()
{
	var chnls = $('.tv_channel_item', _view);
	if (chnls.length == 0) {
		console.log("No last to play");
		return;
	}
	playChannel(chnls[chnls.length-1]);
}

//获取当前频道数据
exports.getCurrentChannel = function()
{
	if (_lastSelectedChannel == null) return null;
	return _lastSelectedChannel.__model;
}

exports.playCurrentChannel = function()
{
	if (_lastSelectedChannel == null) {
		playFirstChannel();
	} else {
		playChannel(_lastSelectedChannel);
	}
}

//播放上一次的播放的频道，如果没有上一次的播放频道将播放第一个频道
exports.playLastTimeChannel = function()
{
	if (window.localStorage) {
		var no = window.localStorage.getItem(glastChannelTagName);
		console.log("playLastTimeChannel: " + no);
		var its = $('.tv_channel_item', _view);
		if (no != null) {
			for(var i=0; i<its.length; ++i) {
				if (its[i].__model.no == no) {
					playChannel(its[i]);
					return;
				}
			}
		}
	}
	exports.playFirstChannel();
}

//按照频道索引播放
exports.playByIndex = function(index)
{
	var its = $('.tv_channel_item', _view);
	for(var i=0; i<its.length; ++i) {
		if (its[i].__model.index == index) {
			playChannel(its[i]);
			return;
		}
	}
}

//滚动视图到索引
exports.scrollToChannel = function(index)
{
	var its = $('.tv_channel_item', _view);
	for(var i=0; i<its.length; ++i) {
		if (its[i].__model.index == index) {
			setTimeout(function() {
				VMSUI.makeVisible(its[i], true);
				VMSUI.KN.setFocus(its[i], 1);
			}, 0);
			return;
		}
	}
}

//返回频道数据
exports.getChannels = function()
{
	return _channelsData;
}

//返回频道分类数据
exports.getChannelCats = function()
{
	return _liveCats;
}

//获取当前播放的索引
exports.getCurrentPlayIndex = function()
{
	if (_lastSelectedChannel != null) {
		return _lastSelectedChannel.__model.index;
	} else return -1;
}

//更新数据源信息
exports.updateDataSource = function(srcInfo)
{
	var changed = false;
	if (srcInfo.host != p2psr.host) {
		p2psr.host = srcInfo.host;
		changed = true;
	}
	if (srcInfo.uid != p2psr.uid) {
		p2psr.uid = srcInfo.uid;
		changed = true;
	}
	if (srcInfo.cid != _options.cid) {
		_options.cid = srcInfo.cid;
		changed = true;
	}
	if (srcInfo.referer != p2psr.referer) {
		p2psr.referer = srcInfo.referer;
		changed = true;
	}
	if (!changed) return;
	if (_loading) { //正在加载，设置请求刷新标志
		_requestRefresh = true;
	} else if (!_paused)  { //未加载，立即加载
		_loading = true;
		p2psr.render(_options);
	}
}

//暂停数据刷新
exports.pause = function()
{
	_paused = true;
	if (_loading) return;
	clearTimeout(_timerLoad);
	_timerLoad = null;
}

//恢复数据刷新
exports.resume = function()
{
	_paused = false;
	if (_loading) return;
	clearTimeout(_timerLoad);
	var ct = (new Date()).getTime();
	if (gFirstTimeData || gLastLoadTime == null || Math.abs(ct - gLastLoadTime) > 300000) { //首次加载, 或者上次成功加载距离现在超出了5分钟
		_loading = true;
		p2psr.render(_options);
		return;
	}
	_timerLoad = setTimeout(function() {
		_loading = true;
		p2psr.render(_options);
	}, 30000);
}
