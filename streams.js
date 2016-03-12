/* Stream functions implementations */
function Stream(successHandler, errorHandler) {
    this.successHandler = successHandler;
    this.errorHandler = errorHandler;
}

Function.prototype.Stream = function() {
    var f = this; // the function

    var error = function(e, ek) {
        ek(e)
    }
    
    var success = function(x, k, ek) {
        try {
	    var res = f(x);
            schedule(k, res);
        } catch(err) {
            ek(err)
        }
    }

    return new Stream(success, error);
}

Stream.prototype.next = function (g) {
    var f = this;
    g = g.Stream();

    var error = function(e, ek) {
        ek(e)
    }
    
    var success = function (x, k, ek) {
	f.successHandler(x,
			 function (y) { g.successHandler(y, k, ek); },
			 function(err) { g.errorHandler(err, ek); }
			)
    };
    
    return new Stream(success, error);
}


Stream.prototype.until = function (f) {
    var self = this;
    self.intervalId = setInterval(function () {
	self.successHandler(x,
			    function(y) {
				if (f(y)) {
				    clearInterval(self.intervalId);
				}
			    },
			    function(err) {
				clearInterval(self.intervalId);
				throw err;
			    });
    }, 500);
}

Stream.prototype.run  = function (x) {
    this.successHanlder(x, function(){}, function(err) {throw err})
}

Stream.prototype.stream = function () {
    throw new Error("Cannot call .stream on a stream object");
}
