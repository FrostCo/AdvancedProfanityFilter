import Constants from './Constants';
import Config from './Config';

export default class Word {
  _filterMethod: number;
  case?: number;
  escaped: string;
  lists: number[];
  matchMethod: number;
  matchRepeated: number;
  matchSeparators: number;
  regExp: RegExp;
  sub: string;
  subs: string[];
  unicode: boolean;
  value: string;

  private static readonly _edgePunctuationRegExp =
    /(^[,.'"`!@#$%^&*?:;+~_=()[\]{}<>|\\/-]|[,.'"`!@#$%^&*?:;+~_=()[\]{}<>|\\/-]$)/;
  private static readonly _escapeRegExp = /[\/\\^$*+?.()|[\]{}]/g;
  private static readonly _unicodeRegExp = /[^\u0000-\u00ff]/;
  private static readonly _unicodeWordBoundary = '[\\s.,\'"+!?|-]';
  static readonly emojiRegExp =
    /(?![*#0-9]+)[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]/gu;
  static readonly nonWordRegExp = /^\s*[^\w]+\s*$/g;
  static readonly separatorsPattern = '[-_ ]*';
  static readonly whitespaceRegExp = /^\s+$/;

  static allLowerCase(string: string): boolean {
    return string.toLowerCase() === string;
  }

  static allUpperCase(string: string): boolean {
    return string.toUpperCase() === string;
  }

  // Note: Requires the input string to be all lower case
  static capitalizeEachWord(string: string): string {
    const split = string.split(/[-_ ]+/i);
    split.forEach((word) => {
      string = string.replace(word, this.capitalizeFirst(word));
    });
    return string;
  }

  static capitalizeFirst(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  static containsDoubleByte(str): boolean {
    if (!str.length) return false;
    if (str.charCodeAt(0) > 127) return true;
    return Word._unicodeRegExp.test(str);
  }

  static eachWordCapitalized(string: string): boolean {
    const split = string.split(/[-_ ]+/i);
    return split.every((word) => this.firstCapitalized(word));
  }

  // /[-\/\\^$*+?.()|[\]{}]/g
  // /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g
  // Removing '-' for '/пресс-релиз/, giu'
  static escapeRegExp(str: string): string {
    return str.replace(Word._escapeRegExp, '\\$&');
  }

  static firstCapitalized(string: string): boolean {
    const firstChar = string.charAt(0);
    return firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();
  }

  constructor(word: string, options: WordOptions, cfg: Config) {
    this.value = word;
    this.case = options.case > Constants.FALSE ? Constants.TRUE : Constants.FALSE;
    this.lists = options.lists === undefined ? [] : options.lists;
    this.matchMethod = options.matchMethod === undefined ? cfg.defaultWordMatchMethod : options.matchMethod;
    this.matchRepeated = options.repeat === undefined ? cfg.defaultWordRepeat : options.repeat;
    this.matchSeparators = options.separators === undefined ? cfg.defaultWordSeparators : options.separators;
    this.sub = options.sub || cfg.defaultSubstitution;
    this.subs = this.sub.split(cfg.wordSubSeparator);
    this._filterMethod = options._filterMethod === undefined ? cfg.filterMethod : options._filterMethod;
    this.unicode = Word.containsDoubleByte(word);
    this.escaped = this.matchMethod === Constants.MATCH_METHODS.REGEX ? this.value : Word.escapeRegExp(this.value); // Don't escape a RegExp
    this.regExp = this.buildRegExp();
  }

  buildRegExp(): RegExp {
    try {
      switch (this.matchMethod) {
        case Constants.MATCH_METHODS.PARTIAL:
          if (this._filterMethod === Constants.FILTER_METHODS.REMOVE) {
            // Match entire word that contains sub-string and surrounding whitespace
            // /\s?\b[\w-]*word[\w-]*\b\s?/gi
            if (this.unicode) {
              // Work around for lack of word boundary support for unicode characters
              // /(^|[\s.,'"+!?|-]?)[\w-]*(word)[\w-]*([\s.,'"+!?|-]?|$)/giu
              return new RegExp(
                `(^|${Word._unicodeWordBoundary}?)([\\w-]*${this.processedPhrase}[\\w-]*)(${Word._unicodeWordBoundary}?|$)`,
                this.regexOptions
              );
            } else if (this.hasEdgePunctuation) {
              // Begin or end with punctuation (not \w))
              return new RegExp(`(^|\\s)([\\w-]*${this.processedPhrase}[\\w-]*)(\\s|$)`, this.regexOptions);
            } else {
              return new RegExp(`\\s?\\b[\\w-]*${this.processedPhrase}[\\w-]*\\b\\s?`, this.regexOptions);
            }
          } else {
            // /word/gi
            return new RegExp(this.processedPhrase, this.regexOptions);
          }
        case Constants.MATCH_METHODS.WHOLE:
          // /\b[\w-]*word[\w-]*\b/gi
          if (this.unicode) {
            // Work around for lack of word boundary support for unicode characters
            // (^|[\s.,'"+!?|-]*)([\S]*куче[\S]*)([\s.,'"+!?|-]*|$)/giu
            return new RegExp(
              `(^|${Word._unicodeWordBoundary}*)([\\S]*${this.processedPhrase}[\\S]*)(${Word._unicodeWordBoundary}*|$)`,
              this.regexOptions
            );
          } else if (this.hasEdgePunctuation) {
            // Begin or end with punctuation (not \w))
            return new RegExp(`(^|\\s)([\\S]*${this.processedPhrase}[\\S]*)(\\s|$)`, this.regexOptions);
          } else {
            return new RegExp(`\\b[\\w-]*${this.processedPhrase}[\\w-]*\\b`, this.regexOptions);
          }
        case Constants.MATCH_METHODS.REGEX:
          return new RegExp(this.value, this.regexOptions);
        case Constants.MATCH_METHODS.EXACT:
        default:
          // If begins or ends with '-', mark unicode to work around word boundaries
          if (!this.unicode) {
            if (this.value[0] == '-' || this.value[this.value.length - 1] == '-') {
              this.unicode = true;
            }
          }

          // Match entire word that contains sub-string and surrounding whitespace
          // /\s?\bword\b\s?/gi
          if (this._filterMethod === Constants.FILTER_METHODS.REMOVE) {
            if (this.unicode) {
              // Work around for lack of word boundary support for unicode characters
              // /(^|[\s.,'"+!?|-])(word)([\s.,'"+!?|-]+|$)/giu
              return new RegExp(
                `(^|${Word._unicodeWordBoundary})(${this.processedPhrase})(${Word._unicodeWordBoundary}|$)`,
                this.regexOptions
              );
            } else if (this.hasEdgePunctuation) {
              // Begin or end with punctuation (not \w))
              return new RegExp(`(^|\\s)(${this.processedPhrase})(\\s|$)`, this.regexOptions);
            } else {
              return new RegExp(`\\s?\\b${this.processedPhrase}\\b\\s?`, this.regexOptions);
            }
          } else {
            if (this.unicode) {
              // Work around for lack of word boundary support for unicode characters
              // /(^|[\s.,'"+!?|-]+)(word)([\s.,'"+!?|-]+|$)/giu
              return new RegExp(
                `(^|${Word._unicodeWordBoundary}+)(${this.processedPhrase})(${Word._unicodeWordBoundary}+|$)`,
                this.regexOptions
              );
            } else if (this.hasEdgePunctuation) {
              // Begin or end with punctuation (not \w))
              return new RegExp(`(^|\\s)(${this.processedPhrase})(\\s|$)`, this.regexOptions);
            } else {
              // /\bword\b/gi
              return new RegExp(`\\b${this.processedPhrase}\\b`, this.regexOptions);
            }
          }
      }
    } catch (err) {
      throw new Error(`Failed to create RegExp for '${this.value}'. [${err.name}: ${err.message}]`);
    }
  }

  get hasEdgePunctuation(): boolean {
    return Word._edgePunctuationRegExp.test(this.value);
  }

  get processedPhrase(): string {
    const isEscaped = this.escaped.includes('\\');

    let val = '';
    const lastCharIndex = this.escaped.length - 1;
    for (let i = 0; i < this.escaped.length; i++) {
      // If the current character is a '\', add it and then move to next character
      if (isEscaped && this.escaped[i] === '\\') {
        val += this.escaped[i];
        i++;
      }

      // Add the current character
      val += this.escaped[i];

      // Repeating characters
      // Word: /w+o+r+d+/g
      if (this.matchRepeated) {
        val += '+';
      }

      // Character separators
      // Word: /w[-_]*o[-_]*r[-_]*d*/g
      if (this.matchSeparators) {
        if (i != lastCharIndex) {
          val += Word.separatorsPattern;
        }
      }
    }

    return val;
  }

  get regexOptions(): string {
    let options = 'gi';
    if (this.unicode) {
      options += 'u';
    }
    return options;
  }
}
