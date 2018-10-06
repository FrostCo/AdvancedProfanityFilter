import { dynamicList } from './lib/helper.js';
import WebConfig from './webConfig.js';
import { Filter } from './lib/filter.js';
import OptionAuth from './optionAuth.js';

export default class OptionPage {
  cfg: WebConfig;
  auth: OptionAuth;

  static closeModal(id: string) {
    OptionPage.hide(document.getElementById(id));
  }

  static configureConfirmModal(content = 'Are you sure?', title = 'Please Confirm', titleColor = 'w3-flat-peter-river') {
    let modalTitle = document.getElementById('confirmModalTitle') as HTMLElement;
    let modalContent = document.getElementById('confirmModalContent') as HTMLElement;
    let modalHeader = document.querySelectorAll('#confirmModal header')[0] as HTMLElement;
    modalTitle.innerText = title;
    modalContent.innerHTML = content;
    modalHeader.className = `w3-container ${titleColor}`;
  }

  static configureStatusModal(content: string, title: string, titleColor: string) {
    let modalTitle = document.getElementById('statusModalTitle') as HTMLElement;
    let modalContent = document.getElementById('statusModalContent') as HTMLElement;
    let modalHeader = document.querySelectorAll('#statusModal header')[0] as HTMLElement;
    modalTitle.innerText = title;
    modalContent.innerHTML = content;
    modalHeader.className = `w3-container ${titleColor}`;
  }

  static disableBtn(element: HTMLElement) {
    element.classList.add('disabled');
    element.classList.add('w3-flat-silver');
  }

  static enableBtn(element: HTMLElement) {
    element.classList.remove('disabled');
    element.classList.remove('w3-flat-silver');
  }

  static hide(element: HTMLElement) {
    element.classList.remove('w3-show');
    element.classList.add('w3-hide');
  }

  static hideInputError(element) {
    element.classList.remove('w3-border-red');
    try {
      element.setCustomValidity('');
    } catch(e) {
      // If HTML5 validation not supported, the modal will suffice
     }
  }

  static hideStatus() {
    let notificationPanel = document.getElementById('notificationPanel') as HTMLElement;
    OptionPage.hide(notificationPanel);
  }

  static async load(instance: OptionPage) {
    instance.cfg = await WebConfig.build();
  }

  static openModal(id: string) {
    OptionPage.show(document.getElementById(id));
  }

  static show(element: HTMLElement) {
    element.classList.remove('w3-hide');
    element.classList.add('w3-show');
  }

  static showErrorModal(content = 'The requested action failed. Please try again or contact support.', title = 'Error', titleColor = 'w3-red') {
    this.configureStatusModal(content, title, titleColor);
    OptionPage.openModal('statusModal');
  }

 static showInputError(element, message = '') {
    element.classList.add('w3-border-red');
    if (message) {
      try {
        element.setCustomValidity(message);
        element.reportValidity();
      } catch(e) {
        OptionPage.showWarningModal(message);
      }
    }
  }

  static showStatusModal(content = 'Status updated.', title = 'Status', titleColor = 'w3-flat-peter-river') {
    this.configureStatusModal(content, title, titleColor);
    OptionPage.openModal('statusModal');
  }

  static showWarningModal(content = 'Invalid input.', title = 'Warning', titleColor = 'w3-orange') {
    this.configureStatusModal(content, title, titleColor);
    OptionPage.openModal('statusModal');
  }

  advancedDomainList() {
    let advDomains = document.getElementById('advDomainSelect') as HTMLInputElement;
    let domainListHTML = '<option selected value="">Add...</option>';
    this.cfg.advancedDomains.forEach(domain => { domainListHTML += `<option value="${domain}">${domain}</option>`; });
    advDomains.innerHTML = domainListHTML;
    this.advancedDomainPopulate();
  }

