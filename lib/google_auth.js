'use strict';

/**
 * Refer: https://developers.google.com/google-apps/calendar/quickstart/nodejs
 */

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

var HOME = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

var TOKEN_DIR = path.join(HOME, '.credentials');
var TOKEN_PATH = path.join(TOKEN_DIR, 'calendar-nodejs-quickstart.json');
var DEFAULT_TOKEN_PATH = 'quickstart';
var TOKEN_FILE_PREFIX = 'calendar-nodejs';

var CLIENT_SECRET_PATH = path.join(TOKEN_DIR, 'client_secret.json');


function verifyAuthorization() {
  return fs.readFileAsync(CLIENT_SECRET_PATH).then(function(content) {
    return authorize(JSON.parse(content));

  }).catch(function(err) {
    err.message = `Error loading client secret file: ${err.message}`;
    throw err;
  });
}

function authorize(credentials) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  return new Promise(function(resolve, reject) {
    fs.readFileAsync(TOKEN_PATH).then(function(token) {
      oauth2Client.credentials = JSON.parse(token);
      resolve(oauth2Client);

    }).catch(function(err) {
      return getNewToken(oauth2Client).then(function(oauth2Client) {
        resolve(oauth2Client);

      }).catch(function(err) {
        reject(err);
      });
    });
  });
}

function getNewToken(oauth2Client) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });

  console.log('Authorize this app by visiting this url: ', authUrl);

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(function(resolve, reject) {
    rl.question('Enter the code from that page here: ', function(code) {
      rl.close();

      oauth2Client.getToken(code, function(err, token) {
        if (err) {
          err.message = `Error while trying to retrieve access token. ${err.message}`;
          reject(err);

        } else {
          oauth2Client.credentials = token;

          storeToken(token).then(function() {
            resolve(oauth2Client);
          });
        }
      });
    });
  });
}

function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }

  var tokenPath = generateDefaultTokenPath();

  return fs.writeFileAsync(tokenPath, JSON.stringify(token)).then(function() {
    console.log(`Token stored to ${tokenPath}`);
  });
}

function generateDefaultTokenPath() {
  return generateTokenPath(DEFAULT_TOKEN_PATH);
}

function generateTokenPath(key) {
  var fileName = generateTokenFileName(key);
  return path.join(TOKEN_DIR, fileName);
}

function generateTokenFileName(key) {
  return `${TOKEN_FILE_PREFIX}-${key}.json`;
}


function listEvents(auth) {
  var calendar = google.calendar('v3');

  var params = {
    auth: auth,
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  };

  return new Promise(function(resolve, reject) {
    calendar.events.list(params, function(err, response) {
      if (err) reject(err);
      else resolve(response);
    });
  });
}


// Dev Code
if (require.main === module) {
  Promise.resolve().then(function() {
    return verifyAuthorization();

  }).then(function(oauth2Client) {
    return listEvents(oauth2Client).then(function(response) {
      console.log(JSON.stringify(response, null, 2));
    });

  }).catch(function(err) {
    console.error(err);
  });
}

