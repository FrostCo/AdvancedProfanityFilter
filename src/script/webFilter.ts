import '@VENDOR/findAndReplaceDOMText.js';
import Constants from '@APF/lib/constants';
import Domain from '@APF/domain';
import Filter from '@APF/lib/filter';
import Page from '@APF/page';
import WebConfig from '@APF/webConfig';
import Logger from '@APF/lib/logger';
import type Word from '@APF/lib/word';
const logger = new Logger('WebFilter');

export default class WebFilter extends Filter {
  declare cfg: WebConfig;
  domain: Domain;
  extension: boolean;
  filterText: boolean;
  hostname: string;
  iframe: Location;
  lastCounter: number;
  location: Location | URL;
  observer: MutationObserver;
  processMutationTarget: boolean;
  processNode: (node: Document | HTMLElement | Node | ShadowRoot, wordlistId: number, statsType?: string | null) => void;
  shadowObserver: MutationObserver;
  stats: Statistics;
  summary: Summary;

  //#region Class reference helpers
  // Can be overridden in children classes
  static get Config() { return WebConfig; }
  static get Constants() { return Constants; }
  static get Domain() { return Domain; }
  static get Page() { return Page; }
  get Class() { return (this.constructor as typeof WebFilter); }
  //#endregion

  static readonly observerConfig: MutationObserverInit = {
    characterData: true,
    characterDataOldValue: true,
    childList: true,
    subtree: true,
  };

  constructor() {
    super();
    this.extension = true;
    this.filterText = true;
    this.lastCounter = 0;
    this.processMutationTarget = false;
    this.stats = { words: {} };
    this.summary = {};
  }

  get _defaultStats(): Statistics {
    return { words: {} };
  }

  get _defaultWordStat(): WordStatistic {
    return { [ this.Class.Constants.STATS_TYPE_TEXT ]: 0 };
  }

  _processStatsBeforeSaving(stats) {}

  _processWordStat(stats, word: string) {
    if (!stats.words[word]) stats.words[word] = this._defaultWordStat;
    stats.words[word][this.Class.Constants.STATS_TYPE_TEXT] += this.stats.words[word][this.Class.Constants.STATS_TYPE_TEXT];
  }

  advancedReplaceText(node, wordlistId: number, statsType: string | null = this.Class.Constants.STATS_TYPE_TEXT) {
    if (node.parentNode || node === document) {
      for (const regExp of this.wordlists[wordlistId].regExps) {
        // @ts-ignore: External library function
        findAndReplaceDOMText(node, { preset: 'prose', find: regExp, replace: (portion, match) => {
          // logger.debug('[APF] Advanced match found', node.textContent);
          if (portion.index === 0) { // Replace the whole match on the first portion and skip the rest
            return this.replaceText(match[0], wordlistId, statsType);
          } else {
            return '';
          }
        } });
      }
    } else {
      // ?: Might want to add support for processNode()
      this.cleanText(node, wordlistId, statsType);
    }
  }

  beforeProcessingPage(message: Message) {
    this.setDomainWordlist();
  }

  buildInitStateMessage(message: Message) {
    // Get status
    message.iframe = !!(this.iframe);
    message.advanced = this.domain.advanced;
    message.deep = this.domain.deep;
    message.status = this.Class.Constants.STATUS.NORMAL;
    if (message.advanced) message.status = this.Class.Constants.STATUS.ADVANCED;
    if (message.deep) message.status = this.Class.Constants.STATUS.DEEP;

    // Always show counter if not in normal mode
    if (this.cfg.showCounter && message.status != this.Class.Constants.STATUS.NORMAL) { message.counter = this.counter; }
  }

  buildMessage(destination: string, data = {}): Message {
    return Object.assign({ destination: destination, source: this.Class.Constants.MESSAGING.CONTEXT }, data);
  }

  cleanChildNode(node, wordlistId: number, statsType: string | null = this.Class.Constants.STATS_TYPE_TEXT) {
    if (node.nodeName) {
      if (node.textContent && node.textContent.trim() != '') {
        const result = this.replaceTextResult(node.textContent, wordlistId, statsType);
        if (result.modified && this.filterText) {
          // logger.debug(`Normal node text changed: '${result.original}' to '${result.filtered}'.`);
          node.textContent = result.filtered;
        }
      } else if (node.nodeName == 'IMG') {
        this.cleanNodeAttribute(node, 'alt', wordlistId, statsType);
        this.cleanNodeAttribute(node, 'title', wordlistId, statsType);
      } else if (node.shadowRoot) {
        this.filterShadowRoot(node.shadowRoot, wordlistId, statsType);
      }
    }
    // else { logger.debug('Node without nodeName', node); }
  }

