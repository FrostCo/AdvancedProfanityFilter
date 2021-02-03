import Constants from './lib/constants';
import { dynamicList, escapeHTML } from './lib/helper';
import WebAudioSites from './webAudioSites';
import WebConfig from './webConfig';
import Domain from './domain';
import Page from './page';

class Popup {
  cfg: WebConfig;
  audioSiteKeys: string[];
  domain: Domain;
  filterToggleProp: string;
  protected: boolean;
  tab: chrome.tabs.Tab;
  url: URL;

  static readonly _requiredConfig =  [
    'audioWordlistId',
    'customAudioSites',
    'darkMode',
    'domains',
    'enabledDomainsOnly',
    'filterMethod',
    'muteAudio',
    'password',
    'wordlists',
    'wordlistsEnabled',
    'wordlistId'
  ];

  static async load(instance: Popup) {
    instance.cfg = await WebConfig.build(Popup._requiredConfig);
    instance.tab = await Domain.getCurrentTab() as chrome.tabs.Tab;
    instance.url = new URL(instance.tab.url);
    instance.domain = Domain.byHostname(instance.url.hostname, instance.cfg.domains);
    instance.filterToggleProp = instance.cfg.enabledDomainsOnly ? 'enabled' : 'disabled';
    return instance;
  }

  constructor() {
    this.protected = false;
  }

  ////
  // Functions for Popup
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

  static show(element: HTMLElement) {
    element.classList.remove('w3-hide');
    element.classList.add('w3-show');
  }

  applyTheme() {
    const elements = [];
    elements.push(document.querySelector('body'));
    elements.push(document.querySelector('#footer'));
    elements.forEach(element => { element.classList.toggle('dark'); });
    const table = document.querySelector('#summary > table');
    table.classList.toggle('w3-striped');
  }

  async filterMethodSelect() {
    let filterMethodSelect = document.getElementById('filterMethodSelect') as HTMLSelectElement;
    popup.cfg.filterMethod = filterMethodSelect.selectedIndex;
    let error = await popup.cfg.save('filterMethod');
    if (!error) {
      chrome.tabs.reload();
    }
  }

