function double(x) {
    console.log("in double");
    return x * 2;
}

function bad(x) {
    if (x === 20) {
        throw "Oh no! x is 20!";
    }
    return 3
}

function err(err) {
    console.log("HANDLING ERR")
    return 2
}

function print(x) {
    console.log(x)
    return x
}
