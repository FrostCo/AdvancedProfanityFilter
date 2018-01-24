var counter = 0;
// matchMethod = ["exact", "partial", "whole"]
var defaults = {
  "censorCharacter": "*",
  "censorFixedLength": 0,
  "censorRemoveWord": false,
  "disabledDomains": [],
  "filterMethod": 0, // ["censor", "substitute"];
  "globalMatchMethod": 3, // ["exact", "partial", "whole", "disabled"]
  "preserveFirst": false,
  "showCounter": true,
  "words": {
    "ass": {"matchMethod": 0, "words": ["butt", "tail"] },
    "asshole": {"matchMethod": 1, "words": ["butthole", "jerk"] },
    "bastard": {"matchMethod": 1, "words": ["imperfect", "impure"] },
    "bitch": {"matchMethod": 1, "words": ["jerk"] },
    "cunt": {"matchMethod": 1, "words": ["explative"] },
    "damn": {"matchMethod": 1, "words": ["dang", "darn"] },
    "fuck": {"matchMethod": 1, "words": ["freak", "fudge"] },
    "piss": {"matchMethod": 1, "words": ["pee"] },
    "pissed": {"matchMethod": 0, "words": ["ticked"] },
    "slut": {"matchMethod": 1, "words": ["imperfect", "impure"] },
    "shit": {"matchMethod": 1, "words": ["crap", "crud", "poop"] },
    "tits": {"matchMethod": 1, "words": ["explative"] },
    "whore": {"matchMethod": 1, "words": ["harlot", "tramp"] }
  }
};
var censorCharacter, censorFixedLength, censorRemoveWord, disabledDomains, filterMethod, globalMatchMethod, matchMethod, preserveFirst, showCounter, substitutionWords, words;
var wordRegExps = [];
var xpathDocText = '//*[not(self::script or self::style)]/text()[normalize-space(.) != ""]';
var xpathNodeText = './/*[not(self::script or self::style)]/text()[normalize-space(.) != ""]';

// Word must match exactly (not sub-string)
// /\b(w)ord\b/gi
function build_exact_regexp(word) {
  wordRegExps.push(new RegExp('\\b(' + word[0] + ')' + word.substring(1) + '\\b', 'gi' ));
}

// Match any part of a word (sub-string)
// /(w)ord/gi
function build_part_regexp(word) {
  wordRegExps.push(new RegExp('(' + word[0] + ')' + word.substring(1), 'gi' ));
}

// Match entire word that contains sub-string
// /\b[\w-]*(w)ord[\w-]*\b/gi
function build_whole_regexp(word) {
  wordRegExps.push(new RegExp('\\b([\\w-]*' + word[0] + ')' + word.substring(1) + '[\\w-]*\\b', 'gi' ));
}

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
    globalMatchMethod = storage.globalMatchMethod;
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
// ["exact", "partial", "whole", "disabled"]
function generateRegexpList() {
  switch(globalMatchMethod) {
    case 0: // Global: Exact match
      for (var x = 0; x < words.length; x++) {
        build_exact_regexp(words[x]);
      }
      break;
    case 2: // Global: Whole word match
      for (var x = 0; x < words.length; x++) {
        build_whole_regexp(words[x]);
      }
      break;
    case 3: // Per-word matching
      for (var x = 0; x < words.length; x++) {
        switch(substitutionWords[words[x]].matchMethod) {
          case 0: // Exact match
            build_exact_regexp(words[x]);
            break;
          case 2: // Whole word match
            build_whole_regexp(words[x]);
            break;
          default: // case 1 - Partial word match (Default)
            build_part_regexp(words[x]);
            break;
        }
      }
      break;
    default: // case 1 - Global: Partial word match (Default)
      for (var x = 0; x < words.length; x++) {
        build_part_regexp(words[x]);
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
