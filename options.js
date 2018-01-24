var config = {};
var defaults = {
  "censorCharacter": "*",
  "censorFixedLength": 0,
  "censorRemoveWord": false,
  "defaultSubstitutions": ["censored", "explative", "filtered"],
  "disabledDomains": [],
  "filterMethod": 0, // ["censor", "substitute"];
  "globalMatchMethod": 3, // ["exact", "partial", "whole", "disabled"]
  "preserveFirst": false,
  "showCounter": true,
  "words": {
    "ass": {"matchMethod": 0, "words": ["butt", "tail"] },
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
  }
};

function arrayContains(array, string) {
  return (array.indexOf(string) > -1);
}

function censorCharacter() {
  config.censorCharacter = document.getElementById('censorCharacterSelect').value;
  saveOptions(event, config);
}

function censorFixedLength() {
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

function domainAdd(event) {
  var domain = document.getElementById('domainText').value;
  if (domain != "") {
    if (!arrayContains(config.disabledDomains, domain)) {
      config.disabledDomains.push(domain);
      config.disabledDomains = config.disabledDomains.sort();
      saveOptions(event, config);
      dynamicList(config.disabledDomains, 'domainSelect', 'Disabled Domains');
      document.getElementById('domainText').value = "";
    } else {
      updateStatus('Domain already in list.', true, 3000);
    }
  }
}

function domainRemove(event) {
  var domain = document.getElementById('domainSelect').value;
  if (domain != "") {
    config.disabledDomains = removeFromArray(config.disabledDomains, domain);
    saveOptions(event, config);
    dynamicList(config.disabledDomains, 'domainSelect', 'Disabled Domains');
  }
}

function dynamicList(list, selectEm, title) {
  var options = '<option value="" disabled selected>' + title + '</option>';
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

function importConfig(event) {
  try {
    var settings = JSON.parse(document.getElementById('configText').value);
    saveOptions(event, settings);
  } catch (e) {
    updateStatus('Settings not saved! Please try again.', true, 5000);
  }
}

function methodSelected() {
  config.filterMethod = document.getElementById('methodSelect').selectedIndex;
  saveOptions(event, config);
}

// Switching Tabs
function openTab(event) {
  // Don't run on current tab
  if ( event.currentTarget.className.indexOf('active') >= 0) {
    return false;
  }

  // Set active tab
  oldTab = document.getElementsByClassName("tablinks active")[0];
  oldTab.className = oldTab.className.replace(" active", "");
  event.currentTarget.className += " active";

  // Show active tab content
  oldTabContent = document.getElementsByClassName("tabcontent visible")[0];
  oldTabContent.className = oldTabContent.className.replace(" visible", " hidden");
  newTabName = event.currentTarget.innerText;
  newTabContent = document.getElementById(newTabName);
  newTabContent.className = newTabContent.className.replace(" hidden", " visible");
}

// Restores form state to saved values from Chrome Storage
function populateOptions() {
  chrome.storage.sync.get(defaults, function(settings) {
    config = settings; // Make config globally available
    document.getElementById('methodSelect').selectedIndex = settings.filterMethod;
    switch (settings.filterMethod) {
      case 0:
        document.getElementById('optionsCensor').classList.remove('hidden');
        document.getElementById('wordSubstitutions').classList.add('hidden');
        break;
      case 1:
        document.getElementById('optionsCensor').classList.add('hidden');
        document.getElementById('wordSubstitutions').classList.remove('hidden');
        break;
    }
    // Settings
    document.getElementById('censorFixedLengthSelect').selectedIndex = settings.censorFixedLength;
    document.getElementById('censorCharacterSelect').value = settings.censorCharacter;
    document.getElementById('preserveFirst').checked = settings.preserveFirst;
    document.getElementById('showCounter').checked = settings.showCounter;
    // Domains
    dynamicList(settings.disabledDomains, 'domainSelect', 'Disabled Domains');
    // Words
    dynamicList(Object.keys(config.words), 'wordSelect', 'Words to Filter');
    dynamicList([], 'substitutionSelect', 'Substitutions');
  });
}

function removeFromArray(array, element) {
  return array.filter(e => e !== element);
}

// Restore default settings
function restoreDefaults() {
  chrome.storage.sync.clear(function(){
    if (chrome.runtime.lastError) {
      updateStatus('Error restoring defaults! Please try again.', true, 5000);
    } else {
      populateOptions();
      updateStatus('Settings restored!', false, 3000);
    }
  });
}

// Saves options to sync storage
function saveOptions(event, settings) {
  // Gather current settings
  if (settings === undefined) {
    settings = {};
    settings.censorRemoveWord = document.getElementById('censorRemoveWord').checked;
    settings.preserveFirst = document.getElementById('preserveFirst').checked;
    settings.showCounter = document.getElementById('showCounter').checked;
  }

  // Save settings
  chrome.storage.sync.set(settings, function() {
    if (chrome.runtime.lastError) {
      updateStatus('Settings not saved! Please try again.', true, 5000);
    } else {
      updateStatus('Settings saved successfully!', false, 3000);
      populateOptions();
    }
  });
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
      config.words[word] = [];
      saveOptions(event, config);
      dynamicList(Object.keys(config.words), 'wordSelect', 'Words to Filter');
      document.getElementById('wordText').value = "";
    } else {
      updateStatus('Word already in list.', true, 3000);
    }
  }
}

