'use strict';

var Promise = require('bluebird');
var google_auth = require('../lib/google_auth');


function main() {
  Promise.resolve().then(function() {
    return google_auth.verifyAuthorization();

  }).then(function(oauth2Client) {
    // TODO: Get event list
    // TODO: Aggregate a sum of event minute
  });
}


if (require.main === module) {
  Promise.resolve().then(function() {
    return main();

  }).catch(function(err) {
    console.error(err);
  });
}
