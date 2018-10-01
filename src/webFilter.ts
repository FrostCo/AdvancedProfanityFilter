import Domain from './domain.js';
import {Filter} from './lib/filter.js';
import Page from './page.js';
import WebConfig from './webConfig.js';

interface Message {
  advanced?: boolean,
  counter?: number,
  summary?: object,
  disabled?: boolean
}

export default class WebFilter extends Filter {
  advanced: boolean;
  summary: object;

  constructor() {
    super();
    this.advanced = false;
    this.summary = {};
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
        // console.log('Node to removeProfanity', node); // DEBUG - Mutation addedNodes
        filter.removeProfanity(Page.xpathNodeText, node);
      }
      // else { console.log('Forbidden node:', node); } // DEBUG - Mutation addedNodes
    });

    // Only process mutation change if target is text
    if (mutation.target && mutation.target.nodeName == '#text') {
      filter.checkMutationTargetTextForProfanity(mutation);
    }
  }

  async cleanPage() {
    this.cfg = await WebConfig.build();

    // Don't run if this is a disabled domain
    // Only run on main page (no frames)
    if (window == window.top) {
      let disabled = this.disabledPage();
      let message = { disabled: disabled } as Message;

      if (message.disabled) {
        chrome.runtime.sendMessage(message);
        return false;
      }

      // Check for advanced mode on current domain
      this.advanced = Domain.domainMatch(window.location.hostname, this.cfg.advancedDomains);
      message.advanced = this.advanced;
      if (this.advanced) {
        message.advanced = true;
      }

      chrome.runtime.sendMessage(message);
    }

    // Remove profanity from the main document and watch for new nodes
    this.init();
    this.removeProfanity(Page.xpathDocText, document);
    this.updateCounterBadge();
    this.observeNewNodes();
  }

  disabledPage(): boolean {
    // console.count('disabledPage'); // Benchmarking - Executaion Count
    let domain = window.location.hostname;
    return Domain.domainMatch(domain, this.cfg.disabledDomains);
  }

  foundMatch(word) {
    super.foundMatch(word);
    if (this.summary[word]) {
      this.summary[word].count += 1;
    } else {
      this.summary[word] = { clean: filter.replaceText(word, false), count: 1 };
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
    if (this.cfg.showCounter && this.counter > 0) {
      chrome.runtime.sendMessage({counter: this.counter.toString(), summary: this.summary});
    }
  }
}

// Global
var filter = new WebFilter;
if (typeof window !== 'undefined' && ['[object Window]', '[object ContentScriptGlobalScope]'].includes(({}).toString.call(window))) {
  /* istanbul ignore next */
  // Send summary data to popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    if (request.popup) { chrome.runtime.sendMessage({summary: filter.summary}, function(response){}); }
  });

  /* istanbul ignore next */
  filter.cleanPage();
}