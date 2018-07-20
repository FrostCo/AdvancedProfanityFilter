// tsc --outfile ./dist/optionPage.js ./src/helper.ts ./src/config.ts ./src/optionAuth.ts ./src/optionTab.ts ./src/optionPage.ts --target es6
// TODO: Magic Numbers
/// <reference path="config.ts" />
/// <reference path="helper.ts" />

class OptionPage {
  cfg: Config;
  auth: OptionAuth;

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
    if (error) {status.className = 'error';}
    status.textContent = message;
    setTimeout(function() {status.textContent = ''; status.className = '';}, timeout);
  }

  addNewItem(event, input, attr) {
    if (input.value != "") {
      if (input.checkValidity()) {
        if (!arrayContains(option.cfg[attr], input.value)) {
          option.cfg[attr].push(input.value);
          option.cfg[attr] = option.cfg[attr].sort();
          option.saveOptions(event);
          input.value = "";
        } else {
          OptionPage.updateStatus('Error: Already in list.', true, 3000);
        }
      } else {
        OptionPage.updateStatus("Error: Invalid entry.", true, 5000);
      }
    }
  }

  advancedDomainAdd(event) {
    let input = document.getElementById('advancedDomainText') as HTMLInputElement;
    option.addNewItem(event, input, 'advancedDomains');
  }

  advancedDomainRemove(event) {
    let input = document.getElementById('advancedDomainSelect') as HTMLInputElement;
    if (input.value != "") {
      option.cfg.advancedDomains = removeFromArray(option.cfg.advancedDomains, input.value);
      option.saveOptions(event);
    }
  }

  censorCharacter(event) {
    let censorCharacterSelect = document.getElementById('censorCharacterSelect') as HTMLSelectElement;
    this.cfg.censorCharacter = censorCharacterSelect.value;
    this.saveOptions(event);
  }

  censorFixedLength(event) {
    let censorFixedLengthSelect = document.getElementById('censorFixedLengthSelect') as HTMLSelectElement;
    this.cfg.censorFixedLength = censorFixedLengthSelect.selectedIndex;
    this.saveOptions(event);
  }

  // Prompt for confirmation
  confirm(event, action) {
    // TODO: Add confirmation prompt
    if (action == 'importConfig') {
      this.importConfig(event);
    } else if (action == 'restoreDefaults') {
      this.restoreDefaults();
    }
  }

  domainAdd(event) {
    let input = document.getElementById('domainText') as HTMLInputElement;
    option.addNewItem(event, input, 'disabledDomains');
  }

  domainRemove(event) {
    let domainSelect = document.getElementById('domainSelect') as HTMLSelectElement;
    if (domainSelect.value != "") {
      option.cfg.disabledDomains = removeFromArray(option.cfg.disabledDomains, domainSelect.value);
      option.saveOptions(event);
    }
  }

  exportConfig() {
    // TODO: To let people migrate from wordList to words, return all keys (null)
    let configText = document.getElementById('configText') as HTMLTextAreaElement;
    configText.value = JSON.stringify(this.cfg, null, 2);
  }

  filterMethodSelect(event) {
    let filterMethodSelectEm = document.getElementById('filterMethodSelect') as HTMLSelectElement;
    this.cfg.filterMethod = filterMethodSelectEm.selectedIndex;
    this.saveOptions(event);
  }

  globalMatchMethod(event) {
    let globalMatchMethodSelect = document.getElementById('globalMatchMethodSelect') as HTMLSelectElement;
    this.cfg.globalMatchMethod = globalMatchMethodSelect.selectedIndex;
    this.saveOptions(event);
  }

  async importConfig(event) {
    let self = this;
    try {
      let configText = document.getElementById('configText') as HTMLTextAreaElement;
      self.cfg = new Config(JSON.parse(configText.value));

      let resetError = await self.cfg.reset();
      if (resetError) {
        throw new Error('Failed to reset config');
      }

      let error = await self.cfg.save();
      if (!error) {
        OptionPage.updateStatus('Settings imported successfully!', false, 3000);
        self.populateOptions();
      }
    } catch (e) {
      OptionPage.updateStatus('Settings not saved! Please try again.', true, 5000);
    }
  }

  static async load(instance: OptionPage) {
    instance.cfg = await Config.build();
    instance.auth = new OptionAuth(instance.cfg.password);
  }

  // Restores form state to saved values from Chrome Storage
  async populateOptions() {
    let self = this;
    await OptionPage.load(self);

    // migrateWordList(); // TODO: Migrate wordList

    // console.log('Password:', cfg.password, 'Authenticated:', authenticated); // DEBUG Password
    if (self.cfg.password && !self.auth.authenticated) {
      // console.log('Prompt for password'); // DEBUG Password
      OptionPage.hide(document.getElementById('main'));
      OptionPage.show(document.getElementById('passwordContainer'));
    }

    // Show/hide censor options and word substitutions based on filter method
    dynamicList(Config._filterMethodNames, 'filterMethodSelect');
    let filterMethodSelect = document.getElementById('filterMethodSelect') as HTMLSelectElement;
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
    } else {
      OptionPage.hide(document.getElementById('wordMatchMethodContainer'));
    }

    // Settings
    let censorFixedLengthSelect = document.getElementById('censorFixedLengthSelect') as HTMLSelectElement;
    let censorCharacterSelect = document.getElementById('censorCharacterSelect') as HTMLSelectElement;
    let preserveCase = document.getElementById('preserveCase') as HTMLInputElement;
    let preserveFirst = document.getElementById('preserveFirst') as HTMLInputElement;
    let preserveLast = document.getElementById('preserveLast') as HTMLInputElement;
    let substitutionMark = document.getElementById('substitutionMark') as HTMLInputElement;
    let showCounter = document.getElementById('showCounter') as HTMLInputElement;
    let globalMatchMethodSelect = document.getElementById('globalMatchMethodSelect') as HTMLSelectElement;

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
    dynamicList(self.cfg.advancedDomains, 'advancedDomainSelect', 'Advanced Domains');
    dynamicList(self.cfg.disabledDomains, 'domainSelect', 'Disabled Domains');
  }

  // Restore default settings
  async restoreDefaults() {
    let self = this;
    self.exportConfig();
    let error = await self.cfg.reset();
    if (error) {
      OptionPage.updateStatus('Error restoring defaults!', true, 5000);
    } else {
      OptionPage.updateStatus('Default settings restored!', false, 3000);
      self.populateOptions();
    }
  }

  // Saves options to sync storage
  async saveOptions(event) {
    let self = this;
    // Gather current settings
    let preserveCase = document.getElementById('preserveCase') as HTMLInputElement;
    let preserveFirst = document.getElementById('preserveFirst') as HTMLInputElement;
    let preserveLast = document.getElementById('preserveLast') as HTMLInputElement;
    let showCounter = document.getElementById('showCounter') as HTMLInputElement;
    let substitutionMark = document.getElementById('substitutionMark') as HTMLInputElement;
    self.cfg.preserveCase = preserveCase.checked;
    self.cfg.preserveFirst = preserveFirst.checked;
    self.cfg.preserveLast = preserveLast.checked;
    self.cfg.showCounter = showCounter.checked;
    self.cfg.substitutionMark = substitutionMark.checked;

    // Save settings
    let error = await self.cfg.save();
    if (error) {
      OptionPage.updateStatus('Settings not saved! Please try again.', true, 5000);
    } else {
      self.populateOptions();
    }
  }

  substitutionAdd(event) {
    let self = this;
    let wordSelect = document.getElementById('wordSelect') as HTMLSelectElement;
    let substitutionText = document.getElementById('substitutionText') as HTMLInputElement;

    let word = wordSelect.value;
    let sub = substitutionText.value;
    if (word != "" && sub != "") {
      if (!arrayContains(self.cfg.words[word].words, sub)) {
        self.cfg.words[word].words.push(sub);
        self.cfg.words[word].words = self.cfg.words[word].words.sort();
        self.saveOptions(event);
        dynamicList(self.cfg.words[word].words, 'substitutionSelect', 'Substitutions');
        substitutionText.value = "";
      } else {
        OptionPage.updateStatus('Substitution already in list.', true, 3000);
      }
    }
  }

  substitutionLoad() {
    if (this.cfg.filterMethod === 1) {
      let wordSelect = document.getElementById('wordSelect') as HTMLSelectElement;
      let selectedText = wordSelect.value;
      dynamicList(this.cfg.words[selectedText].words, 'substitutionSelect', 'Substitutions');
    }
  }

  substitutionRemove(event) {
    let wordSelect = document.getElementById('wordSelect') as HTMLSelectElement;
    let substitutionSelect = document.getElementById('substitutionSelect') as HTMLSelectElement;

    let word = wordSelect.value;
    let sub = substitutionSelect.value;
    if (word != "" && sub != "") {
      this.cfg.words[word].words = removeFromArray(this.cfg.words[word].words, sub);
      this.saveOptions(event);
    }
  }

  wordAdd(event) {
    let wordText = document.getElementById('wordText') as HTMLInputElement;
    let word = wordText.value.trim().toLowerCase();
    if (word != "") {
      if (!arrayContains(Object.keys(this.cfg.words), word)) {
        if (/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/.test(word)) {
          this.cfg.words[word] = {"matchMethod": 1, "words": []};
        } else {
          this.cfg.words[word] = {"matchMethod": 0, "words": []};
        }
        this.saveOptions(event);
        wordText.value = "";
      } else {
        OptionPage.updateStatus('Word already in list.', true, 3000);
      }
    }
  }

  wordMatchMethodLoad(event) {
    let wordSelect = document.getElementById('wordSelect') as HTMLSelectElement;
    let word = wordSelect.value;
    dynamicList(Config._matchMethodNames.slice(0,-2).concat(Config._matchMethodNames.slice(-1)), 'wordMatchMethodSelect');
    let wordMatchMethodSelect = document.getElementById('wordMatchMethodSelect') as HTMLSelectElement;
    wordMatchMethodSelect.value = Config._matchMethodNames[this.cfg.words[word].matchMethod];
  }

  wordMatchMethodSet(event) {
    let wordSelect = document.getElementById('wordSelect') as HTMLSelectElement;
    let matchMethodSelect = document.getElementById('wordMatchMethodSelect') as HTMLSelectElement;
    this.cfg.words[wordSelect.value].matchMethod = Config._matchMethodNames.indexOf(matchMethodSelect.value);
    this.saveOptions(event);
  }

  wordRemove(event) {
    let wordSelect = document.getElementById('wordSelect') as HTMLSelectElement;
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
window.addEventListener('load', function(event) { option.populateOptions(); });

let tabs = document.getElementsByClassName("tablinks");
for (let i = 0; i < tabs.length; i++) {
  tabs[i].addEventListener('click', function(e) { OptionTab.openTab(e); });
}
// Filter
document.getElementById('filterMethodSelect').addEventListener('change', function(e) { option.filterMethodSelect(e); });
// Filter - Censor
document.getElementById('preserveFirst').addEventListener('click', function(e) { option.saveOptions(e); });
document.getElementById('preserveLast').addEventListener('click', function(e) { option.saveOptions(e); });
document.getElementById('censorCharacterSelect').addEventListener('change', function(e) { option.censorCharacter(e); });
document.getElementById('censorFixedLengthSelect').addEventListener('change', function(e) { option.censorFixedLength(e); });
// Filter - Substitute
document.getElementById('preserveCase').addEventListener('click', function(e) { option.saveOptions(e); });
document.getElementById('substitutionMark').addEventListener('click', function(e) { option.saveOptions(e); });
// Global Matching Method
document.getElementById('globalMatchMethodSelect').addEventListener('change', function(e) { option.globalMatchMethod(e); });
// General
document.getElementById('showCounter').addEventListener('click', function(e) { option.saveOptions(e); });
// Words
document.getElementById('wordAdd').addEventListener('click', function(e) { option.wordAdd(e); });
document.getElementById('wordRemove').addEventListener('click', function(e) { option.wordRemove(e); });
document.getElementById('wordSelect').addEventListener('change', function(e) { option.substitutionLoad(); });
document.getElementById('wordSelect').addEventListener('change', function(e) { option.wordMatchMethodLoad(e); });
document.getElementById('wordMatchMethodSet').addEventListener('click', function(e) { option.wordMatchMethodSet(e); });
document.getElementById('substitutionAdd').addEventListener('click', function(e) { option.substitutionAdd(e); });
document.getElementById('substitutionRemove').addEventListener('click', function(e) { option.substitutionRemove(e); });
// Domains
document.getElementById('advancedDomainAdd').addEventListener('click', function(e) { option.advancedDomainAdd(e); });
document.getElementById('advancedDomainRemove').addEventListener('click', function(e) { option.advancedDomainRemove(e); });
document.getElementById('domainAdd').addEventListener('click', function(e) { option.domainAdd(e); });
document.getElementById('domainRemove').addEventListener('click', function(e) { option.domainRemove(e); });
// Config
document.getElementById('default').addEventListener('click', function(e) { option.confirm(e, 'restoreDefaults'); });
document.getElementById('import').addEventListener('click', function(e) { option.confirm(e, 'importConfig'); });
document.getElementById('export').addEventListener('click', function(e) { option.exportConfig(); });
// Password
document.getElementById('submitPassword').addEventListener('click', function(e) { option.auth.authenticate(e); });
document.getElementById('setPasswordBtn').addEventListener('click', function(e) { option.auth.setPassword(); });