  advancedDomainPopulate() {
    let advDomains = document.getElementById('advDomainSelect') as HTMLInputElement;
    let advDomainText = document.getElementById('advDomainText') as HTMLInputElement;
    let advDomainRemove = document.getElementById('advDomainRemove') as HTMLInputElement;
    OptionPage.hideInputError(advDomainText);
    advDomains.value !== '' ? OptionPage.enableBtn(advDomainRemove) : OptionPage.disableBtn(advDomainRemove);
    advDomainText.value = advDomains.value;
  }

  advancedDomainRemove(evt) {
    if (evt.target.classList.contains('disabled')) return false;
    let advDomains = document.getElementById('advDomainSelect') as HTMLInputElement;
    option.cfg['advancedDomains'].splice(option.cfg['advancedDomains'].indexOf(advDomains.value), 1);
    if (option.saveProp('advancedDomains')) this.advancedDomainList();
  }

  advancedDomainSave(evt) {
    let advDomains = document.getElementById('advDomainSelect') as HTMLInputElement;
    let advDomainText = document.getElementById('advDomainText') as HTMLInputElement;
    let invalidMessage = 'Valid domain example: google.com or www.google.com';
    let success;
    if (advDomains.value == '') { // New record
      success = option.updateItemList(evt, advDomainText, 'advancedDomains', invalidMessage);
    } else { // Updating existing record
      success = option.updateItemList(evt, advDomainText, 'advancedDomains', invalidMessage, advDomains.value);
    }

    if (success) {
      if (option.saveProp('advancedDomains')) this.advancedDomainList();
    }
  }

  confirm(evt, action) {
    let ok = document.getElementById('confirmModalOK');
    ok.removeEventListener('click', importConfig);
    ok.removeEventListener('click', restoreDefaults);
    ok.removeEventListener('click', setPassword);

    switch(action) {
      case 'importConfig':
        OptionPage.configureConfirmModal('Are you sure you want to overwrite your existing settings?');
        ok.addEventListener('click', importConfig);
        break;
      case 'restoreDefaults':
        OptionPage.configureConfirmModal('Are you sure you want to restore defaults?');
        ok.addEventListener('click', restoreDefaults);
        break;
      case 'setPassword': {
        let passwordText = document.getElementById('setPassword') as HTMLInputElement;
        let passwordBtn = document.getElementById('setPasswordBtn') as HTMLInputElement;
        if (passwordBtn.classList.contains('disabled')) return false;

        let message = passwordText.value == '' ? 'Are you sure you want to remove the password?' : `Are you sure you want to set the password to '${passwordText.value}'?`;
        OptionPage.configureConfirmModal(message);
        ok.addEventListener('click', setPassword);
        break;
      }
    }

    OptionPage.openModal('confirmModal');
  }

  disabledDomainList() {
    let disabledDomains = document.getElementById('disabledDomainSelect') as HTMLInputElement;
    let domainListHTML = '<option selected value="">Add...</option>';
    this.cfg.disabledDomains.forEach(domain => { domainListHTML += `<option value="${domain}">${domain}</option>`; });
    disabledDomains.innerHTML = domainListHTML;
    this.disabledDomainPopulate();
  }

  disabledDomainPopulate() {
    let disabledDomains = document.getElementById('disabledDomainSelect') as HTMLInputElement;
    let disabledDomainText = document.getElementById('disabledDomainText') as HTMLInputElement;
    let disabledDomainRemove = document.getElementById('disabledDomainRemove') as HTMLInputElement;
    OptionPage.hideInputError(disabledDomainText);
    disabledDomains.value !== '' ? OptionPage.enableBtn(disabledDomainRemove) : OptionPage.disableBtn(disabledDomainRemove);
    disabledDomainText.value = disabledDomains.value;
  }

  disabledDomainRemove(evt) {
    if (evt.target.classList.contains('disabled')) return false;
    let disabledDomains = document.getElementById('disabledDomainSelect') as HTMLInputElement;
    option.cfg['disabledDomains'].splice(option.cfg['disabledDomains'].indexOf(disabledDomains.value), 1);
    if (option.saveProp('disabledDomains')) this.disabledDomainList();
  }

