/* Stream functions implementations */

/*
 * Creates a Stream object.
 */
function Stream(successHandler, errorHandler) {
    this.successHandler = successHandler;
    this.errorHandler = errorHandler;
}

Stream.prototype.Stream = function() {
    return this
}

/*
 * Creates a Stream object from a function.
 */
Function.prototype.Stream = function() {
    var f = this; // the function

    var error = function(e, ek, until) {
        /* TODO: why check for undefined here?? */
        if (until == undefined || !until.stop) {
            ek(e)
        }
    }
    
    var success = function(x, k, ek, id, until) {
        if (!until.stop) {
            try {
	        var res = f(x);
                schedule(k, res, id, until);
            } catch(err) {
                ek(err)
            }
        }
    }

    return new Stream(success, error);
}

/*
 * Creates a Stream object that is setup to handle errors. This is an interal function and should not be used by the user.
 */
Function.prototype.ErrorStream = function() {
    var h = this

    var success = function(x, k, id, until) {
        if (!until.stop) {
            schedule(k, x, id, until)
        }
    }

    var error = function(err, k, ek, id, until) {
        if (!until.stop) {
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

/*
 * Chains a call to g to the end of the chain. 
 */
Stream.prototype.next = function (g) {
    var f = this;
    g = g.Stream();

    var error = function(e, ek, until) {
        if (!until.stop) {
            ek(e)
        }
    }
    
    var success = function (x, k, ek, id, until) {
        if (!until.stop) {
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

/*
 * Creates a Stream object that will handle an error by calling h. This has no effect if there isn't an error.
 */
Stream.prototype.error = function(h) {
    var f = this
    h = h.ErrorStream()

    var error = function(e, ek) {
        ek(e)
    }
    
    var success = function(x, k, ek, id, until) {
        if (!until.stop) {
            f.successHandler(x, function(y) {h.successHandler(y, k, id, until)}, function(err) {h.errorHandler(err, k, ek, id, until)}, id, until);
        }
    }

    return new Stream(success, error);
}

/*
 * This designates the end of a stream. A stream will continue to stream data until stop evaluates to true if it's a function
 * or stop happens if it's an event. Interval can be used to explicitly state the amount of time between each piece of data.
 *
 * Returns a StateMachine object.
 */
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

// an internal function for events
Stream.prototype._until_event = function(event, interval) {
    var self = this

    var success = function(x, k, ek) {
        // the interval and calls the continuation.
        self.successHandler(x,
                            function(y) {
                                self.stop = false
                                // Event is a StateMachine so we want to call it's success handler. Once the event happens our success function will be called which clears                           
                                event.successHandler(x, function(y) { self.stop = true; clearInterval(self.intervalId); k(y)})                                
                                self.intervalId = setInterval(function() {
                                    self.successHandler(x,
                                                        function() {
                                                            // we don't want to do anything here since we're waiting on the event to fire
                                                        },
                                                        function(err) {
                                                            clearInterval(self.intervalId)
                                                            ek(err)
                                                        }, self.intervalId, self)
                                }, interval);
                            },
                            function(err) { ek(err) }, self.intervalId, self);

    }

    return new StateMachine(success, function(err, ek) { ek(err) })
}

// an interval function for functions with until.
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
				                                    if (!self.stop && f(y)) {
									clearInterval(self.intervalId);
                                                                        self.stop = true;
                                                                        schedule(k, y)
				                                    }
			                                        },
			                                        function(err) {
                                                                    // something in the chain failed and wasn't dealt with, so just pass it on
								    if (!self.stop) {
									clearInterval(self.intervalId);
									self.stop = true
									ek(err)
								    }
			                                        }, self.intervalId, self);
                                        }, interval);
                                    } else {
                                        schedule(k, y)
                                    }
			        },
			    function(err) {
                                // this means an error has been thrown and wasn't dealt with, so just pass it on
				ek(err);
			    }, self.intervalId, self);
    }
    
    return new StateMachine(success,
                            function(err, ek) {
                                ek(err)
                            });
}

/*
 * Runs the stream indefinitely with x as the argument.
 */
Stream.prototype.run  = function (x) {
    this.until(function() {return false}).run(x)
}

/*
 * Runs the stream indefinitely with f as a cleanup function to be called at the end of each firing.
 */
Stream.prototype.done = function(f, x) {
    this.next(f).run(x);
}

/*
 * A stream is not supported on a Stream object.
 */
Stream.prototype.stream = function () {
    throw new Error("Cannot call .stream on a Stream object");
}
