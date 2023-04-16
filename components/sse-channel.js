const generateUniqueId = require('./generate-id.js');

function hasEventMatch(subscriptionList, eventName) {
	return !subscriptionList || subscriptionList.some(pat => pat instanceof RegExp ? pat.test(eventName) : pat === eventName);
}

const noop = () => {}

module.exports = class SSEChannel {

	constructor(options) {
		this.self = this
		this.options = Object.assign({}, {
			uuid: generateUniqueId({uuid: true}),
			pingInterval: 3000,
			maxStreamDuration: 30_000,
			clientRetryInterval: 1000,
			startId: 1,
			historySize: 100,
			rewind: 0
		}, options);

		this.nextID 	 = this.options.startId;
		this.clients 	 = new Set();
		this.messages 	 = [];
		this.active 	 = true;

		if (this.options.pingInterval) {
			this.pingTimer = setInterval(() => this.publish(), this.options.pingInterval);
		}
	}

	publish(data, eventName) {
		if (!this.active) throw new Error('Channel closed');

		let output;
		let id;

		// No need to create a ping entry if there are no clients connected
		if (!data && !eventName) {
			if (!this.clients.size) return;
			output = "data: \n\n";
		}
		else {
			id = this.nextID++;

			if (typeof data === "object") data = JSON.stringify(data);

			data = data ? data.split(/[\r\n]+/).map(str => `data: ${str}`).join('\n') : '';

			output = (
				`id: ${id}\n` +
				(eventName ? `event: ${eventName}\n` : "") +
				(data || "data: ") + '\n\n'
			);

			this.messages.push({ id, eventName, output });
		}

		[...this.clients].filter(c => !eventName || hasEventMatch(c.events, eventName)).forEach(c => c.res.write(output));

		while (this.messages.length > this.options.historySize) {
			this.messages.shift();
		}

		return id;
	}

	subscribe(req, res, events, params = {}) {

		if (!this.active) throw new Error('Channel closed');
		if (!this.id) this.id

		const c = {req, res, events, params};
		const { emitter } = params

		if (emitter) {

			const { _events } = emitter;

			// TODO Check if this specific Handler exists
			const cb = this.emitHandler.bind(this);
			cb.context  = this;
			// Callback
			// If Emitter hasn't subscribe on this event, do it now.
			if (('message' in _events)) {

				const isArr = Array.isArray(_events.message);
				const isFn = (Object.prototype.toString.call(_events.message) === '[object Function]');

				if(isArr){
					emitter._events.message = _events.message.filter((_cb) => {
						return _cb.context?.options.uuid === cb.context?.options.uuid
					})
				}


				if (isArr && !_events.message.find((_cb) => {
					const isExistsCb = _cb.context?.options.uuid === cb.context?.options.uuid
					return isExistsCb
				}
				)){
					emitter.on('message', cb)
				}
				else if (isFn && _events.message.context?.options.uuid !== cb.context?.options.uuid) {
					emitter.on('message', cb)
				}
			}
			else {
				emitter.on('message', cb)
			}
		}

		c.req.socket.setNoDelay(true);

		c.res.writeHead(200, {
			"Content-Type": "text/event-stream",
			"Cache-Control": `s-maxage=${Math.floor(this.options.maxStreamDuration / 1000) - 1}, max-age=0, stale-while-revalidate=0, stale-if-error=0`,
			"Connection": "keep-alive"
		});

		let body 	 = `retry: ${this.options.clientRetryInterval}\n\n`;
		const lastID = Number.parseInt(req.headers['last-event-id'], 10);
		const rewind = Number.isNaN(lastID) ? this.options.rewind : ((this.nextID - 1) - lastID);

		if (rewind) {
			this.messages.filter(m => hasEventMatch(c.events, m.eventName)).slice(0 - rewind).forEach(m => {
				body += m.output
			});
		}

		c.res.write(body);

		this.clients.add(c);

		setTimeout(() => {
			if (!c.res.finished) {
				this.unsubscribe(c);
			}
		}, this.options.maxStreamDuration);

		c.res.on('close', () => this.unsubscribe(c));
		return c;
	}

	unsubscribe(c) {
		//TODO Remove closed client from list of connected clients by Client id
		//TODO Remove all callbacks from all Events Emitter by Client id

		c.res.end();
		this.clients.delete(c);
	}

	close() {
		this.clients.forEach(c => c.res.end());
		this.clients = new Set();
		this.messages = [];
		if (this.pingTimer) clearInterval(this.pingTimer);
		this.active = false;
	}

	listClients() {
		const rollupByIP = {};

		this.clients.forEach(c => {
			const ip = c.req.connection.remoteAddress;
			if (!(ip in rollupByIP)) {
				rollupByIP[ip] = 0;
			}
			rollupByIP[ip]++;
		});
		return rollupByIP;
	}

	// Emitter Handler
	emitHandler (data, event){
		const dataPayload = data;
		this.publish(dataPayload, 'uichange')
	}

	getClientParams() {
		return this.clients.params;
	}

	getChannelOption() {
		return this.options;
	}

	getSubscriberCount() {
		return this.clients.size;
	}
};

