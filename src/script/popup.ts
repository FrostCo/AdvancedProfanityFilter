import Constants from './lib/constants';
import { dynamicList } from './lib/helper';
import WebAudioSites from './webAudioSites';
import WebConfig from './webConfig';
import Domain from './domain';
import Page from './page';
import Logger from './lib/logger';
const logger = new Logger();

class Popup {
  audioSiteKeys: string[];
  cfg: WebConfig;
  domain: Domain;
  filterToggleProp: string;
  prefersDarkScheme: boolean;
  protected: boolean;
  tab: chrome.tabs.Tab;
  themeElements: Element[];
  url: URL;

  static readonly _requiredConfig = [
    'audioWordlistId',
    'customAudioSites',
    'darkMode',
    'domains',
    'enabledDomainsOnly',
    'filterMethod',
    'muteAudio',
    'muteAudioOnly',
    'password',
    'wordlistId',
    'wordlists',
    'wordlistsEnabled',
  ];

  static disable(element) {
    element.disabled = true;
    element.classList.add('disabled');
  }

  static enable(element) {
    element.disabled = false;
    element.classList.remove('disabled');
  }

  static hide(element: HTMLElement) {
    element.classList.remove('w3-show');
    element.classList.add('w3-hide');
  }

  static async load(instance: Popup) {
    instance.cfg = await WebConfig.load(Popup._requiredConfig);
    instance.tab = await Domain.getCurrentTab() as chrome.tabs.Tab;
    if (instance.tab.url) {
      instance.url = new URL(instance.tab.url);
      instance.domain = Domain.byHostname(instance.url.hostname, instance.cfg.domains);
    } else { // No URL (can be blank in Safari new tab)
      instance.url = null;
      instance.domain = new Domain('');
    }
    instance.filterToggleProp = instance.cfg.enabledDomainsOnly ? 'enabled' : 'disabled';
    return instance;
  }

  static show(element: HTMLElement) {
    element.classList.remove('w3-hide');
    element.classList.add('w3-show');
  }

  constructor() {
    this.prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.protected = false;
    this.themeElements = [document.body, document.querySelector('#footer')];
  }

  applyDarkTheme() {
    document.documentElement.style.setProperty('color-scheme', 'dark');
    const summaryTable = document.querySelector('#summary > table') as HTMLTableElement;
    summaryTable.classList.remove('w3-striped');
    this.themeElements.forEach((element) => {
      element.classList.add('dark');
      element.classList.remove('light');
    });
  }

  applyLightTheme() {
    document.documentElement.style.setProperty('color-scheme', 'light');
    const summaryTable = document.querySelector('#summary > table') as HTMLTableElement;
    summaryTable.classList.add('w3-striped');
    this.themeElements.forEach((element) => {
      element.classList.remove('dark');
      element.classList.add('light');
    });
  }

  applyTheme() {
    if (this.cfg.darkMode == null) {
      this.prefersDarkScheme ? this.applyDarkTheme() : this.applyLightTheme();
    } else {
      this.cfg.darkMode ?  this.applyDarkTheme() : this.applyLightTheme();
    }
  }

  async filterMethodSelect() {
    const filterMethodSelect = document.getElementById('filterMethodSelect') as HTMLSelectElement;
    this.cfg.filterMethod = filterMethodSelect.selectedIndex;
    try {
      await this.cfg.save('filterMethod');
      chrome.tabs.reload();
    } catch (err) {
      logger.error('Failed to update selected filter method.', err);
    }
  }

  async populateOptions() {
    await Popup.load(popup);
    this.applyTheme();

    const domainFilter = document.getElementById('domainFilter') as HTMLInputElement;
    const domainToggle = document.getElementById('domainToggle') as HTMLInputElement;
    const domainModeSelect = document.getElementById('domainModeSelect') as HTMLSelectElement;
    const filterMethodSelect = document.getElementById('filterMethodSelect') as HTMLSelectElement;
    const wordListContainer = document.getElementById('wordListContainer') as HTMLInputElement;
    const wordlistSelect = document.getElementById('wordlistSelect') as HTMLSelectElement;
    const audioWordlistSelect = document.getElementById('audioWordlistSelect') as HTMLSelectElement;
    let audioPage = false;
    dynamicList(Constants.orderedArray(Constants.DOMAIN_MODES), domainModeSelect, true);
    domainModeSelect.selectedIndex = this.domain.getModeIndex();
    dynamicList(Constants.orderedArray(Constants.FILTER_METHODS), filterMethodSelect, true);
    filterMethodSelect.selectedIndex = this.cfg.filterMethod;

    if (this.cfg.wordlistsEnabled) {
      const wordlists = ['Default Wordlist'].concat(WebConfig._allWordlists, this.cfg.wordlists);
      const wordlistIndex = this.domain.wordlistId >= 0 ? this.domain.wordlistId + 1 : 0;
      dynamicList(wordlists, wordlistSelect);
      wordlistSelect.selectedIndex = wordlistIndex;
      if (this.cfg.muteAudio) {
        this.audioSiteKeys = Object.keys(WebAudioSites.combineSites(this.cfg.customAudioSites));
        if (this.audioSiteKeys.includes(this.domain.cfgKey)) {
          audioPage = true;
          const audioWordlistIndex = this.domain.audioWordlistId >= 0 ? this.domain.audioWordlistId + 1 : 0;
          dynamicList(wordlists, audioWordlistSelect);
          audioWordlistSelect.selectedIndex = audioWordlistIndex;
          const audioWordlistContainer = document.getElementById('audioWordlistContainer') as HTMLElement;
          Popup.show(audioWordlistContainer);
        }
      }
      Popup.show(wordListContainer);
    }

    if (this.cfg.password && this.cfg.password != '') {
      this.protected = true;
      Popup.disable(domainFilter);
      Popup.disable(domainToggle);
      Popup.disable(domainModeSelect);
      Popup.disable(filterMethodSelect);
      Popup.disable(wordlistSelect);
      Popup.disable(audioWordlistSelect);
    }

    // Restricted pages
    if (
      !this.domain.hostname
      || Page.disabledProtocols.test(this.url.protocol)
      || this.domain.hostname == 'chrome.google.com'
      || (this.cfg.muteAudio && this.cfg.muteAudioOnly && !audioPage)
    ) {
      domainFilter.checked = false;
      Popup.disable(domainFilter);
      Popup.disable(domainToggle);
      Popup.disable(domainModeSelect);
      Popup.disable(filterMethodSelect);
      Popup.disable(wordlistSelect);
      Popup.disable(audioWordlistSelect);
      return false;
    }

    // Set initial value for domain filter and disable options if they are not applicable
    if (this.domain.disabled || (this.cfg.enabledDomainsOnly && !this.domain.enabled)) {
      domainFilter.checked = false;
      Popup.disable(domainModeSelect);
      Popup.disable(filterMethodSelect);
      Popup.disable(wordlistSelect);
      Popup.disable(audioWordlistSelect);
    }
  }

