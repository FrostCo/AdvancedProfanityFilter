import Word from './word';
import Config from './config';

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
    let self = this;
    self.wordRegExps = [];

    // console.time('generateRegexpList'); // Benchmark - Call Time
    // console.count('generateRegexpList: words to filter'); // Benchmarking - Executaion Count
    if (self.cfg.filterMethod == 2) { // Special regexp for "Remove" filter, uses per-word matchMethods
      self.wordList.forEach(word => {
        let repeat = self.cfg.repeatForWord(word);

        if (self.cfg.words[word].matchMethod == 0) { // If word matchMethod is exact
          self.wordRegExps.push(Word.buildRegexpForRemoveExact(word, repeat));
        } else if (self.cfg.words[word].matchMethod == 4) { // If word matchMethod is RegExp
          self.wordRegExps.push(new RegExp(word, 'gi'));
        } else {
          self.wordRegExps.push(Word.buildRegexpForRemovePart(word, repeat));
        }
      });
    } else {
      switch(self.cfg.globalMatchMethod) {
        case 0: // Global: Exact match
          self.wordList.forEach(word => {
            let repeat = self.cfg.repeatForWord(word);
            self.wordRegExps.push(Word.buildExactRegexp(word, repeat));
          });
          break;
        case 2: // Global: Whole word match
          self.wordList.forEach(word => {
            let repeat = self.cfg.repeatForWord(word);
            self.wordRegExps.push(Word.buildWholeRegexp(word, repeat));
          });
          break;
        case 3: // Per-word matching
          self.wordList.forEach(word => {
            let repeat = self.cfg.repeatForWord(word);
            switch(self.cfg.words[word].matchMethod) {
              case 0: self.wordRegExps.push(Word.buildExactRegexp(word, repeat)); break; // Exact match
              case 2: self.wordRegExps.push(Word.buildWholeRegexp(word, repeat)); break; // Whole word match
              case 4: self.wordRegExps.push(new RegExp(word, 'gi')); break; // Regular Expression (Advanced)
              default: self.wordRegExps.push(Word.buildPartRegexp(word, repeat)); break; // case 1 - Partial word match (Default)
            }
          });
          break;
        default: // case 1 - Global: Partial word match (Default)
          self.wordList.forEach(word => {
            let repeat = self.cfg.repeatForWord(word);
            self.wordRegExps.push(Word.buildPartRegexp(word, repeat));
          });
          break;
      }
    }
    // console.timeEnd('generateRegexpList'); // Benchmark - Call Time
  }

  // Sort the words array by longest (most-specific) first
  // Config Dependencies: words
  generateWordList() {
    this.wordList = null;
    this.wordList = Object.keys(this.cfg.words).sort((a, b) => {
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
        self.wordRegExps.forEach((regExp, index) => {
          str = str.replace(regExp, function(match, arg1, arg2, arg3, arg4, arg5): string {
            if (stats) { self.foundMatch(self.wordList[index]); }
            if (regExp.unicode) { match = arg2; } // Workaround for unicode word boundaries
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

            if (regExp.unicode) { censoredString = arg1 + censoredString + arg3; } // Workaround for unicode word boundaries
            // console.log('Censor match:', match, censoredString); // DEBUG
            return censoredString;
          });
        });
        break;
      case 1: // Substitute
        self.wordRegExps.forEach((regExp, index) => {
          str = str.replace(regExp, function(match, arg1, arg2, arg3, arg4, arg5): string {
            if (stats) { self.foundMatch(self.wordList[index]); }
            if (regExp.unicode) { match = arg2; } // Workaround for unicode word boundaries
            let sub = self.cfg.words[self.wordList[index]].sub || self.cfg.defaultSubstitution;

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

            if (regExp.unicode) { sub = arg1 + sub + arg3; } // Workaround for unicode word boundaries
            // console.log('Substitute match:', match, sub); // DEBUG
            return sub;
          });
        });
        break;
      case 2: // Remove
        self.wordRegExps.forEach((regExp, index) => {
          str = str.replace(regExp, function(match, arg1, arg2, arg3, arg4, arg5): string {
            // console.log('\nmatch: ', match, '\narg1: ', arg1, '\narg2: ', arg2, '\narg3: ', arg3, '\narg4: ', arg4, '\narg5: ', arg5); // DEBUG
            if (stats) { self.foundMatch(self.wordList[index]); }
            if (regExp.unicode) {
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
              if (Word.whitespaceRegExp.test(match[0]) && Word.whitespaceRegExp.test(match[match.length - 1])) {
                return match[0];
              } else {
                // console.log('Remove match:', match); // DEBUG
                return '';
              }
            }
          });
        });
        break;
    }

    return str;
  }

  init() {
    this.generateWordList();
    this.generateRegexpList();
  }
}