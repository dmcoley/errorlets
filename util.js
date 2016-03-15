function schedule(f, x, id, until) {
    setTimeout(function() { f(x, id, until); }, 0);
}

function $() {
    if (arguments.length==1) {
        return document.getElementById(arguments[0]);
    }

    var result=[], i=0, el;
    while(el=document.getElementById(arguments[i++])) {
        result.push(el);
    }

    return result;
}

function fireWhenTrue(conditional, callback) {
    if (conditional()) {
	callback();
    } else {
	setTimeout(function() {fireWhenTrue(conditional, callback);}, 3000);
    }
}

// Builds and sends off the request, calling 'callback'
// upon load with the xhr as a parameter
function buildAndSendXhr(req, callback) {

    var xhr = new XMLHttpRequest();
    xhr.open(req.type, req.url, true);
    if (req.headers) {
  	req.headers.forEach(function (header) {
	    xhr.setRequestHeader(header[0], header[1]);
	});
    }

    xhr.addEventListener("readystatechange",
			 function() {
			     // Not loaded, just return
			     
			     if (xhr.readyState != 4) return;
			     callback(xhr);
			 }, false);
     if (req.data) {
	xhr.send(req.data);
    } else {
	xhr.send();
    }
}

function checkReq(req) {
    return (typeof(req) === 'object') &&
	typeof(req.data) === 'string' &&
	typeof(req.url) === 'string';
}
