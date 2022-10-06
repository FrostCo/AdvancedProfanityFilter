import Constants from './lib/constants';
import DataMigration from './dataMigration';
import Domain from './domain';
import WebConfig from './webConfig';
import { formatNumber, makeRequest } from './lib/helper';
import Logger from './lib/logger';

const COLOR_BLUE = [66, 133, 244, 255] as chrome.action.ColorArray;
const COLOR_BLUE_VIOLET = [138, 43, 226, 255] as chrome.action.ColorArray;
const COLOR_FOREST_GREEN = [34, 139, 34, 255] as chrome.action.ColorArray;
const COLOR_GREY = [85, 85, 85, 255] as chrome.action.ColorArray;
// const COLOR_ORANGE = [236, 147, 41, 255] as chrome.action.ColorArray;
const COLOR_RED = [211, 45, 39, 255] as chrome.action.ColorArray;
const BADGE_COLORS = [COLOR_GREY, COLOR_BLUE, COLOR_RED, COLOR_RED, COLOR_BLUE_VIOLET, COLOR_FOREST_GREEN] as chrome.action.ColorArray[];

////
// Functions
//
function contextMenuRemoveAll() {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.removeAll(() => {
      resolve(false);
    });
  });
}

async function contextMenuSetup(enabled?: boolean) {
  await contextMenuRemoveAll();

  if (enabled == null) {
    enabled = (await WebConfig.getSyncStorage({ contextMenu: WebConfig._defaults.contextMenu }) as WebConfig).contextMenu;
  }

  if (enabled) {
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
      id: 'toggleForDomain',
      title: 'Toggle for domain',
      contexts: ['all'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });

    chrome.contextMenus.create({
      id: 'toggleAdvancedForDomain',
      title: 'Toggle advanced for domain',
      contexts: ['all'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });

    chrome.contextMenus.create({
      id: 'toggleFramesForDomain',
      title: 'Toggle frames for domain',
      contexts: ['all'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });

    chrome.contextMenus.create({
      id: 'options',
      title: 'Options',
      contexts: ['all']
    });
  }
}

function contextMenusOnClick(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) {
  switch (info.menuItemId) {
    case 'addSelection':
      processSelection('addWord', info.selectionText); break;
    case 'disableTabOnce':
      disableTabOnce(tab.id); break;
    case 'options':
      chrome.runtime.openOptionsPage(); break;
    case 'removeSelection':
      processSelection('removeWord', info.selectionText); break;
    case 'toggleAdvancedForDomain':
      toggleDomain((new URL(tab.url)).hostname, 'advanced'); break;
    case 'toggleForDomain':
      toggleDomain((new URL(tab.url)).hostname, 'disable'); break;
    case 'toggleFramesForDomain':
      toggleDomain((new URL(tab.url)).hostname, 'frames'); break;
    case 'toggleTabDisable':
      toggleTabDisable(tab.id); break;
  }
}

async function disableTabOnce(tabId: number) {
  const storage = await loadBackgroundStorage();
  const tabOptions = await getTabOptions(storage, tabId);
  tabOptions.disabledOnce = true;
  await saveBackgroundStorage(storage);
  chrome.tabs.reload(tabId);
  Logger.info('[Background] disabling tab once.', tabId);
}

async function getGlobalVariable(variableName: string, sender, sendResponse) {
  const [{ result }] = await chrome.scripting.executeScript({
    func: getWindowVariable,
    args: [variableName],
    target: { tabId: sender.tab.id, frameIds: [sender.frameId] },
    world: 'MAIN',
  });
  sendResponse(result);
}

function getTabOptions(storage: BackgroundStorage, tabId: number): TabStorageOptions {
  return storage.tabs[tabId] || newTabOptions(storage, tabId);
}

// variableName Supports '.' notation for nested values: window.nested.value
function getWindowVariable(variableName: string) {
  try {
    const properties = variableName.split('.');
    return properties.reduce((prev, curr) => prev && prev[curr], window);
  } catch {
    return null;
  }
}

async function handleBackgroundDataRequest(tabId: number, sendResponse, iframe: boolean) {
  const storage = await loadBackgroundStorage();
  const response: BackgroundData = { disabledTab: false };
  const tabOptions = getTabOptions(storage, tabId);
  if (tabOptions.disabled || tabOptions.disabledOnce) {
    response.disabledTab = true;
  }
  sendResponse(response);

  let updated = false;
  if (tabOptions.disabledOnce) {
    tabOptions.disabledOnce = false;
    updated = true;
  }

  // Reset filter status for main page
  if (!iframe) {
    tabOptions.status = 0;
    updated = true;
  }

  if (updated) await saveBackgroundStorage(storage);
}

async function handleRequest(url: string, method: string = 'GET', sendResponse) {
  const response = await makeRequest(url, method);
  sendResponse(response);
}

async function loadBackgroundStorage(): Promise<BackgroundStorage> {
  const data = await WebConfig.getLocalStorage({ background: { tabs: {} } });
  return data['background'] as BackgroundStorage;
}

function notificationsOnClick(notificationId: string) {
  switch (notificationId) {
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
    contextMenuSetup();
    const thisVersion = chrome.runtime.getManifest().version;
    Logger.info(`[Background] Updated from ${details.previousVersion} to ${thisVersion}.`);

    // Open options page to show new features
    // chrome.runtime.openOptionsPage();

    // Run any data migrations on update
    runUpdateMigrations(details.previousVersion);

    // Display update notification
    if (chrome.notifications != null) { // Not available in Safari
      chrome.storage.sync.get({ showUpdateNotification: true }, (data) => {
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
}

function onMessage(request: Message, sender: chrome.runtime.MessageSender, sendResponse) {
  if (request.destination !== Constants.MESSAGING.BACKGROUND) return true;

  // Support manifest V2/V3
  const chromeAction = chrome.action || chrome.browserAction;

  switch (request.source) {
    case Constants.MESSAGING.CONTEXT:
      if (request.disabled === true) {
        chromeAction.setIcon({ path: 'img/icon19-disabled.png', tabId: sender.tab.id });
      } else if (request.backgroundData === true) {
        handleBackgroundDataRequest(sender.tab.id, sendResponse, request.iframe);
        return true; // return true when waiting on an async call
      } else if (request.fetch) {
        handleRequest(request.fetch, request.fetchMethod, sendResponse);
        return true; // return true when waiting on an async call
      } else if (request.globalVariable) {
        getGlobalVariable(request.globalVariable, sender, sendResponse);
        return true; // return true when waiting on an async call
      } else {
        // Update tab's status and set badge color
        if (request.status) {
          updateStatus(chromeAction, sender.tab.id, request.status, request.forceUpdate);
        }

        // Show count of words filtered on badge
        if (request.counter != undefined) {
          chromeAction.setBadgeText({ text: formatNumber(request.counter), tabId: sender.tab.id });
        }

        // Set mute state for tab
        if (request.mute != undefined) {
          chrome.tabs.update(sender.tab.id, { muted: request.mute });
        }

        // Unmute on page reload
        if (request.clearMute === true && sender.tab != undefined) {
          const { muted, reason, extensionId } = sender.tab.mutedInfo;
          if (muted && reason == 'extension' && extensionId == chrome.runtime.id) {
            chrome.tabs.update(sender.tab.id, { muted: false });
          }
        }
      }
      break;

    case Constants.MESSAGING.OPTION:
      if (request.updateContextMenus != null) {
        contextMenuSetup(request.updateContextMenus);
      } else {
        Logger.error('Received unhandled message.', JSON.stringify(request));
      }
      break;

    case Constants.MESSAGING.POPUP:
      if (request.getStatus) {
        updatePopupStatus(request.tabId, null, sendResponse);
        return true; // return true when waiting on an async call
      } else {
        Logger.error('Received unhandled message.', JSON.stringify(request));
      }
      break;

    default:
      Logger.error('Received message without a supported source:', JSON.stringify(request));
  }

  sendResponse(); // Issue 393 - Chrome 99+ promisified sendMessage expects callback to be called
}

async function onStartup() {
  contextMenuSetup();

  // Clear background storage on startup
  await saveBackgroundStorage({ tabs: {} });
}

// Add selected word/phrase and reload page (unless already present)
async function processSelection(action: string, selection: string) {
  const cfg = await WebConfig.load('words');
  const result = cfg[action](selection);

  if (result) {
    try {
      await cfg.save('words');
      chrome.tabs.reload();
    } catch (err) {
      Logger.errorTime(`[Background] Failed to process selection '${selection}'.`, err);
    }
  }
}

async function runUpdateMigrations(previousVersion) {
  if (DataMigration.migrationNeeded(previousVersion)) {
    const cfg = await WebConfig.load();
    const migration = new DataMigration(cfg);
    const migrated = migration.byVersion(previousVersion);
    if (migrated) cfg.save();
  }
}

function newTabOptions(storage: BackgroundStorage, tabId: number, options: TabStorageOptions = {}): TabStorageOptions {
  const _defaults: TabStorageOptions = { status: 0, disabled: false, disabledOnce: false };
  const tabOptions = Object.assign({}, _defaults, options) as TabStorageOptions;
  tabOptions.id = tabId;
  tabOptions.registeredAt = new Date().getTime();
  storage.tabs[tabId] = tabOptions;
  return storage.tabs[tabId];
}

async function saveBackgroundStorage(storage: BackgroundStorage) {
  await WebConfig.saveLocalStorage({ background: storage });
}

async function tabsOnRemoved(tabId: number) {
  const storage = await loadBackgroundStorage();
  if (storage.tabs[tabId]) {
    delete storage.tabs[tabId];
    await saveBackgroundStorage(storage);
  }
}

async function tabsOnUpdated(tabId, changeInfo, tab) {
  if (changeInfo.url) {
    const message: Message = { source: Constants.MESSAGING.BACKGROUND, destination: Constants.MESSAGING.CONTEXT, urlUpdate: changeInfo.url };
    chrome.tabs.sendMessage(tabId, message, () => chrome.runtime.lastError); // Suppress error if no listener
  }
}

async function toggleDomain(hostname: string, action: string) {
  const cfg = await WebConfig.load(['domains', 'enabledDomainsOnly', 'enabledFramesOnly']);
  const domain = Domain.byHostname(hostname, cfg.domains);

  switch (action) {
    case 'advanced':
      domain.advanced = !domain.advanced; break;
    case 'disable':
      cfg.enabledDomainsOnly ? domain.enabled = !domain.enabled : domain.disabled = !domain.disabled; break;
    case 'frames':
      cfg.enabledFramesOnly ? domain.framesOn = !domain.framesOn : domain.framesOff = !domain.framesOff; break;
  }

  try {
    await domain.save(cfg);
    chrome.tabs.reload();
  } catch (err) {
    Logger.error(`[Background] Failed to modify '${action}' for domain '${domain.cfgKey}'.`, err, domain);
  }
}

async function toggleTabDisable(tabId: number) {
  const storage = await loadBackgroundStorage();
  const tabOptions = getTabOptions(storage, tabId);
  tabOptions.disabled = !tabOptions.disabled;
  await saveBackgroundStorage(storage);
  chrome.tabs.reload(tabId);
}

async function updatePopupStatus(tabId: number, status?: number, sendResponse?) {
  if (!status) {
    const storage = await loadBackgroundStorage();
    const tabOptions = await getTabOptions(storage, tabId);
    status = tabOptions.status;
  }
  if (!sendResponse) sendResponse = chrome.runtime.sendMessage;
  const message: Message = { destination: 'popup', source: 'background', status: status, tabId: tabId };
  sendResponse(message, () => chrome.runtime.lastError); // Suppress error if Popup isn't active
}

async function updateStatus(chromeAction, tabId: number, status: number, forceUpdate = false) {
  const storage = await loadBackgroundStorage();
  const tabOptions = await getTabOptions(storage, tabId);

  // Only let status increase
  if (forceUpdate || status > tabOptions.status) {
    tabOptions.status = status;
    chromeAction.setBadgeBackgroundColor({ color: BADGE_COLORS[tabOptions.status], tabId: tabId });
    updatePopupStatus(tabId, tabOptions.status);
    await saveBackgroundStorage(storage);
  }
}

////
// Listeners
//
chrome.contextMenus.onClicked.addListener((info, tab) => { contextMenusOnClick(info, tab); });
chrome.runtime.onInstalled.addListener((details) => { onInstalled(details); });
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => { return onMessage(request, sender, sendResponse); });
chrome.runtime.onStartup.addListener(() => { onStartup(); });
chrome.tabs.onRemoved.addListener((tabId) => { tabsOnRemoved(tabId); });
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => { tabsOnUpdated(tabId, changeInfo, tab); });
if (chrome.notifications != null) { // Not available in Safari
  chrome.notifications.onClicked.addListener((notificationId) => { notificationsOnClick(notificationId); });
}
