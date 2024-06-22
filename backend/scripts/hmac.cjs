const crypto = require('crypto');

const hmacSecret = crypto.randomBytes(32).toString('hex');

console.log(hmacSecret);