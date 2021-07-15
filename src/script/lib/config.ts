import Constants from './constants';

export default class Config {
  censorCharacter: string;
  censorFixedLength: number;
  defaultSubstitution: string;
  defaultWordMatchMethod: number;
  defaultWordRepeat: number;
  defaultWordSeparators: number;
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
    defaultWordRepeat: Constants.FALSE,
    defaultWordSeparators: Constants.FALSE,
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
    'ass': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'butt' },
    'asses': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.FALSE, separators: Constants.FALSE, sub: 'butts' },
    'asshole': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'jerk' },
    'badass': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.TRUE, sub: 'cool' },
    'bastard': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'idiot' },
    'bitch': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'bench' },
    'cocksucker': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.TRUE, sub: 'suckup' },
    'cunt': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'expletive' },
    'dammit': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.FALSE, separators: Constants.TRUE, sub: 'dangit' },
    'damn': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.FALSE, separators: Constants.FALSE, sub: 'dang' },
    'dumbass': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'idiot' },
    'fag': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'gay' },
    'faggot': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'gay' },
    'fags': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'gays' },
    'fuck': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.TRUE, sub: 'freak' },
    'goddammit': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.TRUE, sub: 'dangit' },
    'hell': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.FALSE, separators: Constants.FALSE, sub: 'heck' },
    'jackass': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.TRUE, sub: 'jerk' },
    'nigga': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'bruh' },
    'nigger': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'man' },
    'niggers': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'people' },
    'piss': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'pee' },
    'pissed': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'ticked' },
    'pussies': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'softies' },
    'pussy': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'softie' },
    'shit': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'crap' },
    'slut': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'tramp' },
    'tits': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'chest' },
    'twat': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'dumbo' },
    'twats': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'dumbos' },
    'whore': { lists: [], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.FALSE, sub: 'tramp' },
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
      options.sub = options.case ? options.sub.trim() : options.sub.trim().toLowerCase();
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

  repeatForWord(word: string): number {
    if (this.words[word].repeat === Constants.TRUE || this.words[word].repeat === Constants.FALSE) {
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