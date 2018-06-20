// /// <reference path="./config.ts" />
class Word {

}

class Filter {
  counter: number;
  wordRegExps: RegExp[];
  cfg: Config;

  // Globals
  static readonly xpathDocText: '//*[not(self::script or self::style)]/text()[normalize-space(.) != ""]';
  static readonly xpathNodeText: './/*[not(self::script or self::style)]/text()[normalize-space(.) != ""]';
  static readonly whitespaceRegExp = new RegExp('\\s'); // TODO

  constructor(){
    this.counter = 0;
    this.wordRegExps = [];
  }

  // Word must match exactly (not sub-string)
  // /\b(w)ord\b/gi
  buildExactRegexp(word: string) {
    this.wordRegExps.push(new RegExp('\\b(' + word[0] + ')' + Filter.escapeRegExp(word.slice(1)) + '\\b', 'gi' ));
  }

  // Match any part of a word (sub-string)
  // /(w)ord/gi
  buildPartRegexp(word: string) {
    this.wordRegExps.push(new RegExp('(' + word[0] + ')' + Filter.escapeRegExp(word.slice(1)), 'gi' ));
  }

  // Match entire word that contains sub-string and surrounding whitespace
  // /\s?\b(w)ord\b\s?/gi
  buildRegexpForRemoveExact(word: string) {
    this.wordRegExps.push(new RegExp('\\s?\\b(' + word[0] + ')' + Filter.escapeRegExp(word.slice(1)) + '\\b\\s?', 'gi' ));
  }

  // Match entire word that contains sub-string and surrounding whitespace
  // /\s?\b[\w-]*(w)ord[\w-]*\b\s?/gi
  buildRegexpForRemovePart(word: string) {
    this.wordRegExps.push(new RegExp('\\s?\\b([\\w-]*' + word[0] + ')' + Filter.escapeRegExp(word.slice(1)) + '[\\w-]*\\b\\s?', 'gi' ));
  }

  // Match entire word that contains sub-string
  // /\b[\w-]*(w)ord[\w-]*\b/gi
  buildWholeRegexp(word: string) {
    this.wordRegExps.push(new RegExp('\\b([\\w-]*' + word[0] + ')' + Filter.escapeRegExp(word.slice(1)) + '[\\w-]*\\b', 'gi' ))
  }

  checkNodeForProfanity(mutation: any) {
    mutation.addedNodes.forEach(function(node) {
      if (!Filter.isForbiddenNode(node)) {
        // console.log('Node to removeProfanity', node); // DEBUG
        this.removeProfanity(Filter.xpathNodeText, node);
      }
    });
  }

  // Censor the profanity
  // Only gets run when there is a match in replaceText()
  censorReplace(strMatchingString: string, strFirstLetter: string) {
    var censoredString = '';

    if (this.cfg.censorFixedLength > 0) {
      if (this.cfg.preserveFirst && this.cfg.preserveLast) {
        censoredString = strFirstLetter + this.cfg.censorCharacter.repeat((this.cfg.censorFixedLength - 2)) + strMatchingString.slice(-1);
      } else if (this.cfg.preserveFirst) {
        censoredString = strFirstLetter + this.cfg.censorCharacter.repeat((this.cfg.censorFixedLength - 1));
      } else if (this.cfg.preserveLast) {
        censoredString = this.cfg.censorCharacter.repeat((this.cfg.censorFixedLength - 1)) + strMatchingString.slice(-1);
      } else {
        censoredString = this.cfg.censorCharacter.repeat(this.cfg.censorFixedLength);
      }
    } else {
      if (this.cfg.preserveFirst && this.cfg.preserveLast) {
        censoredString = strFirstLetter + this.cfg.censorCharacter.repeat((strMatchingString.length - 2)) + strMatchingString.slice(-1);
      } else if (this.cfg.preserveFirst) {
        censoredString = strFirstLetter + this.cfg.censorCharacter.repeat((strMatchingString.length - 1));
      } else if (this.cfg.preserveLast) {
        censoredString = this.cfg.censorCharacter.repeat((strMatchingString.length - 1)) + strMatchingString.slice(-1);
      } else {
        censoredString = this.cfg.censorCharacter.repeat(strMatchingString.length);
      }
    }

    this.counter++;
    // console.log('Censor match:', strMatchingString, censoredString); // DEBUG
    return censoredString;
  }

  async cleanPage() {
    // TODO: Workaround to add module support for content scripts
    const { Config } = importVarsFrom('config');
    this.cfg = await Config.build();

    // Don't run if this is a disabled domain
    // Only run on main page (no frames)
    if (window == window.top) {
      let message = this.disabledPage();
      chrome.runtime.sendMessage(message);
      if (message.disabled) {
        return false;
      }
    }

    // Remove profanity from the main document and watch for new nodes
    this.generateRegexpList();
    this.removeProfanity(Filter.xpathDocText, document);
    this.updateCounterBadge();
    this.observeNewNodes();
  }

