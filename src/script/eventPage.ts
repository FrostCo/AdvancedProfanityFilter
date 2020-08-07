import DataMigration from './dataMigration';
import Domain from './domain';
import WebConfig from './webConfig';
import { formatNumber } from './lib/helper';

let Storage: BackgroundStorage = {
  tabs: {},
};

////
// Functions
//
function contextMenusOnClick(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) {
  switch(info.menuItemId) {
    case 'addSelection':
      processSelection('addWord', info.selectionText); break;
    case 'disableTabOnce':
      disableTabOnce(tab.id); break;
    case 'removeSelection':
      processSelection('removeWord', info.selectionText); break;
    case 'toggleFilterForDomain': {
      let url = new URL(tab.url);
      toggleDomain(url.hostname, 'disable'); break;
    }
    case 'toggleTabDisable':
      toggleTabDisable(tab.id); break;
    case 'toggleAdvancedModeForDomain': {
      let url = new URL(tab.url);
      toggleDomain(url.hostname, 'advanced'); break;
    }
    case 'options':
      chrome.runtime.openOptionsPage(); break;
  }
}

function disableTabOnce(id: number): void {
  saveTabOptions(id, { disabledOnce: true });
  chrome.tabs.reload();
}

function getTabOptions(id: number): TabStorageOptions {
  return storedTab(id) ? Storage.tabs[id] : saveNewTabOptions(id);
}

function notificationsOnClick(notificationId: string) {
  switch(notificationId) {
    case 'extensionUpdate':
      chrome.notifications.clear('extensionUpdate');
      chrome.tabs.create({ url: 'https://github.com/richardfrost/AdvancedProfanityFilter/releases' });
      break;
  }
}

