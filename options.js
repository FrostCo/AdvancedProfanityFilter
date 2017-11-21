// Switching Tabs
function openTab(evt) {
  // Don't run on current tab
  if ( evt.currentTarget.className.indexOf('active') >= 0) {
    return false
  }

  // Set active tab
  oldTab = document.getElementsByClassName("tablinks active")[0];
  oldTab.className = oldTab.className.replace(" active", "");
  evt.currentTarget.className += " active";

  // Show active tab content
  oldTabContent = document.getElementsByClassName("tabcontent visible")[0];
  oldTabContent.className = oldTabContent.className.replace(" visible", " hidden");
  newTabName = evt.currentTarget.innerText;
  newTabContent = document.getElementById(newTabName);
  newTabContent.className = newTabContent.className.replace(" hidden", " visible");
}

// Restores form state to saved values from Chroem Sync
function restoreOptions() {
  var defaults = {'wordList': 'asshole,bastard,bitch,cunt,damn,fuck,piss,slut,shit,tits,whore', 'preserveFirst': false, 'filterSubstring': true, 'showCounter': true};
  chrome.storage.sync.get(defaults, function(settings) {
    // Display saved settings
    document.getElementById('wordList').value = settings.wordList;
    document.getElementById('preserveFirst').checked = settings.preserveFirst;
    document.getElementById('filterSubstring').checked = settings.filterSubstring;
    document.getElementById('showCounter').checked = settings.showCounter;
  });
}

// Restore default settings
function restoreDefaults() {
  // TODO: Prompt for confirmation
  chrome.storage.sync.clear(function(){
    if (chrome.runtime.lastError) {
      updateStatus('Error restoring defaults! Please try again.', true, 5000);
    } else {
      restoreOptions();
      updateStatus('Default settings restored!', false, 3000);
    }
  });
}

// Saves options to sync storage
function saveOptions() {
  // Gather current settings
  var settings = {};
  settings.wordList = document.getElementById('wordList').value;
  settings.preserveFirst = document.getElementById('preserveFirst').checked;
  settings.filterSubstring = document.getElementById('filterSubstring').checked;
  settings.showCounter = document.getElementById('showCounter').checked;

  // Save settings
  chrome.storage.sync.set(settings, function() {
    if (chrome.runtime.lastError) {
      updateStatus('Settings not saved! Please try again.', true, 5000);
    } else {
      updateStatus('Settings saved successfully!', false, 3000);
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

// Add event listeners to DOM
window.addEventListener('load', restoreOptions);
document.getElementById('toggleProfanity').addEventListener('click', toggleProfanity);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('preserveFirst').addEventListener('click', saveOptions);
document.getElementById('filterSubstring').addEventListener('click', saveOptions);
document.getElementById('showCounter').addEventListener('click', saveOptions);
document.getElementById('default').addEventListener('click', restoreDefaults);

tabs = document.getElementsByClassName("tablinks");
for (i = 0; i < tabs.length; i++) {
  tabs[i].addEventListener('click', function(e) { openTab(e); });
}
