const utilities = {
  speak:(twiml, textToSpeak)=>{
    twiml.say(textToSpeak, {
      voice: "alice"
    });
  }
}

module.exports = utilities;
