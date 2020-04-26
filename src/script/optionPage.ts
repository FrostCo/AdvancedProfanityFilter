import { dynamicList, escapeHTML, exportToFile, readFile, removeFromArray } from './lib/helper';
import WebConfig from './webConfig';
import Filter from './lib/filter';
import OptionAuth from './optionAuth';
import DataMigration from './dataMigration';
import Bookmarklet from './bookmarklet';
import WebAudio from './webAudio';

export default class OptionPage {
  _bulkWordMatchMethodHTML: string;
  cfg: WebConfig;
  auth: OptionAuth;

  static readonly activeClass = 'w3-flat-belize-hole';

  static closeModal(id: string) {
    OptionPage.hide(document.getElementById(id));
  }

  static configureConfirmModal(content = 'Are you sure?', title = 'Please Confirm', titleColor = 'w3-flat-peter-river') {
    let modalTitle = document.getElementById('confirmModalTitle') as HTMLElement;
    let modalContent = document.getElementById('confirmModalContent') as HTMLElement;
    let modalHeader = document.querySelector('#confirmModal header') as HTMLElement;
    modalTitle.innerText = title;
    modalContent.innerHTML = content;
    modalHeader.className = `w3-container ${titleColor}`;
  }

  static configureStatusModal(content: string, title: string, titleColor: string) {
    let modalTitle = document.getElementById('statusModalTitle') as HTMLElement;
    let modalContent = document.getElementById('statusModalContent') as HTMLElement;
    let modalHeader = document.querySelector('#statusModal header') as HTMLElement;
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

  async advancedDomainRemove(evt) {
    if (evt.target.classList.contains('disabled')) return false;
    let advDomains = document.getElementById('advDomainSelect') as HTMLInputElement;
    option.cfg['advancedDomains'].splice(option.cfg['advancedDomains'].indexOf(advDomains.value), 1);
    if (await option.saveProp('advancedDomains')) this.advancedDomainList();
  }

  async advancedDomainSave(evt) {
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
      if (await option.saveProp('advancedDomains')) this.advancedDomainList();
    }
  }

  bulkEditorAddRow(word: string = '', data: WordOptions | undefined = undefined) {
    let table = document.querySelector('#bulkWordEditorModal table#bulkEditorTable') as HTMLTableElement;
    let wordlistCells = [];
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
    let row = table.insertRow();
    row.classList.add('bulkWordRow');
    let cellDeleteWord = row.insertCell(0);
    let cellWord = row.insertCell(1);
    let cellSub = row.insertCell(2);
    let cellMatchMethod = row.insertCell(3);
    let cellRepeat = row.insertCell(4);
    let cellSeparators = row.insertCell(5);
    option.cfg.wordlists.forEach((wordlist, index) => { wordlistCells.push(row.insertCell(index + 6)); });
    cellDeleteWord.innerHTML = '<button>X</button>';
    cellWord.innerHTML = '<input type="text" class="bulkAddWordText">';
    cellSub.innerHTML = '<input type="text">';
    cellMatchMethod.innerHTML = option._bulkWordMatchMethodHTML;
    cellRepeat.innerHTML = '<input type="checkbox" name="repeat">';
    cellSeparators.innerHTML = '<input type="checkbox" name="separators">';
    wordlistCells.forEach((cell, index) => {
      cell.innerHTML = `<input type="checkbox" name="wordlists" class="wordlistData" data-col="${index + 1}">`;
    });

    // Populate data
    (cellWord.querySelector('input') as HTMLInputElement).value = word;
    (cellSub.querySelector('input') as HTMLInputElement).value = data.sub;
    (cellMatchMethod.querySelector('select') as HTMLSelectElement).selectedIndex = data.matchMethod;
    (cellRepeat.querySelector('input') as HTMLInputElement).checked = data.repeat;
    (cellSeparators.querySelector('input') as HTMLInputElement).checked = data.separators;
    wordlistCells.forEach((cell, index) => {
      (cell.querySelector('input') as HTMLInputElement).checked = data.lists.includes(index + 1);
    });

    // Scroll to the bottom if this is a new word row
    if (word === '') {
      table.parentElement.scrollTop = table.parentElement.scrollHeight - table.parentElement.clientHeight;
      cellWord.querySelector('input').focus();
    }
  }

