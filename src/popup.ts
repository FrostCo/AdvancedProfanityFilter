import { arrayContains, dynamicList, removeFromArray } from './helper.js';
import Config from './config.js';
import Domain from './domain.js';

class Popup {
  cfg: Config;
  domain: Domain;
  protected: boolean;
  filterMethodContainer: Element;

  static async load(instance: Popup) {
    instance.cfg = await Config.build(['disabledDomains', 'filterMethod', 'password']);
    instance.domain = new Domain();
    await instance.domain.load();
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

  async disableDomain() {
    let popup = this;
    if (!arrayContains(popup.cfg.disabledDomains, popup.domain.hostname)) {
      popup.cfg.disabledDomains.push(popup.domain.hostname);
      let result = await popup.cfg.save();
      if (!result) {
        Popup.disable(document.getElementById('filterMethodSelect'));
        chrome.tabs.reload();
      }
    }
  }

  // Remove all entries that disable the filter for domain
  async enableDomain(cfg: Config, domain: string, key: string) {
    let newDomainList = Domain.removeFromList(domain, cfg[key]);

    if (newDomainList.length < cfg[key].length) {
      cfg[key] = newDomainList;
      let result = await cfg.save();
      if (!result) {
        Popup.enable(document.getElementById('filterMethodSelect'));
        chrome.tabs.reload();
      }
    }
  }

  filterMethodSelect() {
    let filterMethodSelect = document.getElementById('filterMethodSelect') as HTMLSelectElement;
    chrome.storage.sync.set({filterMethod: filterMethodSelect.selectedIndex}, function() {
      if (!chrome.runtime.lastError) {
        chrome.tabs.reload();
      }
    });
  }

  async populateOptions(event?: Event) {
    let popup = this;
    await Popup.load(popup);

    dynamicList(Config._filterMethodNames, 'filterMethodSelect');
    let domainFilter = document.getElementById('domainFilter') as HTMLInputElement;
    let domainToggle = document.getElementById('domainToggle') as HTMLInputElement;
    let filterMethodSelect = document.getElementById('filterMethodSelect') as HTMLSelectElement;

    if (popup.cfg.password && popup.cfg.password != '') {
      popup.protected = true;
      Popup.disable(domainFilter);
      Popup.disable(domainToggle);
      Popup.disable(filterMethodSelect);
    }
    filterMethodSelect.selectedIndex = popup.cfg.filterMethod;

    // Restricted pages
    if (popup.domain.url.protocol == 'chrome:' || popup.domain.url.protocol == 'about:' || popup.domain.hostname == 'chrome.google.com') {
      domainFilter.checked = false;
      Popup.disable(domainFilter);
      Popup.disable(domainToggle);
      Popup.disable(filterMethodSelect);
      return false;
    }

    // Set initial value for domain filter
    if (Domain.domainMatch(popup.domain.hostname, popup.cfg['disabledDomains'])) {
      domainFilter.checked = false;
      Popup.disable(filterMethodSelect);
    }
  }

  toggleFilter() {
    let popup = this;
    if (!popup.protected) {
      let domainFilter = document.getElementById('domainFilter') as HTMLInputElement;
      if (domainFilter.checked) {
        popup.enableDomain(popup.cfg, popup.domain.hostname, 'disabledDomains');
      } else {
        popup.disableDomain();
      }
    }
  }
}

let popup = new Popup;

////
// Listeners
window.addEventListener('load', function(event) { popup.populateOptions(); });
document.getElementById('domainFilter').addEventListener('change', function(event) { popup.toggleFilter(); });
document.getElementById('filterMethodSelect').addEventListener('change', function(event) { popup.filterMethodSelect(); });
document.getElementById('options').addEventListener('click', function() { chrome.runtime.openOptionsPage(); });