// Open options page if extension icon is clicked
chrome.browserAction.onClicked.addListener(function() {chrome.runtime.openOptionsPage();});

// Actions for extension install or upgrade
chrome.runtime.onInstalled.addListener(function(details){
  if (details.reason == "install"){
    chrome.runtime.openOptionsPage();
  } else if (details.reason == "update") {
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
      chrome.browserAction.setIcon({path: "icons/icon19-disabled.png", tabId: sender.tab.id});
    }
  }
);

////
// Context menu
//
function arrayContains(array, string) {
  return (array.indexOf(string) > -1);
}

function addSelection(selection) {
  chrome.storage.sync.get({'words': {}}, function(storage) {
    selection = (selection.trim()).toLowerCase();
    if (!arrayContains(Object.keys(storage.words), selection)) {
      storage.words[selection] = {"matchMethod": 0, "words": []};
      chrome.storage.sync.set({'words': storage.words}, function() {
        if (!chrome.runtime.lastError) {
          chrome.tabs.reload();
        }
      });
    };
  });
}

function disableDomain(domain) {
  chrome.storage.sync.get({'disabledDomains': []}, function(storage) {
    if (!arrayContains(storage.disabledDomains, domain)) {
      storage.disabledDomains.push(domain);
      chrome.storage.sync.set({'disabledDomains': storage.disabledDomains}, function() {
        if (!chrome.runtime.lastError) {
          chrome.tabs.reload();
        }
      });
    };
  });
}

chrome.contextMenus.create({
  "id": "addSelection",
  "title": "Add selection to filter",
  "contexts": ["selection"]
});
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId == "addSelection") {
    addSelection(info.selectionText);
  }
});

chrome.contextMenus.create({
  "id": "disableDomain",
  "title": "Disable filter for domain",
  "contexts": ["all"]
});
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId == "disableDomain") {
    var url = new URL(tab.url);
    var domain = url.hostname;
    disableDomain(domain);
  }
});
