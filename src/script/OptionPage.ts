import Constants from '@APF/lib/Constants';
import WebConfig from '@APF/WebConfig';
import Filter from '@APF/lib/Filter';
import Domain, { type DomainCfg } from '@APF/Domain';
import OptionAuth from '@APF/OptionAuth';
import DataMigration from '@APF/DataMigration';
import Bookmarklet from '@APF/bookmarklet';
import Logger from '@APF/lib/Logger';
import Translation from '@APF/Translation';
import {
  booleanToNumber,
  deepCloneJson,
  dynamicList,
  exportToFile,
  lastElement,
  numberToBoolean,
  numberWithCommas,
  readFile,
  removeFromArray,
  stringArray,
  timeForFileName,
  upperCaseFirst,
} from '@APF/lib/helper';
import type { Message } from '@APF/Background';
import type { Statistics } from '@APF/WebFilter';
import type { WordOptions } from '@APF/lib/Word';

export interface ConfirmModalSettings {
  backup?: boolean;
  content?: string;
  title?: string;
  titleClass?: string;
}

const logger = new Logger('OptionPage');

export default class OptionPage {
  _confirmEventListeners: { (): void }[];
  auth: OptionAuth;
  bookmarklet: Bookmarklet;
  cfg: WebConfig;
  darkModeButton: Element;
  filter: Filter;
  lessUsedWords: { [word: string]: number };
  lightModeButton: Element;
  prefersDarkScheme: boolean;
  themeElements: Element[];
  translation: Translation;

  //#region Class reference helpers
  // Can be overridden in children classes
  static get Bookmarklet() {
    return Bookmarklet;
  }
  static get Config() {
    return WebConfig;
  }
  static get Constants() {
    return Constants;
  }
  static get DataMigration() {
    return DataMigration;
  }
  static get Domain() {
    return Domain;
  }
  static get Filter() {
    return Filter;
  }
  static get OptionAuth() {
    return OptionAuth;
  }
  static get Translation() {
    return Translation;
  }
  get Class() {
    return this.constructor as typeof OptionPage;
  }
  //#endregion

  static get log() {
    return logger;
  }

  static readonly activeClass = 'w3-flat-belize-hole';
  static readonly themeElementSelectors = ['body', 'div#page', 'div.w3-modal'];

  constructor() {
    this.translation = new this.Class.Translation(['common', 'options']);
    this.setupEventListeners();
    this._confirmEventListeners = [];
    this.darkModeButton = document.querySelector('div.themes > div.moon');
    this.lightModeButton = document.querySelector('div.themes > div.sun');
    this.themeElements = this.Class.themeElementSelectors
      .map((selector) => {
        return Array.from(document.querySelectorAll(selector));
      })
      .flat();
    this.prefersDarkScheme = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
    this.filter = new this.Class.Filter();
  }

  get log() {
    return this.Class.log;
  }

