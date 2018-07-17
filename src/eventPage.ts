// tsc --outfile ./dist/eventPage.js ./src/helper.ts ./src/config.ts ./src/eventPage.ts --target es6

////
// Actions and messaging

// Actions for extension install or upgrade
chrome.runtime.onInstalled.addListener(function(details){
  if (details.reason == 'install') {
    chrome.runtime.openOptionsPage();
  } else if (details.reason == 'update') {
    // var thisVersion = chrome.runtime.getManifest().version;
    // console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");

    // TODO: Migrate wordList - Open options page to show new features
    // chrome.runtime.openOptionsPage();

    // TODO: Move words to _words*
    updateRemoveWordsFromStorage();

    // Display update notification
    chrome.notifications.create("extensionUpdate", {
      "type": "basic",
      "title": "Advanced Profanity Filter",
      "message": "Update installed, click for changelog.",
      "iconUrl": "icons/icon64.png",
      "isClickable": true,
    });
  }
});

// Show badge with number of words filtered
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.counter) {
      chrome.browserAction.setBadgeText({text: request.counter, tabId: sender.tab.id});
    } else if (request.disabled) {
      chrome.browserAction.setIcon({path: 'icons/icon19-disabled.png', tabId: sender.tab.id});
    }
  }
);

////
// Context menu
//
// Add selected word/phrase and reload page (unless already present)
async function addSelection(selection: string) {
  selection = (selection.trim()).toLowerCase();
  let cfg = await Config.build(['words']);

  if (!arrayContains(Object.keys(cfg.words), selection)) {
    cfg.words[selection] = {"matchMethod": 0, "words": []};
    let result = await cfg.save();
    if (!result) { chrome.tabs.reload(); }
  }
}

// Disable domain and reload page (unless already disabled)
async function disableDomainEventPage(domain: string) {
  let cfg = await Config.build(['disabledDomains']);

  if (!arrayContains(cfg.disabledDomains, domain)) {
    cfg.disabledDomains.push(domain);
    let result = await cfg.save();
    if (!result) { chrome.tabs.reload(); }
  }
}

// Remove all entries that disable the filter for domain
async function enableDomainEventPage(domain: string) {
  let cfg = await Config.build(['disabledDomains']);
  let domainRegex, foundMatch;
  let newDisabledDomains = cfg.disabledDomains;

  for (let x = 0; x < cfg.disabledDomains.length; x++) {
    domainRegex = new RegExp('(^|\.)' + cfg.disabledDomains[x]);
    if (domainRegex.test(domain)) {
      foundMatch = true;
      newDisabledDomains = removeFromArray(newDisabledDomains, cfg.disabledDomains[x]);
    }
  }

  if (foundMatch) {
    cfg.disabledDomains = newDisabledDomains;
    let result = await cfg.save();
    if (!result) { chrome.tabs.reload(); }
  }
}

async function toggleFilterEventPage(domain: string) {
  let cfg = await Config.build(['disabledDomains']);
  let domainRegex;
  let disabled = false;

  for (let x = 0; x < cfg.disabledDomains.length; x++) {
    if (cfg.disabledDomains[x]) {
      domainRegex = new RegExp("(^|\.)" + cfg.disabledDomains[x]);
      if (domainRegex.test(domain)) {
        disabled = true;
        break;
      }
    }
  }

  disabled ? enableDomainEventPage(domain) : disableDomainEventPage(domain);
}

// TODO: Remove after update: transition from previous words structure under the hood
function updateRemoveWordsFromStorage() {
  chrome.storage.sync.get({"words": null}, function(oldWords) {
    console.log('Old words for migration:', oldWords.words);
    if (oldWords.words) {
      chrome.storage.sync.set({"_words0": oldWords.words}, function() {
        if (!chrome.runtime.lastError) {
          chrome.storage.sync.remove("words", function() {
            // Split words if necessary
            var wordsPromise = new Promise(function(resolve, reject) {
              resolve(Config.build());
            });
            wordsPromise
              .then(function(response: Config) {
                response.save();
              });
          });
        }
      });
    }
  });
}

////
// Menu Items
chrome.contextMenus.removeAll(function() {
  chrome.contextMenus.create({
    "id": "addSelection",
    "title": "Add selection to filter",
    "contexts": ["selection"]
  });

  chrome.contextMenus.create({
    "id": "toggleFilterForDomain",
    "title": "Toggle filter for domain",
    "contexts": ["all"]
  });

  chrome.contextMenus.create({
    "id": "options",
    "title": "Options",
    "contexts": ["page", "selection"]
  });
});

////
// Listeners
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  switch(info.menuItemId) {
    case "addSelection":
      addSelection(info.selectionText); break;
    case "toggleFilterForDomain":
      let url = new URL(tab.url);
      let domain = url.hostname;
      toggleFilterEventPage(domain); break;
    case "options":
      chrome.runtime.openOptionsPage(); break;
  }
});

chrome.notifications.onClicked.addListener(function(notificationId) {
  switch(notificationId) {
    case "extensionUpdate":
      chrome.notifications.clear("extensionUpdate");
      chrome.tabs.create({url: "https://github.com/richardfrost/AdvancedProfanityFilter/releases"});
      break;
  }
});
