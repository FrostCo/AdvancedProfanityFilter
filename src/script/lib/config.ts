export default class Config {
  censorCharacter: string;
  censorFixedLength: number;
  defaultSubstitution: string;
  defaultWordMatchMethod: number;
  defaultWordRepeat: boolean;
  defaultWordSeparators: boolean;
  filterMethod: number;
  filterWordList: boolean;
  iWordWhitelist: string[];
  preserveCase: boolean;
  preserveFirst: boolean;
  preserveLast: boolean;
  showCounter: boolean;
  showSummary: boolean;
  substitutionMark: boolean;
  wordlistId: number;
  wordlists: string[];
  wordlistsEnabled: boolean;
  words: { [key: string]: WordOptions };
  wordWhitelist: string[];

  static readonly _allWordlists = ['All Words'];

  static readonly _defaults = {
    censorCharacter: '*',
    censorFixedLength: 0,
    defaultSubstitution: 'censored',
    defaultWordMatchMethod: 0,
    defaultWordRepeat: false,
    defaultWordSeparators: false,
    filterMethod: 1, // ['Censor', 'Substitute', 'Remove'];
    filterWordList: true,
    iWordWhitelist: [],
    preserveCase: true,
    preserveFirst: true,
    preserveLast: false,
    showCounter: true,
    showSummary: true,
    substitutionMark: false,
    wordlistId: 0,
    wordlists: ['Custom 1', 'Custom 2', 'Custom 3', 'Custom 4', 'Custom 5', 'Custom 6'],
    wordlistsEnabled: false,
    wordWhitelist: [],
  };

  static readonly _defaultWords: { [key: string]: WordOptions } = {
    'ass': { lists: [], matchMethod: 0, repeat: true, separators: false, sub: 'butt' },
    'asses': { lists: [], matchMethod: 0, repeat: false, separators: false, sub: 'butts' },
    'asshole': { lists: [], matchMethod: 1, repeat: true, separators: false, sub: 'jerk' },
    'badass': { lists: [], matchMethod: 1, repeat: true, separators: true, sub: 'cool' },
    'bastard': { lists: [], matchMethod: 1, repeat: true, separators: false, sub: 'idiot' },
    'bitch': { lists: [], matchMethod: 1, repeat: true, separators: false, sub: 'bench' },
    'cocksucker': { lists: [], matchMethod: 1, repeat: true, separators: true, sub: 'suckup' },
    'cunt': { lists: [], matchMethod: 1, repeat: true, separators: false, sub: 'expletive' },
    'dammit': { lists: [], matchMethod: 1, repeat: false, separators: true, sub: 'dangit' },
    'damn': { lists: [], matchMethod: 1, repeat: false, separators: false, sub: 'dang' },
    'dumbass': { lists: [], matchMethod: 1, repeat: true, separators: false, sub: 'idiot' },
    'fag': { lists: [], matchMethod: 0, repeat: true, separators: false, sub: 'gay' },
    'faggot': { lists: [], matchMethod: 1, repeat: true, separators: false, sub: 'gay' },
    'fags': { lists: [], matchMethod: 0, repeat: true, separators: false, sub: 'gays' },
    'fuck': { lists: [], matchMethod: 1, repeat: true, separators: true, sub: 'freak' },
    'goddammit': { lists: [], matchMethod: 1, repeat: true, separators: true, sub: 'dangit' },
    'hell': { lists: [], matchMethod: 0, repeat: false, separators: false, sub: 'heck' },
    'jackass': { lists: [], matchMethod: 1, repeat: true, separators: true, sub: 'jerk' },
    'nigga': { lists: [], matchMethod: 0, repeat: true, separators: false, sub: 'bruh' },
    'nigger': { lists: [], matchMethod: 0, repeat: true, separators: false, sub: 'man' },
    'niggers': { lists: [], matchMethod: 0, repeat: true, separators: false, sub: 'people' },
    'piss': { lists: [], matchMethod: 1, repeat: true, separators: false, sub: 'pee' },
    'pissed': { lists: [], matchMethod: 1, repeat: true, separators: false, sub: 'ticked' },
    'pussies': { lists: [], matchMethod: 0, repeat: true, separators: false, sub: 'softies' },
    'pussy': { lists: [], matchMethod: 0, repeat: true, separators: false, sub: 'softie' },
    'shit': { lists: [], matchMethod: 1, repeat: true, separators: false, sub: 'crap' },
    'slut': { lists: [], matchMethod: 1, repeat: true, separators: false, sub: 'tramp' },
    'tits': { lists: [], matchMethod: 1, repeat: true, separators: false, sub: 'chest' },
    'twat': { lists: [], matchMethod: 0, repeat: true, separators: false, sub: 'dumbo' },
    'twats': { lists: [], matchMethod: 0, repeat: true, separators: false, sub: 'dumbos' },
    'whore': { lists: [], matchMethod: 1, repeat: true, separators: false, sub: 'tramp' },
  };

  static readonly _filterMethodNames = ['Censor', 'Substitute', 'Remove'];
  static readonly _matchMethodNames = ['Exact', 'Partial', 'Whole', 'Regular-Expression'];
  static readonly _maxBytes = 6500;
  static readonly _maxWords = 100;
  static readonly _wordsPattern = /^_words\d+/;

  constructor(data: object = {}) {
    Object.assign(this, Config._defaults, data);
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
      let lists = [];
      if (this.wordlistsEnabled) {
        lists.push(this.wordlistId);
      }

      this.words[str] = {
        matchMethod: this.defaultWordMatchMethod,
        repeat: this.defaultWordRepeat,
        separators: this.defaultWordSeparators,
        lists: lists,
        sub: ''
      };
      return true;
    }
  }

  removeWord(str: string) {
    str = str.trim().toLowerCase();
    if (Object.keys(this.words).includes(str)) {
      delete this.words[str];
      return true;
    } else {
      return false;
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