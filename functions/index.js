const functions = require('firebase-functions');
const app = require('../dist/index');

exports.index = functions.https.onRequest(app);
