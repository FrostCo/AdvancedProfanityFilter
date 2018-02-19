var domain;
var disabledDomains;

////
// Helper functions
function arrayContains(array, string) {
  return (array.indexOf(string) > -1);
}

function removeFromArray(array, element) {
  return array.filter(e => e !== element);
}

////
// Functions for Popup
function disableDomain(domain) {
  if (!arrayContains(disabledDomains, domain)) {
    disabledDomains.push(domain);
    chrome.storage.sync.set({"disabledDomains": disabledDomains}, function() {
      if (!chrome.runtime.lastError) {
        chrome.tabs.reload();
        window.close();
      }
    });
  };
}

// Remove all entries that disable the filter for domain
function enableDomain(domain) {
  var foundMatch;
  var newDisabledDomains = disabledDomains;

  for (var x = 0; x < disabledDomains.length; x++) {
    domainRegex = new RegExp('(^|\.)' + disabledDomains[x]);
    if (domainRegex.test(domain)) {
      foundMatch = true;
      newDisabledDomains = removeFromArray(newDisabledDomains, disabledDomains[x]);
    }
  }

  if (foundMatch) {
    chrome.storage.sync.set({"disabledDomains": newDisabledDomains}, function() {
      if (!chrome.runtime.lastError) {
        chrome.tabs.reload();
        window.close();
      }
    });
  }
}

function populateOptions() {
  chrome.storage.sync.get({"disabledDomains": []}, function(storage) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      disabledDomains = storage.disabledDomains;
      var tab = tabs[0];
      var checked = document.getElementById('domainFilter').value;
      var url = new URL(tab.url);
      domain = url.hostname;

      // Set initial value for domain filter
      var domainRegex;
      for (var x = 0; x < disabledDomains.length; x++) {
        if (disabledDomains[x]) {
          domainRegex = new RegExp("(^|\.)" + disabledDomains[x]);
          if (domainRegex.test(domain)) {
            document.getElementById('domainFilter').checked = false;
            break;
          }
        }
      }
    });
  });
}

function toggleFilter() {
  if (document.getElementById('domainFilter').checked) {
    enableDomain(domain);
  } else {
    disableDomain(domain);
  }
}

////
// Listeners
window.addEventListener('load', populateOptions);
document.getElementById('domainFilter').addEventListener('change', toggleFilter);
document.getElementById('options').addEventListener('click', function() {chrome.runtime.openOptionsPage(); });
