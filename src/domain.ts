export default class Domain {
  tab: any;
  url: URL;
  hostname: string;

  static domainMatch(domain: string, domains: string[]): boolean {
    let result = false;

    for (let x = 0; x < domains.length; x++) {
      if (domains[x]) {
        let domainRegex = new RegExp('(^|\.)' + domains[x]);
        if (domainRegex.test(domain)) {
          result = true;
          break;
        }
      }
    }

    return result;
  }

  static getCurrentTab() {
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