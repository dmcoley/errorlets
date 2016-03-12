function double(x) {
    return x * 2;
}

function bad(x) {
    if (x === 20) {
        throw "Oh no! x is 20!";
    }
    return x
}

function err(err) {
    console.log("HANDLING ERR: " + err);
    if (err !== "Another Error")
	throw "Another Error";
    return 2
}

function print(x) {
    console.log(x)
    return x
}

function clickTarget(event) {
    var target = event.currentTarget;
    console.log("You clicked me! ");
    return target;
}

function f() {
    return false
}

function iter() {
    var i = 0
    return function() {
        return i++
    }
}
