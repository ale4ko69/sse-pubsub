const EventEmitter2 = require('eventemitter2');

const emitter = new EventEmitter2({
    maxListeners: 3,
    verboseMemoryLeak: true,
})

module.exports = emitter
