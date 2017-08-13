var wordList, preserveFirst, filterSubstring, showCounter;
var profanityList = [];
var defaults = {'wordList': 'asshole,bastard,bitch,cunt,damn,fuck,piss,slut,shit,tits,whore', 'preserveFirst': false, 'filterSubstring': true, 'showCounter': true};
var counter = 0;

function checkForProfanity(mutation) {
  mutation.addedNodes.forEach(function(node) {
    if (!isForbiddenNode(node)) {
      removeProfanityFromNode(node);
    }
  });
}

function cleanPage() {
  loadSettings();

  var observerConfig = {
    childList: true,
    subtree: true
  };

  // When DOM is modified, remove profanity from inserted node
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      checkForProfanity(mutation);
    });
  });

  var targetNode = document;
  observer.observe(targetNode, observerConfig);
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

// Returns true if a node should *not* be altered in any way
// Credit: https://github.com/ericwbailey/millennials-to-snake-people/blob/master/Source/content_script.js
function isForbiddenNode(node) {
  return node.isContentEditable || // DraftJS and many others
  (node.parentNode && node.parentNode.isContentEditable) || // Special case for Gmail
  (node.tagName && (node.tagName.toLowerCase() == "textarea" || // Some catch-alls
                    node.tagName.toLowerCase() == "input" ||
                    node.tagName.toLowerCase() == "script" ||
                    node.tagName.toLowerCase() == "style")
  );
}

// Get settings and run filter
function loadSettings() {
  chrome.storage.sync.get(defaults, function(settings) {
    wordList = settings.wordList.split(',');
    filterSubstring = settings.filterSubstring;
    preserveFirst = settings.preserveFirst;
    showCounter = settings.showCounter;
    generateProfanityList();
    removeProfanity();
    if (counter > 0 && showCounter){chrome.runtime.sendMessage({counter: counter.toString()});}
  });
}

// Remove the profanity from the document
function removeProfanity() {
  var evalResult = document.evaluate(
    '//*[not(self::script or self::style)]/text()[normalize-space(.) != ""]',
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
function removeProfanityFromNode(node) {
  var evalResult = document.evaluate(
    './/*[not(self::script or self::style)]/text()[normalize-space(.) != ""]',
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

cleanPage();
