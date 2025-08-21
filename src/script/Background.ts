import Constants from '@APF/lib/Constants';
import DataMigration from '@APF/DataMigration';
import Domain from '@APF/Domain';
import Translation from '@APF/Translation';
import WebConfig from '@APF/WebConfig';
import { formatNumber } from '@APF/lib/helper';
import Logger from '@APF/lib/Logger';
import type { Summary } from '@APF/WebFilter';

export interface BackgroundData {
  disabledTab?: boolean;
}

export interface BackgroundStorage {
  tabs?: {
    [tabId: number]: TabStorageOptions;
  };
}

export interface Message {
  advanced?: boolean;
  backgroundData?: boolean;
  counter?: number;
  deep?: boolean;
  destination: string;
  disabled?: boolean;
  enableTab?: boolean;
  forceUpdate?: boolean;
  getStatus?: boolean;
  globalVariable?: string;
  iframe?: boolean;
  popup?: boolean;
  source: string;
  status?: number;
  summary?: Summary;
  tabId?: number;
  updateContextMenus?: boolean;
  urlUpdate?: string;
}

export interface TabStorageOptions {
  counters?: { number?: number };
  disabled?: boolean;
  disabledOnce?: number; // NOT_SET: 0, DISABLED: 1, WILL_DISABLE: 2
  id?: number;
  registeredAt?: number;
  status?: number;
}

export default class Background {
  //#region Class reference helpers
  // Can be overridden in children classes
  static get Config() {
    return WebConfig;
  }
  static get Constants() {
    return Constants;
  }
  static get DataMigration() {
    return DataMigration;
  }
  static get Domain() {
    return Domain;
  }
  static get Translation() {
    return Translation;
  }
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
  static readonly log = new Logger('Background', this.Constants.LOGGING_LEVELS.INFO);
  // #endregion

  // #region Static Methods
  static contextMenuRemoveAll() {
    return new Promise((resolve, reject) => {
      chrome.contextMenus.removeAll(() => {
        resolve(false);
      });
    });
  }

  static async contextMenuSetup() {
    await this.contextMenuRemoveAll();

    const requiredConfig = {
      contextMenu: this.Config._defaults.contextMenu,
      language: this.Config._defaults.language,
      password: this.Config._defaults.password,
    };
    const config = (await this.Config.getSyncStorage(requiredConfig)) as Partial<WebConfig>;
    const translation = new this.Translation(['common', 'background'], config.language);

    if (config.contextMenu) {
      if (!config.password) {
        chrome.contextMenus.create({
          id: 'addSelection',
          title: translation.t('background:contextMenu.addSelection'),
          contexts: ['selection'],
          documentUrlPatterns: ['file://*/*', 'http://*/*', 'https://*/*'],
        });

        chrome.contextMenus.create({
          id: 'removeSelection',
          title: translation.t('background:contextMenu.removeSelection'),
          contexts: ['selection'],
          documentUrlPatterns: ['file://*/*', 'http://*/*', 'https://*/*'],
        });

        chrome.contextMenus.create({
          id: 'disableTabOnce',
          title: translation.t('background:contextMenu.disableOnce'),
          contexts: ['all'],
          documentUrlPatterns: ['http://*/*', 'https://*/*'],
        });

        chrome.contextMenus.create({
          id: 'toggleTabDisable',
          title: translation.t('background:contextMenu.toggleForTab'),
          contexts: ['all'],
          documentUrlPatterns: ['http://*/*', 'https://*/*'],
        });

        chrome.contextMenus.create({
          id: 'toggleForDomain',
          title: translation.t('background:contextMenu.toggleForDomain'),
          contexts: ['all'],
          documentUrlPatterns: ['http://*/*', 'https://*/*'],
        });

        chrome.contextMenus.create({
          id: 'toggleAdvancedForDomain',
          title: translation.t('background:contextMenu.toggleAdvancedForDomain'),
          contexts: ['all'],
          documentUrlPatterns: ['http://*/*', 'https://*/*'],
        });

        chrome.contextMenus.create({
          id: 'toggleFramesForDomain',
          title: translation.t('background:contextMenu.toggleFramesForDomain'),
          contexts: ['all'],
          documentUrlPatterns: ['http://*/*', 'https://*/*'],
        });
      }

      chrome.contextMenus.create({
        id: 'options',
        title: translation.t('background:contextMenu.options'),
        contexts: ['all'],
      });
    }
  }

