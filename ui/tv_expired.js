var _view;
exports.onLoad = function(view)
{
	_view = view;
	$('.ok_button', _view).click(function() {
		exports.close();
		if (window.exitApp) {
			window.exitApp();
		}
	});
	$('.relet_button', _view).click(function() {
		exports.close();
		console.log("relet button");
		if (window.P2PSVideo) {
			window.P2PSVideo.showReletDlg();
		}
	});
	/*$(view).on('keydown', function(e) {
		if (e.keyCode == 27) {
			$(_view).css('display', 'none');
			$('.dark_mask').css('display', 'none');
			VMSUI.KN.activateLastContainer();
		}
	});*/
}


exports.show = function()
{
	$('.dark_mask').css('display', 'block');
	var uid = $('.uinfo_id', _view).text();
	if (uid == null || uid == '') { //没有uid不显示续期按钮
		$('.relet_button', _view).css('display', 'none');
	} else {
		$('.relet_button', _view).css('display', 'table-cell');
	}
	$(_view).css('display', 'block');
	VMSUI.KN.activateContainer(_view);
}

exports.close = function()
{
	$(_view).css('display', 'none');
	$('.dark_mask').css('display', 'none');
	VMSUI.KN.activateLastContainer();
}
