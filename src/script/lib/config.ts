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
    defaultWordMatchMethod: Constants.MatchMethods.Exact,
    defaultWordRepeat: false,
    defaultWordSeparators: false,
    filterMethod: Constants.FilterMethods.Substitute,
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
    'ass': { lists: [], matchMethod: Constants.MatchMethods.Exact, repeat: true, separators: false, sub: 'butt' },
    'asses': { lists: [], matchMethod: Constants.MatchMethods.Exact, repeat: false, separators: false, sub: 'butts' },
    'asshole': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: false, sub: 'jerk' },
    'badass': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: true, sub: 'cool' },
    'bastard': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: false, sub: 'idiot' },
    'bitch': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: false, sub: 'bench' },
    'cocksucker': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: true, sub: 'suckup' },
    'cunt': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: false, sub: 'expletive' },
    'dammit': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: false, separators: true, sub: 'dangit' },
    'damn': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: false, separators: false, sub: 'dang' },
    'dumbass': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: false, sub: 'idiot' },
    'fag': { lists: [], matchMethod: Constants.MatchMethods.Exact, repeat: true, separators: false, sub: 'gay' },
    'faggot': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: false, sub: 'gay' },
    'fags': { lists: [], matchMethod: Constants.MatchMethods.Exact, repeat: true, separators: false, sub: 'gays' },
    'fuck': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: true, sub: 'freak' },
    'goddammit': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: true, sub: 'dangit' },
    'hell': { lists: [], matchMethod: Constants.MatchMethods.Exact, repeat: false, separators: false, sub: 'heck' },
    'jackass': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: true, sub: 'jerk' },
    'nigga': { lists: [], matchMethod: Constants.MatchMethods.Exact, repeat: true, separators: false, sub: 'bruh' },
    'nigger': { lists: [], matchMethod: Constants.MatchMethods.Exact, repeat: true, separators: false, sub: 'man' },
    'niggers': { lists: [], matchMethod: Constants.MatchMethods.Exact, repeat: true, separators: false, sub: 'people' },
    'piss': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: false, sub: 'pee' },
    'pissed': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: false, sub: 'ticked' },
    'pussies': { lists: [], matchMethod: Constants.MatchMethods.Exact, repeat: true, separators: false, sub: 'softies' },
    'pussy': { lists: [], matchMethod: Constants.MatchMethods.Exact, repeat: true, separators: false, sub: 'softie' },
    'shit': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: false, sub: 'crap' },
    'slut': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: false, sub: 'tramp' },
    'tits': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: false, sub: 'chest' },
    'twat': { lists: [], matchMethod: Constants.MatchMethods.Exact, repeat: true, separators: false, sub: 'dumbo' },
    'twats': { lists: [], matchMethod: Constants.MatchMethods.Exact, repeat: true, separators: false, sub: 'dumbos' },
    'whore': { lists: [], matchMethod: Constants.MatchMethods.Partial, repeat: true, separators: false, sub: 'tramp' },
  };

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