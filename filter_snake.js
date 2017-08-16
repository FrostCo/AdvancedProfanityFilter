var defaults = {'wordList': 'asshole,bastard,bitch,cunt,damn,fuck,piss,slut,shit,tits,whore', 'preserveFirst': false, 'filterSubstring': true, 'showCounter': true};
var settings = {};

function cleanPage() {
  chrome.storage.sync.get(defaults, function(storage) {
    // Load settings and setup environment
    settings.wordList = storage.wordList.split(',');
    settings.filterSubstring = storage.filterSubstring;
    settings.preserveFirst = storage.preserveFirst;
    settings.showCounter = storage.showCounter;
    settings.counter = 0;
    settings.wordRegExps = [];
    generateRegexpList();

    // Start cleaning the page
    walkAndObserve(document);
  });
}

// Build a RegExp for each word in the wordList
function generateRegexpList() {
  var wordList = settings.wordList;
  if (settings.filterSubstring) {
    for (var x = 0; x < wordList.length; x++) {
      settings.wordRegExps.push(new RegExp('(' + wordList[x][0] + ')' + wordList[x].substring(1), 'gi' ));
    }
  } else {
    for (var x = 0; x < wordList.length; x++) {
      settings.wordRegExps.push(new RegExp('\\b(' + wordList[x][0] + ')' + wordList[x].substring(1) + '\\b', 'gi' ));
    }
  }
}

function handleText(textNode) {
  textNode.nodeValue = replaceText(textNode.nodeValue);
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

// The callback used for the document body and title observers
function observerCallback(mutations) {
  var i, node;

  mutations.forEach(function(mutation) {
    for (i = 0; i < mutation.addedNodes.length; i++) {
      node = mutation.addedNodes[i];
      if (isForbiddenNode(node)) {
        // Should never operate on user-editable content
        continue;
      } else if (node.nodeType === 3) {
        // Replace the text for text nodes
        handleText(node);
      } else {
        // Otherwise, find text nodes within the given node and replace text
        walk(node);
      }
    }
  });

  updateCounterBadge();
}

function replaceText(str) {
  for (var z = 0; z < settings.wordList.length; z++) {
    str = str.replace(settings.wordRegExps[z], starReplace);
  }

  return str;
}

// Replace the profanity with a string of asterisks
// Only gets run when there is a match in replaceText()
function starReplace(strMatchingString, strFirstLetter) {
  var starString = '';

  if (!settings.preserveFirst) {
    for (var i = 0; i < strMatchingString.length; i++) {
      starString = starString + '*';
    }
  } else {
    starString = strFirstLetter;
    for (var i = 1; i < strMatchingString.length; i++) {
      starString = starString + '*';
    }
  }

  settings.counter++;
  return starString;
}

// Updates the counter and displays it if enabled
function updateCounterBadge() {
  if (settings.showCounter) {
    chrome.runtime.sendMessage({counter: settings.counter.toString()});
  }
}

function walk(rootNode) {
  // Find all the text nodes in rootNode
  var walker = document.createTreeWalker(
    rootNode,
    NodeFilter.SHOW_TEXT,
    null,
    false
  ),
  node;

  // Modify each text node's value
  while (node = walker.nextNode()) {
    handleText(node);
  }
}

// Walk the doc (document) body, replace the title, and observe the body and title
function walkAndObserve(doc) {
  var docTitle = doc.getElementsByTagName('title')[0],
  observerConfig = {
    characterData: true,
    childList: true,
    subtree: true
  },
  bodyObserver, titleObserver;

  // Do the initial text replacements in the document body and title
  walk(doc.body);
  doc.title = replaceText(doc.title);
  updateCounterBadge();

  // Observe the body so that we replace text in any added/modified nodes
  bodyObserver = new MutationObserver(observerCallback);
  bodyObserver.observe(doc.body, observerConfig);

  // Observe the title so we can handle any modifications there
  if (docTitle) {
    titleObserver = new MutationObserver(observerCallback);
    titleObserver.observe(docTitle, observerConfig);
  }
}

cleanPage();
