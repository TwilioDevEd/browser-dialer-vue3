'use strict';

const http = require('http');
const express = require('express');
const { urlencoded } = require('body-parser');
const twilio = require('twilio');
const dotenv = require('dotenv');

const VoiceResponse = require("twilio").twiml.VoiceResponse;
const AccessToken = require("twilio").jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

let app = express();
app.use(express.static(__dirname + '/public'));
app.use(urlencoded({ extended: false }));

require('dotenv').config();

app.get('/', (request, response) => {
    response.send('Hello world')

})

// Generate a Twilio Access token
app.get('/token', (request, response) => {

    const accessToken = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET
    );
    const grant = new VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
      incomingAllow: true,
    });
    accessToken.addGrant(grant);
  
    // Include identity and token in a JSON response
    response.send({
      token: accessToken.toJwt(),
    });

})


// Create TwiML for outbound calls
app.post('/voice', (request, response) => {
  const voiceResponse = new VoiceResponse();
  voiceResponse.dial({
    callerId: process.env.TWILIO_NUMBER,
  }, request.body.number);

  response.type('text/xml');
  response.send(voiceResponse.toString());
});

let server = http.createServer(app);
let port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Express Server listening on *:${port}`);
});

module.exports = app;
