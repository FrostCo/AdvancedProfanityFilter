import Constants from './constants';

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

  static readonly _allWordlists = ['All words'];

  static readonly _defaults = {
    censorCharacter: '*',
    censorFixedLength: 0,
    defaultSubstitution: 'censored',
    defaultWordMatchMethod: Constants.MATCH_METHODS.EXACT,
    defaultWordRepeat: false,
    defaultWordSeparators: false,
    filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
    filterWordList: true,
    iWordWhitelist: [],
    preserveCase: true,
    preserveFirst: true,
    preserveLast: false,
    showCounter: true,
    showSummary: true,
    substitutionMark: false,
    wordlistId: 0,
    wordlists: ['Wordlist 1', 'Wordlist 2', 'Wordlist 3', 'Wordlist 4', 'Wordlist 5', 'Wordlist 6'],
    wordlistsEnabled: true,
    wordWhitelist: [],
  };

  static readonly _defaultWords: { [key: string]: WordOptions } = {
    'ass': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'butt' },
    'asses': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: false, separators: false, sub: 'butts' },
    'asshole': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: false, sub: 'jerk' },
    'badass': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: true, sub: 'cool' },
    'bastard': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: false, sub: 'idiot' },
    'bitch': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: false, sub: 'bench' },
    'cocksucker': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: true, sub: 'suckup' },
    'cunt': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: false, sub: 'expletive' },
    'dammit': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: false, separators: true, sub: 'dangit' },
    'damn': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: false, separators: false, sub: 'dang' },
    'dumbass': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: false, sub: 'idiot' },
    'fag': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'gay' },
    'faggot': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: false, sub: 'gay' },
    'fags': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'gays' },
    'fuck': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: true, sub: 'freak' },
    'goddammit': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: true, sub: 'dangit' },
    'hell': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: false, separators: false, sub: 'heck' },
    'jackass': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: true, sub: 'jerk' },
    'nigga': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'bruh' },
    'nigger': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'man' },
    'niggers': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'people' },
    'piss': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: false, sub: 'pee' },
    'pissed': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: false, sub: 'ticked' },
    'pussies': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'softies' },
    'pussy': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'softie' },
    'shit': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: false, sub: 'crap' },
    'slut': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: false, sub: 'tramp' },
    'tits': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: false, sub: 'chest' },
    'twat': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'dumbo' },
    'twats': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'dumbos' },
    'whore': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: false, sub: 'tramp' },
  };

  constructor(data: Record<string, unknown> = {}) {
    Object.assign(this, Config._defaults, data);
  }

  addWord(str: string, options: WordOptions = this.defaultWordOptions()) {
    str = str.trim();
    options = Object.assign({}, this.defaultWordOptions(), options);

    if (options.matchMethod !== Constants.MATCH_METHODS.REGEX) {
      str = str.toLowerCase();
    }

    if (Object.keys(this.words).includes(str)) {
      return false; // Already exists
    } else {
      options.sub = options.sub.trim().toLowerCase();
      this.words[str] = options;
      return true;
    }
  }

  defaultWordOptions(): WordOptions {
    return {
      lists: [],
      matchMethod: this.defaultWordMatchMethod,
      repeat: this.defaultWordRepeat,
      separators: this.defaultWordSeparators,
      sub: '',
    };
  }

  removeWord(str: string) {
    str = str.trim();
    const lower = str.toLowerCase();

    if (Object.keys(this.words).includes(lower)) {
      delete this.words[lower];
      return true;
    } else if (this.words[str]) {
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
    const sanitizedWords = {};
    Object.keys(this.words).sort().forEach((key) => {
      sanitizedWords[key.trim().toLowerCase()] = this.words[key];
    });
    this.words = sanitizedWords;
  }
}