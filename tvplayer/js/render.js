(function() {

if (!window.VMSUI) {
	window.VMSUI = {};
}

function isDOM(obj) {
    if(!obj|| obj == null ) return false;
    var tag = obj.tagName;
    if(!tag) return false;
    try {
        obj.tagName = '';  // read-only for DOM, should throw exception
        if(obj.tagName == ''){
			obj.tagName = tag;
            return false;
        }
        else return true;
    } catch (e) {
        return true;
    }
}

function encodeHTML(v)
{
	v = ''+v;
	v = v.replace(/[<>&]/g, function(v) {
		if (v == '<') return "&lt;";
		else if (v == '>') return "&gt;";
		else if (v == '&') return '&amp;';
	});
	return v;
}

VMSUI.encodeHTML = encodeHTML;

///替换式渲染器
p2psr.replaceRenderer = function(phrase, options, data)
{
	if (phrase == 'validate') {
		options.tmpl = options.tmpl  || "<div class=\"video_item\"><img class=\"video_thumbnail\" src=\"$thumbnail\" /><div class=\"video_duration\"><div class=\"video_title\">$name</div>$duration</div><div class=\"video_hot\"></div></div>";
	}  else if (phrase == 'data') {
		if (window.$ != null) {
			window.$(options.dom).empty();
		} else {
			options.dom.innerHTML = '';
		}
		data.result.forEach(function(v) {
			var r = options.tmpl;
			r = r.replace(/\$([0-9a-zA-Z\-_]+)/gm, function(m0, m1) {
				if (m1 == 'thumbnail') {
					return data.play_host + v.playpath + ".jpg" + (options.action == "listVideos" ? "?type=vod" : "?type=live") + "&thumbnail=thumbnail_small.jpg";
				}
				return encodeHTML(v[m1]);
			});
			var div = document.createElement('div');
			div.innerHTML = r;
			div.firstChild.__model = v;
			options.dom.appendChild(div.firstChild);
		});
	}
}

p2psr.render = function(options) {
	options = options || {};
	if (!isDOM(options.dom)) {
		alert("options.dom is not a dom object");
		return;
	}
	options.action = options.action || "listVideos";
	options.cid = options.cid || "all";
	options.type = options.type || "video";
	options.renderer = options.renderer || p2psr.replaceRenderer;
	if (options.filter_data) {
			options.filter_data('validate', options);
	}
	options.renderer('validate', options);
	console.log("Loading data");
	var req = {action: options.action, uid: options.uid, cid: options.cid, type: options.type, page_size: options.page_size,  page_no: options.page_no, sort: options.sort, details: options.details};
	var key = VMSUI.util.MD5(JSON.stringify(req));
	console.log("request key: " + key);
	if (options.use_cache) {
		VMSUI.cache.getCache(key, function(data) {
			if (data != null) {
			console.log("Using cache");
			options.is_cache = true;
			handleRes(null, data, null);
			return;
			} else {
				console.log("Request cache but cache not found");
			}
			options.is_cache = false;
			p2psr(req, handleRes);
		});
		return;
	}
	options.is_cache = false;
	function handleRes(err, res, xhr) {
		if (err) {
			console.log("Load data error: " + err);
			if (options.filter_data) {
				options.filter_data('error', options);
			}
			options.renderer('error', options);
			return;
		}
		if (xhr != null && options.do_cache) {
			console.log("put cache");
			VMSUI.cache.putCache(key, res);
		}
		if (options.filter_data) {
			options.filter_data('begin', options,  res);
			options.filter_data('data', res, xhr);
		}
		options.renderer('data', options, res);
		if (options.filter_data) {
				options.filter_data('end', options,  res);
		}
		options.renderer('end', options, res);
	}
	p2psr(req, handleRes);
}

})();
