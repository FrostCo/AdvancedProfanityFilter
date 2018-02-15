////
// Helper functions
function arrayContains(array, string) {
  return (array.indexOf(string) > -1);
}

function removeFromArray(array, element) {
  return array.filter(e => e !== element);
}

////
// Actions and messaging

// Open options page if extension icon is clicked
chrome.browserAction.onClicked.addListener(function() {chrome.runtime.openOptionsPage();});

// Actions for extension install or upgrade
chrome.runtime.onInstalled.addListener(function(details){
  if (details.reason == 'install'){
    chrome.runtime.openOptionsPage();
  } else if (details.reason == 'update') {
    // var thisVersion = chrome.runtime.getManifest().version;
    // console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");

    // TODO: Migrate wordList - Open options page to show new features
    chrome.runtime.openOptionsPage();
  }
});

// Show badge with number of words filtered
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.counter) {
      chrome.browserAction.setBadgeText({text: request.counter, tabId: sender.tab.id});
    } else if (request.disabled) {
      chrome.browserAction.setIcon({path: 'icons/icon19-disabled.png', tabId: sender.tab.id});
      selectDisableDomainMenuItem();
    } else if (request.disabled === false) {
      selectEnableDomainMenuItem();
    }
  }
);

////
// Context menu
//
function addSelection(selection) {
  chrome.storage.sync.get({"words": {}}, function(storage) {
    selection = (selection.trim()).toLowerCase();
    if (!arrayContains(Object.keys(storage.words), selection)) {
      storage.words[selection] = {"matchMethod": 0, "words": []};
      chrome.storage.sync.set({"words": storage.words}, function() {
        if (!chrome.runtime.lastError) {
          chrome.tabs.reload();
        }
      });
    };
  });
}

function disableDomain(domain) {
  chrome.storage.sync.get({"disabledDomains": []}, function(storage) {
    if (!arrayContains(storage.disabledDomains, domain)) {
      storage.disabledDomains.push(domain);
      chrome.storage.sync.set({"disabledDomains": storage.disabledDomains}, function() {
        if (!chrome.runtime.lastError) {
          chrome.tabs.reload();
        }
      });
    };
  });
}

// Remove all entries that disable the filter for domain
function enableDomain(domain) {
  chrome.storage.sync.get({"disabledDomains": []}, function(storage) {
    var newDisabledDomains = storage.disabledDomains;

    for (var x = 0; x < storage.disabledDomains.length; x++) {
      domainRegex = new RegExp('(^|\.)' + storage.disabledDomains[x]);
      if (domainRegex.test(domain)) {
        newDisabledDomains = removeFromArray(newDisabledDomains, storage.disabledDomains[x]);
      }
    }

    chrome.storage.sync.set({"disabledDomains": newDisabledDomains}, function() {
      if (!chrome.runtime.lastError) {
        chrome.tabs.reload();
      }
    });
  });
}

function selectDisableDomainMenuItem() {
  chrome.contextMenus.update('enableDomain', { "checked": false });
  chrome.contextMenus.update('disableDomain', { "checked": true });
}

function selectEnableDomainMenuItem() {
  chrome.contextMenus.update('disableDomain', { "checked": false });
  chrome.contextMenus.update('enableDomain', { "checked": true });
}

////
// Menu Items
chrome.contextMenus.create({
  "id": "addSelection",
  "title": "Add selection to filter",
  "contexts": ["selection"]
});

chrome.contextMenus.create({
  "id": "disableDomain",
  "title": "Disable filter for domain",
  "type": "radio",
  "checked": false,
  "contexts": ["all"]
});

chrome.contextMenus.create({
  "id": "enableDomain",
  "title": "Enable filter for domain",
  "type": "radio",
  "checked": true,
  "contexts": ["all"]
});

chrome.contextMenus.create({id: "separator1", type: "separator"});

chrome.contextMenus.create({
  "id": "options",
  "title": "Options...",
  "contexts": ["all"]
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  switch(info.menuItemId) {
    case "addSelection":
      addSelection(info.selectionText); break;
    case "disableDomain":
      if (!info.wasChecked) {
        var url = new URL(tab.url);
        var domain = url.hostname;
        disableDomain(domain);
      } break;
    case "enableDomain":
      if (!info.wasChecked) {
        var url = new URL(tab.url);
        var domain = url.hostname;
        enableDomain(domain);
      } break;
    case "options":
      chrome.runtime.openOptionsPage(); break;
  }
});
