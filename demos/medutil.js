function handleServerIsUp() {
    var name = $("server").value;
    if (times < 100) {
        $("results").innerHTML = "Server " + name + " is up :)";
        $("results").style.color = 'green';
    } else {
        $("results").innerHTML = "Server " + name + " is down :(";
        times = 0;
    }
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


