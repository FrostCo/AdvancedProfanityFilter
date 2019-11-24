export default class Config {
  advancedDomains: string[];
  censorCharacter: string;
  censorFixedLength: number;
  customAudioSites: { [site: string]: AudioRules[] };
  defaultSubstitution: string;
  defaultWordMatchMethod: number;
  defaultWordRepeat: boolean;
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
  words: { [key: string]: WordOptions; };
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
    youTubeAutoSubsMin: 0
  };

  static readonly _defaultWords = {
    'ass': { matchMethod: 0, repeat: true, sub: 'butt' },
    'asses': { matchMethod: 0, repeat: false, sub: 'butts' },
    'asshole': { matchMethod: 1, repeat: true, sub: 'jerk' },
    'badass': { matchMethod: 1, repeat: true, sub: 'cool' },
    'bastard': { matchMethod: 1, repeat: true, sub: 'idiot' },
    'bitch': { matchMethod: 1, repeat: true, sub: 'bench' },
    'cocksucker': { matchMethod: 1, repeat: true, sub: 'suckup' },
    'cunt': { matchMethod: 1, repeat: true, sub: 'expletive' },
    'dammit': { matchMethod: 1, repeat: false, sub: 'dangit' },
    'damn': { matchMethod: 1, repeat: false, sub: 'dang' },
    'dumbass': { matchMethod: 1, repeat: true, sub: 'idiot' },
    'fag': { matchMethod: 0, repeat: true, sub: 'gay' },
    'faggot': { matchMethod: 1, repeat: true, sub: 'gay' },
    'fags': { matchMethod: 0, repeat: true, sub: 'gays' },
    'fuck': { matchMethod: 1, repeat: true, sub: 'freak' },
    'goddammit': { matchMethod: 1, repeat: true, sub: 'dangit' },
    'hell': { matchMethod: 0, repeat: true, sub: 'heck' },
    'jackass': { matchMethod: 1, repeat: true, sub: 'jerk' },
    'nigga': { matchMethod: 0, repeat: true, sub: 'bruh' },
    'nigger': { matchMethod: 0, repeat: true, sub: 'man' },
    'niggers': { matchMethod: 0, repeat: true, sub: 'people' },
    'piss': { matchMethod: 1, repeat: true, sub: 'pee' },
    'pissed': { matchMethod: 1, repeat: true, sub: 'ticked' },
    'pussies': { matchMethod: 0, repeat: true, sub: 'softies' },
    'pussy': { matchMethod: 0, repeat: true, sub: 'softie' },
    'shit': { matchMethod: 1, repeat: true, sub: 'crap' },
    'slut': { matchMethod: 1, repeat: true, sub: 'tramp' },
    'tits': { matchMethod: 1, repeat: true, sub: 'chest' },
    'twat': { matchMethod: 0, repeat: true, sub: 'dumbo' },
    'twats': { matchMethod: 0, repeat: true, sub: 'dumbos' },
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
      this.words[str] = {
        capitalized: true,
        matchMethod: this.defaultWordMatchMethod,
        repeat: this.defaultWordRepeat,
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