  cleanNode(node, wordlistId: number, statsType: string | null = this.Class.Constants.STATS_TYPE_TEXT) {
    if (this.Class.Page.isForbiddenNode(node)) { return false; }
    if (node.shadowRoot) { this.filterShadowRoot(node.shadowRoot, wordlistId, statsType); }
    if (node.childNodes.length > 0) {
      for (let i = 0; i < node.childNodes.length ; i++) {
        this.cleanNode(node.childNodes[i], wordlistId, statsType);
      }
    } else {
      this.cleanChildNode(node, this.wordlistId, statsType);
    }
  }

  cleanNodeAttribute(node, attribute: string, wordlistId: number, statsType: string | null = this.Class.Constants.STATS_TYPE_TEXT) {
    if (node[attribute] != '') {
      const result = this.replaceTextResult(node[attribute], wordlistId, statsType);
      if (result.modified && this.filterText) {
        node[attribute] = result.filtered;
      }
    }
  }

  async cleanPage() {
    this.cfg = await this.Class.Config.load();
    logger.setLevel(this.cfg.loggingLevel);

    if (Object.keys(this.cfg.words).length === 0) {
      logger.warn('No words to filter. Exiting.');
      return false;
    }

    this.filterText = this.cfg.filterMethod !== this.Class.Constants.FILTER_METHODS.OFF;
    this.domain = this.Class.Domain.byHostname(this.hostname, this.cfg.domains);
    logger.info('Config loaded.', this.cfg);

    if (!this.shouldProcessFrame) {
      logger.info(`Filter disabled on frames for current domain (${this.iframe.href})`);
      return false;
    }

    const backgroundData: BackgroundData = await this.getBackgroundData();
    const message = this.buildMessage(this.Class.Constants.MESSAGING.BACKGROUND);

    if (this.shouldBeDisabled(backgroundData)) {
      message.disabled = true;
      logger.info(`Disabled for page '${this.hostname}'.`);
      chrome.runtime.sendMessage(message);
      return false;
    }

    this.beforeProcessingPage(message);
    this.sendInitState(message);
    if (message.disabled) return false;
    this.onMessage();

    // Filter text from the main document and watch for new nodes
    this.init();
    logger.infoTime('Filter initialized.', this);
    this.processInitialPage();
    logger.infoTime('Initial page filtered.');
    this.startObserving(document);

    // Track stats (if enabled)
    if (this.cfg.collectStats) {
      this.persistStats();
      window.setTimeout(this.persistStats.bind(this), 3000); // Persist once after 3 seconds
      window.setTimeout(this.persistStats.bind(this), 6000); // Persist once again after 3 more seconds
      window.setInterval(this.persistStats.bind(this), 10000); // Persist every 10 seconds after that
    }
  }

  cleanText(node, wordlistId: number, statsType: string | null = this.Class.Constants.STATS_TYPE_TEXT) {
    if (this.Class.Page.isForbiddenNode(node)) { return false; }
    if (node.shadowRoot) { this.filterShadowRoot(node.shadowRoot, wordlistId, statsType); }
    if (node.childElementCount > 0) {
      const treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      // Note: This while loop skips processing on first node
      while (treeWalker.nextNode()) {
        if (treeWalker.currentNode.childNodes.length > 0) {
          for (const childNode of treeWalker.currentNode.childNodes) {
            this.cleanText(childNode, wordlistId, statsType);
          }
        } else {
          if (!this.Class.Page.isForbiddenNode(treeWalker.currentNode)) {
            this.cleanChildNode(treeWalker.currentNode, wordlistId, statsType);
          }
        }
      }
    } else {
      this.cleanChildNode(node, wordlistId, statsType);
    }
  }

  filterShadowRoot(shadowRoot: ShadowRoot, wordlistId: number, statsType: string | null = this.Class.Constants.STATS_TYPE_TEXT) {
    this.shadowObserver.observe(shadowRoot, this.Class.observerConfig);
    this.processNode(shadowRoot, wordlistId, statsType);
  }

