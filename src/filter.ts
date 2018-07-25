// tsc --outfile ./dist/filter.js ./src/helper.ts ./src/config.ts ./src/domain.ts ./src/word.ts ./src/page.ts ./src/filter.ts --target es6
import Config from './config';
import Domain from './domain';
import Page from './page';
import Word from './word';

class Filter {
  cfg: Config;
  advanced: boolean;
  counter: number;
  wordRegExps: RegExp[];

  constructor() {
    this.advanced = false;
    this.counter = 0;
    this.wordRegExps = [];
  }

  checkMutationTargetTextForProfanity(mutation) {
    // console.log('Process mutation.target:', mutation.target, mutation.target.data); // DEBUG - Mutation target text
    var replacement;
    if (!Page.isForbiddenNode(mutation.target)) {
      replacement = filter.replaceText(mutation.target.data);
      if (replacement != mutation.target.data) {
        // console.log("Mutation target text changed:", mutation.target.data, replacement); // DEBUG - Mutation target text
        mutation.target.data = replacement;
      }
    }
    // else { console.log('Forbidden mutation.target node:', mutation.target); } // DEBUG - Mutation target text
  }

  checkNodeForProfanity(mutation) {
    // console.log('Mutation observed:', mutation); // DEBUG - Mutation addedNodes
    mutation.addedNodes.forEach(function(node) {
      // console.log('Added node(s):', node); // DEBUG - Mutation addedNodes
      if (!Page.isForbiddenNode(node)) {
        // console.log('Node to removeProfanity', node); // DEBUG - Mutation addedNodes
        filter.removeProfanity(Page.xpathNodeText, node);
      }
      // else { console.log('Forbidden node:', node); } // DEBUG - Mutation addedNodes
    });

    // Only process mutation change if target is text
    if (mutation.target && mutation.target.nodeName == '#text') {
      filter.checkMutationTargetTextForProfanity(mutation);
    }
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

    // Turn on advanced filter (NOTE: Can break things)
    this.advanced = Domain.domainMatch(window.location.hostname, this.cfg.advancedDomains);

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
    let result = { "disabled": false };
    let domain = window.location.hostname;
    result.disabled = Domain.domainMatch(domain, this.cfg.disabledDomains);
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
      characterData: true,
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

    if (evalResult.snapshotLength == 0) { // If plaintext node
      if (node.data) {
        // Don't mess with tags, styles, or URIs
        if (!/^\s*(<[a-z].+?\/?>|{.+?:.+?;.*}|https?:\/\/[^\s]+$)/.test(node.data)) {
          // console.log('Plaintext:', node.data); // DEBUG
          node.data = this.replaceText(node.data);
        }
        // else { console.log('Skipping plaintext (protected pattern):', node.data); } // DEBUG
      } else { // No matches, no node.data
        if (filter.advanced) {
          console.log('Advanced mode:', evalResult, node.textContent); // DEBUG - Advanced
          var replacement;
          if (node.textContent) {
            replacement = filter.replaceText(node.textContent);
            if (replacement != node.textContent) {
              console.log('Advanced replacement with no data:', replacement); // DEBUG - Advanced
              node.textContent = replacement;
            }
          }
        }
      }
    } else { // If evalResult matches
      for (let i = 0; i < evalResult.snapshotLength; i++) {
        var item = evalResult.snapshotItem(i) as any;
        // console.log('Normal cleaning:', item.data); // DEBUG
        item.data = this.replaceText(item.data);
      }
    }
  }

  replaceText(str: string): string {
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
            let sub = Word.randomElement(filter.cfg.words[filter.cfg.wordList[z]].words, filter);
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