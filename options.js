// Saves options to sync storage
function save_options() {
  // Gather current settings
  var settings = {};
  settings.wordList = document.getElementById('wordList').value;
  settings.preserveFirst = document.getElementById('preserveFirst').checked;
  settings.filterSubstring = document.getElementById('filterSubstring').checked;

  // Save settings
  chrome.storage.sync.set(settings, function() {
    if (chrome.runtime.lastError) {
      update_status('Settings not saved! Please try again.', true, 5000);
    } else {
      update_status('Settings saved successfully!', false, 3000);
      if (document.getElementById('profanityList').style.display == 'block') {toggleProfanity();} // Close wordList
    }
  });
}

// Restores form state to saved values from Chroem Sync
function restore_options() {
  var defaults = {'wordList': 'asshole,bastard,bitch,cock,cunt,damn,fuck,piss,slut,shit,tits,whore', 'preserveFirst': false, 'filterSubstring': true};
  chrome.storage.sync.get(defaults, function(settings) {
    // Display saved settings
    document.getElementById('wordList').value = settings.wordList;
    document.getElementById('preserveFirst').checked = settings.preserveFirst;
    document.getElementById('filterSubstring').checked = settings.filterSubstring;
  });
}

// Restore default settings
function restore_defaults() {
  chrome.storage.sync.clear(function(){
    if (chrome.runtime.lastError) {
      update_status('Error restoring defaults! Please try again.', true, 5000);
    } else {
      restore_options();
      update_status('Default settings restored!', false, 3000);
    }
  });
}

// Displays the profanity list and hides the profanity button
function toggleProfanity() {
  var profanityList = document.getElementById('profanityList');
  if (profanityList.style.display == 'none') {
    profanityList.style.display = 'block';
    document.getElementById('listWarning').style.display = 'none';
    document.getElementById('wordList').focus();
    document.getElementById('toggleProfanity').textContent = "Hide Profanity List"
  } else {
    profanityList.style.display = 'none';
    document.getElementById('listWarning').style.display = 'block';
    document.getElementById('toggleProfanity').textContent = "Modify Profanity List"
  }
}

// Display status update to user
function update_status(message, error, timeout) {
  var status = document.getElementById('status');
  if (error) {status.className = 'error';}
  status.textContent = message;
  setTimeout(function() {status.textContent = ''; status.className = '';}, timeout);
}

// Add event listeners to DOM
window.addEventListener('load', restore_options);
document.getElementById('toggleProfanity').addEventListener('click', toggleProfanity);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('preserveFirst').addEventListener('click', save_options);
document.getElementById('filterSubstring').addEventListener('click', save_options);
document.getElementById('default').addEventListener('click', restore_defaults);