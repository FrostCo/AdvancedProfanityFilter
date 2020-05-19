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
    this.escaped = Word.escapeRegExp(this.value);
    this.regExp = this.buildRegExp();
  }

  // Word must match exactly (not sub-string)
  // /\bword\b/gi
  buildRegExp(): RegExp {
    let word = this;
    try {
      switch(word.matchMethod) {
        case 0: // Exact: Word must match exactly (not sub-string)
          // Filter Method: Remove
          // Match entire word that contains sub-string and surrounding whitespace
          // /\s?\bword\b\s?/gi
          if (word._filterMethod === 2) { // Remove method
            if (word.unicode) {
              // Work around for lack of word boundary support for unicode characters
              // /(^|[\s.,'"+!?|-])(word)([\s.,'"+!?|-]+|$)/giu
              return new RegExp('(^|' + Word._unicodeWordBoundary + ')(' + word.processedPhrase() + ')(' + Word._unicodeWordBoundary + '|$)', word.regexOptions());
            } else if (word.hasEdgePunctuation()) { // Begin or end with punctuation (not \w))
              return new RegExp('(^|\\s)(' + word.processedPhrase() + ')(\\s|$)', word.regexOptions());
            } else {
              return new RegExp('\\s?\\b' + word.processedPhrase() + '\\b\\s?', word.regexOptions());
            }
          } else {
            if (word.unicode) {
              // Work around for lack of word boundary support for unicode characters
              // /(^|[\s.,'"+!?|-]+)(word)([\s.,'"+!?|-]+|$)/giu
              return new RegExp('(^|' + Word._unicodeWordBoundary + '+)(' + word.processedPhrase() + ')(' + Word._unicodeWordBoundary + '+|$)', word.regexOptions());
            } else if (word.hasEdgePunctuation()) {
              // Begin or end with punctuation (not \w))
              return new RegExp('(^|\\s)(' + word.processedPhrase() + ')(\\s|$)', word.regexOptions());
            } else {
              return new RegExp('\\b' + word.processedPhrase() + '\\b', word.regexOptions());
            }
          }
        case 2: // Whole: Match entire word that contains sub-string
          // /\b[\w-]*word[\w-]*\b/gi
          if (word.unicode) {
            // Work around for lack of word boundary support for unicode characters
            // (^|[\s.,'"+!?|-]*)([\S]*куче[\S]*)([\s.,'"+!?|-]*|$)/giu
            return new RegExp('(^|' + Word._unicodeWordBoundary + '*)([\\S]*' + word.processedPhrase() + '[\\S]*)(' + Word._unicodeWordBoundary + '*|$)', word.regexOptions());
          } else if (word.hasEdgePunctuation()) { // Begin or end with punctuation (not \w))
            return new RegExp('(^|\\s)([\\S]*' + word.processedPhrase() + '[\\S]*)(\\s|$)', word.regexOptions());
          } else {
            return new RegExp('\\b[\\w-]*' + word.processedPhrase() + '[\\w-]*\\b', word.regexOptions());
          }
        case 4: // Regular Expression (Advanced)
          return new RegExp(word.value, word.regexOptions());
        case 1: // Partial: Match any part of a word (sub-string)
        default:
          if (word._filterMethod === 2) { // Filter Method: Remove
            // Match entire word that contains sub-string and surrounding whitespace
            // /\s?\b[\w-]*word[\w-]*\b\s?/gi
            if (word.unicode) {
              // Work around for lack of word boundary support for unicode characters
              // /(^|[\s.,'"+!?|-]?)[\w-]*(word)[\w-]*([\s.,'"+!?|-]?|$)/giu
              return new RegExp('(^|' + Word._unicodeWordBoundary + '?)([\\w-]*' +  word.processedPhrase() + '[\\w-]*)(' + Word._unicodeWordBoundary + '?|$)', word.regexOptions());
            } else if (word.hasEdgePunctuation()) { // Begin or end with punctuation (not \w))
              return new RegExp('(^|\\s)([\\w-]*' +  word.processedPhrase() + '[\\w-]*)(\\s|$)', word.regexOptions());
            } else {
              return new RegExp('\\s?\\b[\\w-]*' +  word.processedPhrase() + '[\\w-]*\\b\\s?', word.regexOptions());
            }
          } else {
            // /word/gi
            return new RegExp(word.processedPhrase(), word.regexOptions());
          }
      }
    } catch(e) {
      throw new Error('Failed to create RegExp for "' + word.value + '" - ' + e.name + ' ' + e.message);
    }
  }

  hasEdgePunctuation(): boolean { return Word._edgePunctuationRegExp.test(this.value); }

  processedPhrase(): string {
    let word = this;
    let isEscaped = word.escaped.includes('\\');

    let val = '';
    let lastCharIndex = word.escaped.length - 1;
    for (let i = 0; i < word.escaped.length; i++) {
      // If the current character is a '\', add it and then move to next character
      if (isEscaped && word.escaped[i] === '\\') {
        val += word.escaped[i];
        i++;
      }

      // Add the current character
      val += word.escaped[i];

      // Repeating characters
      // Word: /w+o+r+d+/g
      if (word.matchRepeated) {
        val += '+';
      }

      // Character separators
      // Word: /w[-_]*o[-_]*r[-_]*d*/g
      if (word.matchSeparators) {
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