// /// <reference path="./config.ts" />
namespace Filter {
  // Globals - TODO
  var cfg: Config;
  var counter: number;
  var whitespaceRegExp: RegExp;
  var wordRegExps: RegExp[];
  var xpathDocText: string;
  var xpathNodeText: string;
  eval("var cfg;");
  eval("var counter = 0;");
  eval("var whitespaceRegExp = new RegExp('\\s');");
  eval("var wordRegExps = [];");
  eval("var xpathDocText = '//*[not(self::script or self::style)]/text()[normalize-space(.) != \"\"]';");
  eval("var xpathNodeText = './/*[not(self::script or self::style)]/text()[normalize-space(.) != \"\"]';");

  // Word must match exactly (not sub-string)
  // /\b(w)ord\b/gi
  function buildExactRegexp(word: string) {
    wordRegExps.push(new RegExp('\\b(' + word[0] + ')' + escapeRegExp(word.slice(1)) + '\\b', 'gi' ));
  }

  // Match any part of a word (sub-string)
  // /(w)ord/gi
  function buildPartRegexp(word: string) {
    wordRegExps.push(new RegExp('(' + word[0] + ')' + escapeRegExp(word.slice(1)), 'gi' ));
  }

  // Match entire word that contains sub-string and surrounding whitespace
  // /\s?\b(w)ord\b\s?/gi
  function buildRegexpForRemoveExact(word: string) {
    wordRegExps.push(new RegExp('\\s?\\b(' + word[0] + ')' + escapeRegExp(word.slice(1)) + '\\b\\s?', 'gi' ));
  }

  // Match entire word that contains sub-string and surrounding whitespace
  // /\s?\b[\w-]*(w)ord[\w-]*\b\s?/gi
  function buildRegexpForRemovePart(word: string) {
    wordRegExps.push(new RegExp('\\s?\\b([\\w-]*' + word[0] + ')' + escapeRegExp(word.slice(1)) + '[\\w-]*\\b\\s?', 'gi' ));
  }

  // Match entire word that contains sub-string
  // /\b[\w-]*(w)ord[\w-]*\b/gi
  function buildWholeRegexp(word: string) {
    wordRegExps.push(new RegExp('\\b([\\w-]*' + word[0] + ')' + escapeRegExp(word.slice(1)) + '[\\w-]*\\b', 'gi' ))
  }

  function checkNodeForProfanity(mutation: any) {
    mutation.addedNodes.forEach(function(node) {
      if (!isForbiddenNode(node)) {
        // console.log('Node to removeProfanity', node); // DEBUG
        removeProfanity(xpathNodeText, node);
      }
    });
  }

  // Censor the profanity
  // Only gets run when there is a match in replaceText()
  function censorReplace(strMatchingString: string, strFirstLetter: string) {
    let censoredString = '';

    if (cfg.censorFixedLength > 0) {
      if (cfg.preserveFirst && cfg.preserveLast) {
        censoredString = strFirstLetter + cfg.censorCharacter.repeat((cfg.censorFixedLength - 2)) + strMatchingString.slice(-1);
      } else if (cfg.preserveFirst) {
        censoredString = strFirstLetter + cfg.censorCharacter.repeat((cfg.censorFixedLength - 1));
      } else if (cfg.preserveLast) {
        censoredString = cfg.censorCharacter.repeat((cfg.censorFixedLength - 1)) + strMatchingString.slice(-1);
      } else {
        censoredString = cfg.censorCharacter.repeat(cfg.censorFixedLength);
      }
    } else {
      if (cfg.preserveFirst && cfg.preserveLast) {
        censoredString = strFirstLetter + cfg.censorCharacter.repeat((strMatchingString.length - 2)) + strMatchingString.slice(-1);
      } else if (cfg.preserveFirst) {
        censoredString = strFirstLetter + cfg.censorCharacter.repeat((strMatchingString.length - 1));
      } else if (cfg.preserveLast) {
        censoredString = cfg.censorCharacter.repeat((strMatchingString.length - 1)) + strMatchingString.slice(-1);
      } else {
        censoredString = cfg.censorCharacter.repeat(strMatchingString.length);
      }
    }

    counter++;
    // console.log('Censor match:', strMatchingString, censoredString); // DEBUG
    return censoredString;
  }

  async function cleanPage() {
    cfg = await Config.build();

    // Don't run if this is a disabled domain
    // Only run on main page (no frames)
    if (window == window.top) {
      let message = disabledPage();
      chrome.runtime.sendMessage(message);
      if (message.disabled) {
        return false;
      }
    }

    // Remove profanity from the main document and watch for new nodes
    generateRegexpList();
    removeProfanity(xpathDocText, document);
    updateCounterBadge();
    observeNewNodes();
  }

  function disabledPage() {
    let result = { "disabled": false, "domain": "" };
    let domain = window.location.hostname;

    for (let x = 0; x < cfg.disabledDomains.length; x++) {
      if (cfg.disabledDomains[x]) {
        let domainRegex = new RegExp("(^|\.)" + cfg.disabledDomains[x]);
        if (domainRegex.test(domain)) {
          result.disabled = true;
          result.domain = cfg.disabledDomains[x];
          break;
        }
      }
    }

    return result;
  }

