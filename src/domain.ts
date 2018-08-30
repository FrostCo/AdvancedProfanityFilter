import { arrayContains, removeFromArray } from './helper.js';

export default class Domain {
  tab: any;
  url: URL;
  hostname: string;

  static domainMatch(domain: string, domains: string[]): boolean {
    let result = false;

    for (let x = 0; x < domains.length; x++) {
      if (domains[x]) {
        let domainRegex = new RegExp('(^|\.)' + domains[x], 'i');
        if (domainRegex.test(domain)) {
          result = true;
          break;
        }
      }
    }

    return result;
  }

  // If a parent domain (example.com) is included, it will not +match all subdomains.
  // If a subdomain is included, it will match itself and the parent, if present.
  static removeFromList(domain: string, domains: string[]): string[] {
    let domainRegex;
    let newDomainsList = domains;

    for (let x = 0; x < domains.length; x++) {
      domainRegex = new RegExp('(^|\.)' + domains[x], 'i');
      if (domainRegex.test(domain)) {
        newDomainsList = removeFromArray(newDomainsList, domains[x]);
      }
    }

    return newDomainsList;
  }

  static getCurrentTab() {
    /* istanbul ignore next */
    return new Promise(function(resolve, reject) {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        resolve(tabs[0]);
      });
    });
  }

  async load() {
    this.tab = await Domain.getCurrentTab();
    this.url = new URL(this.tab.url);
    this.hostname = this.url.hostname;
  }
}