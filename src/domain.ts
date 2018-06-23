// TODO:  Update async pattern
class Domain {
  tab: any; // TODO
  url: URL;
  hostname: string;

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