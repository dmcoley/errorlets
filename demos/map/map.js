function handleServerIsUp() {
    var name = $("server").value;
    $("results").innerHTML = "Server " + name + " is up :)";
}

function handleServerIsDown() {
    var name = $("server").value;
    $("results").innerHTML = "Server " + name + " is down :(";
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

function printTweets(data) {
    var arr = JSON.parse(data)
    arr.forEach(function(obj) {
        console.log("User " + obj.username + " says " + obj.tweet);
    });
}

