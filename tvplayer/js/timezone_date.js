function TimeZoneDate(v)
{
	if (v === undefined) {
		this._current = new Date();
	} else {
		this._current = new Date(v);
	}
	this._innerDate = new Date();
	this._orgOffset = this._innerDate.getTimezoneOffset();
	this._tzOffset = this._innerDate.getTimezoneOffset();
	this._offsetTime = function() {
		this._innerDate.setTime(this._current.getTime() - this._tzOffset * 60000);
	};
	this._offsetTime2 = function() {
		this._innerDate.setTime(this._current.getTime() - (this._tzOffset - this._orgOffset) * 60000);
	};
	this._offsetTime();
}

TimeZoneDate.prototype.getTime = function()
{
	return this._current.getTime();
}

TimeZoneDate.prototype.setTime = function(v)
{
	this._current.setTime(v);
	this._offsetTime();
}

TimeZoneDate.prototype.setTimezoneOffset = function(offset)
{
	this._tzOffset = offset;
	this._offsetTime();
}

TimeZoneDate.prototype.getTimezoneOffset = function(offset)
{
	return this._tzOffset;
}

TimeZoneDate.prototype.getDate = function()
{
	return this._innerDate.getUTCDate();
}

TimeZoneDate.prototype.getDay = function()
{
	return this._innerDate.getUTCDay();
}

TimeZoneDate.prototype.getMonth = function()
{
	return this._innerDate.getUTCMonth();
}

TimeZoneDate.prototype.getFullYear = function()
{
	return this._innerDate.getUTCFullYear();
}

TimeZoneDate.prototype.getYear = function()
{
	return this._innerDate.getUTCFullYear() - 1900;
}

TimeZoneDate.prototype.getHours = function()
{
	return this._innerDate.getUTCHours();
}

TimeZoneDate.prototype.getMinutes = function()
{
	return this._innerDate.getUTCMinutes();
}

TimeZoneDate.prototype.getSeconds = function()
{
	return this._innerDate.getUTCSeconds();
}

TimeZoneDate.prototype.getMilliseconds = function()
{
	return this._innerDate.getUTCMilliseconds();
}


TimeZoneDate.prototype.getUTCDate = function()
{
	return this._current.getUTCDate();
}

TimeZoneDate.prototype.getUTCDay = function()
{
	return this._current.getUTCDay();
}

TimeZoneDate.prototype.getUTCMonth = function()
{
	return this._current.getUTCMonth();
}

TimeZoneDate.prototype.getUTCFullYear = function()
{
	return this._current.getUTCFullYear();
}

TimeZoneDate.prototype.getUTCYear = function()
{
	return this._current.getUTCYear();
}

TimeZoneDate.prototype.getUTCHours = function()
{
	return this._current.getUTCHours();
}

TimeZoneDate.prototype.getUTCMinutes = function()
{
	return this._current.getUTCMinutes();
}

TimeZoneDate.prototype.getUTCSeconds = function()
{
	return this._current.getUTCSeconds();
}

TimeZoneDate.prototype.getUTCMilliseconds = function()
{
	return this._current.getUTCMilliseconds();
}

TimeZoneDate.prototype.setDate = function(v)
{
	this._innerDate.setUTCDate(v);
	this._current.setTime(this._innerDate.getTime() - this._tzOffset * 60000);
}

TimeZoneDate.prototype.setDay = function(v)
{
	this._innerDate.setUTCDay(v);
	this._current.setTime(this._innerDate.getTime() - this._tzOffset * 60000);
}

TimeZoneDate.prototype.setMonth = function(v)
{
	this._innerDate.setUTCMonth(v);
	this._current.setTime(this._innerDate.getTime() - this._tzOffset * 60000);
}

TimeZoneDate.prototype.setFullYear = function(v)
{
	this._innerDate.setUTCFullYear(v);
	this._current.setTime(this._innerDate.getTime() + this._tzOffset * 60000);
}

