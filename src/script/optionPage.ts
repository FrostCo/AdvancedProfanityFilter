import Constants from '@APF/lib/constants';
import WebConfig from '@APF/webConfig';
import Filter from '@APF/lib/filter';
import Domain from '@APF/domain';
import OptionAuth from '@APF/optionAuth';
import DataMigration from '@APF/dataMigration';
import Bookmarklet from '@APF/bookmarklet';
import Logger from '@APF/lib/logger';
import {
  booleanToNumber,
  dynamicList,
  exportToFile,
  lastElement,
  numberToBoolean,
  numberWithCommas,
  readFile,
  removeChildren,
  removeFromArray,
  stringArray,
  upperCaseFirst
} from '@APF/lib/helper';

const logger = new Logger('OptionPage');

export default class OptionPage {
  _confirmEventListeners: { (): void; } [];
  auth: OptionAuth;
  bookmarklet: Bookmarklet;
  cfg: WebConfig;
  darkModeButton: Element;
  filter: Filter;
  lessUsedWords: { [word: string]: number };
  lightModeButton: Element;
  prefersDarkScheme: boolean;
  themeElements: Element[];

  //#region Class reference helpers
  // Can be overridden in children classes
  static get Config() { return WebConfig; }
  static get Constants() { return Constants; }
  static get DataMigration() { return DataMigration; }
  static get Domain() { return Domain; }
  static get Filter() { return Filter; }
  get Class() { return (this.constructor as typeof OptionPage); }
  //#endregion

