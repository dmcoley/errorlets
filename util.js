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