  async addWordlist() {
    const wordlistText = document.getElementById('wordlistText') as HTMLInputElement;
    const name = wordlistText.value.trim();

    if (wordlistText.checkValidity()) {
      // Make sure there are no duplicates
      if (this.cfg.wordlists.includes(name)) {
        this.showInputError(wordlistText, this.t('options:listsPage.validations.wordlistNameNotUnique'));
        return false;
      }

      this.cfg.wordlists.push(name);
      try {
        await this.cfg.save('wordlists');
        this.populateWordlists();
        this.populateWordPage();
      } catch (err) {
        this.handleError(this.t('options:listsPage.messages.addWordlistFailed'), err);
      }
    } else {
      this.showInputError(wordlistText, this.t('options:listsPage.validations.wordlistNameInvalid'));
    }
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
    document.getElementById('headTitle').textContent = this.t('options:headers.title');
    document.getElementById('title').textContent = this.t('options:headers.title');
    // Tabs
    document.getElementById('bookmarkletTab').textContent = this.t('options:tabs.bookmarklet');
    document.getElementById('configTab').textContent = this.t('options:tabs.config');
    document.getElementById('domainsTab').textContent = this.t('options:tabs.domains');
    document.getElementById('helpTab').textContent = this.t('options:tabs.help');
    document.getElementById('listsTab').textContent = this.t('options:tabs.lists');
    document.getElementById('settingsTab').textContent = this.t('options:tabs.settings');
    document.getElementById('statsTab').textContent = this.t('options:tabs.stats');
    document.getElementById('testTab').textContent = this.t('options:tabs.test');
    document.getElementById('wordsTab').textContent = this.t('options:tabs.words');
    // Settings page
    document.getElementById('censorCharacterName').textContent = this.t('options:settingsPage.labels.censorCharacter');
    document.getElementById('censorFixedLengthName').textContent = this.t(
      'options:settingsPage.labels.censorFixedLength',
    );
    document.getElementById('censorFixedLengthOriginal').textContent = this.t(
      'options:settingsPage.options.originalCcensorFixedLength',
    );
    document.getElementById('censorSettingsHeader').textContent = this.t('options:settingsPage.headers.censorSettings');
    document.getElementById('defaultSettingsHeader').textContent = this.t(
      'options:settingsPage.headers.defaultSettings',
    );
    document.getElementById('defaultSubstitutionName').textContent = this.t(
      'options:settingsPage.labels.defaultSubstitution',
    );
    document.getElementById('defaultWordMatchMethodExact').textContent = this.t(
      'options:settingsPage.options.exactMatchMethod',
    );
    document.getElementById('defaultWordMatchMethodName').textContent = this.t(
      'options:settingsPage.labels.defaultWordMatchMethod',
    );
    document.getElementById('defaultWordMatchMethodPartial').textContent = this.t(
      'options:settingsPage.options.partialMatchMethod',
    );
    document.getElementById('defaultWordMatchMethodWhole').textContent = this.t(
      'options:settingsPage.options.wholeMatchMethod',
    );
    document.getElementById('defaultWordMatchRepeatedName').textContent = this.t(
      'options:settingsPage.labels.defaultWordMatchRepeated',
    );
    document.getElementById('defaultWordMatchRepeatedNote').textContent = this.t(
      'options:settingsPage.notes.defaultWordMatchRepeated',
    );
    document.getElementById('defaultWordMatchSeparatorsName').textContent = this.t(
      'options:settingsPage.labels.defaultWordMatchSeparators',
    );
    document.getElementById('defaultWordMatchSeparatorsNote').textContent = this.t(
      'options:settingsPage.notes.defaultWordMatchSeparators',
    );
    document.getElementById('filterCensorName').textContent = this.t('options:settingsPage.options.censorFilterMethod');
    document.getElementById('filterMethodCensorNote').textContent = this.t(
      'options:settingsPage.notes.filterMethodCensor',
    );
    document.getElementById('filterMethodHeader').textContent = this.t('options:settingsPage.headers.filterMethod');
    document.getElementById('filterMethodOffNote').textContent = this.t('options:settingsPage.notes.filterMethodOff');
    document.getElementById('filterMethodRemoveNote').textContent = this.t(
      'options:settingsPage.notes.filterMethodRemove',
    );
    document.getElementById('filterMethodSubstituteNote').textContent = this.t(
      'options:settingsPage.notes.filterMethodSubstitute',
    );
    document.getElementById('filterOffName').textContent = this.t('options:settingsPage.options.offFilterMethod');
    document.getElementById('filterRemoveName').textContent = this.t('options:settingsPage.options.removeFilterMethod');
    document.getElementById('filterSubstituteName').textContent = this.t(
      'options:settingsPage.options.substituteFilterMethod',
    );
    document.getElementById('generalSettingsHeader').textContent = this.t(
      'options:settingsPage.headers.generalSettings',
    );
    document.getElementById('preserveFirstName').textContent = this.t(
      'options:settingsPage.labels.censorPreserveFirst',
    );
    document.getElementById('preserveFirstNote').textContent = this.t('options:settingsPage.notes.censorPreserveFirst');
    document.getElementById('preserveLastName').textContent = this.t('options:settingsPage.labels.censorPreserveLast');
    document.getElementById('preserveLastNote').textContent = this.t('options:settingsPage.notes.censorPreserveLast');
    document.getElementById('showContextMenuName').textContent = this.t('options:settingsPage.labels.showContextMenu');
    document.getElementById('showContextMenuNote').textContent = this.t('options:settingsPage.notes.showContextMenu');
    document.getElementById('showCounterName').textContent = this.t('options:settingsPage.labels.showCounter');
    document.getElementById('showCounterNote').textContent = this.t('options:settingsPage.notes.showCounter');
    document.getElementById('showSummaryName').textContent = this.t('options:settingsPage.labels.showSummary');
    document.getElementById('showSummaryNote').textContent = this.t('options:settingsPage.notes.showSummary');
    document.getElementById('showUpdateNotificationName').textContent = this.t(
      'options:settingsPage.labels.showUpdateNotification',
    );
    document.getElementById('substitutionMarkName').textContent = this.t(
      'options:settingsPage.labels.substitutionMark',
    );
    document.getElementById('substitutionMarkNote').textContent = this.t('options:settingsPage.notes.substitutionMark');
    document.getElementById('substitutionPreserveCaseName').textContent = this.t(
      'options:settingsPage.labels.substitutionPreserveCase',
    );
    document.getElementById('substitutionPreserveCaseNote').textContent = this.t(
      'options:settingsPage.notes.substitutionPreserveCase',
    );
    document.getElementById('substitutionSettingsHeader').textContent = this.t(
      'options:settingsPage.headers.substitutionSettings',
    );
    document.getElementById('useDeviceThemeName').textContent = this.t('options:settingsPage.labels.useDeviceTheme');
    document.getElementById('useDeviceThemeNote').textContent = this.t('options:settingsPage.notes.useDeviceTheme');
    // Words page
    document.getElementById('bulkWordEditorButton').textContent = this.t(
      'options:wordsPage.buttons.openBulkWordEditor',
    ).toUpperCase();
    document.getElementById('filterWordListName').textContent = this.t('options:wordsPage.labels.filterWordList');
    document.getElementById('includeInWordlistsHeader').textContent = this.t(
      'options:wordsPage.headers.includeInWordlists',
    );
    document.getElementById('wordCaseSensitive').textContent = this.t('options:wordsPage.labels.caseSensitive');
    document.getElementById('wordMatchExactName').textContent = this.t('options:wordsPage.options.exactMatchMethod');
    document.getElementById('wordMatchExactNote').textContent = this.t('options:wordsPage.notes.matchExact');
    document.getElementById('wordMatchMethodHeader').textContent = this.t('options:wordsPage.headers.matchMethod');
    document.getElementById('wordMatchPartialName').textContent = this.t(
      'options:wordsPage.options.partialMatchMethod',
    );
    document.getElementById('wordMatchPartialNote').textContent = this.t('options:wordsPage.notes.matchPartial');
    document.getElementById('wordMatchRegexName').textContent = this.t('options:wordsPage.options.regexMatchMethod');
    document.getElementById('wordMatchRegexNote').textContent = this.t('options:wordsPage.notes.matchRegex');
    document.getElementById('wordMatchRepeatedName').textContent = this.t('options:wordsPage.labels.matchRepeated');
    document.getElementById('wordMatchRepeatedNote').textContent = this.t('options:wordsPage.notes.matchRepeated');
    document.getElementById('wordMatchSeparatorsName').textContent = this.t('options:wordsPage.labels.matchSeparators');
    document.getElementById('wordMatchSeparatorsNote').textContent = this.t('options:wordsPage.notes.matchSeparators');
    document.getElementById('wordMatchWholeName').textContent = this.t('options:wordsPage.options.wholeMatchMethod');
    document.getElementById('wordMatchWholeNote').textContent = this.t('options:wordsPage.notes.matchWhole');
    document.getElementById('wordOtherHeader').textContent = this.t('options:wordsPage.headers.other');
    document.getElementById('wordPhraseHeader').textContent = this.t('options:wordsPage.headers.wordPhrase');
    document.getElementById('wordRemove').textContent = this.t('options:wordsPage.buttons.removeWord').toUpperCase();
    document.getElementById('wordRemoveAll').textContent = this.t(
      'options:wordsPage.buttons.removeAllWords',
    ).toUpperCase();
    document.getElementById('wordSave').textContent = this.t('options:wordsPage.buttons.saveWord').toUpperCase();
    document.getElementById('wordsHeader').textContent = this.t('options:wordsPage.headers.wordsAndPhrases');
    document.getElementById('wordSubstitutionHeader').textContent = this.t('options:wordsPage.headers.substitution');
    // Lists page
    document.getElementById('allowlistHeader').textContent = this.t('options:listsPage.headers.allowlist');
    document.getElementById('allowlistInsensitiveName').textContent = this.t(
      'options:listsPage.labels.caseInsensitive',
    );
    document.getElementById('allowlistInsensitiveNote').textContent = this.t('options:listsPage.notes.caseInsensitive');
    document.getElementById('allowlistNote').textContent = this.t('options:listsPage.notes.allowlistCaseSensitive');
    document.getElementById('allowlistRemove').textContent = this.t(
      'options:listsPage.buttons.removeWordFromList',
    ).toUpperCase();
    document.getElementById('allowlistSave').textContent = this.t(
      'options:listsPage.buttons.saveWordToList',
    ).toUpperCase();
    document.getElementById('allowlistSensitiveName').textContent = this.t('options:listsPage.labels.caseSensitive');
    document.getElementById('allowlistSensitiveNote').textContent = this.t('options:listsPage.notes.caseSensitive');
    document.getElementById('defaultTextWordlistHeader').textContent = this.t(
      'options:listsPage.headers.defaultTextWordlist',
    );
    document.getElementById('listWordPhraseHeader').textContent = this.t('options:listsPage.headers.wordPhrase');
    document.getElementById('wordlistAdd').textContent = this.t('options:listsPage.buttons.addWordlist').toUpperCase();
    document.getElementById('wordlistNameHeader').textContent = this.t('options:listsPage.headers.wordlistName');
    document.getElementById('wordlistRemove').textContent = this.t(
      'options:listsPage.buttons.removeWordlist',
    ).toUpperCase();
    document.getElementById('wordlistRename').textContent = this.t(
      'options:listsPage.buttons.renameWordlist',
    ).toUpperCase();
    document.getElementById('wordlistsHeader').textContent = this.t('options:listsPage.headers.wordlists');
    // Domains page
    document.getElementById('domainDisabledName').textContent = this.t('options:domainsPage.labels.filterDisabled');
    document.getElementById('domainDisabledNote').textContent = this.t('options:domainsPage.notes.filterDisabled');
    document.getElementById('domainEnabledName').textContent = this.t('options:domainsPage.labels.filterEnabled');
    document.getElementById('domainEnabledNote').textContent = this.t('options:domainsPage.notes.filterEnabled');
    document.getElementById('domainFilterAllFramesName').textContent = this.t(
      'options:domainsPage.labels.filterAllFrames',
    );
    document.getElementById('domainFilterAllFramesNote').textContent = this.t(
      'options:domainsPage.notes.filterAllFrames',
    );
    document.getElementById('domainFrameModeHeader').textContent = this.t('options:domainsPage.headers.frameMode');
    document.getElementById('domainFramesDisabledName').textContent = this.t(
      'options:domainsPage.labels.framesDisabled',
    );
    document.getElementById('domainFramesDisabledNote').textContent = this.t(
      'options:domainsPage.notes.framesDisabled',
    );
    document.getElementById('domainFramesEnabledName').textContent = this.t('options:domainsPage.labels.framesEnabled');
    document.getElementById('domainFramesEnabledNote').textContent = this.t('options:domainsPage.notes.framesEnabled');
    document.getElementById('domainHeader').textContent = this.t('options:domainsPage.headers.domain');
    document.getElementById('domainMatchModeHeader').textContent = this.t('options:domainsPage.headers.matchMode');
    document.getElementById('domainMatchModeMinimalName').textContent = this.t(
      'options:domainsPage.options.minimalDomainMatchMode',
    );
    document.getElementById('domainMatchModeMinimalNote').textContent = this.t(
      'options:domainsPage.notes.matchModeMinimal',
    );
    document.getElementById('domainMatchModeNormalName').textContent = this.t(
      'options:domainsPage.options.normalDomainMatchMode',
    );
    document.getElementById('domainMatchModeNormalNote').textContent = this.t(
      'options:domainsPage.notes.matchModeNormal',
    );
    document.getElementById('domainModeAdvanced').textContent = this.t(
      'options:domainsPage.options.advancedDomainMode',
    );
    document.getElementById('domainModeDeep').textContent = this.t('options:domainsPage.options.deepDomainMode');
    document.getElementById('domainModeHeader').textContent = this.t('options:domainsPage.headers.mode');
    document.getElementById('domainModeNormal').textContent = this.t('options:domainsPage.options.normalDomainMode');
    document.getElementById('domainRemove').textContent = this.t(
      'options:domainsPage.buttons.removeDomain',
    ).toUpperCase();
    document.getElementById('domainSave').textContent = this.t('options:domainsPage.buttons.saveDomain').toUpperCase();
    document.getElementById('domainsHeader').textContent = this.t('options:domainsPage.headers.domains');
    document.getElementById('domainTextNote').textContent = this.t('options:domainsPage.notes.domainExample');
    document.getElementById('domainTextWordlistHeader').textContent = this.t(
      'options:domainsPage.headers.textWordlist',
    );
    // Bookmarklet page
    document.getElementById('bookmarkletButtonNote').textContent = this.t(
      'options:bookmarkletsPage.notes.installBookmarklet',
    );
    document.getElementById('bookmarkletExplanation').textContent = this.t(
      'options:bookmarkletsPage.notes.explanation',
    );
    document.getElementById('bookmarkletHeader').textContent = this.t('options:bookmarkletsPage.headers.bookmarklet');
    document.getElementById('bookmarkletLearnMore').textContent = this.t('options:bookmarkletsPage.notes.learnMore');
    document.getElementById('bookmarkletLink').textContent = this.t(
      'options:bookmarkletsPage.buttons.installBookmarklet',
    ).toUpperCase();
    document.getElementById('bookmarkletUseDefaultConfig').textContent = this.t(
      'options:bookmarkletsPage.labels.useDefaultConfig',
    );
    document.getElementById('bookmarkletUseMyConfig').textContent = this.t(
      'options:bookmarkletsPage.labels.useMyConfig',
    );
    // Config page
    document.getElementById('configExport').textContent = this.t(
      'options:configsPage.buttons.exportConfig',
    ).toUpperCase();
    document.getElementById('configHeader').textContent = this.t('options:configsPage.headers.configuration');
    document.getElementById('configImport').textContent = this.t(
      'options:configsPage.buttons.importConfig',
    ).toUpperCase();
    document.getElementById('configInlineEditorName').textContent = this.t('options:configsPage.labels.inlineEditor');
    document.getElementById('configLoggingLevelDebug').textContent = this.t(
      'options:configsPage.options.debugLogLevel',
    );
    document.getElementById('configLoggingLevelError').textContent = this.t(
      'options:configsPage.options.errorLogLevel',
    );
    document.getElementById('configLoggingLevelHeader').textContent = this.t(
      'options:configsPage.headers.loggingLevel',
    );
    document.getElementById('configLoggingLevelInfo').textContent = this.t('options:configsPage.options.infoLogLevel');
    document.getElementById('configLoggingLevelWarn').textContent = this.t('options:configsPage.options.warnLogLevel');
    document.getElementById('configPasswordHeader').textContent = this.t('options:configsPage.headers.password');
    document.getElementById('configReset').textContent = this.t(
      'options:configsPage.buttons.restoreDefaultConfig',
    ).toUpperCase();
    document.getElementById('configStorageHeader').textContent = this.t('options:configsPage.headers.storage');
    document.getElementById('configSyncLargeSettingsName').textContent = this.t(
      'options:configsPage.labels.syncLargeSettings',
    );
    document.getElementById('configSyncLargeSettingsNote').textContent = this.t(
      'options:configsPage.notes.syncLargeSettings',
    );
    // Stats page
    document.getElementById('collectStatsName').textContent = this.t('options:statsPage.labels.collectStats');
    document.getElementById('collectStatsNote').textContent = this.t('options:statsPage.notes.collectStats');
    document.getElementById('removeLessUsedWords').textContent = this.t(
      'options:statsPage.buttons.removeLessUsedWords',
    ).toUpperCase();
    document.getElementById('statsExport').textContent = this.t('options:statsPage.buttons.exportStats').toUpperCase();
    document.getElementById('statsFilteredSummaryTotal').textContent = this.t(
      'options:statsPage.tableHeaders.summaryTotal',
    );
    document.getElementById('statsFilteredSummaryWord').textContent = this.t(
      'options:statsPage.tableHeaders.summaryWord',
    );
    document.getElementById('statsHeader').textContent = this.t('options:statsPage.headers.stats');
    document.getElementById('statsImport').textContent = this.t('options:statsPage.buttons.importStats').toUpperCase();
    document.getElementById('statsRemoveLessUsedWordsExplanation').textContent = this.t(
      'options:statsPage.notes.removeLessUsedWords',
    );
    document.getElementById('statsReset').textContent = this.t('options:statsPage.buttons.resetStats').toUpperCase();
    document.getElementById('statsSummaryHeader').textContent = this.t('options:statsPage.headers.summary');
    document.getElementById('statsTotalFilteredName').textContent = this.t(
      'options:statsPage.labels.totalWordsFiltered',
    );
    document.getElementById('statsTrackingSinceName').textContent = this.t('options:statsPage.labels.trackingSince');
    document.getElementById('statsWordsFilteredHeader').textContent = this.t('options:statsPage.headers.wordsFiltered');
    // Test page
    document.getElementById('testFilteredHeader').textContent = this.t('options:testsPage.headers.filtered');
    document.getElementById('testHeader').textContent = this.t('options:testsPage.headers.test');
    // Modals
    // Word Bulk Editor
    (document.getElementById('bulkAddWordsText') as HTMLTextAreaElement).placeholder = this.t(
      'options:bulkWordEditorModal.notes.bulkAddWordsPlaceholder',
    );
    document.getElementById('bulkEditorAddWord').textContent = this.t(
      'options:bulkWordEditorModal.buttons.addWord',
    ).toUpperCase();
    document.getElementById('bulkEditorAddWords').textContent = this.t(
      'options:bulkWordEditorModal.buttons.addWords',
    ).toUpperCase();
    document.getElementById('bulkEditorCancel').textContent = this.t(
      'options:bulkWordEditorModal.buttons.cancel',
    ).toUpperCase();
    document.getElementById('bulkEditorSave').textContent = this.t(
      'options:bulkWordEditorModal.buttons.save',
    ).toUpperCase();
    document.getElementById('bulkWordEditorMatchMethodHeader').textContent = this.t(
      'options:bulkWordEditorModal.tableHeaders.matchMethod',
    );
    document.getElementById('bulkWordEditorRemoveAllHeader').textContent = this.t(
      'options:bulkWordEditorModal.tableHeaders.remove',
    );
    document.getElementById('bulkWordEditorRepeatedHeader').textContent = this.t(
      'options:bulkWordEditorModal.tableHeaders.repeated',
    );
    document.getElementById('bulkWordEditorSeparatorsHeader').textContent = this.t(
      'options:bulkWordEditorModal.tableHeaders.separators',
    );
    document.getElementById('bulkWordEditorSubstitutionCaseHeader').textContent = this.t(
      'options:bulkWordEditorModal.tableHeaders.substitutionCase',
    );
    document.getElementById('bulkWordEditorSubstitutionHeader').textContent = this.t(
      'options:bulkWordEditorModal.tableHeaders.substitution',
    );
    document.getElementById('bulkWordEditorTitle').textContent = this.t(
      'options:bulkWordEditorModal.headers.bulkWordEditor',
    );
    document.getElementById('bulkWordEditorWordHeader').textContent = this.t(
      'options:bulkWordEditorModal.tableHeaders.word',
    );
    // Confirm
    document.getElementById('confirmModalBackup').textContent = this.t(
      'options:confirmModal.buttons.backup',
    ).toUpperCase();
    document.getElementById('confirmModalCancel').textContent = this.t(
      'options:confirmModal.buttons.cancel',
    ).toUpperCase();
    document.getElementById('confirmModalOK').textContent = this.t('options:confirmModal.buttons.ok').toUpperCase();
    // Password
    document.getElementById('passwordModalHeader').textContent = this.t('options:passwordModal.headers.enterPassword');
    document.getElementById('submitPassword').textContent = this.t(
      'options:passwordModal.buttons.submitPassword',
    ).toUpperCase();
    // Status
    document.getElementById('statusModalOK').textContent = this.t('options:statusModal.buttons.ok').toUpperCase();
  }

