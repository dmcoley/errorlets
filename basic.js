/* Basic CPS function implementations */

/*
 * Starts a Errorlets chain with f if present.
 */
function Begin(f) {
    f = f ? f : function(x) {return x}
    return f.StateMachine()
}

