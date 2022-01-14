import Constants from './lib/constants';
import Domain from './domain';
import Filter from './lib/filter';
import Page from './page';
import WebAudio from './webAudio';
import WebConfig from './webConfig';
import Wordlist from './lib/wordlist';
import './vendor/findAndReplaceDOMText';

/* @preserve - Start User Config */
const config = WebConfig._defaults as any;
config.words = WebConfig._defaultWords;
/* @preserve - End User Config */

export default class BookmarkletFilter extends Filter {
  audio: WebAudio;
  audioOnly: boolean;
  audioWordlistId: number;
  declare cfg: WebConfig;
  domain: Domain;
  extension: boolean;
  filterText: boolean;
  hostname: string;
  iframe: Location;
  location: Location | URL;
  mutePage: boolean;
  observer: MutationObserver;
  processMutationTarget: boolean;
  processNode: (node: HTMLElement | Document | ShadowRoot, wordlistId: number, statsType?: string | null) => void;
  shadowObserver: MutationObserver;
  stats?: Statistics; // Bookmarklet: Not used
  updateCounterBadge: () => void; // Bookmarklet: Not used - Needed to match signature of WebFilter

  constructor() {
    super();
    this.extension = false;
    this.filterText = true;
    this.audioWordlistId = Constants.ALL_WORDS_WORDLIST_ID;
    this.mutePage = false;
    this.processMutationTarget = false;
  }

  advancedReplaceText(node, wordlistId: number, statsType: string | null = Constants.STATS_TYPE_TEXT) {
    if (node.parentNode || node === document) {
      this.wordlists[wordlistId].regExps.forEach((regExp) => {
        // @ts-ignore: External library function
        findAndReplaceDOMText(node, { preset: 'prose', find: regExp, replace: (portion, match) => {
          if (portion.index === 0) {
            return this.replaceText(match[0], wordlistId, statsType);
          } else {
            return '';
          }
        } });
      });
    } else {
      this.cleanText(node, wordlistId, statsType);
    }
  }

