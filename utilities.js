const utilities = {
  speak:(twiml, textToSpeak)=>{
    twiml.say(textToSpeak, {
      voice: "alice",
      language: process.env.CONTENT_LANGUAGE
    });
  },
  removeSpecialChars:(text)=>{
    return text.replace(/[^0-9a-z]/gi, '');
  }
}

module.exports = utilities;
