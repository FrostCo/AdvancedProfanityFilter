var counter = 0;
var defaults = {
  "censorCharacter": "*",
  "censorFixedLength": 0,
  "defaultSubstitutions": ["censored", "expletive", "filtered"],
  "disabledDomains": [],
  "filterMethod": 0, // ["Censor", "Substitute", "Remove"];
  "globalMatchMethod": 3, // ["Exact", "Partial", "Whole", "Per-Word"]
  "preserveFirst": false,
  "preserveLast": false,
  "showCounter": true,
  "substitutionMark": true,
  "words": {}
};
var defaultWords = {
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
};
var censorCharacter, censorFixedLength, defaultSubstitutions, disabledDomains, filterMethod, globalMatchMethod, matchMethod, preserveFirst, preserveLast, showCounter, substitutionMark, words, wordList;
var wordRegExps = [];
var whitespaceRegExp = new RegExp('\\s');
var xpathDocText = '//*[not(self::script or self::style)]/text()[normalize-space(.) != ""]';
var xpathNodeText = './/*[not(self::script or self::style)]/text()[normalize-space(.) != ""]';

// Word must match exactly (not sub-string)
// /\b(w)ord\b/gi
function buildExactRegexp(word) {
  wordRegExps.push(new RegExp('\\b(' + word[0] + ')' + word.substring(1)+ '\\b', 'gi' ));
}

// Match any part of a word (sub-string)
// /(w)ord/gi
function buildPartRegexp(word) {
  wordRegExps.push(new RegExp('(' + word[0] + ')' + word.substring(1), 'gi' ));
}

// Match entire word that contains sub-string
// /\b[\w-]*(w)ord[\w-]*\b/gi
function buildWholeRegexp(word) {
  wordRegExps.push(new RegExp('\\b([\\w-]*' + word[0] + ')' + word.substring(1) + '[\\w-]*\\b', 'gi' ));
}

// Match entire word that contains sub-string and surrounding whitespace
// /\s?\b[\w-]*(w)ord[\w-]*\b\s?/gi
function buildWholeRegexpForRemove(word) {
  wordRegExps.push(new RegExp('\\s?\\b([\\w-]*' + word[0] + ')' + word.substring(1) + '[\\w-]*\\b\\s?', 'gi' ));
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

  if (censorFixedLength > 0) {
    if (preserveFirst && preserveLast) {
      censoredString = strFirstLetter + censorCharacter.repeat((censorFixedLength - 2)) + strMatchingString.slice(-1);
    } else if (preserveFirst) {
      censoredString = strFirstLetter + censorCharacter.repeat((censorFixedLength - 1));
    } else if (preserveLast) {
      censoredString = censorCharacter.repeat((censorFixedLength - 1)) + strMatchingString.slice(-1);
    } else {
      censoredString = censorCharacter.repeat(censorFixedLength);
    }
  } else {
    if (preserveFirst && preserveLast) {
      censoredString = strFirstLetter + censorCharacter.repeat((strMatchingString.length - 2)) + strMatchingString.slice(-1); // done
    } else if (preserveFirst) {
      censoredString = strFirstLetter + censorCharacter.repeat((strMatchingString.length - 1)); // done
    } else if (preserveLast) {
      censoredString = censorCharacter.repeat((strMatchingString.length - 1)) + strMatchingString.slice(-1);
    } else {
      censoredString = censorCharacter.repeat(strMatchingString.length); // done
    }
  }

  counter++;
  return censoredString;
}

function cleanPage() {
  chrome.storage.sync.get(defaults, function(storage) {
    disabledDomains = storage.disabledDomains;

    // Don't run if this is a disabled domain
    if (disabledPage()) {
      chrome.runtime.sendMessage({disabled: true});
      return false;
    }

    // If no words are specified use defaultWords
    if (Object.keys(storage.words).length === 0 && storage.words.constructor === Object) {
      storage.words = defaultWords;
    }

    // Load settings and setup environment
    censorCharacter = storage.censorCharacter;
    censorFixedLength = storage.censorFixedLength;
    defaultSubstitutions = storage.defaultSubstitutions;
    filterMethod = storage.filterMethod;
    globalMatchMethod = storage.globalMatchMethod;
    matchMethod = storage.matchMethod;
    preserveFirst = storage.preserveFirst;
    preserveLast = storage.preserveLast;
    showCounter = storage.showCounter;
    substitutionMark = storage.substitutionMark;
    words = storage.words;
    // Sort the words array by longest (most-specific) first
    wordList = Object.keys(words).sort(function(a, b) {
      return b.length - a.length;
    });

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
  if (filterMethod == 2) { // If removing, ignore match method
    for (var x = 0; x < wordList.length; x++) {
      buildWholeRegexpForRemove(wordList[x]);
    }
  } else {
    switch(globalMatchMethod) {
      case 0: // Global: Exact match
        for (var x = 0; x < wordList.length; x++) {
          buildExactRegexp(wordList[x]);
        }
        break;
      case 2: // Global: Whole word match
        for (var x = 0; x < wordList.length; x++) {
          buildWholeRegexp(wordList[x]);
        }
        break;
      case 3: // Per-word matching
        for (var x = 0; x < wordList.length; x++) {
          switch(words[wordList[x]].matchMethod) {
            case 0: // Exact match
              buildExactRegexp(wordList[x]);
              break;
            case 2: // Whole word match
              buildWholeRegexp(wordList[x]);
              break;
            default: // case 1 - Partial word match (Default)
              buildPartRegexp(wordList[x]);
              break;
          }
        }
        break;
      default: // case 1 - Global: Partial word match (Default)
        for (var x = 0; x < wordList.length; x++) {
          buildPartRegexp(wordList[x]);
        }
        break;
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

function randomElement(array) {
  if (array.length === 0) {
    array = defaultSubstitutions;
  }
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
      for (var z = 0; z < wordList.length; z++) {
        str = str.replace(wordRegExps[z], censorReplace);
      }
      break;
    case 1: // Substitute
      for (var z = 0; z < wordList.length; z++) {
        str = str.replace(wordRegExps[z], function(match) {
          counter++;
          if (substitutionMark) {
            return '[' + randomElement(words[wordList[z]].words) + ']';
          } else {
            return randomElement(words[wordList[z]].words);
          }
        });
      }
      break;
    case 2: // Remove
      for (var z = 0; z < wordList.length; z++) {
        str = str.replace(wordRegExps[z], function(match) {
          counter++;
          // Don't remove both leading and trailing whitespace
          if (whitespaceRegExp.test(match[0]) && whitespaceRegExp.test(match[match.length - 1])) {
            return match[0];
          } else {
            return "";
          }
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
