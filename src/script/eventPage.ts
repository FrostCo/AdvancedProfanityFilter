import WebConfig from './webConfig';
import Domain from './domain';
import DataMigration from './dataMigration';

////
// Actions and messaging

// Actions for extension install or upgrade
chrome.runtime.onInstalled.addListener(function(details){
  if (details.reason == 'install') {
    chrome.runtime.openOptionsPage();
  } else if (details.reason == 'update') {
    // var thisVersion = chrome.runtime.getManifest().version;
    // console.log('Updated from ' + details.previousVersion + ' to ' + thisVersion);

    // Open options page to show new features
    // chrome.runtime.openOptionsPage();

    // Run any data migrations on update
    updateMigrations(details.previousVersion);

    // Display update notification
    chrome.storage.sync.get({showUpdateNotification: true}, function(data) {
      if (data.showUpdateNotification) {
        chrome.notifications.create('extensionUpdate', {
          'type': 'basic',
          'title': 'Advanced Profanity Filter',
          'message': 'Update installed, click for changelog.',
          'iconUrl': 'img/icon64.png',
          'isClickable': true,
        });
      }
    });
  }
});

// Show badge with number of words filtered
chrome.runtime.onMessage.addListener(
  function(request: Message, sender, sendResponse) {
    if (request.disabled === true) {
      chrome.browserAction.setIcon({ path: 'img/icon19-disabled.png', tabId: sender.tab.id });
    } else {
      if (request.counter != undefined) {
        chrome.browserAction.setBadgeText({ text: request.counter.toString(), tabId: sender.tab.id });
      }

      // Set badge color
      if (request.setBadgeColor) {
        if (request.mutePage) {
          chrome.browserAction.setBadgeBackgroundColor({ color: [0, 204, 0, 255], tabId: sender.tab.id }); // Green - Audio
        } else if (request.advanced) {
          chrome.browserAction.setBadgeBackgroundColor({ color: [211, 45, 39, 255], tabId: sender.tab.id }); // Red - Advanced
        } else {
          chrome.browserAction.setBadgeBackgroundColor({ color: [66, 133, 244, 255], tabId: sender.tab.id }); // Blue - Normal
          // chrome.browserAction.setBadgeBackgroundColor({ color: [85, 85, 85, 255], tabId: sender.tab.id }); // Grey - Normal
          // chrome.browserAction.setBadgeBackgroundColor({ color: [236, 147, 41, 255], tabId: sender.tab.id }); // Orange
        }
      }

      if (request.mute != undefined) {
        chrome.tabs.update(sender.tab.id, { muted: request.mute });
      }

      // Unmute on page reload
      if (request.clearMute === true && sender.tab != undefined) {
        let {muted, reason, extensionId} = sender.tab.mutedInfo;
        if (muted && reason == 'extension' && extensionId == chrome.runtime.id) {
          chrome.tabs.update(sender.tab.id, { muted: false });
        }
      }
    }
  }
);

////
// Context menu
//
// Add selected word/phrase and reload page (unless already present)
async function addSelection(selection: string) {
  let cfg = await WebConfig.build(); // TODO: Only need words here
  let result = cfg.addWord(selection);

  if (result) {
    let saved = await cfg.save();
    if (!saved) { chrome.tabs.reload(); }
  }
}

// Disable domain and reload page (unless already disabled)
async function disableDomain(cfg: WebConfig, domain: string, key: string) {
  if (!cfg[key].includes(domain)) {
    cfg[key].push(domain);
    let result = await cfg.save();
    if (!result) { chrome.tabs.reload(); }
  }
}

// Remove all entries that disable the filter for domain
async function enableDomain(cfg: WebConfig, domain: string, key: string) {
  let newDomainList = Domain.removeFromList(domain, cfg[key]);

  if (newDomainList.length < cfg[key].length) {
    cfg[key] = newDomainList;
    let result = await cfg.save();
    if (!result) { chrome.tabs.reload(); }
  }
}

async function toggleDomain(domain: string, key: string) {
  let cfg = await WebConfig.build([key]);
  Domain.domainMatch(domain, cfg[key]) ? enableDomain(cfg, domain, key) : disableDomain(cfg, domain, key);
}

async function updateMigrations(previousVersion) {
  if (DataMigration.migrationNeeded(previousVersion)) {
    let cfg = await WebConfig.build();
    let migration = new DataMigration(cfg);
    let migrated = migration.byVersion(previousVersion);
    if (migrated) cfg.save();
  }
}

////
// Menu Items
chrome.contextMenus.removeAll(function() {
  chrome.contextMenus.create({
    id: 'addSelection',
    title: 'Add selection to filter',
    contexts: ['selection'],
    documentUrlPatterns: ['file://*/*', 'http://*/*', 'https://*/*']
  });

  chrome.contextMenus.create({
    id: 'toggleFilterForDomain',
    title: 'Toggle filter for domain',
    contexts: ['all'],
    documentUrlPatterns: ['http://*/*', 'https://*/*']
  });

  chrome.contextMenus.create({
    id: 'toggleAdvancedModeForDomain',
    title: 'Toggle advanced mode for domain',
    contexts: ['all'],
    documentUrlPatterns: ['http://*/*', 'https://*/*']
  });

  chrome.contextMenus.create({
    id: 'options',
    title: 'Options',
    contexts: ['all']
  });
});

////
// Listeners
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  switch(info.menuItemId) {
    case 'addSelection':
      addSelection(info.selectionText); break;
    case 'toggleFilterForDomain': {
      let url = new URL(tab.url);
      toggleDomain(url.hostname, 'disabledDomains'); break;
    }
    case 'toggleAdvancedModeForDomain': {
      let url = new URL(tab.url);
      toggleDomain(url.hostname, 'advancedDomains'); break;
    }
    case 'options':
      chrome.runtime.openOptionsPage(); break;
  }
});

chrome.notifications.onClicked.addListener(function(notificationId) {
  switch(notificationId) {
    case 'extensionUpdate':
      chrome.notifications.clear('extensionUpdate');
      chrome.tabs.create({url: 'https://github.com/richardfrost/AdvancedProfanityFilter/releases'});
      break;
  }
});
