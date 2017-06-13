# voiceit-ivr-demo
A NodeJS and Twilio Based IVR Demo, showing an integration example between VoiceIt and twilio APIs

## Pre-Requisites

- Twilio Account
-- [Twilio Developer Registration](https://www.twilio.com/try-twilio)
- VoiceIt Account
-- [VoiceIt Developer Registration](https://siv.voiceprintportal.com/getDeveloperIDTile.jsp)
- Heroku Account for hosting app
-- [Heroku Developer Registration](https://signup.heroku.com)

## Install:

npm install

## Configure

1. Set the environment variable `VOICEIT_DEVELOPER_ID` to your VoiceIt DeveloperId and `VOICEPRINT_PHRASE` to a phrase that you have pre - approved in your VoiceIt console
2. `npm start`
3. Point a Twilio Phone number to VoiceURL to your `http://app-name-here/incoming_call`

## Deploy to Heroku

    $ heroku create
    $ git push heroku master
    $ heroku config:set VOICEIT_DEVELOPER_ID=123456abcdef123456 VOICEPRINT_PHRASE='Never forget tomorrow is a new day'