  foundMatch(word: Word, statsType?: string) {
    super.foundMatch(word, statsType);

    if (this.cfg.showSummary) {
      if (this.summary[word.value]) {
        if (this.filterText) {
          this.summary[word.value].count += 1;
        } else {
          this.counter--; // Remove count if we've already found a match for this word when the filter is 'OFF'
        }
      } else {
        let result;
        if (word.matchMethod === this.Class.Constants.MATCH_METHODS.REGEX) {
          result = word.sub || this.cfg.defaultSubstitution;
        } else {
          result = this.replaceText(word.value, this.Class.Constants.ALL_WORDS_WORDLIST_ID, null); // Use all words because we are just filtering a word
        }

        this.summary[word.value] = { filtered: result, count: 1 };
      }
    }

    if (this.cfg.collectStats) {
      const wordStats = this.stats.words;
      if (!wordStats[word.value]) {
        wordStats[word.value] = { [ this.Class.Constants.STATS_TYPE_TEXT ]: 0 };
      }

      if (this.filterText && statsType == this.Class.Constants.STATS_TYPE_TEXT) wordStats[word.value][this.Class.Constants.STATS_TYPE_TEXT]++;
    }
  }

  getBackgroundData() {
    return new Promise((resolve, reject) => {
      const message = this.buildMessage(this.Class.Constants.MESSAGING.BACKGROUND, { backgroundData: true, iframe: !!this.iframe });
      chrome.runtime.sendMessage(message, (response) => {
        if (!response) { response = { disabledTab: false }; }
        resolve(response);
      });
    });
  }

  async getStatsFromStorage() {
    const { stats }: { stats: Statistics } = await this.Class.Config.getLocalStorage({ stats: this._defaultStats }) as any;
    return stats;
  }

  handleUrlUpdateMessage() {}

  init(wordlistId: number | false = false) {
    super.init(wordlistId);

    if (this.domain.advanced) {
      this.processNode = this.advancedReplaceText;
    } else if (this.domain.deep) {
      this.processMutationTarget = true;
      this.processNode = this.cleanNode;
    } else {
      this.processNode = this.cleanText;
    }

    this.observer = new MutationObserver(this.processMutations.bind(this));
    this.shadowObserver = new MutationObserver(this.processMutations.bind(this));
  }

  initPageDetails() {
    // The hostname should resolve to the browser window's URI (or the parent of an IFRAME) for disabled/advanced page checks
    if (window != window.top) {
      this.iframe = document.location;
      try { // same domain
        this.hostname = window.parent.location.hostname;
      } catch (err) { // different domain
        if (document.referrer) {
          this.hostname = new URL(document.referrer).hostname;
        } else {
          this.hostname = document.location.hostname;
        }
      }
    } else {
      this.hostname = document.location.hostname;
    }
  }

  onMessage() {
    /* istanbul ignore next */
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.destination !== this.Class.Constants.MESSAGING.CONTEXT) return true;

      switch (request.source) {
        case this.Class.Constants.MESSAGING.BACKGROUND:
          if (request.urlUpdate) {
            this.handleUrlUpdateMessage();
          } else {
            logger.error('Received unhandled message.', JSON.stringify(request));
          }
          break;

        case this.Class.Constants.MESSAGING.POPUP:
          if (request.summary) {
            if (this.shouldSendPopupSummary) chrome.runtime.sendMessage(this.popupSummaryMessage);
          } else {
            logger.error('Received unhandled message.', JSON.stringify(request));
          }
          break;

        default:
          logger.error('Received message without a supported source:', JSON.stringify(request));
      }

