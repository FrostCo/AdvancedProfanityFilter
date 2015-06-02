// Saves options to sync storage
function save_options() {
  console.log('save_options');
  // Gather current settings
  var settings = {};
  settings.wordList = document.getElementById('wordList').value;
  settings.preserveFirst = document.myForm.preserveFirst.checked;
  settings.filterSubstring = document.myForm.filterSubstring.checked;

  // Save settings
  chrome.storage.sync.set(settings, function() {
    if (chrome.runtime.lastError) {
      update_status('Settings not saved! Please try again.', true, 5000);
    } else {
      update_status('Settings saved successfully!', false, 3000);
    }
  });
}

// Restores form state to saved values from Chroem Sync
function restore_options() {
  console.log('restore_options');
  var defaults = {'wordList': 'asshole,bastard,bitch,cock,cunt,damn,fuck,piss,slut,shit,tits,whore', 'preserveFirst': false, 'filterSubstring': true};

  chrome.storage.sync.get(defaults, function(settings) {
    // Display saved settings
    document.getElementById('wordList').value = settings.wordList;
    document.myForm.preserveFirst.checked = settings.preserveFirst;
    document.myForm.filterSubstring.checked = settings.filterSubstring;
  });
}

// Restore default settings
function restore_defaults() {
  if (confirm('Reset all settings back to their defaults?')) {
    chrome.storage.sync.clear(function(){
      if (chrome.runtime.lastError) {
        update_status('Error restoring defaults! Please try again.', true, 5000);
      } else {
        restore_options();
        update_status('Default settings restored!', false, 3000);
      }
    });
  }
}

// Displays the profanity list and hides the profanity button
function toggleProfanity() {
  var profanityListId = document.getElementById('profanityList');
  profanityListId.style.display = 'block'; 

  var profanityButtonId = document.getElementById('profanityButton');
  profanityButtonId.style.display = 'none'; 
}

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
document.getElementById('default').addEventListener('click', restore_defaults);
document.getElementById('close').addEventListener('click', function(){window.close();});
