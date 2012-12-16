// set focus to current text position
function findCurrentText() {
	var focus;
	$("#transcript dl dt").each(function(index,element) {
		var currentTime = $('#media video')[0].currentTime;
		if ($(element).tmplItem().data.time<=currentTime) {
			focus=$(element).next().find('.text');
		}
		if ($(element).tmplItem().data.time>currentTime) {
			return false; // break each
		}
	});
	focus.focus();
	return focus;
} // findCurrentText

function formatTime(time) {
	var seconds = Math.floor(time%60)+"";
	while (seconds.length < 2) seconds = "0" + seconds;
	return Math.floor(time/60)+':'+seconds;
} // formatTime

// add a line at current time
function addLine() {
	before = findCurrentText();
	var currentTime = $('#media video')[0].currentTime;
	data = {'time':currentTime,'text':''};
	$(before).parent().after($("#lineTemplate").tmpl(data));
	findCurrentText();
} // addLine

function loadHtmlTranscript(file) {
	$('<iframe></iframe>').appendTo('body')
		.attr('src', file)
		.load(function() {
		var data = [];
		$(this).contents().find('p').each(function(index,element) {
			data.push({
				'time':$(this).attr('title'),
				'text':$.trim($(this).html())
			});
		});
		$("#transcript dl").empty();
		$("#lineTemplate").tmpl(data).appendTo("#transcript dl");
		$('#transcript dl .delete').first().remove();
		$(this).remove();
	});
} // loadHtmlTranscript

/*
function loadJsTranscript(data) { // loaded by saved file
	data = data.lines;
	$("#transcript dl").empty();
	$("#lineTemplate").tmpl(data).appendTo("#transcript dl");
	$('#transcript dl .delete').first().remove();
} // loadJsTranscript */

function newTranscript() {
	$('#transcript dl').empty().append($("#lineTemplate").tmpl({
		'time':0,
		'text':$("#introductionTemplate").tmpl().text()
		}));
	$('#transcript .delete').remove();
	$('#transcript .text').focus();
} // newTranscript

function getCurrentTranscript() {
	var data = {'lines':[]};
	$('#transcript dl dt').each(function(index,element) {
		data.lines.push({
			'time': $.trim($(this).tmplItem().data.time),
			'text': $(this).next().find('.text').text()
		});
	});
	return data;
} // getCurrentTranscript

function exportHtml(data) {
	data = $('#exportTemplate').tmpl(data).wrapAll('<div>').parent().html();
	data = '<!DOCTYPE html><html>'+
		'<head>'+
		'<meta http-equiv="content-type" content="text/html; charset=utf-8" />'+
		'<meta charset="UTF-8" />'+
		'<title>transcript</title></head>'+
		'<body>'+data+'</body></html>'
	data = 'data:text/html;base64,' + // application/octet-stream
		window.btoa(unescape(encodeURIComponent(data)));
	// window.location.href = data;
	window.open(data);
} // exportHtml

/* function exportJs(data) {
	data = JSON.stringify(data);
	data = 'loadJsTranscript('+data+');';
	data = 'data:text/javascript;base64,' + // application/octet-stream
		window.btoa(unescape(encodeURIComponent(data)));
	// window.location.href = data;
	window.open(data);
} // exportJs */

function choseFile(type,event) {
    // Thanks Robert Nyman https://hacks.mozilla.org/2012/04/taking-pictures-with-the-camera-api-part-of-webapi/
    // Get a reference to the taken picture or chosen file
    var files = event.target.files;
    if (files.length > 0) {
        loadFile(type,files[0]);
    }
}
function loadFile(type,file) {
    try {
        // Create ObjectURL
        var imgURL = window.URL.createObjectURL(file);
        // Set img src to ObjectURL
				includeFile(type,imgURL);
        // Revoke ObjectURL
        // window.URL.revokeObjectURL(imgURL);
    }
    catch (e) {
        try {
            // Fallback if createObjectURL is not supported
            var fileReader = new FileReader();
            fileReader.onload = function(event) {
							includeFile(type,fileReader.result);
            };
            fileReader.readAsDataURL(file);
        }
        catch (e) {
            console.warn("Neither createObjectURL nor FileReader are supported");
        }
    }
}
function includeFile(type,file) {
	switch (type) {
		case 'video':
			$('#media video').attr('src',file);
			break;
		case 'html':
			loadHtmlTranscript(file);
			break;
	}
}



$(function() {
// adjust speed
// compatibility: http://areweplayingyet.org/property-playbackRate
$('#speed').toggle(
	function () {
		$('#media video')[0].playbackRate=0.625;
		$('#speed').text('⅝');
	},
	function () {
		$('#media video')[0].playbackRate=0.875;
		$('#speed').text('⅞');
	},
	function () {
		$('#media video')[0].playbackRate=1;
		$('#speed').text('1');
	}
); //.remove();


// init
newTranscript();

// press enter to add line
$('body').keypress(function(e) {
	var code = (e.keyCode ? e.keyCode : e.which);
	if (code == 13) {
		e.preventDefault();
		addLine();
	}
});

// delete line
$("#transcript dl").on("click", "span.delete", function(e) {
	$(this).parent().prev().remove();
	$(this).parent().remove();
});

// position changed manually (seeking)
$('#media video')[0].addEventListener("seeked", function () {
	findCurrentText();
});

// position changed while playing or seeking (approx. 4 times per second)
$('#media video')[0].addEventListener("timeupdate", function () {
	findCurrentText();
});

$('#media #prevSec').click(function() {
	$('#media video')[0].currentTime=$('#media video')[0].currentTime-1;
});
$('#media #play').click(function() {
	if ($("#media video").get(0).paused) $('#media video')[0].play();
	else $('#media video')[0].pause();
});

// click on timestamp
$("#transcript dl").on("click", "dt", function(e) {
	$('video')[0].currentTime = $(this).tmplItem().data.time;
});

// export
$('#exportHtml').click(function() {
	var data;
	data = getCurrentTranscript();
	exportHtml(data);
});

$('#videoInputButton').click(function() {
    $("#videoInput").trigger("click");
});
$('#videoInput').change(function(event) {
    choseFile('video',event);
});
$('#htmlInputButton').click(function() {
    $("#htmlInput").trigger("click");
});
$('#htmlInput').change(function(event) {
    choseFile('html',event);
});




$('#footer').data('height',$('#footer').height());
// $('#footer').height(0);
$('#footerToggle').toggle(
	function () {
		$('#footer').animate({
			height:"0"
		}, 500);
	},
	function () {
		$('#footer').animate({
			height:$('#footer').data('height')
		}, 500);
	}
);

// Adjust transcript position when video resized:
$('#media').data('height',0);
setInterval(function(){
	if ($('#media').height()!=$('#media').data('height')) {
		$('#media').data('height',$('#media').height())
		$('#transcript').animate({'margin-top':$('#media').height()+40});
	}
},1000);

});
