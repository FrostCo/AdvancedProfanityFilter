import Word from './word.js';

export class Filter {
  cfg: Config;
  counter: number;
  wordList: string[];
  wordRegExps: RegExp[];

  constructor() {
    this.counter = 0;
    this.wordList = [];
    this.wordRegExps = [];
  }

  foundMatch(word) {
    this.counter++;
  }

  // Parse the profanity list
  // ["exact", "partial", "whole", "disabled"]
  generateRegexpList() {
    // Clean wordRegExps if there are already some present
    if (this.wordList.length === 0) this.generateWordList();
    if (this.wordRegExps.length > 0) this.wordRegExps = [];

    // console.time('generateRegexpList'); // Benchmark - Call Time
    // console.count('generateRegexpList: words to filter'); // Benchmarking - Executaion Count
    if (this.cfg.filterMethod == 2) { // Special regexp for "Remove" filter, uses per-word matchMethods
      for (let x = 0; x < this.wordList.length; x++) {
        let repeat = this.cfg.repeatForWord(this.wordList[x]);
        if (this.cfg.words[this.wordList[x]].matchMethod == 0) { // If word matchMethod is exact
          this.wordRegExps.push(Word.buildRegexpForRemoveExact(this.wordList[x], repeat));
        } else if (this.cfg.words[this.wordList[x]].matchMethod == 4) { // If word matchMethod is RegExp
          this.wordRegExps.push(new RegExp(this.wordList[x], 'gi'));
        } else {
          this.wordRegExps.push(Word.buildRegexpForRemovePart(this.wordList[x], repeat));
        }
      }
    } else {
      switch(this.cfg.globalMatchMethod) {
        case 0: // Global: Exact match
          for (let x = 0; x < this.wordList.length; x++) {
            let repeat = this.cfg.repeatForWord(this.wordList[x]);
            this.wordRegExps.push(Word.buildExactRegexp(this.wordList[x], repeat));
          }
          break;
        case 2: // Global: Whole word match
          for (let x = 0; x < this.wordList.length; x++) {
            let repeat = this.cfg.repeatForWord(this.wordList[x]);
            this.wordRegExps.push(Word.buildWholeRegexp(this.wordList[x], repeat));
          }
          break;
        case 3: // Per-word matching
          for (let x = 0; x < this.wordList.length; x++) {
            let repeat = this.cfg.repeatForWord(this.wordList[x]);
            switch(this.cfg.words[this.wordList[x]].matchMethod) {
              case 0: // Exact match
                this.wordRegExps.push(Word.buildExactRegexp(this.wordList[x], repeat));
                break;
              case 2: // Whole word match
                this.wordRegExps.push(Word.buildWholeRegexp(this.wordList[x], repeat));
                break;
              case 4: // Regular Expression (Advanced)
                this.wordRegExps.push(new RegExp(this.wordList[x], 'gi'));
                break;
              default: // case 1 - Partial word match (Default)
              this.wordRegExps.push(Word.buildPartRegexp(this.wordList[x], repeat));
                break;
            }
          }
          break;
        default: // case 1 - Global: Partial word match (Default)
          for (let x = 0; x < this.wordList.length; x++) {
            let repeat = this.cfg.repeatForWord(this.wordList[x]);
            this.wordRegExps.push(Word.buildPartRegexp(this.wordList[x], repeat));
          }
          break;
      }
    }
    // console.timeEnd('generateRegexpList'); // Benchmark - Call Time
  }

  // Sort the words array by longest (most-specific) first
  // Config Dependencies: words
  generateWordList() {
    // Clean wordRegExps if there are already some present
    if (this.wordList.length > 0) this.wordList = null;

    this.wordList = Object.keys(this.cfg.words).sort(function(a, b) {
      return b.length - a.length;
    });
  }

  // Config Dependencies: filterMethod, wordList,
  // censorFixedLength, preserveFirst, preserveLast, censorCharacter
  // words, defaultSubstitution, preserveCase
  replaceText(str: string, stats = true): string {
    // console.count('replaceText'); // Benchmarking - Executaion Count
    let self = this;
    switch(self.cfg.filterMethod) {
      case 0: // Censor
        for (let z = 0; z < self.wordList.length; z++) {
          str = str.replace(self.wordRegExps[z], function(match, arg1, arg2, arg3, arg4, arg5): string {
            if (stats) { self.foundMatch(self.wordList[z]); }
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
        for (let z = 0; z < self.wordList.length; z++) {
          str = str.replace(self.wordRegExps[z], function(match, arg1, arg2, arg3, arg4, arg5): string {
            // console.log('Substitute match:', match, self.cfg.words[self.wordList[z]].words); // DEBUG
            if (stats) { self.foundMatch(self.wordList[z]); }
            if (self.wordRegExps[z].unicode) { match = arg2; } // Workaround for unicode word boundaries
            let sub = self.cfg.words[self.wordList[z]].sub || self.cfg.defaultSubstitution;

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
        for (let z = 0; z < self.wordList.length; z++) {
          str = str.replace(self.wordRegExps[z], function(match, arg1, arg2, arg3, arg4, arg5): string {
            // console.log('Remove match:', match, self.cfg.words[self.wordList[z]].words); // DEBUG
            // console.log('\nmatch: ', match, '\narg1: ', arg1, '\narg2: ', arg2, '\narg3: ', arg3, '\narg4: ', arg4, '\narg5: ', arg5); // DEBUG
            if (stats) { self.foundMatch(self.wordList[z]); }
            if (self.wordRegExps[z].unicode) {
              // Workaround for unicode word boundaries
              if (Word.whitespaceRegExp.test(arg1) && Word.whitespaceRegExp.test(arg3)) { // If both surrounds are whitespace (only need 1)
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
}