import Config from './config.js';
import Domain from './domain.js';
import Page from './page.js';
import Word from './word.js';

interface Message {
  advanced?: boolean,
  counter?: number,
  disabled?: boolean
}

export class Filter {
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
    // console.count('checkMutationTargetTextForProfanity'); // Benchmarking - Executaion Count
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
    // console.count('checkNodeForProfanity'); // Benchmarking - Executaion Count
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

  async cleanPage() {
    this.cfg = await Config.build();

    // Don't run if this is a disabled domain
    // Only run on main page (no frames)
    if (window == window.top) {
      let disabled = this.disabledPage();
      let message = { disabled: disabled } as Message;

      if (message.disabled) {
        chrome.runtime.sendMessage(message);
        return false;
      }

      // Check for advanced mode on current domain
      this.advanced = Domain.domainMatch(window.location.hostname, this.cfg.advancedDomains);
      message.advanced = this.advanced;
      if (this.advanced) {
        message.advanced = true;
      }

      chrome.runtime.sendMessage(message);
    }

    // Remove profanity from the main document and watch for new nodes
    this.generateWordList();
    this.generateRegexpList();
    this.removeProfanity(Page.xpathDocText, document);
    this.updateCounterBadge();
    this.observeNewNodes();
  }

  disabledPage(): boolean {
    // console.count('disabledPage'); // Benchmarking - Executaion Count
    let domain = window.location.hostname;
    return Domain.domainMatch(domain, this.cfg.disabledDomains);
  }

  // Parse the profanity list
  // ["exact", "partial", "whole", "disabled"]
  generateRegexpList() {
    // console.time('generateRegexpList'); // Benchmark - Call Time
    // console.count('generateRegexpList: words to filter'); // Benchmarking - Executaion Count
    if (this.cfg.filterMethod == 2) { // Special regexp for "Remove" filter, uses per-word matchMethods
      for (let x = 0; x < this.cfg.wordList.length; x++) {
        let repeat = this.cfg.repeatForWord(this.cfg.wordList[x]);
        if (this.cfg.words[this.cfg.wordList[x]].matchMethod == 0) { // If word matchMethod is exact
          this.wordRegExps.push(Word.buildRegexpForRemoveExact(this.cfg.wordList[x], repeat));
        } else if (this.cfg.words[this.cfg.wordList[x]].matchMethod == 4) { // If word matchMethod is RegExp
          this.wordRegExps.push(new RegExp(this.cfg.wordList[x], 'gi'));
        } else {
          this.wordRegExps.push(Word.buildRegexpForRemovePart(this.cfg.wordList[x], repeat));
        }
      }
    } else {
      switch(this.cfg.globalMatchMethod) {
        case 0: // Global: Exact match
          for (let x = 0; x < this.cfg.wordList.length; x++) {
            let repeat = this.cfg.repeatForWord(this.cfg.wordList[x]);
            this.wordRegExps.push(Word.buildExactRegexp(this.cfg.wordList[x], repeat));
          }
          break;
        case 2: // Global: Whole word match
          for (let x = 0; x < this.cfg.wordList.length; x++) {
            let repeat = this.cfg.repeatForWord(this.cfg.wordList[x]);
            this.wordRegExps.push(Word.buildWholeRegexp(this.cfg.wordList[x], repeat));
          }
          break;
        case 3: // Per-word matching
          for (let x = 0; x < this.cfg.wordList.length; x++) {
            let repeat = this.cfg.repeatForWord(this.cfg.wordList[x]);
            switch(this.cfg.words[this.cfg.wordList[x]].matchMethod) {
              case 0: // Exact match
                this.wordRegExps.push(Word.buildExactRegexp(this.cfg.wordList[x], repeat));
                break;
              case 2: // Whole word match
                this.wordRegExps.push(Word.buildWholeRegexp(this.cfg.wordList[x], repeat));
                break;
              case 4: // Regular Expression (Advanced)
                this.wordRegExps.push(new RegExp(this.cfg.wordList[x], 'gi'));
                break;
              default: // case 1 - Partial word match (Default)
              this.wordRegExps.push(Word.buildPartRegexp(this.cfg.wordList[x], repeat));
                break;
            }
          }
          break;
        default: // case 1 - Global: Partial word match (Default)
          for (let x = 0; x < this.cfg.wordList.length; x++) {
            let repeat = this.cfg.repeatForWord(this.cfg.wordList[x]);
            this.wordRegExps.push(Word.buildPartRegexp(this.cfg.wordList[x], repeat));
          }
          break;
      }
    }
    // console.timeEnd('generateRegexpList'); // Benchmark - Call Time
  }

