/*!	SWFObject v2.2 <http://code.google.com/p/swfobject/>
	is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
*/
var swfobject = function() {

	var UNDEF = "undefined",
		OBJECT = "object",
		SHOCKWAVE_FLASH = "Shockwave Flash",
		SHOCKWAVE_FLASH_AX = "ShockwaveFlash.ShockwaveFlash",
		FLASH_MIME_TYPE = "application/x-shockwave-flash",
		EXPRESS_INSTALL_ID = "SWFObjectExprInst",
		ON_READY_STATE_CHANGE = "onreadystatechange",

		win = window,
		doc = document,
		nav = navigator,

		plugin = false,
		domLoadFnArr = [main],
		regObjArr = [],
		objIdArr = [],
		listenersArr = [],
		storedAltContent,
		storedAltContentId,
		storedCallbackFn,
		storedCallbackObj,
		isDomLoaded = false,
		isExpressInstallActive = false,
		dynamicStylesheet,
		dynamicStylesheetMedia,
		autoHideShow = true,

	/* Centralized function for browser feature detection
		- User agent string detection is only used when no good alternative is possible
		- Is executed directly for optimal performance
	*/
	ua = function() {
		var w3cdom = typeof doc.getElementById != UNDEF && typeof doc.getElementsByTagName != UNDEF && typeof doc.createElement != UNDEF,
			u = nav.userAgent.toLowerCase(),
			p = nav.platform.toLowerCase(),
			windows = p ? /win/.test(p) : /win/.test(u),
			mac = p ? /mac/.test(p) : /mac/.test(u),
			ios = p ? /iphone/.test(p) : /iphone/.test(u),
			ios = ios ? ios : (p ? /ipad/.test(p) : /ipad/.test(u)),
			ios = ios ? ios : (p ? /ipod/.test(p) : /ipod/.test(u)),
			ios = ios? ios : (u ? /iphone/.test(u) : /iphone/.test(p)),
			ios = ios ? ios : (u ? /ipad/.test(u) : /ipad/.test(p)),
			ios = ios ? ios : (u ? /ipod/.test(u) : /ipod/.test(p)),
			webkit = /webkit/.test(u) ? parseFloat(u.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false, // returns either the webkit version or false if not webkit
			ie = !+"\v1", // feature detection based on Andrea Giammarchi's solution: http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
			playerVersion = [0,0,0],
			d = null;
			var uapltform = u.match(/\([^)]*\)/);
			var androidv=null;
			if (uapltform != null && uapltform.length != 0) {
				var pss = uapltform[0].split(';');
				for(var pi=0; pi<pss.length; pi++) {
					var pl = pss[pi].match(/android .*/);
					if (pl != null) {
						androidv = pl[0].substr(8).split('.');
					}
				}
			}
		if (typeof nav.plugins != UNDEF && typeof nav.plugins[SHOCKWAVE_FLASH] == OBJECT) {
			d = nav.plugins[SHOCKWAVE_FLASH].description;
			if (d && !(typeof nav.mimeTypes != UNDEF && nav.mimeTypes[FLASH_MIME_TYPE] && !nav.mimeTypes[FLASH_MIME_TYPE].enabledPlugin)) { // navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin indicates whether plug-ins are enabled or disabled in Safari 3+
				plugin = true;
				ie = false; // cascaded feature detection for Internet Explorer
				d = d.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
				playerVersion[0] = parseInt(d.replace(/^(.*)\..*$/, "$1"), 10);
				playerVersion[1] = parseInt(d.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
				playerVersion[2] = /[a-zA-Z]/.test(d) ? parseInt(d.replace(/^.*[a-zA-Z]+(.*)$/, "$1"), 10) : 0;
			}
		}
		else if (typeof win.ActiveXObject != UNDEF) {
			try {
				var a = new ActiveXObject(SHOCKWAVE_FLASH_AX);
				if (a) { // a will return null when ActiveX is disabled
					d = a.GetVariable("$version");
					if (d) {
						ie = true; // cascaded feature detection for Internet Explorer
						d = d.split(" ")[1].split(",");
						playerVersion = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
					}
				}
			}
			catch(e) {}
		}
		return { w3:w3cdom, pv:playerVersion, wk:webkit, ie:ie, win:windows, mac:mac, ios:ios, android: androidv };
	}(),

	/* Cross-browser onDomLoad
		- Will fire an event as soon as the DOM of a web page is loaded
		- Internet Explorer workaround based on Diego Perini's solution: http://javascript.nwbox.com/IEContentLoaded/
		- Regular onload serves as fallback
	*/
	onDomLoad = function() {
		if (!ua.w3) { return; }
		if ((typeof doc.readyState != UNDEF && doc.readyState == "complete") || (typeof doc.readyState == UNDEF && (doc.getElementsByTagName("body")[0] || doc.body))) { // function is fired after onload, e.g. when script is inserted dynamically
			callDomLoadFunctions();
		}
		if (!isDomLoaded) {
			if (typeof doc.addEventListener != UNDEF) {
				doc.addEventListener("DOMContentLoaded", callDomLoadFunctions, false);
			}
			if (ua.ie && ua.win) {
				doc.attachEvent(ON_READY_STATE_CHANGE, function() {
					if (doc.readyState == "complete") {
						doc.detachEvent(ON_READY_STATE_CHANGE, arguments.callee);
						callDomLoadFunctions();
					}
				});
				if (win == top) { // if not inside an iframe
					(function(){
						if (isDomLoaded) { return; }
						try {
							doc.documentElement.doScroll("left");
						}
						catch(e) {
							setTimeout(arguments.callee, 0);
							return;
						}
						callDomLoadFunctions();
					})();
				}
			}
			if (ua.wk) {
				(function(){
					if (isDomLoaded) { return; }
					if (!/loaded|complete/.test(doc.readyState)) {
						setTimeout(arguments.callee, 0);
						return;
					}
					callDomLoadFunctions();
				})();
			}
			addLoadEvent(callDomLoadFunctions);
		}
	}();

	function callDomLoadFunctions() {
		if (isDomLoaded) { return; }
		try { // test if we can really add/remove elements to/from the DOM; we don't want to fire it too early
			var t = doc.getElementsByTagName("body")[0].appendChild(createElement("span"));
			t.parentNode.removeChild(t);
		}
		catch (e) { return; }
		isDomLoaded = true;
		var dl = domLoadFnArr.length;
		for (var i = 0; i < dl; i++) {
			domLoadFnArr[i]();
		}
	}

	function addDomLoadEvent(fn) {
		if (isDomLoaded) {
			fn();
		}
		else {
			domLoadFnArr[domLoadFnArr.length] = fn; // Array.push() is only available in IE5.5+
		}
	}

	/* Cross-browser onload
		- Based on James Edwards' solution: http://brothercake.com/site/resources/scripts/onload/
		- Will fire an event as soon as a web page including all of its assets are loaded
	 */
	function addLoadEvent(fn) {
		if (typeof win.addEventListener != UNDEF) {
			win.addEventListener("load", fn, false);
		}
		else if (typeof doc.addEventListener != UNDEF) {
			doc.addEventListener("load", fn, false);
		}
		else if (typeof win.attachEvent != UNDEF) {
			addListener(win, "onload", fn);
		}
		else if (typeof win.onload == "function") {
			var fnOld = win.onload;
			win.onload = function() {
				fnOld();
				fn();
			};
		}
		else {
			win.onload = fn;
		}
	}

	/* Main function
		- Will preferably execute onDomLoad, otherwise onload (as a fallback)
	*/
	function main() {
		if (plugin) {
			testPlayerVersion();
		}
		else {
			matchVersions();
		}
	}

	/* Detect the Flash Player version for non-Internet Explorer browsers
		- Detecting the plug-in version via the object element is more precise than using the plugins collection item's description:
		  a. Both release and build numbers can be detected
		  b. Avoid wrong descriptions by corrupt installers provided by Adobe
		  c. Avoid wrong descriptions by multiple Flash Player entries in the plugin Array, caused by incorrect browser imports
		- Disadvantage of this method is that it depends on the availability of the DOM, while the plugins collection is immediately available
	*/
	function testPlayerVersion() {
		var b = doc.getElementsByTagName("body")[0];
		var o = createElement(OBJECT);
		o.setAttribute("type", FLASH_MIME_TYPE);
		var t = b.appendChild(o);
		if (t) {
			var counter = 0;
			(function(){
				if (typeof t.GetVariable != UNDEF) {
					var d = t.GetVariable("$version");
					if (d) {
						d = d.split(" ")[1].split(",");
						ua.pv = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
					}
				}
				else if (counter < 10) {
					counter++;
					setTimeout(arguments.callee, 10);
					return;
				}
				b.removeChild(o);
				t = null;
				matchVersions();
			})();
		}
		else {
			matchVersions();
		}
	}

	/* Perform Flash Player and SWF version matching; static publishing only
	*/
	function matchVersions() {
		var rl = regObjArr.length;
		if (rl > 0) {
			for (var i = 0; i < rl; i++) { // for each registered object element
				var id = regObjArr[i].id;
				var cb = regObjArr[i].callbackFn;
				var cbObj = {success:false, id:id};
				if (ua.pv[0] > 0) {
					var obj = getElementById(id);
					if (obj) {
						if (hasPlayerVersion(regObjArr[i].swfVersion) && !(ua.wk && ua.wk < 312)) { // Flash Player version >= published SWF version: Houston, we have a match!
							setVisibility(id, true);
							if (cb) {
								cbObj.success = true;
								cbObj.ref = getObjectById(id);
								cb(cbObj);
							}
						}
						else if (regObjArr[i].expressInstall && canExpressInstall()) { // show the Adobe Express Install dialog if set by the web page author and if supported
							var att = {};
							att.data = regObjArr[i].expressInstall;
							att.width = obj.getAttribute("width") || "0";
							att.height = obj.getAttribute("height") || "0";
							if (obj.getAttribute("class")) { att.styleclass = obj.getAttribute("class"); }
							if (obj.getAttribute("align")) { att.align = obj.getAttribute("align"); }
							// parse HTML object param element's name-value pairs
							var par = {};
							var p = obj.getElementsByTagName("param");
							var pl = p.length;
							for (var j = 0; j < pl; j++) {
								if (p[j].getAttribute("name").toLowerCase() != "movie") {
									par[p[j].getAttribute("name")] = p[j].getAttribute("value");
								}
							}
							showExpressInstall(att, par, id, cb);
						}
						else { // Flash Player and SWF version mismatch or an older Webkit engine that ignores the HTML object element's nested param elements: display alternative content instead of SWF
							displayAltContent(obj);
							if (cb) { cb(cbObj); }
						}
					}
				}
				else {	// if no Flash Player is installed or the fp version cannot be detected we let the HTML object element do its job (either show a SWF or alternative content)
					setVisibility(id, true);
					if (cb) {
						var o = getObjectById(id); // test whether there is an HTML object element or not
						if (o && typeof o.SetVariable != UNDEF) {
							cbObj.success = true;
							cbObj.ref = o;
						}
						cb(cbObj);
					}
				}
			}
		}
	}

	function getObjectById(objectIdStr) {
		var r = null;
		var o = getElementById(objectIdStr);
		if (o && o.nodeName == "OBJECT") {
			if (typeof o.SetVariable != UNDEF) {
				r = o;
			}
			else {
				var n = o.getElementsByTagName(OBJECT)[0];
				if (n) {
					r = n;
				}
			}
		}
		return r;
	}

	/* Requirements for Adobe Express Install
		- only one instance can be active at a time
		- fp 6.0.65 or higher
		- Win/Mac OS only
		- no Webkit engines older than version 312
	*/
	function canExpressInstall() {
		return !isExpressInstallActive && hasPlayerVersion("6.0.65") && (ua.win || ua.mac) && !(ua.wk && ua.wk < 312);
	}

	/* Show the Adobe Express Install dialog
		- Reference: http://www.adobe.com/cfusion/knowledgebase/index.cfm?id=6a253b75
	*/
	function showExpressInstall(att, par, replaceElemIdStr, callbackFn) {
		isExpressInstallActive = true;
		storedCallbackFn = callbackFn || null;
		storedCallbackObj = {success:false, id:replaceElemIdStr};
		var obj = getElementById(replaceElemIdStr);
		if (obj) {
			if (obj.nodeName == "OBJECT") { // static publishing
				storedAltContent = abstractAltContent(obj);
				storedAltContentId = null;
			}
			else { // dynamic publishing
				storedAltContent = obj;
				storedAltContentId = replaceElemIdStr;
			}
			att.id = EXPRESS_INSTALL_ID;
			if (typeof att.width == UNDEF || (!/%$/.test(att.width) && parseInt(att.width, 10) < 310)) { att.width = "310"; }
			if (typeof att.height == UNDEF || (!/%$/.test(att.height) && parseInt(att.height, 10) < 137)) { att.height = "137"; }
			doc.title = doc.title.slice(0, 47) + " - Flash Player Installation";
			var pt = ua.ie && ua.win ? "ActiveX" : "PlugIn",
				fv = "MMredirectURL=" + encodeURI(win.location).toString().replace(/&/g,"%26") + "&MMplayerType=" + pt + "&MMdoctitle=" + doc.title;
			if (typeof par.flashvars != UNDEF) {
				par.flashvars += "&" + fv;
			}
			else {
				par.flashvars = fv;
			}
			// IE only: when a SWF is loading (AND: not available in cache) wait for the readyState of the object element to become 4 before removing it,
			// because you cannot properly cancel a loading SWF file without breaking browser load references, also obj.onreadystatechange doesn't work
			if (ua.ie && ua.win && obj.readyState != 4) {
				var newObj = createElement("div");
				replaceElemIdStr += "SWFObjectNew";
				newObj.setAttribute("id", replaceElemIdStr);
				obj.parentNode.insertBefore(newObj, obj); // insert placeholder div that will be replaced by the object element that loads expressinstall.swf
				obj.style.display = "none";
				(function(){
					if (obj.readyState == 4) {
						obj.parentNode.removeChild(obj);
					}
					else {
						setTimeout(arguments.callee, 10);
					}
				})();
			}
			createSWF(att, par, replaceElemIdStr);
		}
	}

	/* Functions to abstract and display alternative content
	*/
	function displayAltContent(obj) {
		if (ua.ie && ua.win && obj.readyState != 4) {
			// IE only: when a SWF is loading (AND: not available in cache) wait for the readyState of the object element to become 4 before removing it,
			// because you cannot properly cancel a loading SWF file without breaking browser load references, also obj.onreadystatechange doesn't work
			var el = createElement("div");
			obj.parentNode.insertBefore(el, obj); // insert placeholder div that will be replaced by the alternative content
			el.parentNode.replaceChild(abstractAltContent(obj), el);
			obj.style.display = "none";
			(function(){
				if (obj.readyState == 4) {
					obj.parentNode.removeChild(obj);
				}
				else {
					setTimeout(arguments.callee, 10);
				}
			})();
		}
		else {
			obj.parentNode.replaceChild(abstractAltContent(obj), obj);
		}
	}

	function abstractAltContent(obj) {
		var ac = createElement("div");
		if (ua.win && ua.ie) {
			ac.innerHTML = obj.innerHTML;
		}
		else {
			var nestedObj = obj.getElementsByTagName(OBJECT)[0];
			if (nestedObj) {
				var c = nestedObj.childNodes;
				if (c) {
					var cl = c.length;
					for (var i = 0; i < cl; i++) {
						if (!(c[i].nodeType == 1 && c[i].nodeName == "PARAM") && !(c[i].nodeType == 8)) {
							ac.appendChild(c[i].cloneNode(true));
						}
					}
				}
			}
		}
		return ac;
	}

	/* Cross-browser dynamic SWF creation
	*/
	function createSWF(attObj, parObj, id) {
		var r, el = getElementById(id);
		if (ua.wk && ua.wk < 312) { return r; }
		if (el) {
			if (typeof attObj.id == UNDEF) { // if no 'id' is defined for the object element, it will inherit the 'id' from the alternative content
				attObj.id = id;
			}
			if (ua.ie && ua.win) { // Internet Explorer + the HTML object element + W3C DOM methods do not combine: fall back to outerHTML
				var att = "";
				for (var i in attObj) {
					if (attObj[i] != Object.prototype[i]) { // filter out prototype additions from other potential libraries
						if (i.toLowerCase() == "data") {
							parObj.movie = attObj[i];
						}
						else if (i.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
							att += ' class="' + attObj[i] + '"';
						}
						else if (i.toLowerCase() != "classid") {
							att += ' ' + i + '="' + attObj[i] + '"';
						}
					}
				}
				var par = "";
				for (var j in parObj) {
					if (parObj[j] != Object.prototype[j]) { // filter out prototype additions from other potential libraries
						par += '<param name="' + j + '" value="' + parObj[j] + '" />';
					}
				}
				att = " style=\"z-index:1000;position:relative\" " + att;
				el.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + att + '>' + par + '</object>';
				objIdArr[objIdArr.length] = attObj.id; // stored to fix object 'leaks' on unload (dynamic publishing only)
				r = getElementById(attObj.id);
			}
			else { // well-behaving browsers
				var o = createElement(OBJECT);
				o.setAttribute("type", FLASH_MIME_TYPE);
				for (var m in attObj) {
					if (attObj[m] != Object.prototype[m]) { // filter out prototype additions from other potential libraries
						if (m.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
							o.setAttribute("class", attObj[m]);
						}
						else if (m.toLowerCase() != "classid") { // filter out IE specific attribute
							o.setAttribute(m, attObj[m]);
						}
					}
				}
				o.style.position = 'relative';
				o.style.zIndex = 1000;
				for (var n in parObj) {
					if (parObj[n] != Object.prototype[n] && n.toLowerCase() != "movie") { // filter out prototype additions from other potential libraries and IE specific param element
						createObjParam(o, n, parObj[n]);
					}
				}
				el.parentNode.replaceChild(o, el);
				r = o;
			}
		}
		return r;
	}

	function createObjParam(el, pName, pValue) {
		var p = createElement("param");
		p.setAttribute("name", pName);
		p.setAttribute("value", pValue);
		el.appendChild(p);
	}

	/* Cross-browser SWF removal
		- Especially needed to safely and completely remove a SWF in Internet Explorer
	*/
	function removeSWF(id) {
		var obj = getElementById(id);
		if (obj && obj.nodeName == "OBJECT") {
			if (ua.ie && ua.win) {
				obj.style.display = "none";
				(function(){
					if (obj.readyState == 4) {
						removeObjectInIE(id);
					}
					else {
						setTimeout(arguments.callee, 10);
					}
				})();
			}
			else {
				obj.parentNode.removeChild(obj);
			}
		}
	}

	function removeObjectInIE(id) {
		var obj = getElementById(id);
		if (obj) {
			for (var i in obj) {
				if (typeof obj[i] == "function") {
					obj[i] = null;
				}
			}
			obj.parentNode.removeChild(obj);
		}
	}

	/* Functions to optimize JavaScript compression
	*/
	function getElementById(id) {
		var el = null;
		try {
			el = doc.getElementById(id);
		}
		catch (e) {}
		return el;
	}

	function createElement(el) {
		return doc.createElement(el);
	}

	/* Updated attachEvent function for Internet Explorer
		- Stores attachEvent information in an Array, so on unload the detachEvent functions can be called to avoid memory leaks
	*/
	function addListener(target, eventType, fn) {
		target.attachEvent(eventType, fn);
		listenersArr[listenersArr.length] = [target, eventType, fn];
	}

	/* Flash Player and SWF content version matching
	*/
	function hasPlayerVersion(rv) {
		var pv = ua.pv, v = rv.split(".");
		v[0] = parseInt(v[0], 10);
		v[1] = parseInt(v[1], 10) || 0; // supports short notation, e.g. "9" instead of "9.0.0"
		v[2] = parseInt(v[2], 10) || 0;
		return (pv[0] > v[0] || (pv[0] == v[0] && pv[1] > v[1]) || (pv[0] == v[0] && pv[1] == v[1] && pv[2] >= v[2])) ? true : false;
	}

	/* Cross-browser dynamic CSS creation
		- Based on Bobby van der Sluis' solution: http://www.bobbyvandersluis.com/articles/dynamicCSS.php
	*/
	function createCSS(sel, decl, media, newStyle) {
		if (ua.ie && ua.mac) { return; }
		var h = doc.getElementsByTagName("head")[0];
		if (!h) { return; } // to also support badly authored HTML pages that lack a head element
		var m = (media && typeof media == "string") ? media : "screen";
		if (newStyle) {
			dynamicStylesheet = null;
			dynamicStylesheetMedia = null;
		}
		if (!dynamicStylesheet || dynamicStylesheetMedia != m) {
			// create dynamic stylesheet + get a global reference to it
			var s = createElement("style");
			s.setAttribute("type", "text/css");
			s.setAttribute("media", m);
			dynamicStylesheet = h.appendChild(s);
			if (ua.ie && ua.win && typeof doc.styleSheets != UNDEF && doc.styleSheets.length > 0) {
				dynamicStylesheet = doc.styleSheets[doc.styleSheets.length - 1];
			}
			dynamicStylesheetMedia = m;
		}
		// add style rule
		if (ua.ie && ua.win) {
			if (dynamicStylesheet && typeof dynamicStylesheet.addRule == OBJECT) {
				dynamicStylesheet.addRule(sel, decl);
			}
		}
		else {
			if (dynamicStylesheet && typeof doc.createTextNode != UNDEF) {
				dynamicStylesheet.appendChild(doc.createTextNode(sel + " {" + decl + "}"));
			}
		}
	}

	function setVisibility(id, isVisible) {
		if (!autoHideShow) { return; }
		var v = isVisible ? "visible" : "hidden";
		if (isDomLoaded && getElementById(id)) {
			getElementById(id).style.visibility = v;
		}
		else {
			createCSS("#" + id, "visibility:" + v);
		}
	}

	/* Filter to avoid XSS attacks
	*/
	function urlEncodeIfNecessary(s) {
		var regex = /[\\\"<>\.;]/;
		var hasBadChars = regex.exec(s) != null;
		return hasBadChars && typeof encodeURIComponent != UNDEF ? encodeURIComponent(s) : s;
	}

	/* Release memory to avoid memory leaks caused by closures, fix hanging audio/video threads and force open sockets/NetConnections to disconnect (Internet Explorer only)
	*/
	var cleanup = function() {
		if (ua.ie && ua.win) {
			window.attachEvent("onunload", function() {
				// remove listeners to avoid memory leaks
				var ll = listenersArr.length;
				for (var i = 0; i < ll; i++) {
					listenersArr[i][0].detachEvent(listenersArr[i][1], listenersArr[i][2]);
				}
				// cleanup dynamically embedded objects to fix audio/video threads and force open sockets and NetConnections to disconnect
				var il = objIdArr.length;
				for (var j = 0; j < il; j++) {
					removeSWF(objIdArr[j]);
				}
				// cleanup library's main closures to avoid memory leaks
				for (var k in ua) {
					ua[k] = null;
				}
				ua = null;
				for (var l in swfobject) {
					swfobject[l] = null;
				}
				swfobject = null;
			});
		}
	}();

	return {
		/* Public API
			- Reference: http://code.google.com/p/swfobject/wiki/documentation
		*/
		registerObject: function(objectIdStr, swfVersionStr, xiSwfUrlStr, callbackFn) {
			if (ua.w3 && objectIdStr && swfVersionStr) {
				var regObj = {};
				regObj.id = objectIdStr;
				regObj.swfVersion = swfVersionStr;
				regObj.expressInstall = xiSwfUrlStr;
				regObj.callbackFn = callbackFn;
				regObjArr[regObjArr.length] = regObj;
				setVisibility(objectIdStr, false);
			}
			else if (callbackFn) {
				callbackFn({success:false, id:objectIdStr});
			}
		},

		getObjectById: function(objectIdStr) {
			if (ua.w3) {
				return getObjectById(objectIdStr);
			}
		},

		embedSWF: function(swfUrlStr, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, flashvarsObj, parObj, attObj, callbackFn) {
			var callbackObj = {success:false, id:replaceElemIdStr};
			if (ua.w3 && !(ua.wk && ua.wk < 312) && swfUrlStr && replaceElemIdStr && widthStr && heightStr && swfVersionStr) {
				setVisibility(replaceElemIdStr, false);
				var f=function() {
					widthStr += ""; // auto-convert to string
					heightStr += "";
					var att = {};
					if (attObj && typeof attObj === OBJECT) {
						for (var i in attObj) { // copy object to avoid the use of references, because web authors often reuse attObj for multiple SWFs
							att[i] = attObj[i];
						}
					}
					att.data = swfUrlStr;
					att.width = widthStr;
					att.height = heightStr;
					var par = {};
					if (parObj && typeof parObj === OBJECT) {
						for (var j in parObj) { // copy object to avoid the use of references, because web authors often reuse parObj for multiple SWFs
							par[j] = parObj[j];
						}
					}
					if (flashvarsObj && typeof flashvarsObj === OBJECT) {
						for (var k in flashvarsObj) { // copy object to avoid the use of references, because web authors often reuse flashvarsObj for multiple SWFs
							if (typeof par.flashvars != UNDEF) {
								par.flashvars += "&" + k + "=" + flashvarsObj[k];
							}
							else {
								par.flashvars = k + "=" + flashvarsObj[k];
							}
						}
					}
					if (hasPlayerVersion(swfVersionStr)) { // create SWF
						var obj = createSWF(att, par, replaceElemIdStr);
						if (att.id == replaceElemIdStr) {
							setVisibility(replaceElemIdStr, true);
						}
						callbackObj.success = true;
						callbackObj.ref = obj;
					}
					else if (xiSwfUrlStr && canExpressInstall()) { // show Adobe Express Install
						att.data = xiSwfUrlStr;
						showExpressInstall(att, par, replaceElemIdStr, callbackFn);
						return;
					}
					else { // show alternative content
						setVisibility(replaceElemIdStr, true);
					}
					if (callbackFn) { callbackFn(callbackObj); }
				};
				var obj = swfobject.getElementById(replaceElemIdStr);
				if (obj == undefined || obj == null) {
					addDomLoadEvent(f);
				} else f();
			}
			else if (callbackFn) { callbackFn(callbackObj);	}
		},

		switchOffAutoHideShow: function() {
			autoHideShow = false;
		},

		ua: ua,

		getFlashPlayerVersion: function() {
			return { major:ua.pv[0], minor:ua.pv[1], release:ua.pv[2] };
		},

		hasFlashPlayerVersion: hasPlayerVersion,

		createSWF: function(attObj, parObj, replaceElemIdStr) {
			if (ua.w3) {
				return createSWF(attObj, parObj, replaceElemIdStr);
			}
			else {
				return undefined;
			}
		},

		showExpressInstall: function(att, par, replaceElemIdStr, callbackFn) {
			if (ua.w3 && canExpressInstall()) {
				showExpressInstall(att, par, replaceElemIdStr, callbackFn);
			}
		},

		removeSWF: function(objElemIdStr) {
			if (ua.w3) {
				removeSWF(objElemIdStr);
			}
		},

		createCSS: function(selStr, declStr, mediaStr, newStyleBoolean) {
			if (ua.w3) {
				createCSS(selStr, declStr, mediaStr, newStyleBoolean);
			}
		},

		addDomLoadEvent: addDomLoadEvent,

		addLoadEvent: addLoadEvent,

		getQueryParamValue: function(param) {
			var q = doc.location.search || doc.location.hash;
			if (q) {
				if (/\?/.test(q)) { q = q.split("?")[1]; } // strip question mark
				if (param == null) {
					return urlEncodeIfNecessary(q);
				}
				var pairs = q.split("&");
				for (var i = 0; i < pairs.length; i++) {
					if (pairs[i].substring(0, pairs[i].indexOf("=")) == param) {
						return urlEncodeIfNecessary(pairs[i].substring((pairs[i].indexOf("=") + 1)));
					}
				}
			}
			return "";
		},

		getElementById: getElementById,

		// For internal usage only
		expressInstallCallback: function() {
			if (isExpressInstallActive) {
				var obj = getElementById(EXPRESS_INSTALL_ID);
				if (obj && storedAltContent) {
					obj.parentNode.replaceChild(storedAltContent, obj);
					if (storedAltContentId) {
						setVisibility(storedAltContentId, true);
						if (ua.ie && ua.win) { storedAltContent.style.display = "block"; }
					}
					if (storedCallbackFn) { storedCallbackFn(storedCallbackObj); }
				}
				isExpressInstallActive = false;
			}
		}
	};
}();

function p2psr_detect_stream_type(u)
{
	var r={};
	if (u == null) return r;
	var url = u.toLowerCase();
	if (url.indexOf("rtmp://") != -1 || url.indexOf("rtmfp://") != -1 || url.indexOf("rtmpe://") != -1 || url.indexOf("rtmpt://") != -1 || url.indexOf("rtmps://") != -1 || url.indexOf("rtmpts://") != -1) { //RTMP协议族
		r.rtmp = u;
		return r;
	}
	var pos = url.indexOf('?');
	var dot;
	if (pos == -1) {
		dot = url.lastIndexOf('.');
	} else {
		dot = url.lastIndexOf('.', pos);
	}
	if (dot == -1) return r;
	var ext;
	if (pos != -1) {
		ext = url.substr(dot, pos-dot);
	} else {
		ext = url.substr(dot);
	}
	if (ext.indexOf('/') != -1) {
		return r;
	}
	if (ext == '.flv' || ext == '.f4v') { //FLV格式以RTMP方式播放
		r.rtmp = u;
		r.p2p = u;
	} else if (ext == '.mp4') {
		r.rtmp = u;
		r.p2p = u;
		r.hls = u;
	} else if (ext == '.m3u8') {
		r.p2p = u;
		r.hls = u;
	} else if (ext == '.livesegments' || ext == '.fpvsegments') {
		r.p2p = u;
	}
	return r;
}

function p2psr_create_hls_video(playerUrl, obj, replaceElemIdStr, flashvarsObj, widthStr, heightStr, src, poster)
{
			var vid = document.createElement("video");
			vid.setAttribute("id", replaceElemIdStr);
			vid.setAttribute("controls", true);
			if (widthStr && heightStr) {
				vid.setAttribute("width", widthStr);
				vid.setAttribute("height", heightStr);
			}
			obj.parentNode.replaceChild(vid, obj);
			vid.style.visibility="visible";
			vid.style.background="black";
			if (poster != null) {
				vid.setAttribute('poster', poster);
			}
			var pos = playerUrl.lastIndexOf('/');
			var playerRoot;
			if (pos != -1) {
				playerRoot = playerUrl.substr(0, pos+1);
			} else {
				playerRoot = "";
			}
			p2psr.getJSONP(playerRoot+"player_config.json", handleConfig, '__p2ps_player_config');

			function handleConfig(err, cfg) {
				if (window.console) console.log("get player config: " + err);
				if (!err) {
					for(var i in cfg) {
						flashvarsObj[i] = cfg[i];
					}
				} else cfg={};
				if(flashvarsObj.auto_play == 1)vid.setAttribute("autoplay", true);
				function matchSite(sites, site) {
					site=""+site;
					if (site.length == 0) return false;
					for(var i in sites) {
						var s = ""+sites[i];
						if (site.length >= s.length && site.substr(site.length - s.length) == s) {
							return true;
						}
					}
					return false;
				}
				if (flashvarsObj.site_info && typeof  flashvarsObj.site_info == 'object') {
					var site = p2psr.parseURL(window.location.href).domain;
					if (site == null) site="";
					site = site.toLowerCase();
					var matchAllows = matchSite(flashvarsObj.site_info.allows, site);
					var matchDenys = matchSite(flashvarsObj.site_info.denys, site);
					if (matchDenys) return;
					if (!matchAllows) {
						if (flashvarsObj.site_info.policy == null || flashvarsObj.site_info.policy == "allow") matchAllows = true;
					}
					if (!matchAllows) return;
				}
				var orgSrc=src;
				if (src != null) {
					var m = p2psr.parseURL(src);
					if (m.domain != null) {
						var host = m.domain;
						host = host.toLowerCase();
						var host_info = flashvarsObj.host_info;
						if (host_info && typeof(host_info) == 'object') {
							var hinfo = host_info[host];
							if (hinfo != null && typeof(hinfo) == 'object') {
								if (hinfo.url_extra_param) {
										if (flashvarsObj.url_extra_param) flashvarsObj.url_extra_param += "&" + hinfo.url_extra_param;
										else flashvarsObj.url_extra_param = hinfo.url_extra_param;
								}
								var anlink = hinfo.anlink;
								if (anlink != null && typeof(anlink) == 'object') {
									if (anlink.type=='time') {
										var wsName=anlink.secret_name;
										if (!wsName) wsName='wsSecret';
										var wsTime = anlink.time_name;
										if (!wsTime) wsTime='wsTime';
										var time = flashvarsObj.anlink_end_time;
										if (!time || time == "") {
											time =  Math.floor((new Date()).getTime()/1000);
											if (!isNaN(anlink.expire)) {
												time += anlink.expire;
											} else {
												time += 86400;
											}
										}
										var secret=p2psr.MD5(""+time+m.path+"----------");
										secret = wsName + "=" + secret + "&" + wsTime + "=" + time;
										if (flashvarsObj.url_extra_param) flashvarsObj.url_extra_param += "&" + secret;
										else flashvarsObj.url_extra_param = secret;
									}
								}
							}
						}
					}
					if (flashvarsObj.url_extra_param) {
						if (src.indexOf('?') != -1) {
							src += "&" + flashvarsObj.url_extra_param;
						} else {
							src += "?"+flashvarsObj.url_extra_param;
						}
					}
					vid.setAttribute('src', src);
				}
				if (flashvarsObj.h5_stat_url) {
					var uid = "";
					var vsid="";
					var isid="";
					if (window.localStorage) {
						uid = window.localStorage["__h5_customer_id"];
					}
					var hexs = ['A', 'B', 'C', 'D', 'E', 'F'];
					if (uid == null || uid == "") {
						uid = "";
						for(var i=0; i<32; ++i) {
							var v = Math.floor(Math.random()*16);
							if (v < 10) {
								uid += v;
							} else {
								uid += hexs[v - 10];
							}
						}
						if (window.localStorage) {
							window.localStorage["__h5_customer_id"] = uid;
						}
					}
					for(var i=0; i<32; ++i) {
							var v = Math.floor(Math.random()*16);
							if (v < 10) {
								isid += v;
							} else {
								isid += hexs[v - 10];
							}
					}
					vid.addEventListener('loadeddata', reportStat);
					vid.addEventListener('playing', reportStat);
					vid.addEventListener('DOMNodeRemoved', function() {
						if (window.console) console.log("DOMNodeRemoved for video");
						if (timer != null) clearTimeout(timer);
						reporting = true;
					});
					var reportUrl = flashvarsObj.h5_stat_url;
					var vsid = p2psr.MD5(orgSrc);
					if (reportUrl.indexOf('?') != -1) {
						reportUrl += "&stat=1&uid=" + uid + "&vsid=" + vsid + "&isid=" + isid;
					} else {
						reportUrl += "?stat=1&uid=" + uid + "&vsid=" + vsid+"&isid="+isid;
					}
					var reporting = false;
					var timer = null;
					function reportStat()
					{
						if (reporting) return;
						reporting = true;
						if (window.console) console.log(reportUrl);
						p2psr.getJSON(reportUrl, function() {
							if (window.console) console.log("report stat");
							reporting = false;
							timer = setTimeout(reportStat, 10000);
						});
					}
				}
			}
			return vid;
}

function p2psr_embed(type, streamType, host, streamUrl, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, flashvarsObj, parObj, attObj, callbackFn)
{
	function completeCallback(obj)
	{
		if (!obj.success) {
			if (callbackFn) {
				callbackFn(obj);
			}
			return;
		}
		var ref = obj.ref;
		ref.doplay = function(sourceInfo)
		{
			return this.p2ps_call("play", [sourceInfo]);
		}
		ref.pause = function()
		{
			return this.p2ps_call("pause", []);
		}
		ref.resume = function()
		{
			return this.p2ps_call("play", []);
		}
		ref.close = function()
		{
			return this.p2ps_call("close", []);
		}
		ref.seek = function(t)
		{
			return this.p2ps_call("seek", [t]);
		}
		ref.getVolume = function()
		{
			return this.p2ps_get("volume");
		}
		ref.setVolume = function(v)
		{
			return this.p2ps_set("volume", v);
		}
		ref.getMute = function()
		{
			return this.p2ps_get("mute");
		}
		ref.setMute = function(v)
		{
			return this.p2ps_set("mute", v);
		}
		ref.getVersion = function()
		{
			return this.p2ps_get("version");
		}
		ref.getTime = function()
		{
			return this.p2ps_get("time");
		}
		ref.getTimeCode = function()
		{
			return this.p2ps_get("timeCode");
		}
		ref.getDuration = function()
		{
			return this.p2ps_get("duration");
		}
		ref.getState = function()
		{
			return this.p2ps_get("state");
		}
		ref.setOption = function(name, value)
		{
			return this.p2ps_call("setOption", [name, value]);
		}
		ref.setEventListener = function(funcName)
		{
			return this.p2ps_call("setJSEventListener", [funcName]);
		}
		ref.setStatListener = function(funcName)
		{
			return this.p2ps_call("setJSStatListener", [funcName]);
		}
		ref.getDownloadUrl = function()
		{
			return this.p2ps_get("downloadUrl");
		}
		if (callbackFn) {
			function checkReady() {
				if (ref.p2ps_call == null) {
					setTimeout(checkReady, 200);
				} else {
					try {
						if (ref.getState() != "not_ready") {
							callbackFn(obj);
							return;
						}
					} catch(e) {
						setTimeout(checkReady, 200);
						return;
					}
					callbackFn(obj);
				}
			}
			checkReady();
		}
	}

	function getCrossDomainUser()
	{
		if (p2psr.__cross_domain_user) return '__cross_domain_user='+encodeURIComponent(p2psr.__cross_domain_user);
		var r='';
		var pairs=document.cookie.split("; ");
		for(var i=0; i<pairs.length; i++) {
			var pair = pairs[i];
			if (pair == '' || pair == null) continue;
			var nvs = pair.split("=");
			if (nvs == null || nvs.length < 2) continue;
			if (nvs[0] == '__cross_domain_user') {
				r = '__cross_domain_user='+nvs[1];
				return r;
			}
		}
		return r;
	}

	if (type == "auto") {
		var ver = swfobject.getFlashPlayerVersion;
		var ua = swfobject.ua;
		if (ua.ios) { //ios
			type = "hls";
		} else if (ua.android) { //android
			if (ua.android[0] >= 3) {
				type = "hls";
			} else type = "p2p";
		} else type = "p2p";
	}

	if (typeof  flashvarsObj != 'object') {
			flashvarsObj = {};
	}

	function encodeObjectUrl(o)
	{
		var r={};
		for(var i in o) {
			r[encodeURIComponent(i)] = encodeURIComponent(o[i]);
		}
		return r;
	}
	if (streamType == "raw") { //执行原始流嵌入
			var playerUrl = host;
			if (typeof(streamUrl) != 'object') {
				streamUrl = p2psr_detect_stream_type(streamUrl);
			}
			var url = streamUrl[type];
			if (url == null) {
				alert("No stream can be play for your OS/browser");
				return false;
			}
			if (type == "p2p") {
				flashvarsObj.provider = 'p2ps';
				flashvarsObj.file = url;
				return swfobject.embedSWF(playerUrl, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, encodeObjectUrl(flashvarsObj), parObj, attObj, completeCallback);
			} else if (type == "rtmp") {
				flashvarsObj.provider = 'rtmp';
				flashvarsObj.file = url;
				return swfobject.embedSWF(playerUrl, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, encodeObjectUrl(flashvarsObj), parObj, attObj, completeCallback);
			} else if (type == "hls") {
				var f = function() {
					var obj = swfobject.getElementById(replaceElemIdStr);
					if (obj == undefined || obj == null) {
						if (callbackFn) {
							callbackFn({success:false, id:replaceElemIdStr});
						}
						return;
					}
					var vid = p2psr_create_hls_video(playerUrl, obj, replaceElemIdStr, flashvarsObj, widthStr, heightStr, url, flashvarsObj.thumbnail);
					if (callbackFn) callbackFn({success:true, id:replaceElemIdStr, ref: vid});
				};
				var obj = swfobject.getElementById(replaceElemIdStr);
				if (obj == undefined || obj == null) {
					swfobject.addDomLoadEvent(f);
					return true;
				} else {
					f();
					return true;
				}
			} else return false;
	}
	var playerUrl = host + "/global/player.swf";
	var streamUrlIsAbs = false;
	var streamUrlInfo = p2psr.parseURL(streamUrl);
	if (!streamUrlInfo || streamUrlInfo.protocol == null || streamUrlInfo == '') {
		streamUrlIsAbs = false;
	} else {
		streamUrlIsAbs = true;
	}
	if (type == "p2p") {
		if (streamUrlIsAbs) {
			var url = streamUrl +".json?type="+streamType;
		} else {
			var url = "^"+streamUrl +".json?type="+streamType;
		}
		var cu = getCrossDomainUser();
		if (cu != '') {
			url += '&' + cu;
		}
		flashvarsObj.url = url;
		var obj = swfobject.getElementById(replaceElemIdStr);
		try {
			if (obj != null && obj.getState != null) {
				obj.doplay(flashvarsObj);
				return;
			}
		} catch(e) {
			;
		}
		return swfobject.embedSWF(playerUrl, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, encodeObjectUrl(flashvarsObj), parObj, attObj, completeCallback);
	}  else if (type == "rtmp") {
		if (streamUrlIsAbs) {
			var url = streamUrl +".json?type="+streamType;
		} else {
			var url = "^"+streamUrl +".json?type="+streamType;
		}
		var cu = getCrossDomainUser();
		if (cu != '') {
			url += '&' + cu;
		}
		flashvarsObj.url = url;
		flashvarsObj.provider = 'rtmp';
		return swfobject.embedSWF(playerUrl, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, encodeObjectUrl(flashvarsObj), parObj, attObj, completeCallback);
	}  else if (type == "hls") {
		var f = function() {
			var obj = swfobject.getElementById(replaceElemIdStr);
			if (obj == undefined || obj == null) {
				if (callbackFn) {
					callbackFn({success:false, id:replaceElemIdStr});
				}
				return;
			}
			var vid = p2psr_create_hls_video(playerUrl, obj, replaceElemIdStr, flashvarsObj, widthStr, heightStr);
			if (streamUrlIsAbs) {
				var requrl=streamUrl+".json?type="+streamType+"&callback=?";
			} else {
				var requrl=host+streamUrl+".json?type="+streamType+"&callback=?";
			}
			var cu = getCrossDomainUser();
			if (cu != '') {
				requrl += '&' + cu;
			}
			p2psr.getJSONP(requrl, function(err, res) {
				if(err || res.code != "OK")
				{
					if (callbackFn) {
						callbackFn({success:false, ref:obj});
					}
					alert("Failed to load video info.");
					return;
				}
				var fsubstreams;
				for(var i =0; i<res.substreams.length; i++)
				{
					if(res.substreams[i].format == 1718646381)
					{
						fsubstreams=res.substreams[i];
						break;
					}
				}
				if(!fsubstreams)
				{
					if (callbackFn) {
						callbackFn({success:false, ref:obj});
					}
					alert("Video does not support HLS");
					return;
				}
				var url=fsubstreams.http_url+"/";
				var thumbUrl = url;
				if (streamType == "live") {
					url += "live.M3U8";
				} else if (fsubstreams.stream_name && fsubstreams.stream_name != "") {
					url += fsubstreams.stream_name + ".m3u8";
				} else {
					url += "video.m3u8";
				}
				url += "?sc_tk="+encodeURIComponent(res.sc_tk);
				if (fsubstreams.thumb_ver && fsubstreams.thumb_ver != "") {
					thumbUrl += "/" + fsubstreams.thumb_ver + "/thumbnail.jpg";
				} else {
					thumbUrl += "/thumbnail.jpg";
				}
				vid.setAttribute("src", url);
				vid.setAttribute("poster", thumbUrl);
				if (callbackFn) {
					callbackFn({success:true, ref:obj});
				}
			});
		};

		var obj = swfobject.getElementById(replaceElemIdStr);
		if (obj == undefined || obj == null) {
			swfobject.addDomLoadEvent(f);
			return true;
		} else {
			f();
			return obj;
		}
	} else return false;
}
var p2ps_light_layer = null;
function p2ps_player_open_light(b) {
	var h = document.body.scrollHeight;
	if (p2ps_light_layer == null) {
		p2ps_light_layer = document.createElement("div");
		p2ps_light_layer.innerHTML = "<div id=\"p2ps_light_layer\" style=\"visibility: hidden; display: block; position: absolute; left: 0; top: 0; width: 100%; height: " + h + "px; z-index: 999; background-color:#000000; opacity:0.9; filter: alpha(opacity=90); \"></div>";
		p2ps_light_layer = p2ps_light_layer.firstChild;
		var body = document.getElementsByTagName("body")[0];
		if (body) {
			body.insertBefore(p2ps_light_layer, body.firstChild);
		}
	}
	var layer = p2ps_light_layer;
	if (layer) {
		layer.style.height = h+"px";
		if (b) {
			layer.style.visibility = 'hidden';
		} else {
			layer.style.visibility = 'visible';
		}
	}
}

//vms api

(function() {

var crc_table =
	[0x00000000,0x77073096,0xEE0E612C,0x990951BA,0x076DC419,0x706AF48F,0xE963A535,0x9E6495A3,0x0EDB8832,0x79DCB8A4,0xE0D5E91E,0x97D2D988,0x09B64C2B,0x7EB17CBD,0xE7B82D07,0x90BF1D91,0x1DB71064,0x6AB020F2,0xF3B97148,0x84BE41DE,0x1ADAD47D,0x6DDDE4EB,0xF4D4B551,0x83D385C7,0x136C9856,0x646BA8C0,0xFD62F97A,0x8A65C9EC,0x14015C4F,0x63066CD9,0xFA0F3D63,0x8D080DF5,0x3B6E20C8,0x4C69105E,0xD56041E4,0xA2677172,0x3C03E4D1,0x4B04D447,0xD20D85FD,0xA50AB56B,0x35B5A8FA,0x42B2986C,0xDBBBC9D6,0xACBCF940,0x32D86CE3,0x45DF5C75,0xDCD60DCF,0xABD13D59,0x26D930AC,0x51DE003A,0xC8D75180,0xBFD06116,0x21B4F4B5,0x56B3C423,0xCFBA9599,0xB8BDA50F,0x2802B89E,0x5F058808,0xC60CD9B2,0xB10BE924,0x2F6F7C87,0x58684C11,0xC1611DAB,0xB6662D3D,0x76DC4190,0x01DB7106,0x98D220BC,0xEFD5102A,0x71B18589,0x06B6B51F,0x9FBFE4A5,0xE8B8D433,0x7807C9A2,0x0F00F934,0x9609A88E,0xE10E9818,0x7F6A0DBB,0x086D3D2D,0x91646C97,0xE6635C01,0x6B6B51F4,0x1C6C6162,0x856530D8,0xF262004E,0x6C0695ED,0x1B01A57B,0x8208F4C1,0xF50FC457,0x65B0D9C6,0x12B7E950,0x8BBEB8EA,0xFCB9887C,0x62DD1DDF,0x15DA2D49,0x8CD37CF3,0xFBD44C65,0x4DB26158,0x3AB551CE,0xA3BC0074,0xD4BB30E2,0x4ADFA541,0x3DD895D7,0xA4D1C46D,0xD3D6F4FB,0x4369E96A,0x346ED9FC,0xAD678846,0xDA60B8D0,0x44042D73,0x33031DE5,0xAA0A4C5F,0xDD0D7CC9,0x5005713C,0x270241AA,0xBE0B1010,0xC90C2086,0x5768B525,0x206F85B3,0xB966D409,0xCE61E49F,0x5EDEF90E,0x29D9C998,0xB0D09822,0xC7D7A8B4,0x59B33D17,0x2EB40D81,0xB7BD5C3B,0xC0BA6CAD,0xEDB88320,0x9ABFB3B6,0x03B6E20C,0x74B1D29A,0xEAD54739,0x9DD277AF,0x04DB2615,0x73DC1683,0xE3630B12,0x94643B84,0x0D6D6A3E,0x7A6A5AA8,0xE40ECF0B,0x9309FF9D,0x0A00AE27,0x7D079EB1,0xF00F9344,0x8708A3D2,0x1E01F268,0x6906C2FE,0xF762575D,0x806567CB,0x196C3671,0x6E6B06E7,0xFED41B76,0x89D32BE0,0x10DA7A5A,0x67DD4ACC,0xF9B9DF6F,0x8EBEEFF9,0x17B7BE43,0x60B08ED5,0xD6D6A3E8,0xA1D1937E,0x38D8C2C4,0x4FDFF252,0xD1BB67F1,0xA6BC5767,0x3FB506DD,0x48B2364B,0xD80D2BDA,0xAF0A1B4C,0x36034AF6,0x41047A60,0xDF60EFC3,0xA867DF55,0x316E8EEF,0x4669BE79,0xCB61B38C,0xBC66831A,0x256FD2A0,0x5268E236,0xCC0C7795,0xBB0B4703,0x220216B9,0x5505262F,0xC5BA3BBE,0xB2BD0B28,0x2BB45A92,0x5CB36A04,0xC2D7FFA7,0xB5D0CF31,0x2CD99E8B,0x5BDEAE1D,0x9B64C2B0,0xEC63F226,0x756AA39C,0x026D930A,0x9C0906A9,0xEB0E363F,0x72076785,0x05005713,0x95BF4A82,0xE2B87A14,0x7BB12BAE,0x0CB61B38,0x92D28E9B,0xE5D5BE0D,0x7CDCEFB7,0x0BDBDF21,0x86D3D2D4,0xF1D4E242,0x68DDB3F8,0x1FDA836E,0x81BE16CD,0xF6B9265B,0x6FB077E1,0x18B74777,0x88085AE6,0xFF0F6A70,0x66063BCA,0x11010B5C,0x8F659EFF,0xF862AE69,0x616BFFD3,0x166CCF45,0xA00AE278,0xD70DD2EE,0x4E048354,0x3903B3C2,0xA7672661,0xD06016F7,0x4969474D,0x3E6E77DB,0xAED16A4A,0xD9D65ADC,0x40DF0B66,0x37D83BF0,0xA9BCAE53,0xDEBB9EC5,0x47B2CF7F,0x30B5FFE9,0xBDBDF21C,0xCABAC28A,0x53B39330,0x24B4A3A6,0xBAD03605,0xCDD70693,0x54DE5729,0x23D967BF,0xB3667A2E,0xC4614AB8,0x5D681B02,0x2A6F2B94,0xB40BBE37,0xC30C8EA1,0x5A05DF1B,0x2D02EF8D];

//util functions
function crc32(str) {
	// discuss at: http://phpjs.org/functions/crc32/
	// original by: Webtoolkit.info (http://www.webtoolkit.info/)
	// improved by: T0bsn
	// example 1: crc32('Kevin van Zonneveld');
	// returns 1: 1249991249

	var crc = 0;
	var x = 0;
	var y = 0;
	crc = crc ^ (-1);
	for (var i = 0, iTop = str.length; i < iTop; i++) {
		y = (crc ^ str.charCodeAt(i)) & 0xFF;
		x = crc_table[y];
		crc = (crc >>> 8) ^ x;
	}
	return (crc ^ (-1)) >>> 0;
}

var envType=-1; //0 for browser, 1 for nodejs, -1 for unkown
var cosrType=-1; //0 for jsonp, 1 for XMLHttpRequest, 2 for XDomainRequest, 3 for nodejs, -1 for unkown
//getJSON(url, cb) method
var getJSON;
//parseJSON(json) method
var parseJSON;
//runtime global object
var globalObj;

try { //test for nodejs
	require('fs');
	envType = 1;
	globalObj = global;
} catch(e) {}

if (envType == -1) {
	try  {
		if (window != null) {
			envType = 0;
			globalObj = window;
		}
	} catch(e) {}
}

if (envType == -1) {
	try {
		console.log("Only browser & nodejs runtime are supported");
	} catch(e) {}
	throw  new Error("Only browser & nodejs runtime are supported");
}

if (envType == 0) {
	if (window.XMLHttpRequest) { //H5
		var xhr = new XMLHttpRequest();
		try  {
			if (xhr.withCredentials !== undefined) {
				cosrType = 1;
			}
		} catch(e) {}
	}
	if (cosrType == -1 && window.XDomainRequest) { //IE XDomainRequest
		cosrType = 2;
	}
	if (cosrType == -1) { //fallback to jsonp
		cosrType = 0;
	}
} else if  (envType == 1) {
	cosrType = 3;
}


//parseJSON impl
try {
   if (JSON.parse) {
		parseJSON = JSON.parse;
   }
} catch(e) {
	parseJSON = function(json) {
		var o;
		eval("o="+json);
		return o;
	}
}


//getJSON impl
if (cosrType == 0) { //jsonp version
	getJSON = function(url, cb)
	{
		var s;
		var c = crc32(url);
		if (c < 0) c = -c;
		var fn = 'jsonp_'+c;
		var cbsn='jsonpn_'+c;
		if (window[fn]) { //exists, save cb
			window[cbsn].push(cb);
			return;
		}
		window[fn] = function(res) {
			var cbs = window[cbsn];
			try {window[fn] = undefined;} catch(e) {}
			try {delete window[fn];} catch(e) {}
			try {window[cbsn] = undefined;} catch(e) {}
			try {delete window[cbsn];} catch(e) {}

			if (res instanceof Error) {
				for(var i in cbs) {
					cbs[i](res);
				}
			} else {
				for(var i in cbs) {
					cbs[i](null, res);
				}
			}
		};
		window[cbsn] = [cb];

		if (navigator.appName == 'Microsoft Internet Explorer') {
			var ver = navigator.appVersion;
			var m = ver.match(/MSIE (\d+\.\d?)/);
			ver = parseInt(m[1]);
			if (ver < 10) {
				setTimeout(function() {
					if (window[fn]) {
						window[fn](new Error("Network I/O error"));
					}
				}, 10000);
			}
		}
		if (url.indexOf('?') != -1) {
			url += "&callback=" + fn;
		} else {
			url += "?callback=" + fn;
		}
		s = document.createElement('script');
		s.setAttribute('src', url);
		s.setAttribute('onerror', fn+"(new Error('Network I/O error'));");
		if (!document.body) {
			setTimeout(function() {
				document.body.appendChild(s);
			}, 100);
		} else document.body.appendChild(s);
	}
} else  if (cosrType == 1 || cosrType == 2) { //H5 version
	getJSON = function(url, cb)
	{
		var xhr;
		function handleRes(status)
		{
			if (!status) status = xhr.status;
			if (status == 200) {
				var r;
				try {
					r = parseJSON(xhr.responseText);
				} catch(e) {
					cb(e);
					return;
				}
				cb(null, r, xhr);
			} else {
					var e = new Error(xhr.responseText);
					e.code = status;
					cb(e);
			}
		}
		if (cosrType == 1) {
			xhr = new XMLHttpRequest();
			xhr.open("GET", url, true);
			xhr.withCredentials = true;
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) 	handleRes();
			};
		} else {
			xhr = new XDomainRequest();
			xhr.open("GET", url);
			xhr.ontimeout = function() {handleRes('TIMEOUT');}
			xhr.onerror=function() {handleRes('IO');}
			xhr.onload=function() {handleRes(200);};
		}
		xhr.send(null);
	}
}

//api entry
var  vmsAPICall = function(o, cb)
{
	var url;
	//判断是不是数组
	function isArray(obj) {
		return Object.prototype.toString.call(obj) === '[object Array]';
	}
	if (typeof o == 'object') {
		if(o.uid == null) o.uid=globalObj.p2psr.uid;
		url = "/api?";
		var names=[];
		for(var i in o) {
			if (o[i] != null && o[i] != '') names.push(i);
		}
		names.sort();
		for(var i=0;  i<names.length; ++i) {
			if (i != 0) {
				url += "&";
			}
			if(isArray(o[names[i]]))
			{
				for(var j=0;j< o[names[i]].length;j++)
				{
					if (j != 0) url += "&";
					url += names[i] + "=" + encodeURIComponent(o[names[i]][j]);
				}
			}else url += names[i]  + "=" + encodeURIComponent(o[names[i]]);
		}
	} else {
		url = o+"&uid="+encodeURIComponent(globalObj.p2psr.uid);
	}
	if (globalObj.p2psr.referer) {
		if (url.indexOf('?') == -1) {
			url += "?referer=" + encodeURIComponent(globalObj.p2psr.referer);
		} else {
			url += "&referer=" + encodeURIComponent(globalObj.p2psr.referer);
		}
	}
	if (globalObj.p2psr.p2pproxy != null) {
		url = globalObj.p2psr.host + url;
		var proxyUrl = globalObj.p2psr.p2pproxy;
		proxyUrl  += "?url=" + encodeURIComponent(url);
		if (globalObj.p2psr.p2pstreamer != null) {
			proxyUrl  += "&streamer=" + encodeURIComponent(globalObj.p2psr.p2pstreamer);
		}
		url = proxyUrl;
	} else {
		url = globalObj.p2psr.host + url;
	}
	getJSON(url, function(err, res, xhr) {
		if (err) {
			if (window.console) window.console.log("getJSON error: " + err);
			cb(err);
			return;
		}
		if (typeof res != 'object' || res == null) {
			cb(new Error("Bad server response"));
			return;
		}
		if (res.code != 'OK') {
			err = new Error(res.msg);
			err.code = res.code;
			cb(err);
			return;
		}
		cb(null, res, xhr);
	});
}

var vmsAPIInit = function(host,uid)
{
	globalObj.p2psr.host = host;
	globalObj.p2psr.uid  = uid;
}

if (globalObj.p2psr) return;

globalObj.p2psr = vmsAPICall;

//detect referer
if (envType == 0) {
	var s = window.location.href;
	var m = s.match(/^(https?:\/\/[^\/]*)\/.*/);
	if (m && m[1]) {
		globalObj.p2psr.referer = m[1];
	}
}

globalObj.p2psr.init = vmsAPIInit;
globalObj.p2psr.getJSON = getJSON;
globalObj.p2psr.parseJSON = parseJSON;

//md5
(function() {
	var hex_chr = '0123456789abcdef';
	function rhex(num)
	{
	str = "";
	for(j = 0; j <= 3; j++)
	str += hex_chr.charAt((num >> (j * 8 + 4)) & 0x0F) +
	hex_chr.charAt((num >> (j * 8)) & 0x0F);
	return str;
	}
	function str2blks_MD5(str)
	{
	nblk = ((str.length + 8) >> 6) + 1;
	blks = new Array(nblk * 16);
	for(i = 0; i < nblk * 16; i++) blks[i] = 0;
	for(i = 0; i < str.length; i++)
	blks[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
	blks[i >> 2] |= 0x80 << ((i % 4) * 8);
	blks[nblk * 16 - 2] = str.length * 8;
	return blks;
	}
	function add(x, y)
	{
	var lsw = (x & 0xFFFF) + (y & 0xFFFF);
	var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	return (msw << 16) | (lsw & 0xFFFF);
	}
	function rol(num, cnt)
	{
	return (num << cnt) | (num >>> (32 - cnt));
	}
	function cmn(q, a, b, x, s, t)
	{
	return add(rol(add(add(a, q), add(x, t)), s), b);
	}
	function ff(a, b, c, d, x, s, t)
	{
	return cmn((b & c) | ((~b) & d), a, b, x, s, t);
	}
	function gg(a, b, c, d, x, s, t)
	{
	return cmn((b & d) | (c & (~d)), a, b, x, s, t);
	}
	function hh(a, b, c, d, x, s, t)
	{
	return cmn(b ^ c ^ d, a, b, x, s, t);
	}
	function ii(a, b, c, d, x, s, t)
	{
	return cmn(c ^ (b | (~d)), a, b, x, s, t);
	}
	globalObj.p2psr.MD5 = function(str)
	{
	x = str2blks_MD5(str);
	var a =  1732584193;
	var b = -271733879;
	var c = -1732584194;
	var d =  271733878;
	for(i = 0; i < x.length; i += 16)
	{
	var olda = a;
	var oldb = b;
	var oldc = c;
	var oldd = d;
	a = ff(a, b, c, d, x[i+ 0], 7 , -680876936);
	d = ff(d, a, b, c, x[i+ 1], 12, -389564586);
	c = ff(c, d, a, b, x[i+ 2], 17,  606105819);
	b = ff(b, c, d, a, x[i+ 3], 22, -1044525330);
	a = ff(a, b, c, d, x[i+ 4], 7 , -176418897);
	d = ff(d, a, b, c, x[i+ 5], 12,  1200080426);
	c = ff(c, d, a, b, x[i+ 6], 17, -1473231341);
	b = ff(b, c, d, a, x[i+ 7], 22, -45705983);
	a = ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
	d = ff(d, a, b, c, x[i+ 9], 12, -1958414417);
	c = ff(c, d, a, b, x[i+10], 17, -42063);
	b = ff(b, c, d, a, x[i+11], 22, -1990404162);
	a = ff(a, b, c, d, x[i+12], 7 ,  1804603682);
	d = ff(d, a, b, c, x[i+13], 12, -40341101);
	c = ff(c, d, a, b, x[i+14], 17, -1502002290);
	b = ff(b, c, d, a, x[i+15], 22,  1236535329);
	a = gg(a, b, c, d, x[i+ 1], 5 , -165796510);
	d = gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
	c = gg(c, d, a, b, x[i+11], 14,  643717713);
	b = gg(b, c, d, a, x[i+ 0], 20, -373897302);
	a = gg(a, b, c, d, x[i+ 5], 5 , -701558691);
	d = gg(d, a, b, c, x[i+10], 9 ,  38016083);
	c = gg(c, d, a, b, x[i+15], 14, -660478335);
	b = gg(b, c, d, a, x[i+ 4], 20, -405537848);
	a = gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
	d = gg(d, a, b, c, x[i+14], 9 , -1019803690);
	c = gg(c, d, a, b, x[i+ 3], 14, -187363961);
	b = gg(b, c, d, a, x[i+ 8], 20,  1163531501);
	a = gg(a, b, c, d, x[i+13], 5 , -1444681467);
	d = gg(d, a, b, c, x[i+ 2], 9 , -51403784);
	c = gg(c, d, a, b, x[i+ 7], 14,  1735328473);
	b = gg(b, c, d, a, x[i+12], 20, -1926607734);
	a = hh(a, b, c, d, x[i+ 5], 4 , -378558);
	d = hh(d, a, b, c, x[i+ 8], 11, -2022574463);
	c = hh(c, d, a, b, x[i+11], 16,  1839030562);
	b = hh(b, c, d, a, x[i+14], 23, -35309556);
	a = hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
	d = hh(d, a, b, c, x[i+ 4], 11,  1272893353);
	c = hh(c, d, a, b, x[i+ 7], 16, -155497632);
	b = hh(b, c, d, a, x[i+10], 23, -1094730640);
	a = hh(a, b, c, d, x[i+13], 4 ,  681279174);
	d = hh(d, a, b, c, x[i+ 0], 11, -358537222);
	c = hh(c, d, a, b, x[i+ 3], 16, -722521979);
	b = hh(b, c, d, a, x[i+ 6], 23,  76029189);
	a = hh(a, b, c, d, x[i+ 9], 4 , -640364487);
	d = hh(d, a, b, c, x[i+12], 11, -421815835);
	c = hh(c, d, a, b, x[i+15], 16,  530742520);
	b = hh(b, c, d, a, x[i+ 2], 23, -995338651);
	a = ii(a, b, c, d, x[i+ 0], 6 , -198630844);
	d = ii(d, a, b, c, x[i+ 7], 10,  1126891415);
	c = ii(c, d, a, b, x[i+14], 15, -1416354905);
	b = ii(b, c, d, a, x[i+ 5], 21, -57434055);
	a = ii(a, b, c, d, x[i+12], 6 ,  1700485571);
	d = ii(d, a, b, c, x[i+ 3], 10, -1894986606);
	c = ii(c, d, a, b, x[i+10], 15, -1051523);
	b = ii(b, c, d, a, x[i+ 1], 21, -2054922799);
	a = ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
	d = ii(d, a, b, c, x[i+15], 10, -30611744);
	c = ii(c, d, a, b, x[i+ 6], 15, -1560198380);
	b = ii(b, c, d, a, x[i+13], 21,  1309151649);
	a = ii(a, b, c, d, x[i+ 4], 6 , -145523070);
	d = ii(d, a, b, c, x[i+11], 10, -1120210379);
	c = ii(c, d, a, b, x[i+ 2], 15,  718787259);
	b = ii(b, c, d, a, x[i+ 9], 21, -343485551);
	a = add(a, olda);
	b = add(b, oldb);
	c = add(c, oldc);
	d = add(d, oldd);
	}
	return rhex(a) + rhex(b) + rhex(c) + rhex(d);
	}
})();

globalObj.p2psr.getJSONP=function(url, cb, fn)
{
		if (!fn) fn = 'jsonp_'+Math.floor(Math.random()*1000000)+Math.floor(Math.random()*1000000);
		window[fn] = function(res) {
			try {
				window[fn] = undefined;
				delete window[fn];
			} catch(e) {}
			if (res instanceof Error) {
				cb(res);
			} else {
				cb(null, res);
			}
		};
		if (navigator.appName == 'Microsoft Internet Explorer') {
			var ver = navigator.appVersion;
			var m = ver.match(/MSIE (\d+\.\d?)/);
			ver = parseInt(m[1]);
			if (ver < 10) {
				setTimeout(function() {
					if (window[fn]) {
						window[fn](new Error("Network I/O error"));
					}
				}, 5000);
			}
		}
		url = url.replace('callback=?', 'callback='+fn);
		var s = document.createElement('script');
		s.setAttribute('src', url);
		s.setAttribute('onerror', fn+"(new Error('Network I/O error'));");
		if (!document.body) {
			setTimeout(function() {
				document.body.appendChild(s);
			}, 100);
		} else document.body.appendChild(s);
};

globalObj.p2psr.parseURL = function(url)
{
	var res={};
	url = ""+url;
	var m = /([^\r\n\s]+:\/\/){0,1}([^\s\r\n\/:]+){0,1}(:\d{1,5}){0,1}(\/[^\r\n\s\?]*){0,1}(\?[^\r\n\s]*){0,1}/.exec(url);
	if (!m) return res;
	res.protocol = m[1];
	res.domain = m[2];
	res.port = m[3];
	res.path = m[4];
	res.query=m[5];
	return res;
}

})();
