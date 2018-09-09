var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { arrayContains, getVersion, isVersionOlder } from './lib/helper.js';
import WebConfig from './webConfig.js';
import Domain from './domain.js';
////
// Actions and messaging
// Actions for extension install or upgrade
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == 'install') {
        chrome.runtime.openOptionsPage();
    }
    else if (details.reason == 'update') {
        // var thisVersion = chrome.runtime.getManifest().version;
        // console.log('Updated from ' + details.previousVersion + ' to ' + thisVersion);
        // Open options page to show new features
        // chrome.runtime.openOptionsPage();
        // Run any data migrations on update
        updateMigrations(details.previousVersion);
        // Display update notification
        chrome.notifications.create('extensionUpdate', {
            'type': 'basic',
            'title': 'Advanced Profanity Filter',
            'message': 'Update installed, click for changelog.',
            'iconUrl': 'icons/icon64.png',
            'isClickable': true,
        });
    }
});
// Show badge with number of words filtered
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.disabled === true) {
        chrome.browserAction.setIcon({ path: 'icons/icon19-disabled.png', tabId: sender.tab.id });
    }
    else {
        if (request.counter) {
            chrome.browserAction.setBadgeText({ text: request.counter, tabId: sender.tab.id });
        }
        if (request.advanced === true) {
            chrome.browserAction.setBadgeBackgroundColor({ color: [211, 45, 39, 255] }); // Red - Advanced
        }
        else if (request.advanced === false) {
            chrome.browserAction.setBadgeBackgroundColor({ color: [66, 133, 244, 255] }); // Blue - Normal
        }
    }
});
////
// Context menu
//
// Add selected word/phrase and reload page (unless already present)
function addSelection(selection) {
    return __awaiter(this, void 0, void 0, function* () {
        selection = (selection.trim()).toLowerCase();
        let cfg = yield WebConfig.build(); // TODO: Only need words here
        let result = cfg.addWord(selection);
        if (result) {
            let saved = yield cfg.save();
            if (!saved) {
                chrome.tabs.reload();
            }
        }
    });
}
// Disable domain and reload page (unless already disabled)
function disableDomain(cfg, domain, key) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!arrayContains(cfg[key], domain)) {
            cfg[key].push(domain);
            let result = yield cfg.save();
            if (!result) {
                chrome.tabs.reload();
            }
        }
    });
}
// Remove all entries that disable the filter for domain
function enableDomain(cfg, domain, key) {
    return __awaiter(this, void 0, void 0, function* () {
        let newDomainList = Domain.removeFromList(domain, cfg[key]);
        if (newDomainList.length < cfg[key].length) {
            cfg[key] = newDomainList;
            let result = yield cfg.save();
            if (!result) {
                chrome.tabs.reload();
            }
        }
    });
}
function toggleDomain(domain, key) {
    return __awaiter(this, void 0, void 0, function* () {
        let cfg = yield WebConfig.build([key]);
        Domain.domainMatch(domain, cfg[key]) ? enableDomain(cfg, domain, key) : disableDomain(cfg, domain, key);
    });
}
// This will look at the version (from before the update) and perform data migrations if necessary
// Only append so the order stays the same (oldest first).
function updateMigrations(previousVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        let old = getVersion(previousVersion);
        // let current = chrome.runtime.getManifest().version
        // [1.0.13] - updateRemoveWordsFromStorage - transition from previous words structure under the hood
        if (isVersionOlder(old, getVersion('1.0.13'))) {
            // Note: using promise instead of async/await
            chrome.storage.sync.get({ 'words': null }, function (oldWords) {
                // console.log('Old words for migration:', oldWords.words);
                if (oldWords.words) {
                    chrome.storage.sync.set({ '_words0': oldWords.words }, function () {
                        if (!chrome.runtime.lastError) {
                            chrome.storage.sync.remove('words', function () {
                                // Split words if necessary
                                var wordsPromise = new Promise(function (resolve, reject) {
                                    resolve(WebConfig.build());
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
        // [1.1.0] - Downcase and trim each word in the list (NOTE: This MAY result in losing some words)
        if (isVersionOlder(old, getVersion('1.1.0'))) {
            let cfg = yield WebConfig.build();
            cfg.sanitizeWords();
            cfg.save();
        }
    });
}
////
// Menu Items
chrome.contextMenus.removeAll(function () {
    chrome.contextMenus.create({
        id: 'addSelection',
        title: 'Add selection to filter',
        contexts: ['selection']
    });
    chrome.contextMenus.create({
        id: 'toggleFilterForDomain',
        title: 'Toggle filter for domain',
        contexts: ['all']
    });
    chrome.contextMenus.create({
        id: 'toggleAdvancedModeForDomain',
        title: 'Toggle advanced mode for domain',
        contexts: ['all']
    });
    chrome.contextMenus.create({
        id: 'options',
        title: 'Options',
        contexts: ['page', 'selection']
    });
});
////
// Listeners
chrome.contextMenus.onClicked.addListener(function (info, tab) {
    switch (info.menuItemId) {
        case 'addSelection':
            addSelection(info.selectionText);
            break;
        case 'toggleFilterForDomain': {
            let url = new URL(tab.url);
            toggleDomain(url.hostname, 'disabledDomains');
            break;
        }
        case 'toggleAdvancedModeForDomain': {
            let url = new URL(tab.url);
            toggleDomain(url.hostname, 'advancedDomains');
            break;
        }
        case 'options':
            chrome.runtime.openOptionsPage();
            break;
    }
});
chrome.notifications.onClicked.addListener(function (notificationId) {
    switch (notificationId) {
        case 'extensionUpdate':
            chrome.notifications.clear('extensionUpdate');
            chrome.tabs.create({ url: 'https://github.com/richardfrost/AdvancedProfanityFilter/releases' });
            break;
    }
});
