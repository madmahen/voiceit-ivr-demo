# voiceit-ivr-demo
A NodeJS and Twilio Based IVR Demo, showing an integration example between VoiceIt and twilio APIs

## Pre-Requisites

- Twilio Account
-- [Twilio Developer Registration](https://www.twilio.com/try-twilio)
- VoiceIt Account
-- [VoiceIt Developer Registration](https://siv.voiceprintportal.com/getDeveloperIDTile.jsp)
- Heroku Account for hosting app
-- [Heroku Developer Registration](https://signup.heroku.com)

## One Click Install - Heroku

This will install the application and all the dependencies on Heroku (login required) for you. As part of the installation, the Heroku app will walk you through configuration of environment variables.  Please click on the following button to deploy the application.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)


After installation you also need to log in to your twilio account and point a purchased phone number to this new application like shown below.

<img src="/PointTwilioNumber.png" alt="API Key and Token" width="400px" />

You can now call the twilio number you have pointed to the application and try out the demo, and modify it as desired for your own use case.

## Manual Install

### Install
`npm install`

### Configure

1. Set the environment variable `VOICEIT_DEVELOPER_ID` to your VoiceIt DeveloperId and `VOICEPRINT_PHRASE` to a phrase that you have pre - approved in your VoiceIt console and `CONTENT_LANGUAGE` to associated contentLanguage
2. `npm start`
3. Point a Twilio Phone number to VoiceURL to your `http://app-name-here/incoming_call`

### Deploy to Heroku

    $ heroku create
    $ git push heroku master
    $ heroku config:set VOICEIT_DEVELOPER_ID=123456abcdef123456 VOICEPRINT_PHRASE='Never forget tomorrow is a new day' CONTENT_LANGUAGE=en-US
