// tsc --outfile ./dist/filter.js ./src/helper.ts ./src/config.ts ./src/word.ts ./src/page.ts ./src/filter.ts --target es6
// /// <reference path="./config.ts" />

class Filter {
  cfg: Config;
  counter: number;
  wordRegExps: RegExp[];

  constructor() {
    this.counter = 0;
    this.wordRegExps = [];
  }

  checkNodeForProfanity(mutation: any) {
    let self = this;
    mutation.addedNodes.forEach(function(node) {
      if (!Page.isForbiddenNode(node)) {
        // console.log('Node to removeProfanity', node); // DEBUG
        self.removeProfanity(Page.xpathNodeText, node);
      }
    });
  }

  // Censor the profanity
  // Only gets run when there is a match in replaceText()
  censorReplace(strMatchingString: string, strFirstLetter: string): string {
    filter.counter++;
    let censoredString = '';

    if (filter.cfg.censorFixedLength > 0) {
      if (filter.cfg.preserveFirst && filter.cfg.preserveLast) {
        censoredString = strFirstLetter + filter.cfg.censorCharacter.repeat((filter.cfg.censorFixedLength - 2)) + strMatchingString.slice(-1);
      } else if (filter.cfg.preserveFirst) {
        censoredString = strFirstLetter + filter.cfg.censorCharacter.repeat((filter.cfg.censorFixedLength - 1));
      } else if (filter.cfg.preserveLast) {
        censoredString = filter.cfg.censorCharacter.repeat((filter.cfg.censorFixedLength - 1)) + strMatchingString.slice(-1);
      } else {
        censoredString = filter.cfg.censorCharacter.repeat(filter.cfg.censorFixedLength);
      }
    } else {
      if (filter.cfg.preserveFirst && filter.cfg.preserveLast) {
        censoredString = strFirstLetter + filter.cfg.censorCharacter.repeat((strMatchingString.length - 2)) + strMatchingString.slice(-1);
      } else if (filter.cfg.preserveFirst) {
        censoredString = strFirstLetter + filter.cfg.censorCharacter.repeat((strMatchingString.length - 1));
      } else if (filter.cfg.preserveLast) {
        censoredString = filter.cfg.censorCharacter.repeat((strMatchingString.length - 1)) + strMatchingString.slice(-1);
      } else {
        censoredString = filter.cfg.censorCharacter.repeat(strMatchingString.length);
      }
    }

    // console.log('Censor match:', strMatchingString, censoredString); // DEBUG
    return censoredString;
  }

  async cleanPage() {
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

    // Sort the words array by longest (most-specific) first
    this.cfg.wordList = Object.keys(this.cfg.words).sort(function(a, b) {
      return b.length - a.length;
    });

    // Remove profanity from the main document and watch for new nodes
    this.generateRegexpList();
    this.removeProfanity(Page.xpathDocText, document);
    this.updateCounterBadge();
    this.observeNewNodes();
  }

