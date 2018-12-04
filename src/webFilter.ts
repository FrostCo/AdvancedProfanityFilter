import Domain from './domain.js';
import {Filter} from './lib/filter.js';
import Page from './page.js';
import WebConfig from './webConfig.js';

interface Message {
  advanced?: boolean,
  counter?: number,
  disabled?: boolean,
  mute?: boolean,
  summary?: object
}

export default class WebFilter extends Filter {
  advanced: boolean;
  lastSubtitle: string;
  muted: boolean;
  summary: object;

  constructor() {
    super();
    this.advanced = false;
    this.muted = false;
    this.summary = {};
  }

  advancedPage(): boolean {
    return Domain.domainMatch(window.location.hostname, this.cfg.advancedDomains);
  }

  advancedReplaceText(string: string) {
    let result = {} as any;
    result.original = string;
    result.filtered = filter.replaceText(string);
    result.modified = (result.filtered != string)
    return result;
  }

  audioPage(): boolean {
    return Domain.domainMatch(window.location.hostname, ['app.plex.tv', 'play.google.com', 'www.amazon.com', 'www.youtube.com']);
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
    // @ts-ignore: Type WebConfig is not assignable to type Config
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
      this.advanced = this.advancedPage();
      message.advanced = this.advanced;
      if (this.advanced) {
        message.advanced = true;
      }

      chrome.runtime.sendMessage(message);
    }

    this.init();

    // Advanced Audio Muting
    if (this.advanced && this.audioPage()) {
      this.processAudioPage();
    } else {
      // Remove profanity from the main document and watch for new nodes
      this.removeProfanity(Page.xpathDocText, document);
      this.updateCounterBadge();
      this.observeNewNodes();
    }
  }

  // Rules:
  // - Multiline subtitles are separated by `<br>`
  // - If a subtitle line is empty: "", then we'll unmute and stop processing
  cleanAudioAmazon() {
    var subtitleContainer = document.querySelectorAll('span.captions span.timedTextBackground');
    if (subtitleContainer.length == 0) filter.unmute(); // Turn audio on when subtitles are absent

    subtitleContainer.forEach(subtitle => {
      if (subtitle.innerHTML == '') { filter.unmute(); return; } // Turn audio on when subtitles are absent
      if (filter.lastSubtitle != subtitle.innerHTML) { // This subtitle hasn't been checked yet
        filter.lastSubtitle = subtitle.innerHTML; // Update the last subtitle tracker
        filter.unmute(); // Turn on audio if we haven't already

        // Process subtitles
        let subLines = subtitle.innerHTML.split('<br>');
        let newLines = [];
        subLines.forEach(line => { newLines.push(filter.replaceText(line)); });
        let newSub = newLines.join('<br>');

        // Update if modified
        if (subtitle.innerHTML != newSub) {
          subtitle.innerHTML = newSub;
          filter.lastSubtitle = newSub; // Update the last subtitle tracker
          filter.mute(); // Mute the audio if we haven't already
          filter.updateCounterBadge();
        }
      }
    });
  }

  // TODO: change lastsub to array and use include?
  // TODO: Check if video is playing?
  // div.lava-timed-text-viewport span.lava-tt-caption-default
  // //*[@id="player-container"]/div[1]/div/div[1]/span/text()[1]
  // cleanAudioGooglePlay() {
  //   var filtered = false;
  //   var subtitles = document.querySelectorAll('div.lava-timed-text-viewport span.lava-tt-caption-default');
  //   if (subtitles.length == 0) { filter.unmute(); return; } // Turn audio on when subtitles are absent

  //   var allSubtitles = document.querySelectorAll('div.lava-timed-text-viewport')[0].textContent;
  //   if (filter.lastSubtitle != allSubtitles) { // This subtitle hasn't been checked yet
  //     filter.lastSubtitle = allSubtitles; // Update the last subtitle tracker
  //     filter.unmute(); // Turn on audio if we haven't already

  //     // Process subtitles
  //     subtitles.forEach(subtitle => {
  //       let result = filter.advancedReplaceText(subtitle.textContent);
  //       if (result.modified) {
  //         subtitle.textContent = result.filtered;
  //         filtered = true;
  //         filter.mute(); // Mute the audio if we haven't already
  //         filter.lastSubtitle = filter.lastSubtitle.replace(result.original, result.filtered);
  //       }
  //     });

  //     if (filtered) filter.updateCounterBadge(); // Update if modified
  //   }
  // }

  cleanAudioPlex() {
    var subtitleContainer = document.querySelectorAll('[data-dialogue-id]') as any;

    if (subtitleContainer.length == 0) filter.unmute(); // Turn audio on when subtitles are absent

    subtitleContainer.forEach(node => {
      // If the current subtitle lines haven't already been checked
      if (filter.lastSubtitle != node.dataset.dialogueId) {
        filter.lastSubtitle = node.dataset.dialogueId;

        filter.unmute(); // Turn on audio if we haven't already

        // Process subtitles
        [].forEach.call(node.children, function(child) {
          let subLine = child.children[0];
          if (subLine) {
            var newText = filter.replaceText(subLine.textContent);
            if (subLine.textContent != newText) {
              subLine.textContent = newText;
              filter.mute(); // Mute the audio if we haven't already
              filter.updateCounterBadge();
            }
          }
        });
      }
    });
  }

  // Container: div.caption-window divspan.captions-text
  // Subtitles: span.caption-visual-line
  cleanAudioYoutube() {
    let filtered = false;
    let subtitles = document.querySelectorAll('span.captions-text span.caption-visual-line');
    if (subtitles.length == 0) { filter.unmute(); return; } // Turn audio on and return when subtitles are absent
    // console.log('Processing subtitles...'); // DEBUG - Audio

    let allSubtitles = document.querySelectorAll('div.caption-window span.captions-text')[0].textContent;
    if (filter.lastSubtitle != allSubtitles) { // This subtitle hasn't been checked yet
      // console.log('New subtitles found!'); // DEBUG - Audio
      filter.lastSubtitle = allSubtitles; // Update the last subtitle tracker
      filter.unmute(); // Turn on audio if we haven't already

      // Process subtitles
      subtitles.forEach(subtitle => {
        let result = filter.advancedReplaceText(subtitle.textContent);
        if (result.modified) {
          filtered = true;
          subtitle.textContent = result.filtered;
          filter.mute(); // Mute the audio if we haven't already
          filter.lastSubtitle = filter.lastSubtitle.replace(result.original, result.filtered);
        }
      });

      if (filtered) filter.updateCounterBadge(); // Update if modified
    }
  }

  disabledPage(): boolean {
    // console.count('disabledPage'); // Benchmarking - Executaion Count
    return Domain.domainMatch(window.location.hostname, this.cfg.disabledDomains);
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

  mute() {
    if (filter.muted === false) {
      this.muted = true;
      chrome.runtime.sendMessage({mute: filter.muted});
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

  processAudioPage() {
    // TODO: Add an optional delay to unmuting?
    let interval = 100; // TODO: Make configurable
    switch(window.location.hostname) {
      case 'app.plex.tv':
        setInterval(filter.cleanAudioPlex, interval);
        break;
      // case 'play.google.com':
      //   setInterval(filter.cleanAudioGooglePlay, interval);
      //   break;
      case 'www.amazon.com':
        setInterval(filter.cleanAudioAmazon, interval);
        break;
      case 'www.youtube.com':
        setInterval(filter.cleanAudioYoutube, interval);
        break;
    }
  }

  unmute() {
    if (filter.muted === true) {
      this.muted = false;
      chrome.runtime.sendMessage({mute: filter.muted});
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