import './vendor/findAndReplaceDOMText';
import Constants from './lib/constants';
import Domain from './domain';
import Filter from './lib/filter';
import Page from './page';
import WebConfig from './webConfig';
import Word from './lib/word';
import Logger from './lib/logger';
const logger = new Logger('WebFilter');

export default class WebFilter extends Filter {
  declare cfg: WebConfig;
  domain: Domain;
  extension: boolean;
  filterText: boolean;
  hostname: string;
  iframe: Location;
  location: Location | URL;
  observer: MutationObserver;
  processMutationTarget: boolean;
  processNode: (node: Document | HTMLElement | Node | ShadowRoot, wordlistId: number, statsType?: string | null) => void;
  shadowObserver: MutationObserver;
  stats: Statistics;
  summary: Summary;

  constructor() {
    super();
    this.extension = true;
    this.filterText = true;
    this.processMutationTarget = false;
    this.stats = { words: {} };
    this.summary = {};
  }

  advancedReplaceText(node, wordlistId: number, statsType: string | null = Constants.STATS_TYPE_TEXT) {
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

  buildMessage(destination: string, data = {}): Message {
    return Object.assign({ destination: destination, source: Constants.MESSAGING.CONTEXT }, data);
  }

  cleanChildNode(node, wordlistId: number, statsType: string | null = Constants.STATS_TYPE_TEXT) {
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

  cleanNode(node, wordlistId: number, statsType: string | null = Constants.STATS_TYPE_TEXT) {
    if (Page.isForbiddenNode(node)) { return false; }
    if (node.shadowRoot) { this.filterShadowRoot(node.shadowRoot, wordlistId, statsType); }
    if (node.childNodes.length > 0) {
      for (let i = 0; i < node.childNodes.length ; i++) {
        this.cleanNode(node.childNodes[i], wordlistId, statsType);
      }
    } else {
      this.cleanChildNode(node, this.wordlistId, statsType);
    }
  }

  cleanNodeAttribute(node, attribute: string, wordlistId: number, statsType: string | null = Constants.STATS_TYPE_TEXT) {
    if (node[attribute] != '') {
      const result = this.replaceTextResult(node[attribute], wordlistId, statsType);
      if (result.modified && this.filterText) {
        node[attribute] = result.filtered;
      }
    }
  }

  async cleanPage() {
    this.cfg = await WebConfig.load();
    logger.setLevel(this.cfg.loggingLevel);

    if (Object.keys(this.cfg.words).length === 0) {
      logger.warn('No words to filter. Exiting.');
      return false;
    }

    this.filterText = this.cfg.filterMethod !== Constants.FILTER_METHODS.OFF;
    this.domain = Domain.byHostname(this.hostname, this.cfg.domains);
    logger.info('Config loaded.', this.cfg);

    if (
      this.iframe
      && (
        (this.cfg.enabledFramesOnly && !this.domain.framesOn)
        || (!this.cfg.enabledFramesOnly && this.domain.framesOff)
      )
    ) {
      logger.info(`Filter disabled on frames for current domain (${this.iframe.href})`);
      return false;
    }

    const backgroundData: BackgroundData = await this.getBackgroundData();

    // Use domain-specific settings
    const message = this.buildMessage(Constants.MESSAGING.BACKGROUND);
    if (
      backgroundData.disabledTab
      || (
        this.cfg.enabledDomainsOnly
        && !this.domain.enabled
      )
      || this.domain.disabled
    ) {
      message.disabled = true;
      logger.info(`Disabled for page '${this.hostname}'.`);
      chrome.runtime.sendMessage(message);
      return false;
    }
    if (this.domain.wordlistId !== undefined) { this.wordlistId = this.domain.wordlistId; }

    this.sendInitState(message);
    this.onMessage();

    // Filter text from the main document and watch for new nodes
    this.init();
    logger.infoTime('Filter initialized.', this);
    this.processNode(document, this.wordlistId);
    logger.infoTime('Initial page filtered.');
    this.updateCounterBadge();
    this.startObserving(document);

    // Track stats (if enabled)
    if (this.cfg.collectStats) {
      this.persistStats();
      window.setTimeout(filter.persistStats, 3000); // Persist once after 3 seconds
      window.setTimeout(filter.persistStats, 6000); // Persist once again after 3 more seconds
      window.setInterval(filter.persistStats, 10000); // Persist every 10 seconds after that
    }
  }

  cleanText(node, wordlistId: number, statsType: string | null = Constants.STATS_TYPE_TEXT) {
    if (Page.isForbiddenNode(node)) { return false; }
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
          if (!Page.isForbiddenNode(treeWalker.currentNode)) {
            this.cleanChildNode(treeWalker.currentNode, wordlistId, statsType);
          }
        }
      }
    } else {
      this.cleanChildNode(node, wordlistId, statsType);
    }
  }

  filterShadowRoot(shadowRoot: ShadowRoot, wordlistId: number, statsType: string | null = Constants.STATS_TYPE_TEXT) {
    this.shadowObserver.observe(shadowRoot, observerConfig);
    this.processNode(shadowRoot, wordlistId, statsType);
  }

  foundMatch(word: Word, statsType?: string) {
    super.foundMatch(word);

    if (this.cfg.showSummary) {
      if (this.summary[word.value]) {
        if (this.filterText) {
          this.summary[word.value].count += 1;
        } else {
          this.counter--; // Remove count if we've already found a match for this word when the filter is 'OFF'
        }
      } else {
        let result;
        if (word.matchMethod === Constants.MATCH_METHODS.REGEX) {
          result = word.sub || this.cfg.defaultSubstitution;
        } else {
          result = this.replaceText(word.value, Constants.ALL_WORDS_WORDLIST_ID, null); // Use all words because we are just filtering a word
        }

        this.summary[word.value] = { filtered: result, count: 1 };
      }
    }

    if (this.cfg.collectStats) {
      const wordStats = this.stats.words;
      if (!wordStats[word.value]) {
        wordStats[word.value] = { [ Constants.STATS_TYPE_TEXT ]: 0 };
      }

      if (this.filterText && statsType == Constants.STATS_TYPE_TEXT) wordStats[word.value][Constants.STATS_TYPE_TEXT]++;
    }
  }

  getBackgroundData() {
    return new Promise((resolve, reject) => {
      const message = this.buildMessage(Constants.MESSAGING.BACKGROUND, { backgroundData: true, iframe: !!this.iframe });
      chrome.runtime.sendMessage(message, (response) => {
        if (!response) { response = { disabledTab: false }; }
        resolve(response);
      });
    });
  }

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
  }

  async persistStats() {
    if (!WebConfig.chromeStorageAvailable()) { return false; }
    try {
      const words = Object.keys(filter.stats.words);
      if (words.length) {
        const { stats }: { stats: Statistics } = await WebConfig.getLocalStorage({ stats: { words: {} } }) as any;
        const storedWords = stats.words;

        for (const word of words) {
          if (!storedWords[word]) {
            storedWords[word] = { [ Constants.STATS_TYPE_TEXT ]: 0 };
          }
          storedWords[word].text += filter.stats.words[word].text;
        }

        if (stats.startedAt == null) { stats.startedAt = Date.now(); }

        await WebConfig.saveLocalStorage({ stats: stats });
        filter.stats = { words: {} };
      }
    } catch (err) {
      if (err.message !== 'Extension context invalidated.') {
        logger.warn('Failed to save stats.', err);
      }
    }
  }

  // Listen for data requests from Popup
  onMessage() {
    /* istanbul ignore next */
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.destination !== Constants.MESSAGING.CONTEXT) return true;

      switch (request.source) {
        case Constants.MESSAGING.BACKGROUND:
          if (request.urlUpdate) {
            // No-op
          } else {
            logger.error('Received unhandled message.', JSON.stringify(request));
          }
          break;

        case Constants.MESSAGING.POPUP:
          if (request.summary) {
            if (this.cfg.showSummary && (this.counter > 0)) {
              const message = this.buildMessage(Constants.MESSAGING.POPUP, { summary: this.summary });
              chrome.runtime.sendMessage(message);
            }
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

  processMutation(mutation: MutationRecord) {
    // console.count('[APF] this.processMutation() count'); // Benchmark: Filter
    // logger.debug('Mutation observed', mutation);
    for (const node of mutation.addedNodes) {
      if (!Page.isForbiddenNode(node)) {
        // logger.debug('[APF] Added node(s):', node);
        this.processNode(node, this.wordlistId);
      }
      // else { logger.debug('Forbidden node', node); }
    }

    if (mutation.target) {
      if (mutation.target.nodeName === '#text') {
        const target = mutation.target as CharacterData;
        this.processMutationTargetText(target);
      } else if (this.processMutationTarget) {
        this.processNode(mutation.target, this.wordlistId);
      }
    }
  }

  processMutationTargetText(target: CharacterData) {
    // console.count('processMutationTargetText'); // Benchmark: Filter
    // logger.debug('processMutationTargetText', target, target.data);
    const result = this.replaceTextResult(target.data, this.wordlistId);
    if (result.modified) target.data = result.filtered;
  }

  processMutations(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      this.processMutation(mutation);
    }
    this.updateCounterBadge();
  }

  sendInitState(message: Message) {
    // Get status
    message.iframe = !!(this.iframe);
    message.advanced = this.domain.advanced;
    message.deep = this.domain.deep;
    message.status = Constants.STATUS.NORMAL;
    if (message.advanced) message.status = Constants.STATUS.ADVANCED;
    if (message.deep) message.status = Constants.STATUS.DEEP;

    // Always show counter if not in normal mode
    if (this.cfg.showCounter && message.status != Constants.STATUS.NORMAL) { message.counter = this.counter; }

    chrome.runtime.sendMessage(message);
  }

  startObserving(target: Node = document, observer: MutationObserver = this.observer) {
    observer.observe(target, observerConfig);
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
    if (chrome.runtime && this.counter > 0) {
      try {
        if (this.cfg.showCounter) {
          const message = this.buildMessage(Constants.MESSAGING.BACKGROUND, { counter: this.counter });
          chrome.runtime.sendMessage(message);
        }

        if (this.cfg.showSummary) {
          const message = this.buildMessage(Constants.MESSAGING.POPUP, { summary: this.summary });
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

const filter = new WebFilter;
const observerConfig: MutationObserverInit = {
  characterData: true,
  characterDataOldValue: true,
  childList: true,
  subtree: true,
};

if (typeof window !== 'undefined' && ['[object Window]', '[object ContentScriptGlobalScope]'].includes(({}).toString.call(window))) {
  filter.observer = new MutationObserver(filter.processMutations);
  filter.shadowObserver = new MutationObserver(filter.processMutations);

  // The hostname should resolve to the browser window's URI (or the parent of an IFRAME) for disabled/advanced page checks
  if (window != window.top) {
    filter.iframe = document.location;
    try { // same domain
      filter.hostname = window.parent.location.hostname;
    } catch (err) { // different domain
      if (document.referrer) {
        filter.hostname = new URL(document.referrer).hostname;
      } else {
        filter.hostname = document.location.hostname;
      }
    }
  } else {
    filter.hostname = document.location.hostname;
  }

  /* istanbul ignore next */
  filter.cleanPage();
}
