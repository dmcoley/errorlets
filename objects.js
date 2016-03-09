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
	f.successHandler(x, function (y) { g.successHandler(y, k, ek); }, function(err) {f.errorHandler(err, ek)})
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
