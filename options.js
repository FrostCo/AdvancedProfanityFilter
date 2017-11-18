// Saves options to sync storage
function saveOptions() {
  // Gather current settings
  var settings = {};
  settings.wordList = document.getElementById('wordList').value;
  settings.preserveFirst = document.getElementById('preserveFirst').checked;
  settings.filterSubstring = document.getElementById('filterSubstring').checked;
  settings.showCounter = document.getElementById('showCounter').checked;
  settings.disabledDomains = document.getElementById('disabledDomains').value;

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

// Restores form state to saved values from Chrome Sync
function restoreOptions() {
  var defaults = {'wordList': 'asshole,bastard,bitch,cunt,damn,fuck,piss,slut,shit,tits,whore', 'preserveFirst': false, 'filterSubstring': true, 'showCounter': true, 'disabledDomains': ''};
  chrome.storage.sync.get(defaults, function(settings) {
    // Display saved settings
    document.getElementById('wordList').value = settings.wordList;
    document.getElementById('preserveFirst').checked = settings.preserveFirst;
    document.getElementById('filterSubstring').checked = settings.filterSubstring;
    document.getElementById('showCounter').checked = settings.showCounter;
    document.getElementById('disabledDomains').value = settings.disabledDomains;
  });
}

// Restore default settings
function restoreDefaults() {
  chrome.storage.sync.clear(function(){
    if (chrome.runtime.lastError) {
      updateStatus('Error restoring defaults! Please try again.', true, 5000);
    } else {
      restoreOptions();
      updateStatus('Default settings restored!', false, 3000);
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
document.getElementById('saveWordList').addEventListener('click', saveOptions);
document.getElementById('saveDisabledDomains').addEventListener('click', saveOptions);
document.getElementById('preserveFirst').addEventListener('click', saveOptions);
document.getElementById('filterSubstring').addEventListener('click', saveOptions);
document.getElementById('showCounter').addEventListener('click', saveOptions);
document.getElementById('default').addEventListener('click', restoreDefaults);
