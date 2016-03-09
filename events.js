/*
 * Event: Support for event handling on HTML elements
 */

function Event(eventname) {
    if (!(this instanceof Event)) {
        // if called as function, call itself again
        // as a constructor to create new Event object
        return new Event(eventname)
    }
    this.eventname = eventname
}

Event.prototype = new StateMachine(function(target, k) {
    var f = this
    function handler(event) {
        // register handler as part of the continuation
        target.removeEventListener(f.eventname,
                                   handler,
                                   false)
        k(event)
    }
    target.addEventListener(f.eventname, handler, false)
}, function(e, ek) { ek(e) });


