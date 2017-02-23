var wordList, preserveFirst, filterSubstring, showCounter;
var profanityList = [];
var defaults = {'wordList': 'asshole,bastard,bitch,cunt,damn,fuck,piss,slut,shit,tits,whore', 'preserveFirst': false, 'filterSubstring': true, 'showCounter': true};
var counter = 0;

// Get settings and run filter
chrome.storage.sync.get(defaults, function(settings) {
  wordList = settings.wordList.split(',');
  filterSubstring = settings.filterSubstring;
  preserveFirst = settings.preserveFirst;
  showCounter = settings.showCounter;
  generateProfanityList();
  removeProfanity();
  if (counter > 0 && showCounter){chrome.runtime.sendMessage({counter: counter.toString()});}
});

// When DOM is modified, remove profanity from inserted node
document.addEventListener('DOMNodeInserted', removeProfanityFromNode, false);

// Parse the profanity list
function generateProfanityList() {
  if (filterSubstring) {
    for (var x = 0; x < wordList.length; x++) {
      profanityList.push(new RegExp('(' + wordList[x][0] + ')' + wordList[x].substring(1), 'gi' ));
    }
  } else {
    for (var x = 0; x < wordList.length; x++) {
      profanityList.push(new RegExp('\\b(' + wordList[x][0] + ')' + wordList[x].substring(1) + '\\b', 'gi' ));
    }
  }
}

// Remove the profanity from the document
function removeProfanity() {
  var evalResult = document.evaluate(
    '//body//text()[normalize-space(.) != ""]',
    document,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  for (var i = 0; i < evalResult.snapshotLength; i++) {
    var textNode = evalResult.snapshotItem(i);
    for (var z = 0; z < profanityList.length; z++) {
      textNode.data = textNode.data.replace(profanityList[z], starReplace);
    }
  }
}

// Remove the profanity from the node
function removeProfanityFromNode(event) {
  var node = event.target;

  var evalResult = document.evaluate(
    './/text()[normalize-space(.) != ""]',
    node,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  for (var i = 0; i < evalResult.snapshotLength; i++) {
    var textNode = evalResult.snapshotItem(i);
    for (var z = 0; z < profanityList.length; z++) {
      textNode.data = textNode.data.replace(profanityList[z], starReplace);
    }
  }
  if (counter > 0 && showCounter){chrome.runtime.sendMessage({counter: counter.toString()});}
}

// Replace the profanity with a string of asterisks
function starReplace(strMatchingString, strFirstLetter) {
  var starString = '';
  counter++;

  if (!preserveFirst) {
    for (var i = 0; i < strMatchingString.length; i++) {
      starString = starString + '*';
    }
  } else {
    starString = strFirstLetter;
    for (var i = 1; i < strMatchingString.length; i++) {
      starString = starString + '*';
    }
  }

  return starString;
}
