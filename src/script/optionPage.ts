import Constants from '@APF/lib/constants';
import WebConfig from '@APF/webConfig';
import Filter from '@APF/lib/filter';
import Domain from '@APF/domain';
import OptionAuth from '@APF/optionAuth';
import DataMigration from '@APF/dataMigration';
import Bookmarklet from '@APF/bookmarklet';
import Logger from '@APF/lib/logger';
import Translation from '@APF/translation';
import {
  booleanToNumber,
  deepCloneJson,
  dynamicList,
  exportToFile,
  lastElement,
  numberToBoolean,
  numberWithCommas,
  readFile,
  removeChildren,
  removeFromArray,
  stringArray,
  timeForFileName,
  upperCaseFirst,
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
  t: typeof Translation.prototype.t;
  themeElements: Element[];
  translation: Translation;

  //#region Class reference helpers
  // Can be overridden in children classes
  static get Bookmarklet() { return Bookmarklet; }
  static get Config() { return WebConfig; }
  static get Constants() { return Constants; }
  static get DataMigration() { return DataMigration; }
  static get Domain() { return Domain; }
  static get Filter() { return Filter; }
  static get OptionAuth() { return OptionAuth; }
  static get Translation() { return Translation; }
  get Class() { return (this.constructor as typeof OptionPage); }
  //#endregion

  static readonly activeClass = 'w3-flat-belize-hole';
  static readonly themeElementSelectors = [
    'body',
    'div#page',
    'div.w3-modal',
  ];

  constructor() {
    this._confirmEventListeners = [];
    this.darkModeButton = document.querySelector('div.themes > div.moon');
    this.lightModeButton = document.querySelector('div.themes > div.sun');
    this.themeElements = this.Class.themeElementSelectors.map((selector) => {
      return Array.from(document.querySelectorAll(selector));
    }).flat();
    this.prefersDarkScheme = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
    this.setHelpVersion();
    this.filter = new this.Class.Filter;
    this.translation = new this.Class.Translation;
    this.t = this.translation.t;
    this.applyTranslation();
  }

  applyDarkTheme(allElements = true) {
    document.documentElement.style.setProperty('color-scheme', 'dark');
    const statsWordTable = document.getElementById('statsWordTable') as HTMLTableElement;
    const bulkWordEditorTable = document.getElementById('bulkWordEditorTable') as HTMLTableElement;
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
    const statsWordTable = document.getElementById('statsWordTable') as HTMLTableElement;
    const bulkWordEditorTable = document.getElementById('bulkWordEditorTable') as HTMLTableElement;
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


  applyTranslation() {
    // Page and Header
    document.getElementById('headTitle').textContent = this.t('common:appName');
    document.getElementById('title').textContent = this.t('common:appName');
    // Tabs
    document.getElementById('bookmarkletTab').textContent = this.t('options:bookmarkletTab');
    document.getElementById('configTab').textContent = this.t('options:configTab');
    document.getElementById('domainsTab').textContent = this.t('options:domainsTab');
    document.getElementById('helpTab').textContent = this.t('options:helpTab');
    document.getElementById('listsTab').textContent = this.t('options:listsTab');
    document.getElementById('settingsTab').textContent = this.t('options:settingsTab');
    document.getElementById('statsTab').textContent = this.t('options:statsTab');
    document.getElementById('testTab').textContent = this.t('options:testTab');
    document.getElementById('wordsTab').textContent = this.t('options:wordsTab');
    // Settings page
    document.getElementById('censorCharacterName').textContent = this.t('options:censorCharacter');
    document.getElementById('censorFixedLengthName').textContent = this.t('options:censorFixedLength');
    document.getElementById('censorFixedLengthOriginal').textContent = this.t('options:censorFixedLengthOriginal');
    document.getElementById('censorSettingsHeader').textContent = this.t('options:censorSettingsHeader');
    document.getElementById('defaultSettingsHeader').textContent = this.t('options:defaultSettingsHeader');
    document.getElementById('defaultSubstitutionName').textContent = this.t('options:substitutionDefaultSubstitution');
    document.getElementById('defaultWordMatchMethodExact').textContent = this.t('options:matchMethodExact');
    document.getElementById('defaultWordMatchMethodName').textContent = this.t('options:defaultWordMatchMethod');
    document.getElementById('defaultWordMatchMethodPartial').textContent = this.t('options:matchMethodPartial');
    document.getElementById('defaultWordMatchMethodWhole').textContent = this.t('options:matchMethodWhole');
    document.getElementById('defaultWordMatchRepeatedName').textContent = this.t('options:defaultWordMatchRepeated');
    document.getElementById('defaultWordMatchRepeatedNote').textContent = this.t('options:defaultWordMatchRepeatedNote');
    document.getElementById('defaultWordMatchSeparatorsName').textContent = this.t('options:defaultWordMatchSeparators');
    document.getElementById('defaultWordMatchSeparatorsNote').textContent = this.t('options:defaultWordMatchSeparatorsNote');
    document.getElementById('filterCensorName').textContent = this.t('common:filterMethodCensor');
    document.getElementById('filterMethodCensorNote').textContent = this.t('options:filterMethodCensorNote');
    document.getElementById('filterMethodHeader').textContent = this.t('options:filterMethodHeader');
    document.getElementById('filterMethodOffNote').textContent = this.t('options:filterMethodOffNote');
    document.getElementById('filterMethodRemoveNote').textContent = this.t('options:filterMethodRemoveNote');
    document.getElementById('filterMethodSubstituteNote').textContent = this.t('options:filterMethodSubstituteNote');
    document.getElementById('filterOffName').textContent = this.t('common:filterMethodOff');
    document.getElementById('filterRemoveName').textContent = this.t('common:filterMethodRemove');
    document.getElementById('filterSubstituteName').textContent = this.t('common:filterMethodSubstitute');
    document.getElementById('generalSettingsHeader').textContent = this.t('options:generalSettingsHeader');
    document.getElementById('preserveFirstName').textContent = this.t('options:censorPreserveFirst');
    document.getElementById('preserveFirstNote').textContent = this.t('options:censorPreserveFirstNote');
    document.getElementById('preserveLastName').textContent = this.t('options:censorPreserveLast');
    document.getElementById('preserveLastNote').textContent = this.t('options:censorPreserveLastNote');
    document.getElementById('showContextMenuName').textContent = this.t('options:showContextMenu');
    document.getElementById('showContextMenuNote').textContent = this.t('options:showContextMenuNote');
    document.getElementById('showCounterName').textContent = this.t('options:showCounter');
    document.getElementById('showCounterNote').textContent = this.t('options:showCounterNote');
    document.getElementById('showSummaryName').textContent = this.t('options:showSummary');
    document.getElementById('showSummaryNote').textContent = this.t('options:showSummaryNote');
    document.getElementById('showUpdateNotificationName').textContent = this.t('options:showContextMenuNote');
    document.getElementById('substitutionMarkName').textContent = this.t('options:substitutionMark');
    document.getElementById('substitutionMarkNote').textContent = this.t('options:substitutionMarkNote');
    document.getElementById('substitutionPreserveCaseName').textContent = this.t('options:substitutionPreserveCase');
    document.getElementById('substitutionPreserveCaseNote').textContent = this.t('options:substitutionPreserveCaseNote');
    document.getElementById('substitutionSettingsHeader').textContent = this.t('options:substitutionSettingsHeader');
    document.getElementById('useDeviceThemeName').textContent = this.t('options:useDeviceTheme');
    document.getElementById('useDeviceThemeNote').textContent = this.t('options:useDeviceThemeNote');
    // Words page
    document.getElementById('bulkWordEditorButton').textContent = this.t('options:wordBulkEditorButton');
    document.getElementById('filterWordListName').textContent = this.t('options:filterWordList');
    document.getElementById('includeInWordlistsHeader').textContent = this.t('options:includeInWordlistsHeader');
    document.getElementById('wordCaseSensitive').textContent = this.t('options:wordCaseSensitive');
    document.getElementById('wordMatchExactName').textContent = this.t('options:matchMethodExact');
    document.getElementById('wordMatchExactNote').textContent = this.t('options:wordMatchExactNote');
    document.getElementById('wordMatchMethodHeader').textContent = this.t('options:wordMatchMethodHeader');
    document.getElementById('wordMatchPartialName').textContent = this.t('options:matchMethodPartial');
    document.getElementById('wordMatchPartialNote').textContent = this.t('options:wordMatchPartialNote');
    document.getElementById('wordMatchRegexName').textContent = this.t('options:matchMethodRegex');
    document.getElementById('wordMatchRegexNote').textContent = this.t('options:wordMatchRegexNote');
    document.getElementById('wordMatchRepeatedName').textContent = this.t('options:wordMatchRepeated');
    document.getElementById('wordMatchRepeatedNote').textContent = this.t('options:wordMatchRepeatedNote');
    document.getElementById('wordMatchSeparatorsName').textContent = this.t('options:wordMatchSeparators');
    document.getElementById('wordMatchSeparatorsNote').textContent = this.t('options:wordMatchSeparatorsNote');
    document.getElementById('wordMatchWholeName').textContent = this.t('options:matchMethodWhole');
    document.getElementById('wordMatchWholeNote').textContent = this.t('options:wordMatchWholeNote');
    document.getElementById('wordOtherHeader').textContent = this.t('options:wordOtherHeader');
    document.getElementById('wordPhraseHeader').textContent = this.t('options:wordPhraseHeader');
    document.getElementById('wordRemove').textContent = this.t('common:removeButton');
    document.getElementById('wordRemoveAll').textContent = this.t('common:removeAllButton');
    document.getElementById('wordSave').textContent = this.t('common:saveButton');
    document.getElementById('wordsHeader').textContent = this.t('options:wordsAndPhrasesHeader');
    document.getElementById('wordSubstitutionHeader').textContent = this.t('options:wordSubstitutionHeader');
    // Lists page
    document.getElementById('allowlistHeader').textContent = this.t('options:allowlistHeader');
    document.getElementById('allowlistInsensitiveName').textContent = this.t('options:allowlistInsensitive');
    document.getElementById('allowlistInsensitiveNote').textContent = this.t('options:allowlistInsensitiveNote');
    document.getElementById('allowlistNote').textContent = this.t('options:allowlistNote');
    document.getElementById('allowlistRemove').textContent = this.t('common:removeButton');
    document.getElementById('allowlistSave').textContent = this.t('common:saveButton');
    document.getElementById('allowlistSensitiveName').textContent = this.t('options:allowlistSensitive');
    document.getElementById('allowlistSensitiveNote').textContent = this.t('options:allowlistSensitiveNote');
    document.getElementById('defaultTextWordlistHeader').textContent = this.t('options:defaultTextWordlistHeader');
    document.getElementById('listWordPhraseHeader').textContent = this.t('options:wordPhraseHeader');
    document.getElementById('wordlistNameHeader').textContent = this.t('options:wordlistNameHeader');
    document.getElementById('wordlistRename').textContent = this.t('common:renameButton');
    document.getElementById('wordlistsHeader').textContent = this.t('common:wordlists');
    // Domains page
    document.getElementById('domainDisabledName').textContent = this.t('options:domainDisabled');
    document.getElementById('domainDisabledName').textContent = this.t('options:domainDisabled');
    document.getElementById('domainDisabledNote').textContent = this.t('options:domainDisabledNote');
    document.getElementById('domainDisabledNote').textContent = this.t('options:domainDisabledNote');
    document.getElementById('domainEnabledName').textContent = this.t('options:domainEnabled');
    document.getElementById('domainEnabledNote').textContent = this.t('options:domainEnabledNote');
    document.getElementById('domainFilterAllFramesName').textContent = this.t('options:domainFilterAllFramesName');
    document.getElementById('domainFilterAllFramesNote').textContent = this.t('options:domainFilterAllFramesNote');
    document.getElementById('domainFrameModeHeader').textContent = this.t('options:domainFrameModeHeader');
    document.getElementById('domainFramesDisabledName').textContent = this.t('options:domainFramesDisabled');
    document.getElementById('domainFramesDisabledNote').textContent = this.t('options:domainFramesDisabledNote');
    document.getElementById('domainFramesEnabledName').textContent = this.t('options:domainFramesEnabled');
    document.getElementById('domainFramesEnabledNote').textContent = this.t('options:domainFramesEnabledNote');
    document.getElementById('domainHeader').textContent = this.t('options:domainHeader');
    document.getElementById('domainMatchModeHeader').textContent = this.t('options:domainMatchModeHeader');
    document.getElementById('domainMatchModeMinimalName').textContent = this.t('options:domainMatchModeMinimal');
    document.getElementById('domainMatchModeMinimalNote').textContent = this.t('options:domainMatchModeMinimalNote');
    document.getElementById('domainMatchModeNormalName').textContent = this.t('options:domainMatchModeNormal');
    document.getElementById('domainMatchModeNormalNote').textContent = this.t('options:domainMatchModeNormalNote');
    document.getElementById('domainModeAdvanced').textContent = this.t('common:domainModeAdvanced');
    document.getElementById('domainModeDeep').textContent = this.t('common:domainModeDeep');
    document.getElementById('domainModeHeader').textContent = this.t('options:domainModeHeader');
    document.getElementById('domainModeNormal').textContent = this.t('common:domainModeNormal');
    document.getElementById('domainRemove').textContent = this.t('common:removeButton');
    document.getElementById('domainSave').textContent = this.t('common:saveButton');
    document.getElementById('domainsHeader').textContent = this.t('options:domainsHeader');
    document.getElementById('domainTextNote').textContent = this.t('options:domainNote');
    document.getElementById('domainTextWordlistHeader').textContent = this.t('options:domainTextWordlistHeader');
    // Bookmarklet page
    document.getElementById('bookmarkletButtonNote').textContent = this.t('options:bookmarkletButtonNote');
    document.getElementById('bookmarkletExplanation').textContent = this.t('options:bookmarkletExplanation');
    document.getElementById('bookmarkletHeader').textContent = this.t('options:bookmarkletHeader');
    document.getElementById('bookmarkletLearnMore').textContent = this.t('options:bookmarkletLearnMore');
    document.getElementById('bookmarkletLink').textContent = this.t('common:appShortName');
    document.getElementById('bookmarkletUseDefaultConfig').textContent = this.t('options:bookmarkletUseDefaultConfig');
    document.getElementById('bookmarkletUseMyConfig').textContent = this.t('options:bookmarkletUseMyConfig');
    // Config page
    document.getElementById('configExport').textContent = this.t('common:exportButton');
    document.getElementById('configHeader').textContent = this.t('options:configHeader');
    document.getElementById('configImport').textContent = this.t('common:importButton');
    document.getElementById('configInlineEditorName').textContent = this.t('options:configInlineEditor');
    document.getElementById('configLoggingLevelDebug').textContent = this.t('common:logLevelDebug');
    document.getElementById('configLoggingLevelError').textContent = this.t('common:logLevelError');
    document.getElementById('configLoggingLevelHeader').textContent = this.t('options:configLoggingLevelHeader');
    document.getElementById('configLoggingLevelInfo').textContent = this.t('common:logLevelInfo');
    document.getElementById('configLoggingLevelWarn').textContent = this.t('common:logLevelWarn');
    document.getElementById('configPasswordHeader').textContent = this.t('options:configPasswordHeader');
    document.getElementById('configReset').textContent = this.t('common:restoreDefaultsButton');
    document.getElementById('configStorageHeader').textContent = this.t('options:configStorageHeader');
    document.getElementById('configSyncLargeSettingsName').textContent = this.t('options:configSyncLargeSettings');
    document.getElementById('configSyncLargeSettingsNote').textContent = this.t('options:configSyncLargeSettingsNote');
    // Stats page
    document.getElementById('collectStatsName').textContent = this.t('options:collectStats');
    document.getElementById('collectStatsNote').textContent = this.t('options:collectStatsNote');
    document.getElementById('removeLessUsedWords').textContent = this.t('options:statsRemoveLessUsedWordsButton');
    document.getElementById('statsExport').textContent = this.t('common:exportButton');
    document.getElementById('statsFilteredSummaryTotal').textContent = this.t('options:statsFilteredSummaryTotal');
    document.getElementById('statsFilteredSummaryWord').textContent = this.t('options:statsFilteredSummaryWord');
    document.getElementById('statsHeader').textContent = this.t('options:statsHeader');
    document.getElementById('statsImport').textContent = this.t('common:importButton');
    document.getElementById('statsRemoveLessUsedWordsExplanation').textContent = this.t('options:statsRemoveLessUsedWordsExplanation');
    document.getElementById('statsReset').textContent = this.t('common:resetButton');
    document.getElementById('statsSummaryHeader').textContent = this.t('options:statsSummaryHeader');
    document.getElementById('statsTotalFilteredName').textContent = this.t('options:statsSummaryTotalWordsFiltered');
    document.getElementById('statsTrackingSinceName').textContent = this.t('options:statsSummaryTrackingSince');
    document.getElementById('statsWordsFilteredHeader').textContent = this.t('options:statsWordsFilteredHeader');
    // Test page
    document.getElementById('testFilteredHeader').textContent = this.t('options:testFilteredHeader');
    document.getElementById('testHeader').textContent = this.t('options:testHeader');
    // Modals
    // Word Bulk Editor
    (document.getElementById('bulkAddWordsText') as HTMLTextAreaElement).placeholder = this.t('options:bulkWordEditorBoxPlaceholder');
    document.getElementById('bulkEditorAddWord').textContent = this.t('options:bulkWordEditorAddWordButton');
    document.getElementById('bulkEditorAddWords').textContent = this.t('options:bulkWordEditorAddWordsButton');
    document.getElementById('bulkEditorCancel').textContent = this.t('common:cancelButton');
    document.getElementById('bulkEditorSave').textContent = this.t('common:saveButton');
    document.getElementById('bulkWordEditorMatchMethodHeader').textContent = this.t('options:bulkWordEditorMatchMethodHeader');
    document.getElementById('bulkWordEditorRemoveAllHeader').textContent = this.t('options:bulkWordEditorRemoveAllHeader');
    document.getElementById('bulkWordEditorRepeatedHeader').textContent = this.t('options:bulkWordEditorRepeatedHeader');
    document.getElementById('bulkWordEditorSeparatorsHeader').textContent = this.t('options:bulkWordEditorSeparatorsHeader');
    document.getElementById('bulkWordEditorSubstitutionCaseHeader').textContent = this.t('options:bulkWordEditorSubstitutionCaseHeader');
    document.getElementById('bulkWordEditorSubstitutionHeader').textContent = this.t('options:bulkWordEditorSubstitutionHeader');
    document.getElementById('bulkWordEditorTitle').textContent = this.t('options:bulkWordEditorTitle');
    document.getElementById('bulkWordEditorWordHeader').textContent = this.t('options:bulkWordEditorWordHeader');
    // Confirm
    document.getElementById('confirmModalBackup').textContent = this.t('common:backupButton');
    document.getElementById('confirmModalCancel').textContent = this.t('common:cancelButton');
    document.getElementById('confirmModalOK').textContent = this.t('common:okButton');
    // Password
    document.getElementById('passwordModalHeader').textContent = this.t('options:passwordModalHeader');
    document.getElementById('submitPassword').textContent = this.t('options:submitButton');
    // Status
    document.getElementById('statusModalOK').textContent = this.t('common:okButton');
  }

  backupConfig(config = this.cfg.ordered(), filePrefix = 'apf-backup') {
    exportToFile(JSON.stringify(config, null, 2), `${filePrefix}-${timeForFileName()}.json`);
  }

  backupConfigInline(config = this.cfg.ordered()) {
    const configText = document.getElementById('configText') as HTMLTextAreaElement;
    configText.value = JSON.stringify(config, null, 2);
  }

  get bookmarkletConfig() {
    const clone = deepCloneJson(this.cfg);
    const keysToRemove = [...this.cfg.Class._localOnlyKeys];
    Object.keys(clone).forEach((key) => {
      if (keysToRemove.includes(key)) delete clone[key];
    });
    return clone;
  }

  bulkEditorAddRow(word: string = '', data: WordOptions | undefined = undefined) {
    const table = document.getElementById('bulkWordEditorTable') as HTMLTableElement;
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
    const bulkAddWordsText = document.getElementById('bulkAddWordsText') as HTMLTextAreaElement;
    const text = bulkAddWordsText.value;
    if (text != '') {
      const table = document.getElementById('bulkWordEditorTable') as HTMLTableElement;
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
    const table = document.getElementById('bulkWordEditorTable') as HTMLTableElement;
    const row = button.parentElement.parentElement as HTMLTableRowElement;
    table.deleteRow(row.rowIndex);
    if (table.rows.length == 1) {
      // Add a new row if that was the last row (ignoring header)
      this.bulkEditorAddRow();
    }
  }

  async bulkEditorSave() {
    const table = document.getElementById('bulkWordEditorTable') as HTMLTableElement;
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
      this.closeModal('bulkWordEditorModal');
      this.showStatusModal(this.t('bulkWordEditorSavedStatusMessage'));
      this.filter.rebuildWordlists();
      this.populateOptions();
    } catch (err) {
      if (this.isStorageError(err) && this.cfg.syncLargeKeys) {
        this.confirm('bulkEditorSaveRetry');
      } else {
        logger.warn(this.t('bulkWordEditorFailedMessage'), err);
        this.showErrorModal([this.t('bulkWordEditorFailedMessage'), `Error: ${err.message}`]);
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
      this.handleError(this.t('bulkWordEditorFailedMessage'), err);
    }
  }

  bulkEditorCurrentWords() {
    const table = document.getElementById('bulkWordEditorTable') as HTMLTableElement;
    const words = [];
    table.querySelectorAll('tr > td > input.bulkAddWordText').forEach((wordText: HTMLInputElement, index) => {
      words.push(wordText.value);
    });
    return words;
  }

  bulkEditorWordlistCheckbox(checkbox: HTMLInputElement) {
    const checked = checkbox.checked;
    document.querySelectorAll(`#bulkWordEditorModal table td input.wordlistData[data-col="${checkbox.dataset.col}"]`).forEach((box: HTMLInputElement) => {
      box.checked = checked;
    });
  }

  closeModal(id: string) {
    this.hide(document.getElementById(id));
  }

  configInlineToggle() {
    const input = document.getElementById('configInlineInput') as HTMLInputElement;
    const configText = document.getElementById('configText') as HTMLTextAreaElement;
    if (input.checked) {
      this.show(configText);
      this.exportConfig();
    } else {
      this.hide(configText);
      configText.value = '';
    }
  }

  configureConfirmModal(settings: ConfirmModalSettings = {}, contentElement?: HTMLElement) {
    const modalTitle = document.getElementById('confirmModalTitle') as HTMLElement;
    const modalContent = document.getElementById('confirmModalContent') as HTMLElement;
    const modalHeader = document.querySelector('#confirmModal header') as HTMLElement;
    const backupButtonContainer = document.querySelector('#confirmModal span.confirmBackupButton') as HTMLElement;
    const backupButton = document.querySelector('#confirmModal button#confirmModalBackup') as HTMLButtonElement;
    removeChildren(modalContent);

    const defaults = {
      backup: false,
      content: this.t('options:confirmModalDefaultContent'),
      title: this.t('options:confirmModalDefaultTitle'),
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
      this.show(backupButtonContainer);
      this.enableBtn(backupButton);
    } else {
      this.hide(backupButtonContainer);
      this.disableBtn(backupButton);
    }
  }

  configureStatusModal(content: string | string[], title: string, titleColor: string) {
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
        paragraph.textContent = this.t('options:confirmBulkWordEditorSaveMessage');
        italics.textContent = this.t('options:confirmBulkWordEditorSaveNoteMessage');
        content.appendChild(paragraph);
        content.appendChild(italics);
        this.configureConfirmModal({ backup: true }, content);
        this._confirmEventListeners.push(this.bulkEditorSave.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'bulkEditorSaveRetry':
        paragraph.textContent = this.t('options:confirmBulkWordEditorSaveRetryMessage');
        italics.textContent = this.t('options:confirmLocalStorageNoteMessage');
        content.appendChild(paragraph);
        content.appendChild(italics);
        this.configureConfirmModal({ backup: true, titleClass: 'w3-red' }, content);
        this._confirmEventListeners.push(this.bulkEditorSaveRetry.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'convertStorageLocation':
        if (this.cfg.syncLargeKeys) {
          paragraph.textContent = this.t('options:confirmConvertStorageToLocalMessage');
        } else {
          paragraph.textContent = this.t('options:confirmConvertStorageToSyncMessage');
        }
        italics.textContent = this.t('options:confirmConvertStorageNoteMessage');
        content.appendChild(paragraph);
        content.appendChild(italics);
        this.configureConfirmModal({ backup: true }, content);
        this._confirmEventListeners.push(this.populateConfig.bind(this));
        cancel.addEventListener('click', lastElement(this._confirmEventListeners));
        this._confirmEventListeners.push(this.convertStorageLocation.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'importConfig':
        this.configureConfirmModal({ content: this.t('options:confirmImportConfigMessage'), backup: true });
        this._confirmEventListeners.push(this.importConfig.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'importConfigRetry':
        paragraph.textContent = this.t('options:confirmImportConfigRetryMessage');
        italics.textContent = this.t('options:confirmLocalStorageNoteMessage');
        content.appendChild(paragraph);
        content.appendChild(italics);
        this.configureConfirmModal({ backup: false, titleClass: 'w3-red' }, content);
        this._confirmEventListeners.push(this.importConfigRetryCancel.bind(this));
        cancel.addEventListener('click', lastElement(this._confirmEventListeners));
        this._confirmEventListeners.push(this.importConfigRetry.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'removeAllWords':
        paragraph.textContent = this.t('options:confirmRemoveAllWordsMessage');
        content.appendChild(paragraph);
        this.configureConfirmModal({ backup: true }, content);
        this._confirmEventListeners.push(this.removeAllWords.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'removeLessUsedWords':
        validated = this.validateLessUsedWordsNumber();
        if (validated) {
          await this.prepareLessUsedWords();
          const count = Object.keys(this.lessUsedWords).length;
          if (count) {
            this.configureConfirmModal({
              backup: true,
              content: this.t('options:confirmRemoveLessUsedWordsMessage', { count: count }),
            });
            this._confirmEventListeners.push(this.removeLessUsedWords.bind(this));
            ok.addEventListener('click', lastElement(this._confirmEventListeners));
          } else {
            validated = false;
            this.showStatusModal(`
              ${this.t('options:confirmRemoveLessUsedWordsUnderMessage')}
              ${this.t('options:confirmRemoveLessUsedWordsUnderMessageNote')}
            `);
          }
        }
        break;
      case 'statsImport':
        this.configureConfirmModal({ content: this.t('options:confirmStatsImportMessage') });
        this._confirmEventListeners.push(this.importStats.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'statsReset':
        this.configureConfirmModal({ content: this.t('options:confirmStatsResetMessage') });
        this._confirmEventListeners.push(this.statsReset.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'restoreDefaults':
        this.configureConfirmModal({ content: this.t('options:confirmRestoreDefaultsMessage'), backup: true });
        this._confirmEventListeners.push(this.restoreDefaults.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'setPassword': {
        const passwordText = document.getElementById('setPassword') as HTMLInputElement;
        const passwordBtn = document.getElementById('setPasswordBtn') as HTMLInputElement;
        if (passwordBtn.classList.contains('disabled')) return false;

        const message = passwordText.value == ''
          ? this.t('options:confirmPasswordRemoveMessage')
          : this.t('options:confirmPasswordSetMessage', { password: passwordText.value })
        ;
        this.configureConfirmModal({ content: message });
        this._confirmEventListeners.push(this.auth.setPassword.bind(this.auth));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      }
    }

    if (validated) {
      this.openModal('confirmModal');
    }
  }

  confirmModalBackup() {
    const backupButton = document.querySelector('#confirmModal button#confirmModalBackup') as HTMLButtonElement;
    if (!backupButton.classList.contains('disabled')) {
      this.backupConfig();
      this.disableBtn(backupButton);
    }
  }

  async convertStorageLocation(evt: Event = null, silent = false) {
    const configSyncLargeKeys = document.getElementById('configSyncLargeKeys') as HTMLInputElement;
    this.cfg.syncLargeKeys = configSyncLargeKeys.checked;
    const keys = this.Class.Config._largeKeys.concat(['syncLargeKeys']);

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
          this.showStatusModal(this.t('options:storageConvertedMessage'));
        }
      } catch (err) {
        // Revert UI and export a backup of config.
        this.cfg.syncLargeKeys = !this.cfg.syncLargeKeys;
        this.backupConfig();
        this.handleError(this.t('options:storageConversionCleanupFailedMessage'), err);
        await this.cfg.save('syncLargeKeys');
        this.populateConfig();
      }
    } catch (err) {
      // Revert UI
      this.handleError(this.t('options:storageConversionFailedMessage'), err);
      this.cfg.syncLargeKeys = !this.cfg.syncLargeKeys;
      this.populateConfig();
    }
  }

  disableBtn(element: HTMLElement) {
    element.classList.add('disabled');
    element.classList.add('w3-flat-silver');
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

  enableBtn(element: HTMLElement) {
    element.classList.remove('disabled');
    element.classList.remove('w3-flat-silver');
  }

  exportConfig(config = this.cfg.ordered(), filePrefix = 'apf-backup') {
    const input = document.getElementById('configInlineInput') as HTMLInputElement;

    if (input.checked) {
      this.backupConfigInline(config);
    } else {
      this.backupConfig(config, filePrefix);
    }
  }

  async exportStats(filePrefix = 'apf-stats') {
    const stats = await this.getStatsFromStorage();
    exportToFile(JSON.stringify(stats, null, 2), `${filePrefix}-${timeForFileName()}.json`);
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
      this.showErrorModal([this.t('options:saveFailedMessage'), `Error: ${err.message}`]);
      return false;
    }
  }

  handleError(message: string, error?: Error) {
    if (error) {
      logger.error(message, error);
      this.showErrorModal([message, `Error: ${error.message}`]);
    } else {
      logger.error(message);
      this.showErrorModal([message]);
    }
  }

  hide(element: HTMLElement) {
    element.classList.remove('w3-show');
    element.classList.add('w3-hide');
  }

  hideInputError(element: HTMLInputElement) {
    element.classList.remove('w3-border-red');
    try {
      element.setCustomValidity('');
    } catch (err) {
      // If HTML5 validation not supported, the modal will suffice
    }
  }

  hideStatus() {
    const notificationPanel = document.getElementById('notificationPanel') as HTMLElement;
    this.hide(notificationPanel);
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

  async importConfigFile(input: HTMLInputElement, files: FileList) {
    const file = files[0];
    const fileText = await readFile(file) as string;
    this.importConfigText(fileText);
    input.value = '';
  }

  async importConfigRetry() {
    const configSyncLargeKeys = document.getElementById('configSyncLargeKeys') as HTMLInputElement;
    configSyncLargeKeys.checked = false;
    try {
      await this.convertStorageLocation(null, true);
      await this.cfg.save();
      this.showStatusModal(this.t('options:configImportedMessage'));
      await this.init();
    } catch (err) {
      this.handleError(this.t('options:configImportFailedMessage'), err);
    }
  }

  async importConfigRetryCancel() {
    await this.init();
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
          this.showStatusModal(this.t('options:configImportedMessage'));
          await this.init(true);
        } catch (err) {
          if (this.isStorageError(err) && this.cfg.syncLargeKeys) {
            this.confirm('importConfigRetry');
          } else {
            this.handleError(this.t('options:configImportFailedMessage'), err);
          }
        }
      }
    } catch (err) {
      this.showErrorModal([this.t('options:configImportFailedProcessingMessage'), `Error: ${err.message}`]);
    }
  }

  importStats() {
    const fileImportInput = document.getElementById('statsImportInput') as HTMLInputElement;
    fileImportInput.click();
  }

  async importStatsFile(input: HTMLInputElement, files: FileList) {
    const backupStats = await this.getStatsFromStorage();

    try {
      const file = files[0];
      const fileText = await readFile(file) as string;
      const stats = JSON.parse(fileText);
      if (!this.validStatsForImport(stats)) throw new Error(this.t('statsFileImportInvalidMessage'));
      await this.Class.Config.saveLocalStorage({ stats: stats });
      input.value = '';
      await this.populateStats();
    } catch (err) {
      await this.Class.Config.saveLocalStorage({ stats: backupStats });
      this.handleError(this.t('statsFileImportFailedMessage'), err);
    }
  }

  async init(refreshTheme = false) {
    await this.initializeCfg();
    logger.setLevel(this.cfg.loggingLevel);
    this.applyTheme(refreshTheme);
    if (!this.auth) this.auth = new this.Class.OptionAuth(this, this.cfg.password);
    this.filter.cfg = this.cfg;
    this.filter.init();

    // logger.debug(`Password: '${this.cfg.password}', Authenticated: ${this.auth.authenticated}`);
    if (this.cfg.password && !this.auth.authenticated) {
      this.openModal('passwordModal');
      document.getElementById('passwordInput').focus();
    } else {
      this.show(document.getElementById('main'));
    }

    if (this.shouldCreateBookmarklet) this.bookmarklet = await this.Class.Bookmarklet.create();
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

  isStorageError(error: Error): boolean {
    if (error.message) {
      const chromeQuotaError = '[QUOTA_BYTES quota exceeded]';
      const firefoxQuotaError = '[QuotaExceededError: storage.sync API call exceeded its quota limitations.]';
      return error.message.includes(chromeQuotaError) || error.message.includes(firefoxQuotaError);
    }

    return false;
  }

  newWordWordlistChecked(index: number): boolean {
    return index == (this.cfg.wordlistId - 1);
  }

  openModal(id: string) {
    this.show(document.getElementById(id));
  }

  populateBookmarkletPage() {
    if (!this.bookmarklet) return;

    const bookmarkletConfig = document.querySelector('input[name="bookmarkletConfig"]:checked') as HTMLInputElement;
    const bookmarkletLink = document.getElementById('bookmarkletLink') as HTMLAnchorElement;
    const cfg = bookmarkletConfig.value == 'default' ? null : this.bookmarkletConfig;
    const href = this.bookmarklet.href(cfg);
    bookmarkletLink.href = href;
    this.enableBtn(bookmarkletLink);
  }

  populateConfig() {
    const configSyncLargeKeys = document.getElementById('configSyncLargeKeys') as HTMLInputElement;
    const configLoggingLevelSelect = document.getElementById('configLoggingLevelSelect') as HTMLSelectElement;
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
      this.disableBtn(domainRemoveBtn);
      domainCfg = Object.assign({}, this.Class.Domain._domainCfgDefaults);
    } else { // Existing record
      this.enableBtn(domainRemoveBtn);
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
    const domainFilterAllFrames = document.getElementById('domainFilterAllFrames') as HTMLInputElement;
    const domainsSelect = document.getElementById('domainSelect') as HTMLSelectElement;
    const domainText = document.getElementById('domainText') as HTMLInputElement;
    const mode = this.cfg.enabledDomainsOnly ? 'minimal' : 'normal';
    const domainMatchMode = document.querySelector(`input[name=domainMatchMode][value='${mode}']`) as HTMLInputElement;
    const wordlistContainer = document.getElementById('domainWordlistContainer') as HTMLInputElement;
    domainMatchMode.checked = true;
    const domainDisabledLabel = document.getElementById('domainDisabledLabel') as HTMLLabelElement;
    const domainEnabledLabel = document.getElementById('domainEnabledLabel') as HTMLLabelElement;
    const domainFramesOffLabel = document.getElementById('domainFramesOffLabel') as HTMLLabelElement;
    const domainFramesOnLabel = document.getElementById('domainFramesOnLabel') as HTMLLabelElement;

    this.hideInputError(domainText);
    removeChildren(domainsSelect);

    const domains = this.Class.Domain.sortedKeys(this.cfg.domains);
    domains.unshift(this.t('options:addOrUpdateExistingOption'));
    domains.forEach((domain) => {
      const optionElement = document.createElement('option');
      optionElement.textContent = domain;
      optionElement.value = domain === domains[0] ? '' : domain;
      domainsSelect.appendChild(optionElement);
    });
    domainFilterAllFrames.checked = !this.cfg.enabledFramesOnly;

    if (mode === 'minimal') {
      this.hide(domainDisabledLabel);
      this.show(domainEnabledLabel);
    } else {
      this.hide(domainEnabledLabel);
      this.show(domainDisabledLabel);
    }

    if (this.cfg.enabledFramesOnly) {
      this.hide(domainFramesOffLabel);
      this.show(domainFramesOnLabel);
    } else {
      this.hide(domainFramesOnLabel);
      this.show(domainFramesOffLabel);
    }

    if (this.cfg.wordlistsEnabled) {
      this.show(wordlistContainer);
      const domainWordlistSelect = document.getElementById('domainWordlistSelect') as HTMLSelectElement;

      const wordlists = ['Default'].concat(this.Class.Config._allWordlists, this.cfg.wordlists);
      dynamicList(wordlists, domainWordlistSelect);
    } else {
      this.hide(wordlistContainer);
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

      const statsWordTable = document.getElementById('statsWordTable') as HTMLTableElement;

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
      logger.warn(this.t('options:statsFailedToPopulateMessage'), err);
      this.showErrorModal([this.t('options:statsFailedToPopulateMessage'), `Error: ${err.message}`]);
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
    const statsSummaryTotal = document.getElementById('statsSummaryTotal') as HTMLTableCellElement;
    statsSummaryTotal.textContent = numberWithCommas(totalFiltered);
    const statsSummarySince = document.getElementById('statsSummarySince') as HTMLTableCellElement;
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
      filteredTestText.textContent = this.t('options.testFilteredTextPlaceholder');
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
    list.unshift(this.t('options:addOrUpdateExistingOption'));
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
      this.disableBtn(allowlistRemove);

      // Default to case-insensitive
      const allowlistCase = document.getElementById('allowlistInsensitive') as HTMLInputElement;
      allowlistCase.checked = true;
    } else {
      allowlistText.value = selected.value;
      const caseId = selected.dataset.sensitive === 'true' ? 'allowlistSensitive' : 'allowlistInsensitive';
      const allowlistCase = document.getElementById(caseId) as HTMLInputElement;
      allowlistCase.checked = true;
      this.enableBtn(allowlistRemove);
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
    this.hideInputError(wordText);
    this.hideInputError(substitutionText);

    if (word == '') { // New word
      wordText.value = '';
      this.disableBtn(wordRemove);
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
      this.enableBtn(wordRemove);
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
      this.show(wordWordlistDiv);
    } else {
      this.hide(wordWordlistDiv);
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

      this.show(wordlistContainer);
      this.populateWordlist();
    } else {
      this.hide(wordlistContainer);
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
    words.unshift(this.t('options:addOrUpdateExistingOption'));
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
      logger.warn(this.t('options:statsLessUsedWordsErrorMessage'), err);
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
        logger.warn(this.t('options:domainRemoveFailedMessage', { domain: domainsSelect.value }), err);
        this.showErrorModal([this.t('options:domainRemoveFailedMessage', { domain: domainsSelect.value }), `Error: ${err.message}`]);
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
      logger.warn(this.t('options:allowlistRemoveFailedMessage', { word: originalWord }), err);
      this.showErrorModal([this.t('options:allowlistRemoveFailedMessage', { word: originalWord }), `Error: ${err.message}`]);
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
        logger.warn(this.t('options:wordRemoveFailedMessage', { word: word }), err);
        this.showErrorModal([this.t('options:wordRemoveFailedMessage', { word: word }), `Error: ${err.message}`]);
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
        this.showInputError(wordlistText, this.t('options:wordlistRenameDuplicate'));
        return false;
      }

      this.cfg.wordlists[index] = name;
      try {
        await this.cfg.save('wordlists');
        this.populateWordlists(index);
        this.populateWordPage();
      } catch (err) {
        this.handleError(this.t('options:wordlistSaveFailedMessage'), err);
      }
    } else {
      this.showInputError(wordlistText, this.t('options:wordlistRenameInvalidMessage'));
    }
  }

  async restoreDefaults(evt: Event = null, silent = false) {
    try {
      await this.cfg.resetPreserveStats();
      if (!silent) this.showStatusModal(this.t('options:configDefaultsRestoredMessage'));
      await this.init(true);
      return true;
    } catch (err) {
      logger.warn(this.t('options:configDefaultsFailedMessage'), err);
      this.showErrorModal([this.t('options:configDefaultsFailedMessage'), `Error: ${err.message}`]);
      return false;
    }
  }

  async saveDomain() {
    const domainText = document.getElementById('domainText') as HTMLInputElement;
    const newKey = domainText.value.trim().toLowerCase();

    if (newKey == '') { // No data
      this.showInputError(domainText, this.t('options:domainSaveEmptyMessage'));
      return false;
    }

    if (domainText.checkValidity()) {
      this.hideInputError(domainText);
      const domainCfg = this.domainCfgFromPage();
      if (!domainCfg) {
        this.showInputError(this.t('options:domainSaveFailedGettingSettingsMessage'));
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
        this.showErrorModal([this.t('options:saveFailedMessage'), `Error: ${err.message}`]);
        return false;
      }
    } else {
      this.showInputError(domainText, this.t('options:domainSaveExample'));
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
      logger.warn(this.t('options:saveOptionsFailedMessage'), err);
      this.showErrorModal([this.t('options:saveOptionsFailedMessage'), `Error: ${err.message}`]);
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
      this.showInputError(allowlistText, this.t('options:wordPhraseInvalidMessage'));
      return false;
    }

    if (this.cfg[newListName].indexOf(newWord) > -1) {
      this.showInputError(allowlistText, this.t('options:saveAllowlistDuplicateMessage'));
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
          logger.warn(this.t('options:saveAllowlistFailedMessage'), err);
          this.showErrorModal([this.t('options:saveAllowlistFailedMessage'), `Error: ${err.message}`]);
          return false;
        }
      }
    } else {
      this.showInputError(allowlistText, this.t('options:wordPhraseInvalidMessage'));
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
      this.showInputError(wordText, this.t('options:wordPhraseInvalidMessage'));
      return false;
    }

    // Make sure word and substitution are different
    if (word == sub) {
      this.showInputError(substitutionText, this.t('options:saveWordSubstitutionCollisionMessage'));
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
          this.showInputError(substitutionText, this.t('options:saveWordSubstitutionEmbeddedMessage'));
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
          this.showInputError(wordText, this.t('options:saveWordRegexInvalidMessage'));
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
            this.showInputError(wordText, this.t('options:saveWordDuplicateMessage', { word: word }));
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
          logger.warn(this.t('options:saveWordUpdateFailedMessage', { word: word }), err);
          this.showErrorModal([this.t('options:saveWordUpdateFailedMessage', { word: word }), `Error: ${err.message}`]);
          this.cfg.removeWord(word);
          return false;
        }
      } else {
        this.showInputError(wordText, this.t('options:saveWordDuplicateMessage', { word: word }));
      }
    } else {
      this.showInputError(wordText, this.t('options:wordPhraseInvalidMessage'));
    }
  }

  async selectFilterMethod(filterMethodInput: HTMLInputElement) {
    this.cfg.filterMethod = this.Class.Constants.FILTER_METHODS[filterMethodInput.value];
    try {
      await this.cfg.save('filterMethod');
      this.filter.rebuildWordlists();
      this.populateOptions();
    } catch (err) {
      this.handleError(this.t('options:saveFilterMethodFailedMessage'), err);
    }
  }

  sendUpdateContextMenuMessage() {
    const message: Message = {
      destination: this.Class.Constants.MESSAGING.BACKGROUND,
      source: this.Class.Constants.MESSAGING.OPTION,
      updateContextMenus: this.cfg.contextMenu,
    };
    chrome.runtime.sendMessage(message);
  }

  async setDefaultWordlist(element: HTMLSelectElement) {
    const prop = this.wordlistTypeFromElement(element);
    this.cfg[prop] = element.selectedIndex;

    try {
      await this.cfg.save(prop);
      this.populateOptions();
    } catch (err) {
      this.showErrorModal(this.t('options:saveWordlistDefaultFailedMessage'), err);
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

  get shouldCreateBookmarklet(): boolean {
    return this.bookmarklet === undefined;
  }

  show(element: HTMLElement) {
    element.classList.remove('w3-hide');
    element.classList.add('w3-show');
  }

  showBulkWordEditor() {
    const modalId = 'bulkWordEditorModal';
    const tableContainer = document.querySelector(`#${modalId} div.tableContainer`) as HTMLDivElement;
    const table = tableContainer.querySelector('table') as HTMLTableElement;
    const tBody = table.querySelector('tbody') as HTMLTableSectionElement;
    removeChildren(tBody);

    // Add wordlist names to header
    this.cfg.wordlists.forEach((wordlist, i) => {
      document.getElementById(`bulkWordEditorWordlist${i + 1}`).textContent = wordlist;
    });

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
    this.openModal(modalId);
  }

  async statsReset() {
    try {
      await this.Class.Config.removeLocalStorage('stats');
      this.populateStats();
    } catch (err) {
      logger.warn(this.t('options:statsResetFailedMessage'), err);
      this.showErrorModal([this.t('options:statsResetFailedMessage'), `Error: ${err.message}`]);
    }
  }

  showErrorModal(content: string | string[] = [this.t('options:errorModalDefaultContent')], title = this.t('options:errorModalDefaultTitle'), titleColor = 'w3-red') {
    this.configureStatusModal(content, title, titleColor);
    this.openModal('statusModal');
  }

  showInputError(element, message = '') {
    element.classList.add('w3-border-red');
    if (message) {
      try {
        element.setCustomValidity(message);
        element.reportValidity();
      } catch (err) {
        this.showWarningModal(message);
      }
    }
  }

  showStatusModal(content: string | string[] = [this.t('options:statusModalDefaultContent')], title = this.t('options:statusModalDefaultTitle'), titleColor = 'w3-flat-peter-river') {
    this.configureStatusModal(content, title, titleColor);
    this.openModal('statusModal');
  }

  showWarningModal(content: string | string[] = [this.t('options:warningModalDefaultContent')], title = this.t('options:warningModalDefaultTitle'), titleColor = 'w3-orange') {
    this.configureStatusModal(content, title, titleColor);
    this.openModal('statusModal');
  }

  switchPage(newTab: HTMLAnchorElement) {
    const currentTab = document.querySelector(`#menu a.${this.Class.activeClass}`) as HTMLElement;

    currentTab.classList.remove(this.Class.activeClass);
    newTab.classList.add(this.Class.activeClass);

    const oldTabName = currentTab.id.replace('Tab', '').toLowerCase();
    const newTabName = newTab.id.replace('Tab', '').toLowerCase();
    const currentPage = document.getElementById(`${oldTabName}Page`) as HTMLElement;
    const newPage = document.getElementById(`${newTabName}Page`) as HTMLElement;
    this.hide(currentPage);
    this.show(newPage);

    switch (newTabName) {
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
    this.sendUpdateContextMenuMessage();
  }

  updateFilterOptions() {
    // Show/hide options as needed
    switch (this.cfg.filterMethod) {
      case this.Class.Constants.FILTER_METHODS.CENSOR:
        this.show(document.getElementById('censorSettings'));
        this.hide(document.getElementById('substitutionSettings'));
        this.hide(document.getElementById('wordSubstitution'));
        break;
      case this.Class.Constants.FILTER_METHODS.SUBSTITUTE:
        this.hide(document.getElementById('censorSettings'));
        this.show(document.getElementById('substitutionSettings'));
        this.show(document.getElementById('wordSubstitution'));
        break;
      case this.Class.Constants.FILTER_METHODS.OFF:
      case this.Class.Constants.FILTER_METHODS.REMOVE:
        this.hide(document.getElementById('censorSettings'));
        this.hide(document.getElementById('substitutionSettings'));
        this.hide(document.getElementById('wordSubstitution'));
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
    const domainMatchMode = document.querySelector('input[name="domainMatchMode"]:checked') as HTMLInputElement;
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
    this.cfg.enabledDomainsOnly = (domainMatchMode.value === 'minimal');
    this.cfg.enabledFramesOnly = !domainFilterAllFrames.checked;
    this.cfg.wordlistsEnabled = wordlistsEnabledInput.checked;
    this.cfg.collectStats = collectStats.checked;
    this.cfg.loggingLevel = configLoggingLevelSelect.selectedIndex;
  }

  async updateUseSystemTheme(useDeviceThemeInput: HTMLInputElement) {
    try {
      this.cfg.darkMode = useDeviceThemeInput.checked ? null : this.prefersDarkScheme;
      await this.cfg.save('darkMode');
      this.applyTheme(true);
    } catch (err) {
      this.handleError(this.t('options:themeSaveFailedMessage'), err);
    }
  }

  validateLessUsedWordsNumber() {
    const lessUsedWordsNumber = document.getElementById('lessUsedWordsNumber') as HTMLInputElement;
    let valid = false;
    this.hideInputError(lessUsedWordsNumber);
    if (lessUsedWordsNumber.value.match(/^\d+$/) && parseInt(lessUsedWordsNumber.value) > 0) {
      valid = true;
    } else {
      this.showInputError(lessUsedWordsNumber, this.t('options:statsLessUsedWordsInvalidMessage'));
    }

    return valid;
  }

  validStatsForImport(stats) {
    return stats && stats?.startedAt > 1 && stats.words[Object.keys(stats.words)[0]].text >= 0;
  }

  wordlistTypeFromElement(element: HTMLSelectElement) {
    if (element.id === 'textWordlistSelect') return 'wordlistId';
  }
}