// Actions for extension install or upgrade
function onInstalled(details: chrome.runtime.InstalledDetails) {
  if (details.reason == 'install') {
    chrome.runtime.openOptionsPage();
  } else if (details.reason == 'update') {
    // let thisVersion = chrome.runtime.getManifest().version;
    // console.log('Updated from ' + details.previousVersion + ' to ' + thisVersion);

    // Open options page to show new features
    // chrome.runtime.openOptionsPage();

    // Run any data migrations on update
    runUpdateMigrations(details.previousVersion);

    // Display update notification
    chrome.storage.sync.get({ showUpdateNotification: true }, function(data) {
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
}

function onMessage(request: Message, sender, sendResponse) {
  if (request.disabled === true) {
    chrome.browserAction.setIcon({ path: 'img/icon19-disabled.png', tabId: sender.tab.id });
  } else if (request.backgroundData === true) {
    let response: BackgroundData = { disabledTab: false };
    let tabOptions = getTabOptions(sender.tab.id);
    if (tabOptions.disabled || tabOptions.disabledOnce) {
      response.disabledTab = true;
      if (tabOptions.disabledOnce) { tabOptions.disabledOnce = false; }
    }
    sendResponse(response);
  } else {
    // Set badge color
    // chrome.browserAction.setBadgeBackgroundColor({ color: [138, 43, 226, 255], tabId: sender.tab.id }); // Blue Violet
    // chrome.browserAction.setBadgeBackgroundColor({ color: [85, 85, 85, 255], tabId: sender.tab.id }); // Grey (Default)
    // chrome.browserAction.setBadgeBackgroundColor({ color: [236, 147, 41, 255], tabId: sender.tab.id }); // Orange
    if (request.setBadgeColor) {
      if (request.mutePage) {
        chrome.browserAction.setBadgeBackgroundColor({ color: [34, 139, 34, 255], tabId: sender.tab.id }); // Forest Green - Audio
      } else if (request.advanced) {
        chrome.browserAction.setBadgeBackgroundColor({ color: [211, 45, 39, 255], tabId: sender.tab.id }); // Red - Advanced
      } else {
        chrome.browserAction.setBadgeBackgroundColor({ color: [66, 133, 244, 255], tabId: sender.tab.id }); // Blue - Normal
      }
    }

    // Show count of words filtered on badge
    if (request.counter != undefined) {
      chrome.browserAction.setBadgeText({ text: formatNumber(request.counter), tabId: sender.tab.id });
    }

    // Set mute state for tab
    if (request.mute != undefined) {
      chrome.tabs.update(sender.tab.id, { muted: request.mute });
    }

    // Unmute on page reload
    if (request.clearMute === true && sender.tab != undefined) {
      let { muted, reason, extensionId } = sender.tab.mutedInfo;
      if (muted && reason == 'extension' && extensionId == chrome.runtime.id) {
        chrome.tabs.update(sender.tab.id, { muted: false });
      }
    }
  }
}

// Add selected word/phrase and reload page (unless already present)
async function processSelection(action: string, selection: string) {
  let cfg = await WebConfig.build('words');
  let result = cfg[action](selection);

  if (result) {
    let saved = await cfg.save();
    if (!saved) { chrome.tabs.reload(); }
  }
}

function saveNewTabOptions(id: number, options: TabStorageOptions = {}): TabStorageOptions {
  const _defaults: TabStorageOptions = { disabled: false, disabledOnce: false };
  let tabOptions = Object.assign({}, _defaults, options) as TabStorageOptions;
  tabOptions.id = id;
  tabOptions.registeredAt = new Date().getTime();
  Storage.tabs[id] = tabOptions;
  return tabOptions;
}

function saveTabOptions(id: number, options: TabStorageOptions = {}): TabStorageOptions {
  return storedTab(id) ? Object.assign(getTabOptions(id), options) : saveNewTabOptions(id, options);
}

function storedTab(id: number): boolean {
  return Storage.tabs.hasOwnProperty(id);
}

function tabsOnActivated(tab: chrome.tabs.TabActiveInfo) {
  let tabId = tab ? tab.tabId : chrome.tabs.TAB_ID_NONE;
  if (!storedTab(tabId)) { saveTabOptions(tabId); }
}

function tabsOnRemoved(tabId: number) {
  if (storedTab(tabId)) { delete Storage.tabs[tabId]; }
}

async function toggleDomain(hostname: string, action: string) {
  let cfg = await WebConfig.build(['domains', 'enabledDomainsOnly']);
  let domain = Domain.byHostname(hostname, cfg.domains);

  switch(action) {
    case 'disable':
      cfg.enabledDomainsOnly ? domain.enabled = !domain.enabled : domain.disabled = !domain.disabled; break;
    case 'advanced':
      domain.advanced = !domain.advanced; break;
  }

  let error = await domain.save(cfg);
  if (!error) { chrome.tabs.reload(); }
}

function toggleTabDisable(id: number) {
  let tabOptions = getTabOptions(id);
  tabOptions.disabled = !tabOptions.disabled;
  chrome.tabs.reload();
}

async function runUpdateMigrations(previousVersion) {
  if (DataMigration.migrationNeeded(previousVersion)) {
    let cfg = await WebConfig.build();
    let migration = new DataMigration(cfg);
    let migrated = migration.byVersion(previousVersion);
    if (migrated) cfg.save();
  }
}

////
// Context menu
//
chrome.contextMenus.removeAll(function() {
  chrome.contextMenus.create({
    id: 'addSelection',
    title: 'Add selection to filter',
    contexts: ['selection'],
    documentUrlPatterns: ['file://*/*', 'http://*/*', 'https://*/*']
  });

  chrome.contextMenus.create({
    id: 'removeSelection',
    title: 'Remove selection from filter',
    contexts: ['selection'],
    documentUrlPatterns: ['file://*/*', 'http://*/*', 'https://*/*']
  });

  chrome.contextMenus.create({
    id: 'disableTabOnce',
    title: 'Disable once',
    contexts: ['all'],
    documentUrlPatterns: ['http://*/*', 'https://*/*']
  });

  chrome.contextMenus.create({
    id: 'toggleTabDisable',
    title: 'Toggle for tab',
    contexts: ['all'],
    documentUrlPatterns: ['http://*/*', 'https://*/*']
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
//
chrome.contextMenus.onClicked.addListener((info, tab) => { contextMenusOnClick(info, tab); });
chrome.notifications.onClicked.addListener(notificationId => { notificationsOnClick(notificationId); });
chrome.runtime.onInstalled.addListener(details => { onInstalled(details); });
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => { onMessage(request, sender, sendResponse); });
chrome.tabs.onActivated.addListener(tab => { tabsOnActivated(tab); });
chrome.tabs.onRemoved.addListener(tabId => { tabsOnRemoved(tabId); });