      sendResponse(); // Issue 393 - Chrome 99+ promisified sendMessage expects callback to be called
    });
  }

  async persistStats() {
    if (!this.Class.Config.chromeStorageAvailable()) { return false; }
    try {
      const words = Object.keys(this.stats.words);
      if (words.length) {
        const stats = await this.getStatsFromStorage();

        for (const word of words) {
          this._processWordStat(stats, word);
        }

        if (stats.startedAt == null) { stats.startedAt = Date.now(); }

        this._processStatsBeforeSaving(stats);
        await this.Class.Config.saveLocalStorage({ stats: stats });
        this.stats = this._defaultStats;
      }
    } catch (err) {
      if (err.message !== 'Extension context invalidated.') {
        logger.warn('Failed to save stats.', err);
      }
    }
  }

  get popupSummaryMessage() {
    return this.buildMessage(this.Class.Constants.MESSAGING.POPUP, { summary: this.summary });
  }

  processAddedNode(node: Node) {
    this.processNode(node, this.wordlistId);
  }

  processAddedNodes(addedNodes: NodeList) {
    for (const node of addedNodes) {
      if (this.shouldProcessAddedNode(node)) {
        this.processAddedNode(node);
      }
    }
  }

  processInitialPage() {
    this.processNode(document, this.wordlistId);
    this.updateCounterBadge();
  }

  processMutation(mutation: MutationRecord) {
    // console.count('[APF] this.processMutation() count'); // Benchmark: Filter
    // logger.debug('Mutation observed', mutation);

    if (this.shouldProcessAddedNodes(mutation)) this.processAddedNodes(mutation.addedNodes);

    if (this.shouldProcessRemovedNodes(mutation)) this.processRemovedNodes(mutation.removedNodes);

    if (this.shouldProcessMutationTargetNode(mutation)) this.processMutationTargetNode(mutation);
  }

  processMutationTargetNode(mutation: MutationRecord) {
    if (mutation.target.nodeName === '#text') {
      if (this.shouldProcessMutationTargetText(mutation)) this.processMutationTargetText(mutation);
    } else if (this.processMutationTarget) {
      this.processNode(mutation.target, this.wordlistId);
    }
  }

  processMutationTargetText(mutation: MutationRecord) {
    // console.count('processMutationTargetText'); // Benchmark: Filter
    // logger.debug('processMutationTargetText', target, target.data);
    const target = mutation.target as CharacterData;
    const result = this.replaceTextResult(target.data, this.wordlistId);
    if (result.modified) target.data = result.filtered;
  }

  processMutations(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      this.processMutation(mutation);
    }
    this.updateCounterBadge();
  }

  processRemovedNode(node: Node) {}

  processRemovedNodes(nodes: NodeList) {
    for (const node of nodes) {
      this.processRemovedNode(node);
    }
  }

  setDomainWordlist() {
    if (this.domain.wordlistId !== undefined) this.wordlistId = this.domain.wordlistId;
  }

  sendInitState(message: Message) {
    this.buildInitStateMessage(message);
    chrome.runtime.sendMessage(message);
  }

  shouldBeDisabled(backgroundData: BackgroundData) {
    return (
      backgroundData.disabledTab
      || (
        this.cfg.enabledDomainsOnly
        && !this.domain.enabled
      )
      || this.domain.disabled
    );
  }

  shouldProcessAddedNode(node) {
    return !this.Class.Page.isForbiddenNode(node);
  }

  shouldProcessAddedNodes(mutation: MutationRecord) {
    return mutation.addedNodes.length;
  }

  get shouldProcessFrame() {
    return (
      !this.iframe
      || (
        (this.cfg.enabledFramesOnly && this.domain.framesOn)
        || (!this.cfg.enabledFramesOnly && !this.domain.framesOff)
      )
    );
  }

  shouldProcessMutationTargetNode(mutation: MutationRecord) {
    return mutation.target != null;
  }

  shouldProcessMutationTargetText(mutation: MutationRecord) {
    return !this.Class.Page.isForbiddenNode(mutation.target);
  }

  shouldProcessRemovedNodes(mutation: MutationRecord) {
    return false;
  }

  get shouldSendPopupSummary() {
    return this.cfg.showSummary && this.counter > 0;
  }

  startObserving(target: Node = document, observer: MutationObserver = this.observer) {
    observer.observe(target, this.Class.observerConfig);
    // TODO: Track shadowObserver nodes if we need to restart observing
  }

  stopObserving(observer: MutationObserver = this.observer) {
    const mutations = observer.takeRecords();
    const shadowMutations = this.shadowObserver.takeRecords();
    observer.disconnect();
    this.shadowObserver.disconnect();
    if (mutations) { this.processMutations(mutations); }
    if (shadowMutations) this.processMutations(shadowMutations);
  }

  updateCounterBadge() {
    /* istanbul ignore next */
    // console.count('updateCounterBadge'); // Benchmark: Filter
    if (chrome.runtime && this.counter > this.lastCounter) {
      try {
        this.lastCounter = this.counter;
        if (this.cfg.showCounter) {
          const message = this.buildMessage(this.Class.Constants.MESSAGING.BACKGROUND, { counter: this.counter });
          chrome.runtime.sendMessage(message);
        }

        if (this.cfg.showSummary) {
          const message = this.buildMessage(this.Class.Constants.MESSAGING.POPUP, { summary: this.summary });
          chrome.runtime.sendMessage(message);
        }
      } catch (err) {
        if (err.message !== 'Extension context invalidated.') {
          logger.warn('Failed to sendMessage to update counter.', err);
        }
      }
    }
  }
}
