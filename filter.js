var wordList;
var profanityList = [];
var preserveFirst;
var filterSubstring;
var defaults = {'wordList' : 'asshole,bastard,bitch,cock,cunt,damn,fuck,piss,slut,shit,tits,whore', 'preserveFirst' : false, 'filterSubstring' : true};
var localDefaults = {'chromeSync' : true};

// Get settings
chrome.storage.local.get(localDefaults, function(local){
 if (local.chromeSync) {
  chrome.storage.sync.get(defaults, function(settings) {
    console.log('filter (sync storage)');
    filter(settings);
  });
  } else {
    chrome.storage.local.get(defaults, function(settings){
      console.log('filter (local storage)');
      filter(settings);
    });
  }
});

// When DOM is modified, remove profanity from inserted node
document.addEventListener('DOMNodeInserted', removeProfanityFromNode, false);

// Use retrieved settings and clean the document
function filter(settings) {
  wordList = settings.wordList.split(',');
  filterSubstring = settings.filterSubstring;
  preserveFirst = settings.preserveFirst;
  generateProfanityList();
  removeProfanity();
}

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
    './/text()[normalize-space(.) != ""]',
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
}

// Replace the profanity with a string of asterisks
function starReplace(strMatchingString, strFirstLetter) {
  var starString = '';
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