import Domain from './domain';
import {Filter} from './lib/filter';
import Page from './page';
import WebAudio from './webAudio';
import Config from './lib/config';
import './vendor/findAndReplaceDOMText';

// NO-OP for chrome.* API
var chrome = {} as any;
chrome.runtime = {};
chrome.runtime.sendMessage = function(obj){};

/* @preserve - Start User Config */
var config = Config._defaults as any;
config.words = Config._defaultWords;
/* @preserve - End User Config */

export default class BookmarkletFilter extends Filter {
  advanced: boolean;
  audio: WebAudio;
  audioOnly: boolean;
  cfg: Config;
  hostname: string;
  iframe: boolean;
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
        return filter.replaceText(match[0]);
      }});
    });
  }

  checkMutationForProfanity(mutation) {
    mutation.addedNodes.forEach(node => {
      if (!Page.isForbiddenNode(node)) {
        if (filter.youTubeMutePage && filter.audio.youTubeAutoSubsPresent()) { // YouTube Auto subs
          if (filter.audio.youTubeAutoSubsSupportedNode(node)) {
            if (filter.audio.youTubeAutoSubsCurrentRow(node)) {
              filter.audio.cleanYouTubeAutoSubs(node);
            } else {
              filter.cleanNode(node, false);
            }
          } else if (!filter.audio.youTubeAutoSubsNodeIsSubtitleText(node)) {
            filter.cleanNode(node); // Clean the rest of the page
          }
        } else if (filter.mutePage && filter.audio.supportedNode(node)) {
          filter.audio.clean(node);
        } else if (!filter.audioOnly) {
          if (filter.advanced && node.parentNode) {
            filter.advancedReplaceText(node);
          } else {
            filter.cleanNode(node);
          }
        }
      }
    });

    if (filter.mutePage && filter.audio.muted) {
      mutation.removedNodes.forEach(node => {
        if (filter.audio.supportedNode(node) || node == filter.audio.lastFilteredNode) {
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
            node.textContent = result.filtered;
          }
        } else if (node.shadowRoot != undefined) {
          shadowObserver.observe(node.shadowRoot, observerConfig);
        }
      }
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
    if (!this.audioOnly) { this.advanced ? this.advancedReplaceText(document) : this.cleanNode(document); }
    observer.observe(document, observerConfig);
  }

  // Always use the top frame for page check
  disabledPage(): boolean {
    return Domain.domainMatch(this.hostname, this.cfg.disabledDomains);
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

  filter.iframe = (window != window.top);

  // The hostname should resolve to the browser window's URI (or the parent of an IFRAME) for disabled/advanced page checks
  if (window.location == window.parent.location || document.referrer == '') {
    filter.hostname = document.location.hostname;
  } else if (document.referrer != '') {
    filter.hostname = new URL(document.referrer).hostname;
  }

  filter.cleanPage();
}