var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function arrayContains(array, element) {
    return (array.indexOf(element) > -1);
}
/* istanbul ignore next */
function dynamicList(list, selectEm, title) {
    let options = '';
    if (title !== undefined) {
        options = '<option value="" disabled selected>' + title + '</option>';
    }
    for (let i = 0; i < list.length; i++) {
        options += '<option value="' + list[i] + '">' + list[i] + '</option>';
    }
    document.getElementById(selectEm).innerHTML = options;
}
// /^\d+\.\d+\.\d+$/
function getVersion(version) {
    let versionValues = version.split('.');
    return {
        major: parseInt(versionValues[0]),
        minor: parseInt(versionValues[1]),
        patch: parseInt(versionValues[2])
    };
}
// Is the provided version lower than or equal to the minimum version?
function isVersionOlder(version, minimum) {
    if (version.major < minimum.major) {
        return true;
    }
    else if (version.major == minimum.major && version.minor < minimum.minor) {
        return true;
    }
    else if (version.major == minimum.major && version.minor == minimum.minor && version.patch <= minimum.patch) {
        return true;
    }
    return false;
}
function removeFromArray(array, element) {
    return array.filter(e => e !== element);
}
////
//src/domain.ts
//
class Domain {
    static domainMatch(domain, domains) {
        let result = false;
        for (let x = 0; x < domains.length; x++) {
            let domainRegex = new RegExp('(^|\.)' + domains[x], 'i');
            if (domainRegex.test(domain)) {
                result = true;
                break;
            }
        }
        return result;
    }
    // If a parent domain (example.com) is included, it will not +match all subdomains.
    // If a subdomain is included, it will match itself and the parent, if present.
    static removeFromList(domain, domains) {
        let domainRegex;
        let newDomainsList = domains;
        for (let x = 0; x < domains.length; x++) {
            domainRegex = new RegExp('(^|\.)' + domains[x], 'i');
            if (domainRegex.test(domain)) {
                newDomainsList = removeFromArray(newDomainsList, domains[x]);
            }
        }
        return newDomainsList;
    }
    static getCurrentTab() {
        /* istanbul ignore next */
        return new Promise(function (resolve, reject) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                resolve(tabs[0]);
            });
        });
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.tab = yield Domain.getCurrentTab();
            this.url = new URL(this.tab.url);
            this.hostname = this.url.hostname;
        });
    }
}
////
//src/lib/word.ts
//
class Word {
    static allLowerCase(string) {
        return string.toLowerCase() === string;
    }
    static allUpperCase(string) {
        return string.toUpperCase() === string;
    }
    // Word must match exactly (not sub-string)
    // /\bword\b/gi
    static buildExactRegexp(str, matchRepeated = false) {
        try {
            if (Word.containsDoubleByte(str)) {
                // Work around for lack of word boundary support for unicode characters
                // /(^|[\s.,'"+!?|-]+)(word)([\s.,'"+!?|-]+|$)/giu
                return new RegExp('(^|' + Word._unicodeWordBoundary + '+)(' + Word.processPhrase(str, matchRepeated) + ')(' + Word._unicodeWordBoundary + '+|$)', 'giu');
            }
            else {
                return new RegExp('\\b' + Word.processPhrase(str, matchRepeated) + '\\b', 'gi');
            }
        }
        catch (e) {
            throw new Error('Failed to create RegExp for "' + str + '" - ' + e.name + ' ' + e.message);
        }
    }
    // Match any part of a word (sub-string)
    // /word/gi
    static buildPartRegexp(str, matchRepeated = false) {
        try {
            return new RegExp(Word.processPhrase(str, matchRepeated), 'gi');
        }
        catch (e) {
            throw new Error('Failed to create RegExp for "' + str + '" - ' + e.name + ' ' + e.message);
        }
    }
    // Match entire word that contains sub-string and surrounding whitespace
    // /\s?\bword\b\s?/gi
    static buildRegexpForRemoveExact(str, matchRepeated = false) {
        try {
            if (Word.containsDoubleByte(str)) {
                // Work around for lack of word boundary support for unicode characters
                // /(^|[\s.,'"+!?|-]+)(word)([\s.,'"+!?|-]+|$)/giu
                return new RegExp('(^|' + Word._unicodeWordBoundary + ')(' + Word.processPhrase(str, matchRepeated) + ')(' + Word._unicodeWordBoundary + '|$)', 'giu');
            }
            else {
                return new RegExp('\\s?\\b' + Word.processPhrase(str, matchRepeated) + '\\b\\s?', 'gi');
            }
        }
        catch (e) {
            throw new Error('Failed to create RegExp for "' + str + '" - ' + e.name + ' ' + e.message);
        }
    }
    // Match entire word that contains sub-string and surrounding whitespace
    // /\s?\b[\w-]*word[\w-]*\b\s?/gi
    static buildRegexpForRemovePart(str, matchRepeated = false) {
        try {
            if (Word.containsDoubleByte(str)) {
                // Work around for lack of word boundary support for unicode characters
                // /(^|[\s.,'"+!?|-]?)[\w-]*(word)[\w-]*([\s.,'"+!?|-]?|$)/giu
                return new RegExp('(^|' + Word._unicodeWordBoundary + '?)([\\w-]*' + Word.processPhrase(str, matchRepeated) + '[\\w-]*)(' + Word._unicodeWordBoundary + '?|$)', 'giu');
            }
            else {
                return new RegExp('\\s?\\b[\\w-]*' + Word.processPhrase(str, matchRepeated) + '[\\w-]*\\b\\s?', 'gi');
            }
        }
        catch (e) {
            throw new Error('Failed to create RegExp for "' + str + '" - ' + e.name + ' ' + e.message);
        }
    }
    // Match entire word that contains sub-string
    // /\b[\w-]*word[\w-]*\b/gi
    static buildWholeRegexp(str, matchRepeated = false) {
        try {
            if (Word.containsDoubleByte(str)) {
                // Work around for lack of word boundary support for unicode characters
                // (^|[\s.,'"+!?|-]*)([\w-]*куче[\w-]*)([\s.,'"+!?|-]*|$)/giu
                return new RegExp('(^|' + Word._unicodeWordBoundary + '+)([\\w-]*' + Word.processPhrase(str, matchRepeated) + '[\\w-]*)(' + Word._unicodeWordBoundary + '+|$)', 'giu');
            }
            else {
                return new RegExp('\\b[\\w-]*' + Word.processPhrase(str, matchRepeated) + '[\\w-]*\\b', 'gi');
            }
        }
        catch (e) {
            throw new Error('Failed to create RegExp for "' + str + '" - ' + e.name + ' ' + e.message);
        }
    }
    static capitalize(string) {
        return string.charAt(0).toUpperCase() + string.substr(1);
    }
    static capitalized(string) {
        return string.charAt(0).toUpperCase() === string.charAt(0);
    }
    static containsDoubleByte(str) {
        if (!str.length)
            return false;
        if (str.charCodeAt(0) > 255)
            return true;
        return Word._unicodeRegex.test(str);
    }
    // /[-\/\\^$*+?.()|[\]{}]/g
    // /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g
    static escapeRegExp(str) {
        return str.replace(Word._escapeRegExp, '\\$&');
    }
    // Process the rest of the word (word excluding first character)
    // This will escape the word and optionally include repeating characters
    static processPhrase(str, matchRepeated) {
        var escaped = Word.escapeRegExp(str);
        if (matchRepeated) {
            return Word.repeatingCharacterRegexp(escaped);
        }
        return escaped;
    }
    static randomElement(array, defaults) {
        if (array.length === 0) {
            array = defaults;
        }
        return array[Math.floor((Math.random() * array.length))];
    }
    // Regexp to match repeating characters
    // Word: /w+o+r+d+/gi
    static repeatingCharacterRegexp(str) {
        if (str.includes('\\')) {
            var repeat = '';
            for (var i = 0; i < str.length; i++) {
                if (str[i] === '\\') {
                    repeat += (str[i] + str[i + 1] + '+');
                    i++;
                }
                else {
                    repeat += str[i] + '+';
                }
            }
            return repeat;
        }
        else {
            return str.split('').map(letter => letter + '+').join('');
        }
    }
}
Word._escapeRegExp = /[-\/\\^$*+?.()|[\]{}]/g;
Word._unicodeRegex = /[^\u0000-\u00ff]/;
Word._unicodeWordBoundary = '[\\s.,\'"+!?|-]';
Word.nonWordRegExp = new RegExp('^\\s*[^\\w]+\\s*$', 'g');
Word.whitespaceRegExp = /^\s+$/;
////
//src/lib/filter.ts
//
class Filter {
    constructor() {
        this.counter = 0;
        this.wordRegExps = [];
    }
    foundMatch(word) {
        this.counter++;
    }
    // Parse the profanity list
    // ["exact", "partial", "whole", "disabled"]
    generateRegexpList() {
        // console.time('generateRegexpList'); // Benchmark - Call Time
        // console.count('generateRegexpList: words to filter'); // Benchmarking - Executaion Count
        if (this.cfg.filterMethod == 2) { // Special regexp for "Remove" filter, uses per-word matchMethods
            for (let x = 0; x < this.cfg.wordList.length; x++) {
                let repeat = this.cfg.repeatForWord(this.cfg.wordList[x]);
                if (this.cfg.words[this.cfg.wordList[x]].matchMethod == 0) { // If word matchMethod is exact
                    this.wordRegExps.push(Word.buildRegexpForRemoveExact(this.cfg.wordList[x], repeat));
                }
                else if (this.cfg.words[this.cfg.wordList[x]].matchMethod == 4) { // If word matchMethod is RegExp
                    this.wordRegExps.push(new RegExp(this.cfg.wordList[x], 'gi'));
                }
                else {
                    this.wordRegExps.push(Word.buildRegexpForRemovePart(this.cfg.wordList[x], repeat));
                }
            }
        }
        else {
            switch (this.cfg.globalMatchMethod) {
                case 0: // Global: Exact match
                    for (let x = 0; x < this.cfg.wordList.length; x++) {
                        let repeat = this.cfg.repeatForWord(this.cfg.wordList[x]);
                        this.wordRegExps.push(Word.buildExactRegexp(this.cfg.wordList[x], repeat));
                    }
                    break;
                case 2: // Global: Whole word match
                    for (let x = 0; x < this.cfg.wordList.length; x++) {
                        let repeat = this.cfg.repeatForWord(this.cfg.wordList[x]);
                        this.wordRegExps.push(Word.buildWholeRegexp(this.cfg.wordList[x], repeat));
                    }
                    break;
                case 3: // Per-word matching
                    for (let x = 0; x < this.cfg.wordList.length; x++) {
                        let repeat = this.cfg.repeatForWord(this.cfg.wordList[x]);
                        switch (this.cfg.words[this.cfg.wordList[x]].matchMethod) {
                            case 0: // Exact match
                                this.wordRegExps.push(Word.buildExactRegexp(this.cfg.wordList[x], repeat));
                                break;
                            case 2: // Whole word match
                                this.wordRegExps.push(Word.buildWholeRegexp(this.cfg.wordList[x], repeat));
                                break;
                            case 4: // Regular Expression (Advanced)
                                this.wordRegExps.push(new RegExp(this.cfg.wordList[x], 'gi'));
                                break;
                            default: // case 1 - Partial word match (Default)
                                this.wordRegExps.push(Word.buildPartRegexp(this.cfg.wordList[x], repeat));
                                break;
                        }
                    }
                    break;
                default: // case 1 - Global: Partial word match (Default)
                    for (let x = 0; x < this.cfg.wordList.length; x++) {
                        let repeat = this.cfg.repeatForWord(this.cfg.wordList[x]);
                        this.wordRegExps.push(Word.buildPartRegexp(this.cfg.wordList[x], repeat));
                    }
                    break;
            }
        }
        // console.timeEnd('generateRegexpList'); // Benchmark - Call Time
    }
    // Sort the words array by longest (most-specific) first
    generateWordList() {
        this.cfg.wordList = Object.keys(this.cfg.words).sort(function (a, b) {
            return b.length - a.length;
        });
    }
    replaceText(str) {
        // console.count('replaceText'); // Benchmarking - Executaion Count
        let self = this;
        switch (self.cfg.filterMethod) {
            case 0: // Censor
                for (let z = 0; z < self.cfg.wordList.length; z++) {
                    str = str.replace(self.wordRegExps[z], function (match, arg1, arg2, arg3, arg4, arg5) {
                        self.foundMatch(self.cfg.wordList[z]);
                        if (self.wordRegExps[z].unicode) {
                            match = arg2;
                        } // Workaround for unicode word boundaries
                        let censoredString = '';
                        let censorLength = self.cfg.censorFixedLength > 0 ? self.cfg.censorFixedLength : match.length;
                        if (self.cfg.preserveFirst && self.cfg.preserveLast) {
                            censoredString = match[0] + self.cfg.censorCharacter.repeat(censorLength - 2) + match.slice(-1);
                        }
                        else if (self.cfg.preserveFirst) {
                            censoredString = match[0] + self.cfg.censorCharacter.repeat(censorLength - 1);
                        }
                        else if (self.cfg.preserveLast) {
                            censoredString = self.cfg.censorCharacter.repeat(censorLength - 1) + match.slice(-1);
                        }
                        else {
                            censoredString = self.cfg.censorCharacter.repeat(censorLength);
                        }
                        if (self.wordRegExps[z].unicode) {
                            censoredString = arg1 + censoredString + arg3;
                        } // Workaround for unicode word boundaries
                        // console.log('Censor match:', match, censoredString); // DEBUG
                        return censoredString;
                    });
                }
                break;
            case 1: // Substitute
                for (let z = 0; z < self.cfg.wordList.length; z++) {
                    str = str.replace(self.wordRegExps[z], function (match, arg1, arg2, arg3, arg4, arg5) {
                        // console.log('Substitute match:', match, self.cfg.words[self.cfg.wordList[z]].words); // DEBUG
                        self.foundMatch(self.cfg.wordList[z]);
                        if (self.wordRegExps[z].unicode) {
                            match = arg2;
                        } // Workaround for unicode word boundaries
                        let sub = Word.randomElement(self.cfg.words[self.cfg.wordList[z]].words, self.cfg.defaultSubstitutions);
                        // Make substitution match case of original match
                        if (self.cfg.preserveCase) {
                            if (Word.allUpperCase(match)) {
                                sub = sub.toUpperCase();
                            }
                            else if (Word.capitalized(match)) {
                                sub = Word.capitalize(sub);
                            }
                        }
                        if (self.cfg.substitutionMark) {
                            sub = '[' + sub + ']';
                        }
                        if (self.wordRegExps[z].unicode) {
                            sub = arg1 + sub + arg3;
                        } // Workaround for unicode word boundaries
                        return sub;
                    });
                }
                break;
            case 2: // Remove
                for (let z = 0; z < self.cfg.wordList.length; z++) {
                    str = str.replace(self.wordRegExps[z], function (match, arg1, arg2, arg3, arg4, arg5) {
                        // console.log('Remove match:', match, self.cfg.words[self.cfg.wordList[z]].words); // DEBUG
                        // console.log('\nmatch: ', match, '\narg1: ', arg1, '\narg2: ', arg2, '\narg3: ', arg3, '\narg4: ', arg4, '\narg5: ', arg5); // DEBUG
                        self.foundMatch(self.cfg.wordList[z]);
                        if (self.wordRegExps[z].unicode) {
                            // Workaround for unicode word boundaries
                            if (Word.whitespaceRegExp.test(arg1) && Word.whitespaceRegExp.test(arg3)) { // If both surrounds are whitespace (only need 1)
                                return arg1;
                            }
                            else if (Word.nonWordRegExp.test(arg1) || Word.nonWordRegExp.test(arg3)) { // If there is more than just whitesapce (ex. ',')
                                return (arg1 + arg3).trim();
                            }
                            else {
                                return '';
                            }
                        }
                        else {
                            // Don't remove both leading and trailing whitespace
                            // console.log('Remove match:', match); // DEBUG
                            if (Word.whitespaceRegExp.test(match[0]) && Word.whitespaceRegExp.test(match[match.length - 1])) {
                                return match[0];
                            }
                            else {
                                return '';
                            }
                        }
                    });
                }
                break;
        }
        return str;
    }
}
////
//src/page.ts
//
class Page {
    // Returns true if a node should *not* be altered in any way
    // Credit: https://github.com/ericwbailey/millennials-to-snake-people/blob/master/Source/content_script.js
    static isForbiddenNode(node) {
        return Boolean(node.isContentEditable || // DraftJS and many others
            (node.parentNode &&
                (node.parentNode.isContentEditable || // Special case for Gmail
                    node.parentNode.tagName == 'SCRIPT' ||
                    node.parentNode.tagName == 'STYLE' ||
                    node.parentNode.tagName == 'INPUT' ||
                    node.parentNode.tagName == 'TEXTAREA' ||
                    node.parentNode.tagName == 'IFRAME')) || // Some catch-alls
            (node.tagName &&
                (node.tagName == 'SCRIPT' ||
                    node.tagName == 'STYLE' ||
                    node.tagName == 'INPUT' ||
                    node.tagName == 'TEXTAREA' ||
                    node.tagName == 'IFRAME')));
    }
}
Page.forbiddenNodeRegExp = new RegExp('^\s*(<[a-z].+?\/?>|{.+?:.+?;.*}|https?:\/\/[^\s]+$)');
Page.xpathDocText = '//*[not(self::script or self::style)]/text()[normalize-space(.) != \"\"]';
Page.xpathNodeText = './/*[not(self::script or self::style)]/text()[normalize-space(.) != \"\"]';
////
//src/lib/config.ts
//
class Config {
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
////
//src/webConfig.ts
//
class WebConfig extends Config {
    static build(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            let async_result = yield WebConfig.getConfig(keys);
            let instance = new WebConfig(async_result);
            return instance;
        });
    }
    // Call build() to create a new instance
    constructor(async_param) {
        super(async_param);
    }
    // Compile words
    static combineWords(items) {
        items.words = {};
        if (items._words0 !== undefined) {
            // Find all _words* to combine
            let wordKeys = Object.keys(items).filter(function (key) {
                return Config._wordsPattern.test(key);
            });
            // Add all _words* to words and remove _words*
            wordKeys.forEach(function (key) {
                Object.assign(items.words, items[key]);
                delete items[key];
            });
        }
        // console.log('combineWords', items); // DEBUG
    }
    // Persist all configs from defaults and split _words*
    dataToPersist() {
        let self = this;
        let data = {};
        // Save all settings using keys from _defaults
        Object.keys(Config._defaults).forEach(function (key) {
            if (self[key] !== undefined) {
                data[key] = self[key];
            }
        });
        if (self.words) {
            // Split words back into _words* for storage
            let splitWords = self.splitWords();
            Object.keys(splitWords).forEach(function (key) {
                data[key] = splitWords[key];
            });
            let wordKeys = Object.keys(self).filter(function (key) {
                return Config._wordsPattern.test(key);
            });
            wordKeys.forEach(function (key) {
                data[key] = self[key];
            });
        }
        // console.log('dataToPersist', data); // DEBUG - Config
        return data;
    }
    // Async call to get provided keys (or default keys) from chrome storage
    // TODO: Keys: Doesn't support getting words
    static getConfig(keys) {
        return new Promise(function (resolve, reject) {
            // Generate a request to use with chrome.storage
            let request = null;
            if (keys !== undefined) {
                request = {};
                for (let k of keys) {
                    request[k] = Config._defaults[k];
                }
            }
            chrome.storage.sync.get(request, function (items) {
                // Ensure defaults for undefined settings
                Object.keys(Config._defaults).forEach(function (defaultKey) {
                    if (request == null || Object.keys(request).includes(defaultKey)) {
                        if (items[defaultKey] === undefined) {
                            items[defaultKey] = Config._defaults[defaultKey];
                        }
                    }
                });
                // Add words if requested, and provide _defaultWords if needed
                if (keys === undefined || keys.includes('words')) {
                    // Use default words if none were provided
                    if (items._words0 === undefined || Object.keys(items._words0).length == 0) {
                        items._words0 = Config._defaultWords;
                    }
                    WebConfig.combineWords(items);
                }
                resolve(items);
            });
        });
    }
    removeProp(prop) {
        chrome.storage.sync.remove(prop);
        delete this[prop];
    }
    reset() {
        return new Promise(function (resolve, reject) {
            chrome.storage.sync.clear(function () {
                resolve(chrome.runtime.lastError ? 1 : 0);
            });
        });
    }
    save() {
        var self = this;
        return new Promise(function (resolve, reject) {
            chrome.storage.sync.set(self.dataToPersist(), function () {
                resolve(chrome.runtime.lastError ? 1 : 0);
            });
        });
    }
    splitWords() {
        let self = this;
        let currentContainerNum = 0;
        let currentWordNum = 0;
        // let wordsLength = JSON.stringify(self.words).length;
        // let wordContainers = Math.ceil(wordsLength/Config._maxBytes);
        // let wordsNum = Object.keys(self.words).length;
        let words = {};
        words[`_words${currentContainerNum}`] = {};
        Object.keys(self.words).sort().forEach(function (word) {
            if (currentWordNum == Config._maxWords) {
                currentContainerNum++;
                currentWordNum = 0;
                words[`_words${currentContainerNum}`] = {};
            }
            words[`_words${currentContainerNum}`][word] = self.words[word];
            currentWordNum++;
        });
        return words;
    }
}
class WebFilter extends Filter {
    constructor() {
        super();
        this.advanced = false;
    }
    checkMutationTargetTextForProfanity(mutation) {
        // console.count('checkMutationTargetTextForProfanity'); // Benchmarking - Executaion Count
        // console.log('Process mutation.target:', mutation.target, mutation.target.data); // DEBUG - Mutation target text
        var replacement;
        if (!Page.isForbiddenNode(mutation.target)) {
            replacement = this.replaceText(mutation.target.data);
            if (replacement != mutation.target.data) {
                // console.log("Mutation target text changed:", mutation.target.data, replacement); // DEBUG - Mutation target text
                mutation.target.data = replacement;
            }
        }
        // else { console.log('Forbidden mutation.target node:', mutation.target); } // DEBUG - Mutation target text
    }
    checkNodeForProfanity(mutation) {
        // console.count('checkNodeForProfanity'); // Benchmarking - Executaion Count
        // console.log('Mutation observed:', mutation); // DEBUG - Mutation addedNodes
        mutation.addedNodes.forEach(function (node) {
            // console.log('Added node(s):', node); // DEBUG - Mutation addedNodes
            if (!Page.isForbiddenNode(node)) {
                // console.log('Node to removeProfanity', node); // DEBUG - Mutation addedNodes
                filter.removeProfanity(Page.xpathNodeText, node);
            }
            // else { console.log('Forbidden node:', node); } // DEBUG - Mutation addedNodes
        });
        // Only process mutation change if target is text
        if (mutation.target && mutation.target.nodeName == '#text') {
            filter.checkMutationTargetTextForProfanity(mutation);
        }
    }
    cleanPage() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cfg = yield WebConfig.build();
            // Don't run if this is a disabled domain
            // Only run on main page (no frames)
            if (window == window.top) {
                let disabled = this.disabledPage();
                let message = { disabled: disabled };
                if (message.disabled) {
                    chrome.runtime.sendMessage(message);
                    return false;
                }
                // Check for advanced mode on current domain
                this.advanced = Domain.domainMatch(window.location.hostname, this.cfg.advancedDomains);
                message.advanced = this.advanced;
                if (this.advanced) {
                    message.advanced = true;
                }
                chrome.runtime.sendMessage(message);
            }
            // Remove profanity from the main document and watch for new nodes
            this.generateWordList();
            this.generateRegexpList();
            this.removeProfanity(Page.xpathDocText, document);
            this.updateCounterBadge();
            this.observeNewNodes();
        });
    }
    disabledPage() {
        // console.count('disabledPage'); // Benchmarking - Executaion Count
        let domain = window.location.hostname;
        return Domain.domainMatch(domain, this.cfg.disabledDomains);
    }
    // Watch for new text nodes and clean them as they are added
    observeNewNodes() {
        let self = this;
        let observerConfig = {
            characterData: true,
            childList: true,
            subtree: true
        };
        // When DOM is modified, remove profanity from inserted node
        let observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                self.checkNodeForProfanity(mutation);
            });
            self.updateCounterBadge();
        });
        // Remove profanity from new objects
        observer.observe(document, observerConfig);
    }
    removeProfanity(xpathExpression, node) {
        // console.count('removeProfanity'); // Benchmarking - Executaion Count
        let evalResult = document.evaluate(xpathExpression, node, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        if (evalResult.snapshotLength == 0) { // If plaintext node
            if (node.data) {
                // Don't mess with tags, styles, or URIs
                if (!Page.forbiddenNodeRegExp.test(node.data)) {
                    // console.log('Plaintext:', node.data); // DEBUG
                    node.data = this.replaceText(node.data);
                }
                // else { console.log('Skipping plaintext (protected pattern):', node.data); } // DEBUG
            }
            else { // No matches, no node.data
                if (this.advanced) {
                    // console.log('Advanced mode:', evalResult, node.textContent); // DEBUG - Advanced
                    var replacement;
                    if (node.textContent) {
                        replacement = this.replaceText(node.textContent);
                        if (replacement != node.textContent) {
                            // console.log('Advanced replacement with no data:', replacement); // DEBUG - Advanced
                            node.textContent = replacement;
                        }
                    }
                }
            }
        }
        else { // If evalResult matches
            for (let i = 0; i < evalResult.snapshotLength; i++) {
                var item = evalResult.snapshotItem(i);
                // console.log('Normal cleaning:', item.data); // DEBUG
                item.data = this.replaceText(item.data);
            }
        }
    }
    updateCounterBadge() {
        /* istanbul ignore next */
        // console.count('updateCounterBadge'); // Benchmarking - Executaion Count
        if (this.cfg.showCounter && this.counter > 0) {
            chrome.runtime.sendMessage({ counter: this.counter.toString() });
        }
    }
}
// Global
var filter = new WebFilter;
if (typeof window !== 'undefined' && ['[object Window]', '[object ContentScriptGlobalScope]'].includes(({}).toString.call(window))) {
    /* istanbul ignore next */
    filter.cleanPage();
}
