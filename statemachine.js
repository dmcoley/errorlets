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

function schedule(f, x) {
    setTimeout(function() { f(x); }, 0);
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

StateMachine.prototype.stream = function(source) {
    if (source instanceof Array) {
	this._stream_arr(source);
    }
}

StateMachine.prototype._stream_arr = function(arr) {
    var i = 0;
    var iter = function() {
	if (i < arr.length) {
	    return arr[i++];
	} else {
	    return undefined;
	}
    }
    return this._stream_iter(iter);
}

StateMachine.prototype._stream_req = function(source) {

}

StateMachine.prototype._stream_iter = function(iter) {
    var f = this;
    
    var error = null;

    var hasCalled = false;
    var resultOfPrev = null;
    var success = function (x, k, ek) {
	if (!hasCalled) {
	    self.successHandler(x,
				function (y) {
				    resultOfPrev = y;
				},
				function (err) {
				    throw err;
				});
	    hasCalled = true;
	}
	k(iter());
    }
    return new Stream(success, error);
}

function Stream(successHandler, errorHandler) {
    this.successHandler = successHandler;
    this.errorHandler = errorHandler;
}

Stream.prototype = new StateMachine();
Stream.prototype.constructor = Stream;

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
}

Stream.prototype.stream = function () {
    throw new Error("Cannot call .stream on a stream object");
}
