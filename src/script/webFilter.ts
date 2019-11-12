import Domain from './domain';
import {Filter} from './lib/filter';
import Page from './page';
import WebAudio from './webAudio';
import WebConfig from './webConfig';
import './vendor/findAndReplaceDOMText';

export default class WebFilter extends Filter {
  advanced: boolean;
  audio: WebAudio;
  audioOnly: boolean;
  cfg: WebConfig;
  hostname: string;
  iframe: Location;
  mutePage: boolean;
  summary: Summary;
  youTubeMutePage: boolean;

  constructor() {
    super();
    this.advanced = false;
    this.mutePage = false;
    this.summary = {};
  }

  // Always use the top frame for page check
  advancedPage(): boolean {
    return Domain.domainMatch(this.hostname, this.cfg.advancedDomains);
  }

  advancedReplaceText(node) {
    filter.wordRegExps.forEach((regExp) => {
      // @ts-ignore - External library function
      findAndReplaceDOMText(node, {preset: 'prose', find: regExp, replace: function(portion, match) {
        // console.log('[APF] Advanced node match:', node.textContent); // Debug: Filter - Advanced match
        return filter.replaceText(match[0]);
      }});
    });
  }

  checkMutationForProfanity(mutation) {
    // console.count('[APF] filter.checkMutationForProfanity() count'); // Benchmark: Filter
    // console.log('[APF] Mutation observed:', mutation); // Debug: Filter - Mutation
    mutation.addedNodes.forEach(node => {
      if (!Page.isForbiddenNode(node)) {
        // console.log('[APF] Added node(s):', node); // Debug: Filter - Mutation addedNodes
        if (filter.mutePage) {
          filter.cleanAudio(node);
        } else if (!filter.audioOnly) {
          filter.cleanNodeText(node);
        }
      }
      // else { console.log('[APF] Forbidden node:', node); } // Debug: Filter - Mutation addedNodes
    });

    // Check removed nodes to see if we should unmute
    if (filter.mutePage && filter.audio.muted) {
      mutation.removedNodes.forEach(node => {
        let supported = filter.audio.supportedNode(node);
        if (supported !== false || node == filter.audio.lastFilteredNode) {
          filter.audio.unmute();
        }
      });
    }

    // Only process mutation change if target is text
    if (!filter.audioOnly && mutation.target && mutation.target.nodeName == '#text') {
      filter.checkMutationTargetTextForProfanity(mutation);
    }
  }

  checkMutationTargetTextForProfanity(mutation) {
    // console.count('checkMutationTargetTextForProfanity'); // Benchmark: Filter
    // console.log('[APF] Process mutation.target:', mutation.target, mutation.target.data); // Debug: Filter - Mutation text
    if (!Page.isForbiddenNode(mutation.target)) {
      let result = this.replaceTextResult(mutation.target.data);
      if (result.modified) {
        // console.log('[APF] Text target changed:', result.original, result.filtered); // Debug: Filter - Mutation text
        mutation.target.data = result.filtered;
      }
    }
    // else { console.log('[APF] Forbidden mutation.target node:', mutation.target); } // Debug: Filter - Mutation text
  }

  cleanAudio(node) {
    // YouTube Auto subs
    if (filter.audio.youTube && filter.audio.youTubeAutoSubsPresent()) {
      if (filter.audio.youTubeAutoSubsSupportedNode(node)) {
        if (filter.audio.youTubeAutoSubsCurrentRow(node)) {
          // console.log('[APF] YouTube subtitle node:', node); // Debug: Audio
          filter.audio.cleanYouTubeAutoSubs(node);
        } else if (!filter.audioOnly) {
          filter.cleanNodeText(node); // Clean the rest of the page
        }
      } else if (!filter.audioOnly && !filter.audio.youTubeAutoSubsNodeIsSubtitleText(node)) {
        filter.cleanNodeText(node); // Clean the rest of the page
      }
    } else { // Other audio muting
      let supported = filter.audio.supportedNode(node);
      if (supported !== false) {
        // console.log('[APF] Audio subtitle node:', node); // Debug: Audio
        filter.audio.clean(node, supported);
      } else if (!filter.audioOnly) {
        filter.cleanNodeText(node); // Clean the rest of the page
      }
    }
  }

  cleanNode(node, stats: boolean = true) {
    if (Page.isForbiddenNode(node)) { return false; }

    if (node.childElementCount > 0) { // Tree node
      let treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      while(treeWalker.nextNode()) {
        if (treeWalker.currentNode.childNodes.length > 0) {
          treeWalker.currentNode.childNodes.forEach(childNode => {
            this.cleanNode(childNode, stats);
          });
        } else {
          this.cleanNode(treeWalker.currentNode, stats);
        }
      }
    } else { // Leaf node
      if (node.nodeName) {
        if (node.textContent && node.textContent.trim() != '') {
          let result = this.replaceTextResult(node.textContent, stats);
          if (result.modified) {
            // console.log('[APF] Normal node changed:', result.original, result.filtered); // Debug: Filter - Mutation node filtered
            node.textContent = result.filtered;
          }
        } else if (node.nodeName == 'IMG') {
          if (node.alt != '') { node.alt = this.replaceText(node.alt, stats); }
          if (node.title != '') { node.title = this.replaceText(node.title, stats); }
        } else if (node.shadowRoot != undefined) {
          shadowObserver.observe(node.shadowRoot, observerConfig);
        }
      }
      // else { console.log('[APF] node without nodeName:', node); } // Debug: Filter
    }
  }

