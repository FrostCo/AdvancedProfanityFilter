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
            if (stats) { self.foundMatch(self.wordList[index]); }
            let useCaptureGroups = (args.length > 2);
            // let string = args.pop();
            // let offset = args.pop();
            // let captureGroups = args;
            // Workaround for unicode word boundaries and regexp that use capture groups
            if (useCaptureGroups) { match = args[1]; }

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

            if (useCaptureGroups) { censoredString = args[0] + censoredString + args[2]; } // Workaround for unicode word boundaries
            // console.log('Censor match:', match, censoredString); // DEBUG
            return censoredString;
          });
        });
        break;
      case 1: // Substitute
        self.wordRegExps.forEach((regExp, index) => {
          str = str.replace(regExp, function(match, ...args): string {
            if (stats) { self.foundMatch(self.wordList[index]); }
            // Workaround for unicode word boundaries and regexp that use capture groups
            let useCaptureGroups = (args.length > 2);
            if (useCaptureGroups) { match = args[1]; }
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

            if (useCaptureGroups) { sub = args[0] + sub + args[2]; } // Workaround for unicode word boundaries
            // console.log('Substitute match:', match, sub); // DEBUG
            return sub;
          });
        });
        break;
      case 2: // Remove
        self.wordRegExps.forEach((regExp, index) => {
          str = str.replace(regExp, function(match, ...args): string {
            if (stats) { self.foundMatch(self.wordList[index]); }
            // Workaround for unicode word boundaries and regexp that use capture groups
            let useCaptureGroups = (args.length > 2);
            if (useCaptureGroups) { match = args[1]; }

            if (useCaptureGroups) {
              // Workaround for unicode word boundaries
              if (Word.whitespaceRegExp.test(args[0]) && Word.whitespaceRegExp.test(args[2])) { // If both surrounds are whitespace (only need 1)
                return args[0];
              } else if (Word.nonWordRegExp.test(args[0]) || Word.nonWordRegExp.test(args[2])) { // If there is more than just whitesapce (ex. ',')
                return (args[0] + args[2]).trim();
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