'use strict';

const EventEmitter = require('events');

class DomainEventBus extends EventEmitter {}

const domainEvents = new DomainEventBus();

module.exports = { domainEvents };
