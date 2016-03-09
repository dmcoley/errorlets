/* Basic CPS function implementations */
function Begin(f) {
    f = f ? f : function() {}
    return f.StateMachine()
}

