var counter = 0;
var defaults = {
  "censorCharacter": "*",
  "censorFixedLength": 0,
  "censorRemoveWord": false,
  "disabledDomains": [],
  "filterMethod": 0, // ["censor", "substitute"];
  "matchMethod": 1, // ["exact", "partial", "greedy"]
  "preserveFirst": false,
  "showCounter": true,
  "words": {
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
  }
};
var censorCharacter, censorFixedLength, censorRemoveWord, disabledDomains, filterMethod, matchMethod, preserveFirst, showCounter, substitutionWords, words;
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

// Censor the profanity
// Only gets run when there is a match in replaceText()
function censorReplace(strMatchingString, strFirstLetter) {
  var censoredString = '';

  // Compatible Combinations
  // removeWord: None
  // preserveFirst: censorCharacter, censorFixedLength
  if (censorRemoveWord) {
    censoredString = '';
  } else if (censorFixedLength > 0) {
    if (preserveFirst) {
      censoredString = strFirstLetter[0] + censorCharacter.repeat((censorFixedLength - 1));
    } else {
      censoredString = censorCharacter.repeat(censorFixedLength);
    }
  } else {
    if (preserveFirst) {
      censoredString = strFirstLetter[0] + censorCharacter.repeat((strMatchingString.length - 1));
    } else {
      censoredString = censorCharacter.repeat(strMatchingString.length);
    }
  }

  counter++;
  return censoredString;
}

function cleanPage() {
  chrome.storage.sync.get(defaults, function(storage) {
    // Load settings and setup environment
    censorCharacter = storage.censorCharacter;
    censorFixedLength = storage.censorFixedLength;
    censorRemoveWord = storage.censorRemoveWord
    disabledDomains = storage.disabledDomains;
    filterMethod = storage.filterMethod;
    matchMethod = storage.matchMethod;
    preserveFirst = storage.preserveFirst;
    showCounter = storage.showCounter;
    substitutionWords = storage.words;
    // Sort the words array by longest (most-specific) first
    words = Object.keys(storage.words).sort(function(a, b) {
      return b.length - a.length;
    });

    // Don't run if this is a disabled domain
    if (disabledPage()) {
      chrome.runtime.sendMessage({disabled: true});
      return false;
    }

    // Remove profanity from the main document and watch for new nodes
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
  switch(matchMethod) {
    case 0:
      // Word must match exactly (not sub-string)
      // /\b(w)ord\b/gi
      for (var x = 0; x < words.length; x++) {
        wordRegExps.push(new RegExp('\\b(' + words[x][0] + ')' + words[x].substring(1) + '\\b', 'gi' ));
      }
      break;
    case 1:
      // Match any part of a word (sub-string)
      // /(w)ord/gi
      for (var x = 0; x < words.length; x++) {
        wordRegExps.push(new RegExp('(' + words[x][0] + ')' + words[x].substring(1), 'gi' ));
      }
      break;
    case 2:
      // Match entire word that contains sub-string
      // /\b[\w-]*(w)ord[\w-]*\b/gi
      for (var x = 0; x < words.length; x++) {
        wordRegExps.push(new RegExp('\\b([\\w-]*' + words[x][0] + ')' + words[x].substring(1) + '[\\w-]*\\b', 'gi' ));
      }
      break;
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

function randomElement(array) {
  return array[Math.floor((Math.random()*array.length))];
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
  switch(filterMethod) {
    case 0: // Censor
      for (var z = 0; z < words.length; z++) {
        str = str.replace(wordRegExps[z], censorReplace);
      }
      break;
    case 1: // Substitute
      for (var z = 0; z < words.length; z++) {
        str = str.replace(wordRegExps[z], function(match) {
          counter++;
          return randomElement(substitutionWords[words[z]]);
        });
      }
      break;
  }
  return str;
}

function updateCounterBadge() {
  if (showCounter && counter > 0) {
    chrome.runtime.sendMessage({counter: counter.toString()});
  }
}

cleanPage();
