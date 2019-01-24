import Domain from './domain';
import {Filter} from './lib/filter';
import Page from './page';
import WebAudio from './webAudio';
import WebConfig from './webConfig';

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
  volume: number;

  constructor() {
    super();
    this.advanced = false;
    this.muted = false;
    this.summary = {};
    this.volume = 1;
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

  checkMutationTargetTextForProfanity(mutation) {
    // console.count('checkMutationTargetTextForProfanity'); // Benchmarking - Executaion Count
    // console.log('Process mutation.target:', mutation.target, mutation.target.data); // DEBUG - Mutation target text
    var replacement;
    if (!Page.isForbiddenNode(mutation.target)) {
      replacement = this.replaceText(mutation.target.data);
      if (replacement != mutation.target.data) {
        // console.log("Mutation target text changed:", mutation.target.data, replacement); // DEBUG - Mutation target text
        mutation.target.data = replacement;
      }
    }
    // else { console.log('Forbidden mutation.target node:', mutation.target); } // DEBUG - Mutation target text
  }

  checkNodeForProfanity(mutation) {
    // console.count('checkNodeForProfanity'); // Benchmarking - Executaion Count
    // console.log('Mutation observed:', mutation); // DEBUG - Mutation addedNodes
    mutation.addedNodes.forEach(function(node) {
      // console.log('Added node(s):', node); // DEBUG - Mutation addedNodes

      if (!Page.isForbiddenNode(node)) {
        if (filter.mutePage && WebAudio.supportedNode(filter.hostname, node)) {
          WebAudio.clean(filter, node, filter.subtitleSelector);
        } else {
          // console.log('Node to removeProfanity', node); // DEBUG - Mutation addedNodes
          filter.removeProfanity(Page.xpathNodeText, node);
        }
      }
      // else { console.log('Forbidden node:', node); } // DEBUG - Mutation addedNodes
    });

    mutation.removedNodes.forEach(function(removedNode) {
      if (!Page.isForbiddenNode(removedNode)) {
        if (filter.mutePage && WebAudio.supportedNode(filter.hostname, removedNode)) {
          WebAudio.unmute(filter);
        }
      }
    });

    // Only process mutation change if target is text
    if (mutation.target && mutation.target.nodeName == '#text') {
      filter.checkMutationTargetTextForProfanity(mutation);
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
    this.removeProfanity(Page.xpathDocText, document);
    this.updateCounterBadge();
    this.observeNewNodes();
  }

  // Always use the top frame for page check
  disabledPage(): boolean {
    // console.count('disabledPage'); // Benchmarking - Executaion Count
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

  // Watch for new text nodes and clean them as they are added
  observeNewNodes() {
    let self = this;
    let observerConfig = {
      characterData: true,
      childList: true,
      subtree: true
    };

    // When DOM is modified, remove profanity from inserted node
    let observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        self.checkNodeForProfanity(mutation);
      });
      self.updateCounterBadge();
    });

    // Remove profanity from new objects
    observer.observe(document, observerConfig);
  }

  removeProfanity(xpathExpression: string, node: any) {
    // console.count('removeProfanity'); // Benchmarking - Executaion Count
    let evalResult = document.evaluate(
      xpathExpression,
      node,
      null,
      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    if (evalResult.snapshotLength == 0) { // If plaintext node
      if (node.data) {
        // Don't mess with tags, styles, or URIs
        if (!Page.forbiddenNodeRegExp.test(node.data)) {
          // console.log('Plaintext:', node.data); // DEBUG
          node.data = this.replaceText(node.data);
        }
        // else { console.log('Skipping plaintext (protected pattern):', node.data); } // DEBUG
      } else { // No matches, no node.data
        if (this.advanced) {
          // console.log('Advanced mode:', evalResult, node.textContent); // DEBUG - Advanced
          var replacement;
          if (node.textContent) {
            replacement = this.replaceText(node.textContent);
            if (replacement != node.textContent) {
              // console.log('Advanced replacement with no data:', replacement); // DEBUG - Advanced
              node.textContent = replacement;
            }
          }
        }
      }
    } else { // If evalResult matches
      for (let i = 0; i < evalResult.snapshotLength; i++) {
        var item = evalResult.snapshotItem(i) as any;
        // console.log('Normal cleaning:', item.data); // DEBUG
        item.data = this.replaceText(item.data);
      }
    }
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