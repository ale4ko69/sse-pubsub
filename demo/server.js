'use strict';

const express = require('express');
const cookieParser = require('cookie-parser')
const SSEChannel = require('../components/sse-channel.js');
const emitter = require('../components/eventEmitter.js');
const PORT = process.env.PORT || 8080;
const app = express();

app.use(cookieParser())

// Serve the static part of the demo
app.use(express.static(`${__dirname}/public`));

// SSE connection End point API
app.get('/sse', (req, res, next) => {

	const { token } = req.cookies

	//---- NEW

	// Create new SSE Channel
	let sseChannel = new SSEChannel({startId: 1000, pingInterval: 5000})

	console.log(`Connection /sse opened. Channel is ${sseChannel.active ? 'active' : 'not active'}`);

	sseChannel.subscribe(req, res, "", {emitter});

	emitter.on('mymessage', () => {
		sseChannel.publish('New Event', 'my-message')
	})

});

// End point API - Push Message to all subscribed clients
app.get('/push', (req, res, next) => {
	const message = req.query.message;
	const { token } = req.cookies


	emitter.emit('message', { message })

	emitter.emit('mymessage')


	res.send({
		'message': message,
		'token': token
	});
});

// Return a 404 if no routes match
app.use((req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  res.status(404).end('Not found');
});

app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});
