// generate-jwt-secret.js
const crypto = require('crypto');

const secret = crypto.randomBytes(64).toString('hex');
console.log('Your JWT_SECRET is:\n', secret);
