import Domain from './domain';
import {Filter} from './lib/filter';
import Page from './page';
import WebAudio from './webAudio';
import WebConfig from './webConfig';
import './vendor/findAndReplaceDOMText';

export default class WebFilter extends Filter {
  advanced: boolean;
  audioOnly: boolean;
  cfg: WebConfig;
  hostname: string;
  iframe: boolean;
  lastSubtitle: string;
  muted: boolean;
  mutePage: boolean;
  subtitleSelector: string;
  summary: Summary;
  unmuteDelay: number;
  volume: number;

  constructor() {
    super();
    this.advanced = false;
    this.muted = false;
    this.summary = {};
    this.unmuteDelay = 0;
    this.volume = 1;
  }

  // Always use the top frame for page check
  advancedPage(): boolean {
    return Domain.domainMatch(this.hostname, this.cfg.advancedDomains);
  }

  advancedReplaceText(node) {
    filter.wordRegExps.forEach((regExp) => {
      // @ts-ignore - External library function
      findAndReplaceDOMText(node, {preset: 'prose', find: regExp, replace: function(portion, match) {
        // console.log('[APF] Advanced node match:', node.textContent); // DEBUG - Advanced match
        return filter.replaceText(match[0]);
      }});
    });
  }

  checkMutationForProfanity(mutation) {
    // console.count('checkMutationForProfanity'); // Benchmarking - Mutation
    // console.log('Mutation observed:', mutation); // DEBUG - Mutation
    mutation.addedNodes.forEach(node => {
      if (!Page.isForbiddenNode(node)) {
        // console.log('Added node(s):', node); // DEBUG - Mutation - addedNodes
        if (filter.mutePage && WebAudio.youTubeAutoSubsPresent(filter)) { // YouTube Auto subs
          if (WebAudio.youTubeAutoSubsSupportedNode(filter.hostname, node)) {
            if (WebAudio.youTubeAutoSubsCurrentRow(node)) {
              WebAudio.cleanYouTubeAutoSubs(filter, node);
            } else {
              filter.cleanNode(node, false);
            }
          } else if (!WebAudio.youTubeAutoSubsNodeIsSubtitleText(node)) {
            filter.cleanNode(node); // Clean the rest of the page
          }
        } else if (filter.mutePage && WebAudio.supportedNode(filter.hostname, node)) {
          WebAudio.clean(filter, node, filter.subtitleSelector);
        } else if (!filter.audioOnly) {
          // console.log('Added node to filter', node); // DEBUG - Mutation addedNodes
          if (filter.advanced && node.parentNode) {
            filter.advancedReplaceText(node);
          } else {
            filter.cleanNode(node);
          }
        }
      }
      // else { console.log('Forbidden node:', node); } // DEBUG - Mutation addedNodes
    });

    mutation.removedNodes.forEach(node => {
      if (filter.mutePage && filter.muted && WebAudio.supportedNode(filter.hostname, node)) {
        WebAudio.unmute(filter);
      }
    });

    // Only process mutation change if target is text
    if (!filter.audioOnly && mutation.target && mutation.target.nodeName == '#text') {
      filter.checkMutationTargetTextForProfanity(mutation);
    }
  }

  checkMutationTargetTextForProfanity(mutation) {
    // console.count('checkMutationTargetTextForProfanity'); // Benchmarking - Executaion Count
    // console.log('Process mutation.target:', mutation.target, mutation.target.data); // DEBUG - Mutation target text
    if (!Page.isForbiddenNode(mutation.target)) {
      let result = this.replaceTextResult(mutation.target.data);
      if (result.modified) {
        // console.log('Text target changed:', result.original, result.filtered); // DEBUG - Mutation target text
        mutation.target.data = result.filtered;
      }
    }
    // else { console.log('Forbidden mutation.target node:', mutation.target); } // DEBUG - Mutation target text
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
        if (node.textContent.trim() != '') {
          let result = this.replaceTextResult(node.textContent, stats);
          if (result.modified) {
            // console.log('[APF] Normal node changed:', result.original, result.filtered); // DEBUG - Mutation node
            node.textContent = result.filtered;
          }
        } else if (node.shadowRoot != undefined) {
          shadowObserver.observe(node.shadowRoot, observerConfig);
        }
      }
      // else { console.log('node without nodeName:', node); } // Debug
    }
  }

  async cleanPage() {
    // @ts-ignore: Type WebConfig is not assignable to type Config
    this.cfg = await WebConfig.build();

    // Exit if the topmost frame is a disabled domain
    let message: Message = { disabled: this.disabledPage() };
    if (message.disabled) {
      chrome.runtime.sendMessage(message);
      return false;
    }

    // Check for advanced mode on current domain
    this.advanced = this.advancedPage();

    // Detect if we should mute audio for the current page
    this.mutePage = (this.cfg.muteAudio && Domain.domainMatch(this.hostname, WebAudio.supportedPages()));
    if (this.mutePage) { this.subtitleSelector = WebAudio.subtitleSelector(this.hostname); }

    // Disable if muteAudioOnly mode is active and this is not a suported page
    if (this.cfg.muteAudioOnly) {
      if (this.mutePage) {
        this.audioOnly = true;
      } else {
        message.disabled = true;
        chrome.runtime.sendMessage(message);
        return false;
      }
    }

    this.sendInitState(message);
    this.popupListener();

    // Remove profanity from the main document and watch for new nodes
    this.init();
    if (!this.audioOnly) { this.advanced ? this.advancedReplaceText(document) : this.cleanNode(document); }
    this.updateCounterBadge();
    observer.observe(document, observerConfig);
  }

  // Always use the top frame for page check
  disabledPage(): boolean {
    return Domain.domainMatch(this.hostname, this.cfg.disabledDomains);
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
    // console.count('updateCounterBadge'); // Benchmarking - Executaion Count
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

  filter.iframe = (window != window.top);

  // The hostname should resolve to the browser window's URI (or the parent of an IFRAME) for disabled/advanced page checks
  if (window.location == window.parent.location || document.referrer == '') {
    filter.hostname = document.location.hostname;
  } else if (document.referrer != '') {
    filter.hostname = new URL(document.referrer).hostname;
  }

  /* istanbul ignore next */
  filter.cleanPage();
}