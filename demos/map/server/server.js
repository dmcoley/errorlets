my_http = require("http");

var outOfOrder = process.argv[2] === 'true';
var odds = process.argv[3] !== undefined ? parseInt(process.argv[3]) : 3;

var fs = require("fs");
var tweets = JSON.parse(fs.readFileSync("data.json"));

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

function getTweets() {
    if (tweets == null) {
        return null;
    } else {
        var start = randomInt(0, tweets.length - 10);
        return tweets.slice(start, start + 10);
    }
}

var requestNum = 1

my_http.createServer(function(request,response){
    console.log("I got kicked");
    var me = requestNum++
    console.log("Got request:" + me)
    if (outOfOrder) {
        if (randomInt(0, 10) < odds) {
            console.log("Making request " + me + " wait")
            setTimeout(function() {
                response.writeHeader(200, {"Content-Type": "application/json"});
                response.write(JSON.stringify(getTweets()));
                response.end();
                console.log("Sent request", me)
            }, 3000);
            return;
        }
    }

    response.writeHeader(200, {"Content-Type": "application/json"});
    response.write(JSON.stringify(getTweets()));
    response.end();
    console.log("Sent request", me)

}).listen(8080);
console.log("Server Running on 8080"); 
