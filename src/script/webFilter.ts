import Constants from './lib/constants';
import Domain from './domain';
import Filter from './lib/filter';
import Page from './page';
import WebAudio from './webAudio';
import WebConfig from './webConfig';
import Wordlist from './lib/wordlist';
import './vendor/findAndReplaceDOMText';
import Logger from './lib/logger';
const logger = new Logger();

export default class WebFilter extends Filter {
  audio: WebAudio;
  audioOnly: boolean;
  audioWordlistId: number;
  cfg: WebConfig;
  domain: Domain;
  extension: boolean;
  hostname: string;
  iframe: Location;
  location: Location | URL;
  mutePage: boolean;
  observer: MutationObserver;
  processMutationTarget: boolean;
  processNode: (node: HTMLElement | Document | ShadowRoot, wordlistId: number, stats?: boolean) => void;
  shadowObserver: MutationObserver;
  summary: Summary;

  constructor() {
    super();
    this.audioWordlistId = 0;
    this.extension = true;
    this.mutePage = false;
    this.processMutationTarget = false;
    this.summary = {};
  }

  advancedReplaceText(node, wordlistId: number, stats = true) {
    if (node.parentNode || node === document) {
      this.wordlists[wordlistId].regExps.forEach((regExp) => {
        // @ts-ignore: External library function
        findAndReplaceDOMText(node, { preset: 'prose', find: regExp, replace: (portion, match) => {
          // logger.debug('[APF] Advanced match found', node.textContent);
          if (portion.index === 0) { // Replace the whole match on the first portion and skip the rest
            return this.replaceText(match[0], wordlistId, stats);
          } else {
            return '';
          }
        } });
      });
    } else {
      // ?: Might want to add support for processNode()
      this.cleanText(node, wordlistId, stats);
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

  cleanChildNode(node, wordlistId: number, stats: boolean = true) {
    if (node.nodeName) {
      if (node.textContent && node.textContent.trim() != '') {
        const result = this.replaceTextResult(node.textContent, wordlistId, stats);
        if (result.modified) {
          // logger.debug(`Normal node text changed: '${result.original}' to '${result.filtered}'.`);
          node.textContent = result.filtered;
        }
      } else if (node.nodeName == 'IMG') {
        if (node.alt != '') { node.alt = this.replaceText(node.alt, wordlistId, stats); }
        if (node.title != '') { node.title = this.replaceText(node.title, wordlistId, stats); }
      } else if (node.shadowRoot) {
        this.filterShadowRoot(node.shadowRoot, wordlistId, stats);
      }
    }
    // else { logger.debug('Node without nodeName', node); }
  }

  cleanNode(node, wordlistId: number, stats: boolean = true) {
    if (Page.isForbiddenNode(node)) { return false; }
    if (node.shadowRoot) { this.filterShadowRoot(node.shadowRoot, wordlistId, stats); }
    if (node.childNodes.length > 0) {
      for (let i = 0; i < node.childNodes.length ; i++) {
        this.cleanNode(node.childNodes[i], wordlistId, stats);
      }
    } else {
      this.cleanChildNode(node, this.wordlistId, stats);
    }
  }

  async cleanPage() {
    this.cfg = await WebConfig.build();
    this.domain = Domain.byHostname(this.hostname, this.cfg.domains);
    logger.info('Config loaded', this.cfg);

    const backgroundData: BackgroundData = await this.getBackgroundData();

    // Use domain-specific settings
    const message: Message = { disabled: backgroundData.disabledTab || (this.cfg.enabledDomainsOnly && !this.domain.enabled) || this.domain.disabled };
    if (message.disabled) {
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
    if (this.cfg.muteAudioOnly) {
      if (this.mutePage) {
        this.audioOnly = true;
      } else {
        message.disabled = true;
        logger.info(`'${this.hostname}' is not an audio page and audio only mode is enabled. Exiting.`);
        chrome.runtime.sendMessage(message);
        return false;
      }
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
  }

  cleanText(node, wordlistId: number, stats: boolean = true) {
    if (Page.isForbiddenNode(node)) { return false; }
    if (node.shadowRoot) { this.filterShadowRoot(node.shadowRoot, wordlistId, stats); }
    if (node.childElementCount > 0) {
      const treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      // Note: This while loop skips processing on first node
      while(treeWalker.nextNode()) {
        if (treeWalker.currentNode.childNodes.length > 0) {
          treeWalker.currentNode.childNodes.forEach((childNode) => {
            this.cleanText(childNode, wordlistId, stats);
          });
        } else {
          if (!Page.isForbiddenNode(treeWalker.currentNode)) {
            this.cleanChildNode(treeWalker.currentNode, wordlistId, stats);
          }
        }
      }
    } else {
      this.cleanChildNode(node, wordlistId, stats);
    }
  }

  filterShadowRoot(shadowRoot: ShadowRoot, wordlistId: number, stats: boolean = true) {
    this.shadowObserver.observe(shadowRoot, observerConfig);
    this.processNode(shadowRoot, wordlistId, stats);
  }

  foundMatch(word) {
    super.foundMatch(word);
    if (this.cfg.showSummary) {
      if (this.summary[word.value]) {
        this.summary[word.value].count += 1;
      } else {
        let result;
        if (word.matchMethod === Constants.MATCH_METHODS.REGEX) {
          result = word.sub || this.cfg.defaultSubstitution;
        } else {
          result = this.replaceText(word.value, 0, false); // We can use 0 (All) here because we are just filtering a word
        }

        this.summary[word.value] = { filtered: result, count: 1 };
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

  // Listen for data requests from Popup
  popupListener() {
    /* istanbul ignore next */
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (this.cfg.showSummary && request.popup && (this.counter > 0 || this.mutePage)) {
        chrome.runtime.sendMessage({ mutePage: this.mutePage, summary: this.summary });
      }
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
    if (!this.iframe) { message.setBadgeColor = true; }
    message.advanced = this.domain.advanced;
    message.mutePage = this.mutePage;
    if (this.mutePage && this.cfg.showCounter) { message.counter = this.counter; } // Always show counter when muting audio
    chrome.runtime.sendMessage(message);
  }

  startObserving(target: Node = document, observer: MutationObserver = this.observer) {
    observer.observe(target, observerConfig);
  }

  stopObserving(observer: MutationObserver = this.observer) {
    const mutations = observer.takeRecords();
    observer.disconnect();
    if (mutations) { this.processMutations(mutations); }
  }

  updateCounterBadge() {
    /* istanbul ignore next */
    // console.count('updateCounterBadge'); // Benchmark: Filter
    if (this.counter > 0) {
      try {
        if (this.cfg.showCounter) chrome.runtime.sendMessage({ counter: this.counter });
        if (this.cfg.showSummary) chrome.runtime.sendMessage({ summary: this.summary });
      } catch (e) {
        if (e.message !== 'Extension context invalidated.') {
          logger.warn('Failed to sendMessage', e);
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
    } catch(e) { // different domain
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