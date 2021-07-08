import Constants from './lib/constants';
import { dynamicList, exportToFile, readFile, removeChildren, removeFromArray, upperCaseFirst } from './lib/helper';
import WebConfig from './webConfig';
import Filter from './lib/filter';
import Domain from './domain';
import OptionAuth from './optionAuth';
import DataMigration from './dataMigration';
import Bookmarklet from './bookmarklet';
import WebAudioSites from './webAudioSites';
import Logger from './lib/logger';
const logger = new Logger();

export default class OptionPage {
  auth: OptionAuth;
  cfg: WebConfig;
  themeButtons: Element[];
  themeElements: Element[];

  static readonly activeClass = 'w3-flat-belize-hole';
  static readonly themeButtonSelectors = [
    'div.themes > div.moon',
    'div.themes > div.sun',
  ];
  static readonly themeElementSelectors = [
    'body',
    'div#page',
    '#bulkWordEditorModal > div',
    '#confirmModal > div',
    '#passwordModal > div',
    '#statusModal > div',
    '#supportedAudioSitesModal > div',
  ];

  static closeModal(id: string) {
    OptionPage.hide(document.getElementById(id));
  }

  static configureConfirmModal(settings: ConfirmModalSettings = {}, contentElement?: HTMLElement) {
    const modalTitle = document.getElementById('confirmModalTitle') as HTMLElement;
    const modalContent = document.getElementById('confirmModalContent') as HTMLElement;
    const modalHeader = document.querySelector('#confirmModal header') as HTMLElement;
    const backupButtonContainer = document.querySelector('#confirmModal span.confirmBackupButton') as HTMLElement;
    const backupButton = document.querySelector('#confirmModal button#confirmModalBackup') as HTMLButtonElement;
    removeChildren(modalContent);

    const defaults = {
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
    const modalTitle = document.getElementById('statusModalTitle') as HTMLElement;
    const modalContent = document.getElementById('statusModalContent') as HTMLElement;
    const modalHeader = document.querySelector('#statusModal header') as HTMLElement;
    const contentElement = document.createElement('span');
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
    const notificationPanel = document.getElementById('notificationPanel') as HTMLElement;
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

  constructor() {
    this.themeButtons = OptionPage.themeButtonSelectors.map((selector) => { return document.querySelector(selector); });
    this.themeElements = OptionPage.themeElementSelectors.map((selector) => { return document.querySelector(selector); });
  }

  applyTheme() {
    const darkApplied = this.themeElements[0].classList.contains('dark');
    if (darkApplied != this.cfg.darkMode) {
      this.themeElements.forEach((element) => { element.classList.toggle('dark'); });
      this.themeButtons.forEach((element) => { element.classList.toggle('w3-hide'); });
    }
  }

  backupConfig() {
    const padded = (num: number) => { return ('0' + num).slice(-2); };
    const date = new Date;
    const today = `${date.getFullYear()}-${padded(date.getMonth()+1)}-${padded(date.getDate())}`;
    const time = `${padded(date.getHours())}${padded(date.getMinutes())}${padded(date.getSeconds())}`;
    exportToFile(JSON.stringify(this.cfg.ordered(), null, 2), `apf-backup-${today}_${time}.json`);
  }

  bulkEditorAddRow(word: string = '', data: WordOptions | undefined = undefined) {
    const table = document.querySelector('#bulkWordEditorModal table#bulkWordEditorTable') as HTMLTableElement;
    if (data === undefined) {
      data = {
        lists: [],
        matchMethod: this.cfg.defaultWordMatchMethod,
        repeat: this.cfg.defaultWordRepeat,
        separators: this.cfg.defaultWordSeparators,
        sub: '',
      };
    }

    // Build row
    const row = table.tBodies[0].insertRow();
    row.classList.add('bulkWordRow');

    // Add data
    const cellRemoveRow = row.insertCell(0);
    const cellWord = row.insertCell(1);
    const cellSub = row.insertCell(2);
    const cellMatchMethod = row.insertCell(3);
    const cellRepeat = row.insertCell(4);
    const cellSeparators = row.insertCell(5);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'X';
    removeButton.addEventListener('click', (e) => { this.bulkEditorRemoveRow(e); });
    cellRemoveRow.appendChild(removeButton);

    const wordInput = document.createElement('input');
    wordInput.type = 'text';
    wordInput.classList.add('bulkAddWordText');
    wordInput.value = word;
    cellWord.appendChild(wordInput);

    const subInput = document.createElement('input');
    subInput.type = 'text';
    cellSub.appendChild(subInput);
    subInput.value = data.sub;

    const matchMethodSelect = document.createElement('select');
    Constants.orderedArray(Constants.MATCH_METHODS).forEach((matchMethodConst, index) => {
      const matchMethod = upperCaseFirst(matchMethodConst);
      const optionElement = document.createElement('option');
      optionElement.value = Constants.MATCH_METHODS[matchMethod].toString();
      optionElement.classList.add(`bulkMatchMethod${Constants.MATCH_METHODS[matchMethod]}`);
      optionElement.textContent = matchMethod;
      matchMethodSelect.appendChild(optionElement);
    });
    matchMethodSelect.selectedIndex = data.matchMethod;
    cellMatchMethod.appendChild(matchMethodSelect);

    const repeatInput = document.createElement('input');
    repeatInput.type = 'checkbox';
    repeatInput.name = 'repeat';
    repeatInput.checked = data.repeat;
    cellRepeat.appendChild(repeatInput);

    const separatorsInput = document.createElement('input');
    separatorsInput.type = 'checkbox';
    separatorsInput.name = 'separators';
    separatorsInput.checked = data.separators;
    cellSeparators.appendChild(separatorsInput);

    this.cfg.wordlists.forEach((wordlist, index) => {
      const cell = row.insertCell(index + 6);
      const wordlistInput = document.createElement('input');
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
    const bulkAddWordsText = document.querySelector('#bulkWordEditorModal textarea#bulkAddWordsText') as HTMLTextAreaElement;
    const text = bulkAddWordsText.value;
    if (text != '') {
      const table = document.querySelector('#bulkWordEditorModal table#bulkWordEditorTable') as HTMLTableElement;
      const lines = text.toLowerCase().split('\n');
      const words = lines.map((line) => line.trim());
      const uniqueWords = words.filter((word, index) => words.indexOf(word) === index);

      // Remove any words that already exist in the current table
      const currentWords = this.bulkEditorCurrentWords();
      const wordsToAdd = uniqueWords.filter((newWord) => !currentWords.includes(newWord));

      // Add the new words to the table
      wordsToAdd.forEach((word) => {
        if (word != '') { this.bulkEditorAddRow(word); }
      });

      // Scroll to the bottom
      table.parentElement.scrollTop = table.parentElement.scrollHeight - table.parentElement.clientHeight;

      // Clear textarea after adding to the table
      bulkAddWordsText.value = '';
    }
  }

  bulkEditorRemoveAll() {
    const tBody = document.querySelector('#bulkWordEditorModal table tbody') as HTMLTableSectionElement;
    removeChildren(tBody);
    this.bulkEditorAddRow();
  }

  bulkEditorRemoveRow(event) {
    const table = document.querySelector('#bulkWordEditorModal table#bulkWordEditorTable') as HTMLTableElement;
    const row = event.target.parentElement.parentElement;
    table.deleteRow(row.rowIndex);
  }

  async bulkEditorSave() {
    const table = document.querySelector('#bulkWordEditorModal table#bulkWordEditorTable') as HTMLTableElement;
    const failed = {};
    this.cfg.words = {};

    table.querySelectorAll('tr.bulkWordRow').forEach((tr) => {
      const cells = tr.querySelectorAll('td');
      const lists = [];
      const wordlistSelectionsInput = tr.querySelectorAll('input[name="wordlists"]') as NodeListOf<HTMLInputElement>;
      wordlistSelectionsInput.forEach((wordlist, index) => { if (wordlist.checked) { lists.push(index + 1); } });

      const name = (cells[1].querySelector('input') as HTMLInputElement).value;
      if (name != '') {
        const wordOptions: WordOptions = {
          lists: lists,
          matchMethod: (cells[3].querySelector('select') as HTMLSelectElement).selectedIndex,
          repeat: (cells[4].querySelector('input') as HTMLInputElement).checked,
          separators: (cells[5].querySelector('input') as HTMLInputElement).checked,
          sub: (cells[2].querySelector('input') as HTMLInputElement).value
        };
        const success = this.cfg.addWord(name, wordOptions);
        if (!success) {
          failed[name] = wordOptions;
        }
      }
    });

    try {
      await this.cfg.save('words');
      OptionPage.closeModal('bulkWordEditorModal');
      OptionPage.showStatusModal('Words saved successfully.');
      filter.rebuildWordlists();
      this.populateOptions();
    } catch(e) {
      logger.warn('Failed to save.', e);
      OptionPage.showErrorModal(`Failed to save. [Error: ${e}]`);
    }
  }

  bulkEditorWordlistCheckbox(event) {
    const checked = (event.target as HTMLInputElement).checked;
    document.querySelectorAll(`#bulkWordEditorModal table td input.wordlistData[data-col="${event.target.dataset.col}"]`).forEach((box: HTMLInputElement) => {
      box.checked = checked;
    });
  }

  bulkEditorCurrentWords() {
    const table = document.querySelector('#bulkWordEditorModal table#bulkWordEditorTable') as HTMLTableElement;
    const words = [];
    table.querySelectorAll('tr > td > input.bulkAddWordText').forEach((wordText: HTMLInputElement, index) => {
      words.push(wordText.value);
    });
    return words;
  }

  bulkWordEditorHeaderRow(): HTMLTableRowElement {
    const row = document.createElement('tr');
    const removeCell = document.createElement('th');
    const removeButton = document.createElement('button');
    removeButton.textContent = 'X';
    removeButton.id = 'bulkEditorRemoveAll';
    removeButton.addEventListener('click', (e) => { this.bulkEditorRemoveAll(); });
    const removeSpan = document.createElement('span');
    removeSpan.textContent = ' Remove';
    removeCell.appendChild(removeButton);
    removeCell.appendChild(removeSpan);
    row.appendChild(removeCell);

    const normalHeaders = ['Word', 'Substitution', 'Match Method', 'Repeated', 'Separators'];
    normalHeaders.forEach((item) => {
      const cell = document.createElement('th');
      const cellSpan = document.createElement('span');
      cellSpan.textContent = item;
      cell.appendChild(cellSpan);
      row.appendChild(cell);
    });

    this.cfg.wordlists.forEach((wordlist, i) => {
      const cell = document.createElement('th');
      const inputLabel = document.createElement('label');
      const input = document.createElement('input');
      const span = document.createElement('span');
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
    const input = document.getElementById('configInlineInput') as HTMLInputElement;
    const configText = document.getElementById('configText') as HTMLTextAreaElement;
    if (input.checked) {
      OptionPage.show(configText);
      this.exportConfig();
    } else {
      OptionPage.hide(configText);
      configText.value = '';
    }
  }

  confirm(evt, action) {
    const ok = document.getElementById('confirmModalOK');
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
        const passwordText = document.getElementById('setPassword') as HTMLInputElement;
        const passwordBtn = document.getElementById('setPasswordBtn') as HTMLInputElement;
        if (passwordBtn.classList.contains('disabled')) return false;

        const message = passwordText.value == '' ? 'Are you sure you want to remove the password?' : `Are you sure you want to set the password to '${passwordText.value}'?`;
        OptionPage.configureConfirmModal({ content: message });
        ok.addEventListener('click', setPassword);
        break;
      }
    }

    OptionPage.openModal('confirmModal');
  }

  confirmModalBackup() {
    const backupButton = document.querySelector('#confirmModal button#confirmModalBackup') as HTMLButtonElement;
    if (!backupButton.classList.contains('disabled')) {
      this.backupConfig();
      OptionPage.disableBtn(backupButton);
    }
  }

  async exportBookmarkletFile() {
    const code = await Bookmarklet.injectConfig(this.cfg.ordered());
    exportToFile(code, 'apfBookmarklet.js');
  }

  exportConfig() {
    const input = document.getElementById('configInlineInput') as HTMLInputElement;

    if (input.checked) { // inline editor
      const configText = document.getElementById('configText') as HTMLTextAreaElement;
      configText.value = JSON.stringify(this.cfg.ordered(), null, 2);
    } else {
      this.backupConfig();
    }
  }

  importConfig(e) {
    const input = document.getElementById('configInlineInput') as HTMLInputElement;
    if (input.checked) { // inline editor
      const configText = document.getElementById('configText') as HTMLTextAreaElement;
      this.importConfigText(configText.value);
    } else {
      const importFileInput = document.getElementById('importFileInput') as HTMLInputElement;
      importFileInput.click();
    }
  }

  async importConfigFile(e) {
    const file = e.target.files[0];
    const importFileInput = document.getElementById('importFileInput') as HTMLInputElement;
    const fileText = await readFile(file) as string;
    this.importConfigText(fileText);
    importFileInput.value = '';
  }

  async importConfigText(cfg: string) {
    try {
      const importedCfg = new WebConfig(JSON.parse(cfg));
      const migration = new DataMigration(importedCfg);
      migration.runImportMigrations();
      const resetSuccess = await this.restoreDefaults(null, true);
      if (resetSuccess) {
        try {
          this.cfg = importedCfg;
          await this.cfg.save();
          OptionPage.showStatusModal('Settings imported successfully.');
          this.init();
        } catch(e) {
          logger.warn('Failed to import settings.', e);
          OptionPage.showErrorModal(`Failed to import settings. [Error: ${e}]`);
        }
      }
    } catch(e) {
      OptionPage.showErrorModal('Failed to import settings.');
    }
  }

  async init() {
    this.cfg = await WebConfig.build();
    if (!this.auth) this.auth = new OptionAuth(this.cfg.password);
    filter.cfg = this.cfg;
    filter.init();

    // logger.debug(`Password: '${this.cfg.password}', Authenticated: ${this.auth.authenticated}`);
    if (this.cfg.password && !this.auth.authenticated) {
      OptionPage.openModal('passwordModal');
      document.getElementById('passwordInput').focus();
    } else {
      OptionPage.show(document.getElementById('main'));
    }

    this.applyTheme();
    this.populateOptions();
  }

  populateAudio() {
    const muteAudioInput = document.getElementById('muteAudio') as HTMLInputElement;
    const fillerAudioSelect = document.getElementById('fillerAudioSelect') as HTMLSelectElement;
    const muteAudioOnlyInput = document.getElementById('muteAudioOnly') as HTMLInputElement;
    const muteCueRequireShowingInput = document.getElementById('muteCueRequireShowing') as HTMLInputElement;
    const selectedMuteMethod = document.querySelector(`input[name=audioMuteMethod][value='${this.cfg.muteMethod}']`) as HTMLInputElement;
    const selectedshowSubtitle = document.querySelector(`input[name=audioShowSubtitles][value='${this.cfg.showSubtitles}']`) as HTMLInputElement;
    const muteAudioOptionsContainer = document.getElementById('muteAudioOptionsContainer') as HTMLElement;
    const audioYouTubeAutoSubsMin = document.getElementById('audioYouTubeAutoSubsMin') as HTMLInputElement;
    const audioYouTubeAutoSubsMax = document.getElementById('audioYouTubeAutoSubsMax') as HTMLInputElement;
    const customAudioSitesTextArea = document.getElementById('customAudioSitesText') as HTMLTextAreaElement;
    muteAudioInput.checked = this.cfg.muteAudio;
    fillerAudioSelect.value = this.cfg.fillerAudio;
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
    const bookmarkletConfig = document.querySelector('input[name="bookmarkletConfig"]:checked') as HTMLInputElement;
    const bookmarkletCustomConfig = document.getElementById('bookmarkletCustomConfig') as HTMLDivElement;
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
    const domainsSelect = document.getElementById('domainSelect') as HTMLInputElement;
    const domainText = document.getElementById('domainText') as HTMLInputElement;
    const domainModeSelect = document.getElementById('domainModeSelect') as HTMLSelectElement;
    const domainDisabledCheck = document.getElementById('domainDisabledCheck') as HTMLInputElement;
    const domainEnabledCheck = document.getElementById('domainEnabledCheck') as HTMLInputElement;
    const domainWordlistSelect = document.getElementById('domainWordlistSelect') as HTMLSelectElement;
    const domainAudioWordlistSelect = document.getElementById('domainAudioWordlistSelect') as HTMLSelectElement;
    const domainRemoveBtn = document.getElementById('domainRemove') as HTMLButtonElement;

    const key = domainsSelect.value;
    domainText.value = key;

    let domainCfg;
    if (!key) { // New record
      OptionPage.disableBtn(domainRemoveBtn);
      domainCfg = Object.assign({}, Domain._domainCfgDefaults);
    } else { // Existing record
      OptionPage.enableBtn(domainRemoveBtn);
      domainCfg = this.cfg.domains[domainsSelect.value];
    }

    const domainKey = domainText.value.trim().toLowerCase();
    if (domainKey == '') { // No data
      domainModeSelect.selectedIndex = Constants.DOMAIN_MODES.NORMAL;
    } else {
      const domain = new Domain(domainKey, domainCfg);
      domainModeSelect.selectedIndex = domain.getModeIndex();
    }

    domainDisabledCheck.checked = domainCfg.disabled;
    domainEnabledCheck.checked = domainCfg.enabled;
    const wordlist = domainCfg.wordlist >= 0 ? domainCfg.wordlist + 1 : 0;
    const audioList = domainCfg.audioList >= 0 ? domainCfg.audioList + 1 : 0;
    domainWordlistSelect.selectedIndex = wordlist;
    domainAudioWordlistSelect.selectedIndex = audioList;
  }

  populateDomainPage() {
    const domainModeSelect = document.getElementById('domainModeSelect') as HTMLSelectElement;
    const domainsSelect = document.getElementById('domainSelect') as HTMLSelectElement;
    const domainText = document.getElementById('domainText') as HTMLInputElement;
    const mode = this.cfg.enabledDomainsOnly ? 'minimal' : 'normal';
    const domainMode = document.querySelector(`input[name=domainMode][value='${mode}']`) as HTMLInputElement;
    const wordlistContainer = document.getElementById('domainWordlistContainer') as HTMLInputElement;
    const audioWordlistContainer = document.getElementById('domainAudioWordlistContainer') as HTMLInputElement;
    domainMode.checked = true;
    const domainDisabledLabel = document.getElementById('domainDisabledLabel') as HTMLLabelElement;
    const domainEnabledLabel = document.getElementById('domainEnabledLabel') as HTMLLabelElement;
    OptionPage.hideInputError(domainText);
    removeChildren(domainsSelect);

    const domains = Domain.sortedKeys(this.cfg.domains);
    domains.unshift('Add, or update existing...');
    domains.forEach((domain) => {
      const optionElement = document.createElement('option');
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

    dynamicList(Constants.orderedArray(Constants.DOMAIN_MODES), domainModeSelect, true);

    if (this.cfg.wordlistsEnabled) {
      OptionPage.show(wordlistContainer);
      const domainWordlistSelect = document.getElementById('domainWordlistSelect') as HTMLSelectElement;
      const domainAudioWordlistSelect = document.getElementById('domainAudioWordlistSelect') as HTMLSelectElement;

      const wordlists = ['Default'].concat(WebConfig._allWordlists, this.cfg.wordlists);
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
    const selectedFilter = document.getElementById(`filter${Constants.filterMethodName(this.cfg.filterMethod)}`) as HTMLInputElement;
    const showCounter = document.getElementById('showCounter') as HTMLInputElement;
    const showSummary = document.getElementById('showSummary') as HTMLInputElement;
    const showUpdateNotification = document.getElementById('showUpdateNotification') as HTMLInputElement;
    const filterWordList = document.getElementById('filterWordList') as HTMLInputElement;
    selectedFilter.checked = true;
    showCounter.checked = this.cfg.showCounter;
    showSummary.checked = this.cfg.showSummary;
    showUpdateNotification.checked = this.cfg.showUpdateNotification;
    filterWordList.checked = this.cfg.filterWordList;

    // Censor Settings
    const preserveFirst = document.getElementById('preserveFirst') as HTMLInputElement;
    const preserveLast = document.getElementById('preserveLast') as HTMLInputElement;
    const censorCharacterSelect = document.getElementById('censorCharacterSelect') as HTMLSelectElement;
    const censorFixedLengthSelect = document.getElementById('censorFixedLengthSelect') as HTMLSelectElement;
    preserveFirst.checked = this.cfg.preserveFirst;
    preserveLast.checked = this.cfg.preserveLast;
    censorCharacterSelect.value = this.cfg.censorCharacter;
    censorFixedLengthSelect.selectedIndex = this.cfg.censorFixedLength;

    // Substitution Settings
    const preserveCase = document.getElementById('preserveCase') as HTMLInputElement;
    const substitutionMark = document.getElementById('substitutionMark') as HTMLInputElement;
    preserveCase.checked = this.cfg.preserveCase;
    substitutionMark.checked = this.cfg.substitutionMark;

    // Default Settings
    const defaultWordMatchMethodSelect = document.getElementById('defaultWordMatchMethodSelect') as HTMLSelectElement;
    const defaultWordRepeat = document.getElementById('defaultWordRepeat') as HTMLInputElement;
    const defaultWordSeparators = document.getElementById('defaultWordSeparators') as HTMLInputElement;
    defaultWordRepeat.checked = this.cfg.defaultWordRepeat;
    defaultWordSeparators.checked = this.cfg.defaultWordSeparators;
    const defaultWordSubstitution = document.getElementById('defaultWordSubstitutionText') as HTMLInputElement;
    defaultWordSubstitution.value = this.cfg.defaultSubstitution;
    removeChildren(defaultWordMatchMethodSelect);
    for (let i = 0; i < 3; i++) { // Skip Regex
      const optionElement = document.createElement('option');
      const matchMethodName = upperCaseFirst(Constants.matchMethodName(i));
      optionElement.value = matchMethodName;
      optionElement.textContent = matchMethodName;
      defaultWordMatchMethodSelect.appendChild(optionElement);
    }
    defaultWordMatchMethodSelect.selectedIndex = this.cfg.defaultWordMatchMethod;
  }

  populateTest() {
    const testText = document.getElementById('testText') as HTMLInputElement;
    const filteredTestText = document.getElementById('filteredTestText') as HTMLElement;

    if (testText.value === '') {
      filteredTestText.textContent = 'Enter some text above to test the filter...';
    } else {
      filteredTestText.textContent = filter.replaceText(testText.value, filter.cfg.wordlistId, false);
    }
  }

  populateWhitelist() {
    const regExp = RegExp(' [*]$');
    const sensitiveList = filter.cfg.wordWhitelist.map((item) => { return item + ' *'; });
    const list = [].concat(sensitiveList, filter.cfg.iWordWhitelist).sort();
    const whitelist = document.getElementById('whitelist') as HTMLSelectElement;
    removeChildren(whitelist);
    list.unshift('Add, or update existing...');
    list.forEach((item) => {
      const optionElement = document.createElement('option');
      optionElement.value = item === list[0] ? '' : item.replace(regExp, '');
      optionElement.dataset.sensitive = regExp.test(item).toString();
      optionElement.textContent = item;
      whitelist.appendChild(optionElement);
    });
    this.populateWhitelistWord();
  }

  populateWhitelistWord() {
    const whitelist = document.getElementById('whitelist') as HTMLSelectElement;
    const whitelistRemove = document.getElementById('whitelistRemove') as HTMLInputElement;
    const whitelistText = document.getElementById('whitelistText') as HTMLInputElement;
    const selected = whitelist.selectedOptions[0];

    if (selected.value == '') { // New word
      whitelistText.value = '';
      OptionPage.disableBtn(whitelistRemove);

      // Default to case-insensitive
      const whitelistCase = document.getElementById('whitelistInsensitive') as HTMLInputElement;
      whitelistCase.checked = true;
    } else {
      whitelistText.value = selected.value;
      const caseId = selected.dataset.sensitive === 'true' ? 'whitelistSensitive' : 'whitelistInsensitive';
      const whitelistCase = document.getElementById(caseId) as HTMLInputElement;
      whitelistCase.checked = true;
      OptionPage.enableBtn(whitelistRemove);
    }
  }

  populateWord() {
    const wordList = document.getElementById('wordList') as HTMLSelectElement;
    const wordText = document.getElementById('wordText') as HTMLInputElement;
    const wordMatchRepeated = document.getElementById('wordMatchRepeated') as HTMLInputElement;
    const wordMatchSeparators = document.getElementById('wordMatchSeparators') as HTMLInputElement;
    const substitutionText = document.getElementById('substitutionText') as HTMLInputElement;
    const wordRemove = document.getElementById('wordRemove') as HTMLInputElement;
    const word = wordList.value;
    const wordWordlistDiv = document.getElementById('wordWordlistDiv') as HTMLSelectElement;
    const wordlistSelections = document.querySelectorAll('div#wordlistSelections input') as NodeListOf<HTMLInputElement>;
    OptionPage.hideInputError(wordText);
    OptionPage.hideInputError(substitutionText);

    if (word == '') { // New word
      wordText.value = '';
      OptionPage.disableBtn(wordRemove);
      const selectedMatchMethod = document.getElementById(`wordMatch${upperCaseFirst(Constants.matchMethodName(this.cfg.defaultWordMatchMethod))}`) as HTMLInputElement;
      selectedMatchMethod.checked = true;
      wordMatchRepeated.checked = this.cfg.defaultWordRepeat;
      wordMatchSeparators.checked = this.cfg.defaultWordSeparators;
      substitutionText.value = '';
      wordlistSelections.forEach((wordlist, index) => {
        wordlist.checked = (
          index == (this.cfg.wordlistId - 1)
          || (
            this.cfg.muteAudio
            && index == (this.cfg.audioWordlistId - 1)
          )
        );
      });
    } else { // Existing word
      OptionPage.enableBtn(wordRemove);
      const wordCfg = this.cfg.words[word];
      wordText.value = word;
      const selectedMatchMethod = document.getElementById(`wordMatch${upperCaseFirst(Constants.matchMethodName(wordCfg.matchMethod))}`) as HTMLInputElement;
      selectedMatchMethod.checked = true;
      wordMatchRepeated.checked = wordCfg.repeat;
      wordMatchSeparators.checked = wordCfg.separators === undefined ? this.cfg.defaultWordSeparators : wordCfg.separators;
      substitutionText.value = wordCfg.sub;
      wordlistSelections.forEach((wordlist, index) => {
        wordlist.checked = wordCfg.lists.includes(index + 1);
      });
    }

    if (this.cfg.wordlistsEnabled) {
      OptionPage.show(wordWordlistDiv);
    } else {
      OptionPage.hide(wordWordlistDiv);
    }
  }

  populateWordlist() {
    const wordlistSelect = document.getElementById('wordlistSelect') as HTMLSelectElement;
    const wordlistText = document.getElementById('wordlistText') as HTMLInputElement;
    wordlistText.value = wordlistSelect.value;
  }

  populateWordlists(selectedIndex: number = 0) {
    const wordlistsEnabledInput = document.getElementById('wordlistsEnabled') as HTMLInputElement;
    const wordlistContainer = document.getElementById('wordlistContainer') as HTMLElement;
    wordlistsEnabledInput.checked = this.cfg.wordlistsEnabled;

    if (this.cfg.wordlistsEnabled) {
      const wordlistSelect = document.getElementById('wordlistSelect') as HTMLSelectElement;
      const textWordlistSelect = document.getElementById('textWordlistSelect') as HTMLSelectElement;
      const audioWordlistDiv = document.getElementById('audioWordlistDiv') as HTMLElement;
      const audioWordlistSelect = document.getElementById('audioWordlistSelect') as HTMLSelectElement;
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
    const selections = document.getElementById('wordlistSelections') as HTMLInputElement;
    const wordsSelect = document.getElementById('wordList') as HTMLSelectElement;
    removeChildren(wordsSelect);

    // Workaround for remove filter method
    if (filter.cfg.filterWordList && filter.cfg.filterMethod === 2) {
      wordlistFilter = new Filter;
      // Works because we are only changing a native value (filterMethod: number)
      wordlistFilter.cfg = new WebConfig(Object.assign({}, this.cfg, { filterMethod: 0 }));
      wordlistFilter.init();
    }

    const words = Object.keys(this.cfg.words).sort();
    words.unshift('Add, or update existing...');
    words.forEach((word) => {
      let filteredWord = word;
      if (word != words[0] && wordlistFilter.cfg.filterWordList) {
        if (wordlistFilter.cfg.words[word].matchMethod === Constants.MATCH_METHODS.REGEX) { // Regexp
          filteredWord = wordlistFilter.cfg.words[word].sub || wordlistFilter.cfg.defaultSubstitution;
        } else {
          filteredWord = wordlistFilter.replaceText(word, 0, false); // Using 0 (All) here to filter all words
        }
      }

      const optionElement = document.createElement('option');
      optionElement.value = word === words[0] ? '' : word;
      optionElement.dataset.filtered = filteredWord;
      optionElement.textContent = filteredWord;
      wordsSelect.appendChild(optionElement);
    });

    // Dynamically create the wordlist selection checkboxes
    if (selections.hasChildNodes()) { removeChildren(selections); }
    this.cfg.wordlists.forEach((list, index) => {
      const div = document.createElement('div');
      const label = document.createElement('label');
      const input = document.createElement('input');
      const name = document.createTextNode(list);
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
    const wordList = document.getElementById('wordList') as HTMLSelectElement;
    wordList.selectedIndex = 0;
    filter.rebuildWordlists();
    this.populateOptions();
  }

  async removeDomain(event) {
    const domainsSelect = document.getElementById('domainSelect') as HTMLInputElement;
    if (domainsSelect.value) {
      delete this.cfg.domains[domainsSelect.value];

      try {
        await this.cfg.save('domains');
        this.populateDomainPage();
      } catch(e) {
        logger.warn(`Failed to remove domain '${domainsSelect.value}'.`, e);
        OptionPage.showErrorModal(`Failed to remove domain '${domainsSelect.value}'. [Error: ${e}]`);
        return false;
      }
    }
  }

  async removeWhitelist(evt) {
    const whitelist = document.getElementById('whitelist') as HTMLSelectElement;
    const selected = whitelist.selectedOptions[0];
    const originalWord = selected.value;
    const originalCase = selected.dataset.sensitive === 'true' ? 'sensitive': 'insensitive';
    const originalListName = originalCase === 'sensitive' ? 'wordWhitelist' : 'iWordWhitelist';
    this.cfg[originalListName] = removeFromArray(this.cfg[originalListName], originalWord);

    try {
      await this.cfg.save(originalListName);
      filter.init();
      this.populateOptions();
    } catch(e) {
      logger.warn(`Failed to remove '${originalWord} from whitelist.`, e);
      OptionPage.showErrorModal(`Failed to remove '${originalWord} from whitelist. [Error: ${e}]`);
      return false;
    }
  }

  async removeWord(evt) {
    if (evt.target.classList.contains('disabled')) return false;
    const wordList = document.getElementById('wordList') as HTMLSelectElement;
    const word = wordList.value;

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
    const wordlistSelect = document.getElementById('wordlistSelect') as HTMLSelectElement;
    const wordlistText = document.getElementById('wordlistText') as HTMLInputElement;
    const name = wordlistText.value.trim();
    const index = wordlistSelect.selectedIndex;

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
    try {
      await this.cfg.reset();
      if (!silent) OptionPage.showStatusModal('Default settings restored.');
      this.init();
      return true;
    } catch(e) {
      logger.warn('Error restoring defaults.', e);
      OptionPage.showErrorModal(`Error restoring defaults. [Error: ${e}]`);
      return false;
    }
  }

  async saveCustomAudioSites() {
    const customAudioSitesTextArea = document.getElementById('customAudioSitesText') as HTMLTextAreaElement;
    try {
      const text = customAudioSitesTextArea.value;
      this.cfg.customAudioSites = text == '' ? null : JSON.parse(text);
      if (await this.saveProp('customAudioSites')) {
        customAudioSitesTextArea.value = this.cfg.customAudioSites ? JSON.stringify(this.cfg.customAudioSites, null, 2) : '';
        OptionPage.showStatusModal('Custom Audio Sites saved.');
      }
    } catch(e) {
      OptionPage.showErrorModal('Failed to save custom audio sites. Please make sure it is valid JSON.');
    }
  }

  async saveDomain(event) {
    const domainsSelect = document.getElementById('domainSelect') as HTMLInputElement;
    const domainText = document.getElementById('domainText') as HTMLInputElement;
    const domainModeSelect = document.getElementById('domainModeSelect') as HTMLSelectElement;
    const domainDisabledCheck = document.getElementById('domainDisabledCheck') as HTMLInputElement;
    const domainEnabledCheck = document.getElementById('domainEnabledCheck') as HTMLInputElement;
    const domainWordlistSelect = document.getElementById('domainWordlistSelect') as HTMLSelectElement;
    const domainAudioWordlistSelect = document.getElementById('domainAudioWordlistSelect') as HTMLSelectElement;

    const originalKey = domainsSelect.value;
    const newKey = domainText.value.trim().toLowerCase();

    if (newKey == '') { // No data
      OptionPage.showInputError(domainText, 'Please enter a value.');
      return false;
    }

    if (domainText.checkValidity()) {
      OptionPage.hideInputError(domainText);
      if (newKey != originalKey) { delete this.cfg.domains[originalKey]; } // URL changed: remove old entry

      const wordlist = domainWordlistSelect.selectedIndex > 0 ? domainWordlistSelect.selectedIndex - 1 : undefined;
      const audioList = domainAudioWordlistSelect.selectedIndex > 0 ? domainAudioWordlistSelect.selectedIndex - 1 : undefined;
      const newDomainCfg: DomainCfg = {
        audioList: audioList,
        disabled: domainDisabledCheck.checked,
        enabled: domainEnabledCheck.checked,
        wordlist: wordlist,
      };
      const domain = new Domain(newKey, newDomainCfg);
      domain.updateFromModeIndex(domainModeSelect.selectedIndex);
      const error = await domain.save(this.cfg);

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
    // Gather current settings
    const censorCharacterSelect = document.getElementById('censorCharacterSelect') as HTMLSelectElement;
    const censorFixedLengthSelect = document.getElementById('censorFixedLengthSelect') as HTMLSelectElement;
    const defaultWordMatchMethodSelect = document.getElementById('defaultWordMatchMethodSelect') as HTMLSelectElement;
    const defaultWordRepeat = document.getElementById('defaultWordRepeat') as HTMLInputElement;
    const defaultWordSeparators = document.getElementById('defaultWordSeparators') as HTMLInputElement;
    const preserveCase = document.getElementById('preserveCase') as HTMLInputElement;
    const preserveFirst = document.getElementById('preserveFirst') as HTMLInputElement;
    const preserveLast = document.getElementById('preserveLast') as HTMLInputElement;
    const showCounter = document.getElementById('showCounter') as HTMLInputElement;
    const showSummary = document.getElementById('showSummary') as HTMLInputElement;
    const showUpdateNotification = document.getElementById('showUpdateNotification') as HTMLInputElement;
    const filterWordList = document.getElementById('filterWordList') as HTMLInputElement;
    const substitutionMark = document.getElementById('substitutionMark') as HTMLInputElement;
    const defaultWordSubstitution = document.getElementById('defaultWordSubstitutionText') as HTMLInputElement;
    const domainMode = document.querySelector('input[name="domainMode"]:checked') as HTMLInputElement;
    const muteAudioInput = document.getElementById('muteAudio') as HTMLInputElement;
    const fillerAudioSelect = document.getElementById('fillerAudioSelect') as HTMLSelectElement;
    const muteAudioOnlyInput = document.getElementById('muteAudioOnly') as HTMLInputElement;
    const muteCueRequireShowingInput = document.getElementById('muteCueRequireShowing') as HTMLInputElement;
    const muteMethodInput = document.querySelector('input[name="audioMuteMethod"]:checked') as HTMLInputElement;
    const showSubtitlesInput = document.querySelector('input[name="audioShowSubtitles"]:checked') as HTMLInputElement;
    const wordlistsEnabledInput = document.getElementById('wordlistsEnabled') as HTMLInputElement;
    this.cfg.censorCharacter = censorCharacterSelect.value;
    this.cfg.censorFixedLength = censorFixedLengthSelect.selectedIndex;
    this.cfg.defaultWordMatchMethod = defaultWordMatchMethodSelect.selectedIndex;
    this.cfg.defaultWordRepeat = defaultWordRepeat.checked;
    this.cfg.defaultWordSeparators = defaultWordSeparators.checked;
    this.cfg.preserveCase = preserveCase.checked;
    this.cfg.preserveFirst = preserveFirst.checked;
    this.cfg.preserveLast = preserveLast.checked;
    this.cfg.showCounter = showCounter.checked;
    this.cfg.showSummary = showSummary.checked;
    this.cfg.showUpdateNotification = showUpdateNotification.checked;
    this.cfg.filterWordList = filterWordList.checked;
    this.cfg.substitutionMark = substitutionMark.checked;
    this.cfg.defaultSubstitution = defaultWordSubstitution.value.trim().toLowerCase();
    this.cfg.enabledDomainsOnly = (domainMode.value === 'minimal');
    this.cfg.muteAudio = muteAudioInput.checked;
    this.cfg.fillerAudio = fillerAudioSelect.value;
    this.cfg.muteAudioOnly = muteAudioOnlyInput.checked;
    this.cfg.muteCueRequireShowing = muteCueRequireShowingInput.checked;
    this.cfg.muteMethod = parseInt(muteMethodInput.value);
    this.cfg.showSubtitles = parseInt(showSubtitlesInput.value);
    this.cfg.wordlistsEnabled = wordlistsEnabledInput.checked;

    // Save settings
    try {
      await this.cfg.save();
      this.init();
      return true;
    } catch(e) {
      logger.warn('Settings not saved! Please try again.', e);
      OptionPage.showErrorModal(`Settings not saved! Please try again. [Error: ${e}]`);
      return false;
    }
  }

  async saveProp(prop: string) {
    try {
      await this.cfg.save(prop);
      return true;
    } catch(e) {
      logger.warn(`Failed to save '${prop}'.`, e);
      OptionPage.showErrorModal(`Failed to save '${prop}'. [Error: ${e}]`);
      return false;
    }
  }

  async saveWhitelist(evt) {
    const whitelist = document.getElementById('whitelist') as HTMLSelectElement;
    const selected = whitelist.selectedOptions[0];
    const selectedCase = document.querySelector('input[name="whitelistCase"]:checked') as HTMLInputElement;
    const whitelistText = document.getElementById('whitelistText') as HTMLInputElement;

    const propsToSave = [];
    const newCase = selectedCase.value;
    const newWord = newCase === 'sensitive' ? whitelistText.value : whitelistText.value.toLowerCase();
    const newListName = newCase === 'sensitive' ? 'wordWhitelist' : 'iWordWhitelist';

    if (whitelistText.value === '') {
      OptionPage.showInputError(whitelistText, 'Please enter a valid word/phrase.');
      return false;
    }

    if (this.cfg[newListName].indexOf(newWord) > -1) {
      OptionPage.showInputError(whitelistText, 'Already whitelisted.');
      return false;
    }

    if (whitelistText.checkValidity()) {
      if (selected.value === '') { // New word
        this.cfg[newListName].push(newWord);
        propsToSave.push(newListName);
      } else { // Modifying existing word
        const originalWord = selected.value;
        const originalCase = selected.dataset.sensitive === 'true' ? 'sensitive': 'insensitive';
        const originalListName = originalCase === 'sensitive' ? 'wordWhitelist' : 'iWordWhitelist';

        if ((originalWord != newWord) || (originalCase != newCase)) {
          this.cfg[originalListName] = removeFromArray(this.cfg[originalListName], originalWord);
          this.cfg[newListName].push(newWord);
          originalListName === newListName ? propsToSave.push(newListName) : propsToSave.push(originalListName, newListName);
        }
      }

      if (propsToSave.length) {
        propsToSave.forEach((prop) => {
          this.cfg[prop] = this.cfg[prop].sort();
        });
        try {
          await this.cfg.save(propsToSave);
          filter.init();
          this.populateOptions();
        } catch(e) {
          logger.warn('Failed to update whitelist.', e);
          OptionPage.showErrorModal(`Failed to update whitelist. [Error: ${e}]`);
          return false;
        }
      }
    } else {
      OptionPage.showInputError(whitelistText, 'Please enter a valid word/phrase.');
    }
  }

  async saveWord(evt) {
    const wordList = document.getElementById('wordList') as HTMLSelectElement;
    const wordText = document.getElementById('wordText') as HTMLInputElement;
    const wordMatchRepeated = document.getElementById('wordMatchRepeated') as HTMLInputElement;
    const wordMatchSeparators = document.getElementById('wordMatchSeparators') as HTMLInputElement;
    const substitutionText = document.getElementById('substitutionText') as HTMLInputElement;
    const selectedMatchMethod = document.querySelector('input[name="wordMatchMethod"]:checked') as HTMLInputElement;
    let word = wordText.value.trim();
    const sub = substitutionText.value.trim().toLowerCase();
    let added = true;
    const wordlistSelectionsInput = document.querySelectorAll('div#wordlistSelections input') as NodeListOf<HTMLInputElement>;

    if (Constants.MATCH_METHODS[selectedMatchMethod.value] !== Constants.MATCH_METHODS.REGEX) {
      word = word.toLowerCase();
    }

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
      const lists = [];
      wordlistSelectionsInput.forEach((wordlist, index) => { if (wordlist.checked) { lists.push(index + 1); } });

      const wordOptions: WordOptions = {
        lists: lists,
        matchMethod: Constants.MATCH_METHODS[selectedMatchMethod.value],
        repeat: wordMatchRepeated.checked,
        separators: wordMatchSeparators.checked,
        sub: sub
      };

      // Check for endless substitution loop
      if (wordOptions.matchMethod != Constants.MATCH_METHODS.REGEX) {
        const subFilter = new Filter;
        const words = {};
        words[word] = wordOptions;
        subFilter.cfg = new WebConfig(Object.assign({}, this.cfg, { filterMethod: Constants.FILTER_METHODS.SUBSTITUTE }, { words: words }));
        subFilter.init();
        const first = subFilter.replaceTextResult(word);
        const second = subFilter.replaceTextResult(first.filtered);
        if (first.filtered != second.filtered) {
          OptionPage.showInputError(substitutionText, "Substitution can't contain word (causes an endless loop).");
          return false;
        }
      }

      // Test for a valid Regex
      if (wordOptions.matchMethod === Constants.MATCH_METHODS.REGEX) {
        const subFilter = new Filter;
        const words = {};
        words[word] = wordOptions;
        subFilter.cfg = new WebConfig(Object.assign({}, this.cfg, { words: words }));
        subFilter.init();
        if (subFilter.wordlists[subFilter.wordlistId].regExps.length === 0) {
          OptionPage.showInputError(wordText, 'Invalid Regex.');
          return false;
        }
      }

      if (wordList.value === '') { // New record
        logger.info(`Adding new word: '${word}'.`, wordOptions);
        added = this.cfg.addWord(word, wordOptions);
      } else { // Updating existing record
        const originalWord = wordList.value;
        if (originalWord == word) { // Word options changed
          logger.info(`Modifying existing word options for '${word}'.`, wordOptions);
          this.cfg.words[word] = wordOptions;
        } else { // Existing word modified
          logger.info(`Rename existing word '${originalWord}' to '${word}'.`, wordOptions);
          added = this.cfg.addWord(word, wordOptions);
          if (added) {
            delete this.cfg.words[originalWord];
          } else {
            OptionPage.showInputError(wordText, `'${word}' already in list.`);
          }
        }
      }

      if (added) {
        try {
          await this.saveOptions(evt);
          // Update states and Reset word form
          filter.rebuildWordlists();
          this.populateOptions();
        } catch(e) {
          logger.warn(`Failed to update word '${word}'.`, e);
          OptionPage.showErrorModal(`Failed to update word '${word}'. [Error: ${e}]`);
          this.cfg.removeWord(word);
          return false;
        }
      } else {
        OptionPage.showInputError(wordText, `'${word}' already in list.`);
      }
    } else {
      OptionPage.showInputError(wordText, 'Please enter a valid word/phrase.');
    }
  }

  async selectFilterMethod(evt) {
    this.cfg.filterMethod = Constants.FILTER_METHODS[evt.target.value];
    if (await this.saveProp('filterMethod')) {
      filter.rebuildWordlists();
      this.populateOptions();
    }
  }

  async setDefaultWordlist(element: HTMLSelectElement) {
    const prop = element.id === 'textWordlistSelect' ? 'wordlistId' : 'audioWordlistId';
    this.cfg[prop] = element.selectedIndex;

    if (!await this.saveProp(prop)) {
      OptionPage.showErrorModal('Failed to update defult wordlist.');
      return false;
    }

    this.populateOptions();
  }

  showBulkWordEditor() {
    const modalId = 'bulkWordEditorModal';
    const title = document.querySelector(`#${modalId} h5.modalTitle`) as HTMLHeadingElement;
    const tableContainer = document.querySelector(`#${modalId} div.tableContainer`) as HTMLDivElement;
    const table = tableContainer.querySelector('table') as HTMLTableElement;
    title.textContent = 'Bulk Word Editor';
    if (table.tHead.rows.length === 0) { table.tHead.appendChild(this.bulkWordEditorHeaderRow()); }
    const tBody = table.querySelector('tbody') as HTMLTableSectionElement;
    removeChildren(tBody);

    // Add current words to the table
    const wordKeys = Object.keys(this.cfg.words);
    if (wordKeys.length === 0) {
      this.bulkEditorAddRow();
    } else {
      wordKeys.forEach((key) => {
        this.bulkEditorAddRow(key, this.cfg.words[key]);
      });
    }

    tableContainer.querySelectorAll('th input.wordlistHeader').forEach((el) => { el.addEventListener('click', (e) => { this.bulkEditorWordlistCheckbox(e); }); });
    OptionPage.openModal(modalId);
  }

  showSupportedAudioSiteConfig() {
    const select = document.querySelector('#supportedAudioSitesModal select#siteSelect') as HTMLSelectElement;
    const textArea = document.querySelector('#supportedAudioSitesModal div#modalContentRight textarea') as HTMLTextAreaElement;
    const config = {};
    config[select.value] = WebAudioSites.sites[select.value];
    textArea.textContent = JSON.stringify(config, null, 2);
  }

  showSupportedAudioSites() {
    const title = document.querySelector('#supportedAudioSitesModal h5.modalTitle') as HTMLHeadingElement;
    title.textContent = 'Supported Audio Sites';
    const contentLeft = document.querySelector('#supportedAudioSitesModal div#modalContentLeft') as HTMLDivElement;
    const select = contentLeft.querySelector('#siteSelect') as HTMLSelectElement;
    removeChildren(select);

    const sortedSites = Object.keys(WebAudioSites.sites).sort((a, b) => {
      const domainA = a.match(/\w*\.\w*$/)[0];
      const domainB = b.match(/\w*\.\w*$/)[0];
      return domainA < domainB ? -1 : domainA > domainB ? 1 : 0;
    });

    sortedSites.forEach((site) => {
      const optionElement = document.createElement('option');
      optionElement.value = site;
      optionElement.textContent = site;
      select.appendChild(optionElement);
    });

    this.showSupportedAudioSiteConfig();
    OptionPage.openModal('supportedAudioSitesModal');
  }

  switchPage(evt) {
    const currentTab = document.querySelector(`#menu a.${OptionPage.activeClass}`) as HTMLElement;
    const newTab = evt.target as HTMLElement;

    currentTab.classList.remove(OptionPage.activeClass);
    newTab.classList.add(OptionPage.activeClass);

    const currentPage = document.getElementById(currentTab.textContent.toLowerCase() + 'Page') as HTMLElement;
    const newPage = document.getElementById(newTab.textContent.toLowerCase() + 'Page') as HTMLElement;
    OptionPage.hide(currentPage);
    OptionPage.show(newPage);

    switch (newTab.textContent.toLowerCase()) {
      case 'test':
        document.getElementById('testText').focus();
        break;
    }
  }

  async toggleTheme() {
    this.cfg.darkMode = !this.cfg.darkMode;
    await this.cfg.save('darkMode');
    this.applyTheme();
  }

  updateBookmarklet(url: string) {
    const bookmarkletLink = document.getElementById('bookmarkletLink') as HTMLAnchorElement;
    const bookmarklet = new Bookmarklet(url);
    bookmarkletLink.href = bookmarklet.destination();
    OptionPage.enableBtn(bookmarkletLink);
  }

  updateHostedBookmarklet() {
    const bookmarkletLink = document.getElementById('bookmarkletLink') as HTMLAnchorElement;
    const bookmarkletHostedURLInput = document.getElementById('bookmarkletHostedURL') as HTMLInputElement;
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
      case Constants.FILTER_METHODS.CENSOR:
        OptionPage.show(document.getElementById('censorSettings'));
        OptionPage.hide(document.getElementById('substitutionSettings'));
        OptionPage.hide(document.getElementById('wordSubstitution'));
        break;
      case Constants.FILTER_METHODS.SUBSTITUTE:
        OptionPage.hide(document.getElementById('censorSettings'));
        OptionPage.show(document.getElementById('substitutionSettings'));
        OptionPage.show(document.getElementById('wordSubstitution'));
        break;
      case Constants.FILTER_METHODS.REMOVE:
        OptionPage.hide(document.getElementById('censorSettings'));
        OptionPage.hide(document.getElementById('substitutionSettings'));
        OptionPage.hide(document.getElementById('wordSubstitution'));
        break;
    }
  }

  updateItemList(evt, input, attr: string, invalidMessage: string, original = ''): boolean {
    const item = input.value.trim().toLowerCase();
    if (item == '') { // No data
      OptionPage.showInputError(input, 'Please enter a value.');
      return false;
    } else {
      if (input.checkValidity()) {
        OptionPage.hideInputError(input);
        if (!this.cfg[attr].includes(item)) {
          if (original != '' && this.cfg[attr].includes(original)) {
            // Update existing record (remove it before adding the new record)
            this.cfg[attr].splice(this.cfg[attr].indexOf(original), 1);
          }
          // Save new record
          this.cfg[attr].push(item);
          this.cfg[attr] = this.cfg[attr].sort();
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
      const updateMin = target.id === 'audioYouTubeAutoSubsMin';
      const min = parseFloat(updateMin ? target.value : (document.getElementById('audioYouTubeAutoSubsMin') as HTMLInputElement).value);
      const max = parseFloat(updateMin ? (document.getElementById('audioYouTubeAutoSubsMax') as HTMLInputElement).value : target.value);
      if (min != 0 && max != 0 && min > max) {
        OptionPage.showInputError(target, 'Min must be less than max.');
      } else {
        const prop = updateMin ? 'youTubeAutoSubsMin' : 'youTubeAutoSubsMax';
        this.cfg[prop] = parseFloat(target.value);
        await this.saveProp(prop);
      }
    } else {
      OptionPage.showInputError(target, 'Please enter a valid number of seconds.');
    }
  }
}

const filter = new Filter;
const option = new OptionPage;

////
// Events
// Functions
function bulkEditorSave(e) { option.bulkEditorSave(); }
function importConfig(e) { option.importConfig(e); }
function removeAllWords(e) { option.removeAllWords(e); }
function restoreDefaults(e) { option.restoreDefaults(e); }
function setPassword(e) { option.auth.setPassword(option); }
// Add event listeners to DOM
window.addEventListener('load', (e) => { option.init(); });
document.querySelectorAll('#menu a').forEach((el) => { el.addEventListener('click', (e) => { option.switchPage(e); }); });
// Modals
document.getElementById('submitPassword').addEventListener('click', (e) => { option.auth.authenticate(e); });
document.getElementById('confirmModalBackup').addEventListener('click', (e) => { option.confirmModalBackup(); });
document.getElementById('confirmModalOK').addEventListener('click', (e) => { OptionPage.closeModal('confirmModal'); });
document.getElementById('confirmModalCancel').addEventListener('click', (e) => { OptionPage.closeModal('confirmModal'); });
document.getElementById('statusModalOK').addEventListener('click', (e) => { OptionPage.closeModal('statusModal'); });
document.querySelector('#supportedAudioSitesModal #siteSelect').addEventListener('change', (e) => { option.showSupportedAudioSiteConfig(); });
document.querySelector('#supportedAudioSitesModal button.modalOK').addEventListener('click', (e) => { OptionPage.closeModal('supportedAudioSitesModal'); });
document.querySelector('#bulkWordEditorModal button.modalAddWord').addEventListener('click', (e) => { option.bulkEditorAddRow(); });
document.querySelector('#bulkWordEditorModal button.modalBulkAddWords').addEventListener('click', (e) => { option.bulkEditorAddWords(); });
document.querySelector('#bulkWordEditorModal button.modalCancel').addEventListener('click', (e) => { OptionPage.closeModal('bulkWordEditorModal'); });
document.querySelector('#bulkWordEditorModal button.modalSave').addEventListener('click', (e) => { option.confirm(e, 'bulkEditorSave'); });
// Settings
document.querySelectorAll('#filterMethod input').forEach((el) => { el.addEventListener('click', (e) => { option.selectFilterMethod(e); }); });
document.getElementById('censorCharacterSelect').addEventListener('change', (e) => { option.saveOptions(e); });
document.getElementById('censorFixedLengthSelect').addEventListener('change', (e) => { option.saveOptions(e); });
document.getElementById('defaultWordMatchMethodSelect').addEventListener('change', (e) => { option.saveOptions(e); });
document.getElementById('defaultWordRepeat').addEventListener('click', (e) => { option.saveOptions(e); });
document.getElementById('defaultWordSeparators').addEventListener('click', (e) => { option.saveOptions(e); });
document.getElementById('preserveCase').addEventListener('click', (e) => { option.saveOptions(e); });
document.getElementById('preserveFirst').addEventListener('click', (e) => { option.saveOptions(e); });
document.getElementById('preserveLast').addEventListener('click', (e) => { option.saveOptions(e); });
document.getElementById('showCounter').addEventListener('click', (e) => { option.saveOptions(e); });
document.getElementById('showSummary').addEventListener('click', (e) => { option.saveOptions(e); });
document.getElementById('showUpdateNotification').addEventListener('click', (e) => { option.saveOptions(e); });
document.getElementById('filterWordList').addEventListener('click', (e) => { option.saveOptions(e); });
document.getElementById('substitutionMark').addEventListener('click', (e) => { option.saveOptions(e); });
document.getElementById('defaultWordSubstitutionText').addEventListener('change', (e) => { option.saveOptions(e); });
// Words/Phrases
document.getElementById('wordList').addEventListener('change', (e) => { option.populateWord(); });
document.getElementById('wordText').addEventListener('input', (e) => { OptionPage.hideInputError(e.target); });
document.getElementById('substitutionText').addEventListener('input', (e) => { OptionPage.hideInputError(e.target); });
document.getElementById('wordSave').addEventListener('click', (e) => { option.saveWord(e); });
document.getElementById('wordRemove').addEventListener('click', (e) => { option.removeWord(e); });
document.getElementById('wordRemoveAll').addEventListener('click', (e) => { option.confirm(e, 'removeAllWords'); });
document.getElementById('bulkWordEditorButton').addEventListener('click', (e) => { option.showBulkWordEditor(); });
// Lists
document.getElementById('whitelist').addEventListener('change', (e) => { option.populateWhitelistWord(); });
document.getElementById('whitelistText').addEventListener('input', (e) => { OptionPage.hideInputError(e.target); });
document.getElementById('whitelistSave').addEventListener('click', (e) => { option.saveWhitelist(e); });
document.getElementById('whitelistRemove').addEventListener('click', (e) => { option.removeWhitelist(e); });
document.getElementById('wordlistsEnabled').addEventListener('click', (e) => { option.saveOptions(e); });
document.getElementById('wordlistRename').addEventListener('click', (e) => { option.renameWordlist(); });
document.getElementById('wordlistSelect').addEventListener('change', (e) => { option.populateWordlist(); });
document.getElementById('wordlistText').addEventListener('input', (e) => { OptionPage.hideInputError(e.target); });
document.getElementById('textWordlistSelect').addEventListener('change', (e) => { option.setDefaultWordlist(e.target as HTMLSelectElement); });
document.getElementById('audioWordlistSelect').addEventListener('change', (e) => { option.setDefaultWordlist(e.target as HTMLSelectElement); });
// Domains
document.querySelectorAll('#domainMode input').forEach((el) => { el.addEventListener('click', (e) => { option.saveOptions(e); }); });
document.getElementById('domainSelect').addEventListener('change', (e) => { option.populateDomain(); });
document.getElementById('domainText').addEventListener('input', (e) => { OptionPage.hideInputError(e.target); });
document.getElementById('domainSave').addEventListener('click', (e) => { option.saveDomain(e); });
document.getElementById('domainRemove').addEventListener('click', (e) => { option.removeDomain(e); });
// Audio
document.getElementById('muteAudio').addEventListener('click', (e) => { option.saveOptions(e); });
document.getElementById('supportedAudioSites').addEventListener('click', (e) => { option.showSupportedAudioSites(); });
document.getElementById('fillerAudioSelect').addEventListener('change', (e) => { option.saveOptions(e); });
document.getElementById('muteAudioOnly').addEventListener('click', (e) => { option.saveOptions(e); });
document.getElementById('muteCueRequireShowing').addEventListener('click', (e) => { option.saveOptions(e); });
document.querySelectorAll('#audioMuteMethod input').forEach((el) => { el.addEventListener('click', (e) => { option.saveOptions(e); }); });
document.querySelectorAll('#audioSubtitleSelection input').forEach((el) => { el.addEventListener('click', (e) => { option.saveOptions(e); }); });
document.querySelectorAll('input.updateYouTubeAutoLimits').forEach((el) => { el.addEventListener('input', (e) => { option.updateYouTubeAutoLimits(e.target); }); });
document.getElementById('customAudioSitesSave').addEventListener('click', (e) => { option.saveCustomAudioSites(); });
// Bookmarklet
document.querySelectorAll('#bookmarkletConfigInputs input').forEach((el) => { el.addEventListener('click', (e) => { option.populateBookmarkletPage(); }); });
document.getElementById('bookmarkletFile').addEventListener('click', (e) => { option.exportBookmarkletFile(); });
document.getElementById('bookmarkletHostedURL').addEventListener('input', (e) => { option.updateHostedBookmarklet(); });
document.getElementById('bookmarkletLink').addEventListener('click', (e) => { e.preventDefault(); });
// Config
document.getElementById('configInlineInput').addEventListener('click', (e) => { option.configInlineToggle(); });
document.getElementById('importFileInput').addEventListener('change', (e) => { option.importConfigFile(e); });
document.getElementById('configReset').addEventListener('click', (e) => { option.confirm(e, 'restoreDefaults'); });
document.getElementById('configExport').addEventListener('click', (e) => { option.exportConfig(); });
document.getElementById('configImport').addEventListener('click', (e) => { option.confirm(e, 'importConfig'); });
document.getElementById('setPassword').addEventListener('input', (e) => { option.auth.setPasswordButton(option); });
document.getElementById('setPasswordBtn').addEventListener('click', (e) => { option.confirm(e, 'setPassword'); });
// Test
document.getElementById('testText').addEventListener('input', (e) => { option.populateTest(); });
document.getElementsByClassName('themes')[0].addEventListener('click', (e) => { option.toggleTheme(); });