  function escapeRegExp(str: string) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }

  // Parse the profanity list
  // ["exact", "partial", "whole", "disabled"]
  function generateRegexpList() {
    if (cfg.filterMethod == 2) { // Special regexp for "Remove" filter
      for (let x = 0; x < cfg.wordList.length; x++) {
        if (cfg.words[cfg.wordList[x]].matchMethod == 0) { // If word matchMethod is exact
          buildRegexpForRemoveExact(cfg.wordList[x]);
        } else {
          buildRegexpForRemovePart(cfg.wordList[x]);
        }
      }
    } else {
      switch(cfg.globalMatchMethod) {
        case 0: // Global: Exact match
          for (let x = 0; x < cfg.wordList.length; x++) {
            buildExactRegexp(cfg.wordList[x]);
          }
          break;
        case 2: // Global: Whole word match
          for (let x = 0; x < cfg.wordList.length; x++) {
            buildWholeRegexp(cfg.wordList[x]);
          }
          break;
        case 3: // Per-word matching
          for (let x = 0; x < cfg.wordList.length; x++) {
            switch(cfg.words[cfg.wordList[x]].matchMethod) {
              case 0: // Exact match
                buildExactRegexp(cfg.wordList[x]);
                break;
              case 2: // Whole word match
                buildWholeRegexp(cfg.wordList[x]);
                break;
              case 4: // Regular Expression (Advanced)
                wordRegExps.push(new RegExp(cfg.wordList[x], 'gi'));
                break;
              default: // case 1 - Partial word match (Default)
                buildPartRegexp(cfg.wordList[x]);
                break;
            }
          }
          break;
        default: // case 1 - Global: Partial word match (Default)
          for (let x = 0; x < cfg.wordList.length; x++) {
            buildPartRegexp(cfg.wordList[x]);
          }
          break;
      }
    }
  }

  // Returns true if a node should *not* be altered in any way
  // Credit: https://github.com/ericwbailey/millennials-to-snake-people/blob/master/Source/content_script.js
  function isForbiddenNode(node: any) {
    return Boolean(
      node.isContentEditable || // DraftJS and many others
      (node.parentNode && (
                            node.parentNode.isContentEditable || // Special case for Gmail
                            node.parentNode.tagName == "SCRIPT" ||
                            node.parentNode.tagName == "STYLE" ||
                            node.parentNode.tagName == "INPUT" ||
                            node.parentNode.tagName == "TEXTAREA" ||
                            node.parentNode.tagName == "IFRAME"
                          )
      ) || // Some catch-alls
      (node.tagName &&  (
                          node.tagName == "SCRIPT" ||
                          node.tagName == "STYLE" ||
                          node.tagName == "INPUT" ||
                          node.tagName == "TEXTAREA" ||
                          node.tagName == "IFRAME"
                        )
      )
    );
  }

  // Watch for new text nodes and clean them as they are added
  function observeNewNodes() {
    let observerConfig = {
      childList: true,
      subtree: true
    };

    // When DOM is modified, remove profanity from inserted node
    let observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        checkNodeForProfanity(mutation);
      });
      updateCounterBadge();
    });

    // Remove profanity from new objects
    observer.observe(document, observerConfig);
  }

  function randomElement(array: any[]) {
    if (array.length === 0) {
      array = cfg.defaultSubstitutions;
    }
    return array[Math.floor((Math.random()*array.length))];
  }

  function removeProfanity(xpathExpression: string, node: any) {
    let evalResult = document.evaluate(
      xpathExpression,
      node,
      null,
      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    if (evalResult.snapshotLength == 0 && node.data) { // If plaintext node
      // Don't mess with tags, styles, or URIs
      if (!/^\s*(<[a-z].+?\/?>|{.+?:.+?;.*}|https?:\/\/[^\s]+$)/.test(node.data)) {
        // console.log('Plaintext:', node.data); // DEBUG
        node.data = replaceText(node.data);
      } else {
        // console.log('Skipping:', node.data); // DEBUG
      }
    } else { // If evalResult matches
      for (let i = 0; i < evalResult.snapshotLength; i++) {
        let textNode = evalResult.snapshotItem(i) as any; // TODO
        // console.log('Normal cleaning:', textNode.data); // DEBUG
        textNode.data = replaceText(textNode.data);
      }
    }
  }

  function replaceText(str: string) {
    switch(cfg.filterMethod) {
      case 0: // Censor
        for (let z = 0; z < cfg.wordList.length; z++) {
          str = str.replace(wordRegExps[z], censorReplace);
        }
        break;
      case 1: // Substitute
        for (let z = 0; z < cfg.wordList.length; z++) {
          str = str.replace(wordRegExps[z], function(match) {
            counter++;
            // console.log('Substitute match:', match, cfg.words[cfg.wordList[z]].words); // DEBUG
            if (cfg.substitutionMark) {
              return '[' + randomElement(cfg.words[cfg.wordList[z]].words) + ']';
            } else {
              return randomElement(cfg.words[cfg.wordList[z]].words);
            }
          });
        }
        break;
      case 2: // Remove
        for (let z = 0; z < cfg.wordList.length; z++) {
          str = str.replace(wordRegExps[z], function(match) {
            counter++;
            // Don't remove both leading and trailing whitespace
            // console.log('Remove match:', match); // DEBUG
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
    if (cfg.showCounter && counter > 0) {
      chrome.runtime.sendMessage({counter: counter.toString()});
    }
  }

  cleanPage();
}