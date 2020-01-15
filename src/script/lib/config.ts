export default class Config {
  advancedDomains: string[];
  censorCharacter: string;
  censorFixedLength: number;
  customAudioSites: { [site: string]: AudioRules[] };
  defaultSubstitution: string;
  defaultWordMatchMethod: number;
  defaultWordRepeat: boolean;
  defaultWordSeparators: boolean;
  disabledDomains: string[];
  enabledDomains: string[];
  enabledDomainsOnly: boolean;
  filterMethod: number;
  filterWordList: boolean;
  globalMatchMethod: number;
  muteAudio: boolean;
  muteAudioOnly: boolean;
  muteMethod: number;
  muteCueRequireShowing: boolean;
  password: string;
  preserveCase: boolean;
  preserveFirst: boolean;
  preserveLast: boolean;
  showCounter: boolean;
  showSubtitles: number;
  showSummary: boolean;
  showUpdateNotification: boolean;
  substitutionMark: boolean;
  words: { [key: string]: WordOptions };
  wordWhitelist: string[];
  youTubeAutoSubsMin: number;

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
  };

  static readonly _defaults = {
    advancedDomains: [],
    censorCharacter: '*',
    censorFixedLength: 0,
    customAudioSites: null,
    defaultSubstitution: 'censored',
    defaultWordMatchMethod: 0,
    defaultWordRepeat: false,
    defaultWordSeparators: false,
    disabledDomains: [],
    enabledDomains: [],
    enabledDomainsOnly: false,
    filterMethod: 1, // ['Censor', 'Substitute', 'Remove'];
    filterWordList: true,
    globalMatchMethod: 3, // ['Exact', 'Partial', 'Whole', 'Per-Word', 'RegExp']
    muteAudio: false, // Filter audio
    muteAudioOnly: false,
    muteMethod: 0, // 0: Mute Tab, 1: Video Volume
    muteCueRequireShowing: true,
    password: null,
    preserveCase: true,
    preserveFirst: true,
    preserveLast: false,
    showCounter: true,
    showSubtitles: 0,
    showSummary: true,
    showUpdateNotification: true,
    substitutionMark: false,
    wordWhitelist: [],
    youTubeAutoSubsMin: 0
  };

  static readonly _defaultWords = {
    'ass': { capital: true, matchMethod: 0, repeat: true, sub: 'butt' },
    'asses': { capital: true, matchMethod: 0, repeat: false, sub: 'butts' },
    'asshole': { capital: true, matchMethod: 1, repeat: true, sub: 'jerk' },
    'badass': { capital: true, matchMethod: 1, repeat: true, sub: 'cool' },
    'bastard': { capital: true, matchMethod: 1, repeat: true, sub: 'idiot' },
    'bitch': { capital: true, matchMethod: 1, repeat: true, sub: 'bench' },
    'cocksucker': { capital: true, matchMethod: 1, repeat: true, sub: 'suckup' },
    'cunt': { capital: true, matchMethod: 1, repeat: true, sub: 'expletive' },
    'dammit': { capital: true, matchMethod: 1, repeat: false, sub: 'dangit' },
    'damn': { capital: true, matchMethod: 1, repeat: false, sub: 'dang' },
    'dumbass': { capital: true, matchMethod: 1, repeat: true, sub: 'idiot' },
    'fag': { capital: true, matchMethod: 0, repeat: true, sub: 'gay' },
    'faggot': { capital: true, matchMethod: 1, repeat: true, sub: 'gay' },
    'fags': { capital: true, matchMethod: 0, repeat: true, sub: 'gays' },
    'fuck': { capital: true, matchMethod: 1, repeat: true, separators: true, sub: 'freak' },
    'goddammit': { capital: true, matchMethod: 1, repeat: true, sub: 'dangit' },
    'hell': { capital: true, matchMethod: 0, repeat: false, sub: 'heck' },
    'jackass': { capital: true, matchMethod: 1, repeat: true, sub: 'jerk' },
    'nigga': { capital: true, matchMethod: 0, repeat: true, sub: 'bruh' },
    'nigger': { capital: true, matchMethod: 0, repeat: true, sub: 'man' },
    'niggers': { capital: true, matchMethod: 0, repeat: true, sub: 'people' },
    'piss': { capital: true, matchMethod: 1, repeat: true, sub: 'pee' },
    'pissed': { capital: true, matchMethod: 1, repeat: true, sub: 'ticked' },
    'pussies': { capital: true, matchMethod: 0, repeat: true, sub: 'softies' },
    'pussy': { capital: true, matchMethod: 0, repeat: true, sub: 'softie' },
    'shit': { capital: true, matchMethod: 1, repeat: true, sub: 'crap' },
    'slut': { capital: true, matchMethod: 1, repeat: true, sub: 'tramp' },
    'tits': { capital: true, matchMethod: 1, repeat: true, sub: 'chest' },
    'twat': { capital: true, matchMethod: 0, repeat: true, sub: 'dumbo' },
    'twats': { capital: true, matchMethod: 0, repeat: true, sub: 'dumbos' },
    'whore': { capital: true, matchMethod: 1, repeat: true, sub: 'tramp' }
  };

  static readonly _filterMethodNames = ['Censor', 'Substitute', 'Remove'];
  static readonly _matchMethodNames = ['Exact', 'Partial', 'Whole', 'Per-Word', 'Regular-Expression'];
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
      this.words[str] = {
        capital: true,
        matchMethod: this.defaultWordMatchMethod,
        repeat: this.defaultWordRepeat,
        separators: this.defaultWordSeparators,
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