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

    var error = function(e, ek, until) {
        if (!until) {
            ek(e)
        }
    }
    
    var success = function(x, k, ek, id, until) {
        if (!until) {
            try {
	        var res = f(x);
                schedule(k, res, id);
            } catch(err) {
                ek(err)
            }
        }
    }

    return new Stream(success, error);
}

Function.prototype.ErrorStream = function() {
    var h = this

    var success = function(x, k, id, until) {
        if (!until) {
            schedule(k, x, id, until)
        }
    }

    var error = function(err, k, ek, id, until) {
        if (!until) {
            try {
                var res = h(err)
                schedule(k, res, id, until)
            } catch (err) {
                ek(err)
            }
        }
    }

    return new Stream(success, error)
}

Stream.prototype.next = function (g) {
    var f = this;
    g = g.Stream();

    var error = function(e, ek, until) {
        if (!until) {
            ek(e)
        }
    }
    
    var success = function (x, k, ek, id, until) {
        if (!until) {
	    f.successHandler(x,
			     function (y) { g.successHandler(y, k, ek, id, until); },
			     function(err) { g.errorHandler(err, ek, id, until); },
                             id,
                             until
			    );
        }
    };
    return new Stream(success, error);
}


Stream.prototype.error = function(h) {
    var f = this
    h = h.ErrorStream()

    var error = function(e, ek) {
        ek(e)
    }
    
    var success = function(x, k, ek, id, until) {
        if (!until) {
            f.successHandler(x, function(y) {h.successHandler(y, k, id, until)}, function(err) {h.errorHandler(err, k, ek, id, until)}, id, until);
        }
    }

    return new Stream(success, error);
}

Stream.prototype.until = function(stop, interval) {
    interval = interval !== undefined ? interval : 0
    if (typeof(stop) === "function") {
        return this._until_function(stop, interval);
    } else if (stop instanceof Event) {
        return this._until_event(stop, interval)
    } else {
        throw new Error("Until must be called with a function or an event.")
    }
}

Stream.prototype._until_event = function(event, interval) {
    var self = this

    var success = function(x, k, ek) {
        event.successHandler(x, function(y) { clearInterval(self.intervalId); k(y)})
        self.successHandler(x,
                            function(y) {
                                self.intervalId = setInterval(function() {
                                    self.successHandler(x,
                                                        function(y) {
                                                            
                                                        },
                                                        function(err) {
                                                            clearInterval(self.intervalId)
                                                            ek(err)
                                                        }, self.intervalId)
                                }, interval);
                            },
                            function(err) { ek(err) }, self.intervalId);
    }

    return new StateMachine(success, function(err, ek) { ek(err) })
}

Stream.prototype._until_function = function (f, interval) {
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
                                        self.stop = false
                                        self.intervalId = setInterval(function () {
	                                    self.successHandler(x,
			                                        function(y) {
                                                                    // this chain has succeeded, clear the timer and call the continuation
				                                    if (f(y)) {
				                                        clearInterval(self.intervalId);
                                                                        self.until = true
                                                                        schedule(k, y)
				                                    }
			                                        },
			                                        function(err) {
                                                                    // something in the chain failed and wasn't dealt with, so just pass it on
				                                    clearInterval(self.intervalId);
                                                                    self.until = true
				                                    ek(err)
			                                        }, self.intervalId, self.stop);
                                        }, interval);
                                    } else {
                                        schedule(k, y)
                                    }
			        },
			    function(err) {
                                // this means an error has been thrown and wasn't dealt with, so just pass it on
				ek(err);
			    }, self.intervalId, self.stop);
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
