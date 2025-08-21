import Constants from '@APF/lib/Constants';
import type WebConfig from '@APF/WebConfig';

export interface DomainCfg {
  adv?: boolean;
  deep?: boolean;
  disabled?: boolean;
  enabled?: boolean;
  framesOff?: boolean;
  framesOn?: boolean;
  wordlist?: number;
}

export default class Domain {
  advanced: boolean;
  cfg: DomainCfg;
  cfgKey: string;
  deep: boolean;
  disabled: boolean;
  enabled: boolean;
  framesOff: boolean;
  framesOn: boolean;
  hostname?: string;
  tab?: any;
  wordlistId: number;

  //#region Class reference helpers
  // Can be overridden in children classes
  static get Constants() {
    return Constants;
  }
  get Class() {
    return this.constructor as typeof Domain;
  }
  //#endregion

  static readonly _domainCfgDefaults: DomainCfg = {
    adv: undefined,
    deep: undefined,
    disabled: undefined,
    enabled: undefined,
    framesOff: undefined,
    framesOn: undefined,
    wordlist: undefined,
  };

  static byHostname(hostname: string, domains: { [domain: string]: DomainCfg }): Domain {
    const cfgKey = this.findDomainKey(hostname, domains) || hostname;
    const domain = this.byKey(cfgKey, domains);
    domain.hostname = hostname;
    return domain;
  }

  static byKey(key: string, domains: { [domain: string]: DomainCfg }): Domain {
    return new this(key, domains[key]);
  }

  static findDomainKey(hostname: string, domains: { [domain: string]: DomainCfg }): string {
    const sorted = Object.keys(domains).sort((a, b) => {
      return b.length - a.length;
    });
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

  static sortedKeys(domains: { [site: string]: any }) {
    return Object.keys(domains).sort((a, b) => {
      const domainA = this.sortingKey(a);
      const domainB = this.sortingKey(b);
      if (domainA == domainB) {
        // Same domain, sort using full domain
        return a < b ? -1 : a > b ? 1 : 0;
      }
      return domainA < domainB ? -1 : domainA > domainB ? 1 : 0;
    });
  }

  static sortingKey(domain: string) {
    const split = domain.split('.');

    switch (split.length) {
      case 1:
      case 2:
        return split[0];
      case 3:
        return split[1];
      case 4:
        // IP Address/number
        if (split[1].match(/^\d+$/)) {
          return domain;
        }

        // When 2 character TLD
        if (split[3].length) {
          return split[1];
        }

        return split[2];
      default:
        return split[2];
    }
  }

  constructor(key: string, domainCfg?: DomainCfg) {
    this.cfgKey = key;
    this.cfg = {};
    if (!domainCfg) {
      Object.assign(this.cfg, this.Class._domainCfgDefaults);
    } else {
      this.cfg = domainCfg;
    }

    this.updateFromCfg();
  }

  getModeIndex() {
    if (this.advanced) {
      return this.Class.Constants.DOMAIN_MODES.ADVANCED;
    } else if (this.deep) {
      return this.Class.Constants.DOMAIN_MODES.DEEP;
    } else {
      return this.Class.Constants.DOMAIN_MODES.NORMAL;
    }
  }

  // Updates the config from the domain and saves it
  async save(cfg: WebConfig) {
    if (cfg.domains) {
      this.updateCfg();

      if (JSON.stringify(this.cfg) === '{}') {
        // Nothing to save, so remove it
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
    this.cfg.framesOff = this.framesOff === true ? true : undefined;
    this.cfg.framesOn = this.framesOn === true ? true : undefined;
    this.cfg.wordlist = this.wordlistId >= 0 ? this.wordlistId : undefined;
  }

  updateFromCfg() {
    this.advanced = this.cfg.adv;
    this.deep = this.cfg.deep;
    this.disabled = this.cfg.disabled;
    this.enabled = this.cfg.enabled;
    this.framesOff = this.cfg.framesOff;
    this.framesOn = this.cfg.framesOn;
    this.wordlistId = this.cfg.wordlist;
  }

  updateFromModeIndex(index: number) {
    switch (index) {
      case this.Class.Constants.DOMAIN_MODES.NORMAL:
        this.advanced = false;
        this.deep = false;
        break;
      case this.Class.Constants.DOMAIN_MODES.ADVANCED:
        this.advanced = true;
        this.deep = false;
        break;
      case this.Class.Constants.DOMAIN_MODES.DEEP:
        this.advanced = false;
        this.deep = true;
        break;
    }
  }
}
