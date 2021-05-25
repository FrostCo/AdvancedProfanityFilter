import Constants from './lib/constants';
import WebConfig from './webConfig';

export default class Domain {
  advanced: boolean;
  audioWordlistId: number;
  cfg: DomainCfg;
  cfgKey: string;
  deep: boolean;
  disabled: boolean;
  enabled: boolean;
  hostname?: string;
  tab?: any;
  wordlistId: number;

  static readonly _domainCfgDefaults: DomainCfg = {
    adv: undefined,
    audioList: undefined,
    deep: undefined,
    disabled: undefined,
    enabled: undefined,
    wordlist: undefined,
  }

  static byHostname(hostname: string, domains: { [domain: string]: DomainCfg }): Domain {
    const cfgKey = Domain.findDomainKey(hostname, domains) || hostname;
    const domain = Domain.byKey(cfgKey, domains);
    domain.hostname = hostname;
    return domain;
  }

  static byKey(key: string, domains: { [domain: string]: DomainCfg }): Domain {
    return new Domain(key, domains[key]);
  }

  static findDomainKey(hostname: string, domains: { [domain: string]: DomainCfg }): string {
    const sorted = Object.keys(domains).sort((a, b) => { return b.length - a.length; });
    return sorted.find((key) => new RegExp(`(^|.)${key}$`).test(hostname));
  }

  static getCurrentTab() {
    /* istanbul ignore next */
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });
  }

  static sortedKeys(domains: { [site: string]: DomainCfg }) {
    return Object.keys(domains).sort((a, b) => {
      const domainA = a.match(/\w*\.\w*$/)[0];
      const domainB = b.match(/\w*\.\w*$/)[0];
      return domainA < domainB ? -1 : domainA > domainB ? 1 : 0;
    });
  }

  constructor(key: string, domainCfg?: DomainCfg) {
    this.cfgKey = key;
    this.cfg = {};
    if (!domainCfg) {
      Object.assign(this.cfg, Domain._domainCfgDefaults);
    } else {
      this.cfg = domainCfg;
    }

    this.updateFromCfg();
  }

  getModeIndex() {
    if (this.advanced) {
      return Constants.DOMAIN_MODES.ADVANCED;
    } else if (this.deep) {
      return Constants.DOMAIN_MODES.DEEP;
    } else {
      return Constants.DOMAIN_MODES.NORMAL;
    }
  }

  // Updates the config from the domain and saves it
  async save(cfg: WebConfig) {
    if (cfg.domains) {
      this.updateCfg();

      if (JSON.stringify(this.cfg) === '{}') { // Nothing to save, so remove it
        delete cfg.domains[this.cfgKey];
      } else {
        cfg.domains[this.cfgKey] = this.cfg;
      }

      return await cfg.save('domains');
    }
  }

  updateCfg() {
    this.cfg.adv = this.advanced === true ? true : undefined;
    this.cfg.deep = this.deep === true ? true : undefined;
    this.cfg.disabled = this.disabled === true ? true : undefined;
    this.cfg.enabled = this.enabled === true ? true : undefined;
    this.cfg.wordlist = this.wordlistId >= 0 ? this.wordlistId : undefined;
    this.cfg.audioList = this.audioWordlistId >= 0 ? this.audioWordlistId : undefined;
  }

  updateFromCfg() {
    this.advanced = this.cfg.adv;
    this.deep = this.cfg.deep;
    this.disabled = this.cfg.disabled;
    this.enabled = this.cfg.enabled;
    this.wordlistId = this.cfg.wordlist;
    this.audioWordlistId = this.cfg.audioList;
  }

  updateFromModeIndex(index: number) {
    switch(index) {
      case Constants.DOMAIN_MODES.NORMAL: this.advanced = false; this.deep = false; break;
      case Constants.DOMAIN_MODES.ADVANCED: this.advanced = true; this.deep = false; break;
      case Constants.DOMAIN_MODES.DEEP: this.advanced = false; this.deep = true; break;
    }
  }
}