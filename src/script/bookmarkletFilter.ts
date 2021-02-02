import Constants from './lib/constants';
import Domain from './domain';
import Filter from './lib/filter';
import Page from './page';
import WebAudio from './webAudio';
import WebConfig from './webConfig';
import Wordlist from './lib/wordlist';
import './vendor/findAndReplaceDOMText';

// NO-OP for chrome.* API
let chrome = {} as any;
chrome.runtime = {};
chrome.runtime.sendMessage = function(obj){};

/* @preserve - Start User Config */
let config = WebConfig._defaults as any;
config.words = WebConfig._defaultWords;
/* @preserve - End User Config */

export default class BookmarkletFilter extends Filter {
  audio: WebAudio;
  audioOnly: boolean;
  audioWordlistId: number;
  cfg: WebConfig;
  domain: Domain;
  hostname: string;
  iframe: Location;
  location: Location | URL;
  mutePage: boolean;
  observer: MutationObserver;
  processMutationTarget: boolean;
  processNode: (node: HTMLElement | Document | ShadowRoot, wordlistId: number, stats?: boolean) => void;
  shadowObserver: MutationObserver;

  constructor() {
    super();
    this.audioWordlistId = 0;
    this.mutePage = false;
    this.processMutationTarget = false;
  }

  advancedReplaceText(node, wordlistId: number, stats = true) {
    if (node.parentNode || node === document) {
      filter.wordlists[wordlistId].regExps.forEach((regExp) => {
        // @ts-ignore: External library function
        findAndReplaceDOMText(node, { preset: 'prose', find: regExp, replace: function(portion, match) {
          if (portion.index === 0) {
            return filter.replaceText(match[0], wordlistId, stats);
          } else {
            return '';
          }
        } });
      });
    } else {
      this.cleanText(node, wordlistId, stats);
    }
  }

  checkMutationForProfanity(mutation) {
    mutation.addedNodes.forEach(node => {
      if (!Page.isForbiddenNode(node)) {
        if (filter.mutePage) {
          filter.cleanAudio(node);
        } else if (!filter.audioOnly) {
          filter.processNode(node, filter.wordlistId);
        }
      }
    });

    if (filter.mutePage && filter.audio.muted) {
      mutation.removedNodes.forEach(node => {
        let supported = filter.audio.supportedNode(node);
        let rule = supported !== false ? filter.audio.rules[supported] : filter.audio.rules[0];
        if (
          supported !== false
          || node == filter.audio.lastFilteredNode
          || node.contains(filter.audio.lastFilteredNode)
          || (
            rule.simpleUnmute
            && filter.audio.lastFilteredText
            && filter.audio.lastFilteredText.includes(node.textContent)
          )
        ) {
          filter.audio.unmute(rule);
        }
      });
    }

    if (mutation.target) {
      if (mutation.target.nodeName === '#text') {
        filter.checkMutationTargetTextForProfanity(mutation);
      } else if (filter.processMutationTarget) {
        filter.processNode(mutation.target, filter.wordlistId);
      }
    }
  }

  checkMutationTargetTextForProfanity(mutation) {
    if (!Page.isForbiddenNode(mutation.target)) {
      if (filter.mutePage) {
        let supported = filter.audio.supportedNode(mutation.target);
        let rule = supported !== false ? filter.audio.rules[supported] : filter.audio.rules[0];
        if (supported !== false && rule.simpleUnmute) {
          // Supported node. Check if a previously filtered node is being removed
          if (
            filter.audio.muted
            && mutation.oldValue
            && filter.audio.lastFilteredText
            && filter.audio.lastFilteredText.includes(mutation.oldValue)
          ) {
            filter.audio.unmute(rule);
          }
          filter.audio.clean(mutation.target, supported);
        } else if (rule.simpleUnmute && filter.audio.muted && !mutation.target.parentElement) {
          // Check for removing a filtered subtitle (no parent)
          if (filter.audio.lastFilteredText && filter.audio.lastFilteredText.includes(mutation.target.textContent)) {
            filter.audio.unmute(rule);
          }
        } else if (!filter.audioOnly) { // Filter regular text
          let result = this.replaceTextResult(mutation.target.data, this.wordlistId);
          if (result.modified) { mutation.target.data = result.filtered; }
        }
      } else if (!filter.audioOnly) { // Filter regular text
        let result = this.replaceTextResult(mutation.target.data, this.wordlistId);
        if (result.modified) { mutation.target.data = result.filtered; }
      }
    }
  }

