import Domain from './domain';
import {Filter} from './lib/filter';
import Page from './page';
import WebAudio from './webAudio';
import WebConfig from './webConfig';
// import '../../findAndReplaceDOMText';

interface Message {
  advanced?: boolean,
  counter?: number,
  disabled?: boolean,
  mute?: boolean,
  summary?: object
}

export default class WebFilter extends Filter {
  advanced: boolean;
  cfg: WebConfig;
  hostname: string;
  mutePage: boolean;
  lastSubtitle: string;
  muted: boolean;
  subtitleSelector: string;
  summary: object;

  constructor() {
    super();
    this.advanced = false;
    this.muted = false;
    this.summary = {};
  }

  // Always use the top frame for page check
  advancedPage(): boolean {
    return Domain.domainMatch(this.hostname, this.cfg.advancedDomains);
  }

  advancedReplaceText(string: string) {
    let result = {} as any;
    result.original = string;
    result.filtered = filter.replaceText(string);
    result.modified = (result.filtered != string);
    return result;
  }

  checkMutationForProfanity(mutation) {
    // console.count('checkMutationForProfanity'); // Benchmarking - Mutation
    // console.log('Mutation observed:', mutation); // DEBUG - Mutation
    mutation.addedNodes.forEach(node => {
      if (!Page.isForbiddenNode(node)) {
        // console.log('Added node(s):', node); // DEBUG - Mutation - addedNodes
        if (filter.mutePage && WebAudio.supportedNode(filter.hostname, node)) {
          WebAudio.clean(filter, node, filter.subtitleSelector);
        } else {
          // console.log('Added node to filter', node); // DEBUG - Mutation addedNodes
          filter.cleanNode(node);
        }
      }
      // else { console.log('Forbidden node:', node); } // DEBUG - Mutation addedNodes
    });

    mutation.removedNodes.forEach(node => {
      if (filter.mutePage && WebAudio.supportedNode(filter.hostname, node)) {
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
      let result =  this.advancedReplaceText(mutation.target.data);
      if (result.modified) {
        // console.log('Text target changed:', result.original, result.filtered); // DEBUG - Mutation target text
        mutation.target.data = result.filtered;
      }
    }
    // else { console.log('Forbidden mutation.target node:', mutation.target); } // DEBUG - Mutation target text
  }

  cleanNode(node, mutation: MutationRecord = null) {
    if (node.childElementCount > 0) { // Tree node
      let treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      while(treeWalker.nextNode()) {
        if (treeWalker.currentNode.childNodes.length > 0) {
          treeWalker.currentNode.childNodes.forEach(childNode => {
            this.cleanNode(childNode);
          });
        } else {
          this.cleanNode(treeWalker.currentNode);
        }
      }
    } else { // Leaf node
      if (node.nodeName) {
        if (!Page.isForbiddenNode(node) || node.textContent.trim() != '') {
          let result = this.advancedReplaceText(node.textContent);
          if (result.modified) {
            // console.log('Normal node changed:', result.original, result.filtered); // DEBUG - Mutation node
            node.textContent = result.filtered;
          }
        }
      }
      // else { console.log('node without nodeName:', node); // Debug
    }
  }

  async cleanPage() {
    // @ts-ignore: Type WebConfig is not assignable to type Config
    this.cfg = await WebConfig.build();

    // The hostname should resolve to the browser window's URI (or the parent of an IFRAME) for disabled/advanced page checks
    this.hostname = (window.location == window.parent.location) ? document.location.hostname : new URL(document.referrer).hostname;

    // Check if the topmost frame is a disabled domain
    let message = { disabled: this.disabledPage() } as Message;
    if (message.disabled) {
      chrome.runtime.sendMessage(message);
      return false;
    }

    // Check for advanced mode on current domain
    this.advanced = this.advancedPage();
    if (this.advanced) { message.advanced = true; }
    chrome.runtime.sendMessage(message);

    // Detect if we should mute audio for the current page
    this.mutePage = (this.cfg.muteAudio && Domain.domainMatch(this.hostname, WebAudio.supportedPages()));
    if (this.mutePage) { this.subtitleSelector = WebAudio.subtitleSelector(this.hostname); }

    // Remove profanity from the main document and watch for new nodes
    this.init();
    this.observeNewNodes();
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
        this.summary[word] = { clean: filter.replaceText(word, false), count: 1 };
      }
    }
  }

  observeNewNodes() {
    let self = this;
    let observerConfig = {
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true,
    };

    // When DOM is modified, check for nodes to filter
    let observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        self.checkMutationForProfanity(mutation);
      });
      self.updateCounterBadge();
    });

    observer.observe(document, observerConfig);
  }

  updateCounterBadge() {
    /* istanbul ignore next */
    // console.count('updateCounterBadge'); // Benchmarking - Executaion Count
    if (this.counter > 0) {
      if (this.cfg.showCounter) chrome.runtime.sendMessage({ counter: this.counter.toString() });
      if (this.cfg.showSummary) chrome.runtime.sendMessage({ summary: this.summary });
    }
  }
}

// Global
var filter = new WebFilter;
if (typeof window !== 'undefined' && ['[object Window]', '[object ContentScriptGlobalScope]'].includes(({}).toString.call(window))) {
  /* istanbul ignore next */
  // Send summary data to popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    if (filter.cfg.showSummary && request.popup && filter.counter > 0) chrome.runtime.sendMessage({ summary: filter.summary });
  });

  /* istanbul ignore next */
  filter.cleanPage();
}