  disabledDomainSave(evt) {
    let disabledDomains = document.getElementById('disabledDomainSelect') as HTMLInputElement;
    let disabledDomainText = document.getElementById('disabledDomainText') as HTMLInputElement;
    let invalidMessage = 'Valid domain example: google.com or www.google.com';
    let success;
    if (disabledDomains.value == '') { // New record
      success = option.updateItemList(evt, disabledDomainText, 'disabledDomains', invalidMessage);
    } else { // Updating existing record
      success = option.updateItemList(evt, disabledDomainText, 'disabledDomains', invalidMessage, disabledDomains.value);
    }

    if (success) {
      if (option.saveProp('disabledDomains')) this.disabledDomainList();
    }
  }

  exportConfig() {
    let configText = document.getElementById('configText') as HTMLTextAreaElement;
    configText.value = JSON.stringify(this.cfg, null, 2);
  }

  async importConfig(evt) {
    let self = this;

    try {
      let configText = document.getElementById('configText') as HTMLTextAreaElement;
      self.cfg = new WebConfig(JSON.parse(configText.value));
      self.cfg.sanitizeWords();

      let resetSuccess = await self.restoreDefaults(evt, true);

      if (resetSuccess) {
        let error = await self.cfg.save();
        if (!error) {
          OptionPage.showStatusModal('Settings imported successfully.');
          self.init();
        } else {
          OptionPage.showErrorModal('Failed to import settings.');
        }
      }
    } catch (e) {
      OptionPage.showErrorModal();
    }
  }

  async init() {
    let self = this;
    await OptionPage.load(self);
    if (!self.auth) self.auth = new OptionAuth(self.cfg.password);
    // @ts-ignore: Type WebConfig is not assignable to type Config
    filter.cfg = option.cfg;

    // console.log('Password:', cfg.password, 'Authenticated:', authenticated); // DEBUG Password
    if (self.cfg.password && !self.auth.authenticated) {
      // console.log('Prompt for password'); // DEBUG Password
      OptionPage.openModal('passwordModal');
      document.getElementById('password').focus();
    } else {
      OptionPage.show(document.getElementById('main'));
    }

    self.populateOptions();
  }

  populateConfig() {
    this.auth.setPasswordButton(option);
  }

  async populateOptions() {
    filter.init();
    this.populateSettings();
    this.populateWordsList();
    this.advancedDomainList();
    this.disabledDomainList();
    this.populateConfig();
    this.populateTest();
  }

