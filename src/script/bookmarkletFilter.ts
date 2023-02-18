import '@VENDOR/findAndReplaceDOMText.js';
import Constants from '@APF/lib/constants';
import Domain from '@APF/domain';
import Filter from '@APF/lib/filter';
import Page from '@APF/page';
import WebConfig from '@APF/webConfig';

/* @preserve - Start User Config */
const config = WebConfig._defaults as any;
config.words = WebConfig._defaultWords;
/* @preserve - End User Config */

export default class BookmarkletFilter extends Filter {
  buildMessage: (destination: string, data?: object) => Message; // Bookmarklet: Not used - Needed to match signature of WebFilter
  declare cfg: WebConfig;
  domain: Domain;
  extension: boolean;
  filterText: boolean;
  hostname: string;
  iframe: Location;
  location: Location | URL;
  observer: MutationObserver;
  processMutationTarget: boolean;
  processNode: (node: Document | HTMLElement | Node | ShadowRoot, wordlistId: number, statsType?: string | null) => void;
  shadowObserver: MutationObserver;
  stats?: Statistics; // Bookmarklet: Not used
  updateCounterBadge: () => void; // Bookmarklet: Not used - Needed to match signature of WebFilter

  constructor() {
    super();
    this.extension = false;
    this.filterText = true;
    this.processMutationTarget = false;
  }

  advancedReplaceText(node, wordlistId: number, statsType: string | null = Constants.STATS_TYPE_TEXT) {
    if (node.parentNode || node === document) {
      for (const regExp of this.wordlists[wordlistId].regExps) {
        // @ts-ignore: External library function
        findAndReplaceDOMText(node, { preset: 'prose', find: regExp, replace: (portion, match) => {
          if (portion.index === 0) {
            return this.replaceText(match[0], wordlistId, statsType);
          } else {
            return '';
          }
        } });
      }
    } else {
      this.cleanText(node, wordlistId, statsType);
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

    if (
      this.iframe
      && (
        (this.cfg.enabledFramesOnly && !this.domain.framesOn)
        || (!this.cfg.enabledFramesOnly && this.domain.framesOff)
      )
    ) {
      return false;
    }

    // Use domain-specific settings
    if (
      (
        this.cfg.enabledDomainsOnly
        && !this.domain.enabled
      )
      || this.domain.disabled
    ) {
      return false;
    }
    if (this.domain.wordlistId !== undefined) { this.wordlistId = this.domain.wordlistId; }

    // Filter text from the main document and watch for new nodes
    this.init();
    this.processNode(document, this.wordlistId);
    this.startObserving(document);
  }

  cleanText(node, wordlistId: number, statsType: string | null = Constants.STATS_TYPE_TEXT) {
    if (Page.isForbiddenNode(node)) { return false; }
    if (node.shadowRoot) { this.filterShadowRoot(node.shadowRoot, wordlistId, statsType); }
    if (node.childElementCount > 0) {
      const treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      while (treeWalker.nextNode()) {
        if (treeWalker.currentNode.childNodes.length > 0) {
          for (const childNode of treeWalker.currentNode.childNodes) {
            this.cleanText(childNode, wordlistId, statsType);
          }
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

  processAddedNode(node: Node) {
    this.processNode(node, this.wordlistId);
  }

  processAddedNodes(addedNodes: NodeList) {
    for (const node of addedNodes) {
      if (this.shouldProcessAddedNode(node)) {
        this.processAddedNode(node);
      }
    }
  }

  processMutation(mutation: MutationRecord) {
    if (this.shouldProcessAddedNodes(mutation)) this.processAddedNodes(mutation.addedNodes);
    if (this.shouldProcessRemovedNodes(mutation)) this.processRemovedNodes(mutation.removedNodes);
    if (this.shouldProcessMutationTargetNode(mutation)) this.processMutationTargetNode(mutation);
  }

  processMutationTargetNode(mutation: MutationRecord) {
    if (mutation.target.nodeName === '#text') {
      const target = mutation.target as CharacterData;
      this.processMutationTargetText(target);
    } else if (this.processMutationTarget) {
      this.processNode(mutation.target, this.wordlistId);
    }
  }

  processMutationTargetText(target: CharacterData) {
    const result = this.replaceTextResult(target.data, this.wordlistId);
    if (result.modified) target.data = result.filtered;
  }

  processMutations(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      this.processMutation(mutation);
    }
  }

  processRemovedNodes(removedNodes: NodeList) {}

  shouldProcessAddedNode(node) {
    return !Page.isForbiddenNode(node);
  }

  shouldProcessAddedNodes(mutation: MutationRecord) {
    return mutation.addedNodes.length;
  }

  shouldProcessMutationTargetNode(mutation: MutationRecord) {
    return mutation.target != null;
  }

  shouldProcessRemovedNodes(mutation: MutationRecord) {
    return false;
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
    } catch (err) {
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