  checkMutationForProfanity(mutation) {
    mutation.addedNodes.forEach((node) => {
      if (!Page.isForbiddenNode(node)) {
        if (this.mutePage) {
          this.cleanAudio(node);
        } else if (!this.audioOnly) {
          this.processNode(node, this.wordlistId);
        }
      }
    });

    if (this.mutePage && this.audio.muted) {
      mutation.removedNodes.forEach((node) => {
        const supported = this.audio.supportedNode(node);
        const rule = supported !== false ? this.audio.rules[supported] : this.audio.rules[0];
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
    if (!Page.isForbiddenNode(mutation.target)) {
      if (this.mutePage) {
        const supported = this.audio.supportedNode(mutation.target);
        const rule = supported !== false ? this.audio.rules[supported] : this.audio.rules[0];
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
  }

  cleanAudio(node) {
    if (this.audio.youTube && this.audio.youTubeAutoSubsPresent()) {
      if (this.audio.youTubeAutoSubsSupportedNode(node)) {
        if (this.audio.youTubeAutoSubsCurrentRow(node)) {
          this.audio.cleanYouTubeAutoSubs(node);
        } else if (!this.audioOnly) {
          this.processNode(node, this.wordlistId);
        }
      } else if (!this.audioOnly && !this.audio.youTubeAutoSubsNodeIsSubtitleText(node)) {
        this.processNode(node, this.wordlistId);
      }
    } else {
      const supported = this.audio.supportedNode(node);
      if (supported !== false) {
        this.audio.clean(node, supported);
      } else if (!this.audioOnly) {
        this.processNode(node, this.wordlistId);
      }
    }
  }

  cleanChildNode(node, wordlistId: number, statsType: string | null = Constants.STATS_TYPE_TEXT) {
    if (node.nodeName) {
      if (node.textContent && node.textContent.trim() != '') {
        const result = this.replaceTextResult(node.textContent, wordlistId, statsType);
        if (result.modified && this.filterText) {
          node.textContent = result.filtered;
        }
      } else if (node.nodeName == 'IMG') {
        this.cleanNodeAttribute(node, 'alt', wordlistId, statsType);
        this.cleanNodeAttribute(node, 'title', wordlistId, statsType);
      } else if (node.shadowRoot) {
        this.filterShadowRoot(node.shadowRoot, wordlistId, statsType);
      }
    }
  }

  cleanNode(node, wordlistId: number, statsType: string | null = Constants.STATS_TYPE_TEXT) {
    if (Page.isForbiddenNode(node)) { return false; }
    if (node.shadowRoot) { this.filterShadowRoot(node.shadowRoot, wordlistId, statsType); }
    if (node.childNodes.length > 0) {
      for (let i = 0; i < node.childNodes.length ; i++) {
        this.cleanNode(node.childNodes[i], wordlistId, statsType);
      }
    } else {
      this.cleanChildNode(node, this.wordlistId, statsType);
    }
  }

  cleanNodeAttribute(node, attribute: string, wordlistId: number, statsType: string | null = Constants.STATS_TYPE_TEXT) {
    if (node[attribute] != '') {
      const result = this.replaceTextResult(node[attribute], wordlistId, statsType);
      if (result.modified && this.filterText) {
        node[attribute] = result.filtered;
      }
    }
  }

  cleanPage() {
    this.cfg = new WebConfig(config);
    this.filterText = this.cfg.filterMethod !== Constants.FILTER_METHODS.OFF;
    this.domain = Domain.byHostname(this.hostname, this.cfg.domains);

    // Bookmarklet: Force video volume mute method
    if (this.cfg.muteMethod === Constants.MUTE_METHODS.TAB) {
      this.cfg.muteMethod === Constants.MUTE_METHODS.VIDEO_VOLUME;
    }

    // Use domain-specific settings
    const message: Message = {};
    if (
      (
        this.cfg.enabledDomainsOnly
        && !this.domain.enabled
        && !this.cfg.muteAudioOnly
      )
      || this.domain.disabled
    ) {
      message.disabled = true;
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

    // Disable if muteAudioOnly mode is active and this is not a suported page
    if (this.cfg.muteAudioOnly && !this.mutePage) {
      message.disabled = true;
      return false;
    }

    // Remove profanity from the main document and watch for new nodes
    this.init();
    if (!this.audioOnly) { this.processNode(document, this.wordlistId); }
    this.startObserving(document);
  }

  cleanText(node, wordlistId: number, statsType: string | null = Constants.STATS_TYPE_TEXT) {
    if (Page.isForbiddenNode(node)) { return false; }
    if (node.shadowRoot) { this.filterShadowRoot(node.shadowRoot, wordlistId, statsType); }
    if (node.childElementCount > 0) {
      const treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      while(treeWalker.nextNode()) {
        if (treeWalker.currentNode.childNodes.length > 0) {
          treeWalker.currentNode.childNodes.forEach((childNode) => {
            this.cleanText(childNode, wordlistId, statsType);
          });
        } else {
          if (!Page.isForbiddenNode(treeWalker.currentNode)) {
            this.cleanChildNode(treeWalker.currentNode, wordlistId, statsType);
          }
        }
      }
    } else {
      this.cleanChildNode(node, wordlistId, statsType);
    }
  }

  filterShadowRoot(shadowRoot: ShadowRoot, wordlistId: number, statsType: string | null = Constants.STATS_TYPE_TEXT) {
    this.shadowObserver.observe(shadowRoot, observerConfig);
    this.processNode(shadowRoot, wordlistId, statsType);
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
    mutations.forEach((mutation) => {
      filter.checkMutationForProfanity(mutation);
    });
  }

  startObserving(target: Node = document, observer: MutationObserver = this.observer) {
    observer.observe(target, observerConfig);
  }

  stopObserving(observer: MutationObserver = this.observer) {
    const mutations = observer.takeRecords();
    observer.disconnect();
    if (mutations) { this.processMutations(mutations); }
  }
}

const filter = new BookmarkletFilter;
const observerConfig: MutationObserverInit = {
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