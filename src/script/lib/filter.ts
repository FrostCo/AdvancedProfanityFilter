import Word from './word';
import Wordlist from './wordlist';
import Config from './config';

export default class Filter {
  cfg: Config;
  counter: number;
  iWhitelist: string[];
  whitelist: string[];
  wordlistId: number;
  wordlists: { [name: string]: Wordlist };

  constructor() {
    this.counter = 0;
    this.iWhitelist = [];
    this.whitelist = [];
    this.wordlists = {};
  }

  buildWordlist(wordlistId: number | false): number {
    if (wordlistId === false) {
      wordlistId = this.wordlistId;
    }

    // Generate a new wordlist if required
    if (!this.wordlists[wordlistId]) {
      this.wordlists[wordlistId] = new Wordlist(this.cfg, wordlistId);
    }

    return wordlistId;
  }

  checkWhitelist(match, string, matchStartIndex, wordIndex, wordlistId): boolean {
    let self = this;
    let whitelistLength = self.whitelist.length;
    let iWhitelistLength = self.iWhitelist.length;

    if (whitelistLength || iWhitelistLength) {
      // Check for exact/whole match (match case)
      if (whitelistLength && self.whitelist.includes(match)) { return true; }

      // Check for exact/whole match (case insensitive)
      if (iWhitelistLength && self.iWhitelist.includes(match.toLowerCase())) { return true; }

      // Check for partial match (match may not contain the full whitelisted word)
      let word = this.wordlists[wordlistId].find(wordIndex);
      if (word.matchMethod === 1) {
        let wordOptions: WordOptions = {
          matchMethod: 2,
          repeat: false,
          separators: false,
          sub: ''
        };
        let wholeWordRegExp = new Word(match, wordOptions, this.cfg).regExp;

        let result;
        while ((result = wholeWordRegExp.exec(string)) !== null) {
          let resultMatch = result.length == 4 ? result[2]: result[0];
          let resultIndex = result.length == 4 ? result.index + result[1].length: result.index;
          // Make sure this is the match we want to check
          if (
            resultIndex <= matchStartIndex
            && (resultIndex + resultMatch.length) >= (matchStartIndex + match.length)
          ) {
            if (whitelistLength && self.whitelist.includes(resultMatch)) { return true; }
            if (iWhitelistLength && self.iWhitelist.includes(resultMatch.toLowerCase())) { return true; }
          }
        }
      }
    }

    return false;
  }

  foundMatch(word) {
    this.counter++;
  }

  init(wordlistId: number | false = false) {
    this.iWhitelist = this.cfg.iWordWhitelist;
    this.whitelist = this.cfg.wordWhitelist;
    if (this.wordlistId === undefined) { this.wordlistId = this.cfg.wordlistId || 0; }
    this.buildWordlist(wordlistId);
  }

  // Config Dependencies: filterMethod, wordlists,
  // censorFixedLength, preserveFirst, preserveLast, censorCharacter
  // words, defaultSubstitution, preserveCase
  replaceText(str: string, wordlistId: number | false = false, stats: boolean = true): string {
    // console.count('replaceText'); // Benchmarking - Executaion Count
    let self = this;

    wordlistId = self.buildWordlist(wordlistId);
    let regExps = self.wordlists[wordlistId].regExps;
    let wordlist = self.wordlists[wordlistId].list;

    switch(self.cfg.filterMethod) {
      case 0: // Censor
        regExps.forEach((regExp, index) => {
          str = str.replace(regExp, function(match, ...args): string {
            // TODO: This is getting repeated too much
            let string = args.pop();
            let matchStartIndex = args.pop();
            let captureGroups = args;
            let useCaptureGroups = captureGroups.length > 0;
            // Workaround for unicode word boundaries and regexp that use capture groups
            if (useCaptureGroups) { match = captureGroups[1]; }

            // Check for whitelisted match
            if (self.checkWhitelist(match, string, matchStartIndex, index, wordlistId)) {
              return match;
            }

            // Filter
            if (stats) { self.foundMatch(wordlist[index]); }
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
        regExps.forEach((regExp, index) => {
          str = str.replace(regExp, function(match, ...args): string {
            let string = args.pop();
            let matchStartIndex = args.pop();
            let captureGroups = args;
            let useCaptureGroups = captureGroups.length > 0;
            // Workaround for unicode word boundaries and regexp that use capture groups
            if (useCaptureGroups) { match = captureGroups[1]; }

            // Check for whitelisted match
            if (self.checkWhitelist(match, string, matchStartIndex, index, wordlistId)) {
              return match;
            }

            // Filter
            if (stats) { self.foundMatch(wordlist[index]); }
            let sub = self.cfg.words[wordlist[index]].sub || self.cfg.defaultSubstitution;

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
        regExps.forEach((regExp, index) => {
          str = str.replace(regExp, function(match, ...args): string {
            let string = args.pop();
            let matchStartIndex = args.pop();
            let captureGroups = args;
            let useCaptureGroups = captureGroups.length > 0;
            // Workaround for unicode word boundaries and regexp that use capture groups
            if (useCaptureGroups) { match = captureGroups[1]; }

            // Check for whitelisted match
            if (self.checkWhitelist(match.trim(), string, matchStartIndex, index, wordlistId)) {
              return match;
            }

            // Filter
            if (stats) { self.foundMatch(wordlist[index]); }
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

  replaceTextResult(str: string, wordlistId: (number | false) = false, stats: boolean = true): ReplaceTextResult {
    let result: ReplaceTextResult = {
      original: str,
      filtered: this.replaceText(str, wordlistId, stats),
      modified: false
    };
    result.modified = (result.filtered != str);
    return result;
  }
}