  populateSummary(summary: Summary) {
    const summaryContainer = document.getElementById('summary') as HTMLDivElement;
    const table = summaryContainer.querySelector('table') as HTMLTableElement;
    const oldTBody = table.tBodies[0];
    const tBody = document.createElement('tbody');

    if (Object.keys(summary).length > 0) {
      const sortedKeys = Object.keys(summary).sort((a, b) => summary[b].count - summary[a].count);
      sortedKeys.forEach((key) => {
        const row = tBody.insertRow();
        const wordCell = row.insertCell(0);
        wordCell.classList.add('w3-tooltip');
        const tooltipSpan = document.createElement('span');
        tooltipSpan.classList.add('summaryTooltip', 'w3-tag', 'w3-text');
        tooltipSpan.textContent = key;
        const wordSpan = document.createElement('span');
        wordSpan.textContent = summary[key].filtered;
        wordCell.appendChild(tooltipSpan);
        wordCell.appendChild(wordSpan);

        const countCell = row.insertCell(1);
        countCell.classList.add('w3-right');
        countCell.textContent = summary[key].count.toString();
      });

      summaryContainer.classList.remove('w3-hide');
    } else {
      summaryContainer.classList.add('w3-hide');
    }
    table.replaceChild(tBody, oldTBody);
  }

  async toggle(prop: string) {
    if (!this.protected) {
      this.domain[prop] = !this.domain[prop];
      try {
        await this.domain.save(this.cfg);
        chrome.tabs.reload();
      } catch (err) {
        logger.error(`Failed to toggle domain '${this.domain.hostname}'.`, err);
      }
    }
  }

  async updateDomainMode() {
    if (!this.protected) {
      const domainModeSelect = document.getElementById('domainModeSelect') as HTMLSelectElement;
      this.domain.updateFromModeIndex(domainModeSelect.selectedIndex);
      try {
        await this.domain.save(this.cfg);
        chrome.tabs.reload();
      } catch (err) {
        logger.error(`Failed to update mode for domain '${this.domain.hostname}'.`, err);
      }
    }
  }

  async wordlistSelect(select: HTMLSelectElement) {
    const type = select.id === 'wordlistSelect' ? 'wordlistId' : 'audioWordlistId';
    this.domain[type] = select.selectedIndex > 0 ? select.selectedIndex - 1 : undefined; // index 0 = use default (undefined)
    try {
      await this.domain.save(this.cfg);
      chrome.tabs.reload();
    } catch (err) {
      logger.error(`Failed to select wordlist for domain ${this.domain.hostname}.`, err);
    }
  }
}

// Listen for data updates from filter
chrome.runtime.onMessage.addListener((request: Message, sender, sendResponse) => {
  if (request.summary) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (sender.tab.id == tabs[0].id) { popup.populateSummary(request.summary); }
    });
  }
});

// Initial data request
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { popup: true });
});

const popup = new Popup;

////
// Listeners
window.addEventListener('load', (evt) => { popup.populateOptions(); });
document.getElementById('domainFilter').addEventListener('change', (evt) => { popup.toggle(popup.filterToggleProp); });
document.getElementById('domainModeSelect').addEventListener('change', (evt) => { popup.updateDomainMode(); });
document.getElementById('filterMethodSelect').addEventListener('change', (evt) => { popup.filterMethodSelect(); });
document.getElementById('wordlistSelect').addEventListener('change', (evt) => { popup.wordlistSelect(evt.target as HTMLSelectElement); });
document.getElementById('audioWordlistSelect').addEventListener('change', (evt) => { popup.wordlistSelect(evt.target as HTMLSelectElement); });
document.getElementById('options').addEventListener('click', (evt) => { chrome.runtime.openOptionsPage(); });
