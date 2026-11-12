'use strict';

const Redis = require('ioredis');
const config = require('../config.json');

let client = null;

function getRedis() {
  if (!client) {
    client = new Redis({
      host: process.env.REDIS_HOST || config.redis.host,
      port: Number(process.env.REDIS_PORT || config.redis.port),
      password: process.env.REDIS_PASSWORD || undefined,
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
      // Fail fast while disconnected instead of holding requests open.
      enableOfflineQueue: false,
    });
    // Log once per outage, not on every reconnect attempt.
    let logged = false;
    client.on('error', (err) => {
      if (!logged) console.error('[redis]', err.message);
      logged = true;
    });
    client.on('ready', () => {
      if (logged) console.log('[redis] reconnected');
      logged = false;
    });
  }
  return client;
}

/** Resolves once Redis is ready, or rejects after timeoutMs. Callers decide whether that is fatal. */
function connectRedis(timeoutMs = 5000) {
  const redis = getRedis();
  if (redis.status === 'ready') return Promise.resolve(redis);

  return new Promise((resolve, reject) => {
    const onReady = () => {
      cleanup();
      resolve(redis);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Redis not ready after ${timeoutMs}ms`));
    }, timeoutMs);
    function cleanup() {
      clearTimeout(timer);
      redis.off('ready', onReady);
    }
    redis.on('ready', onReady);
  });
}

module.exports = {
  getRedis,
  connectRedis,
};
