window.addEventListener("load", begin);

function begin() {
  // Set default values
  if (!localStorage.wordList) {
    localStorage.wordList = "asshole,bitch,cock,cunt,damn,fuck,piss,slut,shit,tits,whore";
  }
  if (!localStorage.preserveFirst) {
    localStorage.preserveFirst = "false";
  }
  if (!localStorage.filterSubstring) {
    localStorage.filterSubstring = "true";
  }

  // Handle Message Passing for localStorage
  chrome.extension.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
      if (msg.localStorage == "wordList") {
        port.postMessage({wordList: localStorage.wordList});
      } else if (msg.localStorage == "preserveFirst") {
        port.postMessage({preserveFirst: localStorage.preserveFirst});
      } else if (msg.localStorage == "filterSubstring") {
        port.postMessage({filterSubstring: localStorage.filterSubstring});
      }
    });
  });
}