function wordRemove(event) {
  var word = document.getElementById('wordSelect').value;
  if (word != "") {
    delete config.words[word];
    saveOptions(event, config);
    dynamicList(Object.keys(config.words), 'wordSelect', 'Words to Filter');
  }
}

function substitutionAdd(event) {
  var word = document.getElementById('wordSelect').value;
  var sub = document.getElementById('substitutionText').value;
  if (word != "" && sub != "") {
    if (!arrayContains(config.words[word], sub)) {
      config.words[word].push(sub);
      config.words[word] = config.words[word].sort();
      saveOptions(event, config);
      dynamicList(config.words[word], 'substitutionSelect', 'Substitutions');
      document.getElementById('substitutionText').value = "";
    } else {
      updateStatus('Substitution already in list.', true, 3000);
    }
  }
}

function substitutionLoad() {
  var selectedOption = this[this.selectedIndex];
  var selectedText = selectedOption.text;
  dynamicList(config.words[selectedText], 'substitutionSelect', 'Substitutions');
}

function substitutionRemove(event) {
  var word = document.getElementById('wordSelect').value;
  var sub = document.getElementById('substitutionSelect').value;
  if (word != "" && sub != "") {
    config.words[word] = removeFromArray(config.words[word], sub);
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
document.getElementById('methodSelect').addEventListener('change', methodSelected);
document.getElementById('preserveFirst').addEventListener('click', saveOptions);
document.getElementById('censorRemoveWord').addEventListener('click', saveOptions);
document.getElementById('censorCharacterSelect').addEventListener('change', censorCharacter);
document.getElementById('censorFixedLengthSelect').addEventListener('change', censorFixedLength);
// General
document.getElementById('showCounter').addEventListener('click', saveOptions);
// Words
document.getElementById('wordAdd').addEventListener('click', wordAdd);
document.getElementById('wordRemove').addEventListener('click', wordRemove);
document.getElementById('wordSelect').addEventListener('change', substitutionLoad);
document.getElementById('substitutionAdd').addEventListener('click', substitutionAdd);
document.getElementById('substitutionRemove').addEventListener('click', substitutionRemove);
// Domains
document.getElementById('domainAdd').addEventListener('click', domainAdd);
document.getElementById('domainRemove').addEventListener('click', domainRemove);
// Config
document.getElementById('default').addEventListener('click', function() {confirm('restoreDefaults')} );
document.getElementById('import').addEventListener('click', function() {confirm('importConfig')} );
document.getElementById('export').addEventListener('click', exportConfig);
