namespace options {
/// <reference path="defaults.ts" />
/// <reference path="helpers.ts" />
let Helper = Helpers;
let Default = Defaults;

interface Config {
  censorCharacter: String,
  censorFixedLength: Number,
  defaultSubstitutions: String[],
  disabledDomains: String[],
  filterMethod: Number,
  globalMatchMethod: Number,
  password: String,
  preserveFirst: Boolean,
  preserveLast: Boolean,
  showCounter: Boolean,
  substitutionMark: Boolean,
  words: {
      matchMethod: Number,
      words: String[]
  }
}

var authenticated = false;
let config: Config = Defaults.defaults;

// var defaults = {
//   "censorCharacter": "*",
//   "censorFixedLength": 0,
//   "defaultSubstitutions": ["censored", "expletive", "filtered"],
//   "disabledDomains": [],
//   "filterMethod": 0, // ["Censor", "Substitute", "Remove"];
//   "globalMatchMethod": 3, // ["Exact", "Partial", "Whole", "Per-Word", "RegExp"]
//   "password": null,
//   "preserveFirst": false,
//   "preserveLast": false,
//   "showCounter": true,
//   "substitutionMark": true,
//   "words": {}
// };
// var defaultWords = {
//   "ass": {"matchMethod": 0, "words": ["butt", "tail"] },
//   "asses": {"matchMethod": 0, "words": ["butts"] },
//   "asshole": {"matchMethod": 1, "words": ["butthole", "jerk"] },
//   "bastard": {"matchMethod": 1, "words": ["imperfect", "impure"] },
//   "bitch": {"matchMethod": 1, "words": ["jerk"] },
//   "cunt": {"matchMethod": 1, "words": ["explative"] },
//   "damn": {"matchMethod": 1, "words": ["dang", "darn"] },
//   "fuck": {"matchMethod": 1, "words": ["freak", "fudge"] },
//   "piss": {"matchMethod": 1, "words": ["pee"] },
//   "pissed": {"matchMethod": 0, "words": ["ticked"] },
//   "slut": {"matchMethod": 1, "words": ["imperfect", "impure"] },
//   "shit": {"matchMethod": 1, "words": ["crap", "crud", "poop"] },
//   "tits": {"matchMethod": 1, "words": ["explative"] },
//   "whore": {"matchMethod": 1, "words": ["harlot", "tramp"] }
// };
var filterMethods = ["Censor", "Substitute", "Remove"];
var matchMethods = ["Exact Match", "Partial Match", "Whole Match", "Per-Word Match", "Regular Expression"];

function activate(element) {
  element.classList.add('active');
}

function arrayContains(array, string) {
  return (array.indexOf(string) > -1);
}

function authenticate() {
  let passwordInput = document.getElementById('password') as HTMLInputElement;
  if (passwordInput.value == config.password) {
    authenticated = true;
    hide(document.getElementById('passwordContainer'));
    show(document.getElementById('main'));
  }
}

function censorCharacter(event) {
  let censorCharacterSelect = document.getElementById('censorCharacterSelect') as HTMLSelectElement;
  config.censorCharacter = censorCharacterSelect.value;
  saveOptions(event, config);
}

function censorFixedLength(event) {
  let censorFixedLengthSelect = document.getElementById('censorFixedLengthSelect') as HTMLSelectElement;
  config.censorFixedLength = censorFixedLengthSelect.selectedIndex;
  saveOptions(event, config);
}

// Prompt for confirmation
function confirm(event, action) {
  // TODO: Don't confirm if Firefox
  if (/Chrome/.exec(navigator.userAgent)) {
    var dialogContainer = document.getElementById('dialogContainer');
    dialogContainer.innerHTML = '<dialog id="promptDialog">Are you sure?<br><button id="confirmYes">Yes</button><button id="confirmNo">No</button></dialog>';
    var dialog = document.getElementById("promptDialog") as HTMLDialogElement;

    document.getElementById('confirmNo').addEventListener("click", function() {
      this.removeEventListener('click', arguments.callee, false);
      dialog.close();
    })
    document.getElementById('confirmYes').addEventListener("click", function() {
      this.removeEventListener('click', arguments.callee, false);
      if (action == 'importConfig') {
        importConfig(event);
      } else if (action == 'restoreDefaults') {
        restoreDefaults();
      }
      dialog.close();
    })

    dialog.showModal();
  } else {
    if (action == 'importConfig') {
      importConfig(event);
    } else if (action == 'restoreDefaults') {
      restoreDefaults();
    }
  }
}

function deactivate(element) {
  element.classList.remove('active');
}

function domainAdd(event) {
  let domainInput = document.getElementById('domainText') as HTMLInputElement;
  if (domainInput.value != "") {
    if (domainInput.checkValidity()) {
      if (!arrayContains(config.disabledDomains, domainInput.value)) {
        config.disabledDomains.push(domainInput.value);
        config.disabledDomains = config.disabledDomains.sort();
        saveOptions(event, config);
        domainInput.value = "";
      } else {
        updateStatus('Domain already in list.', true, 3000);
      }
    } else {
      updateStatus("Invalid domain, please only provide the domain name.", true, 5000);
    }
  }
}

function domainRemove(event) {
  let domainSelect = document.getElementById('domainSelect') as HTMLSelectElement;
  if (domainSelect.value != "") {
    config.disabledDomains = removeFromArray(config.disabledDomains, domainSelect.value);
    saveOptions(event, config);
  }
}

function exportConfig() {
  // TODO: To let people migrate from wordList to words, return all keys (null)
  chrome.storage.sync.get(null, function(settings) {
    if (Object.keys(settings).length === 0 && settings.constructor === Object) {
      settings = defaults;
    }
    let configText = document.getElementById('configText') as HTMLTextAreaElement;
    configText.value = JSON.stringify(settings, null, 2);
  });
}

function filterMethodSelect(event) {
  let filterMethodSelectEm = document.getElementById('filterMethodSelect') as HTMLSelectElement;
  config.filterMethod = filterMethodSelectEm.selectedIndex;
  saveOptions(event, config);
}

function globalMatchMethod(event) {
  let globalMatchMethodSelect = document.getElementById('globalMatchMethodSelect') as HTMLSelectElement;
  config.globalMatchMethod = globalMatchMethodSelect.selectedIndex;
  saveOptions(event, config);
}

function hide(element) {
  element.classList.remove('visible');
  element.classList.add('hidden');
}

function importConfig(event) {
  try {
    let configText = document.getElementById('configText') as HTMLTextAreaElement;
    let settings = JSON.parse(configText.value);
    saveOptions(event, settings);
  } catch (e) {
    updateStatus('Settings not saved! Please try again.', true, 5000);
  }
}

// TODO: Migrate wordList to new words object
function migrateWordList() {
  chrome.storage.sync.get('wordList', function(storage) {
    var wordListStr = storage.wordList;

    if (wordListStr != undefined && wordListStr != '') {
      var word = '';
      var wordList = wordListStr.split(',');

      try {
        // Migrate to new words object
        for (let i = 0; i < wordList.length; i++) {
          word = wordList[i];
          if (word != "") {
            if (!arrayContains(Object.keys(config.words), word)) {
              console.log('Migrating word: ' + word);
              config.words[word] = {"matchMethod": 0, "words": []};
            } else {
              console.log('Word already in list: ' + word);
            }
          }
        }

        // Remove wordList if successful
        console.log(wordListStr, wordList);
        saveOptions(undefined, config);
        chrome.storage.sync.remove('wordList');
      }
      catch(error) {
        console.log('Error: Aborting wordList migration!', error);
      }
    }
  });
}

// Switching Tabs
function openTab(event) {
  // Don't run on current tab
  if ( event.currentTarget.className.indexOf('active') >= 0) {
    return false;
  }

  // Set active tab
  let oldTab = document.getElementsByClassName("tablinks active")[0];
  deactivate(oldTab);
  activate(event.currentTarget);

  // Show active tab content
  let oldTabContent = document.getElementsByClassName("tabcontent visible")[0];
  hide(oldTabContent);
  let newTabName = event.currentTarget.innerText;
  show(document.getElementById(newTabName));
}

// Restores form state to saved values from Chrome Storage
function populateOptions() {
  chrome.storage.sync.get(defaults, function(settings) {
    config = settings; // Make config globally available
    migrateWordList(); // TODO: Migrate wordList
    if (Object.keys(config.words).length === 0 && config.words.constructor === Object) {
      config.words = Default.words; // defaultWords;
      saveOptions(null, config);
      return false;
    }

    // console.log('Password:', config.password, 'Authenticated:', authenticated); // DEBUG Password
    if (config.password && !authenticated) {
      // console.log('Prompt for password'); // DEBUG Password
      hide(document.getElementById('main'));
      show(document.getElementById('passwordContainer'));
    }

    // Show/hide censor options and word substitutions based on filter method
    Helper.dynamicList(filterMethods, 'filterMethodSelect');
    let filterMethodSelect = document.getElementById('filterMethodSelect') as HTMLSelectElement;
    filterMethodSelect.selectedIndex = settings.filterMethod;
    switch (settings.filterMethod) {
      case 0:
        show(document.getElementById('optionsCensor'));
        hide(document.getElementById('optionsSubstitution'));
        show(document.getElementById('globalMatchMethod'));
        hide(document.getElementById('wordSubstitutions'));
        break;
      case 1:
        hide(document.getElementById('optionsCensor'));
        show(document.getElementById('optionsSubstitution'));
        show(document.getElementById('globalMatchMethod'));
        show(document.getElementById('wordSubstitutions'));
        break;
      case 2:
        hide(document.getElementById('optionsCensor'));
        hide(document.getElementById('optionsSubstitution'));
        hide(document.getElementById('globalMatchMethod'));
        hide(document.getElementById('wordSubstitutions'));
        break;
    }

    // Hide per-word matching options if not selected globally (always show for Remove filter method)
    if (settings.globalMatchMethod == 3 || settings.filterMethod == 2) {
      show(document.getElementById('wordMatchMethodContainer'));
    } else {
      hide(document.getElementById('wordMatchMethodContainer'));
    }

    // Settings
    let censorFixedLengthSelect = document.getElementById('censorFixedLengthSelect') as HTMLSelectElement;
    let censorCharacterSelect = document.getElementById('censorCharacterSelect') as HTMLSelectElement;
    let preserveFirst = document.getElementById('preserveFirst') as HTMLInputElement;
    let preserveLast = document.getElementById('preserveLast') as HTMLInputElement;
    let substitutionMark = document.getElementById('substitutionMark') as HTMLInputElement;
    let showCounter = document.getElementById('showCounter') as HTMLInputElement;
    let globalMatchMethodSelect = document.getElementById('globalMatchMethodSelect') as HTMLSelectElement;

    censorFixedLengthSelect.selectedIndex = settings.censorFixedLength;
    censorCharacterSelect.value = settings.censorCharacter;
    preserveFirst.checked = settings.preserveFirst;
    preserveLast.checked = settings.preserveLast;
    substitutionMark.checked = settings.substitutionMark;
    showCounter.checked = settings.showCounter;
    Helper.dynamicList(matchMethods.slice(0, -1), 'globalMatchMethodSelect');
    globalMatchMethodSelect.selectedIndex = settings.globalMatchMethod;
    // Words
    Helper.dynamicList(Object.keys(config.words).sort(), 'wordSelect', 'Words to Filter');
    Helper.dynamicList([], 'substitutionSelect', 'Substitutions');
    Helper.dynamicList([], 'wordMatchMethodSelect', 'Select a Word');
    // Domains
    Helper.dynamicList(settings.disabledDomains, 'domainSelect', 'Disabled Domains');
  });
}

function removeFromArray(array, element) {
  return array.filter(e => e !== element);
}

// Restore default settings
function restoreDefaults() {
  exportConfig();
  chrome.storage.sync.clear(function(){
    if (chrome.runtime.lastError) {
      updateStatus('Error restoring defaults!', true, 5000);
    } else {
      populateOptions();
      updateStatus('Default settings restored!', false, 3000);
    }
  });
}

// Saves options to sync storage
function saveOptions(event, settings?) {
  // Gather current settings
  let preserveFirst = document.getElementById('preserveFirst') as HTMLInputElement;
  let preserveLast = document.getElementById('preserveLast') as HTMLInputElement;
  let showCounter = document.getElementById('showCounter') as HTMLInputElement;
  let substitutionMark = document.getElementById('substitutionMark') as HTMLInputElement;

  if (settings === undefined) {
    settings = {};
    settings.preserveFirst = preserveFirst.checked;
    settings.preserveLast = preserveLast.checked;
    settings.showCounter = showCounter.checked;
    settings.substitutionMark = substitutionMark.checked;
  }

  // Save settings
  chrome.storage.sync.set(settings, function() {
    if (chrome.runtime.lastError) {
      updateStatus('Settings not saved! Please try again.', true, 5000);
    } else {
      populateOptions();
    }
  });
}

function setPassword() {
  var password = document.getElementById('setPassword') as HTMLInputElement;
  if (password.value == '') {
    chrome.storage.sync.remove('password');
  } else {
    chrome.storage.sync.set({password: password.value});
    password.value = '';
  }
}

function show(element) {
  element.classList.remove('hidden');
  element.classList.add('visible');
}

function substitutionAdd(event) {
  let wordSelect = document.getElementById('wordSelect') as HTMLSelectElement;
  let substitutionText = document.getElementById('substitutionText') as HTMLInputElement;

  let word = wordSelect.value;
  let sub = substitutionText.value;
  if (word != "" && sub != "") {
    if (!arrayContains(config.words[word].words, sub)) {
      config.words[word].words.push(sub);
      config.words[word].words = config.words[word].words.sort();
      saveOptions(event, config);
      Helper.dynamicList(config.words[word].words, 'substitutionSelect', 'Substitutions');
      substitutionText.value = "";
    } else {
      updateStatus('Substitution already in list.', true, 3000);
    }
  }
}

function substitutionLoad() {
  if (config.filterMethod === 1) {
    var selectedOption = this[this.selectedIndex];
    var selectedText = selectedOption.text;
    Helper.dynamicList(config.words[selectedText].words, 'substitutionSelect', 'Substitutions');
  }
}

function substitutionRemove(event) {
  let wordSelect = document.getElementById('wordSelect') as HTMLSelectElement;
  let substitutionSelect = document.getElementById('substitutionSelect') as HTMLSelectElement;

  let word = wordSelect.value;
  let sub = substitutionSelect.value;
  if (word != "" && sub != "") {
    config.words[word].words = removeFromArray(config.words[word].words, sub);
    saveOptions(event, config);
  }
}

// Display status update to user
function updateStatus(message, error, timeout) {
  var status = document.getElementById('status');
  if (error) {status.className = 'error';}
  status.textContent = message;
  setTimeout(function() {status.textContent = ''; status.className = '';}, timeout);
}

function wordAdd(event) {
  let wordText = document.getElementById('wordText') as HTMLInputElement;
  let word = wordText.value;
  if (word != "") {
    if (!arrayContains(Object.keys(config.words), word)) {
      if (/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/.test(word)) {
        config.words[word] = {"matchMethod": 1, "words": []};
      } else {
        config.words[word] = {"matchMethod": 0, "words": []};
      }
      saveOptions(event, config);
      wordText.value = "";
    } else {
      updateStatus('Word already in list.', true, 3000);
    }
  }
}

function wordMatchMethodLoad(event) {
  var selectedOption = this[this.selectedIndex];
  var selectedText = selectedOption.text;
  Helper.dynamicList(matchMethods.slice(0,-2).concat(matchMethods.slice(-1)), 'wordMatchMethodSelect');
  let wordMatchMethodSelect = document.getElementById('wordMatchMethodSelect') as HTMLSelectElement;
  wordMatchMethodSelect.value = matchMethods[config.words[selectedText].matchMethod];
}

function wordMatchMethodSet(event) {
  let wordSelect = document.getElementById('wordSelect') as HTMLSelectElement;
  let matchMethodSelect = document.getElementById('wordMatchMethodSelect') as HTMLSelectElement;
  config.words[wordSelect.value].matchMethod = matchMethods.indexOf(matchMethodSelect.value);
  saveOptions(event, config);
}

function wordRemove(event) {
  let wordSelect = document.getElementById('wordSelect') as HTMLSelectElement;
  let word = wordSelect.value;
  if (word != "") {
    delete config.words[word];
    saveOptions(event, config);
  }
}

////
// Add event listeners to DOM
let tabs = document.getElementsByClassName("tablinks");
for (let i = 0; i < tabs.length; i++) {
  tabs[i].addEventListener('click', function(e) { openTab(e); });
}
window.addEventListener('load', populateOptions);
// Filter
document.getElementById('filterMethodSelect').addEventListener('change', filterMethodSelect);
// Filter - Censor
document.getElementById('preserveFirst').addEventListener('click', saveOptions);
document.getElementById('preserveLast').addEventListener('click', saveOptions);
document.getElementById('censorCharacterSelect').addEventListener('change', censorCharacter);
document.getElementById('censorFixedLengthSelect').addEventListener('change', censorFixedLength);
// Filter - Substitute
document.getElementById('substitutionMark').addEventListener('click', saveOptions);
// Global Matching Method
document.getElementById('globalMatchMethodSelect').addEventListener('change', globalMatchMethod);
// General
document.getElementById('showCounter').addEventListener('click', saveOptions);
// Words
document.getElementById('wordAdd').addEventListener('click', wordAdd);
document.getElementById('wordRemove').addEventListener('click', wordRemove);
document.getElementById('wordSelect').addEventListener('change', substitutionLoad);
document.getElementById('wordSelect').addEventListener('change', wordMatchMethodLoad);
document.getElementById('wordMatchMethodSet').addEventListener('click', wordMatchMethodSet);
document.getElementById('substitutionAdd').addEventListener('click', substitutionAdd);
document.getElementById('substitutionRemove').addEventListener('click', substitutionRemove);
// Domains
document.getElementById('domainAdd').addEventListener('click', domainAdd);
document.getElementById('domainRemove').addEventListener('click', domainRemove);
// Config
document.getElementById('default').addEventListener('click', function(event) {confirm(event, 'restoreDefaults')} );
document.getElementById('import').addEventListener('click', function(event) {confirm(event, 'importConfig')} );
document.getElementById('export').addEventListener('click', exportConfig);
// Password
document.getElementById('submitPassword').addEventListener('click', authenticate);
document.getElementById('setPasswordBtn').addEventListener('click', setPassword);
}