  static readonly activeClass = 'w3-flat-belize-hole';
  static readonly themeElementSelectors = [
    'body',
    'div#page',
    'div.w3-modal',
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

  static configureStatusModal(content: string | string[], title: string, titleColor: string) {
    const modalTitle = document.getElementById('statusModalTitle') as HTMLElement;
    const modalContent = document.getElementById('statusModalContent') as HTMLElement;
    const modalHeader = document.querySelector('#statusModal header') as HTMLElement;
    removeChildren(modalContent);

    modalHeader.className = `w3-container ${titleColor}`;
    modalTitle.textContent = title;

    content = stringArray(content);
    content.forEach((textPart) => {
      const contentElement = document.createElement('p') as HTMLParagraphElement;
      contentElement.textContent = textPart;
      modalContent.appendChild(contentElement);
    });
  }

  static disableBtn(element: HTMLElement) {
    element.classList.add('disabled');
    element.classList.add('w3-flat-silver');
  }

  static enableBtn(element: HTMLElement) {
    element.classList.remove('disabled');
    element.classList.remove('w3-flat-silver');
  }

  static handleError(message: string, error?: Error) {
    if (error) {
      logger.error(message, error);
      OptionPage.showErrorModal([message, `Error: ${error.message}`]);
    } else {
      logger.error(message);
      OptionPage.showErrorModal([message]);
    }
  }

  static hide(element: HTMLElement) {
    element.classList.remove('w3-show');
    element.classList.add('w3-hide');
  }

  static hideInputError(element: HTMLInputElement) {
    element.classList.remove('w3-border-red');
    try {
      element.setCustomValidity('');
    } catch (err) {
      // If HTML5 validation not supported, the modal will suffice
    }
  }

  static hideStatus() {
    const notificationPanel = document.getElementById('notificationPanel') as HTMLElement;
    OptionPage.hide(notificationPanel);
  }

  static isStorageError(error: Error): boolean {
    if (error.message) {
      const chromeQuotaError = '[QUOTA_BYTES quota exceeded]';
      const firefoxQuotaError = '[QuotaExceededError: storage.sync API call exceeded its quota limitations.]';
      const safariQuotaError = 'Storage quota exceeded.';
      return (
        error.message.includes(chromeQuotaError)
        || error.message.includes(firefoxQuotaError)
        || error.message.includes(safariQuotaError)
      );
    }

    return false;
  }

  static openModal(id: string) {
    OptionPage.show(document.getElementById(id));
  }

  static show(element: HTMLElement) {
    element.classList.remove('w3-hide');
    element.classList.add('w3-show');
  }

  static showErrorModal(content: string | string[] = ['The requested action failed. Please try again or contact support.'], title = 'Error', titleColor = 'w3-red') {
    this.configureStatusModal(content, title, titleColor);
    OptionPage.openModal('statusModal');
  }

  static showInputError(element, message = '') {
    element.classList.add('w3-border-red');
    if (message) {
      try {
        element.setCustomValidity(message);
        element.reportValidity();
      } catch (err) {
        OptionPage.showWarningModal(message);
      }
    }
  }

  static showStatusModal(content: string | string[] = ['Status updated.'], title = 'Status', titleColor = 'w3-flat-peter-river') {
    this.configureStatusModal(content, title, titleColor);
    OptionPage.openModal('statusModal');
  }

  static showWarningModal(content: string | string[] = ['Invalid input.'], title = 'Warning', titleColor = 'w3-orange') {
    this.configureStatusModal(content, title, titleColor);
    OptionPage.openModal('statusModal');
  }

  constructor() {
    this._confirmEventListeners = [];
    this.darkModeButton = document.querySelector('div.themes > div.moon');
    this.lightModeButton = document.querySelector('div.themes > div.sun');
    this.themeElements = OptionPage.themeElementSelectors.map((selector) => {
      return Array.from(document.querySelectorAll(selector));
    }).flat();
    this.prefersDarkScheme = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
    this.setHelpVersion();
    this.filter = new this.Class.Filter;
  }

  applyDarkTheme(allElements = true) {
    document.documentElement.style.setProperty('color-scheme', 'dark');
    const statsWordTable = document.querySelector('table#statsWordTable') as HTMLTableElement;
    const bulkWordEditorTable = document.querySelector('table#bulkWordEditorTable') as HTMLTableElement;
    statsWordTable.classList.remove('w3-striped');
    bulkWordEditorTable.classList.remove('w3-striped');
    this.setThemeButton(true);

    if (allElements) {
      this.themeElements.forEach((element) => {
        element.classList.add('dark');
        element.classList.remove('light');
      });
    }
  }

  applyLightTheme(allElements = true) {
    document.documentElement.style.setProperty('color-scheme', 'light');
    const statsWordTable = document.querySelector('table#statsWordTable') as HTMLTableElement;
    const bulkWordEditorTable = document.querySelector('table#bulkWordEditorTable') as HTMLTableElement;
    statsWordTable.classList.add('w3-striped');
    bulkWordEditorTable.classList.add('w3-striped');
    this.setThemeButton(false);

    if (allElements) {
      this.themeElements.forEach((element) => {
        element.classList.remove('dark');
        element.classList.add('light');
      });
    }
  }

  applyTheme(refresh = false) {
    if (this.cfg.darkMode == null) {
      if (this.prefersDarkScheme) {
        this.applyDarkTheme(refresh);
      } else {
        this.applyLightTheme(refresh);
      }
    } else {
      if (this.cfg.darkMode) {
        this.applyDarkTheme();
      } else {
        this.applyLightTheme();
      }
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
    const cellSubCase = row.insertCell(3);
    const cellMatchMethod = row.insertCell(4);
    const cellRepeat = row.insertCell(5);
    const cellSeparators = row.insertCell(6);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'X';
    removeButton.addEventListener('click', (evt) => { this.bulkEditorRemoveRow(evt.target as HTMLButtonElement); });
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

    const subCaseInput = document.createElement('input');
    subCaseInput.type = 'checkbox';
    subCaseInput.name = 'subCase';
    subCaseInput.checked = numberToBoolean(data.case);
    cellSubCase.appendChild(subCaseInput);

    const matchMethodSelect = document.createElement('select');
    this.Class.Constants.orderedArray(this.Class.Constants.MATCH_METHODS).forEach((matchMethod, index) => {
      const matchMethodUpper = matchMethod.toUpperCase();
      const optionElement = document.createElement('option');
      optionElement.value = this.Class.Constants.MATCH_METHODS[matchMethodUpper].toString();
      optionElement.classList.add(`bulkMatchMethod${this.Class.Constants.MATCH_METHODS[matchMethodUpper]}`);
      optionElement.textContent = matchMethod;
      matchMethodSelect.appendChild(optionElement);
    });
    matchMethodSelect.selectedIndex = data.matchMethod;
    cellMatchMethod.appendChild(matchMethodSelect);

    const repeatInput = document.createElement('input');
    repeatInput.type = 'checkbox';
    repeatInput.name = 'repeat';
    repeatInput.checked = numberToBoolean(data.repeat);
    cellRepeat.appendChild(repeatInput);

    const separatorsInput = document.createElement('input');
    separatorsInput.type = 'checkbox';
    separatorsInput.name = 'separators';
    separatorsInput.checked =  numberToBoolean(data.separators);
    cellSeparators.appendChild(separatorsInput);

    const existingCellCount = row.cells.length;
    this.cfg.wordlists.forEach((wordlist, index) => {
      const cell = row.insertCell(index + existingCellCount);
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

  bulkEditorRemoveRow(button: HTMLButtonElement) {
    const table = document.querySelector('#bulkWordEditorModal table#bulkWordEditorTable') as HTMLTableElement;
    const row = button.parentElement.parentElement as HTMLTableRowElement;
    table.deleteRow(row.rowIndex);
    if (table.rows.length == 1) {
      // Add a new row if that was the last row (ignoring header)
      this.bulkEditorAddRow();
    }
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
          case: booleanToNumber((cells[3].querySelector('input') as HTMLInputElement).checked),
          lists: lists,
          matchMethod: (cells[4].querySelector('select') as HTMLSelectElement).selectedIndex,
          repeat: booleanToNumber((cells[5].querySelector('input') as HTMLInputElement).checked),
          separators: booleanToNumber((cells[6].querySelector('input') as HTMLInputElement).checked),
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
      this.filter.rebuildWordlists();
      this.populateOptions();
    } catch (err) {
      if (OptionPage.isStorageError(err) && this.cfg.syncLargeKeys) {
        this.confirm('bulkEditorSaveRetry');
      } else {
        logger.warn('Failed to save.', err);
        OptionPage.showErrorModal(['Failed to save.', `Error: ${err.message}`]);
      }
    }
  }

  async bulkEditorSaveRetry() {
    const configSyncLargeKeys = document.getElementById('configSyncLargeKeys') as HTMLInputElement;
    configSyncLargeKeys.checked = false;
    try {
      await this.convertStorageLocation(null, true);
      await this.bulkEditorSave();
    } catch (err) {
      OptionPage.handleError('Failed to save.', err);
    }
  }

  async importConfigRetryCancel() {
    await this.init();
  }

  bulkEditorWordlistCheckbox(checkbox: HTMLInputElement) {
    const checked = checkbox.checked;
    document.querySelectorAll(`#bulkWordEditorModal table td input.wordlistData[data-col="${checkbox.dataset.col}"]`).forEach((box: HTMLInputElement) => {
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
    removeButton.addEventListener('click', (evt) => { this.bulkEditorRemoveAll(); });
    const removeSpan = document.createElement('span');
    removeSpan.textContent = 'Remove';
    removeCell.appendChild(removeButton);
    removeCell.appendChild(removeSpan);
    row.appendChild(removeCell);

    const normalHeaders = ['Word', 'Substitution', 'Substitution Case', 'Match Method', 'Repeated', 'Separators'];
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
      span.textContent = `${wordlist}`;
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

  async confirm(action: string) {
    const cancel = document.getElementById('confirmModalCancel');
    const ok = document.getElementById('confirmModalOK');

    // Cleanup old event listeners
    for (const listener of this._confirmEventListeners) {
      cancel.removeEventListener('click', listener);
      ok.removeEventListener('click', listener);
    }
    this._confirmEventListeners = [];

    const content = document.createElement('span');
    const paragraph = document.createElement('p');
    const italics = document.createElement('i');
    let validated = true;

    switch (action) {
      case 'bulkEditorSave':
        paragraph.textContent = 'Are you sure you want to save these changes?';
        italics.textContent = 'Make sure you have a backup first!';
        content.appendChild(paragraph);
        content.appendChild(italics);
        OptionPage.configureConfirmModal({ backup: true }, content);
        this._confirmEventListeners.push(this.bulkEditorSave.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'bulkEditorSaveRetry':
        paragraph.textContent = 'Failed to save changes because they were too large to be stored. Retry using local storage?';
        italics.textContent = 'Local storage can store more, but things like words and domains will no longer sync between devices.';
        content.appendChild(paragraph);
        content.appendChild(italics);
        OptionPage.configureConfirmModal({ backup: true, titleClass: 'w3-red' }, content);
        this._confirmEventListeners.push(this.bulkEditorSaveRetry.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'convertStorageLocation':
        if (this.cfg.syncLargeKeys) {
          paragraph.textContent = 'This will prevent large settings like words and domains from syncing, but allow you to store more.';
        } else {
          paragraph.textContent = 'This will allow large settings like words and domains to sync, but has stricter limits on how much you can store.';
        }
        italics.textContent = 'Make sure you have a backup first!';
        content.appendChild(paragraph);
        content.appendChild(italics);
        OptionPage.configureConfirmModal({ backup: true }, content);
        this._confirmEventListeners.push(this.populateConfig.bind(this));
        cancel.addEventListener('click', lastElement(this._confirmEventListeners));
        this._confirmEventListeners.push(this.convertStorageLocation.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'importConfig':
        OptionPage.configureConfirmModal({ content: 'Are you sure you want to overwrite your existing settings?', backup: true });
        this._confirmEventListeners.push(this.importConfig.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'importConfigRetry':
        paragraph.textContent = 'Import failed due to storage limitations. Would you like to try again using local storage?';
        italics.textContent = 'Local storage can store more, but things like words and domains will no longer sync between devices.';
        content.appendChild(paragraph);
        content.appendChild(italics);
        OptionPage.configureConfirmModal({ backup: false, titleClass: 'w3-red' }, content);
        this._confirmEventListeners.push(this.importConfigRetryCancel.bind(this));
        cancel.addEventListener('click', lastElement(this._confirmEventListeners));
        this._confirmEventListeners.push(this.importConfigRetry.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'removeAllWords':
        paragraph.textContent = 'Are you sure you want to remove all words?';
        content.appendChild(paragraph);
        OptionPage.configureConfirmModal({ backup: true }, content);
        this._confirmEventListeners.push(this.removeAllWords.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'removeLessUsedWords':
        validated = this.validateLessUsedWordsNumber();
        if (validated) {
          await this.prepareLessUsedWords();
          if (Object.keys(this.lessUsedWords).length) {
            OptionPage.configureConfirmModal({ backup: true, content: `Are you sure you want to remove ${Object.keys(this.lessUsedWords).length} words?` });
            this._confirmEventListeners.push(this.removeLessUsedWords.bind(this));
            ok.addEventListener('click', lastElement(this._confirmEventListeners));
          } else {
            validated = false;
            OptionPage.showStatusModal(
              'All words have been filtered more times than the provided number.\n\nTry increasing the number to include more words.'
            );
          }
        }
        break;
      case 'statsReset':
        OptionPage.configureConfirmModal({ content: 'Are you sure you want to reset filter statistics?' });
        this._confirmEventListeners.push(this.statsReset.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'restoreDefaults':
        OptionPage.configureConfirmModal({ content: 'Are you sure you want to restore defaults?', backup: true });
        this._confirmEventListeners.push(this.restoreDefaults.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'setPassword': {
        const passwordText = document.getElementById('setPassword') as HTMLInputElement;
        const passwordBtn = document.getElementById('setPasswordBtn') as HTMLInputElement;
        if (passwordBtn.classList.contains('disabled')) return false;

        const message = passwordText.value == '' ? 'Are you sure you want to remove the password?' : `Are you sure you want to set the password to '${passwordText.value}'?`;
        OptionPage.configureConfirmModal({ content: message });
        this._confirmEventListeners.push(this.auth.setPassword.bind(this.auth));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      }
    }

    if (validated) {
      OptionPage.openModal('confirmModal');
    }
  }

  confirmModalBackup() {
    const backupButton = document.querySelector('#confirmModal button#confirmModalBackup') as HTMLButtonElement;
    if (!backupButton.classList.contains('disabled')) {
      this.backupConfig();
      OptionPage.disableBtn(backupButton);
    }
  }

  async convertStorageLocation(evt: Event = null, silent = false) {
    const configSyncLargeKeys = document.getElementById('configSyncLargeKeys') as HTMLInputElement;
    this.cfg.syncLargeKeys = configSyncLargeKeys.checked;
    const keys = this.Class.Config._localConfigKeys;

    try {
      await this.cfg.save(keys);

      try {
        if (this.cfg.syncLargeKeys) {
          await this.Class.Config.removeLocalStorage(this.Class.Config._largeKeys);
        } else {
          let removeKeys = [];
          this.Class.Config._largeKeys.forEach((largeKey) => {
            removeKeys = removeKeys.concat(this.Class.Config.splitKeyNames(largeKey));
          });
          await this.Class.Config.removeSyncStorage(removeKeys);
        }

        if (!silent) {
          OptionPage.showStatusModal('Storage converted successfully.');
        }
      } catch (err) {
        // Revert UI and export a backup of config.
        this.cfg.syncLargeKeys = !this.cfg.syncLargeKeys;
        this.backupConfig();
        OptionPage.handleError('Failed to cleanup old storage, backup automatically exported.', err);
        await this.cfg.save('syncLargeKeys');
        this.populateConfig();
      }
    } catch (err) {
      // Revert UI
      OptionPage.handleError('Failed to update storage preference.', err);
      this.cfg.syncLargeKeys = !this.cfg.syncLargeKeys;
      this.populateConfig();
    }
  }

  domainCfgFromPage(): DomainCfg {
    const domainDisabledCheck = document.getElementById('domainDisabledCheck') as HTMLInputElement;
    const domainEnabledCheck = document.getElementById('domainEnabledCheck') as HTMLInputElement;
    const domainFramesOffCheck = document.getElementById('domainFramesOffCheck') as HTMLInputElement;
    const domainFramesOnCheck = document.getElementById('domainFramesOnCheck') as HTMLInputElement;
    const domainWordlistSelect = document.getElementById('domainWordlistSelect') as HTMLSelectElement;
    const wordlist = domainWordlistSelect.selectedIndex > 0 ? domainWordlistSelect.selectedIndex - 1 : undefined;
    const newDomainCfg: DomainCfg = {
      disabled: domainDisabledCheck.checked,
      enabled: domainEnabledCheck.checked,
      framesOn: domainFramesOnCheck.checked,
      framesOff: domainFramesOffCheck.checked,
      wordlist: wordlist,
    };
    return newDomainCfg;
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

  async filterWordListUpdate() {
    const filterWordList = document.getElementById('filterWordList') as HTMLInputElement;
    const wordList = document.getElementById('wordList') as HTMLSelectElement;
    this.cfg.filterWordList = filterWordList.checked;
    const selectedWord = wordList.value;

    try {
      await this.cfg.save('filterWordList');
      this.populateWordPage();

      if (selectedWord) {
        wordList.value = selectedWord;
        this.populateWord();
      }
    } catch (err) {
      OptionPage.showErrorModal(['Failed to save.', `Error: ${err.message}`]);
      return false;
    }
  }

  async getStatsFromStorage() {
    const { stats }: { stats: Statistics } = await this.Class.Config.getLocalStorage({ stats: { words: {} } }) as any;
    return stats;
  }

  importConfig() {
    const input = document.getElementById('configInlineInput') as HTMLInputElement;
    if (input.checked) { // inline editor
      const configText = document.getElementById('configText') as HTMLTextAreaElement;
      this.importConfigText(configText.value);
    } else {
      const importFileInput = document.getElementById('importFileInput') as HTMLInputElement;
      importFileInput.click();
    }
  }

  async importConfigFile(files: FileList) {
    const file = files[0];
    const importFileInput = document.getElementById('importFileInput') as HTMLInputElement;
    const fileText = await readFile(file) as string;
    this.importConfigText(fileText);
    importFileInput.value = '';
  }

  async importConfigRetry() {
    const configSyncLargeKeys = document.getElementById('configSyncLargeKeys') as HTMLInputElement;
    configSyncLargeKeys.checked = false;
    try {
      await this.convertStorageLocation(null, true);
      await this.cfg.save();
      OptionPage.showStatusModal('Settings imported successfully.');
      await this.init();
    } catch (err) {
      OptionPage.handleError('Failed to import config.', err);
    }
  }

  async importConfigText(cfg: string) {
    try {
      const importedCfg = new this.Class.Config(JSON.parse(cfg));
      const migration = new this.Class.DataMigration(importedCfg);
      await migration.runImportMigrations();
      const resetSuccess = await this.restoreDefaults(null, true);
      if (resetSuccess) {
        try {
          this.cfg = importedCfg;
          await this.cfg.save();
          OptionPage.showStatusModal('Settings imported successfully.');
          await this.init(true);
        } catch (err) {
          if (OptionPage.isStorageError(err) && this.cfg.syncLargeKeys) {
            this.confirm('importConfigRetry');
          } else {
            OptionPage.handleError('Failed to import settings.', err);
          }
        }
      }
    } catch (err) {
      OptionPage.showErrorModal(['Failed to process new settings.', `Error: ${err.message}`]);
    }
  }

  async init(refreshTheme = false) {
    await this.initializeCfg();
    logger.setLevel(this.cfg.loggingLevel);
    this.applyTheme(refreshTheme);
    if (!this.auth) this.auth = new OptionAuth(this, this.cfg.password);
    this.filter.cfg = this.cfg;
    this.filter.init();

    // logger.debug(`Password: '${this.cfg.password}', Authenticated: ${this.auth.authenticated}`);
    if (this.cfg.password && !this.auth.authenticated) {
      OptionPage.openModal('passwordModal');
      document.getElementById('passwordInput').focus();
    } else {
      OptionPage.show(document.getElementById('main'));
    }

    if (!this.bookmarklet) this.bookmarklet = await Bookmarklet.create();
    this.populateOptions();

    // Route to page based on URL
    const routePage = window.location.hash.slice(1);
    const tab = document.querySelector(`#menu a[href="#${routePage}"]`) as HTMLAnchorElement;
    if (tab) {
      tab.click();
    }
  }

  async initializeCfg() {
    this.cfg = await this.Class.Config.load();
  }

  newWordWordlistChecked(index: number): boolean {
    return index == (this.cfg.wordlistId - 1);
  }

  populateBookmarkletPage() {
    if (!this.bookmarklet) return;

    const bookmarkletConfig = document.querySelector('input[name="bookmarkletConfig"]:checked') as HTMLInputElement;
    const bookmarkletLink = document.getElementById('bookmarkletLink') as HTMLAnchorElement;
    const cfg = bookmarkletConfig.value == 'default' ? null : this.cfg;
    const href = this.bookmarklet.href(cfg);
    bookmarkletLink.href = href;
    OptionPage.enableBtn(bookmarkletLink);
  }

  populateConfig() {
    const configSyncLargeKeys = document.getElementById('configSyncLargeKeys') as HTMLInputElement;
    const configLoggingLevelSelect = document.getElementById('configLoggingLevelSelect') as HTMLSelectElement;
    dynamicList(this.Class.Constants.orderedArray(this.Class.Constants.LOGGING_LEVELS), configLoggingLevelSelect, true);
    configLoggingLevelSelect.selectedIndex = this.cfg.loggingLevel;
    configSyncLargeKeys.checked = this.cfg.syncLargeKeys;
    this.auth.setPasswordButton();
  }

  populateDomain() {
    const domainsSelect = document.getElementById('domainSelect') as HTMLInputElement;
    const domainText = document.getElementById('domainText') as HTMLInputElement;
    const domainModeSelect = document.getElementById('domainModeSelect') as HTMLSelectElement;
    const domainDisabledCheck = document.getElementById('domainDisabledCheck') as HTMLInputElement;
    const domainEnabledCheck = document.getElementById('domainEnabledCheck') as HTMLInputElement;
    const domainFramesOffCheck = document.getElementById('domainFramesOffCheck') as HTMLInputElement;
    const domainFramesOnCheck = document.getElementById('domainFramesOnCheck') as HTMLInputElement;
    const domainWordlistSelect = document.getElementById('domainWordlistSelect') as HTMLSelectElement;
    const domainRemoveBtn = document.getElementById('domainRemove') as HTMLButtonElement;

    const key = domainsSelect.value;
    domainText.value = key;

    let domainCfg: DomainCfg;
    if (!key) { // New record
      OptionPage.disableBtn(domainRemoveBtn);
      domainCfg = Object.assign({}, this.Class.Domain._domainCfgDefaults);
    } else { // Existing record
      OptionPage.enableBtn(domainRemoveBtn);
      domainCfg = this.cfg.domains[domainsSelect.value];
    }

    const domainKey = domainText.value.trim().toLowerCase();
    if (domainKey == '') { // No data
      domainModeSelect.selectedIndex = this.Class.Constants.DOMAIN_MODES.NORMAL;
    } else {
      const domain = new this.Class.Domain(domainKey, domainCfg);
      domainModeSelect.selectedIndex = domain.getModeIndex();
    }

    domainDisabledCheck.checked = domainCfg.disabled;
    domainEnabledCheck.checked = domainCfg.enabled;
    domainFramesOffCheck.checked = domainCfg.framesOff;
    domainFramesOnCheck.checked = domainCfg.framesOn;
    const wordlist = domainCfg.wordlist >= 0 ? domainCfg.wordlist + 1 : 0;
    domainWordlistSelect.selectedIndex = wordlist;

    return domainCfg;
  }

  populateDomainPage() {
    const domainModeSelect = document.getElementById('domainModeSelect') as HTMLSelectElement;
    const domainFilterAllFrames = document.getElementById('domainFilterAllFrames') as HTMLInputElement;
    const domainsSelect = document.getElementById('domainSelect') as HTMLSelectElement;
    const domainText = document.getElementById('domainText') as HTMLInputElement;
    const mode = this.cfg.enabledDomainsOnly ? 'minimal' : 'normal';
    const domainMode = document.querySelector(`input[name=domainMode][value='${mode}']`) as HTMLInputElement;
    const wordlistContainer = document.getElementById('domainWordlistContainer') as HTMLInputElement;
    domainMode.checked = true;
    const domainDisabledLabel = document.getElementById('domainDisabledLabel') as HTMLLabelElement;
    const domainEnabledLabel = document.getElementById('domainEnabledLabel') as HTMLLabelElement;
    const domainFramesOffLabel = document.getElementById('domainFramesOffLabel') as HTMLLabelElement;
    const domainFramesOnLabel = document.getElementById('domainFramesOnLabel') as HTMLLabelElement;

    OptionPage.hideInputError(domainText);
    removeChildren(domainsSelect);

    const domains = this.Class.Domain.sortedKeys(this.cfg.domains);
    domains.unshift('Add, or update existing...');
    domains.forEach((domain) => {
      const optionElement = document.createElement('option');
      optionElement.textContent = domain;
      optionElement.value = domain === domains[0] ? '' : domain;
      domainsSelect.appendChild(optionElement);
    });
    domainFilterAllFrames.checked = !this.cfg.enabledFramesOnly;

    if (mode === 'minimal') {
      OptionPage.hide(domainDisabledLabel);
      OptionPage.show(domainEnabledLabel);
    } else {
      OptionPage.hide(domainEnabledLabel);
      OptionPage.show(domainDisabledLabel);
    }

    if (this.cfg.enabledFramesOnly) {
      OptionPage.hide(domainFramesOffLabel);
      OptionPage.show(domainFramesOnLabel);
    } else {
      OptionPage.hide(domainFramesOnLabel);
      OptionPage.show(domainFramesOffLabel);
    }

    dynamicList(this.Class.Constants.orderedArray(this.Class.Constants.DOMAIN_MODES), domainModeSelect, true);

    if (this.cfg.wordlistsEnabled) {
      OptionPage.show(wordlistContainer);
      const domainWordlistSelect = document.getElementById('domainWordlistSelect') as HTMLSelectElement;

      const wordlists = ['Default'].concat(this.Class.Config._allWordlists, this.cfg.wordlists);
      dynamicList(wordlists, domainWordlistSelect);
    } else {
      OptionPage.hide(wordlistContainer);
    }

    this.populateDomain();
  }

  populateOptions() {
    this.populateSettings();
    this.populateWordPage();
    this.populateAllowlist();
    this.populateWordlists();
    this.populateDomainPage();
    this.populateBookmarkletPage();
    this.populateConfig();
    this.populateStats();
    this.populateTest();
  }

  populateSettings() {
    this.updateFilterOptions();

    // Settings
    const selectedFilter = document.getElementById(`filter${this.Class.Constants.filterMethodName(this.cfg.filterMethod)}`) as HTMLInputElement;
    const useDeviceTheme = document.getElementById('useDeviceTheme') as HTMLInputElement;
    const showContextMenu = document.getElementById('showContextMenu') as HTMLInputElement;
    const showCounter = document.getElementById('showCounter') as HTMLInputElement;
    const showSummary = document.getElementById('showSummary') as HTMLInputElement;
    const showUpdateNotification = document.getElementById('showUpdateNotification') as HTMLInputElement;
    const filterWordList = document.getElementById('filterWordList') as HTMLInputElement;
    selectedFilter.checked = true;
    useDeviceTheme.checked = this.cfg.darkMode == null;
    showContextMenu.checked = this.cfg.contextMenu;
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
    defaultWordRepeat.checked = numberToBoolean(this.cfg.defaultWordRepeat);
    defaultWordSeparators.checked = numberToBoolean(this.cfg.defaultWordSeparators);
    const defaultWordSubstitution = document.getElementById('defaultWordSubstitutionText') as HTMLInputElement;
    defaultWordSubstitution.value = this.cfg.defaultSubstitution;
    removeChildren(defaultWordMatchMethodSelect);
    for (let i = 0; i < 3; i++) { // Skip Regex
      const optionElement = document.createElement('option');
      const matchMethodName = upperCaseFirst(this.Class.Constants.matchMethodName(i));
      optionElement.value = matchMethodName;
      optionElement.textContent = matchMethodName;
      defaultWordMatchMethodSelect.appendChild(optionElement);
    }
    defaultWordMatchMethodSelect.selectedIndex = this.cfg.defaultWordMatchMethod;
  }

  async populateStats() {
    try {
      this.filter.buildWordlist(this.Class.Constants.ALL_WORDS_WORDLIST_ID, true);
      const stats = await this.getStatsFromStorage();

      // Prepare data (collect totals, add words without stats, sort output)
      let totalFiltered = 0;
      const allWords = this.filter.wordlists[this.Class.Constants.ALL_WORDS_WORDLIST_ID].list;
      for (const word of allWords) {
        totalFiltered += this.populateStatsCompileWords(stats, word);
      }
      const alphaSortedWords = allWords.sort();
      const sortedWords = alphaSortedWords.sort((a, b) => stats.words[b].total - stats.words[a].total);

      const statsWordContainer = document.querySelector('div#statsWordContainer') as HTMLDivElement;
      const statsWordTable = statsWordContainer.querySelector('table#statsWordTable') as HTMLTableElement;

      // Table body
      const tBody = document.createElement('tbody');
      for (const word of sortedWords) {
        this.populateStatsWordRow(stats, tBody, word);
      }
      const oldTBody = statsWordTable.tBodies[0];
      statsWordTable.replaceChild(tBody, oldTBody);

      // Options
      const collectStats = document.getElementById('collectStats') as HTMLInputElement;
      collectStats.checked = this.cfg.collectStats;

      this.populateStatsSummary(stats, totalFiltered);
    } catch (err) {
      logger.warn('Failed to populate stats.', err);
      OptionPage.showErrorModal(['Failed to populate stats.', `Error: ${err.message}`]);
    }
  }

  populateStatsCompileWords(stats, word: string): number {
    let total = 0;
    const wordStats = stats.words[word];
    if (wordStats) {
      wordStats.total = wordStats.text;
      total += wordStats.text;
    } else {
      stats.words[word] = { text: 0, total: 0 };
    }
    return total;
  }

  populateStatsSummary(stats, totalFiltered: number) {
    const statsSummaryTotal = document.querySelector('table#statsSummaryTable td#statsSummaryTotal') as HTMLTableCellElement;
    statsSummaryTotal.textContent = numberWithCommas(totalFiltered);
    const statsSummarySince = document.querySelector('table#statsSummaryTable td#statsSummarySince') as HTMLTableCellElement;
    statsSummarySince.textContent = stats.startedAt ? new Date(stats.startedAt).toLocaleString() : '';
  }

  populateStatsWordRow(stats, tBody: HTMLTableSectionElement, word: string) {
    const wordStats = stats.words[word];
    const row = tBody.insertRow();
    const wordCell = row.insertCell(0);
    wordCell.classList.add('w3-tooltip');
    const tooltipSpan = document.createElement('span');
    tooltipSpan.classList.add('statsTooltip', 'w3-tag', 'w3-text');
    tooltipSpan.textContent = word;
    const wordSpan = document.createElement('span');
    wordSpan.textContent = this.filter.replaceText(word, this.Class.Constants.ALL_WORDS_WORDLIST_ID, null);
    wordCell.appendChild(tooltipSpan);
    wordCell.appendChild(wordSpan);

    const textCell = row.insertCell(1);
    textCell.textContent = numberWithCommas(wordStats.text);

    return row;
  }

  populateTest() {
    const testText = document.getElementById('testText') as HTMLInputElement;
    const filteredTestText = document.getElementById('filteredTestText') as HTMLElement;

    if (testText.value === '') {
      filteredTestText.textContent = 'Enter some text above to test the filter...';
    } else {
      if (this.cfg.filterMethod === this.Class.Constants.FILTER_METHODS.OFF) {
        filteredTestText.textContent = testText.value;
      } else {
        filteredTestText.textContent = this.filter.replaceText(testText.value, this.filter.cfg.wordlistId, null);
      }
    }
  }

  populateAllowlist() {
    const regExp = RegExp(' [*]$');
    const sensitiveList = this.filter.cfg.wordAllowlist.map((item) => { return item + ' *'; });
    const list = [].concat(sensitiveList, this.filter.cfg.iWordAllowlist).sort();
    const allowlist = document.getElementById('allowlistSelect') as HTMLSelectElement;
    removeChildren(allowlist);
    list.unshift('Add, or update existing...');
    list.forEach((item) => {
      const optionElement = document.createElement('option');
      optionElement.value = item === list[0] ? '' : item.replace(regExp, '');
      optionElement.dataset.sensitive = regExp.test(item).toString();
      optionElement.textContent = item;
      allowlist.appendChild(optionElement);
    });
    this.populateAllowlistWord();
  }

  populateAllowlistWord() {
    const allowlist = document.getElementById('allowlistSelect') as HTMLSelectElement;
    const allowlistRemove = document.getElementById('allowlistRemove') as HTMLInputElement;
    const allowlistText = document.getElementById('allowlistText') as HTMLInputElement;
    const selected = allowlist.selectedOptions[0];

    if (selected.value == '') { // New word
      allowlistText.value = '';
      OptionPage.disableBtn(allowlistRemove);

      // Default to case-insensitive
      const allowlistCase = document.getElementById('allowlistInsensitive') as HTMLInputElement;
      allowlistCase.checked = true;
    } else {
      allowlistText.value = selected.value;
      const caseId = selected.dataset.sensitive === 'true' ? 'allowlistSensitive' : 'allowlistInsensitive';
      const allowlistCase = document.getElementById(caseId) as HTMLInputElement;
      allowlistCase.checked = true;
      OptionPage.enableBtn(allowlistRemove);
    }
  }

  populateWord() {
    const wordList = document.getElementById('wordList') as HTMLSelectElement;
    const wordText = document.getElementById('wordText') as HTMLInputElement;
    const wordMatchRepeated = document.getElementById('wordMatchRepeated') as HTMLInputElement;
    const wordMatchSeparators = document.getElementById('wordMatchSeparators') as HTMLInputElement;
    const substitutionText = document.getElementById('substitutionText') as HTMLInputElement;
    const substitutionCase = document.getElementById('substitutionCase') as HTMLInputElement;
    const wordRemove = document.getElementById('wordRemove') as HTMLInputElement;
    const word = wordList.value;
    const wordWordlistDiv = document.getElementById('wordWordlistDiv') as HTMLSelectElement;
    const wordlistSelections = document.querySelectorAll('div#wordlistSelections input') as NodeListOf<HTMLInputElement>;
    OptionPage.hideInputError(wordText);
    OptionPage.hideInputError(substitutionText);

    if (word == '') { // New word
      wordText.value = '';
      OptionPage.disableBtn(wordRemove);
      const selectedMatchMethod = document.getElementById(`wordMatch${upperCaseFirst(this.Class.Constants.matchMethodName(this.cfg.defaultWordMatchMethod))}`) as HTMLInputElement;
      selectedMatchMethod.checked = true;
      wordMatchRepeated.checked = numberToBoolean(this.cfg.defaultWordRepeat);
      wordMatchSeparators.checked = numberToBoolean(this.cfg.defaultWordSeparators);
      substitutionText.value = '';
      substitutionCase.checked = false;
      wordlistSelections.forEach((wordlist, index) => {
        wordlist.checked = this.newWordWordlistChecked(index);
      });
    } else { // Existing word
      OptionPage.enableBtn(wordRemove);
      const wordCfg = this.cfg.words[word];
      wordText.value = word;
      const selectedMatchMethod = document.getElementById(`wordMatch${upperCaseFirst(this.Class.Constants.matchMethodName(wordCfg.matchMethod))}`) as HTMLInputElement;
      selectedMatchMethod.checked = true;
      wordMatchRepeated.checked = numberToBoolean(wordCfg.repeat);
      wordMatchSeparators.checked = numberToBoolean(wordCfg.separators === undefined ? this.cfg.defaultWordSeparators : wordCfg.separators);
      substitutionText.value = wordCfg.sub;
      substitutionCase.checked = numberToBoolean(wordCfg.case);
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
      dynamicList(this.cfg.wordlists, wordlistSelect);
      dynamicList(this.Class.Config._allWordlists.concat(this.cfg.wordlists), textWordlistSelect);
      wordlistSelect.selectedIndex = selectedIndex;
      textWordlistSelect.selectedIndex = this.cfg.wordlistId;

      OptionPage.show(wordlistContainer);
      this.populateWordlist();
    } else {
      OptionPage.hide(wordlistContainer);
    }
  }

  populateWordPage() {
    let wordlistFilter = this.filter;
    const selections = document.getElementById('wordlistSelections') as HTMLInputElement;
    const wordsSelect = document.getElementById('wordList') as HTMLSelectElement;
    removeChildren(wordsSelect);

    // Workaround for remove filter method
    if (this.filter.cfg.filterWordList && this.filter.cfg.filterMethod === 2) {
      wordlistFilter = new this.Class.Filter;
      // Works because we are only changing a native value (filterMethod: number)
      wordlistFilter.cfg = new this.Class.Config(Object.assign({}, this.cfg, { filterMethod: 0 }));
      wordlistFilter.init();
    }

    const words = Object.keys(this.cfg.words).sort();
    words.unshift('Add, or update existing...');
    words.forEach((word) => {
      let filteredWord = word;
      if (word != words[0] && wordlistFilter.cfg.filterWordList) {
        if (wordlistFilter.cfg.words[word].matchMethod === this.Class.Constants.MATCH_METHODS.REGEX) { // Regexp
          filteredWord = wordlistFilter.cfg.words[word].sub || wordlistFilter.cfg.defaultSubstitution;
        } else {
          filteredWord = wordlistFilter.replaceText(word, this.Class.Constants.ALL_WORDS_WORDLIST_ID, null);
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

  async prepareLessUsedWords() {
    try {
      const stats = await this.getStatsFromStorage();
      const lessUsedWordsNumber = document.getElementById('lessUsedWordsNumber') as HTMLInputElement;
      const lessThan = parseInt(lessUsedWordsNumber.value);
      this.lessUsedWords = {};

      const allWords = this.filter.wordlists[this.Class.Constants.ALL_WORDS_WORDLIST_ID].list;
      for (const word of allWords) {
        const wordStats = stats.words[word];
        const total = this.totalFilteredWordStat(wordStats);
        if (total < lessThan) {
          this.lessUsedWords[word] = total;
        }
      }
    } catch (err) {
      logger.warn('Error while prepapring less-used words.', err);
      return {};
    }
  }

  async removeAllWords() {
    this.cfg.words = {};
    await this.cfg.save('words');
    const wordList = document.getElementById('wordList') as HTMLSelectElement;
    wordList.selectedIndex = 0;
    this.filter.rebuildWordlists();
    this.populateOptions();
  }

  async removeDomain() {
    const domainsSelect = document.getElementById('domainSelect') as HTMLInputElement;
    if (domainsSelect.value) {
      delete this.cfg.domains[domainsSelect.value];

      try {
        await this.cfg.save('domains');
        this.populateDomainPage();
      } catch (err) {
        logger.warn(`Failed to remove domain '${domainsSelect.value}'.`, err);
        OptionPage.showErrorModal([`Failed to remove domain '${domainsSelect.value}'.`, `Error: ${err.message}`]);
        return false;
      }
    }
  }

  async removeLessUsedWords() {
    Object.keys(this.lessUsedWords).forEach(((word) => {
      this.cfg.removeWord(word);
    }));
    await this.cfg.save('words');
    this.populateOptions();
  }

  async removeAllowlist() {
    const allowlist = document.getElementById('allowlistSelect') as HTMLSelectElement;
    const selected = allowlist.selectedOptions[0];
    const originalWord = selected.value;
    const originalCase = selected.dataset.sensitive === 'true' ? 'sensitive': 'insensitive';
    const originalListName = originalCase === 'sensitive' ? 'wordAllowlist' : 'iWordAllowlist';
    this.cfg[originalListName] = removeFromArray(this.cfg[originalListName], originalWord);

    try {
      await this.cfg.save(originalListName);
      this.filter.init();
      this.populateOptions();
    } catch (err) {
      logger.warn(`Failed to remove '${originalWord}' from allowlist.`, err);
      OptionPage.showErrorModal([`Failed to remove '${originalWord}' from allowlist.`, `Error: ${err.message}`]);
      return false;
    }
  }

  async removeWord(button: HTMLButtonElement) {
    if (button.classList.contains('disabled')) return false;

    const wordList = document.getElementById('wordList') as HTMLSelectElement;
    const word = wordList.value;

    const result = this.cfg.removeWord(word);
    if (result) {
      try {
        await this.cfg.save('words');
        // Update states and Reset word form
        wordList.selectedIndex = 0;
        this.filter.rebuildWordlists();
        this.populateOptions();
      } catch (err) {
        logger.warn(`Failed to remove '${word}'.`, err);
        OptionPage.showErrorModal([`Failed to remove '${word}'.`, `Error: ${err.message}`]);
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
      try {
        await this.cfg.save('wordlists');
        this.populateWordlists(index);
        this.populateWordPage();
      } catch (err) {
        OptionPage.handleError('Failed to save wordlist name.', err);
      }
    } else {
      OptionPage.showInputError(wordlistText, 'Please enter a valid name.');
    }
  }

  async restoreDefaults(evt: Event = null, silent = false) {
    try {
      await this.cfg.resetPreserveStats();
      if (!silent) OptionPage.showStatusModal('Default settings restored.');
      await this.init(true);
      return true;
    } catch (err) {
      logger.warn('Failed to restore defaults.', err);
      OptionPage.showErrorModal(['Failed to restore defaults.', `Error: ${err.message}`]);
      return false;
    }
  }

  async saveDomain() {
    const domainText = document.getElementById('domainText') as HTMLInputElement;
    const newKey = domainText.value.trim().toLowerCase();

    if (newKey == '') { // No data
      OptionPage.showInputError(domainText, 'Please enter a value.');
      return false;
    }

    if (domainText.checkValidity()) {
      OptionPage.hideInputError(domainText);
      const domainCfg = this.domainCfgFromPage();
      if (!domainCfg) {
        OptionPage.showInputError('Failed to gather domain settings.');
        return false;
      }

      try {
        // URL changed: remove old entry
        const domainsSelect = document.getElementById('domainSelect') as HTMLInputElement;
        const originalKey = domainsSelect.value;
        if (originalKey && newKey != originalKey) delete this.cfg.domains[originalKey];

        const domain = new this.Class.Domain(newKey, domainCfg);

        // Get domain mode
        const domainModeSelect = document.getElementById('domainModeSelect') as HTMLSelectElement;
        domain.updateFromModeIndex(domainModeSelect.selectedIndex);

        await domain.save(this.cfg);
        this.populateDomainPage();
      } catch (err) {
        OptionPage.showErrorModal(['Failed to save.', `Error: ${err.message}`]);
        return false;
      }
    } else {
      OptionPage.showInputError(domainText, 'Valid domain example: google.com or www.google.com');
      return false;
    }
  }

  async saveOptions() {
    this.updateOptionsFromPage();

    try {
      await this.cfg.save();
      await this.init();
      return true;
    } catch (err) {
      logger.warn('Settings not saved! Please try again.', err);
      OptionPage.showErrorModal(['Settings not saved! Please try again.', `Error: ${err.message}`]);
      return false;
    }
  }

  async saveAllowlist() {
    const allowlist = document.getElementById('allowlistSelect') as HTMLSelectElement;
    const selected = allowlist.selectedOptions[0];
    const selectedCase = document.querySelector('input[name="allowlistCase"]:checked') as HTMLInputElement;
    const allowlistText = document.getElementById('allowlistText') as HTMLInputElement;

    const propsToSave = [];
    const newCase = selectedCase.value;
    const newWord = newCase === 'sensitive' ? allowlistText.value : allowlistText.value.toLowerCase();
    const newListName = newCase === 'sensitive' ? 'wordAllowlist' : 'iWordAllowlist';

    if (allowlistText.value === '') {
      OptionPage.showInputError(allowlistText, 'Please enter a valid word/phrase.');
      return false;
    }

    if (this.cfg[newListName].indexOf(newWord) > -1) {
      OptionPage.showInputError(allowlistText, 'Already allowlisted.');
      return false;
    }

    if (allowlistText.checkValidity()) {
      if (selected.value === '') { // New word
        this.cfg[newListName].push(newWord);
        propsToSave.push(newListName);
      } else { // Modifying existing word
        const originalWord = selected.value;
        const originalCase = selected.dataset.sensitive === 'true' ? 'sensitive': 'insensitive';
        const originalListName = originalCase === 'sensitive' ? 'wordAllowlist' : 'iWordAllowlist';

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
          this.filter.init();
          this.populateOptions();
        } catch (err) {
          logger.warn('Failed to update allowlist.', err);
          OptionPage.showErrorModal(['Failed to update allowlist.', `Error: ${err.message}`]);
          return false;
        }
      }
    } else {
      OptionPage.showInputError(allowlistText, 'Please enter a valid word/phrase.');
    }
  }

  async saveWord() {
    const wordList = document.getElementById('wordList') as HTMLSelectElement;
    const wordText = document.getElementById('wordText') as HTMLInputElement;
    const wordMatchRepeated = document.getElementById('wordMatchRepeated') as HTMLInputElement;
    const wordMatchSeparators = document.getElementById('wordMatchSeparators') as HTMLInputElement;
    const substitutionText = document.getElementById('substitutionText') as HTMLInputElement;
    const substitutionCase = document.getElementById('substitutionCase') as HTMLInputElement;
    const selectedMatchMethod = document.querySelector('input[name="wordMatchMethod"]:checked') as HTMLInputElement;
    const wordlistSelectionsInput = document.querySelectorAll('div#wordlistSelections input') as NodeListOf<HTMLInputElement>;
    let added = true;
    let word = wordText.value.trim();
    const subCase = booleanToNumber(substitutionCase.checked);
    const sub = numberToBoolean(subCase) ? substitutionText.value.trim() : substitutionText.value.trim().toLowerCase();
    const matchMethod = this.Class.Constants.MATCH_METHODS[selectedMatchMethod.value];

    if (matchMethod !== this.Class.Constants.MATCH_METHODS.REGEX) {
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
        case: subCase,
        lists: lists,
        matchMethod: matchMethod,
        repeat: booleanToNumber(wordMatchRepeated.checked),
        separators: booleanToNumber(wordMatchSeparators.checked),
        sub: sub,
      };

      // Check for endless substitution loop
      if (wordOptions.matchMethod != this.Class.Constants.MATCH_METHODS.REGEX) {
        const subFilter = new this.Class.Filter;
        const words = {};
        words[word] = wordOptions;
        subFilter.cfg = new this.Class.Config(Object.assign({}, this.cfg, { filterMethod: this.Class.Constants.FILTER_METHODS.SUBSTITUTE }, { words: words }));
        subFilter.init();
        const first = subFilter.replaceTextResult(word, this.Class.Constants.ALL_WORDS_WORDLIST_ID, null);
        const second = subFilter.replaceTextResult(first.filtered, this.Class.Constants.ALL_WORDS_WORDLIST_ID, null);
        if (first.filtered != second.filtered) {
          OptionPage.showInputError(substitutionText, "Substitution can't contain word (causes an endless loop).");
          return false;
        }
      }

      // Test for a valid Regex
      if (wordOptions.matchMethod === this.Class.Constants.MATCH_METHODS.REGEX) {
        const subFilter = new this.Class.Filter;
        const words = {};
        words[word] = wordOptions;
        subFilter.cfg = new this.Class.Config(Object.assign({}, this.cfg, { words: words }));
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
          await this.saveOptions();
          // Update states and Reset word form
          this.filter.rebuildWordlists();
          this.populateOptions();
        } catch (err) {
          logger.warn(`Failed to update word '${word}'.`, err);
          OptionPage.showErrorModal([`Failed to update word '${word}'.`, `Error: ${err.message}`]);
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

  async selectFilterMethod(filterMethodInput: HTMLInputElement) {
    this.cfg.filterMethod = this.Class.Constants.FILTER_METHODS[filterMethodInput.value];
    try {
      await this.cfg.save('filterMethod');
      this.filter.rebuildWordlists();
      this.populateOptions();
    } catch (err) {
      OptionPage.handleError('Failed to set filter method.', err);
    }
  }

  async setDefaultWordlist(element: HTMLSelectElement) {
    const prop = this.wordlistTypeFromElement(element);
    this.cfg[prop] = element.selectedIndex;

    try {
      await this.cfg.save(prop);
      this.populateOptions();
    } catch (err) {
      OptionPage.showErrorModal('Failed to update defult wordlist.', err);
    }
  }

  setHelpVersion() {
    const helpVersion = document.getElementById('helpVersion') as HTMLAnchorElement;
    helpVersion.textContent = this.Class.Config.BUILD.version;
  }

  setThemeButton(darkTheme: boolean) {
    if (darkTheme) {
      this.darkModeButton.classList.add('w3-hide');
      this.lightModeButton.classList.remove('w3-hide');
    } else {
      this.darkModeButton.classList.remove('w3-hide');
      this.lightModeButton.classList.add('w3-hide');
    }
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

    tableContainer.querySelectorAll('th input.wordlistHeader').forEach((el) => {
      el.addEventListener('click', (evt) => { this.bulkEditorWordlistCheckbox(evt.target as HTMLInputElement); });
    });
    OptionPage.openModal(modalId);
  }

  async statsReset() {
    try {
      await this.Class.Config.removeLocalStorage('stats');
      this.populateStats();
    } catch (err) {
      logger.warn('Failed to reset stats.', err);
      OptionPage.showErrorModal(['Failed to reset stats.', `Error: ${err.message}`]);
    }
  }

  switchPage(newTab: HTMLAnchorElement) {
    const currentTab = document.querySelector(`#menu a.${OptionPage.activeClass}`) as HTMLElement;

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
    if (this.cfg.darkMode == null) {
      this.cfg.darkMode = !this.prefersDarkScheme;
    } else {
      this.cfg.darkMode = !this.cfg.darkMode;
    }
    const useDeviceTheme = document.getElementById('useDeviceTheme') as HTMLInputElement;
    useDeviceTheme.checked = this.cfg.darkMode == null;

    await this.cfg.save('darkMode');
    this.applyTheme();
  }

  totalFilteredWordStat(wordStats) {
    return wordStats ? wordStats.text : 0;
  }

  async updateContextMenu(input: HTMLInputElement) {
    this.cfg.contextMenu = input.checked;
    await this.cfg.save('contextMenu');
    const message: Message = {
      destination: this.Class.Constants.MESSAGING.BACKGROUND,
      source: this.Class.Constants.MESSAGING.OPTION,
      updateContextMenus: this.cfg.contextMenu,
    };
    chrome.runtime.sendMessage(message);
  }

  updateFilterOptions() {
    // Show/hide options as needed
    switch (this.cfg.filterMethod) {
      case this.Class.Constants.FILTER_METHODS.CENSOR:
        OptionPage.show(document.getElementById('censorSettings'));
        OptionPage.hide(document.getElementById('substitutionSettings'));
        OptionPage.hide(document.getElementById('wordSubstitution'));
        break;
      case this.Class.Constants.FILTER_METHODS.SUBSTITUTE:
        OptionPage.hide(document.getElementById('censorSettings'));
        OptionPage.show(document.getElementById('substitutionSettings'));
        OptionPage.show(document.getElementById('wordSubstitution'));
        break;
      case this.Class.Constants.FILTER_METHODS.OFF:
      case this.Class.Constants.FILTER_METHODS.REMOVE:
        OptionPage.hide(document.getElementById('censorSettings'));
        OptionPage.hide(document.getElementById('substitutionSettings'));
        OptionPage.hide(document.getElementById('wordSubstitution'));
        break;
    }
  }

  updateOptionsFromPage() {
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
    const substitutionMark = document.getElementById('substitutionMark') as HTMLInputElement;
    const defaultWordSubstitution = document.getElementById('defaultWordSubstitutionText') as HTMLInputElement;
    const domainMode = document.querySelector('input[name="domainMode"]:checked') as HTMLInputElement;
    const domainFilterAllFrames = document.getElementById('domainFilterAllFrames') as HTMLInputElement;
    const wordlistsEnabledInput = document.getElementById('wordlistsEnabled') as HTMLInputElement;
    const collectStats = document.getElementById('collectStats') as HTMLInputElement;
    const configLoggingLevelSelect = document.getElementById('configLoggingLevelSelect') as HTMLSelectElement;
    this.cfg.censorCharacter = censorCharacterSelect.value;
    this.cfg.censorFixedLength = censorFixedLengthSelect.selectedIndex;
    this.cfg.defaultWordMatchMethod = defaultWordMatchMethodSelect.selectedIndex;
    this.cfg.defaultWordRepeat = booleanToNumber(defaultWordRepeat.checked);
    this.cfg.defaultWordSeparators = booleanToNumber(defaultWordSeparators.checked);
    this.cfg.preserveCase = preserveCase.checked;
    this.cfg.preserveFirst = preserveFirst.checked;
    this.cfg.preserveLast = preserveLast.checked;
    this.cfg.showCounter = showCounter.checked;
    this.cfg.showSummary = showSummary.checked;
    this.cfg.showUpdateNotification = showUpdateNotification.checked;
    this.cfg.substitutionMark = substitutionMark.checked;
    this.cfg.defaultSubstitution = defaultWordSubstitution.value.trim().toLowerCase();
    this.cfg.enabledDomainsOnly = (domainMode.value === 'minimal');
    this.cfg.enabledFramesOnly = !domainFilterAllFrames.checked;
    this.cfg.wordlistsEnabled = wordlistsEnabledInput.checked;
    this.cfg.collectStats = collectStats.checked;
    this.cfg.loggingLevel = this.Class.Constants.LOGGING_LEVELS[configLoggingLevelSelect.value.toUpperCase()];
  }

  async updateUseSystemTheme(useDeviceThemeInput: HTMLInputElement) {
    try {
      this.cfg.darkMode = useDeviceThemeInput.checked ? null : this.prefersDarkScheme;
      await this.cfg.save('darkMode');
      this.applyTheme(true);
    } catch (err) {
      OptionPage.handleError('Failed to update theme selection.', err);
    }
  }

  validateLessUsedWordsNumber() {
    const lessUsedWordsNumber = document.getElementById('lessUsedWordsNumber') as HTMLInputElement;
    let valid = false;
    OptionPage.hideInputError(lessUsedWordsNumber);
    if (lessUsedWordsNumber.value.match(/^\d+$/) && parseInt(lessUsedWordsNumber.value) > 0) {
      valid = true;
    } else {
      OptionPage.showInputError(lessUsedWordsNumber, 'Enter a positive whole number.');
    }

    return valid;
  }

  wordlistTypeFromElement(element: HTMLSelectElement) {
    if (element.id === 'textWordlistSelect') return 'wordlistId';
  }
}