  bulkEditorAddWords() {
    let bulkAddWordsText = document.querySelector('#bulkWordEditorModal textarea#bulkAddWordsText') as HTMLTextAreaElement;
    let text = bulkAddWordsText.value;
    if (text != '') {
      let table = document.querySelector('#bulkWordEditorModal table#bulkEditorTable') as HTMLTableElement;
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

  bulkEditorCurrentWords() {
    let table = document.querySelector('#bulkWordEditorModal table#bulkEditorTable') as HTMLTableElement;
    let words = [];
    table.querySelectorAll('tr > td > input.bulkAddWordText').forEach((wordText: HTMLInputElement, index) => {
      words.push(wordText.value);
    });
    return words;
  }

  bulkEditorRemoveRow(event) {
    let table = document.querySelector('#bulkWordEditorModal table#bulkEditorTable') as HTMLTableElement;
    let row = event.target.parentElement.parentElement;
    table.deleteRow(row.rowIndex);
  }

  async bulkEditorSave() {
    let table = document.querySelector('#bulkWordEditorModal table#bulkEditorTable') as HTMLTableElement;
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

    let error = await option.cfg.save('words');
    error ? OptionPage.showErrorModal('Failed to save.') : OptionPage.showStatusModal('Words saved successfully.');
  }

  bulkEditorWordlistCheckbox(event) {
    let checked = (event.target as HTMLInputElement).checked;
    document.querySelectorAll(`#bulkWordEditorModal table td input.wordlistData[data-col="${event.target.dataset.col}"]`).forEach((box: HTMLInputElement) => {
      box.checked = checked;
    });
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

    switch(action) {
      case 'bulkEditorSave':
        OptionPage.configureConfirmModal('Are you sure you want to save these changes?');
        ok.addEventListener('click', bulkEditorSave);
        break;
      case 'importConfig': {
        OptionPage.configureConfirmModal('Are you sure you want to overwrite your existing settings?');
        ok.addEventListener('click', importConfig);
        break;
      }
      case 'removeAllWords':
        OptionPage.configureConfirmModal('Are you sure you want to remove all words?<br><br><i>(Note: The default words will return if no words are added.)</i>');
        ok.addEventListener('click', removeAllWords);
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

  createBookmarklet() {
    let bookmarkletLink = document.getElementById('bookmarkletLink') as HTMLAnchorElement;
    let bookmarkletHostedURLInput = document.getElementById('bookmarkletHostedURL') as HTMLInputElement;
    OptionPage.hideInputError(bookmarkletHostedURLInput);

    if (bookmarkletHostedURLInput.checkValidity()) {
      let bookmarkletHostedURL = bookmarkletHostedURLInput.value;
      let bookmarklet = new Bookmarklet(bookmarkletHostedURL);
      bookmarkletLink.href = bookmarklet.destination();
      OptionPage.enableBtn(bookmarkletLink);
    } else {
      OptionPage.showInputError(bookmarkletHostedURLInput, 'Please enter a valid URL.');
      bookmarkletLink.href = '#';
      OptionPage.disableBtn(bookmarkletLink);
      return false;
    }
  }

  domainList() {
    let mode = this.cfg.enabledDomainsOnly ? 'enabledDomains' : 'disabledDomains';
    let domainMode = document.querySelector(`input[name=domainMode][value='${mode}']`) as HTMLInputElement;
    let domains = document.getElementById('domainSelect') as HTMLInputElement;
    domainMode.checked = true;

    let domainListHTML = '<option selected value="">Add...</option>';
    this.cfg[domainMode.value].forEach(domain => { domainListHTML += `<option value="${domain}">${domain}</option>`; });
    domains.innerHTML = domainListHTML;
    this.domainPopulate();
  }

  domainPopulate() {
    let domains = document.getElementById('domainSelect') as HTMLInputElement;
    let domainText = document.getElementById('domainText') as HTMLInputElement;
    let disabledDomainRemove = document.getElementById('domainRemove') as HTMLInputElement;
    OptionPage.hideInputError(domainText);
    domains.value !== '' ? OptionPage.enableBtn(disabledDomainRemove) : OptionPage.disableBtn(disabledDomainRemove);
    domainText.value = domains.value;
  }

  async domainRemove(evt) {
    if (evt.target.classList.contains('disabled')) return false;
    let domainMode = document.querySelector('input[name="domainMode"]:checked') as HTMLInputElement;
    let domains = document.getElementById('domainSelect') as HTMLInputElement;
    option.cfg[domainMode.value].splice(option.cfg['disabledDomains'].indexOf(domains.value), 1);
    if (await option.saveProp(domainMode.value)) this.domainList();
  }

  async domainSave(evt) {
    let domainMode = document.querySelector('input[name="domainMode"]:checked') as HTMLInputElement;
    let domains = document.getElementById('domainSelect') as HTMLInputElement;
    let domainText = document.getElementById('domainText') as HTMLInputElement;
    let invalidMessage = 'Valid domain example: google.com or www.google.com';
    let success;
    if (domains.value == '') { // New record
      success = option.updateItemList(evt, domainText, domainMode.value, invalidMessage);
    } else { // Updating existing record
      success = option.updateItemList(evt, domainText, domainMode.value, invalidMessage, domains.value);
    }

    if (success) {
      if (await option.saveProp(domainMode.value)) this.domainList();
    }
  }

  async exportBookmarkletFile() {
    let code = await Bookmarklet.injectConfig(option.cfg);
    exportToFile(code, 'apfBookmarklet.js');
  }

  exportConfig() {
    let input = document.getElementById('configInlineInput') as HTMLInputElement;

    if (input.checked) { // inline editor
      let configText = document.getElementById('configText') as HTMLTextAreaElement;
      configText.value = JSON.stringify(option.cfg.ordered(), null, 2);
    } else {
      let date = new Date;
      let today = `${date.getUTCFullYear()}-${('0'+(date.getUTCMonth()+1)).slice(-2)}-${('0'+(date.getUTCDate()+1)).slice(-2)}`;
      exportToFile(JSON.stringify(option.cfg.ordered(), null, 2), `apf-backup-${today}.json`);
    }
  }

  async importConfig(e) {
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
    // @ts-ignore: Type WebConfig is not assignable to type Config
    filter.cfg = self.cfg;

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

  populateConfig() {
    this.auth.setPasswordButton(option);
  }

  async populateOptions() {
    filter.init();
    this.populateSettings();
    this.populateWordsList();
    this.populateWhitelist();
    this.populateWordlists();
    this.advancedDomainList();
    this.domainList();
    this.populateAudio();
    this.populateConfig();
    this.populateTest();
  }

  populateSettings() {
    this.updateFilterOptions();

    // Settings
    let selectedFilter = document.getElementById(`filter${WebConfig._filterMethodNames[option.cfg.filterMethod]}`) as HTMLInputElement;
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
    let defaultWordMatchMethodSelectHTML = '';
    for(let i = 0; i < WebConfig._matchMethodNames.slice(0,-1).length; i++) {
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
      filteredTestText.innerText = filter.replaceText(testText.value, filter.cfg.wordlistId, false);
    }
  }

  populateWhitelist() {
    let regExp = RegExp(' [*]$');
    let sensitiveList = filter.cfg.wordWhitelist.map((item) => { return item + ' *'; });
    let list = [].concat(sensitiveList, filter.cfg.iWordWhitelist).sort();
    let whitelist = document.getElementById('whitelist') as HTMLSelectElement;
    let whitelistHTML = '<option selected value="">Add...</option>';
    list.forEach((item) => {
      whitelistHTML += `<option value="${item.replace(regExp, '')}" data-sensitive="${regExp.test(item)}">${escapeHTML(item)}</option>`;
    });
    whitelist.innerHTML = whitelistHTML;
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

    if (word == '') { // New word
      wordText.value = '';
      OptionPage.disableBtn(wordRemove);
      let selectedMatchMethod = document.getElementById(`wordMatch${WebConfig._matchMethodNames[option.cfg.defaultWordMatchMethod]}`) as HTMLInputElement;
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
      let selectedMatchMethod = document.getElementById(`wordMatch${WebConfig._matchMethodNames[wordCfg.matchMethod]}`) as HTMLInputElement;
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
      dynamicList(this.cfg.wordlists, wordlistSelect.id);
      dynamicList(WebConfig._allWordlists.concat(this.cfg.wordlists), textWordlistSelect.id);
      wordlistSelect.selectedIndex = selectedIndex;
      textWordlistSelect.selectedIndex = this.cfg.wordlistId;

      if (this.cfg.muteAudio) {
        dynamicList(WebConfig._allWordlists.concat(this.cfg.wordlists), audioWordlistSelect.id);
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
      if (filter.cfg.filterWordList) {
        if (filter.cfg.words[word].matchMethod == 4) { // Regexp
          filteredWord = filter.cfg.words[word].sub || filter.cfg.defaultSubstitution;
        } else {
          filteredWord = filter.replaceText(word, 0, false); // Using 0 (All) here to filter all words
        }
      }

      wordListHTML += `<option value="${word}" data-filtered="${filteredWord}">${escapeHTML(filteredWord)}</option>`;
    });

    // Workaround for Remove filter (use censor)
    if (filterMethod === 2) {
      filter.cfg.filterMethod = filterMethod;
      filter.init();
    }

    // Populate the wordlist selections for a word
    let wordlistSelectionHTML = '';
    option.cfg.wordlists.forEach(function(list, index) {
      wordlistSelectionHTML += `<label><input id="" type="checkbox" class="w3-check" name="wordlistSelection" value="${index}"/> ${list}</label><br>`;
    });
    let selections = document.getElementById('wordlistSelections') as HTMLInputElement;
    selections.innerHTML = wordlistSelectionHTML;
    wordList.innerHTML = wordListHTML;
    this.populateWord();
  }

  removeAllWords(evt) {
    this.cfg.words = {};
    let wordList = document.getElementById('wordList') as HTMLSelectElement;
    wordList.selectedIndex = 0;
    this.populateWordsList();
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
      whitelist.selectedIndex = 0;
      this.populateWhitelist();
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
        this.populateWordsList();
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
        this.populateWordsList();
      } else {
        OptionPage.showErrorModal('Failed to save name.');
      }
    } else {
      OptionPage.showInputError(wordlistText, 'Please enter a valid name.');
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
    self.cfg.enabledDomainsOnly = (domainMode.value == 'enabledDomains');
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
          whitelist.selectedIndex = 0;
          this.populateWhitelist();
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
    // TODO: More in-depth checking might be needed
    if (word == sub) {
      OptionPage.showInputError(substitutionText, 'Word and substitution must be different.');
      return false;
    }

    if (wordText.checkValidity()) {
      let lists = [];
      wordlistSelectionsInput.forEach((wordlist, index) => { if (wordlist.checked) { lists.push(index + 1); } });

      let wordOptions: WordOptions = {
        lists: lists,
        matchMethod: WebConfig._matchMethodNames.indexOf(selectedMatchMethod.value),
        repeat: wordMatchRepeated.checked,
        separators: wordMatchSeparators.checked,
        sub: sub
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
    if (await option.saveProp('filterMethod')) this.init();
  }

  async setActiveWordlist(element: HTMLSelectElement) {
    let prop = element.id === 'textWordlistSelect' ? 'wordlistId' : 'audioWordlistId';
    this.cfg[prop] = element.selectedIndex;

    if (!await this.saveProp(prop)) {
      OptionPage.showErrorModal('Failed to update active list.');
      return false;
    }

    this.populateOptions();
  }

  showBulkWordEditor() {
    let modalId = 'bulkWordEditorModal';
    let title = document.querySelector(`#${modalId} h5.modalTitle`) as HTMLHeadingElement;
    let tableContainer = document.querySelector(`#${modalId} div.tableContainer`) as HTMLDivElement;
    let thead = '<thead><tr><th><span>Remove</span></th><th><span>Word</span></th><th><span>Substitution</span></th><th><span>Match Method</span></th><th><span>Repeated</span></th><th><span>Separators</span></th>';
    this.cfg.wordlists.forEach((wordlist, i) => { thead += `<th><label><input type="checkbox" class="wordlistHeader" data-col="${i + 1}"><span> ${wordlist}</span></label></th>`; });
    thead += '</tr></thead>';
    title.textContent = 'Bulk Word Editor';
    tableContainer.innerHTML = `<table id="bulkEditorTable" class="w3-table-all w3-tiny">${thead}</table>`;

    // Store the select list for match method (used in each row)
    option._bulkWordMatchMethodHTML = '<select>';
    WebConfig._matchMethodNames.forEach((name, index) => {
      option._bulkWordMatchMethodHTML += `<option value="${index}" class="bulkMatchMethod${index}">${name}</option>`;
    });
    option._bulkWordMatchMethodHTML += '</select>';

    // Add current words to the table
    Object.keys(option.cfg.words).forEach((key, index) => {
      option.bulkEditorAddRow(key, option.cfg.words[key]);
    });

    document.querySelectorAll('#menu a').forEach(el => { el.addEventListener('click', e => { option.switchPage(e); }); });
    tableContainer.querySelectorAll('th input.wordlistHeader').forEach(el => { el.addEventListener('click', e => { option.bulkEditorWordlistCheckbox(e); }); });
    OptionPage.openModal(modalId);
  }

  showSupportedAudioSites() {
    let title = document.querySelector('#supportedAudioSitesModal h5.modalTitle') as HTMLHeadingElement;
    let contentLeft = document.querySelector('#supportedAudioSitesModal div#modalContentLeft') as HTMLDivElement;
    let contentRight = document.querySelector('#supportedAudioSitesModal div#modalContentRight') as HTMLDivElement;
    let sites = [];
    let sortedSites = Object.keys(WebAudio.sites).sort(function(a,b) {
      let domainA = a.match(/\w*\.\w*$/)[0];
      let domainB = b.match(/\w*\.\w*$/)[0];
      return domainA < domainB ? -1 : domainA > domainB ? 1 : 0;
    });
    sortedSites.forEach(site => {
      sites.push(`<li><a href="https://${site}" target="_blank">${site}</a></li>`);
    });
    title.textContent = 'Supported Audio Sites';
    contentLeft.innerHTML = `<ul>${sites.join('\n')}</ul>`;
    contentRight.innerHTML = `
      <h4 class="sectionHeader">Site Config</h4>
      <textarea class="w3-input w3-border w3-card" spellcheck="false" readonly>${JSON.stringify(WebAudio.sites, null, 2)}</textarea>
    `;
    OptionPage.openModal('supportedAudioSitesModal');
  }

  switchPage(evt) {
    let currentTab = document.querySelector(`#menu a.${OptionPage.activeClass}`) as HTMLElement;
    let newTab = evt.target as HTMLElement;
    if (newTab.classList.contains('donationTab')) { return false; }

    currentTab.classList.remove(OptionPage.activeClass);
    newTab.classList.add(OptionPage.activeClass);

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
        OptionPage.hide(document.getElementById('wordSubstitution'));
        break;
      case 1: // Substitution
        OptionPage.hide(document.getElementById('censorSettings'));
        OptionPage.show(document.getElementById('substitutionSettings'));
        OptionPage.show(document.getElementById('wordSubstitution'));
        break;
      case 2: // Remove
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
document.getElementById('textWordlistSelect').addEventListener('change', e => { option.setActiveWordlist(e.target as HTMLSelectElement); });
document.getElementById('audioWordlistSelect').addEventListener('change', e => { option.setActiveWordlist(e.target as HTMLSelectElement); });
// Domains
document.getElementById('advDomainSelect').addEventListener('change', e => { option.advancedDomainPopulate(); });
document.getElementById('advDomainText').addEventListener('input', e => { OptionPage.hideInputError(e.target); });
document.getElementById('advDomainSave').addEventListener('click', e => { option.advancedDomainSave(e); });
document.getElementById('advDomainRemove').addEventListener('click', e => { option.advancedDomainRemove(e); });
document.querySelectorAll('#domainMode input').forEach(el => { el.addEventListener('click', e => { option.saveOptions(e); }); });
document.getElementById('domainSelect').addEventListener('change', e => { option.domainPopulate(); });
document.getElementById('domainText').addEventListener('input', e => { OptionPage.hideInputError(e.target); });
document.getElementById('domainSave').addEventListener('click', e => { option.domainSave(e); });
document.getElementById('domainRemove').addEventListener('click', e => { option.domainRemove(e); });
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
document.getElementById('bookmarkletFile').addEventListener('click', e => { option.exportBookmarkletFile(); });
document.getElementById('bookmarkletHostedURL').addEventListener('input', e => { option.createBookmarklet(); });
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