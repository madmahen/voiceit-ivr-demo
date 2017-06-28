
const config = require('./config');
const utilities = require('./utilities');

//Intiailize Twilio Stuff
const twilio = require('twilio');
const VoiceResponse = twilio.twiml.VoiceResponse;

//Initialize VoiceIt Stuff
const myVoiceIt = require('VoiceIt');
myVoiceIt.initialize(config.voiceItDeveloperId);
var numTries = 0;

const bodyParser = require('body-parser');
const express = require('express');
const app = express();
app.use(bodyParser());

// Prepare the Express server and body parsing middleware.
const port = process.env.PORT || 1337;

const callerCredentials = (body)=> {
  // Twilio's `body.From` is the caller's phone number, so let's use it as
  // identifier in the VoiceIt profile. It also means, the authentication is
  // bound only to this phone number.
  return {
    number: body.From,
    userId: utilities.removeSpecialChars(body.From),
    password: body.From
  };
};

// Accept Incoming Calls
// ---------------------
// We need to accept incoming calls from Twilio. The fully-qualified URL should
// be added to your Twilio account and publicly available.
app.post('/incoming_call', function(req, res) {
  const caller = callerCredentials(req.body);
  const twiml = new VoiceResponse();

  myVoiceIt.getUser({
	userId: caller.userId,
	password: caller.password,
	callback: function(getUserResponse){
    console.log("The Server Responded with the JSON: ",getUserResponse);
    getUserResponse = JSON.parse(getUserResponse);

    if (getUserResponse.ResponseCode === "SUC") {

      // Greet the caller when their account profile is recognized by the VoiceIt API.
      utilities.speak(twiml, "Welcome back to the Voice It Voice Authentication Demo, your phone number has been recognized");

      // Let's provide the caller with an opportunity to enroll by typing `1` on
      // their phone's keypad.

      // Use the <Gather> verb to collect user input
      const gather = twiml.gather({
        action: '/enroll_or_authenticate',
        numDigits: 1,
        timeout: 5
      });

      utilities.speak(gather, "You may now log in, or press one to re enroll");

      twiml.redirect('/enroll_or_authenticate?digits=TIMEOUT');

      res.type('text/xml');
      res.send(twiml.toString());
    } else {

      myVoiceIt.createUser({
        userId: caller.userId,
        password: caller.password,
        callback: function(createUserResponse){
          console.log("The Server Responded with the JSON: ",createUserResponse);
          createUserResponse = JSON.parse(createUserResponse);
          utilities.speak(twiml, "Welcome to the Voice It Voice Authentication Demo, you are a new user and will now be enrolled");
          twiml.redirect('/enroll');
          res.type('text/xml');
          res.send(twiml.toString());
        }
      });

    }
	}});
});


// Routing Enrollments & Authentication
// ------------------------------------
// We need a route to help determine what the caller intends to do.
app.post('/enroll_or_authenticate', function(req, res) {
  const digits = req.body.Digits;
  const caller = callerCredentials(req.body);
  const twiml = new VoiceResponse();
  // When the caller asked to enroll by pressing `1`, provide friendly
  // instructions, otherwise, we always assume their intent is to authenticate.
  if (digits == 1) {
    //Delete User and re-create user to remove pre enrollments
    myVoiceIt.deleteUser({
      userId: caller.userId,
      password: caller.password,
      callback: function(deleteUserResponse) {
        console.log("Delete User Responded with the JSON: ", deleteUserResponse);
        myVoiceIt.createUser({
          userId: caller.userId,
          password: caller.password,
          callback: function(createUserResponse) {
            console.log("Create User Responded with the JSON: ", createUserResponse);
            utilities.speak(twiml, "You have chosen to create a new account with your Voice, you will now be asked to say a phrase three times, then you will be able to log in with that phrase");
            twiml.redirect('/enroll');
            res.type('text/xml');
            res.send(twiml.toString());
          }
        });

      }
    });

  } else {
    //Check for number of enrollments > 2
    myVoiceIt.getEnrollmentsCount({
      userId: caller.userId,
      password: caller.password,
      phrase: config.chosenVoicePrintPhrase,
      callback: function(getEnrollmentsCountResponse) {
        console.log("The Server Responded with the JSON: ", getEnrollmentsCountResponse);
        const enrollmentsCount = JSON.parse(getEnrollmentsCountResponse).Result;
        if(enrollmentsCount > 2){
          twiml.redirect('/authenticate');
          res.type('text/xml');
          res.send(twiml.toString());
        }
        else{
          twiml.redirect('/enroll?enrollCount=' + enrollmentsCount);
          res.type('text/xml');
          res.send(twiml.toString());
        }
      }
    });
  }
});

// Enrollment Recording
app.post('/enroll', function(req, res) {
  const enrollCount = req.query.enrollCount || 0;
  const twiml = new VoiceResponse();
  utilities.speak(twiml, 'Please say the following phrase to enroll ');
  utilities.speak(twiml, config.chosenVoicePrintPhrase, config.contentLanguage);

  twiml.record({
    action: '/process_enrollment?enrollCount=' + enrollCount,
    maxLength: 5,
    trim: 'do-not-trim'
  });
  res.type('text/xml');
  res.send(twiml.toString());
});

