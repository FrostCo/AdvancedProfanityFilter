var config = {};
var defaults = {
  "censorCharacter": "*",
  "censorFixedLength": 0,
  "defaultSubstitutions": ["censored", "expletive", "filtered"],
  "disabledDomains": [],
  "filterMethod": 0, // ["Censor", "Substitute", "Remove"];
  "globalMatchMethod": 3, // ["Exact", "Partial", "Whole", "Per-Word", "RegExp"]
  "password": "blank",
  "preserveFirst": false,
  "preserveLast": false,
  "showCounter": true,
  "substitutionMark": true,
  "words": {}
};
var defaultWords = {
  "ass": {"matchMethod": 0, "words": ["butt", "tail"] },
  "asses": {"matchMethod": 0, "words": ["butts"] },
  "asshole": {"matchMethod": 1, "words": ["butthole", "jerk"] },
  "bastard": {"matchMethod": 1, "words": ["imperfect", "impure"] },
  "bitch": {"matchMethod": 1, "words": ["jerk"] },
  "cunt": {"matchMethod": 1, "words": ["explative"] },
  "damn": {"matchMethod": 1, "words": ["dang", "darn"] },
  "fuck": {"matchMethod": 1, "words": ["freak", "fudge"] },
  "piss": {"matchMethod": 1, "words": ["pee"] },
  "pissed": {"matchMethod": 0, "words": ["ticked"] },
  "slut": {"matchMethod": 1, "words": ["imperfect", "impure"] },
  "shit": {"matchMethod": 1, "words": ["crap", "crud", "poop"] },
  "tits": {"matchMethod": 1, "words": ["explative"] },
  "whore": {"matchMethod": 1, "words": ["harlot", "tramp"] }
};
// var password = 'blank';
var authenticated = false;
var filterMethods = ["Censor", "Substitute", "Remove"];
var matchMethods = ["Exact Match", "Partial Match", "Whole Match", "Per-Word Match", "Regular Expression"];

function activate(element) {
  element.classList.add('active');
}

function arrayContains(array, string) {
  return (array.indexOf(string) > -1);
}

function authenticate() {
  if (document.getElementById('password').value == config.password) {
    hide(document.getElementById('passwordContainer'));
    show(document.getElementById('main'));
    authenticated = true;
  }
}

function censorCharacter(event) {
  config.censorCharacter = document.getElementById('censorCharacterSelect').value;
  saveOptions(event, config);
}

function censorFixedLength(event) {
  config.censorFixedLength = document.getElementById('censorFixedLengthSelect').selectedIndex;
  saveOptions(event, config);
}

// Prompt for confirmation
function confirm(action) {
  // TODO: Don't confirm if Firefox
  if (/Chrome/.exec(navigator.userAgent)) {
    var dialogContainer = document.getElementById('dialogContainer');
    dialogContainer.innerHTML = '<dialog id="promptDialog">Are you sure?<br><button id="confirmYes">Yes</button><button id="confirmNo">No</button></dialog>';
    var dialog = document.getElementById("promptDialog");

    document.getElementById('confirmNo').addEventListener("click", function() {
      this.removeEventListener('click', arguments.callee, false);
      dialog.close();
    })
    document.getElementById('confirmYes').addEventListener("click", function() {
      this.removeEventListener('click', arguments.callee, false);
      if (action == 'importConfig') {
        importConfig();
      } else if (action == 'restoreDefaults') {
        restoreDefaults();
      }
      dialog.close();
    })

    dialog.showModal();
  } else {
    if (action == 'importConfig') {
      importConfig();
    } else if (action == 'restoreDefaults') {
      restoreDefaults();
    }
  }
}

function deactivate(element) {
  element.classList.remove('active');
}

function domainAdd(event) {
  var domain = document.getElementById('domainText');
  if (domain.value != "") {
    if (domain.checkValidity()) {
      if (!arrayContains(config.disabledDomains, domain.value)) {
        config.disabledDomains.push(domain.value);
        config.disabledDomains = config.disabledDomains.sort();
        saveOptions(event, config);
        document.getElementById('domainText').value = "";
      } else {
        updateStatus('Domain already in list.', true, 3000);
      }
    } else {
      updateStatus("Invalid domain, please only provide the domain name.", true, 5000);
    }
  }
}

function domainRemove(event) {
  var domain = document.getElementById('domainSelect').value;
  if (domain != "") {
    config.disabledDomains = removeFromArray(config.disabledDomains, domain);
    saveOptions(event, config);
  }
}

function dynamicList(list, selectEm, title) {
  var options = '';
  if (title !== undefined) {
    options = '<option value="" disabled selected>' + title + '</option>';
  }

  for(var i = 0; i < list.length; i++) {
    options += '<option value="'+list[i]+'">'+list[i]+'</option>';
  }
  document.getElementById(selectEm).innerHTML = options;
}

function exportConfig() {
  // TODO: To let people migrate from wordList to words, return all keys (null)
  chrome.storage.sync.get(null, function(settings) {
    if (Object.keys(settings).length === 0 && settings.constructor === Object) {
      settings = defaults;
    }
    document.getElementById('configText').value = JSON.stringify(settings, null, 2);
  });
}

function filterMethodSelect(event) {
  config.filterMethod = document.getElementById('filterMethodSelect').selectedIndex;
  saveOptions(event, config);
}

function globalMatchMethod(event) {
  var selectedIndex = document.getElementById('globalMatchMethodSelect').selectedIndex;
  config.globalMatchMethod = selectedIndex;
  saveOptions(event, config);
}

function hide(element) {
  element.classList.remove('visible');
  element.classList.add('hidden');
}

