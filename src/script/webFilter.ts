import Domain from './domain';
import {Filter} from './lib/filter';
import Page from './page';
import WebAudio from './webAudio';
import WebConfig from './webConfig';
import './vendor/findAndReplaceDOMText';

interface Message {
  advanced?: boolean;
  counter?: number;
  disabled?: boolean;
  mute?: boolean;
  summary?: object;
}

export default class WebFilter extends Filter {
  advanced: boolean;
  cfg: WebConfig;
  hostname: string;
  mutePage: boolean;
  lastSubtitle: string;
  muted: boolean;
  mutedAt: number;
  subtitleSelector: string;
  summary: object;
  volume: number;

  constructor() {
    super();
    this.advanced = false;
    this.muted = false;
    this.mutedAt = 0;
    this.summary = {};
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
        } else {
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
    if (mutation.target && mutation.target.nodeName == '#text') {
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

    // The hostname should resolve to the browser window's URI (or the parent of an IFRAME) for disabled/advanced page checks
    if (window.location == window.parent.location || document.referrer == '') {
      this.hostname = document.location.hostname;
    } else if (document.referrer != '') {
      this.hostname = new URL(document.referrer).hostname;
    }

    // Check if the topmost frame is a disabled domain
    let message: Message = { disabled: this.disabledPage() };
    if (message.disabled) {
      chrome.runtime.sendMessage(message);
      return false;
    }

    // Check for advanced mode on current domain
    this.advanced = this.advancedPage();
    message.advanced = this.advanced; // Set badge color
    chrome.runtime.sendMessage(message);

    // Detect if we should mute audio for the current page
    this.mutePage = (this.cfg.muteAudio && Domain.domainMatch(this.hostname, WebAudio.supportedPages()));
    if (this.mutePage) { this.subtitleSelector = WebAudio.subtitleSelector(this.hostname); }

    // Remove profanity from the main document and watch for new nodes
    this.init();
    this.advanced ? this.advancedReplaceText(document) : this.cleanNode(document);
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

  updateCounterBadge() {
    /* istanbul ignore next */
    // console.count('updateCounterBadge'); // Benchmarking - Executaion Count
    if (this.counter > 0) {
      try {
        if (this.cfg.showCounter) chrome.runtime.sendMessage({ counter: this.counter.toString() });
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
  /* istanbul ignore next */
  // Send summary data to popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    if (filter.cfg.showSummary && request.popup && filter.counter > 0) chrome.runtime.sendMessage({ summary: filter.summary });
  });

  observer = new MutationObserver(filter.processMutations);
  shadowObserver = new MutationObserver(filter.processMutations);

  /* istanbul ignore next */
  filter.cleanPage();
}