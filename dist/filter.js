var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// export class Helper {
function arrayContains(array, element) {
    return (array.indexOf(element) > -1);
}
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
function removeFromArray(array, element) {
    return array.filter(e => e !== element);
}
/// <reference path="helper.ts" />
class Config {
    // Call build() to create a new instance
    constructor(async_param) {
        if (typeof async_param === 'undefined') {
            throw new Error('Cannot be called directly. call build()');
        }
        // TODO: Not supported yet
        // Object.assign(async_param, this);
        for (let k in async_param)
            this[k] = async_param[k];
    }
    static build(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            let async_result = yield Config.getConfig(keys);
            let instance = new Config(async_result);
            return instance;
        });
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
                    if (request == null || arrayContains(Object.keys(request), defaultKey)) {
                        if (items[defaultKey] === undefined) {
                            items[defaultKey] = Config._defaults[defaultKey];
                        }
                    }
                });
                // Add words if requested, and provide _defaultWords if needed
                if (keys === undefined || arrayContains(keys, 'words')) {
                    // Use default words if none were provided
                    if (items._words0 === undefined || Object.keys(items._words0).length == 0) {
                        items._words0 = Config._defaultWords;
                    }
                    Config.combineWords(items);
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
Config._defaults = {
    "censorCharacter": "*",
    "censorFixedLength": 0,
    "comprehensiveDomains": [],
    "defaultSubstitutions": ["censored", "expletive", "filtered"],
    "disabledDomains": [],
    "filterMethod": 0,
    "globalMatchMethod": 3,
    "password": null,
    "preserveCase": true,
    "preserveFirst": true,
    "preserveLast": false,
    "showCounter": true,
    "substitutionMark": true
};
Config._defaultWords = {
    "ass": { "matchMethod": 0, "words": ["butt", "tail"] },
    "asses": { "matchMethod": 0, "words": ["butts"] },
    "asshole": { "matchMethod": 1, "words": ["butthole", "jerk"] },
    "bastard": { "matchMethod": 1, "words": ["imperfect", "impure"] },
    "bitch": { "matchMethod": 1, "words": ["jerk"] },
    "cunt": { "matchMethod": 1, "words": ["explative"] },
    "dammit": { "matchMethod": 1, "words": ["dangit"] },
    "damn": { "matchMethod": 1, "words": ["dang", "darn"] },
    "fuck": { "matchMethod": 1, "words": ["freak", "fudge"] },
    "piss": { "matchMethod": 1, "words": ["pee"] },
    "pissed": { "matchMethod": 0, "words": ["ticked"] },
    "slut": { "matchMethod": 1, "words": ["imperfect", "impure"] },
    "shit": { "matchMethod": 1, "words": ["crap", "crud", "poop"] },
    "tits": { "matchMethod": 1, "words": ["explative"] },
    "whore": { "matchMethod": 1, "words": ["harlot", "tramp"] }
};
Config._filterMethodNames = ["Censor", "Substitute", "Remove"];
Config._matchMethodNames = ["Exact Match", "Partial Match", "Whole Match", "Per-Word Match", "Regular Expression"];
Config._maxBytes = 6500;
Config._maxWords = 100;
Config._wordsPattern = /^_words\d+/;
class Domain {
    static domainMatch(domain, domains) {
        let result = false;
        for (let x = 0; x < domains.length; x++) {
            if (domains[x]) {
                let domainRegex = new RegExp("(^|\.)" + domains[x]);
                if (domainRegex.test(domain)) {
                    result = true;
                    break;
                }
            }
        }
        return result;
    }
    static getCurrentTab() {
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
class Word {
    static allLowerCase(string) {
        return string.toLowerCase() === string;
    }
    static allUpperCase(string) {
        return string.toUpperCase() === string;
    }
    // Word must match exactly (not sub-string)
    // /\b(w)ord\b/gi
    static buildExactRegexp(word) {
        return new RegExp('\\b(' + word[0] + ')' + Word.escapeRegExp(word.slice(1)) + '\\b', 'gi');
    }
    // Match any part of a word (sub-string)
    // /(w)ord/gi
    static buildPartRegexp(word) {
        return new RegExp('(' + word[0] + ')' + Word.escapeRegExp(word.slice(1)), 'gi');
    }
    // Match entire word that contains sub-string and surrounding whitespace
    // /\s?\b(w)ord\b\s?/gi
    static buildRegexpForRemoveExact(word) {
        return new RegExp('\\s?\\b(' + word[0] + ')' + Word.escapeRegExp(word.slice(1)) + '\\b\\s?', 'gi');
    }
    // Match entire word that contains sub-string and surrounding whitespace
    // /\s?\b[\w-]*(w)ord[\w-]*\b\s?/gi
    static buildRegexpForRemovePart(word) {
        return new RegExp('\\s?\\b([\\w-]*' + word[0] + ')' + Word.escapeRegExp(word.slice(1)) + '[\\w-]*\\b\\s?', 'gi');
    }
    // Match entire word that contains sub-string
    // /\b[\w-]*(w)ord[\w-]*\b/gi
    static buildWholeRegexp(word) {
        return new RegExp('\\b([\\w-]*' + word[0] + ')' + Word.escapeRegExp(word.slice(1)) + '[\\w-]*\\b', 'gi');
    }
    static capitalize(string) {
        return string.charAt(0).toUpperCase() + string.substr(1);
    }
    static capitalized(string) {
        return string.charAt(0).toUpperCase() === string.charAt(0);
    }
    static escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }
    // TODO: Dependent on filter
    static randomElement(array) {
        if (array.length === 0) {
            array = filter.cfg.defaultSubstitutions;
        }
        return array[Math.floor((Math.random() * array.length))];
    }
}
class Page {
    static isForbiddenNode(node) {
        return Boolean(node.isContentEditable || // DraftJS and many others
            (node.parentNode &&
                (node.parentNode.isContentEditable || // Special case for Gmail
                    node.parentNode.tagName == "SCRIPT" ||
                    node.parentNode.tagName == "STYLE" ||
                    node.parentNode.tagName == "INPUT" ||
                    node.parentNode.tagName == "TEXTAREA" ||
                    node.parentNode.tagName == "IFRAME")) || // Some catch-alls
            (node.tagName &&
                (node.tagName == "SCRIPT" ||
                    node.tagName == "STYLE" ||
                    node.tagName == "INPUT" ||
                    node.tagName == "TEXTAREA" ||
                    node.tagName == "IFRAME")));
    }
}
// Returns true if a node should *not* be altered in any way
// Credit: https://github.com/ericwbailey/millennials-to-snake-people/blob/master/Source/content_script.js
Page.whitespaceRegExp = new RegExp('\\s');
Page.xpathDocText = '//*[not(self::script or self::style)]/text()[normalize-space(.) != \"\"]';
Page.xpathNodeText = './/*[not(self::script or self::style)]/text()[normalize-space(.) != \"\"]';
// tsc --outfile ./dist/filter.js ./src/helper.ts ./src/config.ts ./src/domain.ts ./src/word.ts ./src/page.ts ./src/filter.ts --target es6
// /// <reference path="./config.ts" />
class Filter {
    constructor() {
        this.comprehensive = false;
        this.counter = 0;
        this.wordRegExps = [];
    }
    checkMutationTargetTextForProfanity(mutation) {
        // console.log('Process mutation.target:', mutation.target, mutation.target.data); // DEBUG - Mutation target text
        var replacement;
        if (!Page.isForbiddenNode(mutation.target)) {
            replacement = filter.replaceText(mutation.target.data);
            if (replacement != mutation.target.data) {
                // console.log("Mutation target text changed:", mutation.target.data, replacement); // DEBUG - Mutation target text
                mutation.target.data = replacement;
            }
        }
        // else { console.log('Forbidden mutation.target node:', mutation.target); } // DEBUG - Mutation target text
    }
    checkNodeForProfanity(mutation) {
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
    // Censor the profanity
    // Only gets run when there is a match in replaceText()
    censorReplace(strMatchingString, strFirstLetter) {
        filter.counter++;
        let censoredString = '';
        if (filter.cfg.censorFixedLength > 0) {
            if (filter.cfg.preserveFirst && filter.cfg.preserveLast) {
                censoredString = strFirstLetter + filter.cfg.censorCharacter.repeat((filter.cfg.censorFixedLength - 2)) + strMatchingString.slice(-1);
            }
            else if (filter.cfg.preserveFirst) {
                censoredString = strFirstLetter + filter.cfg.censorCharacter.repeat((filter.cfg.censorFixedLength - 1));
            }
            else if (filter.cfg.preserveLast) {
                censoredString = filter.cfg.censorCharacter.repeat((filter.cfg.censorFixedLength - 1)) + strMatchingString.slice(-1);
            }
            else {
                censoredString = filter.cfg.censorCharacter.repeat(filter.cfg.censorFixedLength);
            }
        }
        else {
            if (filter.cfg.preserveFirst && filter.cfg.preserveLast) {
                censoredString = strFirstLetter + filter.cfg.censorCharacter.repeat((strMatchingString.length - 2)) + strMatchingString.slice(-1);
            }
            else if (filter.cfg.preserveFirst) {
                censoredString = strFirstLetter + filter.cfg.censorCharacter.repeat((strMatchingString.length - 1));
            }
            else if (filter.cfg.preserveLast) {
                censoredString = filter.cfg.censorCharacter.repeat((strMatchingString.length - 1)) + strMatchingString.slice(-1);
            }
            else {
                censoredString = filter.cfg.censorCharacter.repeat(strMatchingString.length);
            }
        }
        // console.log('Censor match:', strMatchingString, censoredString); // DEBUG
        return censoredString;
    }
    cleanPage() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cfg = yield Config.build();
            // Don't run if this is a disabled domain
            // Only run on main page (no frames)
            if (window == window.top) {
                let message = this.disabledPage();
                chrome.runtime.sendMessage(message);
                if (message.disabled) {
                    return false;
                }
            }
            // Turn on comprehensive filter (NOTE: Can break things)
            this.comprehensive = Domain.domainMatch(window.location.hostname, this.cfg.comprehensiveDomains);
            // Sort the words array by longest (most-specific) first
            this.cfg.wordList = Object.keys(this.cfg.words).sort(function (a, b) {
                return b.length - a.length;
            });
            // Remove profanity from the main document and watch for new nodes
            this.generateRegexpList();
            this.removeProfanity(Page.xpathDocText, document);
            this.updateCounterBadge();
            this.observeNewNodes();
        });
    }
    disabledPage() {
        let result = { "disabled": false };
        let domain = window.location.hostname;
        result.disabled = Domain.domainMatch(domain, this.cfg.disabledDomains);
        return result;
    }
    // Parse the profanity list
    // ["exact", "partial", "whole", "disabled"]
    generateRegexpList() {
        if (this.cfg.filterMethod == 2) { // Special regexp for "Remove" filter
            for (let x = 0; x < this.cfg.wordList.length; x++) {
                if (this.cfg.words[this.cfg.wordList[x]].matchMethod == 0) { // If word matchMethod is exact
                    this.wordRegExps.push(Word.buildRegexpForRemoveExact(this.cfg.wordList[x]));
                }
                else {
                    this.wordRegExps.push(Word.buildRegexpForRemovePart(this.cfg.wordList[x]));
                }
            }
        }
        else {
            switch (this.cfg.globalMatchMethod) {
                case 0: // Global: Exact match
                    for (let x = 0; x < this.cfg.wordList.length; x++) {
                        this.wordRegExps.push(Word.buildExactRegexp(this.cfg.wordList[x]));
                    }
                    break;
                case 2: // Global: Whole word match
                    for (let x = 0; x < this.cfg.wordList.length; x++) {
                        this.wordRegExps.push(Word.buildWholeRegexp(this.cfg.wordList[x]));
                    }
                    break;
                case 3: // Per-word matching
                    for (let x = 0; x < this.cfg.wordList.length; x++) {
                        switch (this.cfg.words[this.cfg.wordList[x]].matchMethod) {
                            case 0: // Exact match
                                this.wordRegExps.push(Word.buildExactRegexp(this.cfg.wordList[x]));
                                break;
                            case 2: // Whole word match
                                this.wordRegExps.push(Word.buildWholeRegexp(this.cfg.wordList[x]));
                                break;
                            case 4: // Regular Expression (Advanced)
                                this.wordRegExps.push(new RegExp(this.cfg.wordList[x], 'gi'));
                                break;
                            default: // case 1 - Partial word match (Default)
                                this.wordRegExps.push(Word.buildPartRegexp(this.cfg.wordList[x]));
                                break;
                        }
                    }
                    break;
                default: // case 1 - Global: Partial word match (Default)
                    for (let x = 0; x < this.cfg.wordList.length; x++) {
                        this.wordRegExps.push(Word.buildPartRegexp(this.cfg.wordList[x]));
                    }
                    break;
            }
        }
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
        let evalResult = document.evaluate(xpathExpression, node, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        if (evalResult.snapshotLength == 0) { // If plaintext node
            if (node.data) {
                // Don't mess with tags, styles, or URIs
                if (!/^\s*(<[a-z].+?\/?>|{.+?:.+?;.*}|https?:\/\/[^\s]+$)/.test(node.data)) {
                    // console.log('Plaintext:', node.data); // DEBUG
                    node.data = this.replaceText(node.data);
                }
                // else { console.log('Skipping plaintext (protected pattern):', node.data); } // DEBUG
            }
            else { // No matches, no node.data
                if (filter.comprehensive) {
                    console.log('Comprehensive mode:', evalResult, node.textContent); // DEBUG - Comprehensive
                    var replacement;
                    if (node.textContent) {
                        replacement = filter.replaceText(node.textContent);
                        if (replacement != node.textContent) {
                            console.log('Comprehensive replacement with no data:', replacement); // DEBUG - Comprehensive
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
    replaceText(str) {
        switch (filter.cfg.filterMethod) {
            case 0: // Censor
                for (let z = 0; z < filter.cfg.wordList.length; z++) {
                    str = str.replace(filter.wordRegExps[z], filter.censorReplace);
                }
                break;
            case 1: // Substitute
                for (let z = 0; z < filter.cfg.wordList.length; z++) {
                    str = str.replace(filter.wordRegExps[z], function (match) {
                        filter.counter++;
                        let sub = Word.randomElement(filter.cfg.words[filter.cfg.wordList[z]].words);
                        // console.log('Substitute match:', match, filter.cfg.words[filter.cfg.wordList[z]].words); // DEBUG
                        // Make substitution match case of original match
                        if (filter.cfg.preserveCase) {
                            if (Word.allUpperCase(match)) {
                                sub = sub.toUpperCase();
                            }
                            else if (Word.capitalized(match)) {
                                sub = Word.capitalize(sub);
                            }
                        }
                        if (filter.cfg.substitutionMark) {
                            return '[' + sub + ']';
                        }
                        else {
                            return sub;
                        }
                    });
                }
                break;
            case 2: // Remove
                for (let z = 0; z < filter.cfg.wordList.length; z++) {
                    str = str.replace(filter.wordRegExps[z], function (match) {
                        filter.counter++;
                        // Don't remove both leading and trailing whitespace
                        // console.log('Remove match:', match); // DEBUG
                        if (Page.whitespaceRegExp.test(match[0]) && Page.whitespaceRegExp.test(match[match.length - 1])) {
                            return match[0];
                        }
                        else {
                            return "";
                        }
                    });
                }
                break;
        }
        return str;
    }
    updateCounterBadge() {
        if (this.cfg.showCounter && this.counter > 0) {
            chrome.runtime.sendMessage({ counter: this.counter.toString() });
        }
    }
}
// Global
var filter = new Filter;
filter.cleanPage();
