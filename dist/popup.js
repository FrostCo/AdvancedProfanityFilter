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
// TODO:  Update async pattern
class Domain {
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
// tsc --outfile ./dist/popup.js ./src/helper.ts ./src/config.ts ./src/domain.ts ./src/popup.ts --target es6
class Popup {
    static load(instance) {
        return __awaiter(this, void 0, void 0, function* () {
            instance.cfg = yield Config.build(['disabledDomains', 'filterMethod', 'password']);
            instance.domain = new Domain();
            yield instance.domain.load();
            return instance;
        });
    }
    constructor() {
        this.protected = false;
        this.filterMethodContainer = document.getElementById('filterMethodContainer');
    }
    ////
    // Functions for Popup
    static disable(element) {
        element.disabled = true;
        element.classList.add('disabled');
    }
    static enable(element) {
        element.disabled = false;
        element.classList.remove('disabled');
    }
    disableDomain() {
        return __awaiter(this, void 0, void 0, function* () {
            let popup = this;
            if (!arrayContains(popup.cfg.disabledDomains, popup.domain.hostname)) {
                popup.cfg.disabledDomains.push(popup.domain.hostname);
                let result = yield popup.cfg.save();
                if (!result) {
                    Popup.disable(document.getElementById('filterMethodSelect'));
                    chrome.tabs.reload();
                }
            }
            ;
        });
    }
    // Remove all entries that disable the filter for domain
    enableDomain() {
        return __awaiter(this, void 0, void 0, function* () {
            let popup = this;
            let domainRegex, foundMatch;
            let newDisabledDomains = popup.cfg.disabledDomains;
            for (let x = 0; x < popup.cfg.disabledDomains.length; x++) {
                domainRegex = new RegExp('(^|\.)' + popup.cfg.disabledDomains[x]);
                if (domainRegex.test(popup.domain.hostname)) {
                    foundMatch = true;
                    newDisabledDomains = removeFromArray(newDisabledDomains, popup.cfg.disabledDomains[x]);
                }
            }
            if (foundMatch) {
                popup.cfg.disabledDomains = newDisabledDomains;
                let result = yield popup.cfg.save();
                if (!result) {
                    Popup.enable(document.getElementById('filterMethodSelect'));
                    chrome.tabs.reload();
                }
            }
        });
    }
    filterMethodSelect() {
        let filterMethodSelect = document.getElementById('filterMethodSelect');
        chrome.storage.sync.set({ "filterMethod": filterMethodSelect.selectedIndex }, function () {
            if (!chrome.runtime.lastError) {
                chrome.tabs.reload();
            }
        });
    }
    populateOptions(event) {
        return __awaiter(this, void 0, void 0, function* () {
            let popup = this;
            yield Popup.load(popup);
            dynamicList(Config._filterMethodNames, 'filterMethodSelect');
            let domainFilter = document.getElementById('domainFilter');
            let domainToggle = document.getElementById('domainToggle');
            let filterMethodSelect = document.getElementById('filterMethodSelect');
            if (popup.cfg.password && popup.cfg.password != '') {
                popup.protected = true;
                Popup.disable(domainFilter);
                Popup.disable(domainToggle);
                Popup.disable(filterMethodSelect);
            }
            filterMethodSelect.selectedIndex = popup.cfg.filterMethod;
            // Restricted pages
            if (popup.domain.url.protocol == 'chrome:' || popup.domain.url.protocol == 'about:' || popup.domain.hostname == 'chrome.google.com') {
                domainFilter.checked = false;
                Popup.disable(domainFilter);
                Popup.disable(domainToggle);
                Popup.disable(filterMethodSelect);
                return false;
            }
            // Set initial value for domain filter
            let domainRegex;
            for (let x = 0; x < popup.cfg.disabledDomains.length; x++) {
                if (popup.cfg.disabledDomains[x]) {
                    domainRegex = new RegExp("(^|\.)" + popup.cfg.disabledDomains[x]);
                    if (domainRegex.test(popup.domain.hostname)) {
                        domainFilter.checked = false;
                        Popup.disable(filterMethodSelect);
                        break;
                    }
                }
            }
        });
    }
    toggleFilter() {
        let popup = this;
        if (!popup.protected) {
            let domainFilter = document.getElementById('domainFilter');
            if (domainFilter.checked) {
                popup.enableDomain();
            }
            else {
                popup.disableDomain();
            }
        }
    }
}
let popup = new Popup;
////
// Listeners
window.addEventListener('load', function (event) { popup.populateOptions(); });
document.getElementById('domainFilter').addEventListener('change', function (event) { popup.toggleFilter(); });
document.getElementById('filterMethodSelect').addEventListener('change', function (event) { popup.filterMethodSelect(); });
document.getElementById('options').addEventListener('click', function () { chrome.runtime.openOptionsPage(); });
