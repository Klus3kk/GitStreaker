const cache = new Map();

// Cache duration (for here it's 5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

setInterval(() => {
    cache.clear(); 
}, CACHE_DURATION);

module.exports = {
    has: (key) => cache.has(key),
    get: (key) => cache.get(key),
    set: (key, value) => cache.set(key, value),
};
