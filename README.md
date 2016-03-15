# Errorlets
Developers: Derek Coley, Grant Magdanz, Austin Bisharat

Errorlets is a library in pure Javascript that aims to make event driven programming simpler with support for streams and error handling.
The library supports sequential, event-based operations that may commonly produce errors. It allows for communicating with a server, gracefully handling errors in an async, event-based manner, and asynchronously reading a file from disk while handling errors appropriately.

- Proposal: https://docs.google.com/document/d/1f9NyP0QyaPp0DWdDv_708tJy-we8FWIsw9b1YF42riI/
- Tutorial: https://docs.google.com/document/d/1RG-mfuAG0UG-DF4MtX1yPyotlD9Dy2Vqh-zomR6r9RY/
- Design Doc: https://docs.google.com/document/d/1mVWaFXrAYqPPvODa06BykwZuDAMMqoszpCqiDo3kOzw/
- Poster: https://docs.google.com/presentation/d/1pfmNLMkmqx7cYZAaKnc9kAkINxQKvLbkpNHD3mIwrW0/
- Screencast:

## Usage
Lets set up an event handler on a button in the DOM with the id "target", and log Hello World! to the console.
We build a simple StateMachine and immediately call run() on it to invoke it.
```javascript
Event(“click”, document.getElementById(“target”))
	.next(function() { console.log(“Hello world!”))
	.run()
```
Now, lets demonstrate the simplicity of using a Stream object to deal with GET requests to a web server. This specific scenario gets a server name from a text-area with the id "server".
```javascript
var request = {
  type: 'GET',
  url: document.getElementById("server").value,
  headers: []
}

Begin()
  .request(request)
  .next(handleServerIsUp)
  .error(handleServerIsDown)
  .done()

function handleServerIsUp() {
    console.log("Server " + document.getElementById("server").value + " is up :)"); 
}

function handleServerIsDown() {
    console.log("Server " + document.getElementById("server").value + " is down :("); 
}
```
