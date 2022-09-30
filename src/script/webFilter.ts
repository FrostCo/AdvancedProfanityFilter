import './vendor/findAndReplaceDOMText';
import Constants from './lib/constants';
import Domain from './domain';
import Filter from './lib/filter';
import Page from './page';
import WebAudio from './webAudio';
import WebConfig from './webConfig';
import Word from './lib/word';
import Wordlist from './lib/wordlist';
import Logger from './lib/logger';
const logger = new Logger('WebFilter');

export default class WebFilter extends Filter {
  audio: WebAudio;
  audioOnly: boolean;
  audioWordlistId: number;
  declare cfg: WebConfig;
  domain: Domain;
  extension: boolean;
  filterText: boolean;
  hostname: string;
  iframe: Location;
  location: Location | URL;
  mutePage: boolean;
  observer: MutationObserver;
  processMutationTarget: boolean;
  processNode: (node: HTMLElement | Document | ShadowRoot, wordlistId: number, statsType?: string | null) => void;
  shadowObserver: MutationObserver;
  stats: Statistics;
  summary: Summary;

  constructor() {
    super();
    this.audioWordlistId = Constants.ALL_WORDS_WORDLIST_ID;
    this.extension = true;
    this.filterText = true;
    this.mutePage = false;
    this.processMutationTarget = false;
    this.stats = { mutes: 0, words: {} };
    this.summary = {};
  }

  advancedReplaceText(node, wordlistId: number, statsType: string | null = Constants.STATS_TYPE_TEXT) {
    if (node.parentNode || node === document) {
      this.wordlists[wordlistId].regExps.forEach((regExp) => {
        // @ts-ignore: External library function
        findAndReplaceDOMText(node, { preset: 'prose', find: regExp, replace: (portion, match) => {
          // logger.debug('[APF] Advanced match found', node.textContent);
          if (portion.index === 0) { // Replace the whole match on the first portion and skip the rest
            return this.replaceText(match[0], wordlistId, statsType);
          } else {
            return '';
          }
        } });
      });
    } else {
      // ?: Might want to add support for processNode()
      this.cleanText(node, wordlistId, statsType);
    }
  }

  checkMutationForProfanity(mutation) {
    // console.count('[APF] this.checkMutationForProfanity() count'); // Benchmark: Filter
    // logger.debug('Mutation observed', mutation);
    mutation.addedNodes.forEach((node) => {
      if (!Page.isForbiddenNode(node)) {
        // logger.debug('[APF] Added node(s):', node);
        if (this.mutePage) {
          this.cleanAudio(node);
        } else if (!this.audioOnly) {
          this.processNode(node, this.wordlistId);
        }
      }
      // else { logger.debug('Forbidden node', node); }
    });

    // Check removed nodes to see if we should unmute
    if (this.mutePage && this.audio.muted) {
      mutation.removedNodes.forEach((node) => {
        const supported = this.audio.supportedNode(node);
        const rule = supported !== false ? this.audio.rules[supported] : this.audio.rules[0]; // Use the matched rule, or the first rule
        if (
          supported !== false
          || node == this.audio.lastFilteredNode
          || node.contains(this.audio.lastFilteredNode)
          || (
            rule.simpleUnmute
            && node.textContent
            && this.audio.lastFilteredText
            && this.audio.lastFilteredText.includes(node.textContent)
          )
        ) {
          this.audio.unmute(rule);
        }
      });
    }

    if (mutation.target) {
      if (mutation.target.nodeName === '#text') {
        this.checkMutationTargetTextForProfanity(mutation);
      } else if (this.processMutationTarget) {
        this.processNode(mutation.target, this.wordlistId);
      }
    }
  }

  checkMutationTargetTextForProfanity(mutation) {
    // console.count('checkMutationTargetTextForProfanity'); // Benchmark: Filter
    // logger.debug('Process mutation.target', mutation.target, mutation.target.data);
    if (!Page.isForbiddenNode(mutation.target)) {
      if (this.mutePage) {
        const supported = this.audio.supportedNode(mutation.target);
        const rule = supported !== false ? this.audio.rules[supported] : this.audio.rules[0]; // Use the matched rule, or the first rule
        if (supported !== false && rule.simpleUnmute) {
          // Supported node. Check if a previously filtered node is being removed
          if (
            this.audio.muted
            && mutation.oldValue
            && this.audio.lastFilteredText
            && this.audio.lastFilteredText.includes(mutation.oldValue)
          ) {
            this.audio.unmute(rule);
          }
          this.audio.clean(mutation.target, supported);
        } else if (rule.simpleUnmute && this.audio.muted && !mutation.target.parentElement) {
          // Check for removing a filtered subtitle (no parent)
          if (this.audio.lastFilteredText && this.audio.lastFilteredText.includes(mutation.target.textContent)) {
            this.audio.unmute(rule);
          }
        } else if (!this.audioOnly) { // Filter regular text
          const result = this.replaceTextResult(mutation.target.data, this.wordlistId);
          if (result.modified) { mutation.target.data = result.filtered; }
        }
      } else if (!this.audioOnly) { // Filter regular text
        const result = this.replaceTextResult(mutation.target.data, this.wordlistId);
        if (result.modified) { mutation.target.data = result.filtered; }
      }
    }
    // else { logger.debug('Forbidden mutation.target node', mutation.target); }
  }

