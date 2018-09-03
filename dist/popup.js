var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { arrayContains, dynamicList } from './lib/helper.js';
import WebConfig from './webConfig.js';
import Domain from './domain.js';
class Popup {
    static load(instance) {
        return __awaiter(this, void 0, void 0, function* () {
            instance.cfg = yield WebConfig.build(['advancedDomains', 'disabledDomains', 'filterMethod', 'password']);
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
    disableAdvancedMode(cfg, domain, key) {
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
    disableDomain() {
        return __awaiter(this, void 0, void 0, function* () {
            let popup = this;
            if (!arrayContains(popup.cfg.disabledDomains, popup.domain.hostname)) {
                popup.cfg.disabledDomains.push(popup.domain.hostname);
                let result = yield popup.cfg.save();
                if (!result) {
                    Popup.disable(document.getElementById('advancedMode'));
                    Popup.disable(document.getElementById('filterMethodSelect'));
                    chrome.tabs.reload();
                }
            }
        });
    }
    enableAdvancedMode(cfg, domain, key) {
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
    enableDomain(cfg, domain, key) {
        return __awaiter(this, void 0, void 0, function* () {
            let newDomainList = Domain.removeFromList(domain, cfg[key]);
            if (newDomainList.length < cfg[key].length) {
                cfg[key] = newDomainList;
                let result = yield cfg.save();
                if (!result) {
                    Popup.enable(document.getElementById('advancedMode'));
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
            let domainFilter = document.getElementById('domainFilter');
            let domainToggle = document.getElementById('domainToggle');
            let advancedMode = document.getElementById('advancedMode');
            let filterMethodSelect = document.getElementById('filterMethodSelect');
            dynamicList(WebConfig._filterMethodNames, 'filterMethodSelect');
            filterMethodSelect.selectedIndex = popup.cfg.filterMethod;
            if (popup.cfg.password && popup.cfg.password != '') {
                popup.protected = true;
                Popup.disable(domainFilter);
                Popup.disable(domainToggle);
                Popup.disable(advancedMode);
                Popup.disable(filterMethodSelect);
            }
            // Restricted pages
            if (popup.domain.url.protocol == 'chrome:' || popup.domain.url.protocol == 'about:' || popup.domain.hostname == 'chrome.google.com') {
                domainFilter.checked = false;
                Popup.disable(domainFilter);
                Popup.disable(domainToggle);
                Popup.disable(advancedMode);
                Popup.disable(filterMethodSelect);
                return false;
            }
            // Set initial value for domain filter and disable options if they are not applicable
            if (Domain.domainMatch(popup.domain.hostname, popup.cfg['disabledDomains'])) {
                domainFilter.checked = false;
                Popup.disable(advancedMode);
                Popup.disable(filterMethodSelect);
            }
            // Set initial value for advanced mode
            if (Domain.domainMatch(popup.domain.hostname, popup.cfg['advancedDomains'])) {
                advancedMode.checked = true;
            }
        });
    }
    toggleAdvancedMode() {
        let popup = this;
        if (!popup.protected) {
            let advancedMode = document.getElementById('advancedMode');
            if (advancedMode.checked) {
                popup.enableAdvancedMode(popup.cfg, popup.domain.hostname, 'advancedDomains');
            }
            else {
                popup.disableAdvancedMode(popup.cfg, popup.domain.hostname, 'advancedDomains');
            }
        }
    }
    toggleFilter() {
        let popup = this;
        if (!popup.protected) {
            let domainFilter = document.getElementById('domainFilter');
            if (domainFilter.checked) {
                popup.enableDomain(popup.cfg, popup.domain.hostname, 'disabledDomains');
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
document.getElementById('advancedMode').addEventListener('change', function (event) { popup.toggleAdvancedMode(); });
document.getElementById('filterMethodSelect').addEventListener('change', function (event) { popup.filterMethodSelect(); });
document.getElementById('options').addEventListener('click', function () { chrome.runtime.openOptionsPage(); });
