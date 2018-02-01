// ==UserScript==
// @name         Advanced Profanity Filter (Userscript)
// @description  A userscript to filter profanity from webpages. This is experimental right now, and settings will be overridden when a new version is released. Please save your customizations externally or disable auto-updates of the script.
// @namespace    https://github.com/richardfrost/AdvancedProfanityFilter/wiki
// @version      1.0.0
// @downloadURL  https://raw.githubusercontent.com/richardfrost/AdvancedProfanityFilter/master/advanced-profanity-filter.user.js
// @author       Richard Frost
// @match        *://*
// @grant        none
// ==/UserScript==

(function() {
//////////////////////
// NOTE: This script is experimental right now. If you can, use the Firefox Add-on or Chrome extension.
//
// Settings:
//
// To adjust settings, change the settings & word variables.
// For a rundown on what the settings do, please see:
// https://github.com/richardfrost/AdvancedProfanityFilter/wiki
//
// Optionally, you can also export settings from the full extension/add-on and put them here
// like:
// var settings = {
//   EXPORTED_CONFIG (remove extra curly braces if necessary)
// }

// var counter = 0; // Removed for userscript
// Modified setting variable names to make more sense for userscript
var settings = {
  "censorCharacter": "*",
  "censorFixedLength": 0,
  "defaultSubstitutions": ["censored", "expletive", "filtered"],
  "disabledDomains": [],
  "filterMethod": 0, // ["Censor", "Substitute", "Remove"];
  "globalMatchMethod": 3, // ["Exact", "Partial", "Whole", "Per-Word"]
  "preserveFirst": false,
  // "showCounter": true, // Removed for userscript
  "substitutionMark": true,
  "words": {} // Modify words in variable below for userscript
};
// Modify these words to adjust filter
// each word can have a matchMethod and a list of words to substitute with (only if using substitute filterMethod)
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


//////////////////////
// Profanity Filter Script
// You shouldn't need to modify anything after this.
//
var censorCharacter, censorFixedLength, defaultSubstitutions, disabledDomains, filterMethod, globalMatchMethod, matchMethod, preserveFirst, substitutionMark, wordList, words;
var wordRegExps = [];
var whitespaceRegExp = new RegExp('\\s');
var xpathDocText = '//*[not(self::script or self::style)]/text()[normalize-space(.) != ""]';
var xpathNodeText = './/*[not(self::script or self::style)]/text()[normalize-space(.) != ""]';

// Word must match exactly (not sub-string)
// /\b(w)ord\b/gi
function buildExactRegexp(word) {
  wordRegExps.push(new RegExp('\\b(' + word[0] + ')' + word.substring(1) + '\\b', 'gi' ));
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

  // counter++; // Removed for userscript
  return censoredString;
}

// Modified for userscript:
function cleanPage() {
  disabledDomains = settings.disabledDomains;

  // Don't run if this is a disabled domain
  if (disabledPage()) {
    // chrome.runtime.sendMessage({disabled: true}); // Removed for userscript
    return false;
  }

  // If no words are specified use defaultWords
  if (Object.keys(settings.words).length === 0 && settings.words.constructor === Object) {
    settings.words = defaultWords;
  }

  // Load settings and setup environment
  censorCharacter = settings.censorCharacter;
  censorFixedLength = settings.censorFixedLength;
  defaultSubstitutions = settings.defaultSubstitutions;
  filterMethod = settings.filterMethod;
  globalMatchMethod = settings.globalMatchMethod;
  matchMethod = settings.matchMethod;
  preserveFirst = settings.preserveFirst;
  // showCounter = settings.showCounter; // Removed for userscript
  substitutionMark = settings.substitutionMark;
  words = settings.words;
  // Sort the words array by longest (most-specific) first
  wordList = Object.keys(words).sort(function(a, b) {
    return b.length - a.length;
  });

  // Remove profanity from the main document and watch for new nodes
  generateRegexpList();
  removeProfanity(xpathDocText);
  // updateCounterBadge(); // Removed for userscript
  observeNewNodes();
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
    // updateCounterBadge(); // Removed for userscript
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
          // counter++; // Removed for userscript
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
          // counter++; // Removed for userscript
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

// Removed for userscript:
// function updateCounterBadge() {
//   if (showCounter && counter > 0) {
//     chrome.runtime.sendMessage({counter: counter.toString()});
//   }
// }

cleanPage();
})();