  cleanNodeText(node) {
    // console.log('[APF] New node to filter', node); // Debug: Filter
    if (filter.advanced && node.parentNode || node == document) {
      filter.advancedReplaceText(node);
    } else {
      filter.cleanNode(node);
    }
  }

  async cleanPage() {
    // @ts-ignore: Type WebConfig is not assignable to type Config
    this.cfg = await WebConfig.build();
    // console.log('[APF] Config loaded', this.cfg); // Debug: General

    // Exit if the topmost frame is a disabled domain
    let message: Message = { disabled: this.disabledPage() };
    if (message.disabled) {
      // console.log(`[APF] Disabled page: ${this.hostname} - exiting`); // Debug: General
      chrome.runtime.sendMessage(message);
      return false;
    }

    // Check for advanced mode on current domain
    this.advanced = this.advancedPage();
    // if (this.advanced) { console.log(`[APF] Enabling advanced match mode on ${this.hostname}`); } // Debug: General

    // Detect if we should mute audio for the current page
    if (this.cfg.muteAudio) {
      this.audio = new WebAudio(this);
      this.mutePage = this.audio.supportedPage;
      // if (this.mutePage) { console.log(`[APF] Enabling audio muting on ${this.hostname}`); } // Debug: Audio
      this.youTubeMutePage = this.audio.youTube;
    }

    // Disable if muteAudioOnly mode is active and this is not a suported page
    if (this.cfg.muteAudioOnly) {
      if (this.mutePage) {
        this.audioOnly = true;
      } else {
        message.disabled = true;
        // console.log('[APF] Non audio page in audio only mode - exiting'); // Debug: Audio
        chrome.runtime.sendMessage(message);
        return false;
      }
    }

    this.sendInitState(message);
    this.popupListener();

    // Remove profanity from the main document and watch for new nodes
    this.init();
    // console.log('[APF] Filter initialized.', this); // Debug: General
    if (!this.audioOnly) { this.cleanNodeText(document); }
    this.updateCounterBadge();
    observer.observe(document, observerConfig);
  }

  // Always use the top frame for page check
  disabledPage(): boolean {
    if (this.cfg.enabledDomainsOnly) {
      return !(Domain.domainMatch(this.hostname, this.cfg.enabledDomains));
    } else {
      return Domain.domainMatch(this.hostname, this.cfg.disabledDomains);
    }
  }

  foundMatch(word) {
    super.foundMatch(word);
    if (this.cfg.showSummary) {
      if (this.summary[word]) {
        this.summary[word].count += 1;
      } else {
        let result;
        if (this.cfg.words[word].matchMethod == 4) { // Regexp
          result = this.cfg.words[word].sub || this.cfg.defaultSubstitution;
        } else {
          result = filter.replaceText(word, false);
        }

        this.summary[word] = { filtered: result, count: 1 };
      }
    }
  }

  // Listen for data requests from Popup
  popupListener() {
    /* istanbul ignore next */
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
      if (filter.cfg.showSummary && request.popup && (filter.counter > 0 || filter.mutePage)) {
        chrome.runtime.sendMessage({ mutePage: filter.mutePage, summary: filter.summary });
      }
    });
  }

  processMutations(mutations) {
    mutations.forEach(function(mutation) {
      filter.checkMutationForProfanity(mutation);
    });
    filter.updateCounterBadge();
  }

  replaceTextResult(string: string, stats: boolean = true) {
    let result = {} as any;
    result.original = string;
    result.filtered = filter.replaceText(string, stats);
    result.modified = (result.filtered != string);
    return result;
  }

  sendInitState(message: Message) {
    // Reset muted state on page load if we muted the tab audio
    if (this.cfg.muteAudio && this.cfg.muteMethod == 0) { message.clearMute = true; }

    // Send page state to color icon badge
    message.setBadgeColor = true;
    message.advanced = this.advanced;
    message.mutePage = this.mutePage;
    if (this.mutePage && this.cfg.showCounter) { message.counter = this.counter; } // Always show counter when muting audio
    chrome.runtime.sendMessage(message);
  }

  updateCounterBadge() {
    /* istanbul ignore next */
    // console.count('updateCounterBadge'); // Benchmark: Filter
    if (this.counter > 0) {
      try {
        if (this.cfg.showCounter) chrome.runtime.sendMessage({ counter: this.counter });
        if (this.cfg.showSummary) chrome.runtime.sendMessage({ summary: this.summary });
      } catch (e) {
        // console.log('Failed to sendMessage', e); // Error - Extension context invalidated.
      }
    }
  }
}

// Global
let filter = new WebFilter;
let observer;
let shadowObserver;
let observerConfig = {
  characterData: true,
  characterDataOldValue: true,
  childList: true,
  subtree: true,
};

if (typeof window !== 'undefined' && ['[object Window]', '[object ContentScriptGlobalScope]'].includes(({}).toString.call(window))) {
  observer = new MutationObserver(filter.processMutations);
  shadowObserver = new MutationObserver(filter.processMutations);

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