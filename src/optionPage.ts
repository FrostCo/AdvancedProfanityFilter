import { arrayContains, dynamicList, removeFromArray } from './lib/helper.js';
import WebConfig from './webConfig.js';
import {Filter} from './lib/filter.js';
import OptionAuth from './optionAuth.js';

export default class OptionPage {
  cfg: WebConfig;
  auth: OptionAuth;

  static closeModal(id: string) {
    document.getElementById(id).style.display = 'none';
  }

  static configureConfirmModal(content = 'Are you sure?', title = 'Please Confirm', titleColorClass = 'w3-flat-peter-river') {
    let modalTitle = document.getElementById('confirmModalTitle') as HTMLElement;
    let modalContent = document.getElementById('confirmModalContent') as HTMLElement;
    let modalHeader = document.querySelectorAll('#confirmModal header')[0] as HTMLElement;
    modalTitle.innerText = title;
    modalContent.innerHTML = content;
    modalHeader.className = `w3-container ${titleColorClass}`;
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

  static hideInputError(element: HTMLElement) {
    element.classList.remove('w3-border-red');
  }

  static hideStatus() {
    let notificationPanel = document.getElementById('notificationPanel') as HTMLElement;
    OptionPage.hide(notificationPanel);
  }

  static async load(instance: OptionPage) {
    instance.cfg = await WebConfig.build();
  }

  static openModal(id: string) {
    document.getElementById(id).style.display = 'block';
  }

  static show(element: HTMLElement) {
    element.classList.remove('w3-hide');
    element.classList.add('w3-show');
  }

  static showInputError(element: HTMLElement) {
    element.classList.add('w3-border-red');
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
    let advDomainRemove = document.getElementById('advDomainRemove') as HTMLInputElement;
    advDomains.value !== '' ? OptionPage.enableBtn(advDomainRemove) : OptionPage.disableBtn(advDomainRemove);
  }

  async advancedDomainRemove(evt) {
    if (evt.target.classList.contains('disabled')) return false;
    let advDomains = document.getElementById('advDomainSelect') as HTMLInputElement;
    option.cfg['advancedDomains'].splice(option.cfg['advancedDomains'].indexOf(advDomains.value), 1);
    let error = await option.cfg.save('advancedDomains');
    this.advancedDomainList();
  }

  async advancedDomainSave(evt) {
    let advDomains = document.getElementById('advDomainSelect') as HTMLInputElement;
    let advDomainText = document.getElementById('advDomainText') as HTMLInputElement;
    if (advDomains.value == '') { // New record
      option.updateItemList(evt, advDomainText, 'advancedDomains');
    } else { // Updating existing record
      option.updateItemList(evt, advDomainText, 'advancedDomains', advDomains.value);
    }
    let error = await option.cfg.save('advancedDomains');
    this.advancedDomainList();
  }

  confirm(evt, action) {
    switch(action) {
      case 'restoreDefaults':
        OptionPage.configureConfirmModal('Are you sure you want to restore defaults?');
        document.getElementById('confirmModalOK').addEventListener('click', e => { option.restoreDefaults(e)});
        break;
      case 'importConfig':
        OptionPage.configureConfirmModal('Are you sure you want to overwrite your existing settings?');
        document.getElementById('confirmModalOK').addEventListener('click', e => { option.importConfig(e)});
        break;
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
    disabledDomains.value !== '' ? OptionPage.enableBtn(disabledDomainRemove) : OptionPage.disableBtn(disabledDomainRemove);
    disabledDomainText.value = disabledDomains.value;
  }

  async disabledDomainRemove(evt) {
    if (evt.target.classList.contains('disabled')) return false;
    let disabledDomains = document.getElementById('disabledDomainSelect') as HTMLInputElement;
    option.cfg['disabledDomains'].splice(option.cfg['disabledDomains'].indexOf(disabledDomains.value), 1);
    let error = await option.cfg.save('disabledDomains');
    this.disabledDomainList();
  }

  async disabledDomainSave(evt) {
    let disabledDomains = document.getElementById('disabledDomainSelect') as HTMLInputElement;
    let disabledDomainText = document.getElementById('disabledDomainText') as HTMLInputElement;
    if (disabledDomains.value == '') { // New record
      option.updateItemList(evt, disabledDomainText, 'disabledDomains');
    } else { // Updating existing record
      option.updateItemList(evt, disabledDomainText, 'disabledDomains', disabledDomains.value);
    }
    let error = await option.cfg.save('disabledDomains');
    this.disabledDomainList();
  }

  exportConfig() {
    let configText = document.getElementById('configText') as HTMLTextAreaElement;
    configText.value = JSON.stringify(this.cfg, null, 2);
  }

  async importConfig(evt) {
    let self = this;
    OptionPage.closeModal('confirmModal');
    evt.target.removeEventListener('click', option.restoreDefaults);

    try {
      let configText = document.getElementById('configText') as HTMLTextAreaElement;
      self.cfg = new WebConfig(JSON.parse(configText.value));
      self.cfg.sanitizeWords();

      let resetError = await self.cfg.reset();
      if (resetError) {
        throw new Error('Failed to reset config');
      }

      let error = await self.cfg.save();
      if (!error) {
        // console.log('Settings imported successfully!'); // DEBUG Save
        // OptionPage.updateStatus('Settings imported successfully!', false, 3000);
        self.init();
      }
    } catch (e) {
      // console.log('Settings not saved'); // DEBUG Save
      // OptionPage.updateStatus('Settings not saved! Please try again.', true, 5000);
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

  async populateOptions() {
    filter.init();
    this.populateSettings();
    this.populateWordsList();
    this.advancedDomainList();
    this.disabledDomainList();
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
    await this.saveOptions(evt);

    // Update states and Reset word form
    filter.init();
    wordList.selectedIndex = 0;
    this.populateWordsList();
  }

  async restoreDefaults(evt) {
    OptionPage.closeModal('confirmModal');
    evt.target.removeEventListener('click', option.restoreDefaults);

    this.exportConfig();
    let error = await this.cfg.reset();
    if (error) {
      // OptionPage.updateStatus('Error restoring defaults!', true, 5000);
    } else {
      // OptionPage.updateStatus('Default settings restored!', false, 3000);
      this.init();
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
      console.log('error saving');
      // OptionPage.updateStatus('Settings not saved! Please try again.', true, 5000);
    } else {
      self.init();
    }
  }

  async saveWord(evt) {
    let wordList = document.getElementById('wordList') as HTMLSelectElement;
    let wordText = document.getElementById('wordText') as HTMLInputElement;
    let wordMatchRepeated = document.getElementById('wordMatchRepeated') as HTMLInputElement;
    let substitutionText = document.getElementById('substitutionText') as HTMLInputElement;
    let selectedMatchMethod = document.querySelector('input[name="wordMatchMethod"]:checked') as HTMLInputElement;

    let word = wordText.value;
    if (word === '') return false; // Empty word
    let wordOptions = {
      matchMethod: WebConfig._matchMethodNames.indexOf(selectedMatchMethod.value),
      repeat: wordMatchRepeated.checked,
      sub: substitutionText.value
    };

    if (wordList.value === '') { // New record
      // console.log('Adding new word: ', word, wordOptions); // DEBUG
      let result = this.cfg.addWord(word, wordOptions);
    } else { // Updating existing record
      let originalWord = wordList.value;
      if (originalWord == word) { // Word options changed
        // console.log('Modifying existing word options: ', word, wordOptions); // DEBUG
        this.cfg.words[word] = wordOptions;
      } else { // Existing word modified
        // console.log('Modifying existing word: ', word, wordOptions); // DEBUG
        let result = this.cfg.addWord(word, wordOptions);
        delete this.cfg.words[originalWord];
      }
    }

    await this.saveOptions(evt);

    // Update states and Reset word form
    filter.init();
    wordList.selectedIndex = 0;
    this.populateWordsList();
  }

  async selectFilterMethod(evt) {
    option.cfg.filterMethod = WebConfig._filterMethodNames.indexOf(evt.target.value);
    let error = await option.cfg.save('filterMethod');
    this.init();
    // TODO: Handle error
    // option.updateFilterOptions();
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

  updateItemList(evt, input, attr, original = '') {
    if (input.value === '') { // No data
      OptionPage.showInputError(input);
      return false;
    } else {
      if (input.checkValidity()) {
        OptionPage.hideInputError(input);
        if (!option.cfg[attr].includes(input.value)) {
          if (original != '' && option.cfg[attr].includes(original)) {
            // Update existing record (remove it before adding the new record)
            option.cfg[attr].splice(option.cfg[attr].indexOf(original), 1);
          }
          // Save new record
          option.cfg[attr].push(input.value.trim().toLowerCase());
          option.cfg[attr] = option.cfg[attr].sort();
        } else {
          // OptionPage.updateStatus('Error: Already in list.', true, 3000);
        }
      } else {
        OptionPage.showInputError(input);
        // OptionPage.updateStatus('Error: Invalid entry.', true, 5000);
      }
    }
  }
}

let filter = new Filter;
let option = new OptionPage;

////
// Add event listeners to DOM
window.addEventListener('load', e => { option.init(); });
document.querySelectorAll('#menu a').forEach(el => { el.addEventListener('click', e => { option.switchPage(e); }); });
// Modals
document.getElementById('submitPassword').addEventListener('click', e => { option.auth.authenticate(e); })
document.getElementById('confirmModalCancel').addEventListener('click', e => { OptionPage.closeModal('confirmModal'); });
// Settings
document.querySelectorAll('#filterMethod input').forEach(el => { el.addEventListener('click', e => { option.selectFilterMethod(e); }); });
document.getElementById('censorCharacterSelect').addEventListener('click', e => { option.saveOptions(e)});
document.getElementById('censorFixedLengthSelect').addEventListener('click', e => { option.saveOptions(e)});
document.getElementById('defaultWordMatchMethodSelect').addEventListener('click', e => { option.saveOptions(e)});
document.getElementById('defaultWordRepeat').addEventListener('click', e => { option.saveOptions(e)});
document.getElementById('globalMatchMethodSelect').addEventListener('click', e => { option.saveOptions(e)});
document.getElementById('preserveCase').addEventListener('click', e => { option.saveOptions(e)});
document.getElementById('preserveFirst').addEventListener('click', e => { option.saveOptions(e)});
document.getElementById('preserveLast').addEventListener('click', e => { option.saveOptions(e)});
document.getElementById('showCounter').addEventListener('click', e => { option.saveOptions(e)});
document.getElementById('filterWordList').addEventListener('click', e => { option.saveOptions(e)});
document.getElementById('substitutionMark').addEventListener('click', e => { option.saveOptions(e)});
document.getElementById('defaultWordSubstitutionText').addEventListener('change', e => { option.saveOptions(e)});
// Words/Phrases
document.getElementById('wordList').addEventListener('click', e => { option.populateWord(); });
document.getElementById('wordSave').addEventListener('click', e => { option.saveWord(e); });
document.getElementById('wordRemove').addEventListener('click', e => { option.removeWord(e); });
// Domains
document.getElementById('advDomainSelect').addEventListener('change', e => { option.advancedDomainPopulate(); });
document.getElementById('advDomainSave').addEventListener('click', e => { option.advancedDomainSave(e); });
document.getElementById('advDomainRemove').addEventListener('click', e => { option.advancedDomainRemove(e); });
document.getElementById('disabledDomainSelect').addEventListener('change', e => { option.disabledDomainPopulate(); });
document.getElementById('disabledDomainSave').addEventListener('click', e => { option.disabledDomainSave(e); });
document.getElementById('disabledDomainRemove').addEventListener('click', e => { option.disabledDomainRemove(e); });
// Config
document.getElementById('configReset').addEventListener('click', e => { option.confirm(e, 'restoreDefaults'); });
document.getElementById('configExport').addEventListener('click', e => { option.exportConfig(); });
document.getElementById('configImport').addEventListener('click', e => { option.confirm(e, 'importConfig'); });
document.getElementById('setPassword').addEventListener('input', e=> { option.auth.setPasswordButtonText(e); });
document.getElementById('setPasswordBtn').addEventListener('click', e=> { option.auth.setPassword(option); });
// Test
document.getElementById('testText').addEventListener('input', e => { option.populateTest(); });