export default class Config {
    constructor(config) {
        if (typeof config === 'undefined') {
            throw new Error('Cannot be called directly. call build()');
        }
        for (let k in config)
            this[k] = config[k];
    }
    addWord(str) {
        str = str.trim().toLowerCase();
        if (Object.keys(this.words).includes(str)) {
            return false; // Already exists
        }
        else {
            this.words[str] = { matchMethod: this.defaultWordMatchMethod, repeat: this.defaultWordRepeat, words: [] };
            return true;
        }
    }
    repeatForWord(word) {
        if (this.words[word].repeat === true || this.words[word].repeat === false) {
            return this.words[word].repeat;
        }
        else {
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
Config.filterMethods = {
    censor: 0,
    substitute: 1,
    remove: 2
};
Config.matchMethods = {
    exact: 0,
    partial: 1,
    whole: 2,
    'Per-Word': 3,
    'RegExp': 4
};
Config._defaults = {
    advancedDomains: [],
    censorCharacter: '*',
    censorFixedLength: 0,
    defaultSubstitutions: ['censored', 'expletive', 'filtered'],
    defaultWordMatchMethod: 0,
    defaultWordRepeat: false,
    disabledDomains: [],
    filterMethod: 0,
    globalMatchMethod: 3,
    password: null,
    preserveCase: true,
    preserveFirst: true,
    preserveLast: false,
    showCounter: true,
    substitutionMark: true
};
Config._defaultWords = {
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
Config._filterMethodNames = ['Censor', 'Substitute', 'Remove'];
Config._matchMethodNames = ['Exact Match', 'Partial Match', 'Whole Match', 'Per-Word Match', 'Regular Expression'];
Config._maxBytes = 6500;
Config._maxWords = 100;
Config._wordsPattern = /^_words\d+/;
