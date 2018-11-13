interface WordOptions {
  matchMethod: number;
  repeat: boolean;
  sub: string;
}

export default class Config {
  advancedDomains: string[];
  censorCharacter: string;
  censorFixedLength: number;
  defaultSubstitution: string;
  defaultWordMatchMethod: number;
  defaultWordRepeat: boolean;
  disabledDomains: string[];
  filterMethod: number;
  filterWordList: boolean;
  globalMatchMethod: number;
  password: string;
  preserveCase: boolean;
  preserveFirst: boolean;
  preserveLast: boolean;
  showCounter: boolean;
  showSummary: boolean;
  substitutionMark: boolean;
  words: {
    [key: string]: WordOptions;
  };

  // TODO: Finish removing magic numbers?
  static readonly filterMethods = {
    censor: 0,
    substitute: 1,
    remove: 2
  };

  static readonly matchMethods = {
    exact: 0,
    partial: 1,
    whole: 2,
    'Per-Word': 3,
    'RegExp': 4
  }

  static readonly _defaults = {
    advancedDomains: ['reddit.com'],
    censorCharacter: '*',
    censorFixedLength: 0,
    defaultSubstitution: 'censored',
    defaultWordMatchMethod: 0,
    defaultWordRepeat: false,
    disabledDomains: [],
    filterMethod: 0, // ['Censor', 'Substitute', 'Remove'];
    filterWordList: true,
    globalMatchMethod: 3, // ['Exact', 'Partial', 'Whole', 'Per-Word', 'RegExp']
    password: null,
    preserveCase: true,
    preserveFirst: true,
    preserveLast: false,
    showCounter: true,
    showSummary: true,
    substitutionMark: true
  };

  static readonly _defaultWords = {
    'ass': { matchMethod: 0, repeat: true, sub: 'butt' },
    'asses': { matchMethod: 0, repeat: false, sub: 'butts' },
    'asshole': { matchMethod: 1, repeat: true, sub: 'jerk' },
    'bastard': { matchMethod: 1, repeat: true, sub: 'jerk' },
    'bitch': { matchMethod: 1, repeat: true, sub: 'jerk' },
    'cunt': { matchMethod: 1, repeat: true, sub: 'explative' },
    'dammit': { matchMethod: 1, repeat: false, sub: 'dangit' },
    'damn': { matchMethod: 1, repeat: true, sub: 'dang' },
    'dumbass': { matchMethod: 1, repeat: true, sub: 'idiot' },
    'fuck': { matchMethod: 1, repeat: true, sub: 'fudge' },
    'hell': { matchMethod: 0, repeat: true, sub: 'heck' },
    'nigger': { matchMethod: 1, repeat: true, sub: 'explative' },
    'piss': { matchMethod: 1, repeat: true, sub: 'pee' },
    'pissed': { matchMethod: 1, repeat: true, sub: 'ticked' },
    'slut': { matchMethod: 1, repeat: true, sub: 'tramp' },
    'shit': { matchMethod: 1, repeat: true, sub: 'crap' },
    'tits': { matchMethod: 1, repeat: true, sub: 'explative' },
    'whore': { matchMethod: 1, repeat: true, sub: 'tramp' }
  };

  static readonly _filterMethodNames = ['Censor', 'Substitute', 'Remove'];
  static readonly _matchMethodNames = ['Exact', 'Partial', 'Whole', 'Per-Word', 'Regular-Expression'];
  static readonly _maxBytes = 6500;
  static readonly _maxWords = 100;
  static readonly _wordsPattern = /^_words\d+/;

  constructor(config) {
    if (typeof config === 'undefined') {
      throw new Error('Cannot be called directly. call build()');
    }
    for(let k in config) this[k]=config[k];
  }

  addWord(str: string, options?: WordOptions) {
    str = str.trim().toLowerCase();
    if (Object.keys(this.words).includes(str)) {
      return false; // Already exists
    } else if (options) {
      options.sub = options.sub.trim().toLowerCase();
      this.words[str] = options;
      return true;
    } else {
      this.words[str] = {matchMethod: this.defaultWordMatchMethod, repeat: this.defaultWordRepeat, sub: ''};
      return true;
    }
  }

  repeatForWord(word: string): boolean {
    if (this.words[word].repeat === true || this.words[word].repeat === false) {
      return this.words[word].repeat;
    } else {
      return this.defaultWordRepeat;
    }
  }

  sanitizeWords() {
    let sanitizedWords = {};
    Object.keys(this.words).sort().forEach((key) => {
      sanitizedWords[key.trim().toLowerCase()] = this.words[key];
    });
    this.words = sanitizedWords;
  }
}