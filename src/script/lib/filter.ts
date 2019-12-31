import Word from './word';
import Config from './config';

export class Filter {
  cfg: Config;
  counter: number;
  wordList: string[];
  wordRegExps: RegExp[];
  wordWhitelist: string[];

  constructor() {
    this.counter = 0;
    this.wordList = [];
    this.wordRegExps = [];
    this.wordWhitelist = [];
  }

  checkWhitelist(match, string, matchStartIndex, index): boolean {
    let self = this;
    if (self.wordWhitelist.length > 0) {
      if (self.wordWhitelist.includes(match)) { return true; }
      let word = Word.find(index);
      let partialWhiteList = true; // TODO: Expose this as an option?
      if (partialWhiteList) {
        if (word.matchMethod === 1) {
          let wordOptions: WordOptions = {
            matchMethod: 2,
            sub: word.sub,
            capital: word.matchCapitalized,
            repeat: word.matchRepeated
          };
          let wholeWordRegExp = new Word(match, wordOptions).buildRegexp();

          // let found = false;
          let result = wholeWordRegExp.exec(string);
          while (result) {
            let resultMatch = result.length == 4 ? result[2]: result[0];
            let resultIndex = result.length == 4 ? result.index + result[1].length: result.index;
            // Make sure this is the correct match
            if (
              resultIndex <= matchStartIndex
              && (resultIndex + resultMatch.length) >= (matchStartIndex + match.length)
            ) {
              if (self.wordWhitelist.includes(resultMatch)) { return true; }
            }
            result = wholeWordRegExp.exec(string);
          }
        }
      }
    }

    return false;
  }

  foundMatch(word) {
    this.counter++;
  }

  init() {
    let filterOptions = { filterMethod: this.cfg.filterMethod, globalMatchMethod: this.cfg.globalMatchMethod };
    let wordDefaults = {
      sub: this.cfg.defaultSubstitution,
      matchMethod: this.cfg.defaultWordMatchMethod,
      repeat: this.cfg.defaultWordRepeat
    };
    Word.initWords(this.cfg.words, filterOptions, wordDefaults);
    this.wordList = Word.list;
    this.wordRegExps = Word.regExps;
    this.wordWhitelist = this.cfg.wordWhitelist;
  }

  // Config Dependencies: filterMethod, wordList,
  // censorFixedLength, preserveFirst, preserveLast, censorCharacter
  // words, defaultSubstitution, preserveCase
  replaceText(str: string, stats: boolean = true): string {
    // console.count('replaceText'); // Benchmarking - Executaion Count
    let self = this;
    switch(self.cfg.filterMethod) {
      case 0: // Censor
        self.wordRegExps.forEach((regExp, index) => {
          str = str.replace(regExp, function(match, ...args): string {
            let string = args.pop();
            let matchStartIndex = args.pop();
            let captureGroups = args;
            let useCaptureGroups = captureGroups.length > 0;
            // Workaround for unicode word boundaries and regexp that use capture groups
            if (useCaptureGroups) { match = captureGroups[1]; }

            // Check for whitelisted match
            if (self.checkWhitelist(match, string, matchStartIndex, index)) {
              return match;
            }

            // Filter
            if (stats) { self.foundMatch(self.wordList[index]); }
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

            if (useCaptureGroups) { censoredString = captureGroups[0] + censoredString + captureGroups[2]; } // Workaround for unicode word boundaries
            // console.log('Censor match:', match, censoredString); // DEBUG
            return censoredString;
          });
        });
        break;
      case 1: // Substitute
        self.wordRegExps.forEach((regExp, index) => {
          str = str.replace(regExp, function(match, ...args): string {
            let string = args.pop();
            let matchStartIndex = args.pop();
            let captureGroups = args;
            let useCaptureGroups = captureGroups.length > 0;
            // Workaround for unicode word boundaries and regexp that use capture groups
            if (useCaptureGroups) { match = captureGroups[1]; }

            // Check for whitelisted match
            if (self.checkWhitelist(match, string, matchStartIndex, index)) {
              return match;
            }

            // Filter
            if (stats) { self.foundMatch(self.wordList[index]); }
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

            if (useCaptureGroups) { sub = captureGroups[0] + sub + captureGroups[2]; } // Workaround for unicode word boundaries
            // console.log('Substitute match:', match, sub); // DEBUG
            return sub;
          });
        });
        break;
      case 2: // Remove
        self.wordRegExps.forEach((regExp, index) => {
          str = str.replace(regExp, function(match, ...args): string {
            let string = args.pop();
            let matchStartIndex = args.pop();
            let captureGroups = args;
            let useCaptureGroups = captureGroups.length > 0;
            // Workaround for unicode word boundaries and regexp that use capture groups
            if (useCaptureGroups) { match = captureGroups[1]; }

            // Check for whitelisted match
            if (self.checkWhitelist(match.trim(), string, matchStartIndex, index)) {
              return match;
            }

            // Filter
            if (stats) { self.foundMatch(self.wordList[index]); }
            if (useCaptureGroups) {
              match = captureGroups[1];
              // Workaround for unicode word boundaries
              if (Word.whitespaceRegExp.test(captureGroups[0]) && Word.whitespaceRegExp.test(captureGroups[2])) { // If both surrounds are whitespace (only need 1)
                return captureGroups[0];
              } else if (Word.nonWordRegExp.test(captureGroups[0]) || Word.nonWordRegExp.test(captureGroups[2])) { // If there is more than just whitesapce (ex. ',')
                return (captureGroups[0] + captureGroups[2]).trim();
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
}