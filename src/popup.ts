var domain, disabledDomains;
var filterMethods = ["Censor", "Substitute", "Remove"];
var filterMethodContainer = document.getElementById('filterMethodContainer');
var protected = false;

////
// Helper functions
function arrayContains(array, string) {
  return (array.indexOf(string) > -1);
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

function removeFromArray(array, element) {
  return array.filter(e => e !== element);
}

////
// Functions for Popup
function disable(element) {
  element.disabled = true;
  element.classList.add('disabled');
}

function disableDomain(domain) {

  if (!arrayContains(disabledDomains, domain)) {
    disabledDomains.push(domain);
    chrome.storage.sync.set({"disabledDomains": disabledDomains}, function() {
      if (!chrome.runtime.lastError) {
        disable(document.getElementById('filterMethodSelect'));
        chrome.tabs.reload();
      }
    });
  };
}

function enable(element) {
  element.disabled = false;
  element.classList.remove('disabled');
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
        disabledDomains = newDisabledDomains;
        enable(document.getElementById('filterMethodSelect'));
        chrome.tabs.reload();
      }
    });
  }
}

function filterMethodSelect(event) {
  var filterMethod = document.getElementById('filterMethodSelect').selectedIndex;
  chrome.storage.sync.set({"filterMethod": filterMethod}, function() {
    if (!chrome.runtime.lastError) {
      chrome.tabs.reload();
    }
  });
}

function populateOptions() {
  dynamicList(filterMethods, 'filterMethodSelect');
  chrome.storage.sync.get({"disabledDomains": [], "filterMethod": 0, "password": null}, function(storage) {
    if (storage.password && storage.password != '') {
      protected = true;
      disable(document.getElementById('domainFilter'));
      disable(document.getElementById('domainToggle'));
      disable(document.getElementById('filterMethodSelect'));
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      disabledDomains = storage.disabledDomains;
      document.getElementById('filterMethodSelect').selectedIndex = storage.filterMethod;
      var tab = tabs[0];
      var checked = document.getElementById('domainFilter').value;
      var url = new URL(tab.url);
      domain = url.hostname;

      // Restricted pages
      if (url.protocol == 'chrome:' || url.protocol == 'about:' || domain == 'chrome.google.com') {
        document.getElementById('domainFilter').checked = false;
        disable(document.getElementById('domainFilter'));
        disable(document.getElementById('domainToggle'));
        disable(document.getElementById('filterMethodSelect'));
        return false;
      }

      // Set initial value for domain filter
      var domainRegex;
      for (var x = 0; x < disabledDomains.length; x++) {
        if (disabledDomains[x]) {
          domainRegex = new RegExp("(^|\.)" + disabledDomains[x]);
          if (domainRegex.test(domain)) {
            document.getElementById('domainFilter').checked = false;
            disable(document.getElementById('filterMethodSelect'));
            break;
          }
        }
      }
    });
  });
}

function toggleFilter(event) {
  if (!protected) {
    if (document.getElementById('domainFilter').checked) {
      enableDomain(domain);
    } else {
      disableDomain(domain);
    }
  }
}

////
// Listeners
window.addEventListener('load', populateOptions);
document.getElementById('domainFilter').addEventListener('change', toggleFilter);
document.getElementById('filterMethodSelect').addEventListener('change', filterMethodSelect);
document.getElementById('options').addEventListener('click', function() {chrome.runtime.openOptionsPage(); });
