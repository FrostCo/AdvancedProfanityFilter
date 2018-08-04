var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { arrayContains, dynamicList, removeFromArray } from './helper.js';
import Config from './config.js';
import Domain from './domain.js';
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
        chrome.storage.sync.set({ filterMethod: filterMethodSelect.selectedIndex }, function () {
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
                    domainRegex = new RegExp('(^|\.)' + popup.cfg.disabledDomains[x]);
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
