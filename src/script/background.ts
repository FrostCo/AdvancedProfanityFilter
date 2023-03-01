import Constants from '@APF/lib/constants';
import DataMigration from '@APF/dataMigration';
import Domain from '@APF/domain';
import WebConfig from '@APF/webConfig';
import { formatNumber, makeRequest } from '@APF/lib/helper';
import Logger from '@APF/lib/logger';

export default class Background {
  //#region Class reference helpers
  // Can be overridden in children classes
  static get Config() { return WebConfig; }
  static get Constants() { return Constants; }
  static get DataMigration() { return DataMigration; }
  static get Domain() { return Domain; }
  //#endregion

  // #region Constants
  static readonly COLOR_BLUE = [66, 133, 244, 255] as chrome.action.ColorArray;
  static readonly COLOR_BLUE_VIOLET = [138, 43, 226, 255] as chrome.action.ColorArray;
  static readonly COLOR_FOREST_GREEN = [34, 139, 34, 255] as chrome.action.ColorArray;
  static readonly COLOR_GREY = [85, 85, 85, 255] as chrome.action.ColorArray;
  static readonly COLOR_ORANGE = [236, 147, 41, 255] as chrome.action.ColorArray;
  static readonly COLOR_RED = [211, 45, 39, 255] as chrome.action.ColorArray;
  static readonly BADGE_COLORS = [
    this.COLOR_GREY,
    this.COLOR_BLUE,
    this.COLOR_RED,
    this.COLOR_RED,
    this.COLOR_BLUE_VIOLET,
    this.COLOR_FOREST_GREEN,
  ] as chrome.action.ColorArray[];
  static readonly LOGGER = new Logger('Background');
  // #endregion

  // #region Static Methods
  static contextMenuRemoveAll() {
    return new Promise((resolve, reject) => {
      chrome.contextMenus.removeAll(() => {
        resolve(false);
      });
    });
  }

