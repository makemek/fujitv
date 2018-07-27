
//视图对象
var _view;
//当前播放时移条目dom
var lastPlayTS;
var lastSelectedTS;
//当前选中项目的页索引
var _currentdateIndex=-1;

//星期的文字
var gDayText = ["日",  "月", "火",  "水",  "木", "金", "土"];
//当前播放节目名
var gCurTitleName='N/A';
var gCurTitleDate='N/A';
var gPageModel=[];
var gDateList=[];
//当前时间的EPG
var gCurrentTimeEPG=null;
var _virtual = false;

//视图加载
exports.onLoad = function(view, params)
{
	_view = view;
	_virtual = params.virtual;
	if (_virtual) return;
	VMSUI.fixedScroll($(".ts_wrapper", _view)[0], 54);
	//监听条目高亮事件，更新上下箭头状态
		$('.ts_wrapper', _view).on('scroll', handleScroll2);
		$(_view).on('kn_child_focus_changed', handleScroll2);
		var focusResolved = false;
		function handleScroll(e) {
			var  chns = $('.ts_wrapper', _view)[0];
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
				if (idx >= 0 && idx < gPageModel.length) {
					var f = $('.kn_focus', _view)[0];
					if (f != null  && f.__model.index >= idx && f.__model.index < endIdx) {
						if (!focusResolved) {
							focusResolved = true;
							$(_view).trigger('item_scroll', f);
						}
						return;
					}
					var it = gPageModel[idx];
					focusResolved = true;
					$(_view).trigger('item_scroll', $('[tabindex='+it.tab_index+']', _view)[0] );
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

function toTextN(v, n)
{
	v = v + "";
	while(v.length < n) {
			v = '0' + v;
	}
	return v;
}



function getCurrentDate(t)
{
	var r;
	if (window.getCurrentTime) {
		r = window.getCurrentTime(true);
	} else {
		r = new Date();
	}
	if (t === undefined) return r;
	else r.setTime(t);
	return r;
}

function getDayText(day)
{
	if (PlayerCtx.translation) {
		var dtxt = PlayerCtx.translation.day_names;
	} else {
		var dtxt = gDayText;
	}
	return dtxt[day];
}

/*!
@brief 填充EPG录制页
@param chn 频道对象
*/
function fillTSPage(chn)
{
	if (!chn) return;
	if (!_virtual) {
		var emptyDIV = document.createElement('div');
	}
	var epg = chn.record_epg;
	if (!epg) epg=[];
	else {
		try {
			epg = p2psr.parseJSON(epg);
		} catch(e) {
			console.log("Exception: " + e);
		}
	}
	gCurrentTimeEPG = null;
	var defaultMovieLevel  = chn.movie_level;
	if (!_virtual) {
		var ostate = VMSUI.KN.saveState(_view);
		ostate.custom={last: lastSelectedTS != null ? lastSelectedTS.view:null};
		var viewItems = $(".ts_items", _view);
		viewItems.empty();
		viewItems= viewItems[0];
	}
	//每天的开始时间ms, 按日期新旧倒序排列
	var dayTimes=[];
	var  tody = getCurrentDate();
	tody.setHours(0);
	tody.setMinutes(0);
	tody.setSeconds(0);
	tody.setMilliseconds(0);
	gCurTitleDate = getDayText(tody.getDay())+ "　" + toTextN(tody.getMonth()+1, 2) + "/" + toTextN(tody.getDate(), 2);
	tody.setTime(tody.getTime()+7*24*3600*1000);
	//日期列表
	gDateList=[];
	for(var i=0; i<21; ++i) {
		dayTimes.push({start: tody.getTime(), end: tody.getTime() + 24*3600*1000});
		gDateList.unshift({
			start: tody.getTime(),
			dayText: getDayText(tody.getDay()),
			monthText: toTextN(tody.getMonth()+1, 2),
			dateText: toTextN(tody.getDate(), 2)
		});
		tody.setTime(tody.getTime()-24*3600*1000);
	}
	for(var i=0; i<gDateList.length; ++i) {
		gDateList[i].index = i;
	}
 var index=0;
 var now = getCurrentDate().getTime();
 var currentSet = false;
 gCurTitleName = 'N/A';
 var tabIndex = 30000;
 //按时间升序记录EPG条目信息
 gPageModel=[];

 var quit = false;
 //扫描EPG， 从新往旧
 for(var i=epg.length-1; i>=0 && !quit; --i) {
	var e = epg[i];
	 var t = e.time*1000;
	 while(t < dayTimes[index].start) {
			index++;
			if (index > 20) {
				quit = true;
				break;
			}
		}
		if (quit) break;
		var hasItem = false;
		if (t < dayTimes[index].end) {
			var timeStr = getCurrentDate(t);
			timeStr = toTextN(timeStr.getHours(), 2) + ":" + toTextN(timeStr.getMinutes(), 2);
			if (e.path && e.path != "") { //已经录制
				if (index == 7 && !currentSet && t < now) {
					hasItem = true;
					currentSet = true;
					gCurTitleName = e.title;
					gCurrentTimeEPG = e;
					if (!_virtual) {
						emptyDIV.innerHTML = "<div  tabindex=\"" + tabIndex + "\" class=\"tv_epg_item tv_epg_current\"><div class=\"epg_time\">" + timeStr  + "</div><div class=\"epg_title\">" +  VMSUI.encodeHTML(e.title) +
						"</div><div class=\"epg_type\">"  + PlayerCtx.translation.live_program +
						"</div><div class=\"clear\"></div></div>";
					}
					e.epg_type_text = PlayerCtx.translation.live_program;
				} else {
					hasItem = true;
					if (!_virtual) {
						emptyDIV.innerHTML = "<div  tabindex=\"" + tabIndex + "\" class=\"tv_epg_item\"><div class=\"epg_time\">" + timeStr  + "</div><div class=\"epg_title\">" +  VMSUI.encodeHTML(e.title) + "</div><div class=\"epg_type\">"
						+ PlayerCtx.translation.record_program + "</div><div class=\"clear\"></div></div>";
					}
					e.epg_type_text = PlayerCtx.translation.record_program;
				}
			} else  { //未录制
				if  (t > now) { //这是节目预告
						hasItem = true;
						if (!_virtual) {
							emptyDIV.innerHTML = "<div  tabindex=\"" + tabIndex + "\" class=\"tv_epg_item\"><div class=\"epg_time\">" + timeStr  + "</div><div class=\"epg_title\">" +  VMSUI.encodeHTML(e.title) + "</div><div class=\"epg_type\">"
							+ PlayerCtx.translation.guide_program + "</div><div class=\"clear\"></div></div>";
						}
						e.epg_type_text = PlayerCtx.translation.guide_program;
				} else if (!currentSet) {
					hasItem = true;
					currentSet = true;
					gCurTitleName = e.title;
					gCurrentTimeEPG = e;
					if (!_virtual) {
						emptyDIV.innerHTML = "<div tabindex=\"" + tabIndex + "\" class=\"tv_epg_item tv_epg_current\"><div class=\"epg_time\">" + timeStr  + "</div><div class=\"epg_title\">" +  VMSUI.encodeHTML(e.title) + "</div><div class=\"epg_type\">"
						+ PlayerCtx.translation.live_program + "</div><div class=\"clear\"></div></div>";
					}
					e.epg_type_text = PlayerCtx.translation.live_program;
				}
			}

			if (!hasItem) {
				console.log((getCurrentTime(t)) + ":" + e.title);
				continue;
			}
			if (!_virtual) {
				var ch = emptyDIV.firstChild;
				ch.__model = e;
			}
			e.tab_index =  tabIndex--;
			e.timeText = timeStr;
			if (e.movie_level == 0 || e.movie_level == null) {
				e.movie_level = defaultMovieLevel;
			}
			e.dateIndex = 20-index;
			if (e.path && e.path != "") { //再生
				e.epg_type = 1;
			} else { //预告
				e.epg_type = 0;
			}
			if (e == gCurrentTimeEPG) {
				e.is_current_epg = true;
			} else {
				e.is_current_epg = false;
			}
			e.view = null;
			if (!_virtual) {
				if (gPageModel.length != 0) {
					viewItems.insertBefore(ch, viewItems.firstChild);
				} else {
					viewItems.appendChild(ch);
				}
				e.view = ch;
				$(ch).click(function() {
					playTS(this.__model);
				});
				$(ch).on('focus', function(e) {
					VMSUI.scrollText([this, $(".epg_title", this)[0]], 4, 1, 200, true, 500);
					if (this.__model.dateIndex != _currentdateIndex) {
						_currentdateIndex = this.__model.dateIndex;
						console.log("Page index: ", _currentdateIndex);
						$(_view).trigger('play_page_changed', false);
					}
				});
			}
			gPageModel.unshift(e);
		}
	}
	if (!_virtual) {
		VMSUI.KN.restoreState(ostate, _view, function(odom, ndom) {
			if (odom.__model == null) return false;
			if (ndom.__model == null) return false;
			return odom.__model.time == ndom.__model.time;
		});
		lastSelectedTS = null;
		if (ostate.custom.last) lastSelectedTS = ostate.custom.last.__model;
	} else {
		if (lastSelectedTS != null) {
			var found = false;
			for(var i=0; i<gPageModel.length; ++i) {
				if (gPageModel[i].time == lastSelectedTS.time) {
					lastSelectedTS = gPageModel[i];
					found = true;
					break;
				}
			}
			if (!found) lastSelectedTS=null;
		}
	}
	 if (lastSelectedTS) {
		 if (lastPlayTS) lastPlayTS = lastSelectedTS;
	 } else {
		lastPlayTS = null;
	 }
	 if (!_virtual) {
		var cur = $('.tv_epg_current', _view)[0];
		if (cur) {
			$(cur).addClass('kn_old_focus');
			setTimeout(function() {
				VMSUI.makeVisible(cur);
			}, 0);
		}
	}
	 for(var i=0; i<gPageModel.length; ++i) {
		var dateIdx = gPageModel[i].dateIndex;
		if (gDateList[dateIdx].epg_index === undefined) {
			gDateList[dateIdx].epg_index = i;
		}
		gPageModel[i].index = i;
	 }
	var lastEPGIdx;
	 for(var i=0; i<gDateList.length; ++i) {
		if (gDateList[i].epg_index !== undefined) {
			lastEPGIdx = gDateList[i].epg_index;
		} else {
			gDateList[i].epg_index = lastEPGIdx;
		}
	 }
	$(_view).trigger('data_updated');
}

//播放时移条目
function playTS(it)
{
	if (lastPlayTS == it)  {
		$(_view).trigger('playsame', it);
		return;
	}
	if (it.path == null || it.path == '') return;
	if (lastSelectedTS && lastSelectedTS.view) $(lastSelectedTS.view).removeClass("kn_current");
	if (it.view) $(it.view).addClass("kn_current");
	var oit = lastSelectedTS;
	lastPlayTS = lastSelectedTS = it;
	var m = it;
	var d = getCurrentDate(m.time * 1000);
	var dateText = getDayText(d.getDay()) + "　" +  toTextN(d.getMonth()+1, 2) + "/" + toTextN(d.getDate(), 2);
	if (it.view) {
		VMSUI.KN.setFocus(it.view);
		setTimeout(function() {
				VMSUI.makeVisible(it.view);
		}, 0);
	}
	$(_view).trigger('playnew', {path: m.path, live: false, dateText: dateText, title: m.title, m: it, index: it.index, date_index: it.dateIndex});
	if (!oit || oit.dateIndex != it.dateIndex) {
		_currentdateIndex = it.dateIndex;
		$(_view).trigger('play_page_changed', true);
	}
}

/*!
事件列表

- playsame 重复点击播放之前的条目 p1=时移信息对象{title: 标题, time: 时间（秒）, path: 路径}
- playnew 新点击播放条目 p1=时移信息对象 p2=播放条目信息 {title: 标题, dateText: 日期标题, live: 是否是直播, path: 路径}
*/

//导出fillTSPage函数
exports.fillTSPage = fillTSPage;

//重置上次播放条目
exports.resetLastPlay = function()
{
	if (lastPlayTS && lastPlayTS.view) {
		$(lastPlayTS.view).removeClass('kn_current');
	}
	lastPlayTS = null;
	lastSelectedTS = null;
}

//获取当前日期名
exports.getCurrentDateText = function()
{
	return gCurTitleDate;
}
//获取频道正在播放的节目的标题
exports.getCurrentProgramName = function()
{
	return  gCurTitleName;
}

//获取当前项目的日期索引
exports.getCurrentDateIndex = function()
{
	return _currentdateIndex;
}

//获取当前日期列表
exports.getDateList = function()
{
	return gDateList;
}

//播放下一个时移节目
exports.nextTS = function()
{
	if (lastSelectedTS == null) return false;
	var next = gPageModel[lastSelectedTS.index+1];
	if (!next) return false;
	if (next.path == null || next.path == '') return false;
	playTS(next);
	return true;
}

//获取当前页的时移列表数据
exports.getCurrentTSS = function()
{
	return gPageModel;
}

//获取当前播放条目的索引
exports.getCurrentPlayIndex = function()
{
	if (lastSelectedTS == null) return -1;
	return lastSelectedTS.index;
}

//按当前页内索引播放
exports.playByIndex = function(index)
{
	if (index < 0 || index >= gPageModel.length) return false;
	var  e = gPageModel[index];
	playTS(e);
	return true;
}

//滚动EPG到指定的条目
exports.scrollToEPG = function(index)
{
	if (index < 0 || index >= gPageModel.length) return false;
	var  e = gPageModel[index];
	var it = e.view;
	if (it) {
		VMSUI.makeVisible(it, true);
		VMSUI.KN.setFocus(it, 1);
	}
	return true;
}

//获取当前时间对应的EPG
exports.getCurrentTimeEPG = function()
{
	return gCurrentTimeEPG;
}