  populateSettings() {
    this.updateFilterOptions();

    // Settings
    let selectedFilter = document.getElementById(`filter${WebConfig._filterMethodNames[option.cfg.filterMethod]}`) as HTMLInputElement;
    let showCounter = document.getElementById('showCounter') as HTMLInputElement;
    let globalMatchMethodSelect = document.getElementById('globalMatchMethodSelect') as HTMLSelectElement;
    let filterWordList = document.getElementById('filterWordList') as HTMLInputElement;
    selectedFilter.checked = true;
    dynamicList(WebConfig._matchMethodNames.slice(0, -1), 'globalMatchMethodSelect');
    globalMatchMethodSelect.selectedIndex = this.cfg.globalMatchMethod;
    showCounter.checked = this.cfg.showCounter;
    filterWordList.checked = this.cfg.filterWordList;

    // Censor Settings
    let preserveFirst = document.getElementById('preserveFirst') as HTMLInputElement;
    let preserveLast = document.getElementById('preserveLast') as HTMLInputElement;
    let censorCharacterSelect = document.getElementById('censorCharacterSelect') as HTMLSelectElement;
    let censorFixedLengthSelect = document.getElementById('censorFixedLengthSelect') as HTMLSelectElement;
    preserveFirst.checked = this.cfg.preserveFirst;
    preserveLast.checked = this.cfg.preserveLast;
    censorCharacterSelect.value = this.cfg.censorCharacter;
    censorFixedLengthSelect.selectedIndex = this.cfg.censorFixedLength;

    // Substitution Settings
    let preserveCase = document.getElementById('preserveCase') as HTMLInputElement;
    let substitutionMark = document.getElementById('substitutionMark') as HTMLInputElement;
    preserveCase.checked = this.cfg.preserveCase;
    substitutionMark.checked = this.cfg.substitutionMark;

    // Default Settings
    let defaultWordRepeat = document.getElementById('defaultWordRepeat') as HTMLInputElement;
    let defaultWordMatchMethodSelect = document.getElementById('defaultWordMatchMethodSelect') as HTMLSelectElement;
    defaultWordRepeat.checked = this.cfg.defaultWordRepeat;
    let defaultWordSubstitution = document.getElementById('defaultWordSubstitutionText') as HTMLInputElement;
    defaultWordSubstitution.value = this.cfg.defaultSubstitution;
    let defaultWordMatchMethodSelectHTML = '';
    for(let i = 0; i < WebConfig._matchMethodNames.slice(0,-2).length; i++) {
      defaultWordMatchMethodSelectHTML += '<option value="'+WebConfig._matchMethodNames[i]+'">'+WebConfig._matchMethodNames[i]+'</option>';
    }
    defaultWordMatchMethodSelect.innerHTML = defaultWordMatchMethodSelectHTML;
    defaultWordMatchMethodSelect.selectedIndex = this.cfg.defaultWordMatchMethod;
  }

  populateTest() {
    let testText = document.getElementById('testText') as HTMLInputElement;
    let filteredTestText = document.getElementById('filteredTestText') as HTMLElement;

    if (testText.value === '') {
      filteredTestText.innerText = 'Enter some text above to test the filter...';
    } else {
      filteredTestText.innerText = filter.replaceText(testText.value);
    }
  }

  populateWord() {
    let wordList = document.getElementById('wordList') as HTMLSelectElement;
    let wordText = document.getElementById('wordText') as HTMLInputElement;
    let wordMatchRepeated = document.getElementById('wordMatchRepeated') as HTMLInputElement;
    let substitutionText = document.getElementById('substitutionText') as HTMLInputElement;
    let wordRemove = document.getElementById('wordRemove') as HTMLInputElement;
    let word = wordList.value;

    if (word == '') { // New word
      wordText.value = '';
      OptionPage.disableBtn(wordRemove);
      let selectedMatchMethod = document.getElementById(`wordMatch${WebConfig._matchMethodNames[option.cfg.defaultWordMatchMethod]}`) as HTMLInputElement;
      selectedMatchMethod.checked = true;
      wordMatchRepeated.checked = option.cfg.defaultWordRepeat;
      substitutionText.value = '';
    } else { // Existing word
      OptionPage.enableBtn(wordRemove);
      let wordCfg = option.cfg.words[word];
      wordText.value = word;
      let selectedMatchMethod = document.getElementById(`wordMatch${WebConfig._matchMethodNames[wordCfg.matchMethod]}`) as HTMLInputElement;
      selectedMatchMethod.checked = true;
      wordMatchRepeated.checked = wordCfg.repeat;
      substitutionText.value = wordCfg.sub;
    }
  }

  populateWordsList() {
    filter.init();
    let wordList = document.getElementById('wordList') as HTMLSelectElement;
    let wordListHTML = '<option selected value="">Add...</option>';

    // Workaround for Remove filter (use censor)
    let filterMethod = filter.cfg.filterMethod;
    if (filterMethod === 2) {
      filter.cfg.filterMethod = 0;
      filter.init();
    }

    Object.keys(option.cfg.words).sort().forEach(word => {
      let filteredWord = word;
      if (this.cfg.filterWordList) filteredWord = filter.replaceText(word, false);
      wordListHTML += `<option value="${word}" data-filtered="${filteredWord}">${filteredWord}</option>`;
    });

    // Workaround for Remove filter (use censor)
    if (filterMethod === 2) {
      filter.cfg.filterMethod = filterMethod;
      filter.init();
    }

    wordList.innerHTML = wordListHTML;
    this.populateWord();
  }