  // Sort the words array by longest (most-specific) first
  generateWordList() {
    this.cfg.wordList = Object.keys(this.cfg.words).sort(function(a, b) {
      return b.length - a.length;
    });
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
    // console.count('removeProfanity'); // Benchmarking - Executaion Count
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
        if (!Page.forbiddenNodeRegExp.test(node.data)) {
          // console.log('Plaintext:', node.data); // DEBUG
          node.data = this.replaceText(node.data);
        }
        // else { console.log('Skipping plaintext (protected pattern):', node.data); } // DEBUG
      } else { // No matches, no node.data
        if (filter.advanced) {
          // console.log('Advanced mode:', evalResult, node.textContent); // DEBUG - Advanced
          var replacement;
          if (node.textContent) {
            replacement = filter.replaceText(node.textContent);
            if (replacement != node.textContent) {
              // console.log('Advanced replacement with no data:', replacement); // DEBUG - Advanced
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
    // console.count('replaceText'); // Benchmarking - Executaion Count
    let self = this;
    switch(self.cfg.filterMethod) {
      case 0: // Censor
        for (let z = 0; z < self.cfg.wordList.length; z++) {
          str = str.replace(self.wordRegExps[z], function(match, arg1, arg2, arg3, arg4, arg5): string {
            self.counter++;
            if (self.wordRegExps[z].unicode) { match = arg2; } // Workaround for unicode word boundaries
            let censoredString = '';
            let censorLength = self.cfg.censorFixedLength > 0 ? self.cfg.censorFixedLength : match.length;

            if (self.cfg.preserveFirst && self.cfg.preserveLast) {
              censoredString = match[0] + self.cfg.censorCharacter.repeat(censorLength - 2) + match.slice(-1);
            } else if (self.cfg.preserveFirst) {
              censoredString = match[0] + self.cfg.censorCharacter.repeat(censorLength - 1);
            } else if (self.cfg.preserveLast) {
              censoredString = self.cfg.censorCharacter.repeat(censorLength - 1) + match.slice(-1);
            } else {
              censoredString = self.cfg.censorCharacter.repeat(censorLength);
            }

            if (self.wordRegExps[z].unicode) { censoredString = arg1 + censoredString + arg3; } // Workaround for unicode word boundaries
            // console.log('Censor match:', match, censoredString); // DEBUG
            return censoredString;
          });
        }
        break;
      case 1: // Substitute
        for (let z = 0; z < self.cfg.wordList.length; z++) {
          str = str.replace(self.wordRegExps[z], function(match, arg1, arg2, arg3, arg4, arg5): string {
            // console.log('Substitute match:', match, self.cfg.words[self.cfg.wordList[z]].words); // DEBUG
            self.counter++;
            if (self.wordRegExps[z].unicode) { match = arg2; } // Workaround for unicode word boundaries
            let sub = Word.randomElement(self.cfg.words[self.cfg.wordList[z]].words, self.cfg.defaultSubstitutions);

            // Make substitution match case of original match
            if (self.cfg.preserveCase) {
              if (Word.allUpperCase(match)) {
                sub = sub.toUpperCase();
              } else if (Word.capitalized(match)) {
                sub = Word.capitalize(sub);
              }
            }

            if (self.cfg.substitutionMark) {
              sub = '[' + sub + ']';
            }

            if (self.wordRegExps[z].unicode) { sub = arg1 + sub + arg3; } // Workaround for unicode word boundaries
            return sub;
          });
        }
        break;
      case 2: // Remove
        for (let z = 0; z < self.cfg.wordList.length; z++) {
          str = str.replace(self.wordRegExps[z], function(match, arg1, arg2, arg3, arg4, arg5): string {
            // console.log('Remove match:', match, self.cfg.words[self.cfg.wordList[z]].words); // DEBUG
            // console.log('\nmatch: ', match, '\narg1: ', arg1, '\narg2: ', arg2, '\narg3: ', arg3, '\narg4: ', arg4, '\narg5: ', arg5); // DEBUG
            self.counter++;
            if (self.wordRegExps[z].unicode) {
              // Workaround for unicode word boundaries
              if (Word.whitespaceRegExp.test(arg1) && Word.whitespaceRegExp.test(arg3)) { // If both surrounds are whitespace
                return arg1;
              } else if (Word.nonWordRegExp.test(arg1) || Word.nonWordRegExp.test(arg3)) { // If there is more than just whitesapce (ex. ',')
                return (arg1 + arg3).trim();
              } else {
                return '';
              }
            } else {
              // Don't remove both leading and trailing whitespace
              // console.log('Remove match:', match); // DEBUG
              if (Word.whitespaceRegExp.test(match[0]) && Word.whitespaceRegExp.test(match[match.length - 1])) {
                return match[0];
              } else {
                return '';
              }
            }
          });
        }
        break;
    }
    return str;
  }

  updateCounterBadge() {
    // console.count('updateCounterBadge'); // Benchmarking - Executaion Count
    if (this.cfg.showCounter && this.counter > 0) {
      chrome.runtime.sendMessage({counter: this.counter.toString()});
    }
  }
}

// Global
var filter = new Filter;
if (typeof window !== 'undefined' && ({}).toString.call(window) === '[object Window]') {
  filter.cleanPage();
}