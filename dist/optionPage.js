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
    "preserveCase": true,
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
class OptionAuth {
    authenticate(event) {
        let passwordInput = document.getElementById('password');
        if (passwordInput.value == this.password) {
            this.authenticated = true;
            OptionPage.hide(document.getElementById('passwordContainer'));
            OptionPage.show(document.getElementById('main'));
        }
    }
    constructor(password) {
        this.password = password;
        this.authenticated = false;
    }
    setPassword() {
        var password = document.getElementById('setPassword');
        if (password.value == '') {
            chrome.storage.sync.remove('password');
        }
        else {
            chrome.storage.sync.set({ password: password.value });
            password.value = '';
        }
    }
}
class OptionTab {
    // Switching Tabs
    static openTab(event) {
        // Don't run on current tab
        if (event.currentTarget.className.indexOf('active') >= 0) {
            return false;
        }
        // Set active tab
        let oldTab = document.getElementsByClassName("tablinks active")[0];
        OptionPage.deactivate(oldTab);
        OptionPage.activate(event.currentTarget);
        // Show active tab content
        let oldTabContent = document.getElementsByClassName("tabcontent visible")[0];
        OptionPage.hide(oldTabContent);
        let newTabName = event.currentTarget.innerText;
        OptionPage.show(document.getElementById(newTabName));
    }
}
// tsc --outfile ./dist/optionPage.js ./src/helper.ts ./src/config.ts ./src/optionAuth.ts ./src/optionTab.ts ./src/optionPage.ts --target es6
// TODO: Magic Numbers
/// <reference path="config.ts" />
/// <reference path="helper.ts" />
class OptionPage {
    static activate(element) {
        element.classList.add('active');
    }
    static deactivate(element) {
        element.classList.remove('active');
    }
    static hide(element) {
        element.classList.remove('visible');
        element.classList.add('hidden');
    }
    static show(element) {
        element.classList.remove('hidden');
        element.classList.add('visible');
    }
    // Display status update to user
    static updateStatus(message, error, timeout) {
        var status = document.getElementById('status');
        if (error) {
            status.className = 'error';
        }
        status.textContent = message;
        setTimeout(function () { status.textContent = ''; status.className = ''; }, timeout);
    }
    censorCharacter(event) {
        let censorCharacterSelect = document.getElementById('censorCharacterSelect');
        this.cfg.censorCharacter = censorCharacterSelect.value;
        this.saveOptions(event);
    }
    censorFixedLength(event) {
        let censorFixedLengthSelect = document.getElementById('censorFixedLengthSelect');
        this.cfg.censorFixedLength = censorFixedLengthSelect.selectedIndex;
        this.saveOptions(event);
    }
    // Prompt for confirmation
    confirm(event, action) {
        // TODO: Add confirmation prompt
        if (action == 'importConfig') {
            this.importConfig(event);
        }
        else if (action == 'restoreDefaults') {
            this.restoreDefaults();
        }
    }
    domainAdd(event) {
        let domainInput = document.getElementById('domainText');
        if (domainInput.value != "") {
            if (domainInput.checkValidity()) {
                if (!arrayContains(this.cfg.disabledDomains, domainInput.value)) {
                    this.cfg.disabledDomains.push(domainInput.value);
                    this.cfg.disabledDomains = this.cfg.disabledDomains.sort();
                    this.saveOptions(event);
                    domainInput.value = "";
                }
                else {
                    OptionPage.updateStatus('Domain already in list.', true, 3000);
                }
            }
            else {
                OptionPage.updateStatus("Invalid domain, please only provide the domain name.", true, 5000);
            }
        }
    }
    domainRemove(event) {
        let domainSelect = document.getElementById('domainSelect');
        if (domainSelect.value != "") {
            this.cfg.disabledDomains = removeFromArray(this.cfg.disabledDomains, domainSelect.value);
            this.saveOptions(event);
        }
    }
    exportConfig() {
        // TODO: To let people migrate from wordList to words, return all keys (null)
        let configText = document.getElementById('configText');
        configText.value = JSON.stringify(this.cfg, null, 2);
    }
    filterMethodSelect(event) {
        let filterMethodSelectEm = document.getElementById('filterMethodSelect');
        this.cfg.filterMethod = filterMethodSelectEm.selectedIndex;
        this.saveOptions(event);
    }
    globalMatchMethod(event) {
        let globalMatchMethodSelect = document.getElementById('globalMatchMethodSelect');
        this.cfg.globalMatchMethod = globalMatchMethodSelect.selectedIndex;
        this.saveOptions(event);
    }
    importConfig(event) {
        return __awaiter(this, void 0, void 0, function* () {
            let self = this;
            try {
                let configText = document.getElementById('configText');
                self.cfg = new Config(JSON.parse(configText.value));
                let resetError = yield self.cfg.reset();
                if (resetError) {
                    throw new Error('Failed to reset config');
                }
                let error = yield self.cfg.save();
                if (!error) {
                    OptionPage.updateStatus('Settings imported successfully!', false, 3000);
                    self.populateOptions();
                }
            }
            catch (e) {
                OptionPage.updateStatus('Settings not saved! Please try again.', true, 5000);
            }
        });
    }
    static load(instance) {
        return __awaiter(this, void 0, void 0, function* () {
            instance.cfg = yield Config.build();
            instance.auth = new OptionAuth(instance.cfg.password);
        });
    }
    // Restores form state to saved values from Chrome Storage
    populateOptions() {
        return __awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield OptionPage.load(self);
            // migrateWordList(); // TODO: Migrate wordList
            // console.log('Password:', cfg.password, 'Authenticated:', authenticated); // DEBUG Password
            if (self.cfg.password && !self.auth.authenticated) {
                // console.log('Prompt for password'); // DEBUG Password
                OptionPage.hide(document.getElementById('main'));
                OptionPage.show(document.getElementById('passwordContainer'));
            }
            // Show/hide censor options and word substitutions based on filter method
            dynamicList(Config._filterMethodNames, 'filterMethodSelect');
            let filterMethodSelect = document.getElementById('filterMethodSelect');
            filterMethodSelect.selectedIndex = self.cfg.filterMethod;
            switch (self.cfg.filterMethod) {
                case 0:
                    OptionPage.show(document.getElementById('optionsCensor'));
                    OptionPage.hide(document.getElementById('optionsSubstitution'));
                    OptionPage.show(document.getElementById('globalMatchMethod'));
                    OptionPage.hide(document.getElementById('wordSubstitutions'));
                    break;
                case 1:
                    OptionPage.hide(document.getElementById('optionsCensor'));
                    OptionPage.show(document.getElementById('optionsSubstitution'));
                    OptionPage.show(document.getElementById('globalMatchMethod'));
                    OptionPage.show(document.getElementById('wordSubstitutions'));
                    break;
                case 2:
                    OptionPage.hide(document.getElementById('optionsCensor'));
                    OptionPage.hide(document.getElementById('optionsSubstitution'));
                    OptionPage.hide(document.getElementById('globalMatchMethod'));
                    OptionPage.hide(document.getElementById('wordSubstitutions'));
                    break;
            }
            // Hide per-word matching options if not selected globally (always show for Remove filter method)
            if (self.cfg.globalMatchMethod == 3 || self.cfg.filterMethod == 2) {
                OptionPage.show(document.getElementById('wordMatchMethodContainer'));
            }
            else {
                OptionPage.hide(document.getElementById('wordMatchMethodContainer'));
            }
            // Settings
            let censorFixedLengthSelect = document.getElementById('censorFixedLengthSelect');
            let censorCharacterSelect = document.getElementById('censorCharacterSelect');
            let preserveCase = document.getElementById('preserveCase');
            let preserveFirst = document.getElementById('preserveFirst');
            let preserveLast = document.getElementById('preserveLast');
            let substitutionMark = document.getElementById('substitutionMark');
            let showCounter = document.getElementById('showCounter');
            let globalMatchMethodSelect = document.getElementById('globalMatchMethodSelect');
            censorFixedLengthSelect.selectedIndex = self.cfg.censorFixedLength;
            censorCharacterSelect.value = self.cfg.censorCharacter;
            preserveCase.checked = self.cfg.preserveCase;
            preserveFirst.checked = self.cfg.preserveFirst;
            preserveLast.checked = self.cfg.preserveLast;
            substitutionMark.checked = self.cfg.substitutionMark;
            showCounter.checked = self.cfg.showCounter;
            dynamicList(Config._matchMethodNames.slice(0, -1), 'globalMatchMethodSelect');
            globalMatchMethodSelect.selectedIndex = self.cfg.globalMatchMethod;
            // Words
            dynamicList(Object.keys(self.cfg.words).sort(), 'wordSelect', 'Words to Filter');
            dynamicList([], 'substitutionSelect', 'Substitutions');
            dynamicList([], 'wordMatchMethodSelect', 'Select a Word');
            // Domains
            dynamicList(self.cfg.disabledDomains, 'domainSelect', 'Disabled Domains');
        });
    }
    // Restore default settings
    restoreDefaults() {
        return __awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.exportConfig();
            let error = yield self.cfg.reset();
            if (error) {
                OptionPage.updateStatus('Error restoring defaults!', true, 5000);
            }
            else {
                OptionPage.updateStatus('Default settings restored!', false, 3000);
                self.populateOptions();
            }
        });
    }
    // Saves options to sync storage
    saveOptions(event) {
        return __awaiter(this, void 0, void 0, function* () {
            let self = this;
            // Gather current settings
            let preserveCase = document.getElementById('preserveCase');
            let preserveFirst = document.getElementById('preserveFirst');
            let preserveLast = document.getElementById('preserveLast');
            let showCounter = document.getElementById('showCounter');
            let substitutionMark = document.getElementById('substitutionMark');
            self.cfg.preserveCase = preserveCase.checked;
            self.cfg.preserveFirst = preserveFirst.checked;
            self.cfg.preserveLast = preserveLast.checked;
            self.cfg.showCounter = showCounter.checked;
            self.cfg.substitutionMark = substitutionMark.checked;
            // Save settings
            let error = yield self.cfg.save();
            if (error) {
                OptionPage.updateStatus('Settings not saved! Please try again.', true, 5000);
            }
            else {
                self.populateOptions();
            }
        });
    }
    substitutionAdd(event) {
        let self = this;
        let wordSelect = document.getElementById('wordSelect');
        let substitutionText = document.getElementById('substitutionText');
        let word = wordSelect.value;
        let sub = substitutionText.value;
        if (word != "" && sub != "") {
            if (!arrayContains(self.cfg.words[word].words, sub)) {
                self.cfg.words[word].words.push(sub);
                self.cfg.words[word].words = self.cfg.words[word].words.sort();
                self.saveOptions(event);
                dynamicList(self.cfg.words[word].words, 'substitutionSelect', 'Substitutions');
                substitutionText.value = "";
            }
            else {
                OptionPage.updateStatus('Substitution already in list.', true, 3000);
            }
        }
    }
    substitutionLoad() {
        if (this.cfg.filterMethod === 1) {
            let wordSelect = document.getElementById('wordSelect');
            let selectedText = wordSelect.value;
            dynamicList(this.cfg.words[selectedText].words, 'substitutionSelect', 'Substitutions');
        }
    }
    substitutionRemove(event) {
        let wordSelect = document.getElementById('wordSelect');
        let substitutionSelect = document.getElementById('substitutionSelect');
        let word = wordSelect.value;
        let sub = substitutionSelect.value;
        if (word != "" && sub != "") {
            this.cfg.words[word].words = removeFromArray(this.cfg.words[word].words, sub);
            this.saveOptions(event);
        }
    }
    wordAdd(event) {
        let wordText = document.getElementById('wordText');
        let word = wordText.value;
        if (word != "") {
            if (!arrayContains(Object.keys(this.cfg.words), word)) {
                if (/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/.test(word)) {
                    this.cfg.words[word] = { "matchMethod": 1, "words": [] };
                }
                else {
                    this.cfg.words[word] = { "matchMethod": 0, "words": [] };
                }
                this.saveOptions(event);
                wordText.value = "";
            }
            else {
                OptionPage.updateStatus('Word already in list.', true, 3000);
            }
        }
    }
    wordMatchMethodLoad(event) {
        let wordSelect = document.getElementById('wordSelect');
        let word = wordSelect.value;
        dynamicList(Config._matchMethodNames.slice(0, -2).concat(Config._matchMethodNames.slice(-1)), 'wordMatchMethodSelect');
        let wordMatchMethodSelect = document.getElementById('wordMatchMethodSelect');
        wordMatchMethodSelect.value = Config._matchMethodNames[this.cfg.words[word].matchMethod];
    }
    wordMatchMethodSet(event) {
        let wordSelect = document.getElementById('wordSelect');
        let matchMethodSelect = document.getElementById('wordMatchMethodSelect');
        this.cfg.words[wordSelect.value].matchMethod = Config._matchMethodNames.indexOf(matchMethodSelect.value);
        this.saveOptions(event);
    }
    wordRemove(event) {
        let wordSelect = document.getElementById('wordSelect');
        let word = wordSelect.value;
        if (word != "") {
            delete this.cfg.words[word];
            this.saveOptions(event);
        }
    }
}
let option = new OptionPage;
////
// Add event listeners to DOM
window.addEventListener('load', function (event) { option.populateOptions(); });
let tabs = document.getElementsByClassName("tablinks");
for (let i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function (e) { OptionTab.openTab(e); });
}
// Filter
document.getElementById('filterMethodSelect').addEventListener('change', function (e) { option.filterMethodSelect(e); });
// Filter - Censor
document.getElementById('preserveFirst').addEventListener('click', function (e) { option.saveOptions(e); });
document.getElementById('preserveLast').addEventListener('click', function (e) { option.saveOptions(e); });
document.getElementById('censorCharacterSelect').addEventListener('change', function (e) { option.censorCharacter(e); });
document.getElementById('censorFixedLengthSelect').addEventListener('change', function (e) { option.censorFixedLength(e); });
// Filter - Substitute
document.getElementById('preserveCase').addEventListener('click', function (e) { option.saveOptions(e); });
document.getElementById('substitutionMark').addEventListener('click', function (e) { option.saveOptions(e); });
// Global Matching Method
document.getElementById('globalMatchMethodSelect').addEventListener('change', function (e) { option.globalMatchMethod(e); });
// General
document.getElementById('showCounter').addEventListener('click', function (e) { option.saveOptions(e); });
// Words
document.getElementById('wordAdd').addEventListener('click', function (e) { option.wordAdd(e); });
document.getElementById('wordRemove').addEventListener('click', function (e) { option.wordRemove(e); });
document.getElementById('wordSelect').addEventListener('change', function (e) { option.substitutionLoad(); });
document.getElementById('wordSelect').addEventListener('change', function (e) { option.wordMatchMethodLoad(e); });
document.getElementById('wordMatchMethodSet').addEventListener('click', function (e) { option.wordMatchMethodSet(e); });
document.getElementById('substitutionAdd').addEventListener('click', function (e) { option.substitutionAdd(e); });
document.getElementById('substitutionRemove').addEventListener('click', function (e) { option.substitutionRemove(e); });
// Domains
document.getElementById('domainAdd').addEventListener('click', function (e) { option.domainAdd(e); });
document.getElementById('domainRemove').addEventListener('click', function (e) { option.domainRemove(e); });
// Config
document.getElementById('default').addEventListener('click', function (e) { option.confirm(e, 'restoreDefaults'); });
document.getElementById('import').addEventListener('click', function (e) { option.confirm(e, 'importConfig'); });
document.getElementById('export').addEventListener('click', function (e) { option.exportConfig(); });
// Password
document.getElementById('submitPassword').addEventListener('click', function (e) { option.auth.authenticate(e); });
document.getElementById('setPasswordBtn').addEventListener('click', function (e) { option.auth.setPassword(); });
