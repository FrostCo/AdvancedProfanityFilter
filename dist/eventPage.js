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
// tsc --outfile ./dist/eventPage.js ./src/helper.ts ./src/config.ts ./src/eventPage.ts --target es6
////
// Actions and messaging
// Actions for extension install or upgrade
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == 'install') {
        chrome.runtime.openOptionsPage();
    }
    else if (details.reason == 'update') {
        // var thisVersion = chrome.runtime.getManifest().version;
        // console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
        // TODO: Migrate wordList - Open options page to show new features
        // chrome.runtime.openOptionsPage();
        // TODO: Move words to _words*
        updateRemoveWordsFromStorage();
        // Display update notification
        chrome.notifications.create("extensionUpdate", {
            "type": "basic",
            "title": "Advanced Profanity Filter",
            "message": "Update installed, click for changelog.",
            "iconUrl": "icons/icon64.png",
            "isClickable": true,
        });
    }
});
// Show badge with number of words filtered
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.counter) {
        chrome.browserAction.setBadgeText({ text: request.counter, tabId: sender.tab.id });
    }
    else if (request.disabled) {
        chrome.browserAction.setIcon({ path: 'icons/icon19-disabled.png', tabId: sender.tab.id });
    }
});
////
// Context menu
//
// Add selected word/phrase and reload page (unless already present)
function addSelection(selection) {
    return __awaiter(this, void 0, void 0, function* () {
        selection = (selection.trim()).toLowerCase();
        let cfg = yield Config.build(['words']);
        if (!arrayContains(Object.keys(cfg.words), selection)) {
            cfg.words[selection] = { "matchMethod": 0, "words": [] };
            let result = yield cfg.save();
            if (!result) {
                chrome.tabs.reload();
            }
        }
    });
}
// Disable domain and reload page (unless already disabled)
function disableDomainEventPage(domain) {
    return __awaiter(this, void 0, void 0, function* () {
        let cfg = yield Config.build(['disabledDomains']);
        if (!arrayContains(cfg.disabledDomains, domain)) {
            cfg.disabledDomains.push(domain);
            let result = yield cfg.save();
            if (!result) {
                chrome.tabs.reload();
            }
        }
    });
}
// Remove all entries that disable the filter for domain
function enableDomainEventPage(domain) {
    return __awaiter(this, void 0, void 0, function* () {
        let cfg = yield Config.build(['disabledDomains']);
        let domainRegex, foundMatch;
        let newDisabledDomains = cfg.disabledDomains;
        for (let x = 0; x < cfg.disabledDomains.length; x++) {
            domainRegex = new RegExp('(^|\.)' + cfg.disabledDomains[x]);
            if (domainRegex.test(domain)) {
                foundMatch = true;
                newDisabledDomains = removeFromArray(newDisabledDomains, cfg.disabledDomains[x]);
            }
        }
        if (foundMatch) {
            cfg.disabledDomains = newDisabledDomains;
            let result = yield cfg.save();
            if (!result) {
                chrome.tabs.reload();
            }
        }
    });
}
function toggleFilterEventPage(domain) {
    return __awaiter(this, void 0, void 0, function* () {
        let cfg = yield Config.build(['disabledDomains']);
        let domainRegex;
        let disabled = false;
        for (let x = 0; x < cfg.disabledDomains.length; x++) {
            if (cfg.disabledDomains[x]) {
                domainRegex = new RegExp("(^|\.)" + cfg.disabledDomains[x]);
                if (domainRegex.test(domain)) {
                    disabled = true;
                    break;
                }
            }
        }
        disabled ? enableDomainEventPage(domain) : disableDomainEventPage(domain);
    });
}
// TODO: Remove after update: transition from previous words structure under the hood
function updateRemoveWordsFromStorage() {
    chrome.storage.sync.get({ "words": null }, function (oldWords) {
        console.log('Old words for migration:', oldWords.words);
        if (oldWords.words) {
            chrome.storage.sync.set({ "_words0": oldWords.words }, function () {
                if (!chrome.runtime.lastError) {
                    chrome.storage.sync.remove("words", function () {
                        // Split words if necessary
                        var wordsPromise = new Promise(function (resolve, reject) {
                            resolve(Config.build());
                        });
                        wordsPromise
                            .then(function (response) {
                            response.save();
                        });
                    });
                }
            });
        }
    });
}
////
// Menu Items
chrome.contextMenus.removeAll(function () {
    chrome.contextMenus.create({
        "id": "addSelection",
        "title": "Add selection to filter",
        "contexts": ["selection"]
    });
    chrome.contextMenus.create({
        "id": "toggleFilterForDomain",
        "title": "Toggle filter for domain",
        "contexts": ["all"]
    });
    chrome.contextMenus.create({
        "id": "options",
        "title": "Options",
        "contexts": ["page", "selection"]
    });
});
////
// Listeners
chrome.contextMenus.onClicked.addListener(function (info, tab) {
    switch (info.menuItemId) {
        case "addSelection":
            addSelection(info.selectionText);
            break;
        case "toggleFilterForDomain":
            let url = new URL(tab.url);
            let domain = url.hostname;
            toggleFilterEventPage(domain);
            break;
        case "options":
            chrome.runtime.openOptionsPage();
            break;
    }
});
chrome.notifications.onClicked.addListener(function (notificationId) {
    switch (notificationId) {
        case "extensionUpdate":
            chrome.notifications.clear("extensionUpdate");
            chrome.tabs.create({ url: "https://github.com/richardfrost/AdvancedProfanityFilter/releases" });
            break;
    }
});
