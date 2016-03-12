/* Stream functions implementations */
function Stream(successHandler, errorHandler) {
    this.successHandler = successHandler;
    this.errorHandler = errorHandler;
}

Stream.prototype.Stream = function() {
    return this
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

Function.prototype.ErrorStream = function() {
    var h = this

    var success = function(x, k) {
        schedule(k, x)
    }

    var error = function(err, k, ek) {
        try {
            var res = h(err)
            schedule(k, res)
        } catch (err) {
            ek(err)
        }
    }

    return new Stream(success, error)
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


Stream.prototype.error = function(h) {
    var f = this
    h = h.ErrorStream()

    var error = function(e, ek) {
        ek(e)
    }
    
    var success = function(x, k, ek) {
        f.successHandler(x, function(y) {h.successHandler(y, k)}, function(err) {h.errorHandler(err, k, ek)})
    }

    return new Stream(success, error);
}


Stream.prototype.until = function (f, interval) {
    interval = interval ? interval : 500
    var self = this;
    var success = function(x, k, ek) {
        /*
         * This is a little gross so here's what is happening. We don't want to wait for the first call in set interval to fire.
         * This causes the entire chain to wait 'interval' before starting. So we call our success handler immediately. In order
         * to ensure the chain before is ran before this stream starts, we have to put the interval code into the success handler
         * of the first call. In that success handler, we test if we still want to keep going, and if so, set the interval.
         */
        self.successHandler(x,
			        function(y) {
                                    // now if we want to keep going, we'll set the timer
                                    if (!f(y)) {
                                        self.intervalId = setInterval(function () {
	                                    self.successHandler(x,
			                                        function(y) {
                                                                    // this chain has succeeded, clear the timer and call the continuation
				                                    if (f(y)) {
				                                        clearInterval(self.intervalId);
                                                                        schedule(k, y)
				                                    }
			                                        },
			                                        function(err) {
                                                                    // this chain failed, clear the timer
				                                    clearInterval(self.intervalId);
				                                    throw err;
			                                        });
                                        }, interval);
                                    } else {
                                        schedule(k, y)
                                    }
			        },
			    function(err) {
                                // this means an error was thrown on the chain before us. Crash.
				throw err;
			    });
        
        
    }
   
    return new StateMachine(success,
                            function(err, ek) {
                                ek(err)
                            });
}

Stream.prototype.run  = function (x) {
    this.until(function() {return false}).run(x)
}

Stream.prototype.done = function(f, x) {
    this.next(f).run(x);
}

Stream.prototype.stream = function () {
    throw new Error("Cannot call .stream on a stream object");
}