// Process Enrollment
app.post('/process_enrollment', function(req, res) {
  const caller = callerCredentials(req.body);
  var enrollCount = req.query.enrollCount;
  const recordingURL = req.body.RecordingUrl + ".wav";
  const twiml = new VoiceResponse();

  function enroll200Logic(body){
      body = JSON.stringify(body);
      enrollCount++;
      // VoiceIt requires at least 3 successful enrollments.
      if (enrollCount > 2) {
        utilities.speak(twiml, 'Thank you, recording received, you are now enrolled and ready to log in');
        twiml.redirect('/authenticate');
      } else {
        utilities.speak(twiml, 'Thank you, recording received, you will now be asked to record your phrase again');
        twiml.redirect('/enroll?enrollCount=' + enrollCount);
      }
  }

    function enrollAgainLogic(body){
      body = JSON.stringify(body);
      utilities.speak(twiml, 'Your recording was not successful, please try again');
      twiml.redirect('/enroll?enrollCount=' + enrollCount);
    }

    myVoiceIt.createEnrollmentByWavURL({
      userId: caller.userId,
      password: caller.password,
  	  urlToEnrollmentWav: recordingURL,
  	  contentLanguage: config.contentLanguage,
  	callback: function(enrollmentResponse){
        console.log("The Response Was ",enrollmentResponse);
        enrollmentResponse = JSON.parse(enrollmentResponse);
        if ( enrollmentResponse.ResponseCode === "SUC" ) {
          enroll200Logic(enrollmentResponse);
        } else if( enrollmentResponse.ResponseCode === "FNE" ){
        myVoiceIt.createEnrollmentByWavURL({
          userId: caller.userId,
          password: caller.password,
          urlToEnrollmentWav: recordingURL,
          contentLanguage: config.contentLanguage,
          callback: function(enrollmentResponse2){
            enrollmentResponse2 = JSON.parse(enrollmentResponse2);
            if ( enrollmentResponse2.ResponseCode === "SUC" ) {
              enroll200Logic(enrollmentResponse2);
            }else{
              enrollAgainLogic(enrollmentResponse2);
            }
          }
        });
      }
      else {
        enrollAgainLogic(enrollmentResponse);
      }
      res.type('text/xml');
      res.send(twiml.toString());
    	}
  });

});

// Authentication Recording
app.post('/authenticate', function(req, res) {

  var twiml = new VoiceResponse();

  utilities.speak(twiml, 'Please say the following phrase to authenticate ');
  utilities.speak(twiml, config.chosenVoicePrintPhrase, config.contentLanguage);

  twiml.record({
    action: '/process_authentication',
    maxLength: '5',
    trim: 'do-not-trim',
  });
  res.type('text/xml');
  res.send(twiml.toString());
});

// Process Authentication
app.post('/process_authentication', function(req, res) {
  const caller = callerCredentials(req.body);
  const recordingURL = req.body.RecordingUrl + '.wav';
  const twiml = new VoiceResponse();

  myVoiceIt.authenticationByWavURL({
    userId: caller.userId,
    password: caller.password,
  	urlToAuthenticationWav: recordingURL,
  	contentLanguage: config.contentLanguage,
  	callback: function(authResponse){
      console.log("The Response Was ",authResponse);
      authResponse = JSON.parse(authResponse);

      if (authResponse.ResponseCode === "ATF" || authResponse.ResponseCode === "SUC"){
        auth200Logic(twiml,authResponse);
        res.send(twiml.toString());
      }
      else if(authResponse.ResponseCode == "FNE"){
          myVoiceIt.authenticationByWavURL({
          userId: caller.userId,
          password: caller.password,
          urlToAuthenticationWav: recordingURL,
          contentLanguage: config.contentLanguage,
          callback: function(authResponse2){
              console.log("The Response Was ",authResponse2);
              var theResult = JSON.parse(authResponse2);
              if(theResult.ResponseCode === "SUC" || theResult.ResponseCode === "ATF" ){
                  auth200Logic(twiml,theResult);
                  res.send(twiml.toString());
              } else{
                  authNot200Logic(twiml,theResult);
                  res.send(twiml.toString());
              }
          }
          });
      }
      else{
        authNot200Logic(twiml,authResponse);
        res.type('text/xml');
        res.send(twiml.toString());
      }

  	}
  });

  function auth200Logic(twiml,voiceIt){
    if (voiceIt.ResponseCode == "SUC") {
      console.log("Authentication successful logic");
      utilities.speak(twiml, voiceIt.Result);
      //Thank them for calling
      utilities.speak(twiml,'Thank you for calling voice its voice biometrics demo. Have a good day!');
      //Hang up
    } else if (numTries > 2) {
      //3 attempts failed
      utilities.speak(twiml,'Authentications failed. We suggest you call back and select option 1 to re enroll and authenticate again.');
    } else {

      if(voiceIt.ResponseCode == "STTF"){
        utilities.speak(twiml,"Authentication failed, it seems like you did not say ");
        utilities.speak(twiml,config.chosenVoicePrintPhrase, config.contentLanguage);
        utilities.speak(twiml," please say the right phrase and try again");
        numTries = numTries + 1;
        twiml.redirect('/authenticate');
      }
      else if (voiceIt.ResponseCode == 'ATF') {
        console.log("Authentication failed logic");
        utilities.speak(twiml,"Your authentication did not pass, please try again.");
        numTries = numTries + 1;
        twiml.redirect('/authenticate');
      }
      else {
        console.log("non Authentication logic");
        utilities.speak(twiml, voiceIt.Result);
        numTries = numTries + 1;
        twiml.redirect('/authenticate');
      }
    }
  }

  function authNot200Logic(twiml,voiceIt){
    switch (voiceIt.ResponseCode) {
    case "VPND":
        utilities.speak(twiml,"Voiceprint Phrase not detected. Please make sure to speak in your normal speed and tone.");
        break;
    default:
        utilities.speak(twiml,"API Error, Your authentication did not pass, please try again.");
      }
      numTries = numTries + 1;
      twiml.redirect('/authenticate');
  }

});

app.listen(port);
console.log('Running bioauthentication on port ' + port);
