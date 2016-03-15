/* Object files go here */

/*
 * Creates a new state machine. f is the success function and e is the error function.  
 */
function StateMachine(f, e) {
    if (!(f instanceof Function) || !(e instanceof Function)) {
        throw new Error("f and e both need to be functions.");
    }
    this.errorHandler = e;
    this.successHandler = f;
}

/*
 * Returns a state machine.
 */
StateMachine.prototype.StateMachine = function () {
    return this;
}

/*
 * Returns an error state machine. This is an internally used function, not for user's use.
 */
StateMachine.prototype.ErrorStateMachine = function() {
    return this;
}

/*
 * Creates a new state machine where this is the function to be ran before moving to the next state.
 */
Function.prototype.StateMachine = function() {
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

    return new StateMachine(success, error);
}

/*
 * Creates a new error state machine where this is a function that handles the error. Not to be used directly by the user.
 */
Function.prototype.ErrorStateMachine = function() {
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

    return new StateMachine(success, error)
}

/*
 * Chains a call to g on to the end of this. Returns a state machine. 
 */
StateMachine.prototype.next = function (g) {
    var f = this;
    g = g.StateMachine();

    var error = function(e, ek) {
        ek(e)
    }
    
    var success = function (x, k, ek) {
	f.successHandler(x,
			 function (y) { g.successHandler(y, k, ek); },
			 function(err) { g.errorHandler(err, ek); }
			)
    };
    
    return new StateMachine(success, error);
}

/*
 * Creates a state machine that will handle an error by calling h. This has no effect if there isn't an error.
 */
StateMachine.prototype.error = function(h) {
    var f = this
    h = h.ErrorStateMachine()

    var error = function(e, ek) {
        ek(e)
    }
    
    var success = function(x, k, ek) {
        f.successHandler(x, function(y) {h.successHandler(y, k)}, function(err) {h.errorHandler(err, k, ek)})
    }

    return new StateMachine(success, error);
}

/*
 * Runs an errorlets chain with x as the argument.
 */
StateMachine.prototype.run = function(x) {
    this.successHandler(x, function() {}, function(err) {throw err;})
}

/*
 * This runs an errorlets chain with x as the argument and f as a cleanup function to be ran at the very end.
 */
StateMachine.prototype.done = function(f, x) {
    /* No function passed in */
    if (arguments.length == 0) {
        this.run(x)
    } else {
        this.next(f).run(x)
    }
}

/*
 * Starts a stream on source. 
 */
StateMachine.prototype.stream = function(source) {
    if (source instanceof Array) {
	return this._stream_arr(source);
    } else if (source instanceof Function) {
        return this._stream_iter(source);
    } else {
	return this._stream_req(source);
    }
}

// internal function that creates a stream over an array
StateMachine.prototype._stream_arr = function(arr) {
    var i = 0;

    // turn the array into an iterator
    var iter = function() {
	if (i < arr.length) {
	    return arr[i++];
	} else {
	    return undefined;
	}
    }

    var f = this;
    var error = function(err, ek) {
        ek(err)
    }

    var hasCalled = false;

    resultOfPrev = null;
    var success = function (x, k, ek, id, until) {
        // we only want to call everything before the stream once
	if (!hasCalled) {
	    f.successHandler(x,
			     function (y) {
				 resultOfPrev = y;
                                 var next = iter();
                                 if (next != undefined && !until) {
                                     schedule(k, next);
                                 }
			     },
			     function (err) {
				 throw err;
			     });
	    hasCalled = true;
	} else {
            // Once we've proccessed the chain before us once, we are getting here through until's setInterval.
            // If we either reach the end of the array or have met the until condition, we want to clear in the interval.
            var next = iter();
            if (next != undefined && !until) {
	        schedule(k, next);
            } else {
                clearInterval(id)
            }
        }
    }

    return new Stream(success, error);    
}

// an internal function that creates a stream from a server
StateMachine.prototype._stream_req = function(req) {
    var f = this;
    var curPendingReq = 0;
    var totalReqMade = 0;
    
    var error = function(err, ek) {
        ek(err)
    }

    var hasCalled = false;
    var success = function (x, k, ek, id, until) {
	if (until.stop) return;
	var handleResponse = function(xhr) {
	    if (until.stop) return;
	    if (xhr.status == 200) {
                schedule(k, xhr.response, id, until);
	    } else {
		ek(xhr.status);
	    }
	}

	var handleLoadFactory = function() {
	    var curReq = totalReqMade;
	    totalReqMade++;
	    return function (xhr) {
		fireWhenTrue(function() {
		    return curPendingReq == curReq; },
			     function() {
				 curPendingReq++;
				 handleResponse(xhr);
			     });
	    }
	}
	
	if (!hasCalled) {
	    f.successHandler(x,
			     function (y) {
				 var handleLoad = handleLoadFactory();
				 buildAndSendXhr(req, handleLoad);
			     },
			     function (err) {
				 throw err;
			     });
	    hasCalled = true;
	} else if (!until.stop) {
		var handleLoad = handleLoadFactory();
		buildAndSendXhr(req, handleLoad);
        }
    
    return new Stream(success, error);
}

StateMachine.prototype._stream_iter = function(iter) {
    var f = this;
    
    var error = function(err, ek) {
        ek(err)
    }
    
    var hasCalled = false;
    var resultOfPrev = null;
    var success = function (x, k, ek, id, until) {
        // we only want to call everything before the stream once
	if (!hasCalled) {
	    f.successHandler(x,
			     function (y) {
				 resultOfPrev = y;
                                 schedule(k, iter())
			     },
			     function (err) {
				 throw err;
			     });
	    hasCalled = true;
	} else if (!until.stop) {
	    schedule(k, iter());
        }
    }
    
    return new Stream(success, error);
}


/**
Makes a single request with req and passes the result down the chain.

example request:

{
    type: 'POST',
    url: 'ignore.com',
    headers: [
	['Content-type': 'application/x-www-form-urlencoded'],
	...
    ]
    data: 'user=person&pwd=password&organization=place&requiredkey=key'
}

*/
StateMachine.prototype.request = function (req) {
    var f = this;

    var error = function(e, ek) {
        ek(e)
    }

    var success = function (x, k, ek) {
	f.successHandler(x,
			 function (y) {
				 var handleLoad = function (xhr) {
				     if (xhr.status == 200) {
					 schedule(k, xhr.response);
				     } else {
					 ek(xhr.status);
				     }
				 }
			     buildAndSendXhr(req, handleLoad);
			 },
			 function(err) { ek(err) }
			)
    };

    return new StateMachine(success, error);
}