  static contextMenusOnClick(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) {
    switch (info.menuItemId) {
      case 'addSelection':
        this.processSelection('addWord', info.selectionText);
        break;
      case 'disableTabOnce':
        this.disableTabOnce(tab.id);
        break;
      case 'options':
        chrome.runtime.openOptionsPage();
        break;
      case 'removeSelection':
        this.processSelection('removeWord', info.selectionText);
        break;
      case 'toggleAdvancedForDomain':
        this.toggleDomain(new URL(tab.url).hostname, 'advanced');
        break;
      case 'toggleForDomain':
        this.toggleDomain(new URL(tab.url).hostname, 'disable');
        break;
      case 'toggleFramesForDomain':
        this.toggleDomain(new URL(tab.url).hostname, 'frames');
        break;
      case 'toggleTabDisable':
        this.toggleTabDisable(tab.id);
        break;
    }
  }

  static async disableTabOnce(tabId: number) {
    const storage = await this.loadBackgroundStorage();
    const tabOptions = await this.getTabOptions(storage, tabId);
    tabOptions.disabledOnce = this.Constants.TAB_DISABLE_ONCE.WILL_DISABLE;
    await this.saveBackgroundStorage(storage);
    chrome.tabs.reload(tabId);
    this.log.info('disabling tab once.', tabId);
  }

  static getTabOptions(storage: BackgroundStorage, tabId: number): TabStorageOptions {
    return storage.tabs[tabId] || this.newTabOptions(storage, tabId);
  }