  t(key: string, options = {}): string {
    return this.translation.t(key, options);
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
    removeButton.addEventListener('click', (evt) => {
      this.bulkEditorRemoveRow(evt.target as HTMLButtonElement);
    });
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
      const optionElement = document.createElement('option');
      optionElement.textContent = this.t(`options:bulkWordEditorModal.options.${matchMethod.toLowerCase()}MatchMethod`);
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
    separatorsInput.checked = numberToBoolean(data.separators);
    cellSeparators.appendChild(separatorsInput);

    const existingCellCount = row.cells.length;
    if (this.cfg.wordlistsEnabled) {
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
    }

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
        if (word != '') {
          this.bulkEditorAddRow(word);
        }
      });

      // Scroll to the bottom
      table.parentElement.scrollTop = table.parentElement.scrollHeight - table.parentElement.clientHeight;

      // Clear textarea after adding to the table
      bulkAddWordsText.value = '';
    }
  }

  bulkEditorRemoveAll() {
    const tBody = document.querySelector('#bulkWordEditorModal table tbody') as HTMLTableSectionElement;
    tBody.replaceChildren();
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
      wordlistSelectionsInput.forEach((wordlist, index) => {
        if (wordlist.checked) {
          lists.push(index + 1);
        }
      });

      const name = (cells[1].querySelector('input') as HTMLInputElement).value;
      if (name != '') {
        const wordOptions: WordOptions = {
          case: booleanToNumber((cells[3].querySelector('input') as HTMLInputElement).checked),
          lists: lists,
          matchMethod: (cells[4].querySelector('select') as HTMLSelectElement).selectedIndex,
          repeat: booleanToNumber((cells[5].querySelector('input') as HTMLInputElement).checked),
          separators: booleanToNumber((cells[6].querySelector('input') as HTMLInputElement).checked),
          sub: (cells[2].querySelector('input') as HTMLInputElement).value,
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
      this.showStatusModal(this.t('options:bulkWordEditorModal.messages.saveSuccess'));
      this.filter.rebuildWordlists();
      this.populateOptions();
    } catch (err) {
      if (this.isStorageError(err) && this.cfg.syncLargeKeys) {
        this.confirm('bulkEditorSaveRetry');
      } else {
        this.log.warn(this.t('options:bulkWordEditorModal.messages.saveFailed'), err);
        this.showErrorModal([this.t('options:.bulkWordEditor.messages.saveFailed'), `Error: ${err.message}`]);
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
      this.handleError(this.t('options:bulkWordEditorModal.messages.saveFailed'), err);
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
    document
      .querySelectorAll(`#bulkWordEditorModal table td input.wordlistData[data-col="${checkbox.dataset.col}"]`)
      .forEach((box: HTMLInputElement) => {
        box.checked = checked;
      });
  }

  closeModal(id: string) {
    const modal = document.getElementById(id);
    modal.classList.remove('w3-show');
    this.hide(modal);
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
    const backupButtonContainer = document.getElementById('confirmBackupButton') as HTMLElement;
    const backupButton = document.querySelector('#confirmModal button#confirmModalBackup') as HTMLButtonElement;

    const defaults = {
      backup: false,
      content: this.t('options:confirmModal.messages.default'),
      title: this.t('options:confirmModal.headers.default'),
      titleClass: 'w3-flat-peter-river',
    };
    settings = Object.assign(defaults, settings);

    if (!contentElement) {
      contentElement = document.createElement('span');
      contentElement.textContent = settings.content;
    }

    modalTitle.textContent = settings.title;
    modalContent.replaceChildren(contentElement);
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

    modalHeader.className = `w3-container ${titleColor}`;
    modalTitle.textContent = title;

    const contentArray = stringArray(content);
    const contentElements = contentArray.map((textPart) => {
      const p = document.createElement('p');
      p.textContent = textPart;
      return p;
    });

    modalContent.replaceChildren(...contentElements);
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
        paragraph.textContent = this.t('options:bulkWordEditorModal.messages.confirmSave');
        italics.textContent = this.t('options:bulkWordEditorModal.messages.confirmSaveNote');
        content.appendChild(paragraph);
        content.appendChild(italics);
        this.configureConfirmModal({ backup: true }, content);
        this._confirmEventListeners.push(this.bulkEditorSave.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'bulkEditorSaveRetry':
        paragraph.textContent = this.t('options:bulkWordEditorModal.messages.confirmSaveRetryStorage');
        italics.textContent = this.t('options:confirmModal.notes.convertStorageToLocal');
        content.appendChild(paragraph);
        content.appendChild(italics);
        this.configureConfirmModal({ backup: true, titleClass: 'w3-red' }, content);
        this._confirmEventListeners.push(this.bulkEditorSaveRetry.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'convertStorageLocation':
        if (this.cfg.syncLargeKeys) {
          paragraph.textContent = this.t('options:confirmModal.messages.convertStorageToLocal');
        } else {
          paragraph.textContent = this.t('options:confirmModal.messages.convertStorageToSync');
        }
        italics.textContent = this.t('options:confirmModal.messages.convertStorage');
        content.appendChild(paragraph);
        content.appendChild(italics);
        this.configureConfirmModal({ backup: true }, content);
        this._confirmEventListeners.push(this.populateConfig.bind(this));
        cancel.addEventListener('click', lastElement(this._confirmEventListeners));
        this._confirmEventListeners.push(this.convertStorageLocation.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'importConfig':
        this.configureConfirmModal({ content: this.t('options:confirmModal.messages.importConfig'), backup: true });
        this._confirmEventListeners.push(this.importConfig.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'importConfigRetry':
        paragraph.textContent = this.t('options:confirmModal.messages.importConfigRetry');
        italics.textContent = this.t('options:confirmModal.notes.convertStorageToLocal');
        content.appendChild(paragraph);
        content.appendChild(italics);
        this.configureConfirmModal({ backup: false, titleClass: 'w3-red' }, content);
        this._confirmEventListeners.push(this.importConfigRetryCancel.bind(this));
        cancel.addEventListener('click', lastElement(this._confirmEventListeners));
        this._confirmEventListeners.push(this.importConfigRetry.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'removeAllWords':
        paragraph.textContent = this.t('options:confirmModal.messages.removeAllWords');
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
              content: this.t('options:statsPage.messages.confirmRemoveLessUsedWords', { count: count }),
            });
            this._confirmEventListeners.push(this.removeLessUsedWords.bind(this));
            ok.addEventListener('click', lastElement(this._confirmEventListeners));
          } else {
            validated = false;
            this.showStatusModal(`
              ${this.t('options:statsPage.messages.confirmRemoveLessUsedWordsNone')}
              ${this.t('options:statsPage.notes.confirmRemoveLessUsedWordsNone')}
            `);
          }
        }
        break;
      case 'removeWordlist':
        paragraph.textContent = this.t('options:listsPage.messages.confirmRemoveWordlist');
        italics.textContent = this.t('options:listsPage.notes.confirmRemoveWordlist');
        content.appendChild(paragraph);
        content.appendChild(italics);
        this.configureConfirmModal({ backup: true }, content);
        this._confirmEventListeners.push(this.removeWordlist.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'statsImport':
        this.configureConfirmModal({ content: this.t('options:statsPage.messages.confirmImportStats') });
        this._confirmEventListeners.push(this.importStats.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'statsReset':
        this.configureConfirmModal({ content: this.t('options:statsPage.messages.confirmResetStats') });
        this._confirmEventListeners.push(this.statsReset.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'restoreDefaults':
        this.configureConfirmModal({ content: this.t('options:confirmModal.messages.restoreDefaults'), backup: true });
        this._confirmEventListeners.push(this.restoreDefaults.bind(this));
        ok.addEventListener('click', lastElement(this._confirmEventListeners));
        break;
      case 'setPassword': {
        const passwordText = document.getElementById('setPassword') as HTMLInputElement;
        const passwordBtn = document.getElementById('setPasswordBtn') as HTMLInputElement;
        if (passwordBtn.classList.contains('disabled')) return false;

        const message =
          passwordText.value == ''
            ? this.t('options:confirmModal.messages.removePassword')
            : this.t('options:confirmModal.messages.setPassword', { password: passwordText.value });
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
          this.showStatusModal(this.t('options:configsPage.messages.convertStorageSuccess'));
        }
      } catch (err) {
        // Revert UI and export a backup of config.
        this.cfg.syncLargeKeys = !this.cfg.syncLargeKeys;
        this.backupConfig();
        this.handleError(this.t('options:configsPage.messages.convertStorageCleanupFailed'), err);
        await this.cfg.save('syncLargeKeys');
        this.populateConfig();
      }
    } catch (err) {
      // Revert UI
      this.handleError(this.t('options:configsPage.messages.convertStorageFailed'), err);
      this.cfg.syncLargeKeys = !this.cfg.syncLargeKeys;
      this.populateConfig();
    }
  }

  disableBtn(element: HTMLElement) {
    element.classList.add('disabled', 'w3-flat-silver');
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
    element.classList.remove('disabled', 'w3-flat-silver');
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
      this.showErrorModal([this.t('options:statusModal.messages.saveFailed'), `Error: ${err.message}`]);
      return false;
    }
  }

  handleError(message: string, error?: Error) {
    if (error) {
      this.log.error(message, error);
      this.showErrorModal([message, `Error: ${error.message}`]);
    } else {
      this.log.error(message);
      this.showErrorModal([message]);
    }
  }

  hide(element: HTMLElement) {
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

  async getStatsFromStorage(): Promise<Statistics> {
    const { stats }: { stats: Statistics } = (await this.Class.Config.getLocalStorage({ stats: { words: {} } })) as any;
    return stats;
  }

  importConfig() {
    const input = document.getElementById('configInlineInput') as HTMLInputElement;
    if (input.checked) {
      // inline editor
      const configText = document.getElementById('configText') as HTMLTextAreaElement;
      this.importConfigText(configText.value);
    } else {
      const importFileInput = document.getElementById('importFileInput') as HTMLInputElement;
      importFileInput.click();
    }
  }

  async importConfigFile(input: HTMLInputElement, files: FileList) {
    const file = files[0];
    const fileText = (await readFile(file)) as string;
    this.importConfigText(fileText);
    input.value = '';
  }

  async importConfigRetry() {
    const configSyncLargeKeys = document.getElementById('configSyncLargeKeys') as HTMLInputElement;
    configSyncLargeKeys.checked = false;
    try {
      await this.convertStorageLocation(null, true);
      await this.cfg.save();
      this.showStatusModal(this.t('options:configsPage.messages.importSuccess'));
      await this.init();
    } catch (err) {
      this.handleError(this.t('options:configsPage.messages.importFailed'), err);
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
          this.showStatusModal(this.t('options:configsPage.messages.importSuccess'));
          await this.init(true);
        } catch (err) {
          if (this.isStorageError(err) && this.cfg.syncLargeKeys) {
            this.confirm('importConfigRetry');
          } else {
            this.handleError(this.t('options:configsPage.messages.importFailed'), err);
          }
        }
      }
    } catch (err) {
      this.showErrorModal([this.t('options:configsPage.messages.importProcessingFailed'), `Error: ${err.message}`]);
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
      const fileText = (await readFile(file)) as string;
      const stats = JSON.parse(fileText);
      if (!this.validStatsForImport(stats)) throw new Error(this.t('options:statsPage.importInvalid'));
      await this.Class.Config.saveLocalStorage({ stats: stats });
      input.value = '';
      await this.populateStats();
    } catch (err) {
      await this.Class.Config.saveLocalStorage({ stats: backupStats });
      this.handleError(this.t('options:statsPage.messages.importFailed'), err);
    }
  }

  async init(refreshTheme = false) {
    await this.initializeCfg();
    await this.translation.changeLanguage(this.cfg.language);
    this.applyTranslation();
    this.log.setLevel(this.cfg.loggingLevel);
    this.applyTheme(refreshTheme);
    this.setHelpVersion();
    if (!this.auth) this.auth = new this.Class.OptionAuth(this, this.cfg.password);
    this.filter.cfg = this.cfg;
    this.filter.init();

    // this.log.debug(`Password: '${this.cfg.password}', Authenticated: ${this.auth.authenticated}`);
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
    return index == this.cfg.wordlistId - 1;
  }

  openModal(id: string) {
    const modal = document.getElementById(id);
    modal.classList.add('w3-show');
    this.show(modal);
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
    if (!key) {
      // New record
      this.disableBtn(domainRemoveBtn);
      domainCfg = Object.assign({}, this.Class.Domain._domainCfgDefaults);
    } else {
      // Existing record
      this.enableBtn(domainRemoveBtn);
      domainCfg = this.cfg.domains[domainsSelect.value];
    }

    const domainKey = domainText.value.trim().toLowerCase();
    if (domainKey == '') {
      // No data
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

    const domains = this.Class.Domain.sortedKeys(this.cfg.domains);
    domains.unshift(this.t('options:domainsPage.options.addOrUpdateExistingDomain'));
    const options = domains.map((domain, index) => {
      const optionElement = document.createElement('option');
      optionElement.textContent = domain;
      optionElement.value = index === 0 ? '' : domain;
      return optionElement;
    });
    domainsSelect.replaceChildren(...options);
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

      const wordlists = [
        this.t('options:domainsPage.options.defaultWordlist'),
        this.t('options:domainsPage.options.allWordsWordlist'),
      ].concat(this.cfg.wordlists);
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
    const selectedFilter = document.getElementById(
      `filter${this.Class.Constants.filterMethodName(this.cfg.filterMethod)}`,
    ) as HTMLInputElement;
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
      this.log.warn(this.t('options:statsPage.messages.loadFailed'), err);
      this.showErrorModal([this.t('options:statsPage.messages.loadFailed'), `Error: ${err.message}`]);
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
    tooltipSpan.classList.add('stats-tooltip', 'w3-tag', 'w3-text');
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
      filteredTestText.textContent = this.t('options:testsPage.notes.filteredTextPlaceholder');
    } else {
      if (this.cfg.filterMethod === this.Class.Constants.FILTER_METHODS.OFF) {
        filteredTestText.textContent = testText.value;
      } else {
        filteredTestText.textContent = this.filter.replaceText(testText.value, this.filter.cfg.wordlistId, null);
      }
    }
  }

  populateAllowlist() {
    const pattern = / \*$/;
    const sensitiveList = this.filter.cfg.wordAllowlist.map((item) => {
      return item + ' *';
    });
    const list = [].concat(sensitiveList, this.filter.cfg.iWordAllowlist).sort();
    const allowlist = document.getElementById('allowlistSelect') as HTMLSelectElement;

    list.unshift(this.t('options:listsPage.options.addOrUpdateExistingWord'));
    const options = list.map((item, index) => {
      const optionElement = document.createElement('option');
      optionElement.value = index === 0 ? '' : item.replace(pattern, '');
      optionElement.dataset.sensitive = pattern.test(item).toString();
      optionElement.textContent = item;
      return optionElement;
    });

    allowlist.replaceChildren(...options);
    this.populateAllowlistWord();
  }

  populateAllowlistWord() {
    const allowlist = document.getElementById('allowlistSelect') as HTMLSelectElement;
    const allowlistRemove = document.getElementById('allowlistRemove') as HTMLInputElement;
    const allowlistText = document.getElementById('allowlistText') as HTMLInputElement;
    const selected = allowlist.selectedOptions[0];

    if (selected.value == '') {
      // New word
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
    const wordlistSelections = document.querySelectorAll(
      'div#wordlistSelections input',
    ) as NodeListOf<HTMLInputElement>;
    this.hideInputError(wordText);
    this.hideInputError(substitutionText);

    if (word == '') {
      // New word
      wordText.value = '';
      this.disableBtn(wordRemove);
      const selectedMatchMethod = document.getElementById(
        `wordMatch${upperCaseFirst(this.Class.Constants.matchMethodName(this.cfg.defaultWordMatchMethod))}`,
      ) as HTMLInputElement;
      selectedMatchMethod.checked = true;
      wordMatchRepeated.checked = numberToBoolean(this.cfg.defaultWordRepeat);
      wordMatchSeparators.checked = numberToBoolean(this.cfg.defaultWordSeparators);
      substitutionText.value = '';
      substitutionCase.checked = false;
      wordlistSelections.forEach((wordlist, index) => {
        wordlist.checked = this.newWordWordlistChecked(index);
      });
    } else {
      // Existing word
      this.enableBtn(wordRemove);
      const wordCfg = this.cfg.words[word];
      wordText.value = word;
      const selectedMatchMethod = document.getElementById(
        `wordMatch${upperCaseFirst(this.Class.Constants.matchMethodName(wordCfg.matchMethod))}`,
      ) as HTMLInputElement;
      selectedMatchMethod.checked = true;
      wordMatchRepeated.checked = numberToBoolean(wordCfg.repeat);
      wordMatchSeparators.checked = numberToBoolean(
        wordCfg.separators === undefined ? this.cfg.defaultWordSeparators : wordCfg.separators,
      );
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
    const wordlistAdd = document.getElementById('wordlistAdd') as HTMLElement;
    const wordlistRemove = document.getElementById('wordlistRemove') as HTMLElement;
    const wordlistRename = document.getElementById('wordlistRename') as HTMLElement;
    const wordlistSelect = document.getElementById('wordlistSelect') as HTMLSelectElement;
    const wordlistText = document.getElementById('wordlistText') as HTMLInputElement;
    const wordlist = wordlistSelect.value;
    wordlistText.value = wordlist;

    if (wordlist === '') {
      // New wordlist
      this.hide(wordlistRemove);
      this.hide(wordlistRename);
      this.show(wordlistAdd);
    } else {
      // Existing wordlist
      this.show(wordlistRemove);
      this.show(wordlistRename);
      this.hide(wordlistAdd);
    }
  }

  populateWordlists(selectedIndex: number = 0) {
    const wordlistsEnabledInput = document.getElementById('wordlistsEnabled') as HTMLInputElement;
    const wordlistContainer = document.getElementById('wordlistContainer') as HTMLElement;
    wordlistsEnabledInput.checked = this.cfg.wordlistsEnabled;

    if (this.cfg.wordlistsEnabled) {
      const wordlistSelect = document.getElementById('wordlistSelect') as HTMLSelectElement;
      const textWordlistSelect = document.getElementById('textWordlistSelect') as HTMLSelectElement;
      dynamicList(
        this.cfg.wordlists,
        wordlistSelect,
        false,
        this.t('options:listsPage.options.addOrUpdateExistingWordlist'),
      );
      dynamicList(
        [this.t('options:listsPage.options.allWordsWordlist')].concat(this.cfg.wordlists),
        textWordlistSelect,
      );
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

    // Workaround for remove filter method
    if (this.filter.cfg.filterWordList && this.filter.cfg.filterMethod === 2) {
      wordlistFilter = new this.Class.Filter();
      // Works because we are only changing a native value (filterMethod: number)
      wordlistFilter.cfg = new this.Class.Config(Object.assign({}, this.cfg, { filterMethod: 0 }));
      wordlistFilter.init();
    }

    const words = Object.keys(this.cfg.words).sort();
    words.unshift(this.t('options:wordsPage.options.addOrUpdateExistingWord'));
    const options = words.map((word) => {
      let filteredWord = word;
      if (word != words[0] && wordlistFilter.cfg.filterWordList) {
        if (wordlistFilter.cfg.words[word].matchMethod === this.Class.Constants.MATCH_METHODS.REGEX) {
          // Regexp
          filteredWord = wordlistFilter.cfg.words[word].sub || wordlistFilter.cfg.defaultSubstitution;
        } else {
          filteredWord = wordlistFilter.replaceText(word, this.Class.Constants.ALL_WORDS_WORDLIST_ID, null);
        }
      }

      const optionElement = document.createElement('option');
      optionElement.value = word === words[0] ? '' : word;
      optionElement.dataset.filtered = filteredWord;
      optionElement.textContent = filteredWord;
      return optionElement;
    });
    wordsSelect.replaceChildren(...options);

    // Dynamically create the wordlist selection checkboxes
    const wordlistOptions = this.cfg.wordlists.map((list, index) => {
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
      return div;
    });
    selections.replaceChildren(...wordlistOptions);

    // Add explanation for when there are no wordlists
    if (!this.cfg.wordlists.length) {
      const anchor = document.createElement('a');
      anchor.href = '#/lists';
      anchor.textContent = this.t('options:wordsPage.notes.wordlistsGettingStarted');
      anchor.addEventListener('click', function (event) {
        event.preventDefault();
        document.getElementById('listsTab').click();
      });
      selections.appendChild(anchor);
    }

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
      this.log.warn(this.t('options:statsPage.lessUsedWords.messages.prepareLessUsedWordsError'), err);
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
        this.log.warn(this.t('options:domainsPage.removeFailed', { domain: domainsSelect.value }), err);
        this.showErrorModal([
          this.t('options:domainsPage.removeFailed', { domain: domainsSelect.value }),
          `Error: ${err.message}`,
        ]);
        return false;
      }
    }
  }

  async removeLessUsedWords() {
    Object.keys(this.lessUsedWords).forEach((word) => {
      this.cfg.removeWord(word);
    });
    await this.cfg.save('words');
    this.populateOptions();
  }

  async removeAllowlist() {
    const allowlist = document.getElementById('allowlistSelect') as HTMLSelectElement;
    const selected = allowlist.selectedOptions[0];
    const originalWord = selected.value;
    const originalCase = selected.dataset.sensitive === 'true' ? 'sensitive' : 'insensitive';
    const originalListName = originalCase === 'sensitive' ? 'wordAllowlist' : 'iWordAllowlist';
    this.cfg[originalListName] = removeFromArray(this.cfg[originalListName], originalWord);

    try {
      await this.cfg.save(originalListName);
      this.filter.init();
      this.populateOptions();
    } catch (err) {
      this.log.warn(this.t('options:listPage.messages.removeWordFromAllowlistFailed', { word: originalWord }), err);
      this.showErrorModal([
        this.t('options:listPage.messages.removeWordFromAllowlistFailed', { word: originalWord }),
        `Error: ${err.message}`,
      ]);
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
        this.log.warn(this.t('options:wordsPage.messages.removeFailed', { word: word }), err);
        this.showErrorModal([
          this.t('options:wordsPage.messages.removeFailed', { word: word }),
          `Error: ${err.message}`,
        ]);
      }
    }
  }

  async removeWordlist() {
    const wordlistSelect = document.getElementById('wordlistSelect') as HTMLSelectElement;
    const wordIndex = wordlistSelect.selectedIndex; // Placeholder adds 1, which helps preserve index 0 for "All Words"
    const cfgIndex = wordIndex - 1;
    const wordlist = this.cfg.wordlists[cfgIndex];
    if (wordlist) {
      // Remove wordlist name
      this.cfg.wordlists.splice(cfgIndex, 1);
      try {
        // Remove wordlist from all words
        const wordKeys = Object.keys(this.cfg.words);
        for (const wordKey of wordKeys) {
          const lists = this.cfg.words[wordKey].lists;
          for (let i = lists.length - 1; i >= 0; i--) {
            if (lists[i] === wordIndex) {
              lists.splice(i, 1); // Remove removed wordlist
            } else if (lists[i] > wordIndex) {
              lists[i] -= 1; // Decrement wordlists after removed wordlist
            }
          }
        }
        await this.cfg.save(['words', 'wordlists']);
        this.populateWordlists();
        this.populateWordPage();
      } catch (err) {
        this.log.warn(this.t('options:listsPage.messages.removeWordlistFailed', { wordlist: wordlist }), err);
        this.showErrorModal([
          this.t('options:listsPage.messages.removeWordlistFailed', { wordlist: wordlist }),
          `Error: ${err.message}`,
        ]);
      }
    }
    const wordlistText = document.getElementById('wordlistText') as HTMLInputElement;
    wordlistText.value = '';
    this.hideInputError(wordlistText);
  }

  async renameWordlist() {
    const wordlistSelect = document.getElementById('wordlistSelect') as HTMLSelectElement;
    const wordlistText = document.getElementById('wordlistText') as HTMLInputElement;
    const name = wordlistText.value.trim();
    const index = wordlistSelect.selectedIndex - 1; // -1 to ignore placeholder, since we don't store "All words" in config

    if (wordlistText.checkValidity()) {
      // Make sure there are no duplicates
      if (this.cfg.wordlists.includes(name)) {
        this.showInputError(wordlistText, this.t('options:listsPage.validations.wordlistNameNotUnique'));
        return false;
      }

      this.cfg.wordlists[index] = name;
      try {
        await this.cfg.save('wordlists');
        this.populateWordlists();
        this.populateWordPage();
      } catch (err) {
        this.handleError(this.t('options:listsPage.messages.renameWordlistFailed'), err);
      }
    } else {
      this.showInputError(wordlistText, this.t('options:listsPage.validations.wordlistNameInvalid'));
    }
  }

  async restoreDefaults(evt: Event = null, silent = false) {
    try {
      await this.cfg.resetPreserveStats();
      if (!silent) this.showStatusModal(this.t('options:configsPage.messages.restoreDefaultsSuccess'));
      await this.init(true);
      return true;
    } catch (err) {
      this.log.warn(this.t('options:configsPage.messages.restoreDefaultsFailed'), err);
      this.showErrorModal([this.t('options:configsPage.messages.restoreDefaultsFailed'), `Error: ${err.message}`]);
      return false;
    }
  }

  async saveDomain() {
    const domainText = document.getElementById('domainText') as HTMLInputElement;
    const newKey = domainText.value.trim().toLowerCase();

    if (newKey == '') {
      // No data
      this.showInputError(domainText, this.t('options:domainsPage.validations.emptyInputError'));
      return false;
    }

    if (domainText.checkValidity()) {
      this.hideInputError(domainText);
      const domainCfg = this.domainCfgFromPage();
      if (!domainCfg) {
        this.showInputError(this.t('options:domainsPage.saveFailedGettingSettings'));
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
        this.showErrorModal([this.t('options:statusModal.messages.saveFailed'), `Error: ${err.message}`]);
        return false;
      }
    } else {
      this.showInputError(domainText, this.t('options:domainsPage.validations.domainExample'));
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
      this.log.warn(this.t('options:statusModal.messages.saveOptionsFailed'), err);
      this.showErrorModal([this.t('options:statusModal.messages.saveOptionsFailed'), `Error: ${err.message}`]);
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
      this.showInputError(allowlistText, this.t('options:listsPage.validations.wordPhraseInvalid'));
      return false;
    }

    if (this.cfg.wordAllowlist.includes(newWord) || this.cfg.iWordAllowlist.includes(newWord)) {
      this.showInputError(allowlistText, this.t('options:listsPage.validations.wordAlreadyAllowed'));
      return false;
    }

    if (allowlistText.checkValidity()) {
      if (selected.value === '') {
        // New word
        this.cfg[newListName].push(newWord);
        propsToSave.push(newListName);
      } else {
        // Modifying existing word
        const originalWord = selected.value;
        const originalCase = selected.dataset.sensitive === 'true' ? 'sensitive' : 'insensitive';
        const originalListName = originalCase === 'sensitive' ? 'wordAllowlist' : 'iWordAllowlist';

        if (originalWord != newWord || originalCase != newCase) {
          this.cfg[originalListName] = removeFromArray(this.cfg[originalListName], originalWord);
          this.cfg[newListName].push(newWord);
          originalListName === newListName
            ? propsToSave.push(newListName)
            : propsToSave.push(originalListName, newListName);
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
          this.log.warn(this.t('options:listsPage.messages.saveAllowlistFailed'), err);
          this.showErrorModal([this.t('options:listsPage.messages.saveAllowlistFailed'), `Error: ${err.message}`]);
          return false;
        }
      }
    } else {
      this.showInputError(allowlistText, this.t('options:listsPage.validations.wordPhraseInvalid'));
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
    const wordlistSelectionsInput = document.querySelectorAll(
      'div#wordlistSelections input',
    ) as NodeListOf<HTMLInputElement>;
    let added = true;
    let word = wordText.value.trim();
    const subCase = booleanToNumber(substitutionCase.checked);
    const sub = numberToBoolean(subCase) ? substitutionText.value.trim() : substitutionText.value.trim().toLowerCase();
    const matchMethod = this.Class.Constants.MATCH_METHODS[selectedMatchMethod.value];

    if (matchMethod !== this.Class.Constants.MATCH_METHODS.REGEX) {
      word = word.toLowerCase();
    }

    if (word == '') {
      this.showInputError(wordText, this.t('options:wordsPage.validations.wordPhraseInvalid'));
      return false;
    }

    // Make sure word and substitution are different
    if (word == sub) {
      this.showInputError(substitutionText, this.t('options:wordsPage.validations.substitutionCollision'));
      return false;
    }

    if (wordText.checkValidity()) {
      const lists = [];
      wordlistSelectionsInput.forEach((wordlist, index) => {
        if (wordlist.checked) {
          lists.push(index + 1);
        }
      });

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
        const subFilter = new this.Class.Filter();
        const words = {};
        words[word] = wordOptions;
        subFilter.cfg = new this.Class.Config(
          Object.assign(
            {},
            this.cfg,
            { filterMethod: this.Class.Constants.FILTER_METHODS.SUBSTITUTE },
            { words: words },
          ),
        );
        subFilter.init();
        const first = subFilter.replaceTextResult(word, this.Class.Constants.ALL_WORDS_WORDLIST_ID, null);
        const second = subFilter.replaceTextResult(first.filtered, this.Class.Constants.ALL_WORDS_WORDLIST_ID, null);
        if (first.filtered != second.filtered) {
          this.showInputError(substitutionText, this.t('options:wordsPage.validations.substitutionContainsWord'));
          return false;
        }
      }

      // Test for a valid Regex
      if (wordOptions.matchMethod === this.Class.Constants.MATCH_METHODS.REGEX) {
        const subFilter = new this.Class.Filter();
        const words = {};
        words[word] = wordOptions;
        subFilter.cfg = new this.Class.Config(Object.assign({}, this.cfg, { words: words }));
        subFilter.init();
        if (subFilter.wordlists[subFilter.wordlistId].regExps.length === 0) {
          this.showInputError(wordText, this.t('options:wordsPage.validations.regexInvalid'));
          return false;
        }
      }

      if (wordList.value === '') {
        // New record
        this.log.info(`Adding new word: '${word}'.`, wordOptions);
        added = this.cfg.addWord(word, wordOptions);
      } else {
        // Updating existing record
        const originalWord = wordList.value;
        if (originalWord == word) {
          // Word options changed
          this.log.info(`Modifying existing word options for '${word}'.`, wordOptions);
          this.cfg.words[word] = wordOptions;
        } else {
          // Existing word modified
          this.log.info(`Rename existing word '${originalWord}' to '${word}'.`, wordOptions);
          added = this.cfg.addWord(word, wordOptions);
          if (added) {
            delete this.cfg.words[originalWord];
          } else {
            this.showInputError(wordText, this.t('options:wordsPage.validations.wordAlreadyListed', { word: word }));
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
          this.log.warn(this.t('options:wordsPage.messages.updateFailed', { word: word }), err);
          this.showErrorModal([
            this.t('options:wordsPage.messages.updateFailed', { word: word }),
            `Error: ${err.message}`,
          ]);
          this.cfg.removeWord(word);
          return false;
        }
      } else {
        this.showInputError(wordText, this.t('options:wordsPage.validations.wordAlreadyListed', { word: word }));
      }
    } else {
      this.showInputError(wordText, this.t('options:validations.wordPhraseInvalid'));
    }
  }

  async selectFilterMethod(filterMethodInput: HTMLInputElement) {
    this.cfg.filterMethod = this.Class.Constants.FILTER_METHODS[filterMethodInput.value];
    try {
      await this.cfg.save('filterMethod');
      this.filter.rebuildWordlists();
      this.populateOptions();
    } catch (err) {
      this.handleError(this.t('options:settingsPage.messages.saveFilterMethodFailed'), err);
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
      this.showErrorModal(this.t('options:listsPage.messages.saveDefaultWordlistFailed'), err);
    }
  }

  setHelpVersion() {
    const helpVersion = document.getElementById('helpVersion') as HTMLAnchorElement;
    helpVersion.textContent = this.cfg._env.version;
  }

  setupEventListeners() {
    this.setupCoreEventListeners();
    this.setupModalEventListeners();
    this.setupSettingsEventListeners();
    this.setupWordsEventListeners();
    this.setupListsEventListeners();
    this.setupDomainsEventListeners();
    this.setupBookmarkletEventListeners();
    this.setupConfigEventListeners();
    this.setupTestEventListeners();
    this.setupStatsEventListeners();
    this.setupHelpEventListeners();
    this.setupThemeEventListeners();
  }

  setupCoreEventListeners() {
    window.addEventListener('DOMContentLoaded', (evt) => {
      this.init();
    });
    document.querySelectorAll('#menu a').forEach((el) => {
      el.addEventListener('click', (evt) => {
        this.switchPage(evt.target as HTMLAnchorElement);
      });
    });
  }

  setupModalEventListeners() {
    document.getElementById('submitPassword').addEventListener('click', (evt) => {
      this.auth.authenticate(evt.target as HTMLButtonElement);
    });
    document.getElementById('confirmModalBackup').addEventListener('click', (evt) => {
      this.confirmModalBackup();
    });
    document.getElementById('confirmModalOK').addEventListener('click', (evt) => {
      this.closeModal('confirmModal');
    });
    document.getElementById('confirmModalCancel').addEventListener('click', (evt) => {
      this.closeModal('confirmModal');
    });
    document.getElementById('statusModalOK').addEventListener('click', (evt) => {
      this.closeModal('statusModal');
    });
    document.getElementById('bulkEditorAddWord').addEventListener('click', (evt) => {
      this.bulkEditorAddRow();
    });
    document.getElementById('bulkEditorAddWords').addEventListener('click', (evt) => {
      this.bulkEditorAddWords();
    });
    document.getElementById('bulkEditorCancel').addEventListener('click', (evt) => {
      this.closeModal('bulkWordEditorModal');
    });
    document.getElementById('bulkEditorSave').addEventListener('click', (evt) => {
      this.confirm('bulkEditorSave');
    });
    document.getElementById('bulkEditorRemoveAll').addEventListener('click', (evt) => {
      this.bulkEditorRemoveAll();
    });
  }

  setupSettingsEventListeners() {
    document.querySelectorAll('#filterMethod input').forEach((el) => {
      el.addEventListener('click', (evt) => {
        this.selectFilterMethod(evt.target as HTMLInputElement);
      });
    });
    document.getElementById('censorCharacterSelect').addEventListener('change', (evt) => {
      this.saveOptions();
    });
    document.getElementById('censorFixedLengthSelect').addEventListener('change', (evt) => {
      this.saveOptions();
    });
    document.getElementById('defaultWordMatchMethodSelect').addEventListener('change', (evt) => {
      this.saveOptions();
    });
    document.getElementById('defaultWordRepeat').addEventListener('click', (evt) => {
      this.saveOptions();
    });
    document.getElementById('defaultWordSeparators').addEventListener('click', (evt) => {
      this.saveOptions();
    });
    document.getElementById('preserveCase').addEventListener('click', (evt) => {
      this.saveOptions();
    });
    document.getElementById('preserveFirst').addEventListener('click', (evt) => {
      this.saveOptions();
    });
    document.getElementById('preserveLast').addEventListener('click', (evt) => {
      this.saveOptions();
    });
    document.getElementById('useDeviceTheme').addEventListener('click', (evt) => {
      this.updateUseSystemTheme(evt.target as HTMLInputElement);
    });
    document.getElementById('showContextMenu').addEventListener('click', (evt) => {
      this.updateContextMenu(evt.target as HTMLInputElement);
    });
    document.getElementById('showCounter').addEventListener('click', (evt) => {
      this.saveOptions();
    });
    document.getElementById('showSummary').addEventListener('click', (evt) => {
      this.saveOptions();
    });
    document.getElementById('showUpdateNotification').addEventListener('click', (evt) => {
      this.saveOptions();
    });
    document.getElementById('filterWordList').addEventListener('click', (evt) => {
      this.filterWordListUpdate();
    });
    document.getElementById('substitutionMark').addEventListener('click', (evt) => {
      this.saveOptions();
    });
    document.getElementById('defaultWordSubstitutionText').addEventListener('change', (evt) => {
      this.saveOptions();
    });
  }

  setupWordsEventListeners() {
    document.getElementById('wordList').addEventListener('change', (evt) => {
      this.populateWord();
    });
    document.getElementById('wordText').addEventListener('input', (evt) => {
      this.hideInputError(evt.target as HTMLInputElement);
    });
    document.getElementById('substitutionText').addEventListener('input', (evt) => {
      this.hideInputError(evt.target as HTMLInputElement);
    });
    document.getElementById('wordSave').addEventListener('click', (evt) => {
      this.saveWord();
    });
    document.getElementById('wordRemove').addEventListener('click', (evt) => {
      this.removeWord(evt.target as HTMLButtonElement);
    });
    document.getElementById('wordRemoveAll').addEventListener('click', (evt) => {
      this.confirm('removeAllWords');
    });
    document.getElementById('bulkWordEditorButton').addEventListener('click', (evt) => {
      this.showBulkWordEditor();
    });
  }

  setupListsEventListeners() {
    document.getElementById('allowlistSelect').addEventListener('change', (evt) => {
      this.populateAllowlistWord();
    });
    document.getElementById('allowlistText').addEventListener('input', (evt) => {
      this.hideInputError(evt.target as HTMLInputElement);
    });
    document.querySelectorAll('input[name="allowlistCase"]').forEach((el) => {
      el.addEventListener('change', (evt) => {
        this.hideInputError(document.getElementById('allowlistText') as HTMLInputElement);
      });
    });
    document.getElementById('allowlistSave').addEventListener('click', (evt) => {
      this.saveAllowlist();
    });
    document.getElementById('allowlistRemove').addEventListener('click', (evt) => {
      this.removeAllowlist();
    });
    document.getElementById('wordlistAdd').addEventListener('click', (evt) => {
      this.addWordlist();
    });
    document.getElementById('wordlistsEnabled').addEventListener('click', (evt) => {
      this.saveOptions();
    });
    document.getElementById('wordlistRemove').addEventListener('click', (evt) => {
      this.confirm('removeWordlist');
    });
    document.getElementById('wordlistRename').addEventListener('click', (evt) => {
      this.renameWordlist();
    });
    document.getElementById('wordlistSelect').addEventListener('change', (evt) => {
      this.populateWordlist();
    });
    document.getElementById('wordlistText').addEventListener('input', (evt) => {
      this.hideInputError(evt.target as HTMLInputElement);
    });
    document.getElementById('textWordlistSelect').addEventListener('change', (evt) => {
      this.setDefaultWordlist(evt.target as HTMLSelectElement);
    });
  }

  setupDomainsEventListeners() {
    document.querySelectorAll('#domainMatchMode input').forEach((el) => {
      el.addEventListener('click', (evt) => {
        this.saveOptions();
      });
    });
    document.getElementById('domainFilterAllFrames').addEventListener('change', (evt) => {
      this.saveOptions();
    });
    document.getElementById('domainSelect').addEventListener('change', (evt) => {
      this.populateDomain();
    });
    document.getElementById('domainText').addEventListener('input', (evt) => {
      this.hideInputError(evt.target as HTMLInputElement);
    });
    document.getElementById('domainSave').addEventListener('click', (evt) => {
      this.saveDomain();
    });
    document.getElementById('domainRemove').addEventListener('click', (evt) => {
      this.removeDomain();
    });
  }

  setupBookmarkletEventListeners() {
    document.querySelectorAll('#bookmarkletConfigInputs input').forEach((el) => {
      el.addEventListener('click', (evt) => {
        this.populateBookmarkletPage();
      });
    });
  }

  setupConfigEventListeners() {
    document.getElementById('configSyncLargeKeys').addEventListener('click', (evt) => {
      this.confirm('convertStorageLocation');
    });
    document.getElementById('configInlineInput').addEventListener('click', (evt) => {
      this.configInlineToggle();
    });
    document.getElementById('importFileInput').addEventListener('change', (evt) => {
      this.importConfigFile(evt.target as HTMLInputElement, (evt.target as HTMLInputElement).files);
    });
    document.getElementById('configReset').addEventListener('click', (evt) => {
      this.confirm('restoreDefaults');
    });
    document.getElementById('configExport').addEventListener('click', (evt) => {
      this.exportConfig();
    });
    document.getElementById('configImport').addEventListener('click', (evt) => {
      this.confirm('importConfig');
    });
    document.getElementById('configLoggingLevelSelect').addEventListener('change', (evt) => {
      this.saveOptions();
    });
    document.getElementById('setPassword').addEventListener('input', (evt) => {
      this.auth.setPasswordButton();
    });
    document.getElementById('setPasswordBtn').addEventListener('click', (evt) => {
      this.confirm('setPassword');
    });
  }

  setupTestEventListeners() {
    document.getElementById('testText').addEventListener('input', (evt) => {
      this.populateTest();
    });
  }

  setupStatsEventListeners() {
    document.getElementById('collectStats').addEventListener('click', (evt) => {
      this.saveOptions();
    });
    document.getElementById('statsExport').addEventListener('click', (evt) => {
      this.exportStats();
    });
    document.getElementById('statsImport').addEventListener('click', (evt) => {
      this.confirm('statsImport');
    });
    document.getElementById('statsImportInput').addEventListener('change', (evt) => {
      this.importStatsFile(evt.target as HTMLInputElement, (evt.target as HTMLInputElement).files);
    });
    document.getElementById('statsReset').addEventListener('click', (evt) => {
      this.confirm('statsReset');
    });
    document.getElementById('lessUsedWordsNumber').addEventListener('input', (evt) => {
      this.hideInputError(evt.target as HTMLInputElement);
    });
    document.getElementById('removeLessUsedWords').addEventListener('click', (evt) => {
      this.confirm('removeLessUsedWords');
    });
  }

  setupHelpEventListeners() {
    document.querySelectorAll('div#helpContainer a').forEach((anchor) => {
      anchor.setAttribute('target', '_blank');
    });
  }

  setupThemeEventListeners() {
    document.getElementsByClassName('themes')[0].addEventListener('click', (evt) => {
      this.toggleTheme();
    });
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
  }

  showBulkWordEditor() {
    const modalId = 'bulkWordEditorModal';
    const tableContainer = document.querySelector(`#${modalId} div.table-container`) as HTMLDivElement;
    const table = tableContainer.querySelector('table') as HTMLTableElement;
    const tHead = table.querySelector('thead') as HTMLTableSectionElement;
    const tHeadRow = tHead.querySelector('tr') as HTMLTableRowElement;
    const tBody = table.querySelector('tbody') as HTMLTableSectionElement;
    tBody.replaceChildren();
    tHeadRow.querySelectorAll('.dynamicHeader').forEach((th) => th.remove());

    // Add wordlists to header
    if (this.cfg.wordlistsEnabled) {
      this.cfg.wordlists.forEach((wordlist, i) => {
        const th = document.createElement('th');
        th.classList.add('dynamicHeader');
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.classList.add('wordlistHeader');
        input.dataset.col = (i + 1).toString();
        input.type = 'checkbox';
        const span = document.createElement('span');
        span.id = `bulkWordEditorWordlist${i + 1}`;
        span.textContent = wordlist;
        label.appendChild(input);
        label.appendChild(span);
        th.appendChild(label);
        tHeadRow.appendChild(th);
      });
    }

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
      el.addEventListener('click', (evt) => {
        this.bulkEditorWordlistCheckbox(evt.target as HTMLInputElement);
      });
    });
    this.openModal(modalId);
  }

  async statsReset() {
    try {
      await this.Class.Config.removeLocalStorage('stats');
      this.populateStats();
    } catch (err) {
      this.log.warn(this.t('options:statsPage.messages.resetFailed'), err);
      this.showErrorModal([this.t('options:statsPage.messages.resetFailed'), `Error: ${err.message}`]);
    }
  }

  showErrorModal(
    content: string | string[] = [this.t('options:statusModal.messages.error')],
    title = this.t('options:statusModal.headers.error'),
    titleColor = 'w3-red',
  ) {
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

  showStatusModal(
    content: string | string[] = [this.t('options:statusModal.messages.status')],
    title = this.t('options:statusModal.headers.status'),
    titleColor = 'w3-flat-peter-river',
  ) {
    this.configureStatusModal(content, title, titleColor);
    this.openModal('statusModal');
  }

  showWarningModal(
    content: string | string[] = [this.t('options:statusModal.messages.warning')],
    title = this.t('options:statusModal.headers.warning'),
    titleColor = 'w3-orange',
  ) {
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
    this.cfg.enabledDomainsOnly = domainMatchMode.value === 'minimal';
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
      this.handleError(this.t('options:settingsPage.messages.saveThemeFailed'), err);
    }
  }

  validateLessUsedWordsNumber() {
    const lessUsedWordsNumber = document.getElementById('lessUsedWordsNumber') as HTMLInputElement;
    let valid = false;
    this.hideInputError(lessUsedWordsNumber);
    if (lessUsedWordsNumber.value.match(/^\d+$/) && parseInt(lessUsedWordsNumber.value) > 0) {
      valid = true;
    } else {
      this.showInputError(lessUsedWordsNumber, this.t('options:statsPage.validations.lessUsedWordsInvalid'));
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
