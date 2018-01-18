var counter = 0;
var defaults = {
  'disabledDomains': [],
  'filterSubstring': true,
  'preserveFirst': false,
  'showCounter': true,
  'words': {
    "asshole": ["butthole", "jerk"],
    "bastard": ["imperfect", "impure"],
    "bitch": ["jerk"],
    "cunt": ["explative"],
    "damn": ["dang", "darn"],
    "fuck": ["freak", "fudge"],
    "piss": ["pee"],
    "pissed": ["ticked"],
    "slut": ["imperfect", "impure"],
    "shit": ["crap", "crud", "poop"],
    "tits": ["explative"],
    "whore": ["harlot", "tramp"]
  },
  'wordList': '' // TODO: Remove
};
var disabledDomains = [];
var words, preserveFirst, filterSubstring, showCounter;
var wordRegExps = [];
var xpathDocText = '//*[not(self::script or self::style)]/text()[normalize-space(.) != ""]';
var xpathNodeText = './/*[not(self::script or self::style)]/text()[normalize-space(.) != ""]';

function checkNodeForProfanity(mutation) {
  mutation.addedNodes.forEach(function(node) {
    if (!isForbiddenNode(node)) {
      removeProfanity(xpathNodeText, node);
    }
  });
}

function cleanPage() {
  chrome.storage.sync.get(defaults, function(storage) {
    // Load settings and setup environment
    words = Object.keys(storage.words);
    filterSubstring = storage.filterSubstring;
    preserveFirst = storage.preserveFirst;
    showCounter = storage.showCounter;
    disabledDomains = storage.disabledDomains;

    // Remove profanity from the main document and watch for new nodes
    if (disabledPage()) {
      chrome.runtime.sendMessage({disabled: true});
      return false;
    }
    generateRegexpList();
    removeProfanity(xpathDocText);
    updateCounterBadge();
    observeNewNodes();
  });
}

function disabledPage() {
  disabled = false;
  domain = window.location.hostname;

  for (var x = 0; x < disabledDomains.length; x++) {
    if (disabledDomains[x]) {
      domainRegex = new RegExp("(^|\.)" + disabledDomains[x]);
      if (domainRegex.test(domain)) {
        disabled = true;
        break;
      }
    }
  }

  return disabled;
}

// Parse the profanity list
function generateRegexpList() {
  if (filterSubstring) {
    for (var x = 0; x < words.length; x++) {
      wordRegExps.push(new RegExp('(' + words[x][0] + ')' + words[x].substring(1), 'gi' ));
    }
  } else {
    for (var x = 0; x < words.length; x++) {
      wordRegExps.push(new RegExp('\\b(' + words[x][0] + ')' + words[x].substring(1) + '\\b', 'gi' ));
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

// Watch for new text nodes and clean them as they are added
function observeNewNodes() {
  var observerConfig = {
    childList: true,
    subtree: true
  };

  // When DOM is modified, remove profanity from inserted node
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      checkNodeForProfanity(mutation);
    });
    updateCounterBadge();
  });

  // Remove profanity from new objects
  observer.observe(document, observerConfig);
}

function removeProfanity(xpathExpression, node) {
  node = (typeof node !== 'undefined') ?  node : document;
  var evalResult = document.evaluate(
    xpathExpression,
    node,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  for (var i = 0; i < evalResult.snapshotLength; i++) {
    var textNode = evalResult.snapshotItem(i);
    textNode.data = replaceText(textNode.data);
  }
}

function replaceText(str) {
  for (var z = 0; z < words.length; z++) {
    str = str.replace(wordRegExps[z], starReplace);
  }

  return str;
}

// Replace the profanity with a string of asterisks
// Only gets run when there is a match in replaceText()
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

  counter++;
  return starString;
}

function updateCounterBadge() {
  if (showCounter && counter > 0) {
    chrome.runtime.sendMessage({counter: counter.toString()});
  }
}

cleanPage();
