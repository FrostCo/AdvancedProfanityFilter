import { dynamicList, escapeHTML } from './lib/helper';
import WebAudio from './webAudio';
import WebConfig from './webConfig';
import Domain from './domain';

class Popup {
  cfg: WebConfig;
  audioSiteKeys: string[];
  domain: Domain;
  filterMethodContainer: Element;
  filterToggleProp: string;
  protected: boolean;
  tab: chrome.tabs.Tab;
  url: URL;

  static readonly _disabledPages = new RegExp('(^chrome:|^about:|^[a-zA-Z]*-extension:)', 'i');
  static readonly _requiredConfig =  [
    'audioWordlistId',
    'customAudioSites',
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
    this.filterMethodContainer = document.getElementById('filterMethodContainer');
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

  async filterMethodSelect() {
    let filterMethodSelect = document.getElementById('filterMethodSelect') as HTMLSelectElement;
    popup.cfg.filterMethod = filterMethodSelect.selectedIndex;
    let error = await popup.cfg.save('filterMethod');
    if (!error) {
      chrome.tabs.reload();
    }
  }

  async populateOptions(event?: Event) {
    let popup = this;
    await Popup.load(popup);

    let domainFilter = document.getElementById('domainFilter') as HTMLInputElement;
    let domainToggle = document.getElementById('domainToggle') as HTMLInputElement;
    let advancedMode = document.getElementById('advancedMode') as HTMLInputElement;
    let filterMethodSelect = document.getElementById('filterMethodSelect') as HTMLSelectElement;
    let wordListContainer = document.getElementById('wordListContainer') as HTMLInputElement;
    let wordlistSelect = document.getElementById('wordlistSelect') as HTMLSelectElement;
    let audioWordlistSelect = document.getElementById('audioWordlistSelect') as HTMLSelectElement;
    dynamicList(WebConfig._filterMethodNames, 'filterMethodSelect');
    filterMethodSelect.selectedIndex = popup.cfg.filterMethod;

    if (popup.cfg.wordlistsEnabled) {
      let wordlists = ['Default Wordlist'].concat(WebConfig._allWordlists, popup.cfg.wordlists);
      let wordlistIndex = popup.domain.wordlistId >= 0 ? popup.domain.wordlistId + 1 : 0;
      dynamicList(wordlists, wordlistSelect.id);
      wordlistSelect.selectedIndex = wordlistIndex;
      if (popup.cfg.muteAudio) {
        popup.audioSiteKeys = Object.keys(Object.assign({}, WebAudio.sites, popup.cfg.customAudioSites));
        if (popup.audioSiteKeys.includes(popup.domain.cfgKey)) {
          let audioWordlistIndex = popup.domain.audioWordlistId >= 0 ? popup.domain.audioWordlistId + 1 : 0;
          dynamicList(wordlists, audioWordlistSelect.id);
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
      Popup.disable(advancedMode);
      Popup.disable(filterMethodSelect);
      Popup.disable(wordlistSelect);
      Popup.disable(audioWordlistSelect);
    }

    // Restricted pages
    if (Popup._disabledPages.test(popup.url.protocol) || popup.domain.hostname == 'chrome.google.com') {
      domainFilter.checked = false;
      Popup.disable(domainFilter);
      Popup.disable(domainToggle);
      Popup.disable(advancedMode);
      Popup.disable(filterMethodSelect);
      Popup.disable(wordlistSelect);
      Popup.disable(audioWordlistSelect);
      return false;
    }

    // Set initial value for domain filter and disable options if they are not applicable
    if (popup.domain.disabled || (popup.cfg.enabledDomainsOnly && !popup.domain.enabled)) {
      domainFilter.checked = false;
      Popup.disable(advancedMode);
      Popup.disable(filterMethodSelect);
      Popup.disable(wordlistSelect);
      Popup.disable(audioWordlistSelect);
    }

    // Set initial value for advanced mode
    if (popup.domain.advanced) {
      advancedMode.checked = true;
    }
  }

  populateSummary(message: Message) {
    if (message && message.summary) {
      let summaryEl = document.getElementById('summary') as HTMLElement;
      summaryEl.innerHTML = this.summaryTableHTML(message.summary);

      if (summaryEl.classList.contains('w3-hide')) {
        summaryEl.classList.remove('w3-hide');
        summaryEl.classList.add('w3-show');
        document.getElementById('summaryDivider').classList.remove('w3-hide');
      }
    } else {
      // console.log('Unahndled message: ', message); // DEBUG
    }
  }

  summaryTableHTML(summary: Summary): string {
    let tableInnerHTML = '';
    if (Object.keys(summary).length > 0) {
      tableInnerHTML = '<table class="w3-table w3-striped w3-border w3-bordered w3-card w3-small"><tr class="w3-flat-peter-river"><th colspan="2" class="w3-center">Filtered Words</th></tr>';
      Object.keys(summary).sort((a,b) => summary[b].count - summary[a].count).forEach(key => {
        tableInnerHTML += `<tr><td class="w3-tooltip"><span style="position:absolute;left:0;bottom:18px" class="w3-text w3-tag">${escapeHTML(key)}</span>${escapeHTML(summary[key].filtered)}</td><td class="w3-right">${summary[key].count}</td></tr>`;
      });
      tableInnerHTML += '</table>';
    }

    return tableInnerHTML;
  }

  async toggle(prop: string) {
    if (!popup.protected) {
      popup.domain[prop] = !popup.domain[prop];
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
      if (sender.tab.id == tabs[0].id) popup.populateSummary(request);
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
document.getElementById('advancedMode').addEventListener('change', function(event) { popup.toggle('advanced'); });
document.getElementById('filterMethodSelect').addEventListener('change', function(event) { popup.filterMethodSelect(); });
document.getElementById('wordlistSelect').addEventListener('change', function(event) { popup.wordlistSelect(event); });
document.getElementById('audioWordlistSelect').addEventListener('change', function(event) { popup.wordlistSelect(event); });
document.getElementById('options').addEventListener('click', function() { chrome.runtime.openOptionsPage(); });