  async removeWord(evt) {
    if (evt.target.classList.contains('disabled')) return false;
    let wordList = document.getElementById('wordList') as HTMLSelectElement;
    let word = wordList.value;

    delete this.cfg.words[word];
    let success = this.saveOptions(evt);

    if (success) {
      // Update states and Reset word form
      filter.init();
      wordList.selectedIndex = 0;
      this.populateWordsList();
    }
  }

  async restoreDefaults(evt, silent = false) {
    this.exportConfig();
    let error = await this.cfg.reset();
    if (error) {
      OptionPage.showErrorModal('Error restoring defaults!');
      return false;
    } else {
      if (!silent) OptionPage.showStatusModal('Default settings restored');
      this.init();
      return true;
    }
  }

  async saveOptions(evt) {
    let self = this;
    // Gather current settings
    let censorCharacterSelect = document.getElementById('censorCharacterSelect') as HTMLSelectElement;
    let censorFixedLengthSelect = document.getElementById('censorFixedLengthSelect') as HTMLSelectElement;
    let defaultWordMatchMethodSelect = document.getElementById('defaultWordMatchMethodSelect') as HTMLSelectElement;
    let defaultWordRepeat = document.getElementById('defaultWordRepeat') as HTMLInputElement;
    let globalMatchMethodSelect = document.getElementById('globalMatchMethodSelect') as HTMLSelectElement;
    let preserveCase = document.getElementById('preserveCase') as HTMLInputElement;
    let preserveFirst = document.getElementById('preserveFirst') as HTMLInputElement;
    let preserveLast = document.getElementById('preserveLast') as HTMLInputElement;
    let showCounter = document.getElementById('showCounter') as HTMLInputElement;
    let filterWordList = document.getElementById('filterWordList') as HTMLInputElement;
    let substitutionMark = document.getElementById('substitutionMark') as HTMLInputElement;
    let defaultWordSubstitution = document.getElementById('defaultWordSubstitutionText') as HTMLInputElement;
    self.cfg.censorCharacter = censorCharacterSelect.value;
    self.cfg.censorFixedLength = censorFixedLengthSelect.selectedIndex;
    self.cfg.defaultWordMatchMethod = defaultWordMatchMethodSelect.selectedIndex;
    self.cfg.defaultWordRepeat = defaultWordRepeat.checked;
    self.cfg.globalMatchMethod = globalMatchMethodSelect.selectedIndex;
    self.cfg.preserveCase = preserveCase.checked;
    self.cfg.preserveFirst = preserveFirst.checked;
    self.cfg.preserveLast = preserveLast.checked;
    self.cfg.showCounter = showCounter.checked;
    self.cfg.filterWordList = filterWordList.checked;
    self.cfg.substitutionMark = substitutionMark.checked;
    self.cfg.defaultSubstitution = defaultWordSubstitution.value.trim().toLowerCase();

    // Save settings
    let error = await self.cfg.save();
    if (error) {
      OptionPage.showErrorModal('Settings not saved! Please try again.');
      return false;
    } else {
      self.init();
      return true;
    }
  }

  async saveProp(prop: string) {
    let error = await option.cfg.save(prop);
    if (error) {
      OptionPage.showErrorModal();
      return false;
    }
    return true;
  }

