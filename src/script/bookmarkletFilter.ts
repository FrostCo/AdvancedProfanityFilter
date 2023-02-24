import '@VENDOR/findAndReplaceDOMText.js';
import Constants from '@APF/lib/constants';
import Domain from '@APF/domain';
import Filter from '@APF/lib/filter';
import Page from '@APF/page';
import WebConfig from '@APF/webConfig';

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

  //#region Class reference helpers
  // Can be overridden in children classes
  static get Config() { return WebConfig; }
  static get Constants() { return Constants; }
  static get Domain() { return Domain; }
  get Class() { return (this.constructor as typeof BookmarkletFilter); }
  //#endregion

  static readonly observerConfig: MutationObserverInit = {
    characterData: true,
    characterDataOldValue: true,
    childList: true,
    subtree: true,
  };

  constructor() {
    super();
    this.extension = false;
    this.filterText = true;
    this.processMutationTarget = false;
  }

  advancedReplaceText(node, wordlistId: number, statsType: string | null = this.Class.Constants.STATS_TYPE_TEXT) {
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

  beforeProcessingPage(message: Message) {}

  cleanChildNode(node, wordlistId: number, statsType: string | null = this.Class.Constants.STATS_TYPE_TEXT) {
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

  cleanNode(node, wordlistId: number, statsType: string | null = this.Class.Constants.STATS_TYPE_TEXT) {
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

  cleanNodeAttribute(node, attribute: string, wordlistId: number, statsType: string | null = this.Class.Constants.STATS_TYPE_TEXT) {
    if (node[attribute] != '') {
      const result = this.replaceTextResult(node[attribute], wordlistId, statsType);
      if (result.modified && this.filterText) {
        node[attribute] = result.filtered;
      }
    }
  }

  cleanPage(config?: WebConfig) {
    this.cfg = new this.Class.Config(config);
    this.filterText = this.cfg.filterMethod !== this.Class.Constants.FILTER_METHODS.OFF;
    this.domain = this.Class.Domain.byHostname(this.hostname, this.cfg.domains);

    if (!this.shouldProcessFrame) {
      return false;
    }

    // Use domain-specific settings
    if (this.shouldBeDisabled({} as BackgroundData)) {
      return false;
    }

    const message = { disabled: false } as Message;
    this.beforeProcessingPage(message);
    if (message.disabled) return false;

    this.setDomainWordlist();

    // Filter text from the main document and watch for new nodes
    this.init();
    this.processInitialPage();
    this.startObserving(document);
    /* eslint-disable-next-line no-console */
    console.log('[APF Bookmarklet] Page filtered');
  }

  cleanText(node, wordlistId: number, statsType: string | null = this.Class.Constants.STATS_TYPE_TEXT) {
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

  filterShadowRoot(shadowRoot: ShadowRoot, wordlistId: number, statsType: string | null = this.Class.Constants.STATS_TYPE_TEXT) {
    this.shadowObserver.observe(shadowRoot, BookmarkletFilter.observerConfig);
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

    this.observer = new MutationObserver(this.processMutations.bind(this));
    this.shadowObserver = new MutationObserver(this.processMutations.bind(this));
  }

  initPageDetails() {
    if (window != window.top) {
      this.iframe = document.location;
      try { // same domain
        this.hostname = window.parent.location.hostname;
      } catch (err) { // different domain
        if (document.referrer) {
          this.hostname = new URL(document.referrer).hostname;
        } else {
          this.hostname = document.location.hostname;
        }
      }
    } else {
      this.hostname = document.location.hostname;
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

  processInitialPage() {
    this.processNode(document, this.wordlistId);
  }

  processMutation(mutation: MutationRecord) {
    if (this.shouldProcessAddedNodes(mutation)) this.processAddedNodes(mutation.addedNodes);
    if (this.shouldProcessRemovedNodes(mutation)) this.processRemovedNodes(mutation.removedNodes);
    if (this.shouldProcessMutationTargetNode(mutation)) this.processMutationTargetNode(mutation);
  }

  processMutationTargetNode(mutation: MutationRecord) {
    if (mutation.target.nodeName === '#text') {
      this.processMutationTargetText(mutation);
    } else if (this.processMutationTarget) {
      this.processNode(mutation.target, this.wordlistId);
    }
  }

  processMutationTargetText(mutation: MutationRecord) {
    const target = mutation.target as CharacterData;
    const result = this.replaceTextResult(target.data, this.wordlistId);
    if (result.modified) target.data = result.filtered;
  }

  processMutations(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      this.processMutation(mutation);
    }
  }

  processRemovedNode(node: Node) {}

  processRemovedNodes(nodes: NodeList) {
    for (const node of nodes) {
      this.processRemovedNode(node);
    }
  }

  setDomainWordlist() {
    if (this.domain.wordlistId !== undefined) this.wordlistId = this.domain.wordlistId;
  }

  shouldBeDisabled(backgroundData: BackgroundData) {
    return (
      (
        this.cfg.enabledDomainsOnly
        && !this.domain.enabled
      )
      || this.domain.disabled
    );
  }

  shouldProcessAddedNode(node) {
    return !Page.isForbiddenNode(node);
  }

  shouldProcessAddedNodes(mutation: MutationRecord) {
    return mutation.addedNodes.length;
  }

  get shouldProcessFrame() {
    return (
      !this.iframe
      || (
        (this.cfg.enabledFramesOnly && this.domain.framesOn)
        || (!this.cfg.enabledFramesOnly && !this.domain.framesOff)
      )
    );
  }

  shouldProcessMutationTargetNode(mutation: MutationRecord) {
    return mutation.target != null;
  }

  shouldProcessRemovedNodes(mutation: MutationRecord) {
    return false;
  }

  startObserving(target: Node = document, observer: MutationObserver = this.observer) {
    observer.observe(target, BookmarkletFilter.observerConfig);
  }

  stopObserving(observer: MutationObserver = this.observer) {
    const mutations = observer.takeRecords();
    observer.disconnect();
    if (mutations) { this.processMutations(mutations); }
  }
}