  async populateOptions(event?: Event) {
    await Popup.load(popup);
    if (popup.cfg.darkMode) { popup.applyTheme(); }

    let domainFilter = document.getElementById('domainFilter') as HTMLInputElement;
    let domainToggle = document.getElementById('domainToggle') as HTMLInputElement;
    let domainModeSelect = document.getElementById('domainModeSelect') as HTMLSelectElement;
    let filterMethodSelect = document.getElementById('filterMethodSelect') as HTMLSelectElement;
    let wordListContainer = document.getElementById('wordListContainer') as HTMLInputElement;
    let wordlistSelect = document.getElementById('wordlistSelect') as HTMLSelectElement;
    let audioWordlistSelect = document.getElementById('audioWordlistSelect') as HTMLSelectElement;
    dynamicList(Constants.orderedArray(Constants.DomainModes), domainModeSelect);
    domainModeSelect.selectedIndex = popup.domain.getModeIndex();
    dynamicList(Constants.orderedArray(Constants.FilterMethods), filterMethodSelect);
    filterMethodSelect.selectedIndex = popup.cfg.filterMethod;

    if (popup.cfg.wordlistsEnabled) {
      let wordlists = ['Default Wordlist'].concat(WebConfig._allWordlists, popup.cfg.wordlists);
      let wordlistIndex = popup.domain.wordlistId >= 0 ? popup.domain.wordlistId + 1 : 0;
      dynamicList(wordlists, wordlistSelect);
      wordlistSelect.selectedIndex = wordlistIndex;
      if (popup.cfg.muteAudio) {
        popup.audioSiteKeys = Object.keys(WebAudioSites.combineSites(popup.cfg.customAudioSites));
        if (popup.audioSiteKeys.includes(popup.domain.cfgKey)) {
          let audioWordlistIndex = popup.domain.audioWordlistId >= 0 ? popup.domain.audioWordlistId + 1 : 0;
          dynamicList(wordlists, audioWordlistSelect);
          audioWordlistSelect.selectedIndex = audioWordlistIndex;
          let audioWordlistContainer = document.getElementById('audioWordlistContainer') as HTMLElement;
          Popup.show(audioWordlistContainer);
        }
      }
      Popup.show(wordListContainer);
    }

    if (popup.cfg.password && popup.cfg.password != '') {
      popup.protected = true;
      Popup.disable(domainFilter);
      Popup.disable(domainToggle);
      Popup.disable(domainModeSelect);
      Popup.disable(filterMethodSelect);
      Popup.disable(wordlistSelect);
      Popup.disable(audioWordlistSelect);
    }

    // Restricted pages
    if (Page.disabledProtocols.test(popup.url.protocol) || popup.domain.hostname == 'chrome.google.com') {
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
    if (popup.domain.disabled || (popup.cfg.enabledDomainsOnly && !popup.domain.enabled)) {
      domainFilter.checked = false;
      Popup.disable(domainModeSelect);
      Popup.disable(filterMethodSelect);
      Popup.disable(wordlistSelect);
      Popup.disable(audioWordlistSelect);
    }
  }

  populateSummary(summary: Summary) {
    let summaryContainer = document.getElementById('summary') as HTMLDivElement;
    let table = summaryContainer.querySelector('table') as HTMLTableElement;
    let oldTBody = table.tBodies[0];
    let tBody = document.createElement('tbody');

    if (Object.keys(summary).length > 0) {
      let sortedKeys = Object.keys(summary).sort((a,b) => summary[b].count - summary[a].count);
      sortedKeys.forEach(key => {
        let row = tBody.insertRow();
        let wordCell = row.insertCell(0);
        wordCell.classList.add('w3-tooltip');
        let tooltipSpan = document.createElement('span');
        tooltipSpan.classList.add('summaryTooltip');
        tooltipSpan.classList.add('w3-tag');
        tooltipSpan.classList.add('w3-text');
        tooltipSpan.textContent = escapeHTML(key);
        let wordSpan = document.createElement('span');
        wordSpan.textContent = escapeHTML(summary[key].filtered);
        wordCell.appendChild(tooltipSpan);
        wordCell.appendChild(wordSpan);

        let countCell = row.insertCell(1);
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
    if (!popup.protected) {
      popup.domain[prop] = !popup.domain[prop];
      let error = await popup.domain.save(popup.cfg);
      if (!error) { chrome.tabs.reload(); }
    }
  }

  async updateDomainMode() {
    if (!popup.protected) {
      let domainModeSelect = document.getElementById('domainModeSelect') as HTMLSelectElement;
      popup.domain.updateFromModeIndex(domainModeSelect.selectedIndex);
      let error = await popup.domain.save(popup.cfg);
      if (!error) { chrome.tabs.reload(); }
    }
  }

  async wordlistSelect(event) {
    let element = event.target;
    let type = element.id === 'wordlistSelect' ? 'wordlistId' : 'audioWordlistId';
    popup.domain[type] = element.selectedIndex > 0 ? element.selectedIndex - 1 : undefined; // index 0 = use default (undefined)
    if (!await popup.domain.save(popup.cfg)) {
      chrome.tabs.reload();
    }
  }
}

// Listen for data updates from filter
chrome.runtime.onMessage.addListener((request: Message, sender, sendResponse) => {
  if (request.summary) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (sender.tab.id == tabs[0].id) { popup.populateSummary(request.summary); }
    });
  }
});

// Initial data request
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  chrome.tabs.sendMessage(tabs[0].id, { popup: true });
});

let popup = new Popup;

////
// Listeners
window.addEventListener('load', function(event) { popup.populateOptions(); });
document.getElementById('domainFilter').addEventListener('change', function(event) { popup.toggle(popup.filterToggleProp); });
document.getElementById('domainModeSelect').addEventListener('change', function(event) { popup.updateDomainMode(); });
document.getElementById('filterMethodSelect').addEventListener('change', function(event) { popup.filterMethodSelect(); });
document.getElementById('wordlistSelect').addEventListener('change', function(event) { popup.wordlistSelect(event); });
document.getElementById('audioWordlistSelect').addEventListener('change', function(event) { popup.wordlistSelect(event); });
document.getElementById('options').addEventListener('click', function() { chrome.runtime.openOptionsPage(); });