  disabledPage() {
    let result = { "disabled": false, "domain": "" };
    let domain = window.location.hostname;

    for (let x = 0; x < this.cfg.disabledDomains.length; x++) {
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

  // Parse the profanity list
  // ["exact", "partial", "whole", "disabled"]
  generateRegexpList() {
    if (this.cfg.filterMethod == 2) { // Special regexp for "Remove" filter
      for (let x = 0; x < this.cfg.wordList.length; x++) {
        if (this.cfg.words[this.cfg.wordList[x]].matchMethod == 0) { // If word matchMethod is exact
          this.wordRegExps.push(Word.buildRegexpForRemoveExact(this.cfg.wordList[x]));
        } else {
          this.wordRegExps.push(Word.buildRegexpForRemovePart(this.cfg.wordList[x]));
        }
      }
    } else {
      switch(this.cfg.globalMatchMethod) {
        case 0: // Global: Exact match
          for (let x = 0; x < this.cfg.wordList.length; x++) {
            this.wordRegExps.push(Word.buildExactRegexp(this.cfg.wordList[x]));
          }
          break;
        case 2: // Global: Whole word match
          for (let x = 0; x < this.cfg.wordList.length; x++) {
            this.wordRegExps.push(Word.buildWholeRegexp(this.cfg.wordList[x]));
          }
          break;
        case 3: // Per-word matching
          for (let x = 0; x < this.cfg.wordList.length; x++) {
            switch(this.cfg.words[this.cfg.wordList[x]].matchMethod) {
              case 0: // Exact match
                this.wordRegExps.push(Word.buildExactRegexp(this.cfg.wordList[x]));
                break;
              case 2: // Whole word match
                this.wordRegExps.push(Word.buildWholeRegexp(this.cfg.wordList[x]));
                break;
              case 4: // Regular Expression (Advanced)
                this.wordRegExps.push(new RegExp(this.cfg.wordList[x], 'gi'));
                break;
              default: // case 1 - Partial word match (Default)
              this.wordRegExps.push(Word.buildPartRegexp(this.cfg.wordList[x]));
                break;
            }
          }
          break;
        default: // case 1 - Global: Partial word match (Default)
          for (let x = 0; x < this.cfg.wordList.length; x++) {
            this.wordRegExps.push(Word.buildPartRegexp(this.cfg.wordList[x]));
          }
          break;
      }
    }
  }

  // Watch for new text nodes and clean them as they are added
  observeNewNodes() {
    let self = this;
    let observerConfig = {
      childList: true,
      subtree: true
    };

    // When DOM is modified, remove profanity from inserted node
    let observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        self.checkNodeForProfanity(mutation);
      });
      self.updateCounterBadge();
    });

    // Remove profanity from new objects
    observer.observe(document, observerConfig);
  }

  removeProfanity(xpathExpression: string, node: any) {
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
        node.data = this.replaceText(node.data);
      } else {
        // console.log('Skipping:', node.data); // DEBUG
      }
    } else { // If evalResult matches
      for (let i = 0; i < evalResult.snapshotLength; i++) {
        let textNode = evalResult.snapshotItem(i) as any; // TODO
        // console.log('Normal cleaning:', textNode.data); // DEBUG
        textNode.data = this.replaceText(textNode.data);
      }
    }
  }

  replaceText(str: string) {
    switch(filter.cfg.filterMethod) {
      case 0: // Censor
        for (let z = 0; z < filter.cfg.wordList.length; z++) {
          str = str.replace(filter.wordRegExps[z], filter.censorReplace);
        }
        break;
      case 1: // Substitute
        for (let z = 0; z < filter.cfg.wordList.length; z++) {
          str = str.replace(filter.wordRegExps[z], function(match) {
            filter.counter++;
            let sub = Word.randomElement(filter.cfg.words[filter.cfg.wordList[z]].words);
            // console.log('Substitute match:', match, filter.cfg.words[filter.cfg.wordList[z]].words); // DEBUG

            // Make substitution match case of original match
            if (filter.cfg.preserveCase) {
              if (Word.allUpperCase(match)) {
                sub = sub.toUpperCase();
              } else if (Word.capitalized(match)) {
                sub = Word.capitalize(sub);
              }
            }

            if (filter.cfg.substitutionMark) {
              return '[' + sub + ']';
            } else {
              return sub;
            }
          });
        }
        break;
      case 2: // Remove
        for (let z = 0; z < filter.cfg.wordList.length; z++) {
          str = str.replace(filter.wordRegExps[z], function(match) {
            filter.counter++;
            // Don't remove both leading and trailing whitespace
            // console.log('Remove match:', match); // DEBUG
            if (Page.whitespaceRegExp.test(match[0]) && Page.whitespaceRegExp.test(match[match.length - 1])) {
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

// Global
var filter = new Filter
filter.cleanPage();