  cleanAudio(node) {
    // YouTube Auto subs
    if (this.audio.youTube && this.audio.youTubeAutoSubsPresent()) {
      if (this.audio.youTubeAutoSubsSupportedNode(node)) {
        if (this.audio.youTubeAutoSubsCurrentRow(node)) {
          // logger.debug('[Audio] YouTube subtitle node', node);
          this.audio.cleanYouTubeAutoSubs(node);
        } else if (!this.audioOnly) {
          this.processNode(node, this.wordlistId); // Clean the rest of the page
        }
      } else if (!this.audioOnly && !this.audio.youTubeAutoSubsNodeIsSubtitleText(node)) {
        this.processNode(node, this.wordlistId); // Clean the rest of the page
      }
    } else { // Other audio muting
      const supported = this.audio.supportedNode(node);
      if (supported !== false) {
        // logger.debug('[Audio] Audio subtitle node', node);
        this.audio.clean(node, supported);
      } else if (!this.audioOnly) {
        this.processNode(node, this.wordlistId); // Clean the rest of the page
      }
    }
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
      && (this.cfg.filterEnabledFramesOnly && !this.domain.frames)
      || (!this.cfg.filterEnabledFramesOnly && this.domain.framesOff)
    ) {
      logger.info('Filter disabled on frames for current domain');
      return false;
    }

    const backgroundData: BackgroundData = await this.getBackgroundData();

    // Use domain-specific settings
    const message: Message = {};
    if (
      backgroundData.disabledTab
      || (
        this.cfg.enabledDomainsOnly
        && !this.domain.enabled
        && !this.cfg.muteAudioOnly
      )
      || this.domain.disabled
    ) {
      message.disabled = true;
      logger.info(`Disabled for page '${this.hostname}'.`);
      chrome.runtime.sendMessage(message);
      return false;
    }
    if (this.domain.wordlistId !== undefined) { this.wordlistId = this.domain.wordlistId; }
    if (this.domain.audioWordlistId !== undefined) { this.audioWordlistId = this.domain.audioWordlistId; }

    // Detect if we should mute audio for the current page
    if (this.cfg.muteAudio) {
      this.audio = new WebAudio(this);
      this.mutePage = this.audio.supportedPage;
      if (this.mutePage) {
        logger.info(`[Audio] Enabling audio muting on ${this.hostname}.`);
        // Prebuild audio wordlist
        if (this.cfg.wordlistsEnabled && this.wordlistId != this.audio.wordlistId) {
          this.wordlists[this.audio.wordlistId] = new Wordlist(this.cfg, this.audio.wordlistId);
        }
      }
    }

    // Disable if muteAudioOnly mode is active and this is not a suported page
    if (this.cfg.muteAudioOnly && !this.mutePage) {
      message.disabled = true;
      logger.info(`'[Audio] ${this.hostname}' is not an audio page and audio only mode is enabled. Exiting.`);
      chrome.runtime.sendMessage(message);
      return false;
    }

    this.sendInitState(message);
    this.popupListener();

    // Remove profanity from the main document and watch for new nodes
    this.init();
    logger.infoTime('Filter initialized.', this);
    if (!this.audioOnly) { this.processNode(document, this.wordlistId); }
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
          treeWalker.currentNode.childNodes.forEach((childNode) => {
            this.cleanText(childNode, wordlistId, statsType);
          });
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
        wordStats[word.value] = { [ Constants.STATS_TYPE_AUDIO ]: 0, [ Constants.STATS_TYPE_TEXT ]: 0 };
      }

      if (this.filterText) {
        switch (statsType) {
          case Constants.STATS_TYPE_AUDIO: wordStats[word.value].audio++; break;
          case Constants.STATS_TYPE_TEXT: wordStats[word.value].text++; break;
        }
      }
    }
  }

  getBackgroundData() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ backgroundData: true }, (response) => {
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
        const { stats }: { stats: Statistics } = await WebConfig.getLocalStorage({ stats: { mutes: 0, words: {} } }) as any;
        const storedWords = stats.words;

        words.forEach((word) => {
          if (!storedWords[word]) {
            storedWords[word] = { [ Constants.STATS_TYPE_AUDIO ]: 0, [ Constants.STATS_TYPE_TEXT ]: 0 };
          }
          storedWords[word].audio += filter.stats.words[word].audio;
          storedWords[word].text += filter.stats.words[word].text;
        });

        stats.mutes += filter.stats.mutes;
        if (stats.startedAt == null) { stats.startedAt = Date.now(); }

        await WebConfig.saveLocalStorage({ stats: stats });
        filter.stats = { mutes: 0, words: {} };
      }
    } catch (err) {
      if (err.message !== 'Extension context invalidated.') {
        logger.warn('Failed to save stats.', err);
      }
    }
  }

  // Listen for data requests from Popup
  popupListener() {
    /* istanbul ignore next */
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (this.cfg.showSummary && request.popup && (this.counter > 0 || this.mutePage)) {
        chrome.runtime.sendMessage({ mutePage: this.mutePage, summary: this.summary });
      }
      sendResponse(); // Issue 393 - Chrome 99+ promisified sendMessage expects callback to be called
    });
  }

  processMutations(mutations) {
    mutations.forEach((mutation) => {
      filter.checkMutationForProfanity(mutation);
    });
    filter.updateCounterBadge();
  }

  sendInitState(message: Message) {
    // Reset muted state on page load if we muted the tab audio
    if (this.cfg.muteAudio && this.cfg.muteMethod == Constants.MUTE_METHODS.TAB) { message.clearMute = true; }

    // Send page state to color icon badge
    if (!this.iframe || this.mutePage) { message.setBadgeColor = true; }
    message.advanced = this.domain.advanced;
    message.mutePage = this.mutePage;
    if (this.mutePage && this.cfg.showCounter) { message.counter = this.counter; } // Always show counter when muting audio
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
    if (this.counter > 0) {
      try {
        if (this.cfg.showCounter) chrome.runtime.sendMessage({ counter: this.counter });
        if (this.cfg.showSummary) chrome.runtime.sendMessage({ summary: this.summary });
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
