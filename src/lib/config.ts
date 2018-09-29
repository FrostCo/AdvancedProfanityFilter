export default class Config {
  advancedDomains: string[];
  censorCharacter: string;
  censorFixedLength: number;
  defaultSubstitution: string;
  defaultWordMatchMethod: number;
  defaultWordRepeat: boolean;
  disabledDomains: string[];
  filterMethod: number;
  globalMatchMethod: number;
  password: string;
  preserveCase: boolean;
  preserveFirst: boolean;
  preserveLast: boolean;
  showCounter: boolean;
  substitutionMark: boolean;
  words: {
    [key: string]: {
      matchMethod: number;
      repeat: boolean;
      sub: string;
    }
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
    globalMatchMethod: 3, // ['Exact', 'Partial', 'Whole', 'Per-Word', 'RegExp']
    password: null,
    preserveCase: true,
    preserveFirst: true,
    preserveLast: false,
    showCounter: true,
    substitutionMark: true
  };

  static readonly _defaultWords = {
    'ass': { matchMethod: 0, repeat: true, sub: 'butt' },
    'asses': { matchMethod: 0, repeat: false, sub: 'butts' },
    'asshole': { matchMethod: 1, repeat: true, sub: 'jerk' },
    'bastard': { matchMethod: 1, repeat: true, sub: 'jerk' },
    'bitch': { matchMethod: 1, repeat: true, sub: 'jerk' },
    'cunt': { matchMethod: 1, repeat: true, sub: 'explative' },
    'dammit': { matchMethod: 1, repeat: true, sub: 'dangit' },
    'damn': { matchMethod: 1, repeat: true, sub: 'dang' },
    'dumbass': { matchMethod: 1, repeat: true, sub: 'idiot' },
    'fuck': { matchMethod: 1, repeat: true, sub: 'fudge' },
    'hell': { matchMethod: 0, repeat: true, sub: 'heck' },
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

  addWord(str: string) {
    str = str.trim().toLowerCase();
    if (Object.keys(this.words).includes(str)) {
      return false; // Already exists
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