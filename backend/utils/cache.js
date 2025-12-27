const logger = require('./logger');

class Cache {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlSeconds = 300) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
    logger.debug(`Cache: stored key "${key}" with ${ttlSeconds}s TTL`);
  }

  get(key) {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      logger.debug(`Cache: key "${key}" expired, deleted`);
      return null;
    }

    logger.debug(`Cache: retrieved key "${key}"`);
    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.store.clear();
    logger.debug('Cache: cleared all entries');
  }

  delete(key) {
    this.store.delete(key);
  }
}

module.exports = new Cache();
