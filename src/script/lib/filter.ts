import Constants from './constants';
import Word from './word';
import Wordlist from './wordlist';
import Config from './config';
import { randomArrayElement } from './helper';

export default class Filter {
  allowlist: string[];
  cfg: Config;
  counter: number;
  iAllowlist: string[];
  wordlistId: number;
  wordlists: { [name: string]: Wordlist };

  constructor() {
    this.allowlist = [];
    this.counter = 0;
    this.iAllowlist = [];
    this.wordlists = {};
  }

  buildWordlist(wordlistId: number | false, rebuild: boolean = false): number {
    if (wordlistId === false) {
      wordlistId = this.wordlistId;
    }

    // Generate a new wordlist if required
    if (rebuild || !this.wordlists[wordlistId]) {
      this.wordlists[wordlistId] = new Wordlist(this.cfg, wordlistId);
    }

    return wordlistId;
  }

  checkAllowlist(match: string, string: string, matchStartIndex: number, word: Word): boolean {
    const allowlistLength = this.allowlist.length;
    const iAllowlistLength = this.iAllowlist.length;

    if (allowlistLength || iAllowlistLength) {
      // Check for exact/whole match (match case)
      if (allowlistLength && this.allowlist.includes(match)) {
        return true;
      }

      // Check for exact/whole match (case insensitive)
      if (iAllowlistLength && this.iAllowlist.includes(match.toLowerCase())) {
        return true;
      }

      // Check for partial match (match may not contain the full allowlisted word)
      if (word.matchMethod === Constants.MATCH_METHODS.PARTIAL) {
        const wordOptions: WordOptions = {
          matchMethod: Constants.MATCH_METHODS.WHOLE,
          repeat: Constants.FALSE,
          separators: Constants.FALSE,
          sub: '',
        };
        const wholeWordRegExp = new Word(match, wordOptions, this.cfg).regExp;

        let result;
        while ((result = wholeWordRegExp.exec(string)) !== null) {
          const resultMatch = result.length == 4 ? result[2] : result[0];
          const resultIndex = result.length == 4 ? result.index + result[1].length : result.index;
          // Make sure this is the match we want to check
          if (resultIndex <= matchStartIndex && resultIndex + resultMatch.length >= matchStartIndex + match.length) {
            if (allowlistLength && this.allowlist.includes(resultMatch)) {
              return true;
            }
            if (iAllowlistLength && this.iAllowlist.includes(resultMatch.toLowerCase())) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  foundMatch(word?: Word, statsType?: string) {
    this.counter++;
  }

  init(wordlistId: number | false = false) {
    this.iAllowlist = this.cfg.iWordAllowlist;
    this.allowlist = this.cfg.wordAllowlist;
    if (this.wordlistId === undefined) {
      this.wordlistId = this.cfg.wordlistId == null ? Constants.ALL_WORDS_WORDLIST_ID : this.cfg.wordlistId;
    }
    this.buildWordlist(wordlistId);
  }

  matchData(wordlist: Wordlist, index: number, match: string, args: any[]) {
    const word = wordlist.find(index);
    const string = args.pop();
    const matchStartIndex = args.pop();
    const captureGroups = args;

    // (boundary)(match)(boundary): Used internally for several types of matches:
    // - Remove Filter
    // - Unicode word boundaries (workaround)
    // - Edge punctuation
    const internalCaptureGroups = captureGroups.length > 0 && word.matchMethod !== Constants.MATCH_METHODS.REGEX;
    if (internalCaptureGroups) {
      match = captureGroups[1];
    }

    return {
      word: word,
      string: string,
      match: match,
      matchStartIndex: matchStartIndex,
      captureGroups: captureGroups,
      internalCaptureGroups: internalCaptureGroups,
    };
  }

  rebuildWordlists() {
    Object.keys(this.wordlists).forEach((key) => {
      this.buildWordlist(parseInt(key), true);
    });
  }

  replaceText(
    str: string,
    wordlistId: number | false = false,
    statsType: string | null = Constants.STATS_TYPE_TEXT
  ): string {
    wordlistId = this.buildWordlist(wordlistId);
    const wordlist = this.wordlists[wordlistId];

    switch (this.cfg.filterMethod) {
      case Constants.FILTER_METHODS.OFF:
      case Constants.FILTER_METHODS.CENSOR:
        wordlist.regExps.forEach((regExp, index) => {
          str = str.replace(regExp, (originalMatch, ...args): string => {
            const { word, string, match, matchStartIndex, captureGroups, internalCaptureGroups } = this.matchData(
              wordlist,
              index,
              originalMatch,
              args
            );
            if (this.checkAllowlist(match, string, matchStartIndex, word)) {
              return match;
            } // Check for allowlisted match
            if (statsType) {
              this.foundMatch(word, statsType);
            }

            // Handle Unicode matches (including emojis)
            let processedMatch = match;
            const unicodeMatch = word.unicode || Word.containsDoubleByte(match);
            if (unicodeMatch) processedMatch = match.replace(Word.emojiRegExp, this.cfg.censorCharacter);

            // Filter
            let censoredString = '';
            const censorLength = this.cfg.censorFixedLength > 0 ? this.cfg.censorFixedLength : processedMatch.length;

            if (this.cfg.preserveFirst && this.cfg.preserveLast) {
              censoredString =
                processedMatch[0] + this.cfg.censorCharacter.repeat(censorLength - 2) + processedMatch.slice(-1);
            } else if (this.cfg.preserveFirst) {
              censoredString = processedMatch[0] + this.cfg.censorCharacter.repeat(censorLength - 1);
            } else if (this.cfg.preserveLast) {
              censoredString = this.cfg.censorCharacter.repeat(censorLength - 1) + processedMatch.slice(-1);
            } else {
              censoredString = this.cfg.censorCharacter.repeat(censorLength);
            }

            if (internalCaptureGroups) {
              censoredString = captureGroups[0] + censoredString + captureGroups[2];
            }
            return censoredString;
          });
        });
        break;
      case Constants.FILTER_METHODS.SUBSTITUTE:
        wordlist.regExps.forEach((regExp, index) => {
          str = str.replace(regExp, (originalMatch, ...args): string => {
            const { word, string, match, matchStartIndex, captureGroups, internalCaptureGroups } = this.matchData(
              wordlist,
              index,
              originalMatch,
              args
            );
            if (this.checkAllowlist(match, string, matchStartIndex, word)) {
              return match;
            } // Check for allowlisted match
            if (statsType) {
              this.foundMatch(word, statsType);
            }
            let sub = this.shuffleSubstitution(word.subs);

            // Support backreferences for REGEX match method (only checks for 1 capture group)
            if (word.matchMethod == Constants.MATCH_METHODS.REGEX && captureGroups.length && word.sub.includes('\\1')) {
              // Use captureGroup.toLowerCase() when not preserving case
              captureGroups.forEach((captureGroup, i) => {
                sub = sub.replace(`\\${i + 1}`, this.cfg.preserveCase ? captureGroup : captureGroup.toLowerCase());
              });

              if (this.cfg.substitutionMark) sub = '[' + sub + ']';
              return sub;
            }

            // Make substitution match case of original match
            if (word.case == Constants.FALSE && this.cfg.preserveCase) {
              if (Word.allUpperCase(match)) {
                sub = sub.toUpperCase();
              } else if (Word.eachWordCapitalized(match)) {
                sub = Word.capitalizeEachWord(sub);
              } else if (Word.firstCapitalized(match)) {
                sub = Word.capitalizeFirst(sub);
              }
            }

            if (this.cfg.substitutionMark) {
              sub = '[' + sub + ']';
            }

            if (internalCaptureGroups) {
              sub = captureGroups[0] + sub + captureGroups[2];
            }
            return sub;
          });
        });
        break;
      case Constants.FILTER_METHODS.REMOVE:
        wordlist.regExps.forEach((regExp, index) => {
          str = str.replace(regExp, (originalMatch, ...args): string => {
            const { word, string, match, matchStartIndex, captureGroups, internalCaptureGroups } = this.matchData(
              wordlist,
              index,
              originalMatch,
              args
            );
            if (this.checkAllowlist(match.trim(), string, matchStartIndex, word)) {
              return match;
            } // Check for allowlisted match
            if (statsType) {
              this.foundMatch(word, statsType);
            }

            // Filter
            if (internalCaptureGroups) {
              if (Word.whitespaceRegExp.test(captureGroups[0]) && Word.whitespaceRegExp.test(captureGroups[2])) {
                // If both surrounds are whitespace (only need 1)
                return captureGroups[0];
              } else if (Word.nonWordRegExp.test(captureGroups[0]) || Word.nonWordRegExp.test(captureGroups[2])) {
                // If there is more than just whitesapce (ex. ',')
                return (captureGroups[0] + captureGroups[2]).trim();
              } else {
                return '';
              }
            } else {
              // Don't remove both leading and trailing whitespace
              if (Word.whitespaceRegExp.test(match[0]) && Word.whitespaceRegExp.test(match[match.length - 1])) {
                return match[0];
              } else {
                return '';
              }
            }
          });
        });
        break;
    }

    return str;
  }

  replaceTextResult(
    str: string,
    wordlistId: number | false = false,
    statsType: string | null = Constants.STATS_TYPE_TEXT
  ): ReplaceTextResult {
    const result: ReplaceTextResult = {
      original: str,
      filtered: this.replaceText(str, wordlistId, statsType),
      modified: false,
    };
    result.modified = result.filtered != str;
    return result;
  }

  shuffleSubstitution(subs: string[]): string {
    return randomArrayElement(subs);
  }
}
