var events = require('events').EventEmitter;
var oldEmit = events.emit;

events.emit = function() {
    console.log(arguments[0]);
    if( arguments.length > 1 ) console.log(arguments[1]);
    console.log();
    oldEmit.apply(events, arguments);
}
module.exports = new events();