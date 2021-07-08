import Constants from './constants';
import Config from './config';

export default class Word {
  _filterMethod: number;
  escaped: string;
  lists: number[];
  matchMethod: number;
  matchRepeated: boolean;
  matchSeparators: boolean;
  regExp: RegExp;
  sub: string;
  unicode: boolean;
  value: string;

  private static readonly _edgePunctuationRegExp = /(^[,.'"!?%$]|[,.'"!?%$]$)/;
  private static readonly _escapeRegExp = /[\/\\^$*+?.()|[\]{}]/g;
  private static readonly _unicodeRegExp = /[^\u0000-\u00ff]/;
  private static readonly _unicodeWordBoundary = '[\\s.,\'"+!?|-]';
  static readonly nonWordRegExp = new RegExp('^\\s*[^\\w]+\\s*$', 'g');
  static readonly separatorsRegExp = '[-_ ]*';
  static readonly whitespaceRegExp = /^\s+$/;

  static allLowerCase(string: string): boolean {
    return string.toLowerCase() === string;
  }

  static allUpperCase(string: string): boolean {
    return string.toUpperCase() === string;
  }

  static capitalize(string: string): string {
    return string.charAt(0).toUpperCase() + string.substr(1);
  }

  static capitalized(string: string): boolean {
    return string.charAt(0).toUpperCase() === string.charAt(0);
  }

  static containsDoubleByte(str): boolean {
    if (!str.length) return false;
    if (str.charCodeAt(0) > 127) return true;
    return Word._unicodeRegExp.test(str);
  }

  // /[-\/\\^$*+?.()|[\]{}]/g
  // /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g
  // Removing '-' for '/пресс-релиз/, giu'
  static escapeRegExp(str: string): string {
    return str.replace(Word._escapeRegExp, '\\$&');
  }

  constructor(word: string, options: WordOptions, cfg: Config) {
    this.value = word;
    this.lists = options.lists === undefined ? [] : options.lists;
    this.matchMethod = options.matchMethod === undefined ? cfg.defaultWordMatchMethod : options.matchMethod;
    this.matchRepeated = options.repeat === undefined ? cfg.defaultWordRepeat : options.repeat;
    this.matchSeparators = options.separators === undefined ? cfg.defaultWordSeparators : options.separators;
    this.sub = options.sub === undefined ? cfg.defaultSubstitution : options.sub;
    this._filterMethod = options._filterMethod === undefined ? cfg.filterMethod : options._filterMethod;
    this.unicode = Word.containsDoubleByte(word);
    this.escaped = this.matchMethod === Constants.MATCH_METHODS.REGEX ? this.value : Word.escapeRegExp(this.value); // Don't escape a RegExp
    this.regExp = this.buildRegExp();
  }

  buildRegExp(): RegExp {
    try {
      switch(this.matchMethod) {
        case Constants.MATCH_METHODS.PARTIAL:
          if (this._filterMethod === Constants.FILTER_METHODS.REMOVE) {
            // Match entire word that contains sub-string and surrounding whitespace
            // /\s?\b[\w-]*word[\w-]*\b\s?/gi
            if (this.unicode) {
              // Work around for lack of word boundary support for unicode characters
              // /(^|[\s.,'"+!?|-]?)[\w-]*(word)[\w-]*([\s.,'"+!?|-]?|$)/giu
              return new RegExp('(^|' + Word._unicodeWordBoundary + '?)([\\w-]*' +  this.processedPhrase() + '[\\w-]*)(' + Word._unicodeWordBoundary + '?|$)', this.regexOptions());
            } else if (this.hasEdgePunctuation()) { // Begin or end with punctuation (not \w))
              return new RegExp('(^|\\s)([\\w-]*' +  this.processedPhrase() + '[\\w-]*)(\\s|$)', this.regexOptions());
            } else {
              return new RegExp('\\s?\\b[\\w-]*' +  this.processedPhrase() + '[\\w-]*\\b\\s?', this.regexOptions());
            }
          } else {
            // /word/gi
            return new RegExp(this.processedPhrase(), this.regexOptions());
          }
        case Constants.MATCH_METHODS.WHOLE:
          // /\b[\w-]*word[\w-]*\b/gi
          if (this.unicode) {
            // Work around for lack of word boundary support for unicode characters
            // (^|[\s.,'"+!?|-]*)([\S]*куче[\S]*)([\s.,'"+!?|-]*|$)/giu
            return new RegExp('(^|' + Word._unicodeWordBoundary + '*)([\\S]*' + this.processedPhrase() + '[\\S]*)(' + Word._unicodeWordBoundary + '*|$)', this.regexOptions());
          } else if (this.hasEdgePunctuation()) { // Begin or end with punctuation (not \w))
            return new RegExp('(^|\\s)([\\S]*' + this.processedPhrase() + '[\\S]*)(\\s|$)', this.regexOptions());
          } else {
            return new RegExp('\\b[\\w-]*' + this.processedPhrase() + '[\\w-]*\\b', this.regexOptions());
          }
        case Constants.MATCH_METHODS.REGEX:
          return new RegExp(this.value, this.regexOptions());
        case Constants.MATCH_METHODS.EXACT:
        default:
          // Match entire word that contains sub-string and surrounding whitespace
          // /\s?\bword\b\s?/gi
          if (this._filterMethod === Constants.FILTER_METHODS.REMOVE) {
            if (this.unicode) {
              // Work around for lack of word boundary support for unicode characters
              // /(^|[\s.,'"+!?|-])(word)([\s.,'"+!?|-]+|$)/giu
              return new RegExp('(^|' + Word._unicodeWordBoundary + ')(' + this.processedPhrase() + ')(' + Word._unicodeWordBoundary + '|$)', this.regexOptions());
            } else if (this.hasEdgePunctuation()) { // Begin or end with punctuation (not \w))
              return new RegExp('(^|\\s)(' + this.processedPhrase() + ')(\\s|$)', this.regexOptions());
            } else {
              return new RegExp('\\s?\\b' + this.processedPhrase() + '\\b\\s?', this.regexOptions());
            }
          } else {
            if (this.unicode) {
              // Work around for lack of word boundary support for unicode characters
              // /(^|[\s.,'"+!?|-]+)(word)([\s.,'"+!?|-]+|$)/giu
              return new RegExp('(^|' + Word._unicodeWordBoundary + '+)(' + this.processedPhrase() + ')(' + Word._unicodeWordBoundary + '+|$)', this.regexOptions());
            } else if (this.hasEdgePunctuation()) {
              // Begin or end with punctuation (not \w))
              return new RegExp('(^|\\s)(' + this.processedPhrase() + ')(\\s|$)', this.regexOptions());
            } else {
              // /\bword\b/gi
              return new RegExp('\\b' + this.processedPhrase() + '\\b', this.regexOptions());
            }
          }
      }
    } catch(e) {
      throw new Error('Failed to create RegExp for "' + this.value + '" - ' + e.name + ' ' + e.message);
    }
  }

  hasEdgePunctuation(): boolean { return Word._edgePunctuationRegExp.test(this.value); }

  processedPhrase(): string {
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
          val += Word.separatorsRegExp;
        }
      }
    }

    return val;
  }

  regexOptions() {
    let options = 'gi';
    if (this.unicode) { options += 'u'; }
    return options;
  }
}