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
    // Async call to get provided keys (or default keys) from chrome storage
    static getConfig(keys) {
        return new Promise(function (resolve, reject) {
            // Generate a request to use with chrome.storage
            let request = {};
            if (keys === undefined) {
                request = Config._defaults;
            }
            else {
                for (let k of keys) {
                    request[k] = Config._defaults[k];
                }
            }
            chrome.storage.sync.get(request, function (items) {
                // Only include words if requested
                if (keys === undefined || arrayContains(keys, 'words')) {
                    // Use default words if none were provided
                    if (Object.keys(items.words).length === 0 && items.words.constructor === Object) {
                        items.words = Config._defaultWords;
                    }
                    // Sort the words array by longest (most-specific) first
                    items.wordList = Object.keys(items.words).sort(function (a, b) {
                        return b.length - a.length;
                    });
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
        // let clone = Object.assign({}, this, {"wordList": undefined});
        // console.log(clone);
        let self = this;
        return new Promise(function (resolve, reject) {
            chrome.storage.sync.set(self, function () {
                resolve(chrome.runtime.lastError ? 1 : 0);
            });
        });
    }
    saveProp({ prop: string, val: any }) {
        // let cfg = this;
        // cfg[prop] = val;
        // return new Promise(function(resolve, reject) {
        //     chrome.storage.sync.set(cfg, function() {
        //         resolve(chrome.runtime.lastError ? 1 : 0);
        //     });
        // });
    }
    setProp(event, prop, value) {
        this[prop] = value;
    }
}
Config._defaults = {
    "censorCharacter": "*",
    "censorFixedLength": 0,
    "defaultSubstitutions": ["censored", "expletive", "filtered"],
    "disabledDomains": [],
    "filterMethod": 0,
    "globalMatchMethod": 3,
    "password": null,
    "preserveFirst": true,
    "preserveLast": false,
    "showCounter": true,
    "substitutionMark": true,
    "words": {}
};
Config._defaultWords = {
    "ass": { "matchMethod": 0, "words": ["butt", "tail"] },
    "asses": { "matchMethod": 0, "words": ["butts"] },
    "asshole": { "matchMethod": 1, "words": ["butthole", "jerk"] },
    "bastard": { "matchMethod": 1, "words": ["imperfect", "impure"] },
    "bitch": { "matchMethod": 1, "words": ["jerk"] },
    "cunt": { "matchMethod": 1, "words": ["explative"] },
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
class Word {
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
            (node.parentNode && (node.parentNode.isContentEditable || // Special case for Gmail
                node.parentNode.tagName == "SCRIPT" ||
                node.parentNode.tagName == "STYLE" ||
                node.parentNode.tagName == "INPUT" ||
                node.parentNode.tagName == "TEXTAREA" ||
                node.parentNode.tagName == "IFRAME")) || // Some catch-alls
            (node.tagName && (node.tagName == "SCRIPT" ||
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
// tsc --outfile ./dist/filter.js ./src/helper.ts ./src/config.ts ./src/word.ts ./src/page.ts ./src/filter.ts --target es6
// /// <reference path="./config.ts" />
class Filter {
    constructor() {
        this.counter = 0;
        this.wordRegExps = [];
    }
    checkNodeForProfanity(mutation) {
        let self = this;
        mutation.addedNodes.forEach(function (node) {
            if (!Page.isForbiddenNode(node)) {
                // console.log('Node to removeProfanity', node); // DEBUG
                self.removeProfanity(Page.xpathNodeText, node);
            }
        });
    }
    // Censor the profanity
    // Only gets run when there is a match in replaceText()
    censorReplace(strMatchingString, strFirstLetter) {
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
        filter.counter++;
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
            // Remove profanity from the main document and watch for new nodes
            this.generateRegexpList();
            this.removeProfanity(Page.xpathDocText, document);
            this.updateCounterBadge();
            this.observeNewNodes();
        });
    }
    disabledPage() {
        let result = { "disabled": false, "domain": "" };
        let domain = window.location.hostname;
        for (let x = 0; x < this.cfg.disabledDomains.length; x++) {
            if (this.cfg.disabledDomains[x]) {
                let domainRegex = new RegExp("(^|\.)" + this.cfg.disabledDomains[x]);
                if (domainRegex.test(domain)) {
                    result.disabled = true;
                    result.domain = this.cfg.disabledDomains[x];
                    break;
                }
            }
        }
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
        if (evalResult.snapshotLength == 0 && node.data) { // If plaintext node
            // Don't mess with tags, styles, or URIs
            if (!/^\s*(<[a-z].+?\/?>|{.+?:.+?;.*}|https?:\/\/[^\s]+$)/.test(node.data)) {
                // console.log('Plaintext:', node.data); // DEBUG
                node.data = this.replaceText(node.data);
            }
            else {
                // console.log('Skipping:', node.data); // DEBUG
            }
        }
        else { // If evalResult matches
            for (let i = 0; i < evalResult.snapshotLength; i++) {
                let textNode = evalResult.snapshotItem(i); // TODO
                // console.log('Normal cleaning:', textNode.data); // DEBUG
                textNode.data = this.replaceText(textNode.data);
            }
        }
    }
    replaceText(str) {
        let self = this;
        switch (self.cfg.filterMethod) {
            case 0: // Censor
                for (let z = 0; z < self.cfg.wordList.length; z++) {
                    str = str.replace(self.wordRegExps[z], self.censorReplace);
                }
                break;
            case 1: // Substitute
                for (let z = 0; z < self.cfg.wordList.length; z++) {
                    str = str.replace(self.wordRegExps[z], function (match) {
                        self.counter++;
                        // console.log('Substitute match:', match, self.cfg.words[self.cfg.wordList[z]].words); // DEBUG
                        if (self.cfg.substitutionMark) {
                            return '[' + Word.randomElement(self.cfg.words[self.cfg.wordList[z]].words) + ']';
                        }
                        else {
                            return Word.randomElement(self.cfg.words[self.cfg.wordList[z]].words);
                        }
                    });
                }
                break;
            case 2: // Remove
                for (let z = 0; z < self.cfg.wordList.length; z++) {
                    str = str.replace(self.wordRegExps[z], function (match) {
                        self.counter++;
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
