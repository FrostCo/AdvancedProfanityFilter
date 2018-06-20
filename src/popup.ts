namespace popup {
/// <reference path="helpers.ts" />
let Helper = Helpers;
var domain, disabledDomains;
var filterMethods = ["Censor", "Substitute", "Remove"];
var filterMethodContainer = document.getElementById('filterMethodContainer');
var protected = false;

////
// Functions for Popup
function disable(element) {
  element.disabled = true;
  element.classList.add('disabled');
}

function disableDomain(domain) {
  if (!Helper.arrayContains(disabledDomains, domain)) {
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
  var domainRegex, foundMatch;
  var newDisabledDomains = disabledDomains;

  for (var x = 0; x < disabledDomains.length; x++) {
    domainRegex = new RegExp('(^|\.)' + disabledDomains[x]);
    if (domainRegex.test(domain)) {
      foundMatch = true;
      newDisabledDomains = Helper.removeFromArray(newDisabledDomains, disabledDomains[x]);
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
  var filterMethodSelect = document.getElementById('filterMethodSelect') as HTMLSelectElement;
  chrome.storage.sync.set({"filterMethod": filterMethodSelect.selectedIndex}, function() {
    if (!chrome.runtime.lastError) {
      chrome.tabs.reload();
    }
  });
}

function populateOptions(event) {
  Helper.dynamicList(filterMethods, 'filterMethodSelect', event);
  chrome.storage.sync.get({"disabledDomains": [], "filterMethod": 0, "password": null}, function(storage) {
    let domainFilter = document.getElementById('domainFilter') as HTMLInputElement;
    let domainToggle = document.getElementById('domainToggle') as HTMLInputElement;
    let filterMethodSelect = document.getElementById('filterMethodSelect') as HTMLSelectElement;

    if (storage.password && storage.password != '') {
      protected = true;
      disable(domainFilter);
      disable(domainToggle);
      disable(filterMethodSelect);
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      disabledDomains = storage.disabledDomains;
      filterMethodSelect.selectedIndex = storage.filterMethod;
      var tab = tabs[0];
      var url = new URL(tab.url);
      domain = url.hostname;

      // Restricted pages
      if (url.protocol == 'chrome:' || url.protocol == 'about:' || domain == 'chrome.google.com') {
        domainFilter.checked = false;
        disable(domainFilter);
        disable(domainToggle);
        disable(filterMethodSelect);
        return false;
      }

      // Set initial value for domain filter
      var domainRegex;
      for (var x = 0; x < disabledDomains.length; x++) {
        if (disabledDomains[x]) {
          domainRegex = new RegExp("(^|\.)" + disabledDomains[x]);
          if (domainRegex.test(domain)) {
            domainFilter.checked = false;
            disable(filterMethodSelect);
            break;
          }
        }
      }
    });
  });
}

function toggleFilter(event) {
  if (!protected) {
    let domainFilter = document.getElementById('domainFilter') as HTMLInputElement;
    if (domainFilter.checked) {
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
}