  disabledPage() {
    let result = { "disabled": false, "domain": "" };
    let domain = window.location.hostname;

    for (var x = 0; x < this.cfg.disabledDomains.length; x++) {
      if (this.cfg.disabledDomains[x]) {
        let domainRegex = new RegExp("(^|\.)" + this.cfg.disabledDomains[x]);
        if (domainRegex.test(domain)) {
          result.disabled = true;
          result.domain = this.cfg.disabledDomains[x];
          break;
        }
      }
    }

    return result;
  }

  static escapeRegExp(str: string) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }

  // Parse the profanity list
  // ["exact", "partial", "whole", "disabled"]
  generateRegexpList() {
    if (this.cfg.filterMethod == 2) { // Special regexp for "Remove" filter
      for (var x = 0; x < this.cfg.wordList.length; x++) {
        if (this.cfg.words[this.cfg.wordList[x]].matchMethod == 0) { // If word matchMethod is exact
          this.buildRegexpForRemoveExact(this.cfg.wordList[x]);
        } else {
          this.buildRegexpForRemovePart(this.cfg.wordList[x]);
        }
      }
    } else {
      switch(this.cfg.globalMatchMethod) {
        case 0: // Global: Exact match
          for (var x = 0; x < this.cfg.wordList.length; x++) {
            this.buildExactRegexp(this.cfg.wordList[x]);
          }
          break;
        case 2: // Global: Whole word match
          for (var x = 0; x < this.cfg.wordList.length; x++) {
            this.buildWholeRegexp(this.cfg.wordList[x]);
          }
          break;
        case 3: // Per-word matching
          for (var x = 0; x < this.cfg.wordList.length; x++) {
            switch(this.cfg.words[this.cfg.wordList[x]].matchMethod) {
              case 0: // Exact match
                this.buildExactRegexp(this.cfg.wordList[x]);
                break;
              case 2: // Whole word match
                this.buildWholeRegexp(this.cfg.wordList[x]);
                break;
              case 4: // Regular Expression (Advanced)
                this.wordRegExps.push(new RegExp(this.cfg.wordList[x], 'gi'));
                break;
              default: // case 1 - Partial word match (Default)
                this.buildPartRegexp(this.cfg.wordList[x]);
                break;
            }
          }
          break;
        default: // case 1 - Global: Partial word match (Default)
          for (var x = 0; x < this.cfg.wordList.length; x++) {
            this.buildPartRegexp(this.cfg.wordList[x]);
          }
          break;
      }
    }
  }

  // Returns true if a node should *not* be altered in any way
  // Credit: https://github.com/ericwbailey/millennials-to-snake-people/blob/master/Source/content_script.js
  static isForbiddenNode(node: any) {
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
  observeNewNodes() {
    var observerConfig = {
      childList: true,
      subtree: true
    };

    // When DOM is modified, remove profanity from inserted node
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        this.checkNodeForProfanity(mutation);
      });
      this.updateCounterBadge();
    });

    // Remove profanity from new objects
    observer.observe(document, observerConfig);
  }

  randomElement(array: any[]) {
    if (array.length === 0) {
      array = this.cfg.defaultSubstitutions;
    }
    return array[Math.floor((Math.random()*array.length))];
  }

  removeProfanity(xpathExpression: string, node: any) {
    var evalResult = document.evaluate(
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
        node.data = this.replaceText(node.data);
      } else {
        // console.log('Skipping:', node.data); // DEBUG
      }
    } else { // If evalResult matches
      for (var i = 0; i < evalResult.snapshotLength; i++) {
        var textNode = evalResult.snapshotItem(i) as any; // TODO
        // console.log('Normal cleaning:', textNode.data); // DEBUG
        textNode.data = this.replaceText(textNode.data);
      }
    }
  }

  replaceText(str: string) {
    switch(this.cfg.filterMethod) {
      case 0: // Censor
        for (var z = 0; z < this.cfg.wordList.length; z++) {
          str = str.replace(this.wordRegExps[z], this.censorReplace);
        }
        break;
      case 1: // Substitute
        for (var z = 0; z < this.cfg.wordList.length; z++) {
          str = str.replace(this.wordRegExps[z], function(match) {
            this.counter++;
            // console.log('Substitute match:', match, this.cfg.words[this.cfg.wordList[z]].words); // DEBUG
            if (this.cfg.substitutionMark) {
              return '[' + this.randomElement(this.cfg.words[this.cfg.wordList[z]].words) + ']';
            } else {
              return this.randomElement(this.cfg.words[this.cfg.wordList[z]].words);
            }
          });
        }
        break;
      case 2: // Remove
        for (var z = 0; z < this.cfg.wordList.length; z++) {
          str = str.replace(this.wordRegExps[z], function(match) {
            this.counter++;
            // Don't remove both leading and trailing whitespace
            // console.log('Remove match:', match); // DEBUG
            if (this.whitespaceRegExp.test(match[0]) && this.whitespaceRegExp.test(match[match.length - 1])) {
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

  updateCounterBadge() {
    if (this.cfg.showCounter && this.counter > 0) {
      chrome.runtime.sendMessage({counter: this.counter.toString()});
    }
  }
}

let filter = new Filter;
filter.cleanPage();