  static async contextMenuSetup(enabled?: boolean) {
    await this.contextMenuRemoveAll();

    if (enabled == null) {
      enabled = (await this.Config.getSyncStorage({ contextMenu: this.Config._defaults.contextMenu }) as WebConfig).contextMenu;
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

  static contextMenusOnClick(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) {
    switch (info.menuItemId) {
      case 'addSelection':
        this.processSelection('addWord', info.selectionText); break;
      case 'disableTabOnce':
        this.disableTabOnce(tab.id); break;
      case 'options':
        chrome.runtime.openOptionsPage(); break;
      case 'removeSelection':
        this.processSelection('removeWord', info.selectionText); break;
      case 'toggleAdvancedForDomain':
        this.toggleDomain((new URL(tab.url)).hostname, 'advanced'); break;
      case 'toggleForDomain':
        this.toggleDomain((new URL(tab.url)).hostname, 'disable'); break;
      case 'toggleFramesForDomain':
        this.toggleDomain((new URL(tab.url)).hostname, 'frames'); break;
      case 'toggleTabDisable':
        this.toggleTabDisable(tab.id); break;
    }
  }

  static async disableTabOnce(tabId: number) {
    const storage = await this.loadBackgroundStorage();
    const tabOptions = await this.getTabOptions(storage, tabId);
    tabOptions.disabledOnce = this.Constants.TAB_DISABLE_ONCE.WILL_DISABLE;
    await this.saveBackgroundStorage(storage);
    chrome.tabs.reload(tabId);
    this.LOGGER.info('disabling tab once.', tabId);
  }

  static async getGlobalVariable(variableName: string, sender, sendResponse) {
    const [{ result }] = await chrome.scripting.executeScript({
      func: this.getWindowVariable,
      args: [variableName],
      target: { tabId: sender.tab.id, frameIds: [sender.frameId] },
      world: 'MAIN',
    });
    sendResponse(result);
  }

  static getTabOptions(storage: BackgroundStorage, tabId: number): TabStorageOptions {
    return storage.tabs[tabId] || this.newTabOptions(storage, tabId);
  }

  // variableName Supports '.' notation for nested values: window.nested.value
  static getWindowVariable(variableName: string) {
    try {
      const properties = variableName.split('.');
      return properties.reduce((prev, curr) => prev && prev[curr], window);
    } catch {
      return null;
    }
  }

  static async handleBackgroundDataRequest(request: Message, sender: chrome.runtime.MessageSender, sendResponse) {
    const storage = await this.loadBackgroundStorage();
    const tabId = request.source == this.Constants.MESSAGING.CONTEXT ? sender.tab.id : request.tabId;
    const response: BackgroundData = { disabledTab: false };
    const tabOptions = this.getTabOptions(storage, tabId);

    if (
      tabOptions.disabled
      || (request.source == this.Constants.MESSAGING.CONTEXT && tabOptions.disabledOnce == this.Constants.TAB_DISABLE_ONCE.WILL_DISABLE)
      || (request.source == this.Constants.MESSAGING.POPUP && tabOptions.disabledOnce == this.Constants.TAB_DISABLE_ONCE.DISABLED)
    ) {
      response.disabledTab = true;
    }
    sendResponse(response);

    if (request.source == this.Constants.MESSAGING.POPUP) return;

    let updated = false;
    if (tabOptions.disabledOnce == this.Constants.TAB_DISABLE_ONCE.WILL_DISABLE) {
      tabOptions.disabledOnce = this.Constants.TAB_DISABLE_ONCE.DISABLED;
      updated = true;
    } else if (tabOptions.disabledOnce == this.Constants.TAB_DISABLE_ONCE.DISABLED) {
      tabOptions.disabledOnce = this.Constants.TAB_DISABLE_ONCE.NOT_SET;
      updated = true;
    }

    // Reset filter status for main page
    if (!request.iframe) {
      tabOptions.status = 0;
      updated = true;
    }

    if (updated) await this.saveBackgroundStorage(storage);
  }

  static async handleRequest(url: string, method: string = 'GET', sendResponse) {
    const response = await makeRequest(url, method);
    sendResponse(response);
  }

  static async loadBackgroundStorage(): Promise<BackgroundStorage> {
    const data = await this.Config.getLocalStorage({ background: { tabs: {} } });
    return data['background'] as BackgroundStorage;
  }

  static newTabOptions(storage: BackgroundStorage, tabId: number, options: TabStorageOptions = {}): TabStorageOptions {
    const _defaults: TabStorageOptions = { status: 0, disabled: false, disabledOnce: this.Constants.TAB_DISABLE_ONCE.NOT_SET };
    const tabOptions = Object.assign({}, _defaults, options) as TabStorageOptions;
    tabOptions.id = tabId;
    tabOptions.registeredAt = new Date().getTime();
    storage.tabs[tabId] = tabOptions;
    return storage.tabs[tabId];
  }

  static notificationsOnClick(notificationId: string) {
    switch (notificationId) {
      case 'extensionUpdate':
        chrome.notifications.clear('extensionUpdate');
        chrome.tabs.create({ url: 'https://github.com/FrostCo/AdvancedProfanityFilter/releases' });
        break;
    }
  }

  // Actions for extension install or upgrade
  static onInstalled(details: chrome.runtime.InstalledDetails) {
    if (details.reason == 'install') {
      chrome.runtime.openOptionsPage();
    } else if (details.reason == 'update') {
      this.contextMenuSetup();
      const thisVersion = chrome.runtime.getManifest().version;
      this.LOGGER.info(`Updated from ${details.previousVersion} to ${thisVersion}.`);

      // Open options page to show new features
      // chrome.runtime.openOptionsPage();

      // Run any data migrations on update
      this.runUpdateMigrations(details.previousVersion);

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

  static onMessage(request: Message, sender: chrome.runtime.MessageSender, sendResponse) {
    if (request.destination !== this.Constants.MESSAGING.BACKGROUND) return true;

    // Support manifest V2/V3
    const chromeAction = chrome.action || chrome.browserAction;

    switch (request.source) {
      case this.Constants.MESSAGING.CONTEXT:
        if (request.disabled === true) {
          chromeAction.setIcon({ path: 'img/icon19-disabled.png', tabId: sender.tab.id });
        } else if (request.backgroundData === true) {
          this.handleBackgroundDataRequest(request, sender, sendResponse);
          return true; // return true when waiting on an async call
        } else if (request.fetch) {
          this.handleRequest(request.fetch, request.fetchMethod, sendResponse);
          return true; // return true when waiting on an async call
        } else if (request.globalVariable) {
          this.getGlobalVariable(request.globalVariable, sender, sendResponse);
          return true; // return true when waiting on an async call
        } else {
          this.onContextMessageElse(chromeAction, request, sender, sendResponse);
        }
        break;

      case this.Constants.MESSAGING.OPTION:
        if (request.updateContextMenus != null) {
          this.contextMenuSetup(request.updateContextMenus);
        } else {
          this.LOGGER.error('Received unhandled message.', JSON.stringify(request));
        }
        break;

      case this.Constants.MESSAGING.POPUP:
        if (request.getStatus) {
          this.updatePopupStatus(request.tabId, null, sendResponse);
          return true; // return true when waiting on an async call
        } else if (request.backgroundData) {
          this.handleBackgroundDataRequest(request, sender, sendResponse);
          return true; // return true when waiting on an async call
        } else {
          this.LOGGER.error('Received unhandled message.', JSON.stringify(request));
        }
        break;

      default:
        this.LOGGER.error('Received message without a supported source:', JSON.stringify(request));
    }

    sendResponse(); // Issue 393 - Chrome 99+ promisified sendMessage expects callback to be called
  }

  static onContextMessageElse(chromeAction: typeof chrome.browserAction, request: Message, sender: chrome.runtime.MessageSender, sendResponse) {
    // Update tab's status and set badge color
    if (request.status) {
      this.updateStatus(chromeAction, sender.tab.id, request.status, request.forceUpdate);
    }

    // Show count of words filtered on badge
    if (request.counter != undefined) {
      chromeAction.setBadgeText({ text: formatNumber(request.counter), tabId: sender.tab.id });
    }
  }

  static async onStartup() {
    this.contextMenuSetup();

    // Clear background storage on startup
    await this.saveBackgroundStorage({ tabs: {} });
  }

  // Add selected word/phrase and reload page (unless already present)
  static async processSelection(action: string, selection: string) {
    const cfg = await this.Config.load('words');
    const result = cfg[action](selection);

    if (result) {
      try {
        await cfg.save('words');
        chrome.tabs.reload();
      } catch (err) {
        this.LOGGER.errorTime(`Failed to process selection '${selection}'.`, err);
      }
    }
  }

  static async runUpdateMigrations(previousVersion) {
    if (this.DataMigration.migrationNeeded(previousVersion)) {
      const cfg = await this.Config.load();
      const migration = new this.DataMigration(cfg);
      const migrated = await migration.byVersion(previousVersion);
      if (migrated) cfg.save();
    }
  }

  static async saveBackgroundStorage(storage: BackgroundStorage) {
    await this.Config.saveLocalStorage({ background: storage });
  }

  static async tabsOnRemoved(tabId: number) {
    const storage = await this.loadBackgroundStorage();
    if (storage.tabs[tabId]) {
      delete storage.tabs[tabId];
      await this.saveBackgroundStorage(storage);
    }
  }

  static async tabsOnUpdated(tabId, changeInfo, tab) {
    if (changeInfo.url) {
      const message: Message = { source: this.Constants.MESSAGING.BACKGROUND, destination: this.Constants.MESSAGING.CONTEXT, urlUpdate: changeInfo.url };
      chrome.tabs.sendMessage(tabId, message, () => chrome.runtime.lastError); // Suppress error if no listener
    }
  }

  static async toggleDomain(hostname: string, action: string) {
    const cfg = await this.Config.load(['domains', 'enabledDomainsOnly', 'enabledFramesOnly']);
    const domain = this.Domain.byHostname(hostname, cfg.domains);

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
      this.LOGGER.error(`Failed to modify '${action}' for domain '${domain.cfgKey}'.`, err, domain);
    }
  }

  static async toggleTabDisable(tabId: number) {
    const storage = await this.loadBackgroundStorage();
    const tabOptions = this.getTabOptions(storage, tabId);
    tabOptions.disabled = !tabOptions.disabled;
    await this.saveBackgroundStorage(storage);
    chrome.tabs.reload(tabId);
  }

  static async updatePopupStatus(tabId: number, status?: number, sendResponse?) {
    if (!status) {
      const storage = await this.loadBackgroundStorage();
      const tabOptions = await this.getTabOptions(storage, tabId);
      status = tabOptions.status;
    }
    if (!sendResponse) sendResponse = chrome.runtime.sendMessage;
    const message: Message = { destination: this.Constants.MESSAGING.POPUP, source: this.Constants.MESSAGING.BACKGROUND, status: status, tabId: tabId };
    sendResponse(message, () => chrome.runtime.lastError); // Suppress error if Popup isn't active
  }

  static async updateStatus(chromeAction, tabId: number, status: number, forceUpdate = false) {
    const storage = await this.loadBackgroundStorage();
    const tabOptions = await this.getTabOptions(storage, tabId);

    // Only let status increase
    if (forceUpdate || status > tabOptions.status) {
      tabOptions.status = status;
      chromeAction.setBadgeBackgroundColor({ color: this.BADGE_COLORS[tabOptions.status], tabId: tabId });
      this.updatePopupStatus(tabId, tabOptions.status);
      await this.saveBackgroundStorage(storage);
    }
  }
  // #endregion

  constructor() {
    throw new Error('This is a static class. Call methods directly on the class, no instance needed.');
  }
}
