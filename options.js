// Add event listeners to DOM
window.addEventListener('load', load_options);
document.getElementById('toggleProfanity').addEventListener('click', toggleProfanity);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('default').addEventListener('click', restore_defaults);
document.getElementById('close').addEventListener('click', function(){window.close();});

// Saves options to sync storage
function save_options() {
  console.log('save_options');
  // Gather current settings
  var settings = {};
  settings.wordList = document.getElementById('wordList').value;
  settings.preserveFirst = document.myForm.preserveFirst.checked;
  settings.filterSubstring = document.myForm.filterSubstring.checked;
  var chromeSync = document.myForm.chromeSync.checked;

  if (chromeSync) {
    // Save settings using Chrome Sync
    chrome.storage.sync.set(settings, function() {
      // TODO: if (runtime.lastError) {};
      document.getElementById('notice').innerHTML = 'Settings successfully saved.';
    });
  } else {
    // Save settings locally
    settings.chromeSync = chromeSync;
    chrome.storage.sync.set(settings, function() {
    document.getElementById('notice').innerHTML = 'Settings successfully saved.';
  }
}

// Restores form state to saved values
function load_options() {
  console.log('load_options');
  var defaults = {'wordList' : 'asshole,bastard,bitch,cock,cunt,damn,fuck,piss,slut,shit,tits,whore', 'preserveFirst' : false, 'filterSubstring' : true};
  var localDefaults = {'chromeSync' : true};

  chrome.storage.local.get(localDefaults, function(local) {
    if (local.chromeSync) {
      chrome.storage.sync.get(defaults, function(settings) {

      });
    } else {
      chrome.storage.local.get(defaults, function(settings) {

      });
    }
  });
}

// Display options
function display_options(settings) {
  // Display saved settings
  document.getElementById('wordList').value = settings.wordList;
  document.myForm.preserveFirst.checked = settings.preserveFirst;
  document.myForm.filterSubstring.checked = settings.filterSubstring;
  document.myForm.chromeSync.checked = settings.chromeSync;
}

// Restore default settings
function restore_defaults() {
  if (confirm('Reset all settings back to their defaults?')) {
    chrome.storage.sync.clear();
    load_options();
  }
}

// Displays the profanity list and hides the profanity button
function toggleProfanity() {
  var profanityListId = document.getElementById('profanityList');
  profanityListId.style.display = 'block'; 

  var profanityButtonId = document.getElementById('profanityButton');
  profanityButtonId.style.display = 'none'; 
}
