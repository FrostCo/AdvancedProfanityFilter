import Constants from './lib/constants';
import { dynamicList, escapeHTML, exportToFile, readFile, removeChildren, removeFromArray } from './lib/helper';
import WebConfig from './webConfig';
import Filter from './lib/filter';
import Domain from './domain';
import OptionAuth from './optionAuth';
import DataMigration from './dataMigration';
import Bookmarklet from './bookmarklet';
import WebAudioSites from './webAudioSites';

export default class OptionPage {
  auth: OptionAuth;
  cfg: WebConfig;

  static readonly activeClass = 'w3-flat-belize-hole';

  static closeModal(id: string) {
    OptionPage.hide(document.getElementById(id));
  }

  static configureConfirmModal(settings: ConfirmModalSettings = {}, contentElement?: HTMLElement) {
    let modalTitle = document.getElementById('confirmModalTitle') as HTMLElement;
    let modalContent = document.getElementById('confirmModalContent') as HTMLElement;
    let modalHeader = document.querySelector('#confirmModal header') as HTMLElement;
    let backupButtonContainer = document.querySelector('#confirmModal span.confirmBackupButton') as HTMLElement;
    let backupButton = document.querySelector('#confirmModal button#confirmModalBackup') as HTMLButtonElement;
    removeChildren(modalContent);

    let defaults = {
      backup: false,
      content: 'Are you sure?',
      title: 'Please Confirm',
      titleClass: 'w3-flat-peter-river',
    };
    settings = Object.assign(defaults, settings);

    if (!contentElement) {
      contentElement = document.createElement('span');
      contentElement.textContent = settings.content;
    }

    modalTitle.textContent = settings.title;
    modalContent.appendChild(contentElement);
    modalHeader.className = `w3-container ${settings.titleClass}`;
    if (settings.backup) {
      OptionPage.show(backupButtonContainer);
      OptionPage.enableBtn(backupButton);
    } else {
      OptionPage.hide(backupButtonContainer);
      OptionPage.disableBtn(backupButton);
    }
  }

