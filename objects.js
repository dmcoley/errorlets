/* Object files go here */

function StateMachine(f) {
    this.errorHandler = null;
    this.successHandler = f;
}

StateMachine.prototype.StateMachine = function () {
    return this;
}

// Lift into state machine
Function.prototype.StateMachine = function() {
    var f = this; // the function

    return new StateMachine(function(x, k) {
	var res = f(x);
	schedule(k, res);
    });
}

function schedule(f, x) {
    setTimeout(function() { f(x); }, 0);
}

StateMachine.prototype.next = function (g) {
    var f = this;
    g = g.StateMachine();

    return new StateMachine(function (x, k) {
	f.successHandler(x, function (y) {
	    g.successHandler(y, k);
	});
    });
}

StateMachine.prototype.run = function(x) {
    this.successHandler(x, function() {})
}