  static async handleBackgroundDataRequest(request: Message, sender: chrome.runtime.MessageSender, sendResponse) {
    const storage = await this.loadBackgroundStorage();
    const tabId =
      request.source == this.Constants.MESSAGING.CONTEXT && sender && sender.tab && sender.tab.id
        ? sender.tab.id
        : request.tabId;
    if (!tabId) {
      // Firefox: sender.tab is not always defined
      const response: BackgroundData = { disabledTab: false };
      sendResponse(response);
      return false;
    }
    const tabOptions = this.getTabOptions(storage, tabId);
    const response: BackgroundData = { disabledTab: false };
    let updated = false;

    // Reset tab's counters
    if (
      request.source == this.Constants.MESSAGING.CONTEXT &&
      sender.frameId == this.Constants.TOP_WINDOW_FRAME_ID &&
      (!tabOptions.counters || Object.keys(tabOptions.counters).length)
    ) {
      tabOptions.counters = {};
      updated = true;
    }

    if (
      tabOptions.disabled ||
      (request.source == this.Constants.MESSAGING.CONTEXT &&
        tabOptions.disabledOnce == this.Constants.TAB_DISABLE_ONCE.WILL_DISABLE) ||
      (request.source == this.Constants.MESSAGING.POPUP &&
        tabOptions.disabledOnce == this.Constants.TAB_DISABLE_ONCE.DISABLED)
    ) {
      response.disabledTab = true;
    }
    sendResponse(response);

    if (request.source == this.Constants.MESSAGING.POPUP) return;

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

  static async handleInstall(details: chrome.runtime.InstalledDetails) {
    chrome.runtime.openOptionsPage();
  }

  static async handleUpdate(details: chrome.runtime.InstalledDetails) {
    this.contextMenuSetup();
    const thisVersion = chrome.runtime.getManifest().version;
    this.log.info(`Updated from ${details.previousVersion} to ${thisVersion}.`);

    // Run any data migrations on update
    this.runUpdateMigrations(details.previousVersion);

    // Display update notification
    try {
      if (chrome.notifications != null) {
        const showNotification = await this.Config.getSyncStorage({ showUpdateNotification: true });
        if (showNotification) {
          const translation = new this.Translation(['common', 'background']);
          chrome.notifications.create('extensionUpdate', {
            type: 'basic',
            title: translation.t('background:updateNotification.title'),
            message: translation.t('background:updateNotification.message'),
            iconUrl: 'img/icon64.png',
            isClickable: true,
          });
        }
      }
    } catch (err) {
      this.log.warn('Error while displaying update notification', err);
    }
  }

  static async loadBackgroundStorage(): Promise<BackgroundStorage> {
    const data = await this.Config.getLocalStorage({ background: { tabs: {} } });
    return data['background'] as BackgroundStorage;
  }

  static newTabOptions(storage: BackgroundStorage, tabId: number, options: TabStorageOptions = {}): TabStorageOptions {
    const _defaults: TabStorageOptions = {
      counters: {},
      status: 0,
      disabled: false,
      disabledOnce: this.Constants.TAB_DISABLE_ONCE.NOT_SET,
    };
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
  static async onInstalled(details: chrome.runtime.InstalledDetails) {
    if (details.reason == 'install') {
      await this.handleInstall(details);
    } else if (details.reason == 'update') {
      await this.handleUpdate(details);
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
        } else {
          this.onContextMessageElse(chromeAction, request, sender, sendResponse);
          return true; // return true when waiting on an async call
        }
        break;

      case this.Constants.MESSAGING.OPTION:
        if (request.updateContextMenus != null) {
          this.contextMenuSetup();
        } else {
          this.log.error('Received unhandled message.', JSON.stringify(request));
        }
        break;

      case this.Constants.MESSAGING.POPUP:
        if (request.getStatus) {
          this.updatePopupStatus(request.tabId, null, sendResponse);
          return true; // return true when waiting on an async call
        } else if (request.backgroundData) {
          this.handleBackgroundDataRequest(request, sender, sendResponse);
          return true; // return true when waiting on an async call
        } else if (request.enableTab) {
          this.toggleTabDisable(request.tabId, false, true, sendResponse);
          return true; // return true when waiting on an async call
        } else {
          this.log.error('Received unhandled message.', JSON.stringify(request));
        }
        break;

      default:
        this.log.error('Received message without a supported source:', JSON.stringify(request));
    }

    sendResponse(); // Issue 393 - Chrome 99+ promisified sendMessage expects callback to be called
  }

  static async onContextMessageElse(
    chromeAction: typeof chrome.browserAction,
    request: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse,
  ) {
    // Update tab's status and set badge color
    if (request.status && sender && sender.tab && sender.tab.id) {
      // Firefox: sender.tab is not always defined
      this.updateStatus(chromeAction, sender.tab.id, request.status, request.forceUpdate);
    }

    // Show count of words filtered on badge
    if (request.counter != undefined) {
      const storage = await this.loadBackgroundStorage();
      const tabOptions = this.getTabOptions(storage, sender.tab.id);
      tabOptions.counters[sender.frameId] = request.counter;
      await this.saveBackgroundStorage(storage);

      const total = Object.values(tabOptions.counters).reduce((a, b) => a + b);
      chromeAction.setBadgeText({ text: formatNumber(total), tabId: sender.tab.id });
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
        this.log.errorTime(`Failed to process selection '${selection}'.`, err);
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

  static async tabsOnReplaced(addedTabId: number, removedTabId: number) {
    const storage = await this.loadBackgroundStorage();
    if (storage.tabs[removedTabId]) {
      storage.tabs[addedTabId] = storage.tabs[removedTabId];
      storage.tabs[addedTabId].id = addedTabId;
      delete storage.tabs[removedTabId];
      await this.saveBackgroundStorage(storage);
    }
  }

  static async tabsOnUpdated(tabId, changeInfo, tab) {
    if (changeInfo.url) {
      const message: Message = {
        source: this.Constants.MESSAGING.BACKGROUND,
        destination: this.Constants.MESSAGING.CONTEXT,
        urlUpdate: changeInfo.url,
      };
      chrome.tabs.sendMessage(tabId, message, () => chrome.runtime.lastError); // Suppress error if no listener
    }
  }

  static async toggleDomain(hostname: string, action: string) {
    const cfg = await this.Config.load(['domains', 'enabledDomainsOnly', 'enabledFramesOnly']);
    const domain = this.Domain.byHostname(hostname, cfg.domains);

    switch (action) {
      case 'advanced':
        domain.advanced = !domain.advanced;
        break;
      case 'disable':
        cfg.enabledDomainsOnly ? (domain.enabled = !domain.enabled) : (domain.disabled = !domain.disabled);
        break;
      case 'frames':
        cfg.enabledFramesOnly ? (domain.framesOn = !domain.framesOn) : (domain.framesOff = !domain.framesOff);
        break;
    }

    try {
      await domain.save(cfg);
      chrome.tabs.reload();
    } catch (err) {
      this.log.error(`Failed to modify '${action}' for domain '${domain.cfgKey}'.`, err, domain);
    }
  }

  static async toggleTabDisable(tabId: number, reload = true, forceEnable = false, sendResponse = null) {
    const storage = await this.loadBackgroundStorage();
    const tabOptions = this.getTabOptions(storage, tabId);
    tabOptions.disabled = forceEnable ? false : !tabOptions.disabled;
    await this.saveBackgroundStorage(storage);
    if (reload) chrome.tabs.reload(tabId);
    if (sendResponse) sendResponse(tabOptions.disabled);
  }

  static async updatePopupStatus(tabId: number, status?: number, sendResponse?) {
    if (!status) {
      const storage = await this.loadBackgroundStorage();
      const tabOptions = await this.getTabOptions(storage, tabId);
      status = tabOptions.status;
    }
    if (!sendResponse) sendResponse = chrome.runtime.sendMessage;
    const message: Message = {
      destination: this.Constants.MESSAGING.POPUP,
      source: this.Constants.MESSAGING.BACKGROUND,
      status: status,
      tabId: tabId,
    };
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
