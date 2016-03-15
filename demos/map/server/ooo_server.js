http = require("http");

var port = process.argv[2] ? process.argv[2] : 8080;
var requestNum = 1

http.createServer(function(request, response){
    var me = requestNum++
    console.log("Got request: " + me)

    // need to enable cross domain access
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
    
    timeout = (me % 2 == 0) ? 500 : 0;
    function respond() {
	response.writeHeader(200, {"Content-Type": "application/text"});
        response.write('' + me);
        response.end();
	console.log('Sent request: ' + me);
    }
    if (timeout != 0) 
	setTimeout(respond, timeout);
    else
	respond();


}).listen(port);
console.log("Server Running on ", port); 