  async saveWord(evt) {
    let wordList = document.getElementById('wordList') as HTMLSelectElement;
    let wordText = document.getElementById('wordText') as HTMLInputElement;
    let wordMatchRepeated = document.getElementById('wordMatchRepeated') as HTMLInputElement;
    let substitutionText = document.getElementById('substitutionText') as HTMLInputElement;
    let selectedMatchMethod = document.querySelector('input[name="wordMatchMethod"]:checked') as HTMLInputElement;
    let word = wordText.value.trim().toLowerCase();
    let added = true;

    if (word == '') {
      OptionPage.showInputError(wordText, 'Please enter a valid word/phrase.');
      return false;
    }

    if (wordText.checkValidity()) {
      let wordOptions = {
        matchMethod: WebConfig._matchMethodNames.indexOf(selectedMatchMethod.value),
        repeat: wordMatchRepeated.checked,
        sub: substitutionText.value
      };

      if (wordList.value === '') { // New record
        // console.log('Adding new word: ', word, wordOptions); // DEBUG
        added = this.cfg.addWord(word, wordOptions);
      } else { // Updating existing record
        let originalWord = wordList.value;
        if (originalWord == word) { // Word options changed
          // console.log('Modifying existing word options: ', word, wordOptions); // DEBUG
          this.cfg.words[word] = wordOptions;
        } else { // Existing word modified
          // console.log('Modifying existing word: ', word, wordOptions); // DEBUG
          added = this.cfg.addWord(word, wordOptions);
          if (added) {
            delete this.cfg.words[originalWord];
          } else {
            OptionPage.showInputError(wordText, `'${word}' already in list.`);
          }
        }
      }

      if (added) {
        let success = await this.saveOptions(evt);
        if (!success) {
          OptionPage.showErrorModal();
          return false;
        }

        // Update states and Reset word form
        filter.init();
        wordList.selectedIndex = 0;
        this.populateWordsList();
      }
    } else {
      OptionPage.showInputError(wordText, 'Please enter a valid word/phrase.');
    }
  }

  async selectFilterMethod(evt) {
    option.cfg.filterMethod = WebConfig._filterMethodNames.indexOf(evt.target.value);
    if (option.saveProp('filterMethod')) this.init();
  }

  switchPage(evt) {
    let currentTab = document.querySelector('#menu a.w3-flat-belize-hole') as HTMLElement;
    let newTab = evt.target as HTMLElement;

    currentTab.classList.remove('w3-flat-belize-hole');
    newTab.classList.add('w3-flat-belize-hole');

    let currentPage = document.getElementById(currentTab.innerText.toLowerCase() + 'Page') as HTMLElement;
    let newPage = document.getElementById(newTab.innerText.toLowerCase() + 'Page') as HTMLElement;
    OptionPage.hide(currentPage);
    OptionPage.show(newPage);

    switch (newTab.innerText.toLowerCase()) {
      case 'test':
        document.getElementById('testText').focus();
        break;
    }
  }

  updateFilterOptions() {
    // Show/hide options as needed
    switch(this.cfg.filterMethod) {
      case 0: // Censor
        OptionPage.show(document.getElementById('censorSettings'));
        OptionPage.hide(document.getElementById('substitutionSettings'));
        OptionPage.show(document.getElementById('globalMatchMethod'));
        OptionPage.hide(document.getElementById('wordSubstitution'));
        break;
      case 1: // Substitution
        OptionPage.hide(document.getElementById('censorSettings'));
        OptionPage.show(document.getElementById('substitutionSettings'));
        OptionPage.show(document.getElementById('globalMatchMethod'));
        OptionPage.show(document.getElementById('wordSubstitution'));
        break;
      case 2: // Remove
        OptionPage.hide(document.getElementById('censorSettings'));
        OptionPage.hide(document.getElementById('substitutionSettings'));
        OptionPage.hide(document.getElementById('globalMatchMethod'));
        OptionPage.hide(document.getElementById('wordSubstitution'));
        break;
    }
  }

