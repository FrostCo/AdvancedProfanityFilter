var config = {};
var defaults = {
  'disabledDomains': [],
  'filterSubstring': true,
  'preserveFirst': false,
  'showCounter': true,
  'words': {
    "asshole": ["butthole", "jerk"],
    "bastard": ["imperfect", "impure"],
    "bitch": ["jerk"],
    "cunt": ["explative"],
    "damn": ["dang", "darn"],
    "fuck": ["freak", "fudge"],
    "piss": ["pee"],
    "pissed": ["ticked"],
    "slut": ["imperfect", "impure"],
    "shit": ["crap", "crud", "poop"],
    "tits": ["explative"],
    "whore": ["harlot", "tramp"]
  },
  'wordList': '' // TODO: Remove
};

function arrayContains(array, string) {
  return (array.indexOf(string) > -1);
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
  chrome.storage.sync.get(defaults, function(settings) {
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

    // Migrate from old wordList to words ojbect
    // TODO: Remove me in next version
    if (config.wordlist != "") {
      config.wordList.split(',').forEach(function(word) {
        if (!arrayContains(Object.keys(config.words), word)) {
          config.words[word] = [];
        }
      })

      delete config.wordList;

      chrome.storage.sync.set(config, function() {
        if (chrome.runtime.lastError) {
          console.log('Settings not saved! Please try again.');
        } else {
          console.log('Settings saved successfully!');
        }
      })
    }

    document.getElementById('preserveFirst').checked = settings.preserveFirst;
    document.getElementById('filterSubstring').checked = settings.filterSubstring;
    document.getElementById('showCounter').checked = settings.showCounter;
    dynamicList(settings.disabledDomains, 'domainSelect', 'Disabled Domains');
    dynamicList(Object.keys(config.words), 'wordSelect', 'Words to Filter');
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
  if (settings === undefined){
    settings = {};
    settings.filterSubstring = document.getElementById('filterSubstring').checked;
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

////
// Add event listeners to DOM
tabs = document.getElementsByClassName("tablinks");
for (i = 0; i < tabs.length; i++) {
  tabs[i].addEventListener('click', function(e) { openTab(e); });
}
window.addEventListener('load', populateOptions);
// Filter
document.getElementById('filterSubstring').addEventListener('click', saveOptions);
document.getElementById('preserveFirst').addEventListener('click', saveOptions);
document.getElementById('showCounter').addEventListener('click', saveOptions);
// Words
document.getElementById('wordAdd').addEventListener('click', wordAdd);
document.getElementById('wordRemove').addEventListener('click', wordRemove);
// Domains
document.getElementById('domainAdd').addEventListener('click', domainAdd);
document.getElementById('domainRemove').addEventListener('click', domainRemove);
// Config
document.getElementById('default').addEventListener('click', function() {confirm('restoreDefaults')} );
document.getElementById('import').addEventListener('click', function() {confirm('importConfig')} );
document.getElementById('export').addEventListener('click', exportConfig);