function importConfig(event) {
  try {
    var settings = JSON.parse(document.getElementById('configText').value);
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
        for (i = 0; i < wordList.length; i++) {
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
  oldTab = document.getElementsByClassName("tablinks active")[0];
  deactivate(oldTab);
  activate(event.currentTarget);

  // Show active tab content
  oldTabContent = document.getElementsByClassName("tabcontent visible")[0];
  hide(oldTabContent);
  newTabName = event.currentTarget.innerText;
  show(document.getElementById(newTabName));
}

// Restores form state to saved values from Chrome Storage
function populateOptions() {
  chrome.storage.sync.get(defaults, function(settings) {
    config = settings; // Make config globally available
    migrateWordList(); // TODO: Migrate wordList
    if (Object.keys(config.words).length === 0 && config.words.constructor === Object) {
      config.words = defaultWords;
      saveOptions(null, config);
      return false;
    }

    if (config.password && !authenticated) {
      show(document.getElementById('passwordContainer'));
      hide(document.getElementById('main'));
    }

    // Show/hide censor options and word substitutions based on filter method
    dynamicList(filterMethods, 'filterMethodSelect');
    document.getElementById('filterMethodSelect').selectedIndex = settings.filterMethod;
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
    document.getElementById('censorFixedLengthSelect').selectedIndex = settings.censorFixedLength;
    document.getElementById('censorCharacterSelect').value = settings.censorCharacter;
    document.getElementById('preserveFirst').checked = settings.preserveFirst;
    document.getElementById('preserveLast').checked = settings.preserveLast;
    document.getElementById('substitutionMark').checked = settings.substitutionMark;
    document.getElementById('showCounter').checked = settings.showCounter;
    dynamicList(matchMethods.slice(0, -1), 'globalMatchMethodSelect');
    document.getElementById('globalMatchMethodSelect').selectedIndex = settings.globalMatchMethod;
    // Words
    dynamicList(Object.keys(config.words).sort(), 'wordSelect', 'Words to Filter');
    dynamicList([], 'substitutionSelect', 'Substitutions');
    dynamicList([], 'wordMatchMethodSelect', 'Select a Word');
    // Domains
    dynamicList(settings.disabledDomains, 'domainSelect', 'Disabled Domains');
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
function saveOptions(event, settings) {
  // Gather current settings
  if (settings === undefined) {
    settings = {};
    settings.preserveFirst = document.getElementById('preserveFirst').checked;
    settings.preserveLast = document.getElementById('preserveLast').checked;
    settings.showCounter = document.getElementById('showCounter').checked;
    settings.substitutionMark = document.getElementById('substitutionMark').checked;
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
  var password = document.getElementById('setPassword').value;
  if (password == '') {
    chrome.storage.sync.set({password: ''});
  } else {
    chrome.storage.sync.set({password: password});
  }
}

function show(element) {
  element.classList.remove('hidden');
  element.classList.add('visible');
}

function substitutionAdd(event) {
  var word = document.getElementById('wordSelect').value;
  var sub = document.getElementById('substitutionText').value;
  if (word != "" && sub != "") {
    if (!arrayContains(config.words[word].words, sub)) {
      config.words[word].words.push(sub);
      config.words[word].words = config.words[word].words.sort();
      saveOptions(event, config);
      dynamicList(config.words[word].words, 'substitutionSelect', 'Substitutions');
      document.getElementById('substitutionText').value = "";
    } else {
      updateStatus('Substitution already in list.', true, 3000);
    }
  }
}

function substitutionLoad() {
  if (config.filterMethod === 1) {
    var selectedOption = this[this.selectedIndex];
    var selectedText = selectedOption.text;
    dynamicList(config.words[selectedText].words, 'substitutionSelect', 'Substitutions');
  }
}

function substitutionRemove(event) {
  var word = document.getElementById('wordSelect').value;
  var sub = document.getElementById('substitutionSelect').value;
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
  var word = document.getElementById('wordText').value;
  if (word != "") {
    if (!arrayContains(Object.keys(config.words), word)) {
      if (/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/.test(word)) {
        config.words[word] = {"matchMethod": 1, "words": []};
      } else {
        config.words[word] = {"matchMethod": 0, "words": []};
      }
      saveOptions(event, config);
      document.getElementById('wordText').value = "";
    } else {
      updateStatus('Word already in list.', true, 3000);
    }
  }
}

function wordMatchMethodLoad() {
  var selectedOption = this[this.selectedIndex];
  var selectedText = selectedOption.text;
  var list = 'wordMatchMethodSelect';
  dynamicList(matchMethods.slice(0,-2).concat(matchMethods.slice(-1)), 'wordMatchMethodSelect');
  document.getElementById('wordMatchMethodSelect').value = matchMethods[config.words[selectedText].matchMethod];
}

function wordMatchMethodSet(event) {
  var selectedWord = document.getElementById('wordSelect').value;
  var matchMethod = matchMethods.indexOf(document.getElementById('wordMatchMethodSelect').value);
  config.words[selectedWord].matchMethod = matchMethod;
  saveOptions(event, config);
}

function wordRemove(event) {
  var word = document.getElementById('wordSelect').value;
  if (word != "") {
    delete config.words[word];
    saveOptions(event, config);
  }
}

////
// Add event listeners to DOM
tabs = document.getElementsByClassName("tablinks");
for (i = 0; i < tabs.length; i++) {
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
document.getElementById('default').addEventListener('click', function() {confirm('restoreDefaults')} );
document.getElementById('import').addEventListener('click', function() {confirm('importConfig')} );
document.getElementById('export').addEventListener('click', exportConfig);

document.getElementById('submitPassword').addEventListener('click', authenticate);
document.getElementById('setPasswordBtn').addEventListener('click', setPassword);
