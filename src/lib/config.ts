export default class Config {
  advancedDomains: string[];
  censorCharacter: string;
  censorFixedLength: number;
  defaultSubstitutions: string[];
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
  wordList: string[];
  words: {
    [key: string]: {
      matchMethod: number;
      repeat: boolean;
      words: string[];
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
    advancedDomains: [],
    censorCharacter: '*',
    censorFixedLength: 0,
    defaultSubstitutions: ['censored', 'expletive', 'filtered'],
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
    'ass': { matchMethod: 0, repeat: true, words: ['butt', 'tail'] },
    'asses': { matchMethod: 0, repeat: false, words: ['butts'] },
    'asshole': { matchMethod: 1, repeat: true, words: ['butthole', 'jerk'] },
    'bastard': { matchMethod: 1, repeat: true, words: ['imperfect', 'impure'] },
    'bitch': { matchMethod: 1, repeat: true, words: ['jerk'] },
    'cunt': { matchMethod: 1, repeat: true, words: ['explative'] },
    'dammit': { matchMethod: 1, repeat: true, words: ['dangit'] },
    'damn': { matchMethod: 1, repeat: true, words: ['dang', 'darn'] },
    'dumbass': { matchMethod: 0, repeat: true, words: ['idiot'] },
    'fuck': { matchMethod: 1, repeat: true, words: ['freak', 'fudge'] },
    'hell': { matchMethod: 0, repeat: true, words: ['heck'] },
    'piss': { matchMethod: 1, repeat: true, words: ['pee'] },
    'pissed': { matchMethod: 0, repeat: true, words: ['ticked'] },
    'slut': { matchMethod: 1, repeat: true, words: ['imperfect', 'impure'] },
    'shit': { matchMethod: 1, repeat: true, words: ['crap', 'crud', 'poop'] },
    'tits': { matchMethod: 1, repeat: true, words: ['explative'] },
    'whore': { matchMethod: 1, repeat: true, words: ['harlot', 'tramp'] }
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
      this.words[str] = {matchMethod: this.defaultWordMatchMethod, repeat: this.defaultWordRepeat, words: []};
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