TimeZoneDate.prototype.setYear = function(v)
{
	if (v < 100) v += 1900;
	this._innerDate.setUTCFullYear(v);
	this._current.setTime(this._innerDate.getTime() + this._tzOffset * 60000);
}

TimeZoneDate.prototype.setHours = function(v)
{
	this._innerDate.setUTCHours(v);
	this._current.setTime(this._innerDate.getTime() + this._tzOffset * 60000);
}

TimeZoneDate.prototype.setMinutes = function(v)
{
	this._innerDate.setUTCMinutes(v);
	this._current.setTime(this._innerDate.getTime() + this._tzOffset * 60000);
}

TimeZoneDate.prototype.setSeconds = function(v)
{
	this._innerDate.setUTCSeconds(v);
	this._current.setTime(this._innerDate.getTime() + this._tzOffset * 60000);
}

TimeZoneDate.prototype.setMilliseconds = function(v)
{
	this._innerDate.setUTCMilliseconds(v);
	this._current.setTime(this._innerDate.getTime() + this._tzOffset * 60000);
}

TimeZoneDate.prototype.setUTCDate = function(v)
{
	this._current.setUTCDate(v);
	this._offsetTime();
}

TimeZoneDate.prototype.setUTCDay = function(v)
{
	this._current.setUTCDay(v);
	this._offsetTime();
}

TimeZoneDate.prototype.setUTCMonth = function(v)
{
	this._current.setUTCMonth(v);
	this._offsetTime();
}

TimeZoneDate.prototype.setUTCFullYear = function(v)
{
	this._current.setUTCFullYear(v);
	this._offsetTime();
}

TimeZoneDate.prototype.setUTCHours = function(v)
{
	this._current.setUTCHours(v);
	this._offsetTime();
}

TimeZoneDate.prototype.setUTCMinutes = function(v)
{
	this._current.setUTCMinutes(v);
	this._offsetTime();
}

TimeZoneDate.prototype.setUTCSeconds = function(v)
{
	this._current.setUTCSeconds(v);
	this._offsetTime();
}

TimeZoneDate.prototype.setUTCMilliseconds = function()
{
	this._current.setUTCMilliseconds(v);
	this._offsetTime();
}

TimeZoneDate.prototype.toTimeString = function()
{
	return this._current.toTimeString();
}

TimeZoneDate.prototype.toDateString = function()
{
	return this._current.toDateString();
}

TimeZoneDate.prototype.toGMTString = function()
{
	return this._current.toGMTString();
}

TimeZoneDate.prototype.toUTCString = function()
{
	return this._current.toUTCString();
}

TimeZoneDate.prototype.toSource = function()
{
	return this._current.toSource();
}

TimeZoneDate.prototype.toLocaleString = function()
{
	this._offsetTime2();
	var r = this._innerDate.toLocaleString();
	this._offsetTime();
	return r;
}

TimeZoneDate.prototype.toLocaleTimeString = function()
{
	this._offsetTime2();
	var r = this._innerDate.toLocaleTimeString();
	this._offsetTime();
	return r;
}

TimeZoneDate.prototype.toLocaleDateString = function()
{
	this._offsetTime2();
	var r =  this._innerDate.toLocaleDateString();
	this._offsetTime();
	return r;
}

TimeZoneDate.prototype.toString = function()
{
	return this._current.toString();
}

TimeZoneDate.prototype.UTC = function()
{
	return this._current.UTC();
}

TimeZoneDate.prototype.valueOf = function()
{
	return this._current.valueOf();
}

TimeZoneDate.prototype.parse = function(v)
{
	if (this == null || typeof (this) != 'object' || this._tzOffset === undefined) {
		return Date.prototype.parse(v);
	} else {
		var t = Date.prototype.parse(v);
		var d = new Date();
		t -= d.getTimezoneOffset() * 60000;
		t += this._tzOffset * 60000;
		return t;
	}
}