  updateItemList(evt, input, attr: string, invalidMessage: string, original = ''): boolean {
    let item = input.value.trim().toLowerCase();
    if (item == '') { // No data
      OptionPage.showInputError(input, 'Please enter a value.');
      return false;
    } else {
      if (input.checkValidity()) {
        OptionPage.hideInputError(input);
        if (!option.cfg[attr].includes(item)) {
          if (original != '' && option.cfg[attr].includes(original)) {
            // Update existing record (remove it before adding the new record)
            option.cfg[attr].splice(option.cfg[attr].indexOf(original), 1);
          }
          // Save new record
          option.cfg[attr].push(item);
          option.cfg[attr] = option.cfg[attr].sort();
          return true;
        } else {
          OptionPage.showInputError(input, 'Already in list.');
          return false;
        }
      } else {
        OptionPage.showInputError(input, invalidMessage);
        return false;
      }
    }
  }
}

let filter = new Filter;
let option = new OptionPage;

////
// Events
// Functions
function importConfig(e) { option.importConfig(e); }
function restoreDefaults(e) { option.restoreDefaults(e); }
function setPassword(e) { option.auth.setPassword(option); }
// Add event listeners to DOM
window.addEventListener('load', e => { option.init(); });
document.querySelectorAll('#menu a').forEach(el => { el.addEventListener('click', e => { option.switchPage(e); }); });
// Modals
document.getElementById('submitPassword').addEventListener('click', e => { option.auth.authenticate(e); });
document.getElementById('confirmModalOK').addEventListener('click', e => { OptionPage.closeModal('confirmModal'); });
document.getElementById('confirmModalCancel').addEventListener('click', e => { OptionPage.closeModal('confirmModal'); });
document.getElementById('statusModalOK').addEventListener('click', e => { OptionPage.closeModal('statusModal'); });
// Settings
document.querySelectorAll('#filterMethod input').forEach(el => { el.addEventListener('click', e => { option.selectFilterMethod(e); }); });
document.getElementById('censorCharacterSelect').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('censorFixedLengthSelect').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('defaultWordMatchMethodSelect').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('defaultWordRepeat').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('globalMatchMethodSelect').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('preserveCase').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('preserveFirst').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('preserveLast').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('showCounter').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('filterWordList').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('substitutionMark').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('defaultWordSubstitutionText').addEventListener('change', e => { option.saveOptions(e); });
// Words/Phrases
document.getElementById('wordList').addEventListener('click', e => { option.populateWord(); });
document.getElementById('wordText').addEventListener('input', e => { OptionPage.hideInputError(e.target); });
document.getElementById('wordSave').addEventListener('click', e => { option.saveWord(e); });
document.getElementById('wordRemove').addEventListener('click', e => { option.removeWord(e); });
// Domains
document.getElementById('advDomainSelect').addEventListener('change', e => { option.advancedDomainPopulate(); });
document.getElementById('advDomainText').addEventListener('input', e => { OptionPage.hideInputError(e.target); });
document.getElementById('advDomainSave').addEventListener('click', e => { option.advancedDomainSave(e); });
document.getElementById('advDomainRemove').addEventListener('click', e => { option.advancedDomainRemove(e); });
document.getElementById('disabledDomainSelect').addEventListener('change', e => { option.disabledDomainPopulate(); });
document.getElementById('disabledDomainText').addEventListener('input', e => { OptionPage.hideInputError(e.target); });
document.getElementById('disabledDomainSave').addEventListener('click', e => { option.disabledDomainSave(e); });
document.getElementById('disabledDomainRemove').addEventListener('click', e => { option.disabledDomainRemove(e); });
// Config
document.getElementById('configReset').addEventListener('click', e => { option.confirm(e, 'restoreDefaults'); });
document.getElementById('configExport').addEventListener('click', e => { option.exportConfig(); });
document.getElementById('configImport').addEventListener('click', e => { option.confirm(e, 'importConfig'); });
document.getElementById('setPassword').addEventListener('input', e => { option.auth.setPasswordButton(option); });
document.getElementById('setPasswordBtn').addEventListener('click', e => { option.confirm(e, 'setPassword'); });
// Test
document.getElementById('testText').addEventListener('input', e => { option.populateTest(); });