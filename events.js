/*
 * Event: Support for event handling on HTML elements
 */

function Event(eventname, target) {
    if (!(this instanceof Event)) {
        // if called as function, call itself again
        // as a constructor to create new Event object
        return new Event(eventname, target)
    }
    this.eventname = eventname
    this.target = target
}

Event.prototype = new StateMachine(function(val, k) {
    var f = this
    function handler(event) {
        // register handler as part of the continuation
        f.target.removeEventListener(f.eventname,
                                   handler,
                                   false)
        k(event)
    }
    f.target.addEventListener(f.eventname, handler, false)
}, function(e, ek) { ek(e) });

