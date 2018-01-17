var defaults = {'disabledDomains': [], 'filterSubstring': true, 'preserveFirst': false, 'showCounter': true, 'wordList': 'asshole,bastard,bitch,cunt,damn,fuck,piss,slut,shit,tits,whore'};
var config = {};

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
      dynamicDomains(config.disabledDomains, 'domainSelect');
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
    dynamicDomains(config.disabledDomains, 'domainSelect');
  }
}

function dynamicDomains(list, selectEm) {
  var options = '<option value="" disabled selected>Disabled Domains</option>';
  for(var i = 0; i < list.length; i++) {
    options += '<option value="'+list[i]+'">'+list[i]+'</option>';
  }
  document.getElementById(selectEm).innerHTML = options;
}

function exportConfig() {
  chrome.storage.sync.get(defaults, function(settings) {
    document.getElementById('configText').value = JSON.stringify(settings);
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
    document.getElementById('wordList').value = settings.wordList;
    document.getElementById('preserveFirst').checked = settings.preserveFirst;
    document.getElementById('filterSubstring').checked = settings.filterSubstring;
    document.getElementById('showCounter').checked = settings.showCounter;
    dynamicDomains(settings.disabledDomains, 'domainSelect');
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
    settings.wordList = document.getElementById('wordList').value;
  }

  // Save settings
  chrome.storage.sync.set(settings, function() {
    if (chrome.runtime.lastError) {
      updateStatus('Settings not saved! Please try again.', true, 5000);
    } else {
      updateStatus('Settings saved successfully!', false, 3000);
      populateOptions();
      if (document.getElementById('profanityList').style.display === 'block') {toggleProfanity();} // Close wordList
    }
  });
}

// Displays the profanity list and hides the profanity button
function toggleProfanity() {
  var profanityList = document.getElementById('profanityList');
  if (profanityList.style.display === 'none') {
    profanityList.style.display = 'block';
    document.getElementById('listWarning').style.display = 'none';
    document.getElementById('wordList').focus();
    document.getElementById('toggleProfanity').textContent = "Hide Profanity List";
  } else {
    profanityList.style.display = 'none';
    document.getElementById('listWarning').style.display = 'block';
    document.getElementById('toggleProfanity').textContent = "Modify Profanity List";
  }
}

// Display status update to user
function updateStatus(message, error, timeout) {
  var status = document.getElementById('status');
  if (error) {status.className = 'error';}
  status.textContent = message;
  setTimeout(function() {status.textContent = ''; status.className = '';}, timeout);
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
document.getElementById('toggleProfanity').addEventListener('click', toggleProfanity);
document.getElementById('saveWords').addEventListener('click', saveOptions);
// Domains
document.getElementById('domainAdd').addEventListener('click', domainAdd);
document.getElementById('domainRemove').addEventListener('click', domainRemove);
// Config
document.getElementById('default').addEventListener('click', function() {confirm('restoreDefaults')} );
document.getElementById('import').addEventListener('click', function() {confirm('importConfig')} );
document.getElementById('export').addEventListener('click', exportConfig);
