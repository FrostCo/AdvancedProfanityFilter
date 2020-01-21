export default class Word {
  escaped: string;
  matchMethod: number;
  matchRepeated: boolean;
  matchSeparators: boolean;
  sub: string;
  unicode: boolean;
  value: string;

  private static readonly _defaultFilterOptions = { filterMethod: 1, globalMatchMethod: 3 }
  private static readonly _defaultWordOptions = { matchMethod: 0, repeat: false, separators: false, sub: 'censored' };
  private static readonly _edgePunctuationRegExp = /(^[,.'"!?%$]|[,.'"!?%$]$)/;
  private static readonly _escapeRegExp = /[\/\\^$*+?.()|[\]{}]/g;
  private static readonly _unicodeRegExp = /[^\u0000-\u00ff]/;
  private static readonly _unicodeWordBoundary = '[\\s.,\'"+!?|-]';
  static readonly nonWordRegExp = new RegExp('^\\s*[^\\w]+\\s*$', 'g');
  static readonly separatorsRegExp = '[-_ ]*';
  static readonly whitespaceRegExp = /^\s+$/;

  static all = [];
  static defaultWordOptions = Word._defaultWordOptions;
  static filterMethod = Word._defaultFilterOptions.filterMethod;
  static globalMatchMethod = Word._defaultFilterOptions.globalMatchMethod;
  static list = [];
  static regExps = [];

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

  static find(value: string|number): Word {
    if (typeof value === 'string') {
      return Word.all[Word.list.indexOf(value)];
    } else if (typeof value === 'number') {
      return Word.all[value];
    }
  }

  static initWords(words, filterOptions: any = {}, wordDefaults = {}) {
    // Sort the words array by longest (most-specific) first
    Word.all = [];
    Word.list = [];
    Word.regExps = [];
    filterOptions = Object.assign(Word._defaultFilterOptions, filterOptions);
    Word.filterMethod = filterOptions.filterMethod;
    // Special regexp for "Remove" filter, uses per-word matchMethods
    Word.globalMatchMethod = Word.filterMethod === 2 ? Word.globalMatchMethod = 3 : filterOptions.globalMatchMethod;
    Word.defaultWordOptions = Object.assign(Word._defaultWordOptions, wordDefaults);

    Word.list = Object.keys(words).sort((a, b) => {
      return b.length - a.length;
    });

    Word.list.forEach(word => {
      let instance = new Word(word, words[word]);
      Word.all.push(instance);
      Word.regExps.push(instance.buildRegexp());
    });
  }

  constructor(word: string, options: WordOptions) {
    this.value = word;
    this.matchMethod = Word.globalMatchMethod === 3 ? options.matchMethod : Word.globalMatchMethod;
    this.matchRepeated = options.repeat === undefined ? Word.defaultWordOptions.repeat : options.repeat;
    this.matchSeparators = options.separators === undefined ? Word.defaultWordOptions.separators : options.separators;
    this.sub = options.sub == null ? Word.defaultWordOptions.sub : options.sub;
    this.unicode = Word.containsDoubleByte(word);
    if (this.matchMethod === undefined) { Word.defaultWordOptions.matchMethod; }
    this.escaped = Word.escapeRegExp(this.value);
  }

  // Word must match exactly (not sub-string)
  // /\bword\b/gi
  buildRegexp(): RegExp {
    let word = this;
    try {
      switch(word.matchMethod) {
        case 0: // Exact: Word must match exactly (not sub-string)
          // Filter Method: Remove
          // Match entire word that contains sub-string and surrounding whitespace
          // /\s?\bword\b\s?/gi
          if (Word.filterMethod === 2) { // Remove method
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
          if (Word.filterMethod === 2) { // Filter Method: Remove
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