  static configureStatusModal(content: string, title: string, titleColor: string) {
    let modalTitle = document.getElementById('statusModalTitle') as HTMLElement;
    let modalContent = document.getElementById('statusModalContent') as HTMLElement;
    let modalHeader = document.querySelector('#statusModal header') as HTMLElement;
    let contentElement = document.createElement('span');
    removeChildren(modalContent);

    modalTitle.textContent = title;
    contentElement.textContent = content;
    modalContent.appendChild(contentElement);
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

  backupConfig() {
    const padded = (num: number) => { return ('0' + num).slice(-2); };
    let date = new Date;
    let today = `${date.getFullYear()}-${padded(date.getMonth()+1)}-${padded(date.getDate())}`;
    let time = `${padded(date.getHours())}${padded(date.getMinutes())}${padded(date.getSeconds())}`;
    exportToFile(JSON.stringify(option.cfg.ordered(), null, 2), `apf-backup-${today}_${time}.json`);
  }

  bulkEditorAddRow(word: string = '', data: WordOptions | undefined = undefined) {
    let table = document.querySelector('#bulkWordEditorModal table#bulkWordEditorTable') as HTMLTableElement;
    if (data === undefined) {
      data = {
        lists: [],
        matchMethod: option.cfg.defaultWordMatchMethod,
        repeat: option.cfg.defaultWordRepeat,
        separators: option.cfg.defaultWordSeparators,
        sub: '',
      };
    }

    // Build row
    let row = table.tBodies[0].insertRow();
    row.classList.add('bulkWordRow');

    // Add data
    let cellRemoveRow = row.insertCell(0);
    let cellWord = row.insertCell(1);
    let cellSub = row.insertCell(2);
    let cellMatchMethod = row.insertCell(3);
    let cellRepeat = row.insertCell(4);
    let cellSeparators = row.insertCell(5);

    let removeButton = document.createElement('button');
    removeButton.textContent = 'X';
    removeButton.addEventListener('click', e => { option.bulkEditorRemoveRow(e); });
    cellRemoveRow.appendChild(removeButton);

    let wordInput = document.createElement('input');
    wordInput.type = 'text';
    wordInput.classList.add('bulkAddWordText');
    wordInput.value = word;
    cellWord.appendChild(wordInput);

    let subInput = document.createElement('input');
    subInput.type = 'text';
    cellSub.appendChild(subInput);
    subInput.value = data.sub;

    let matchMethodSelect = document.createElement('select');
    Constants.orderedArray(Constants.MatchMethods).forEach((matchMethod, index) => {
      let optionElement = document.createElement('option');
      optionElement.value = Constants.MatchMethods[matchMethod].toString();
      optionElement.classList.add(`bulkMatchMethod${Constants.MatchMethods[matchMethod]}`);
      optionElement.textContent = matchMethod;
      matchMethodSelect.appendChild(optionElement);
    });
    matchMethodSelect.selectedIndex = data.matchMethod;
    cellMatchMethod.appendChild(matchMethodSelect);

    let repeatInput = document.createElement('input');
    repeatInput.type = 'checkbox';
    repeatInput.name = 'repeat';
    repeatInput.checked = data.repeat;
    cellRepeat.appendChild(repeatInput);

    let separatorsInput = document.createElement('input');
    separatorsInput.type = 'checkbox';
    separatorsInput.name = 'separators';
    separatorsInput.checked = data.separators;
    cellSeparators.appendChild(separatorsInput);

    option.cfg.wordlists.forEach((wordlist, index) => {
      let cell = row.insertCell(index + 6);
      let wordlistInput = document.createElement('input');
      wordlistInput.type = 'checkbox';
      wordlistInput.name = 'wordlists';
      wordlistInput.classList.add('wordlistData');
      wordlistInput.dataset.col = (index + 1).toString();
      wordlistInput.checked = data.lists.includes(index + 1);
      cell.appendChild(wordlistInput);
    });

    // Scroll to the bottom if this is a new word row
    if (word === '') {
      table.parentElement.scrollTop = table.parentElement.scrollHeight - table.parentElement.clientHeight;
      wordInput.focus();
    }
  }

  bulkEditorAddWords() {
    let bulkAddWordsText = document.querySelector('#bulkWordEditorModal textarea#bulkAddWordsText') as HTMLTextAreaElement;
    let text = bulkAddWordsText.value;
    if (text != '') {
      let table = document.querySelector('#bulkWordEditorModal table#bulkWordEditorTable') as HTMLTableElement;
      let lines = text.toLowerCase().split('\n');
      let words = lines.map(line => line.trim());
      let uniqueWords = words.filter((word, index) => words.indexOf(word) === index);

      // Remove any words that already exist in the current table
      let currentWords = option.bulkEditorCurrentWords();
      let wordsToAdd = uniqueWords.filter(newWord => !currentWords.includes(newWord));

      // Add the new words to the table
      wordsToAdd.forEach(function(word) {
        if (word != '') { option.bulkEditorAddRow(word); }
      });

      // Scroll to the bottom
      table.parentElement.scrollTop = table.parentElement.scrollHeight - table.parentElement.clientHeight;

      // Clear textarea after adding to the table
      bulkAddWordsText.value = '';
    }
  }

  bulkEditorRemoveAll() {
    let tBody = document.querySelector('#bulkWordEditorModal table tbody') as HTMLTableSectionElement;
    removeChildren(tBody);
    this.bulkEditorAddRow();
  }

  bulkEditorRemoveRow(event) {
    let table = document.querySelector('#bulkWordEditorModal table#bulkWordEditorTable') as HTMLTableElement;
    let row = event.target.parentElement.parentElement;
    table.deleteRow(row.rowIndex);
  }

  async bulkEditorSave() {
    let table = document.querySelector('#bulkWordEditorModal table#bulkWordEditorTable') as HTMLTableElement;
    let failed = {};
    option.cfg.words = {};

    table.querySelectorAll('tr.bulkWordRow').forEach((tr, index) => {
      let cells = tr.querySelectorAll('td');
      let lists = [];
      let wordlistSelectionsInput = tr.querySelectorAll('input[name="wordlists"]') as NodeListOf<HTMLInputElement>;
      wordlistSelectionsInput.forEach((wordlist, index) => { if (wordlist.checked) { lists.push(index + 1); } });

      let name = (cells[1].querySelector('input') as HTMLInputElement).value;
      if (name != '') {
        let wordOptions: WordOptions = {
          lists: lists,
          matchMethod: (cells[3].querySelector('select') as HTMLSelectElement).selectedIndex,
          repeat: (cells[4].querySelector('input') as HTMLInputElement).checked,
          separators: (cells[5].querySelector('input') as HTMLInputElement).checked,
          sub: (cells[2].querySelector('input') as HTMLInputElement).value
        };
        let success = option.cfg.addWord(name, wordOptions);
        if (!success) {
          failed[name] = wordOptions;
        }
      }
    });

    if (await option.cfg.save('words')) {
      OptionPage.showErrorModal('Failed to save.');
    } else {
      OptionPage.closeModal('bulkWordEditorModal');
      OptionPage.showStatusModal('Words saved successfully.');
      filter.rebuildWordlists();
      option.populateOptions();
    }
  }

  bulkEditorWordlistCheckbox(event) {
    let checked = (event.target as HTMLInputElement).checked;
    document.querySelectorAll(`#bulkWordEditorModal table td input.wordlistData[data-col="${event.target.dataset.col}"]`).forEach((box: HTMLInputElement) => {
      box.checked = checked;
    });
  }

  bulkEditorCurrentWords() {
    let table = document.querySelector('#bulkWordEditorModal table#bulkWordEditorTable') as HTMLTableElement;
    let words = [];
    table.querySelectorAll('tr > td > input.bulkAddWordText').forEach((wordText: HTMLInputElement, index) => {
      words.push(wordText.value);
    });
    return words;
  }

  bulkWordEditorHeaderRow(): HTMLTableRowElement {
    let row = document.createElement('tr');
    let removeCell = document.createElement('th');
    let removeButton = document.createElement('button');
    removeButton.textContent = 'X';
    removeButton.id = 'bulkEditorRemoveAll';
    removeButton.addEventListener('click', e => { option.bulkEditorRemoveAll(); });
    let removeSpan = document.createElement('span');
    removeSpan.textContent = ' Remove';
    removeCell.appendChild(removeButton);
    removeCell.appendChild(removeSpan);
    row.appendChild(removeCell);

    let normalHeaders = ['Word', 'Substitution', 'Match Method', 'Repeated', 'Separators'];
    normalHeaders.forEach(item => {
      let cell = document.createElement('th');
      let cellSpan = document.createElement('span');
      cellSpan.textContent = item;
      cell.appendChild(cellSpan);
      row.appendChild(cell);
    });

    this.cfg.wordlists.forEach((wordlist, i) => {
      let cell = document.createElement('th');
      let inputLabel = document.createElement('label');
      let input = document.createElement('input');
      let span = document.createElement('span');
      input.type = 'checkbox';
      input.classList.add('wordlistHeader');
      input.dataset.col = (i + 1).toString();
      span.textContent = ` ${wordlist}`; // TODO: Fix spacing
      inputLabel.appendChild(input);
      inputLabel.appendChild(span);
      cell.appendChild(inputLabel);
      row.appendChild(cell);
    });

    return row;
  }

  configInlineToggle() {
    let input = document.getElementById('configInlineInput') as HTMLInputElement;
    let configText = document.getElementById('configText') as HTMLTextAreaElement;
    if (input.checked) {
      OptionPage.show(configText);
      option.exportConfig();
    } else {
      OptionPage.hide(configText);
      configText.value = '';
    }
  }

  confirm(evt, action) {
    let ok = document.getElementById('confirmModalOK');
    ok.removeEventListener('click', bulkEditorSave);
    ok.removeEventListener('click', importConfig);
    ok.removeEventListener('click', removeAllWords);
    ok.removeEventListener('click', restoreDefaults);
    ok.removeEventListener('click', setPassword);
    let content;
    let italics;

    switch(action) {
      case 'bulkEditorSave':
        content = document.createElement('span');
        italics = document.createElement('i');
        content.textContent = 'Are you sure you want to save these changes?\n\n';
        italics.textContent = 'Make sure you have a backup first!';
        content.appendChild(italics);
        OptionPage.configureConfirmModal({ backup: true }, content);
        ok.addEventListener('click', bulkEditorSave);
        break;
      case 'importConfig': {
        OptionPage.configureConfirmModal({ content: 'Are you sure you want to overwrite your existing settings?', backup: true });
        ok.addEventListener('click', importConfig);
        break;
      }
      case 'removeAllWords':
        content = document.createElement('span');
        italics = document.createElement('i');
        content.textContent = 'Are you sure you want to remove all words?\n\n';
        italics.textContent = '(Note: The default words will return if no words are added)';
        content.appendChild(italics);
        OptionPage.configureConfirmModal({ }, content);
        ok.addEventListener('click', removeAllWords);
        break;
      case 'restoreDefaults':
        OptionPage.configureConfirmModal({ content: 'Are you sure you want to restore defaults?', backup: true });
        ok.addEventListener('click', restoreDefaults);
        break;
      case 'setPassword': {
        let passwordText = document.getElementById('setPassword') as HTMLInputElement;
        let passwordBtn = document.getElementById('setPasswordBtn') as HTMLInputElement;
        if (passwordBtn.classList.contains('disabled')) return false;

        let message = passwordText.value == '' ? 'Are you sure you want to remove the password?' : `Are you sure you want to set the password to '${passwordText.value}'?`;
        OptionPage.configureConfirmModal({ content: message });
        ok.addEventListener('click', setPassword);
        break;
      }
    }

    OptionPage.openModal('confirmModal');
  }

  confirmModalBackup() {
    let backupButton = document.querySelector('#confirmModal button#confirmModalBackup') as HTMLButtonElement;
    if (!backupButton.classList.contains('disabled')) {
      option.backupConfig();
      OptionPage.disableBtn(backupButton);
    }
  }

  async exportBookmarkletFile() {
    let code = await Bookmarklet.injectConfig(option.cfg.ordered());
    exportToFile(code, 'apfBookmarklet.js');
  }

  exportConfig() {
    let input = document.getElementById('configInlineInput') as HTMLInputElement;

    if (input.checked) { // inline editor
      let configText = document.getElementById('configText') as HTMLTextAreaElement;
      configText.value = JSON.stringify(option.cfg.ordered(), null, 2);
    } else {
      option.backupConfig();
    }
  }

  importConfig(e) {
    let input = document.getElementById('configInlineInput') as HTMLInputElement;
    if (input.checked) { // inline editor
      let configText = document.getElementById('configText') as HTMLTextAreaElement;
      this.importConfigText(configText.value);
    } else {
      let importFileInput = document.getElementById('importFileInput') as HTMLInputElement;
      importFileInput.click();
    }
  }

  async importConfigFile(e) {
    let file = e.target.files[0];
    let importFileInput = document.getElementById('importFileInput') as HTMLInputElement;
    let fileText = await readFile(file) as string;
    option.importConfigText(fileText);
    importFileInput.value = '';
  }

  async importConfigText(cfg: string) {
    let self = this;

    try {
      let importedCfg = new WebConfig(JSON.parse(cfg));
      let migration = new DataMigration(importedCfg);
      migration.runImportMigrations();
      let resetSuccess = await self.restoreDefaults(null, true);

      if (resetSuccess) {
        self.cfg = importedCfg;
        let error = await self.cfg.save();
        if (!error) {
          OptionPage.showStatusModal('Settings imported successfully.');
          self.init();
        } else {
          OptionPage.showErrorModal('Failed to import settings.');
        }
      }
    } catch(e) {
      OptionPage.showErrorModal('Failed to import settings.');
    }
  }

  async init() {
    let self = this;
    self.cfg = await WebConfig.build();
    if (!self.auth) self.auth = new OptionAuth(self.cfg.password);
    filter.cfg = self.cfg;
    filter.init();

    // console.log('Password:', cfg.password, 'Authenticated:', authenticated); // DEBUG Password
    if (self.cfg.password && !self.auth.authenticated) {
      // console.log('Prompt for password'); // DEBUG Password
      OptionPage.openModal('passwordModal');
      document.getElementById('passwordInput').focus();
    } else {
      OptionPage.show(document.getElementById('main'));
    }

    self.populateOptions();
  }

  populateAudio() {
    let muteAudioInput = document.getElementById('muteAudio') as HTMLInputElement;
    let muteAudioOnlyInput = document.getElementById('muteAudioOnly') as HTMLInputElement;
    let muteCueRequireShowingInput = document.getElementById('muteCueRequireShowing') as HTMLInputElement;
    let selectedMuteMethod = document.querySelector(`input[name=audioMuteMethod][value='${this.cfg.muteMethod}']`) as HTMLInputElement;
    let selectedshowSubtitle = document.querySelector(`input[name=audioShowSubtitles][value='${this.cfg.showSubtitles}']`) as HTMLInputElement;
    let muteAudioOptionsContainer = document.getElementById('muteAudioOptionsContainer') as HTMLElement;
    let audioYouTubeAutoSubsMin = document.getElementById('audioYouTubeAutoSubsMin') as HTMLInputElement;
    let audioYouTubeAutoSubsMax = document.getElementById('audioYouTubeAutoSubsMax') as HTMLInputElement;
    let customAudioSitesTextArea = document.getElementById('customAudioSitesText') as HTMLTextAreaElement;
    muteAudioInput.checked = this.cfg.muteAudio;
    muteAudioOnlyInput.checked = this.cfg.muteAudioOnly;
    muteCueRequireShowingInput.checked = this.cfg.muteCueRequireShowing;
    this.cfg.muteAudio ? OptionPage.show(muteAudioOptionsContainer) : OptionPage.hide(muteAudioOptionsContainer);
    selectedMuteMethod.checked = true;
    selectedshowSubtitle.checked = true;
    audioYouTubeAutoSubsMin.value = this.cfg.youTubeAutoSubsMin.toString();
    audioYouTubeAutoSubsMax.value = this.cfg.youTubeAutoSubsMax.toString();
    customAudioSitesTextArea.value = this.cfg.customAudioSites ? JSON.stringify(this.cfg.customAudioSites, null, 2) : '';
  }

  populateBookmarkletPage() {
    let bookmarkletConfig = document.querySelector('input[name="bookmarkletConfig"]:checked') as HTMLInputElement;
    let bookmarkletCustomConfig = document.getElementById('bookmarkletCustomConfig') as HTMLDivElement;
    if (bookmarkletConfig.value == 'default') {
      OptionPage.hide(bookmarkletCustomConfig);
      this.updateBookmarklet(Bookmarklet._defaultBookmarklet);
    } else {
      OptionPage.show(bookmarkletCustomConfig);
      this.updateHostedBookmarklet();
    }
  }

  populateConfig() {
    this.auth.setPasswordButton(option);
  }

  populateDomain() {
    let domainsSelect = document.getElementById('domainSelect') as HTMLInputElement;
    let domainText = document.getElementById('domainText') as HTMLInputElement;
    let domainModeSelect = document.getElementById('domainModeSelect') as HTMLSelectElement;
    let domainDisabledCheck = document.getElementById('domainDisabledCheck') as HTMLInputElement;
    let domainEnabledCheck = document.getElementById('domainEnabledCheck') as HTMLInputElement;
    let domainWordlistSelect = document.getElementById('domainWordlistSelect') as HTMLSelectElement;
    let domainAudioWordlistSelect = document.getElementById('domainAudioWordlistSelect') as HTMLSelectElement;
    let domainRemoveBtn = document.getElementById('domainRemove') as HTMLButtonElement;

    let key = domainsSelect.value;
    domainText.value = key;

    let domainCfg;
    if (!key) { // New record
      OptionPage.disableBtn(domainRemoveBtn);
      domainCfg = Object.assign({}, Domain._domainCfgDefaults);
    } else { // Existing record
      OptionPage.enableBtn(domainRemoveBtn);
      domainCfg = this.cfg.domains[domainsSelect.value];
    }

    let domainKey = domainText.value.trim().toLowerCase();
    if (domainKey == '') { // No data
      domainModeSelect.selectedIndex = Constants.DomainModes.Normal;
    } else {
      let domain = new Domain(domainKey, domainCfg);
      domainModeSelect.selectedIndex = domain.getModeIndex();
    }

    domainDisabledCheck.checked = domainCfg.disabled;
    domainEnabledCheck.checked = domainCfg.enabled;
    let wordlist = domainCfg.wordlist >= 0 ? domainCfg.wordlist + 1 : 0;
    let audioList = domainCfg.audioList >= 0 ? domainCfg.audioList + 1 : 0;
    domainWordlistSelect.selectedIndex = wordlist;
    domainAudioWordlistSelect.selectedIndex = audioList;
  }

  populateDomainPage() {
    let domainModeSelect = document.getElementById('domainModeSelect') as HTMLSelectElement;
    let domainsSelect = document.getElementById('domainSelect') as HTMLSelectElement;
    let domainText = document.getElementById('domainText') as HTMLInputElement;
    let mode = this.cfg.enabledDomainsOnly ? 'minimal' : 'normal';
    let domainMode = document.querySelector(`input[name=domainMode][value='${mode}']`) as HTMLInputElement;
    let wordlistContainer = document.getElementById('domainWordlistContainer') as HTMLInputElement;
    let audioWordlistContainer = document.getElementById('domainAudioWordlistContainer') as HTMLInputElement;
    domainMode.checked = true;
    let domainDisabledLabel = document.getElementById('domainDisabledLabel') as HTMLLabelElement;
    let domainEnabledLabel = document.getElementById('domainEnabledLabel') as HTMLLabelElement;
    OptionPage.hideInputError(domainText);
    removeChildren(domainsSelect);

    let domains = Domain.sortedKeys(this.cfg.domains);
    domains.unshift('Add, or update existing...');
    domains.forEach((domain) => {
      let optionElement = document.createElement('option');
      optionElement.textContent = domain;
      optionElement.value = domain === domains[0] ? '' : domain;
      domainsSelect.appendChild(optionElement);
    });

    if (mode === 'minimal') {
      OptionPage.hide(domainDisabledLabel);
      OptionPage.show(domainEnabledLabel);
    } else {
      OptionPage.hide(domainEnabledLabel);
      OptionPage.show(domainDisabledLabel);
    }

    dynamicList(Constants.orderedArray(Constants.DomainModes), domainModeSelect);

    if (this.cfg.wordlistsEnabled) {
      OptionPage.show(wordlistContainer);
      let domainWordlistSelect = document.getElementById('domainWordlistSelect') as HTMLSelectElement;
      let domainAudioWordlistSelect = document.getElementById('domainAudioWordlistSelect') as HTMLSelectElement;

      let wordlists = ['Default'].concat(WebConfig._allWordlists, this.cfg.wordlists);
      dynamicList(wordlists, domainWordlistSelect);
      if (this.cfg.muteAudio) {
        OptionPage.show(audioWordlistContainer);
        dynamicList(wordlists, domainAudioWordlistSelect);
      } else {
        OptionPage.hide(audioWordlistContainer);
      }
    } else {
      OptionPage.hide(wordlistContainer);
      OptionPage.hide(audioWordlistContainer);
    }

    this.populateDomain();
  }

  populateOptions() {
    this.populateSettings();
    this.populateWordPage();
    this.populateWhitelist();
    this.populateWordlists();
    this.populateDomainPage();
    this.populateAudio();
    this.populateConfig();
    this.populateTest();
  }

  populateSettings() {
    this.updateFilterOptions();

    // Settings
    let selectedFilter = document.getElementById(`filter${Constants.filterMethodName(option.cfg.filterMethod)}`) as HTMLInputElement;
    let showCounter = document.getElementById('showCounter') as HTMLInputElement;
    let showSummary = document.getElementById('showSummary') as HTMLInputElement;
    let showUpdateNotification = document.getElementById('showUpdateNotification') as HTMLInputElement;
    let filterWordList = document.getElementById('filterWordList') as HTMLInputElement;
    selectedFilter.checked = true;
    showCounter.checked = this.cfg.showCounter;
    showSummary.checked = this.cfg.showSummary;
    showUpdateNotification.checked = this.cfg.showUpdateNotification;
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
    let defaultWordMatchMethodSelect = document.getElementById('defaultWordMatchMethodSelect') as HTMLSelectElement;
    let defaultWordRepeat = document.getElementById('defaultWordRepeat') as HTMLInputElement;
    let defaultWordSeparators = document.getElementById('defaultWordSeparators') as HTMLInputElement;
    defaultWordRepeat.checked = this.cfg.defaultWordRepeat;
    defaultWordSeparators.checked = this.cfg.defaultWordSeparators;
    let defaultWordSubstitution = document.getElementById('defaultWordSubstitutionText') as HTMLInputElement;
    defaultWordSubstitution.value = this.cfg.defaultSubstitution;
    removeChildren(defaultWordMatchMethodSelect);
    for (let i = 0; i < 3; i++) { // Skip Regex
      let optionElement = document.createElement('option');
      let matchMethodName = Constants.matchMethodName(i);
      optionElement.value = matchMethodName;
      optionElement.textContent = matchMethodName;
      defaultWordMatchMethodSelect.appendChild(optionElement);
    }
    defaultWordMatchMethodSelect.selectedIndex = this.cfg.defaultWordMatchMethod;
  }

  populateTest() {
    let testText = document.getElementById('testText') as HTMLInputElement;
    let filteredTestText = document.getElementById('filteredTestText') as HTMLElement;

    if (testText.value === '') {
      filteredTestText.textContent = 'Enter some text above to test the filter...';
    } else {
      filteredTestText.textContent = filter.replaceText(testText.value, filter.cfg.wordlistId, false);
    }
  }

  populateWhitelist() {
    let regExp = RegExp(' [*]$');
    let sensitiveList = filter.cfg.wordWhitelist.map((item) => { return item + ' *'; });
    let list = [].concat(sensitiveList, filter.cfg.iWordWhitelist).sort();
    let whitelist = document.getElementById('whitelist') as HTMLSelectElement;
    removeChildren(whitelist);
    list.unshift('Add, or update existing...');
    list.forEach((item) => {
      let optionElement = document.createElement('option');
      optionElement.value = item === list[0] ? '' : item.replace(regExp, '');
      optionElement.dataset.sensitive = regExp.test(item).toString();
      optionElement.textContent = escapeHTML(item);
      whitelist.appendChild(optionElement);
    });
    this.populateWhitelistWord();
  }

  populateWhitelistWord() {
    let whitelist = document.getElementById('whitelist') as HTMLSelectElement;
    let whitelistRemove = document.getElementById('whitelistRemove') as HTMLInputElement;
    let whitelistText = document.getElementById('whitelistText') as HTMLInputElement;
    let selected = whitelist.selectedOptions[0];

    if (selected.value == '') { // New word
      whitelistText.value = '';
      OptionPage.disableBtn(whitelistRemove);

      // Default to case-insensitive
      let whitelistCase = document.getElementById('whitelistInsensitive') as HTMLInputElement;
      whitelistCase.checked = true;
    } else {
      whitelistText.value = selected.value;
      let caseId = selected.dataset.sensitive === 'true' ? 'whitelistSensitive' : 'whitelistInsensitive';
      let whitelistCase = document.getElementById(caseId) as HTMLInputElement;
      whitelistCase.checked = true;
      OptionPage.enableBtn(whitelistRemove);
    }
  }

  populateWord() {
    let wordList = document.getElementById('wordList') as HTMLSelectElement;
    let wordText = document.getElementById('wordText') as HTMLInputElement;
    let wordMatchRepeated = document.getElementById('wordMatchRepeated') as HTMLInputElement;
    let wordMatchSeparators = document.getElementById('wordMatchSeparators') as HTMLInputElement;
    let substitutionText = document.getElementById('substitutionText') as HTMLInputElement;
    let wordRemove = document.getElementById('wordRemove') as HTMLInputElement;
    let word = wordList.value;
    let wordWordlistDiv = document.getElementById('wordWordlistDiv') as HTMLSelectElement;
    let wordlistSelections = document.querySelectorAll('div#wordlistSelections input') as NodeListOf<HTMLInputElement>;
    OptionPage.hideInputError(wordText);
    OptionPage.hideInputError(substitutionText);

    if (word == '') { // New word
      wordText.value = '';
      OptionPage.disableBtn(wordRemove);
      let selectedMatchMethod = document.getElementById(`wordMatch${Constants.matchMethodName(option.cfg.defaultWordMatchMethod)}`) as HTMLInputElement;
      selectedMatchMethod.checked = true;
      wordMatchRepeated.checked = option.cfg.defaultWordRepeat;
      wordMatchSeparators.checked = option.cfg.defaultWordSeparators;
      substitutionText.value = '';
      wordlistSelections.forEach(function(wordlist, index) {
        wordlist.checked = (
          index == (option.cfg.wordlistId - 1)
          || (
            option.cfg.muteAudio
            && index == (option.cfg.audioWordlistId - 1)
          )
        );
      });
    } else { // Existing word
      OptionPage.enableBtn(wordRemove);
      let wordCfg = option.cfg.words[word];
      wordText.value = word;
      let selectedMatchMethod = document.getElementById(`wordMatch${Constants.matchMethodName(wordCfg.matchMethod)}`) as HTMLInputElement;
      selectedMatchMethod.checked = true;
      wordMatchRepeated.checked = wordCfg.repeat;
      wordMatchSeparators.checked = wordCfg.separators === undefined ? option.cfg.defaultWordSeparators : wordCfg.separators;
      substitutionText.value = wordCfg.sub;
      wordlistSelections.forEach(function(wordlist, index) {
        wordlist.checked = wordCfg.lists.includes(index + 1);
      });
    }

    if (option.cfg.wordlistsEnabled) {
      OptionPage.show(wordWordlistDiv);
    } else {
      OptionPage.hide(wordWordlistDiv);
    }
  }

  populateWordlist() {
    let wordlistSelect = document.getElementById('wordlistSelect') as HTMLSelectElement;
    let wordlistText = document.getElementById('wordlistText') as HTMLInputElement;
    wordlistText.value = wordlistSelect.value;
  }

  populateWordlists(selectedIndex: number = 0) {
    let wordlistsEnabledInput = document.getElementById('wordlistsEnabled') as HTMLInputElement;
    let wordlistContainer = document.getElementById('wordlistContainer') as HTMLElement;
    wordlistsEnabledInput.checked = this.cfg.wordlistsEnabled;

    if (this.cfg.wordlistsEnabled) {
      let wordlistSelect = document.getElementById('wordlistSelect') as HTMLSelectElement;
      let textWordlistSelect = document.getElementById('textWordlistSelect') as HTMLSelectElement;
      let audioWordlistDiv = document.getElementById('audioWordlistDiv') as HTMLElement;
      let audioWordlistSelect = document.getElementById('audioWordlistSelect') as HTMLSelectElement;
      dynamicList(this.cfg.wordlists, wordlistSelect);
      dynamicList(WebConfig._allWordlists.concat(this.cfg.wordlists), textWordlistSelect);
      wordlistSelect.selectedIndex = selectedIndex;
      textWordlistSelect.selectedIndex = this.cfg.wordlistId;

      if (this.cfg.muteAudio) {
        dynamicList(WebConfig._allWordlists.concat(this.cfg.wordlists), audioWordlistSelect);
        audioWordlistSelect.selectedIndex = this.cfg.audioWordlistId;
        OptionPage.show(audioWordlistDiv);
      } else {
        OptionPage.hide(audioWordlistDiv);
      }

      OptionPage.show(wordlistContainer);
      this.populateWordlist();
    } else {
      OptionPage.hide(wordlistContainer);
    }
  }

  populateWordPage() {
    let wordlistFilter = filter;
    let selections = document.getElementById('wordlistSelections') as HTMLInputElement;
    let wordsSelect = document.getElementById('wordList') as HTMLSelectElement;
    removeChildren(wordsSelect);

    // Workaround for remove filter method
    if (filter.cfg.filterWordList && filter.cfg.filterMethod === 2) {
      wordlistFilter = new Filter;
      // Works because we are only changing a native value (filterMethod: number)
      wordlistFilter.cfg = new WebConfig(Object.assign({}, this.cfg, { filterMethod: 0 }));
      wordlistFilter.init();
    }

    let words = Object.keys(option.cfg.words).sort();
    words.unshift('Add, or update existing...');
    words.forEach(word => {
      let filteredWord = word;
      if (word != words[0] && wordlistFilter.cfg.filterWordList) {
        if (wordlistFilter.cfg.words[word].matchMethod === Constants.MatchMethods.Regex) { // Regexp
          filteredWord = wordlistFilter.cfg.words[word].sub || wordlistFilter.cfg.defaultSubstitution;
        } else {
          filteredWord = wordlistFilter.replaceText(word, 0, false); // Using 0 (All) here to filter all words
        }
      }

      let optionElement = document.createElement('option');
      optionElement.value = word === words[0] ? '' : word;
      optionElement.dataset.filtered = filteredWord;
      optionElement.textContent = escapeHTML(filteredWord);
      wordsSelect.appendChild(optionElement);
    });

    // Dynamically create the wordlist selection checkboxes
    if (selections.hasChildNodes()) { removeChildren(selections); }
    option.cfg.wordlists.forEach(function(list, index) {
      let div = document.createElement('div');
      let label = document.createElement('label');
      let input = document.createElement('input');
      let name = document.createTextNode(list);
      input.type = 'checkbox';
      input.classList.add('w3-check');
      input.name = 'wordlistSelection';
      input.value = index.toString();
      label.appendChild(input);
      label.appendChild(name);
      div.appendChild(label);
      selections.appendChild(div);
    });

    this.populateWord();
  }

  removeAllWords(evt) {
    this.cfg.words = {};
    let wordList = document.getElementById('wordList') as HTMLSelectElement;
    wordList.selectedIndex = 0;
    filter.rebuildWordlists();
    this.populateOptions();
  }

  async removeDomain(event) {
    let domainsSelect = document.getElementById('domainSelect') as HTMLInputElement;
    if (domainsSelect.value) {
      delete this.cfg.domains[domainsSelect.value];

      let error = await this.cfg.save('domains');
      if (error) {
        OptionPage.showErrorModal();
        return false;
      } else {
        this.populateDomainPage();
      }
    }
  }

  async removeWhitelist(evt) {
    let whitelist = document.getElementById('whitelist') as HTMLSelectElement;
    let selected = whitelist.selectedOptions[0];
    let originalWord = selected.value;
    let originalCase = selected.dataset.sensitive === 'true' ? 'sensitive': 'insensitive';
    let originalListName = originalCase === 'sensitive' ? 'wordWhitelist' : 'iWordWhitelist';
    option.cfg[originalListName] = removeFromArray(option.cfg[originalListName], originalWord);

    let error = await option.cfg.save(originalListName);
    if (error) {
      OptionPage.showErrorModal();
      return false;
    } else {
      filter.init();
      this.populateOptions();
    }
  }

  async removeWord(evt) {
    if (evt.target.classList.contains('disabled')) return false;
    let wordList = document.getElementById('wordList') as HTMLSelectElement;
    let word = wordList.value;

    let result = this.cfg.removeWord(word);
    if (result) {
      result = await this.saveOptions(evt);
      if (result) {
        // Update states and Reset word form
        wordList.selectedIndex = 0;
        filter.rebuildWordlists();
        this.populateOptions();
      }
    }
  }

  async renameWordlist() {
    let wordlistSelect = document.getElementById('wordlistSelect') as HTMLSelectElement;
    let wordlistText = document.getElementById('wordlistText') as HTMLInputElement;
    let name = wordlistText.value.trim();
    let index = wordlistSelect.selectedIndex;

    if (wordlistText.checkValidity()) {
      // Make sure there are no duplicates
      if (this.cfg.wordlists.includes(name)) {
        OptionPage.showInputError(wordlistText, 'Please enter a unique name.');
        return false;
      }

      this.cfg.wordlists[index] = name;
      if (await this.saveProp('wordlists')) {
        this.populateWordlists(index);
        this.populateWordPage();
      } else {
        OptionPage.showErrorModal('Failed to save name.');
      }
    } else {
      OptionPage.showInputError(wordlistText, 'Please enter a valid name.');
    }
  }

  async restoreDefaults(evt, silent = false) {
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

  async saveCustomAudioSites() {
    let self = this;
    let customAudioSitesTextArea = document.getElementById('customAudioSitesText') as HTMLTextAreaElement;
    try {
      let text = customAudioSitesTextArea.value;
      self.cfg.customAudioSites = text == '' ? null : JSON.parse(text);
      if (await option.saveProp('customAudioSites')) {
        customAudioSitesTextArea.value = self.cfg.customAudioSites ? JSON.stringify(self.cfg.customAudioSites, null, 2) : '';
        OptionPage.showStatusModal('Custom Audio Sites saved.');
      }
    } catch(e) {
      OptionPage.showErrorModal('Failed to save custom audio sites. Please make sure it is valid JSON.');
    }
  }

  async saveDomain(event) {
    let domainsSelect = document.getElementById('domainSelect') as HTMLInputElement;
    let domainText = document.getElementById('domainText') as HTMLInputElement;
    let domainModeSelect = document.getElementById('domainModeSelect') as HTMLSelectElement;
    let domainDisabledCheck = document.getElementById('domainDisabledCheck') as HTMLInputElement;
    let domainEnabledCheck = document.getElementById('domainEnabledCheck') as HTMLInputElement;
    let domainWordlistSelect = document.getElementById('domainWordlistSelect') as HTMLSelectElement;
    let domainAudioWordlistSelect = document.getElementById('domainAudioWordlistSelect') as HTMLSelectElement;

    let originalKey = domainsSelect.value;
    let newKey = domainText.value.trim().toLowerCase();

    if (newKey == '') { // No data
      OptionPage.showInputError(domainText, 'Please enter a value.');
      return false;
    }

    if (domainText.checkValidity()) {
      OptionPage.hideInputError(domainText);
      if (newKey != originalKey) { delete this.cfg.domains[originalKey]; } // URL changed: remove old entry

      let wordlist = domainWordlistSelect.selectedIndex > 0 ? domainWordlistSelect.selectedIndex - 1 : undefined;
      let audioList = domainAudioWordlistSelect.selectedIndex > 0 ? domainAudioWordlistSelect.selectedIndex - 1 : undefined;
      let newDomainCfg: DomainCfg = {
        audioList: audioList,
        disabled: domainDisabledCheck.checked,
        enabled: domainEnabledCheck.checked,
        wordlist: wordlist,
      };
      let domain = new Domain(newKey, newDomainCfg);
      domain.updateFromModeIndex(domainModeSelect.selectedIndex);
      let error = await domain.save(this.cfg);

      if (error) {
        OptionPage.showErrorModal();
        return false;
      } else {
        this.populateDomainPage();
      }
    } else {
      OptionPage.showInputError(domainText, 'Valid domain example: google.com or www.google.com');
      return false;
    }
  }

  async saveOptions(evt) {
    let self = this;
    // Gather current settings
    let censorCharacterSelect = document.getElementById('censorCharacterSelect') as HTMLSelectElement;
    let censorFixedLengthSelect = document.getElementById('censorFixedLengthSelect') as HTMLSelectElement;
    let defaultWordMatchMethodSelect = document.getElementById('defaultWordMatchMethodSelect') as HTMLSelectElement;
    let defaultWordRepeat = document.getElementById('defaultWordRepeat') as HTMLInputElement;
    let defaultWordSeparators = document.getElementById('defaultWordSeparators') as HTMLInputElement;
    let preserveCase = document.getElementById('preserveCase') as HTMLInputElement;
    let preserveFirst = document.getElementById('preserveFirst') as HTMLInputElement;
    let preserveLast = document.getElementById('preserveLast') as HTMLInputElement;
    let showCounter = document.getElementById('showCounter') as HTMLInputElement;
    let showSummary = document.getElementById('showSummary') as HTMLInputElement;
    let showUpdateNotification = document.getElementById('showUpdateNotification') as HTMLInputElement;
    let filterWordList = document.getElementById('filterWordList') as HTMLInputElement;
    let substitutionMark = document.getElementById('substitutionMark') as HTMLInputElement;
    let defaultWordSubstitution = document.getElementById('defaultWordSubstitutionText') as HTMLInputElement;
    let domainMode = document.querySelector('input[name="domainMode"]:checked') as HTMLInputElement;
    let muteAudioInput = document.getElementById('muteAudio') as HTMLInputElement;
    let muteAudioOnlyInput = document.getElementById('muteAudioOnly') as HTMLInputElement;
    let muteCueRequireShowingInput = document.getElementById('muteCueRequireShowing') as HTMLInputElement;
    let muteMethodInput = document.querySelector('input[name="audioMuteMethod"]:checked') as HTMLInputElement;
    let showSubtitlesInput = document.querySelector('input[name="audioShowSubtitles"]:checked') as HTMLInputElement;
    let wordlistsEnabledInput = document.getElementById('wordlistsEnabled') as HTMLInputElement;
    self.cfg.censorCharacter = censorCharacterSelect.value;
    self.cfg.censorFixedLength = censorFixedLengthSelect.selectedIndex;
    self.cfg.defaultWordMatchMethod = defaultWordMatchMethodSelect.selectedIndex;
    self.cfg.defaultWordRepeat = defaultWordRepeat.checked;
    self.cfg.defaultWordSeparators = defaultWordSeparators.checked;
    self.cfg.preserveCase = preserveCase.checked;
    self.cfg.preserveFirst = preserveFirst.checked;
    self.cfg.preserveLast = preserveLast.checked;
    self.cfg.showCounter = showCounter.checked;
    self.cfg.showSummary = showSummary.checked;
    self.cfg.showUpdateNotification = showUpdateNotification.checked;
    self.cfg.filterWordList = filterWordList.checked;
    self.cfg.substitutionMark = substitutionMark.checked;
    self.cfg.defaultSubstitution = defaultWordSubstitution.value.trim().toLowerCase();
    self.cfg.enabledDomainsOnly = (domainMode.value === 'minimal');
    self.cfg.muteAudio = muteAudioInput.checked;
    self.cfg.muteAudioOnly = muteAudioOnlyInput.checked;
    self.cfg.muteCueRequireShowing = muteCueRequireShowingInput.checked;
    self.cfg.muteMethod = parseInt(muteMethodInput.value);
    self.cfg.showSubtitles = parseInt(showSubtitlesInput.value);
    self.cfg.wordlistsEnabled = wordlistsEnabledInput.checked;

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

  async saveWhitelist(evt) {
    let whitelist = document.getElementById('whitelist') as HTMLSelectElement;
    let selected = whitelist.selectedOptions[0];
    let selectedCase = document.querySelector('input[name="whitelistCase"]:checked') as HTMLInputElement;
    let whitelistText = document.getElementById('whitelistText') as HTMLInputElement;

    let propsToSave = [];
    let newCase = selectedCase.value;
    let newWord = newCase === 'sensitive' ? whitelistText.value : whitelistText.value.toLowerCase();
    let newListName = newCase === 'sensitive' ? 'wordWhitelist' : 'iWordWhitelist';

    if (whitelistText.value === '') {
      OptionPage.showInputError(whitelistText, 'Please enter a valid word/phrase.');
      return false;
    }

    if (option.cfg[newListName].indexOf(newWord) > -1) {
      OptionPage.showInputError(whitelistText, 'Already whitelisted.');
      return false;
    }

    if (whitelistText.checkValidity()) {
      if (selected.value === '') { // New word
        option.cfg[newListName].push(newWord);
        propsToSave.push(newListName);
      } else { // Modifying existing word
        let originalWord = selected.value;
        let originalCase = selected.dataset.sensitive === 'true' ? 'sensitive': 'insensitive';
        let originalListName = originalCase === 'sensitive' ? 'wordWhitelist' : 'iWordWhitelist';

        if ((originalWord != newWord) || (originalCase != newCase)) {
          option.cfg[originalListName] = removeFromArray(option.cfg[originalListName], originalWord);
          option.cfg[newListName].push(newWord);
          originalListName === newListName ? propsToSave.push(newListName) : propsToSave.push(originalListName, newListName);
        }
      }

      if (propsToSave.length) {
        propsToSave.forEach(prop => {
          option.cfg[prop] = option.cfg[prop].sort();
        });
        let error = await option.cfg.save(propsToSave);
        if (error) {
          OptionPage.showErrorModal();
          return false;
        } else {
          filter.init();
          this.populateOptions();
        }
      }
    } else {
      OptionPage.showInputError(whitelistText, 'Please enter a valid word/phrase.');
    }
  }

  async saveWord(evt) {
    let wordList = document.getElementById('wordList') as HTMLSelectElement;
    let wordText = document.getElementById('wordText') as HTMLInputElement;
    let wordMatchRepeated = document.getElementById('wordMatchRepeated') as HTMLInputElement;
    let wordMatchSeparators = document.getElementById('wordMatchSeparators') as HTMLInputElement;
    let substitutionText = document.getElementById('substitutionText') as HTMLInputElement;
    let selectedMatchMethod = document.querySelector('input[name="wordMatchMethod"]:checked') as HTMLInputElement;
    let word = wordText.value.trim().toLowerCase();
    let sub = substitutionText.value.trim().toLowerCase();
    let added = true;
    let wordlistSelectionsInput = document.querySelectorAll('div#wordlistSelections input') as NodeListOf<HTMLInputElement>;

    if (word == '') {
      OptionPage.showInputError(wordText, 'Please enter a valid word/phrase.');
      return false;
    }

    // Make sure word and substitution are different
    if (word == sub) {
      OptionPage.showInputError(substitutionText, 'Word and substitution must be different.');
      return false;
    }

    if (wordText.checkValidity()) {
      let lists = [];
      wordlistSelectionsInput.forEach((wordlist, index) => { if (wordlist.checked) { lists.push(index + 1); } });

      let wordOptions: WordOptions = {
        lists: lists,
        matchMethod: Constants.MatchMethods[selectedMatchMethod.value],
        repeat: wordMatchRepeated.checked,
        separators: wordMatchSeparators.checked,
        sub: sub
      };

      // Check for endless substitution loop
      if (wordOptions.matchMethod != Constants.MatchMethods.Regex) {
        let subFilter = new Filter;
        let words = {};
        words[word] = wordOptions;
        subFilter.cfg = new WebConfig(Object.assign({}, this.cfg, { filterMethod: Constants.FilterMethods.Substitute }, { words: words }));
        subFilter.init();
        let first = subFilter.replaceTextResult(word);
        let second = subFilter.replaceTextResult(first.filtered);
        if (first.filtered != second.filtered) {
          OptionPage.showInputError(substitutionText, "Substitution can't contain word (causes an endless loop).");
          return false;
        }
      }

      // Test for a valid Regex
      if (wordOptions.matchMethod === Constants.MatchMethods.Regex) {
        let subFilter = new Filter;
        let words = {};
        words[word] = wordOptions;
        subFilter.cfg = new WebConfig(Object.assign({}, this.cfg, { words: words }));
        subFilter.init();
        if (subFilter.wordlists[subFilter.wordlistId].regExps.length === 0) {
          OptionPage.showInputError(wordText, 'Invalid Regex.');
          return false;
        }
      }

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
        filter.rebuildWordlists();
        this.populateOptions();
      } else {
        OptionPage.showInputError(wordText, `'${word}' already in list.`);
      }
    } else {
      OptionPage.showInputError(wordText, 'Please enter a valid word/phrase.');
    }
  }

  async selectFilterMethod(evt) {
    option.cfg.filterMethod = Constants.FilterMethods[evt.target.value];
    if (await option.saveProp('filterMethod')) {
      filter.rebuildWordlists();
      this.populateOptions();
    }
  }

  async setDefaultWordlist(element: HTMLSelectElement) {
    let prop = element.id === 'textWordlistSelect' ? 'wordlistId' : 'audioWordlistId';
    this.cfg[prop] = element.selectedIndex;

    if (!await this.saveProp(prop)) {
      OptionPage.showErrorModal('Failed to update defult wordlist.');
      return false;
    }

    this.populateOptions();
  }

  showBulkWordEditor() {
    let modalId = 'bulkWordEditorModal';
    let title = document.querySelector(`#${modalId} h5.modalTitle`) as HTMLHeadingElement;
    let tableContainer = document.querySelector(`#${modalId} div.tableContainer`) as HTMLDivElement;
    let table = tableContainer.querySelector('table') as HTMLTableElement;
    title.textContent = 'Bulk Word Editor';
    if (table.tHead.rows.length === 0) { table.tHead.appendChild(option.bulkWordEditorHeaderRow()); }
    let tBody = table.querySelector('tbody') as HTMLTableSectionElement;
    removeChildren(tBody);

    // Add current words to the table
    let wordKeys = Object.keys(option.cfg.words);
    if (wordKeys.length === 0) {
      option.bulkEditorAddRow();
    } else {
      wordKeys.forEach(key => {
        option.bulkEditorAddRow(key, option.cfg.words[key]);
      });
    }

    tableContainer.querySelectorAll('th input.wordlistHeader').forEach(el => { el.addEventListener('click', e => { option.bulkEditorWordlistCheckbox(e); }); });
    OptionPage.openModal(modalId);
  }

  showSupportedAudioSites() {
    let title = document.querySelector('#supportedAudioSitesModal h5.modalTitle') as HTMLHeadingElement;
    let contentLeft = document.querySelector('#supportedAudioSitesModal div#modalContentLeft') as HTMLDivElement;
    removeChildren(contentLeft);
    let sortedSites = Object.keys(WebAudioSites.sites).sort(function(a,b) {
      let domainA = a.match(/\w*\.\w*$/)[0];
      let domainB = b.match(/\w*\.\w*$/)[0];
      return domainA < domainB ? -1 : domainA > domainB ? 1 : 0;
    });
    let ul = document.createElement('ul');
    sortedSites.forEach(site => {
      let li = document.createElement('li');
      let a = document.createElement('a');
      a.href = `https://${site}`;
      a.target = '_blank';
      a.textContent = site;
      li.appendChild(a);
      ul.appendChild(li);
    });
    title.textContent = 'Supported Audio Sites';
    contentLeft.appendChild(ul);

    let textArea = document.querySelector('#supportedAudioSitesModal div#modalContentRight textarea') as HTMLTextAreaElement;
    textArea.textContent = JSON.stringify(WebAudioSites.sites, null, 2);
    OptionPage.openModal('supportedAudioSitesModal');
  }

  switchPage(evt) {
    let currentTab = document.querySelector(`#menu a.${OptionPage.activeClass}`) as HTMLElement;
    let newTab = evt.target as HTMLElement;

    currentTab.classList.remove(OptionPage.activeClass);
    newTab.classList.add(OptionPage.activeClass);

    let currentPage = document.getElementById(currentTab.textContent.toLowerCase() + 'Page') as HTMLElement;
    let newPage = document.getElementById(newTab.textContent.toLowerCase() + 'Page') as HTMLElement;
    OptionPage.hide(currentPage);
    OptionPage.show(newPage);

    switch (newTab.textContent.toLowerCase()) {
      case 'test':
        document.getElementById('testText').focus();
        break;
    }
  }

  updateBookmarklet(url: string) {
    let bookmarkletLink = document.getElementById('bookmarkletLink') as HTMLAnchorElement;
    let bookmarklet = new Bookmarklet(url);
    bookmarkletLink.href = bookmarklet.destination();
    OptionPage.enableBtn(bookmarkletLink);
  }

  updateHostedBookmarklet() {
    let bookmarkletLink = document.getElementById('bookmarkletLink') as HTMLAnchorElement;
    let bookmarkletHostedURLInput = document.getElementById('bookmarkletHostedURL') as HTMLInputElement;
    OptionPage.hideInputError(bookmarkletHostedURLInput);

    if (bookmarkletHostedURLInput.checkValidity()) {
      this.updateBookmarklet(bookmarkletHostedURLInput.value);
    } else {
      if (bookmarkletHostedURLInput.value !== '') {
        OptionPage.showInputError(bookmarkletHostedURLInput, 'Please enter a valid URL.');
      }
      bookmarkletLink.href = '#0';
      OptionPage.disableBtn(bookmarkletLink);
    }
  }

  updateFilterOptions() {
    // Show/hide options as needed
    switch(this.cfg.filterMethod) {
      case Constants.FilterMethods.Censor:
        OptionPage.show(document.getElementById('censorSettings'));
        OptionPage.hide(document.getElementById('substitutionSettings'));
        OptionPage.hide(document.getElementById('wordSubstitution'));
        break;
      case Constants.FilterMethods.Substitute:
        OptionPage.hide(document.getElementById('censorSettings'));
        OptionPage.show(document.getElementById('substitutionSettings'));
        OptionPage.show(document.getElementById('wordSubstitution'));
        break;
      case Constants.FilterMethods.Remove:
        OptionPage.hide(document.getElementById('censorSettings'));
        OptionPage.hide(document.getElementById('substitutionSettings'));
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

  async updateYouTubeAutoLimits(target) {
    OptionPage.hideInputError(target);
    if (target.checkValidity()) {
      let updateMin = target.id === 'audioYouTubeAutoSubsMin';
      let min = parseFloat(updateMin ? target.value : (document.getElementById('audioYouTubeAutoSubsMin') as HTMLInputElement).value);
      let max = parseFloat(updateMin ? (document.getElementById('audioYouTubeAutoSubsMax') as HTMLInputElement).value : target.value);
      if (min != 0 && max != 0 && min > max) {
        OptionPage.showInputError(target, 'Min must be less than max.');
      } else {
        let prop = updateMin ? 'youTubeAutoSubsMin' : 'youTubeAutoSubsMax';
        this.cfg[prop] = parseFloat(target.value);
        await option.saveProp(prop);
      }
    } else {
      OptionPage.showInputError(target, 'Please enter a valid number of seconds.');
    }
  }
}

let filter = new Filter;
let option = new OptionPage;

////
// Events
// Functions
function bulkEditorSave(e) { option.bulkEditorSave(); }
function importConfig(e) { option.importConfig(e); }
function removeAllWords(e) { option.removeAllWords(e); }
function restoreDefaults(e) { option.restoreDefaults(e); }
function setPassword(e) { option.auth.setPassword(option); }
// Add event listeners to DOM
window.addEventListener('load', e => { option.init(); });
document.querySelectorAll('#menu a').forEach(el => { el.addEventListener('click', e => { option.switchPage(e); }); });
// Modals
document.getElementById('submitPassword').addEventListener('click', e => { option.auth.authenticate(e); });
document.getElementById('confirmModalBackup').addEventListener('click', e => { option.confirmModalBackup(); });
document.getElementById('confirmModalOK').addEventListener('click', e => { OptionPage.closeModal('confirmModal'); });
document.getElementById('confirmModalCancel').addEventListener('click', e => { OptionPage.closeModal('confirmModal'); });
document.getElementById('statusModalOK').addEventListener('click', e => { OptionPage.closeModal('statusModal'); });
document.querySelector('#supportedAudioSitesModal button.modalOK').addEventListener('click', e => { OptionPage.closeModal('supportedAudioSitesModal'); });
document.querySelector('#bulkWordEditorModal button.modalAddWord').addEventListener('click', e => { option.bulkEditorAddRow(); });
document.querySelector('#bulkWordEditorModal button.modalBulkAddWords').addEventListener('click', e => { option.bulkEditorAddWords(); });
document.querySelector('#bulkWordEditorModal button.modalCancel').addEventListener('click', e => { OptionPage.closeModal('bulkWordEditorModal'); });
document.querySelector('#bulkWordEditorModal button.modalSave').addEventListener('click', e => { option.confirm(e, 'bulkEditorSave'); });
// Settings
document.querySelectorAll('#filterMethod input').forEach(el => { el.addEventListener('click', e => { option.selectFilterMethod(e); }); });
document.getElementById('censorCharacterSelect').addEventListener('change', e => { option.saveOptions(e); });
document.getElementById('censorFixedLengthSelect').addEventListener('change', e => { option.saveOptions(e); });
document.getElementById('defaultWordMatchMethodSelect').addEventListener('change', e => { option.saveOptions(e); });
document.getElementById('defaultWordRepeat').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('defaultWordSeparators').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('preserveCase').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('preserveFirst').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('preserveLast').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('showCounter').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('showSummary').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('showUpdateNotification').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('filterWordList').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('substitutionMark').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('defaultWordSubstitutionText').addEventListener('change', e => { option.saveOptions(e); });
// Words/Phrases
document.getElementById('wordList').addEventListener('change', e => { option.populateWord(); });
document.getElementById('wordText').addEventListener('input', e => { OptionPage.hideInputError(e.target); });
document.getElementById('substitutionText').addEventListener('input', e => { OptionPage.hideInputError(e.target); });
document.getElementById('wordSave').addEventListener('click', e => { option.saveWord(e); });
document.getElementById('wordRemove').addEventListener('click', e => { option.removeWord(e); });
document.getElementById('wordRemoveAll').addEventListener('click', e => { option.confirm(e, 'removeAllWords'); });
document.getElementById('bulkWordEditorButton').addEventListener('click', e => { option.showBulkWordEditor(); });
// Lists
document.getElementById('whitelist').addEventListener('change', e => { option.populateWhitelistWord(); });
document.getElementById('whitelistText').addEventListener('input', e => { OptionPage.hideInputError(e.target); });
document.getElementById('whitelistSave').addEventListener('click', e => { option.saveWhitelist(e); });
document.getElementById('whitelistRemove').addEventListener('click', e => { option.removeWhitelist(e); });
document.getElementById('wordlistsEnabled').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('wordlistRename').addEventListener('click', e => { option.renameWordlist(); });
document.getElementById('wordlistSelect').addEventListener('change', e => { option.populateWordlist(); });
document.getElementById('wordlistText').addEventListener('input', e => { OptionPage.hideInputError(e.target); });
document.getElementById('textWordlistSelect').addEventListener('change', e => { option.setDefaultWordlist(e.target as HTMLSelectElement); });
document.getElementById('audioWordlistSelect').addEventListener('change', e => { option.setDefaultWordlist(e.target as HTMLSelectElement); });
// Domains
document.querySelectorAll('#domainMode input').forEach(el => { el.addEventListener('click', e => { option.saveOptions(e); }); });
document.getElementById('domainSelect').addEventListener('change', e => { option.populateDomain(); });
document.getElementById('domainText').addEventListener('input', e => { OptionPage.hideInputError(e.target); });
document.getElementById('domainSave').addEventListener('click', e => { option.saveDomain(e); });
document.getElementById('domainRemove').addEventListener('click', e => { option.removeDomain(e); });
// Audio
document.getElementById('muteAudio').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('supportedAudioSites').addEventListener('click', e => { option.showSupportedAudioSites(); });
document.getElementById('muteAudioOnly').addEventListener('click', e => { option.saveOptions(e); });
document.getElementById('muteCueRequireShowing').addEventListener('click', e => { option.saveOptions(e); });
document.querySelectorAll('#audioMuteMethod input').forEach(el => { el.addEventListener('click', e => { option.saveOptions(e); }); });
document.querySelectorAll('#audioSubtitleSelection input').forEach(el => { el.addEventListener('click', e => { option.saveOptions(e); }); });
document.querySelectorAll('input.updateYouTubeAutoLimits').forEach(el => { el.addEventListener('input', e => { option.updateYouTubeAutoLimits(e.target); }); });
document.getElementById('customAudioSitesSave').addEventListener('click', e => { option.saveCustomAudioSites(); });
// Bookmarklet
document.querySelectorAll('#bookmarkletConfigInputs input').forEach(el => { el.addEventListener('click', e => { option.populateBookmarkletPage(); }); });
document.getElementById('bookmarkletFile').addEventListener('click', e => { option.exportBookmarkletFile(); });
document.getElementById('bookmarkletHostedURL').addEventListener('input', e => { option.updateHostedBookmarklet(); });
document.getElementById('bookmarkletLink').addEventListener('click', e => { e.preventDefault(); });
// Config
document.getElementById('configInlineInput').addEventListener('click', e => { option.configInlineToggle(); });
document.getElementById('importFileInput').addEventListener('change', e => { option.importConfigFile(e); });
document.getElementById('configReset').addEventListener('click', e => { option.confirm(e, 'restoreDefaults'); });
document.getElementById('configExport').addEventListener('click', e => { option.exportConfig(); });
document.getElementById('configImport').addEventListener('click', e => { option.confirm(e, 'importConfig'); });
document.getElementById('setPassword').addEventListener('input', e => { option.auth.setPasswordButton(option); });
document.getElementById('setPasswordBtn').addEventListener('click', e => { option.confirm(e, 'setPassword'); });
// Test
document.getElementById('testText').addEventListener('input', e => { option.populateTest(); });