  cleanAudio(node) {
    if (filter.audio.youTube && filter.audio.youTubeAutoSubsPresent()) {
      if (filter.audio.youTubeAutoSubsSupportedNode(node)) {
        if (filter.audio.youTubeAutoSubsCurrentRow(node)) {
          filter.audio.cleanYouTubeAutoSubs(node);
        } else if (!filter.audioOnly) {
          filter.processNode(node, filter.wordlistId);
        }
      } else if (!filter.audioOnly && !filter.audio.youTubeAutoSubsNodeIsSubtitleText(node)) {
        filter.processNode(node, filter.wordlistId);
      }
    } else {
      let supported = filter.audio.supportedNode(node);
      if (supported !== false) {
        filter.audio.clean(node, supported);
      } else if (!filter.audioOnly) {
        filter.processNode(node, filter.wordlistId);
      }
    }
  }

  cleanChildNode(node, wordlistId: number, stats: boolean = true) {
    if (node.nodeName) {
      if (node.textContent && node.textContent.trim() != '') {
        let result = this.replaceTextResult(node.textContent, wordlistId, stats);
        if (result.modified) {
          node.textContent = result.filtered;
        }
      } else if (node.nodeName == 'IMG') {
        if (node.alt != '') { node.alt = this.replaceText(node.alt, wordlistId, stats); }
        if (node.title != '') { node.title = this.replaceText(node.title, wordlistId, stats); }
      } else if (node.shadowRoot) {
        this.filterShadowRoot(node.shadowRoot, wordlistId, stats);
      }
    }
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

  cleanPage() {
    this.cfg = new WebConfig(config);
    this.domain = Domain.byHostname(this.hostname, this.cfg.domains);
    this.cfg.muteMethod = Constants.MuteMethods.Video; // Bookmarklet: Force video volume mute method

    // Use domain-specific settings
    let message: Message = { disabled: (this.cfg.enabledDomainsOnly && !this.domain.enabled) || this.domain.disabled };
    if (message.disabled) {
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
        if (this.cfg.wordlistsEnabled && this.wordlistId != this.audio.wordlistId) {
          this.wordlists[this.audio.wordlistId] = new Wordlist(this.cfg, this.audio.wordlistId);
        }
      }
    }

    // Remove profanity from the main document and watch for new nodes
    this.init();
    if (!this.audioOnly) { this.processNode(document, this.wordlistId); }
    this.startObserving(document);
  }

  cleanText(node, wordlistId: number, stats: boolean = true) {
    if (Page.isForbiddenNode(node)) { return false; }
    if (node.shadowRoot) { this.filterShadowRoot(node.shadowRoot, wordlistId, stats); }
    if (node.childElementCount > 0) {
      let treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      while(treeWalker.nextNode()) {
        if (treeWalker.currentNode.childNodes.length > 0) {
          treeWalker.currentNode.childNodes.forEach(childNode => {
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
    this.shadowObserver.observe(shadowRoot, ObserverConfig);
    this.processNode(shadowRoot, wordlistId, stats);
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

  processMutations(mutations) {
    mutations.forEach(function(mutation) {
      filter.checkMutationForProfanity(mutation);
    });
  }

  startObserving(target: Node = document, observer: MutationObserver = filter.observer) {
    observer.observe(target, ObserverConfig);
  }

  stopObserving(observer: MutationObserver = filter.observer) {
    let mutations = observer.takeRecords();
    observer.disconnect();
    if (mutations) { this.processMutations(mutations); }
  }

  updateCounterBadge() {} // NO-OP
}

let filter = new BookmarkletFilter;
const ObserverConfig: MutationObserverInit = {
  characterData: true,
  characterDataOldValue: true,
  childList: true,
  subtree: true,
};

if (typeof window !== 'undefined') {
  filter.observer = new MutationObserver(filter.processMutations);
  filter.shadowObserver = new MutationObserver(filter.processMutations);

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