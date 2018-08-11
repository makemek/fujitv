(function() {
    try {
        var d = console;
        Object.defineProperty(window, "console", {
            get: function() {
                if (d._commandLineAPI) {
                    throw "Sorry, For security reason, this site disables console._commandLineAPI !"
                }
                return d
            },
            set: function(h) {
                d = h
            }
        });
        var b = "setTimeout";
        var g = "clearTimeout";
        var c = window[b];
        var a = window[g];
        window.__defineGetter__(b, function() {
            return function(j, h) {
                var i = c(j, h);
                return {
                    h: i
                }
            }
        });
        window.__defineGetter__(g, function() {
            return function(i) {
                if (!i) {
                    return
                }
                if (typeof i === "object") {
                    a(i.h)
                }
            }
        })
    } catch (f) {}
}
)();
var PlayerCtx = {};
PlayerCtx.tz = -9 * 60;
PlayerCtx.homeMode = false;
PlayerCtx.showingStopVideoUI = false;
PlayerCtx.idleTime = 5 * 3600;
PlayerCtx.playing = false;
PlayerCtx.playingLive = false;
PlayerCtx.noSwitchPlayIndexEvent = false;
PlayerCtx.channelsControlLoad = false;
PlayerCtx.uinfo_ok = false;
PlayerCtx.uinfo_id = null;
PlayerCtx.uinfo_act_date = 0;
PlayerCtx.uinfo_exp_date = 0;
PlayerCtx.uinfo_ver = "1";
PlayerCtx.serverTime = 0;
PlayerCtx.apiInfo = {};
if (!window.P2PSVideo) {
    PlayerCtx.apiInfo = {
        host: "http://23.237.36.50:9083",
        rtmfp_host: "rtmfp://23.237.36.50:9035",
        uid: "C2D9261F3D5753E74E97EB28FE2D8B26",
        cid: "279C1F3E73BB0FE9533CAA122E491D03",
        referer: "23.110.255.223"
    };
    PlayerCtx.uinfo_ok = true
}
$(document.body).on("contextmenu", function() {
    return false
});
!function() {
    if (window.P2PSVideo) {
        return
    }
    var d = location.href;
    var h = d.indexOf("#");
    if (h == -1) {
        return
    }
    var g = d.substr(h + 1);
    if (g == "") {
        return
    }
    var c = VMSUI.util.parseQuery(g);
    PlayerCtx.uinfo_ok = false;
    PlayerCtx.apiInfo = {};
    PlayerCtx.uinfo_id = null;
    c.expired = c.expired == "true" || c.expired == "1" || c.expired == "yes";
    c.disabled = c.disabled == "true" || c.disabled == "1" || c.disabled == "yes";
    if (c.expired) {
        c.code = "SERVICE_EXPIRED"
    } else {
        if (c.disabled) {
            c.code = "SERVICE_DISABLED"
        }
    }
    if (c.code == "OK" && c.access_token && c.product_config) {
        var a = $.parseJSON(c.product_config);
        PlayerCtx.apiInfo = {};
        PlayerCtx.apiInfo.host = a.vms_host;
        PlayerCtx.apiInfo.rtmfp_host = a.vms_rtmfp_host;
        PlayerCtx.apiInfo.uid = a.vms_uid;
        PlayerCtx.apiInfo.cid = a.vms_live_cid;
        PlayerCtx.apiInfo.referer = a.vms_referer;
        p2psr.__cross_domain_user = c.access_token;
        PlayerCtx.apiInfo.single = a.single;
        PlayerCtx.uinfo_ok = true;
        PlayerCtx.uinfo_id = c.account;
        PlayerCtx.uinfo_trial = c.trial == "1" || c.trial == "true";
        PlayerCtx.uinfo_confirmed = c.confirmed == "1" || c.confirmed == "true";
        PlayerCtx.uinfo_show_trial_expire = a.show_trial_expire;
        if (c.create_time) {
            PlayerCtx.uinfo_act_date = c.create_time
        } else {
            PlayerCtx.uinfo_act_date = 0
        }
        if (c.expire_time) {
            PlayerCtx.uinfo_exp_date = c.expire_time
        } else {
            PlayerCtx.uinfo_exp_date = 0
        }
        PlayerCtx.serverTime = c.server_time * 1000;
        var f = new Date().getTime();
        var b = PlayerCtx.serverTime;
        setInterval(function() {
            PlayerCtx.serverTime = b + new Date().getTime() - f
        }, 100);
        setInterval(updateUserInfo, 500)
    }
    if (c.code == "SERVICE_EXPIRED") {
        alert("Your subscription is expired, please renew in time.");
        window.top.location.href = "https://fujitv.live/subscriptions";
        return
    } else {
        if (c.code == "SERVICE_DISABLED") {
            alert("Your subscription is disabled, please contact the vendor");
            return
        } else {
            if (c.code == "BANED") {
                alert("You have tried to access too many times, please retry after 5 minutes");
                return
            } else {
                if (c.code != "OK") {
                    alert("Sorry, an unexpected error occurs, please try again later. \nERRCODE: " + c.code + "\nMessage: " + c.msg);
                    return
                }
            }
        }
    }
}();
PlayerCtx._controlChannels = null;
PlayerCtx._controlTS = null;
PlayerCtx.translation = {};
$(function() {
    FastClick.attach(document.body);
    window.VMSUI.KN.install();
    VMSUI.loadModule("ui/translation.js", function(b, a) {
        if (!b) {
            PlayerCtx.translation = a;
            VMSUI.translate(document.body, a)
        }
    });
    VMSUI.loadControl("ui/tv_userinfo.html", "ui/tv_userinfo.js", "#tv_userinfo_control", {}, function() {
        if (PlayerCtx.translation) {
            VMSUI.translate($("#tv_userinfo_control")[0], PlayerCtx.translation)
        }
    });
    VMSUI.loadControl("ui/tv_expired.html", "ui/tv_expired.js", "#tv_expired_control", {}, function() {
        if (PlayerCtx.translation) {
            VMSUI.translate($("#tv_expired_control")[0], PlayerCtx.translation)
        }
    });
    loadChannelsControl();
    VMSUI.loadControl("ui/tv_ts_info.html", "ui/tv_ts_info.js", ".tv_epg", {
        virtual: window.P2PSVideo != null
    }, function(a, b) {
        if (!a) {
            if (PlayerCtx.translation) {
                VMSUI.translate($(".tv_epg")[0], PlayerCtx.translation)
            }
            PlayerCtx._controlTS = b;
            var c = $(".tv_epg .ts_wrapper");
            if (isMobileDevice()) {
                c.addClass("scrollable_mobile")
            } else {
                c.addClass("scrollable_tvbox")
            }
            $(b.view).on("playsame", switchFull.bind(null, true));
            $(b.view).on("playnew", playNew);
            $(b.view).on("data_updated", function(d) {
                sendChannelList(false);
                if (PlayerCtx.playingLive) {
                    $("#tv_date_name").text(PlayerCtx._controlTS.getCurrentDateText());
                    $("#tv_program_name").text(PlayerCtx._controlTS.getCurrentProgramName())
                }
                VMSUI.util.clearJQueryCache()
            });
            VMSUI.loadControl("ui/tv_ts_date.html", "ui/tv_ts_date.js", ".tv_epg_date", {
                epg_ctl: b
            }, function(d, f) {
                if (d) {
                    alert(d)
                } else {
                    var g = $(".tv_epg_date .ts_date_wrapper");
                    if (isMobileDevice()) {
                        g.addClass("scrollable_mobile")
                    } else {
                        g.addClass("scrollable_tvbox")
                    }
                    $(f.view).on("data_updated", function() {
                        $(".ts_date_wrapper", f.view).removeClass("tv_background")
                    })
                }
            })
        }
    });
    webUIOK()
});
function getCurrentTime(b) {
    var a = new TimeZoneDate();
    if (PlayerCtx.tz && b) {
        a.setTimezoneOffset(PlayerCtx.tz)
    }
    if (PlayerCtx.serverTime == 0) {
        return a
    } else {
        a.setTime(PlayerCtx.serverTime)
    }
    return a
}
function loadChannelsControl() {
    if (PlayerCtx.channelsControlLoad) {
        return
    }
    if (!PlayerCtx.uinfo_ok) {
        return
    }
    PlayerCtx.channelsControlLoad = true;
    VMSUI.loadControl("ui/tv_channels.html", "ui/tv_channels.js", "#tv_channels_control", PlayerCtx.apiInfo, function(a, b) {
        if (!a) {
            if (PlayerCtx.translation) {
                VMSUI.translate($("#tv_channels_control")[0], PlayerCtx.translation)
            }
            PlayerCtx._controlChannels = b;
            var c = $("#tv_channels_control .tv_channels_items_wrapper");
            if (isMobileDevice()) {
                console.log("Using mobile mode");
                c.addClass("scrollable_mobile")
            } else {
                console.log("Using tv mode");
                c.addClass("scrollable_tvbox")
            }
            $(b.view).on("playsame", switchFull.bind(null, true));
            $(b.view).on("playnew", playNew);
            $(b.view).on("data_updated", function(d) {
                sendChannelList(true);
                if (PlayerCtx._controlTS) {
                    PlayerCtx._controlTS.fillTSPage(PlayerCtx._controlChannels.getCurrentChannel())
                }
                VMSUI.util.clearJQueryCache()
            })
        }
        loadLiveCatControl(b)
    })
}
function loadLiveCatControl(a) {
    VMSUI.loadControl("ui/tv_channel_cat.html", "ui/tv_channel_cat.js", "#tv_cat_list", {
        channels_ctl: a
    }, function(b, c) {
        if (b) {
            alert(b);
            return
        }
        $(c.view).on("data_updated", function() {
            if (PlayerCtx.translation) {
                VMSUI.translate(c.view, PlayerCtx.translation)
            }
            $("#tv_cat_list").removeClass("tv_background");
            var d = $("#tv_cat_list [tabindex]");
            var f = $("#tv_cat_list")[0].clientHeight;
            f -= d.length;
            d.css("height", Math.floor(f / d.length));
            d.css("line-height", Math.floor(f / d.length) + "px");
            $("#tv_cat_list .live_cat_last").css("height", Math.floor(f / d.length + 1));
            $("#tv_cat_list .live_cat_last").css("line-height", Math.floor(f / d.length + 1) + "px")
        })
    })
}
function playNew(d, c) {
    if (!PlayerCtx._controlChannels) {
        return
    }
    var b = PlayerCtx.apiInfo.host;
    if (!b) {
        alert("Channel list is not initialized!");
        PlayerCtx._controlChannels.resetLastPlay();
        return
    }
    var a = PlayerCtx.apiInfo.rtmfp_host;
    PlayerCtx.playingLive = c.live;
    var f = false;
    if (c.m && !isNaN(c.m.movie_level)) {
        f = (c.m.movie_level & 128) != 0
    }
    if (c.live) {
        doPlay(b + c.path + ".json?type=live", a, true, c.title, "" + c.m.no, c.index, f, c);
        PlayerCtx._controlTS.resetLastPlay();
        PlayerCtx._controlTS.fillTSPage(c.m);
        $("#tv_date_name").text(PlayerCtx._controlTS.getCurrentDateText());
        $("#tv_program_name").text(PlayerCtx._controlTS.getCurrentProgramName());
        $("#tv_channel_name").text(c.title);
        switchPlayIndex(c.index, true, c.live_cat_index, -1)
    } else {
        doPlay(b + c.path + ".json?type=vod", a, false, c.title + " " + c.dateText, "", c.index, f, c);
        PlayerCtx._controlChannels.resetLastPlay();
        $("#tv_date_name").text(c.dateText);
        $("#tv_program_name").text(c.title);
        switchPlayIndex(c.index, false, -1, c.date_index)
    }
}
function playByIndex(b, a, d) {
    var c = PlayerCtx.noSwitchPlayIndexEvent;
    PlayerCtx.noSwitchPlayIndexEvent = d;
    if (b) {
        if (PlayerCtx._controlChannels) {
            PlayerCtx._controlChannels.playByIndex(a)
        }
    } else {
        if (PlayerCtx._controlTS) {
            PlayerCtx._controlTS.playByIndex(a)
        }
    }
    PlayerCtx.noSwitchPlayIndexEvent = c
}
function sendChannelList(c) {
    console.log("sendChannelList: " + c);
    if (c) {
        if (!PlayerCtx._controlChannels) {
            return
        }
        var f = PlayerCtx._controlChannels.getChannels();
        if (!f) {
            return
        }
        var a = [];
        for (var b = 0; b < f.length; ++b) {
            var g = f[b];
            var h = PlayerCtx.apiInfo.host + g.playpath + ".jpg?type=live&thumbnail=thumbnail_small.jpg";
            a.push({
                no: g.no,
                name: g.name,
                index: b,
                live_cat_index: g.live_cat_index,
                thumbnail: h
            })
        }
        if (window.P2PSVideo) {
            var d = {
                live: c,
                currentIndex: PlayerCtx._controlChannels.getCurrentPlayIndex(),
                cats: PlayerCtx._controlChannels.getChannelCats(),
                chnls: a
            };
            window.P2PSVideo.sendChannelList(JSON.stringify(d))
        }
    } else {
        if (!PlayerCtx._controlTS) {
            return
        }
        var f = PlayerCtx._controlTS.getCurrentTSS();
        if (!f) {
            return
        }
        var a = [];
        for (var b = 0; b < f.length; ++b) {
            var g = f[b];
            a.push({
                name: g.title,
                time_text: g.timeText,
                index: b,
                date_index: g.dateIndex,
                epg_type: g.epg_type,
                is_current_epg: g.is_current_epg,
                epg_type_text: g.epg_type_text
            })
        }
        var d = {
            live: c,
            currentIndex: PlayerCtx._controlTS.getCurrentPlayIndex(),
            dates: PlayerCtx._controlTS.getDateList(),
            chnls: a
        };
        if (window.P2PSVideo) {
            window.P2PSVideo.sendChannelList(JSON.stringify(d))
        }
    }
}
function switchPlayIndex(c, d, b, a) {
    console.log("switchPlayIndex: " + c);
    if (PlayerCtx.noSwitchPlayIndexEvent) {
        return
    }
    if (window.P2PSVideo) {
        window.P2PSVideo.switchPlayIndex(c, d, b, a)
    }
}
var gTrialStopTimer2 = {};
function doPlay(b, f, d, h, c, a, i, g) {
    if (!PlayerCtx.uinfo_ok) {
        showExpired();
        return
    }
    console.log("Play video: " + b);
    console.log("Streamer: " + f);
    PlayerCtx.playing = true;
    if (gTrialStopTimer2 && window.P2PSVideo) {
        setTimeout(function() {
            window.P2PSVideo.playVideo(b, f, d, h, c, a, i)
        }, 1)
    } else {
        if (gTrialStopTimer2.h) {
            clearTimeout(gTrialStopTimer2.h);
            gTrialStopTimer2.h = null
        }
        if (!swfobject.hasFlashPlayerVersion("10.1.0")) {
            $(".tv_video").html('<a href="https://get.adobe.com/flashplayer/" target="_blank"><img  id="video_player" src="images/fp.jpg" width="100%" height="100%" /></a>');
            PlayerCtx.playing = false;
            return
        }
        else {
            if (!PlayerCtx.uinfo_confirmed && PlayerCtx.uinfo_trial) {
                gTrialStopTimer2.h = setTimeout(function() {
                    stopVideo();
                    if (confirm("Your account is not activated, you must activate your account to continue watching. \n\nActivation is FREE, do you want to activate your account now ?\n")) {
                        if (window.self != window.top) {
                            window.top.location.href = "https://fujitv.live/request-account-activation-email"
                        } else {
                            window.location.href = "https://fujitv.live/request-account-activation-email"
                        }
                    }
                }, 120000)
            }
        }
        checkSinglePlay();
        setTimeout(function() {
            if (parseInt(c) == 3) {
                $(".tv_video").html('<img  id="video_player" src="images/video.jpg" width="100%" height="100%" />')
            }
            p2psr_embed("p2p", d ? "live" : "vod", PlayerCtx.apiInfo.host, g.path, "video_player", "471", "300", "10.1.0", PlayerCtx.apiInfo.host + "/global/expressInstall.swf", {
                auto_play: 1,
                no_side_bar: true,
                disable_thumbnail: 1
            }, {
                allowFullScreen: true,
                allowScriptAccess: "always",
                bgcolor: "#000000"
            })
        }, 1)
    }
}
var gSinglePlayTimer;
var gSinglePlayOwn = false;
var gSingling = false;
function checkSinglePlay() {
    if (!PlayerCtx.apiInfo.single || !p2psr.__cross_domain_user || gSingling) {
        return
    }
    if (gSinglePlayTimer) {
        clearTimeout(gSinglePlayTimer);
        gSinglePlayTimer = null
    }
    gSingling = true;
    var a = PlayerCtx.apiInfo.single;
    if (a.indexOf("?") == -1) {
        a += "?"
    }
    a += "&ua=webpc&own=" + gSinglePlayOwn + "&access_token=" + encodeURIComponent(p2psr.__cross_domain_user) + "&callback=?";
    p2psr.getJSONP(a, function(b, c) {
        gSingling = false;
        if (b) {
            gSinglePlayTimer = setTimeout(checkSinglePlay, 10000);
            return
        }
        if (c && typeof c == "object" && c.code == "OK") {
            gSinglePlayOwn = c.own;
            if (!c.own) {
                stopVideo();
                clearTimeout(gSinglePlayTimer);
                gSinglePlayTimer = null;
                alert("Your account is being used on another device, Only one play session is allowed for one account.");
                return
            }
        }
    });
    gSinglePlayTimer = setTimeout(checkSinglePlay, 60000)
}
function showInformation(a) {
    console.log(a);
    if (window.P2PSVideo) {
        P2PSVideo.showInformation(a)
    }
}
function showExpired() {
    stopVideo();
    alert(PlayerCtx.translation.expiration_alert)
}
function stopVideo() {

}
function switchFull(a) {
    if (window.P2PSVideo) {
        window.P2PSVideo.switchFull(a)
    }
}
function preChannel() {
    PlayerCtx._controlChannels.preChannel()
}
function nextChannel() {
    PlayerCtx._controlChannels.nextChannel()
}
function videoPlayEnd() {
    if (!PlayerCtx._controlTS.nextTS()) {
        PlayerCtx._controlChannels.playCurrentChannel()
    }
}
function exitApp() {
    if (window.P2PSVideo) {
        window.P2PSVideo.exitApp()
    }
}
function webUIOK() {
    if (window.P2PSVideo) {
        window.P2PSVideo.webUIOK()
    }
}
function showStopVideoUI(a) {
    PlayerCtx.showingStopVideoUI = a;
    if (window.P2PSVideo) {
        window.P2PSVideo.showStopVideoUI(a)
    }
}
function showSettings() {
    if (window.P2PSVideo) {
        window.P2PSVideo.showSettings()
    }
}
function isMobileDevice() {
    if (window.P2PSVideo) {
        return window.P2PSVideo.isMobileDevice()
    }
}
function toTextN(a, b) {
    a = "" + a;
    while (a.length < b) {
        a = "0" + a
    }
    return a
}
function date2Text(a) {
    var b = new TimeZoneDate();
    b.setTimezoneOffset(PlayerCtx.tz);
    b.setTime(a.getTime());
    return "" + toTextN(b.getFullYear(), 4) + "/" + toTextN(b.getMonth() + 1, 2) + "/" + toTextN(b.getDate(), 2)
}
function time2Text(a) {
    var b = new TimeZoneDate();
    b.setTimezoneOffset(PlayerCtx.tz);
    b.setTime(a.getTime());
    return date2Text(a) + " " + toTextN(b.getHours(), 2) + ":" + toTextN(b.getMinutes(), 2)
}
function updateUserInfo() {
    $(".uinfo_id").text(PlayerCtx.uinfo_id);
    if (PlayerCtx.uinfo_act_date == 0 || PlayerCtx.uinfo_act_date == -1) {
        $(".uinfo_act_date").text("N/A")
    } else {
        var a = new Date();
        a.setTime(PlayerCtx.uinfo_act_date * 1000);
        $(".uinfo_act_date").text(time2Text(a))
    }
    if (PlayerCtx.uinfo_exp_date == 0 || PlayerCtx.uinfo_exp_date == -1 || !PlayerCtx.uinfo_show_trial_expire && PlayerCtx.uinfo_trial) {
        $(".uinfo_exp_date").text("N/A")
    } else {
        var a = new Date();
        a.setTime(PlayerCtx.uinfo_exp_date * 1000);
        $(".uinfo_exp_date").text(time2Text(a))
    }
    if (PlayerCtx.uinfo_trial == null) {
        $(".uinfo_account_type").text("N/A")
    } else {
        if (PlayerCtx.uinfo_trial) {
            $(".uinfo_account_type").html('<a href="https://fujitv.live/subscriptions" target="_blank">Trial</a>')
        } else {
            $(".uinfo_account_type").text("Pay")
        }
    }
    var b = getCurrentTime(true);
    $(".uinfo_time").text(time2Text(b));
    $(".uinfo_ver").text(PlayerCtx.uinfo_ver);
    if (PlayerCtx.uinfo_exp_date != 0 && PlayerCtx.uinfo_exp_date != -1) {
        var a = getCurrentTime().getTime();
        a = PlayerCtx.uinfo_exp_date * 1000 - a;
        if (a < 0) {
            a = 0
        }
        a /= 1000;
        a /= 24 * 3600;
        a = Math.floor(a);
        if (a < 10) {
            a = "00" + a
        } else {
            if (a < 100) {
                a = "0" + a
            }
        }
        $("#tv_user_expire").text("" + a)
    } else {
        $("#tv_user_expire").text("000")
    }
    if (PlayerCtx.uinfo_id != null) {
        $("#tv_user_id").text(PlayerCtx.uinfo_id)
    }
    if (PlayerCtx._controlChannels != null && PlayerCtx.apiInfo.host != null && PlayerCtx.apiInfo.host != "") {
        PlayerCtx._controlChannels.updateDataSource(PlayerCtx.apiInfo)
    }
}
setInterval(function() {
    $("#fangsong_time").text(time2Text(getCurrentTime()))
}, 1000);
$(".tv_userinfo_detail").click(function() {
    stopVideo();
    VMSUI.getModuleFromView("#tv_userinfo_control").show()
});
$(".tv_settings_button").click(function() {
    showSettings();
    VMSUI.KN.activateContainer(".tv_channels_items")
});
VMSUI.KN.keyEvent(function(b, a) {
    if (PlayerCtx.showingStopVideoUI) {
        showStopVideoUI(false)
    }
    if (b.keyCode == 27 && !a) {
        if (PlayerCtx.homeMode || !window.P2PSVideo) {
            return
        }
        if (confirm(PlayerCtx.translation.confirm_exit)) {
            exitApp()
        }
    }
});
setInterval(function() {
    if (PlayerCtx.playing) {
        if (VMSUI.KN.subKeyTimeFromNow() / 1000 > PlayerCtx.idleTime) {
            if (PlayerCtx.showingStopVideoUI) {
                stopVideo();
                showStopVideoUI(false);
                return
            }
            showStopVideoUI(true)
        } else {
            if (PlayerCtx.showingStopVideoUI) {
                showStopVideoUI(false)
            }
        }
    }
}, 60000);
