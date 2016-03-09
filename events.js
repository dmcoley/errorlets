function Event(eventname) {
    if (!(this instanceof Event)) {
        return new Event(eventname)
    }

    this.eventname = eventname
}

Event.prototype = new StateMachine(function(target, k) {
    var f = this

});
