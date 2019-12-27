import Domain from './domain';
import {Filter} from './lib/filter';
import Page from './page';
import WebAudio from './webAudio';
import Config from './lib/config';
import './vendor/findAndReplaceDOMText';

// NO-OP for chrome.* API
let chrome = {} as any;
chrome.runtime = {};
chrome.runtime.sendMessage = function(obj){};

/* @preserve - Start User Config */
let config = Config._defaults as any;
config.words = Config._defaultWords;
/* @preserve - End User Config */

export default class BookmarkletFilter extends Filter {
  advanced: boolean;
  audio: WebAudio;
  audioOnly: boolean;
  cfg: Config;
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
        if (portion.index === 0) { // Replace the whole match on the first portion and skip the rest
          return filter.replaceText(match[0]);
        } else {
          return '';
        }
      }});
    });
  }

  checkMutationForProfanity(mutation) {
    mutation.addedNodes.forEach(node => {
      if (!Page.isForbiddenNode(node)) {
        if (filter.mutePage) {
          filter.cleanAudio(node);
        } else if (!filter.audioOnly) {
          filter.cleanNodeText(node);
        }
      }
    });

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
    if (!Page.isForbiddenNode(mutation.target)) {
      let result = this.replaceTextResult(mutation.target.data);
      if (result.modified) {
        mutation.target.data = result.filtered;
      }
    }
  }

  cleanAudio(node) {
    if (filter.audio.youTube && filter.audio.youTubeAutoSubsPresent()) {
      if (filter.audio.youTubeAutoSubsSupportedNode(node)) {
        if (filter.audio.youTubeAutoSubsCurrentRow(node)) {
          filter.audio.cleanYouTubeAutoSubs(node);
        } else if (!filter.audioOnly) {
          filter.cleanNodeText(node);
        }
      } else if (!filter.audioOnly && !filter.audio.youTubeAutoSubsNodeIsSubtitleText(node)) {
        filter.cleanNodeText(node);
      }
    } else {
      let supported = filter.audio.supportedNode(node);
      if (supported !== false) {
        filter.audio.clean(node, supported);
      } else if (!filter.audioOnly) {
        filter.cleanNodeText(node);
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
            node.textContent = result.filtered;
          }
        } else if (node.nodeName == 'IMG') {
          if (node.alt != '') { node.alt = this.replaceText(node.alt, stats); }
          if (node.title != '') { node.title = this.replaceText(node.title, stats); }
        } else if (node.shadowRoot != undefined) {
          shadowObserver.observe(node.shadowRoot, observerConfig);
        }
      }
    }
  }

  cleanNodeText(node) {
    if (filter.advanced && (node.parentNode || node == document)) {
      filter.advancedReplaceText(node);
    } else {
      filter.cleanNode(node);
    }
  }

  cleanPage() {
    this.cfg = new Config(config);
    this.cfg.muteMethod = 1; // Bookmarklet: Force audio muteMethod = 1 (Volume)

    // Exit if the topmost frame is a disabled domain
    let message: Message = { disabled: this.disabledPage() };
    if (message.disabled) {
      chrome.runtime.sendMessage(message);
      return false;
    }

    // Check for advanced mode on current domain
    this.advanced = this.advancedPage();

    // Detect if we should mute audio for the current page
    if (this.cfg.muteAudio) {
      this.audio = new WebAudio(this);
      this.mutePage = this.audio.supportedPage;
      this.youTubeMutePage = this.audio.youTube;
    }

    // Remove profanity from the main document and watch for new nodes
    this.init();
    if (!this.audioOnly) { this.cleanNodeText(document); }
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

  processMutations(mutations) {
    mutations.forEach(function(mutation) {
      filter.checkMutationForProfanity(mutation);
    });
  }

  replaceTextResult(string: string, stats: boolean = true) {
    let result = {} as any;
    result.original = string;
    result.filtered = filter.replaceText(string, stats);
    result.modified = (result.filtered != string);
    return result;
  }

  updateCounterBadge() {} // NO-OP
}

let filter = new BookmarkletFilter;
let observer;
let shadowObserver;
let observerConfig = {
  characterData: true,
  characterDataOldValue: true,
  childList: true,
  subtree: true,
};

if (typeof window !== 'undefined') {
  observer = new MutationObserver(filter.processMutations);
  shadowObserver = new MutationObserver(filter.processMutations);

  if (window != window.top) {
    filter.iframe = document.location;
    try {
      filter.hostname = window.parent.location.hostname;
    } catch(e) {
      if (document.referrer) {
        filter.hostname = new URL(document.referrer).hostname;
      } else {
        filter.hostname = document.location.hostname;
      }
    }
  } else {
    filter.hostname = document.location.hostname;
  }

  filter.cleanPage();
}