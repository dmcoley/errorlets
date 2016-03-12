/* Basic CPS function implementations */
function Begin(f) {
    f = f ? f : function(x) {return x}
    return f.StateMachine()
}

