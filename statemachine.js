/* Object files go here */

function StateMachine(f, e) {
    this.errorHandler = e;
    this.successHandler = f;
}

StateMachine.prototype.StateMachine = function () {
    return this;
}

StateMachine.prototype.ErrorStateMachine = function() {
    return this;
}

// Lift into state machine
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

StateMachine.prototype.run = function(x) {
    this.successHandler(x, function() {}, function(err) {throw err;})
}

StateMachine.prototype.done = function(f, x) {
    this.next(f).run(x)
}

StateMachine.prototype.stream = function(source) {
    if (source instanceof Array) {
	return this._stream_arr(source);
    } else if (source instanceof Function) {
        return this._stream_iter(source);
    }
}

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

    // TODO: I don't think we need this? Isn't stream just going to swallow whatever value came before it?
    resultOfPreve = null;
    var success = function (x, k, ek) {
	if (!hasCalled) {
	    f.successHandler(x,
				function (y) {
				    resultOfPrev = y;
                                    var next = iter();
                                    if (next != undefined) {
                                        k(next);
                                    }
				},
				function (err) {
				    throw err;
				});
	    hasCalled = true;
	} else {
            var next = iter();
            // we only want to keep going if there is an element in the array to process
            if (next != undefined) {
	        k(next);
            }
        }
    }

    return new Stream(success, error);    
}

StateMachine.prototype._stream_req = function(source) {

}

StateMachine.prototype._stream_iter = function(iter) {
    var f = this;
    
    var error = function(err, ek) {
        ek(err)
    }

    var hasCalled = false;
    var resultOfPrev = null;
    var success = function (x, k, ek) {
	if (!hasCalled) {
	    f.successHandler(x,
				function (y) {
				    resultOfPrev = y;
                                    k(iter())
				},
				function (err) {
				    throw err;
				});
	    hasCalled = true;
	} else {
	    k(iter());
        }
    }

    return new Stream(success, error);
}
