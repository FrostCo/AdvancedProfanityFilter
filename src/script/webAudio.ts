import Constants from './lib/constants';
import WebFilter from './webFilter';
import BookmarkletFilter from './bookmarkletFilter';
import WebAudioSites from './webAudioSites';

export default class WebAudio {
  cueRuleIds: number[];
  enabledRuleIds: number[];
  filter: WebFilter | BookmarkletFilter;
  lastFilteredNode: HTMLElement | ChildNode;
  lastFilteredText: string;
  lastProcessedText: string;
  muted: boolean;
  rules: AudioRule[];
  sites: { [site: string]: AudioRule[] };
  supportedPage: boolean;
  unmuteTimeout: number;
  volume: number;
  watcherRuleIds: number[];
  wordlistId: number;
  youTube: boolean;
  youTubeAutoSubsMax: number;
  youTubeAutoSubsMin: number;
  youTubeAutoSubsTimeout: number;
  youTubeAutoSubsUnmuteDelay: number;

  static readonly brTagRegExp = new RegExp('<br>', 'i');
  static readonly DefaultVideoSelector = 'video';

  constructor(filter: WebFilter | BookmarkletFilter) {
    this.cueRuleIds = [];
    this.enabledRuleIds = [];
    this.watcherRuleIds = [];
    this.filter = filter;
    this.lastFilteredNode = null;
    this.lastFilteredText = '';
    this.lastProcessedText = '';
    this.muted = false;
    if (
      !filter.cfg.customAudioSites
      || typeof filter.cfg.customAudioSites !== 'object'
    ) {
      filter.cfg.customAudioSites = {};
    }
    this.sites = WebAudioSites.combineSites(filter.cfg.customAudioSites);
    this.volume = 1;
    this.wordlistId = filter.audioWordlistId;
    this.youTubeAutoSubsMax = filter.cfg.youTubeAutoSubsMax * 1000;
    this.youTubeAutoSubsMin = filter.cfg.youTubeAutoSubsMin;
    this.youTubeAutoSubsUnmuteDelay = 0;

    // Setup rules for current site
    this.rules = this.sites[filter.hostname];
    if (this.rules) {
      if (!Array.isArray(this.rules)) { this.rules = [this.rules]; }
      this.initRules();
      if (this.enabledRuleIds.length > 0) {
        this.supportedPage = true;
        if(['tv.youtube.com', 'www.youtube.com'].includes(filter.hostname)) { this.youTube = true; }

        if (this.watcherRuleIds.length > 0) {
          this.watcherRuleIds.forEach(ruleId => {
            setInterval(this.watcher, this.rules[ruleId].checkInterval, this, ruleId);
          });
        }

        if (this.cueRuleIds.length > 0) { setInterval(this.watchForVideo, 250, this); }
      }
    }
  }

  clean(subtitleContainer, ruleIndex = 0): void {
    let rule = this.rules[ruleIndex];
    if (rule.mode === 'watcher') { return; } // If this is for a watcher rule, leave the text alone
    let filtered = false;

    if (subtitleContainer.nodeName && subtitleContainer.nodeName === '#text' && subtitleContainer.parentElement) {
      subtitleContainer = subtitleContainer.parentElement;
    }
    let subtitles = rule.subtitleSelector && subtitleContainer.querySelectorAll ? subtitleContainer.querySelectorAll(rule.subtitleSelector) : [subtitleContainer];
    if (subtitles.length === 0) { return; }

    // Process subtitles
    subtitles.forEach(subtitle => {
      // innerText handles line feeds/spacing better, but is not available to #text nodes
      let textMethod = subtitle.nodeName === '#text' ? 'textContent' : 'innerText';
      if (
        rule.convertBreaks === true
        && subtitle.nodeName !== '#text'
        && !WebAudio.brTagRegExp.test(subtitle[textMethod])
        && WebAudio.brTagRegExp.test(subtitle.innerHTML)
      ) {
        if (subtitle.style.whiteSpace !== 'pre') { subtitle.style.whiteSpace = 'pre'; }
        subtitle.textContent = subtitle.innerHTML.replace(WebAudio.brTagRegExp, '\n');
      }
      let result = this.replaceTextResult(subtitle[textMethod]);
      if (result.modified) {
        filtered = true;
        this.mute(rule); // Mute the audio if we haven't already

        if (rule.filterSubtitles) {
          if (rule.ignoreMutations) { this.filter.stopObserving(); }
          subtitle[textMethod] = result.filtered;
          if (rule.ignoreMutations) { this.filter.startObserving(); }
        }

        this.lastFilteredNode = subtitle;
        this.lastFilteredText = subtitle[textMethod];
      }
    });

    switch (rule.showSubtitles) {
      case Constants.ShowSubtitles.Filtered: if (filtered) { this.showSubtitles(rule); } else { this.hideSubtitles(rule, subtitles); } break;
      case Constants.ShowSubtitles.Unfiltered: if (filtered) { this.hideSubtitles(rule, subtitles); } else { this.showSubtitles(rule); } break;
      case Constants.ShowSubtitles.None: this.hideSubtitles(rule, subtitles); break;
    }
  }

  cleanYouTubeAutoSubs(node): void {
    // Found a new word, clear the max timeout
    if (this.youTubeAutoSubsTimeout != null) {
      clearTimeout(this.youTubeAutoSubsTimeout);
      this.youTubeAutoSubsTimeout = null;
    }

    let result = this.replaceTextResult(node.textContent);
    if (result.modified) {
      node.textContent = result.filtered;
      this.mute();
      this.youTubeAutoSubsUnmuteDelay = null;
      this.filter.updateCounterBadge();

      // Set a timer to unmute if a max time was specified
      if (this.youTubeAutoSubsMax) {
        this.youTubeAutoSubsTimeout = window.setTimeout(this.youTubeAutoSubsMuteTimeout, this.youTubeAutoSubsMax, this);
      }
    } else {
      if (this.muted) {
        if (this.youTubeAutoSubsMin > 0) {
          let currentTime = document.getElementsByTagName(WebAudio.DefaultVideoSelector)[0].currentTime;
          if (this.youTubeAutoSubsUnmuteDelay == null) { // Start tracking youTubeAutoSubsUnmuteDelay when next unfiltered word is found
            this.youTubeAutoSubsUnmuteDelay = currentTime;
          } else {
            if (currentTime < this.youTubeAutoSubsUnmuteDelay) { this.youTubeAutoSubsUnmuteDelay = 0; } // Reset youTubeAutoSubsUnmuteDelay if video reversed
            if (currentTime > (this.youTubeAutoSubsUnmuteDelay + this.youTubeAutoSubsMin)) { // Unmute if its been long enough
              this.unmute();
            }
          }
        } else { // Unmute immediately if youTubeAutoSubsMin = 0
          this.unmute();
        }
      }
    }

    // Hide YouTube auto text unless show all subtitles is set
    if (this.filter.cfg.showSubtitles !== Constants.ShowSubtitles.All) {
      let container = document.querySelector('div.ytp-caption-window-rollup span.captions-text') as HTMLElement;
      if (container.style.display == 'block') {
        container.style.display = 'none';
      }
    }
  }

  clearUnmuteTimeout(rule: AudioRule) {
    if (rule.unmuteDelay && this.unmuteTimeout != null) {
      clearTimeout(this.unmuteTimeout);
      this.unmuteTimeout = null;
    }
  }

  delayedUnmute(instance: WebAudio, rule: AudioRule) {
    let delayed = true;
    instance.unmute(rule, null, delayed);
    this.unmuteTimeout = null;
  }

  getVideoTextTrack(video: HTMLVideoElement, language: string, requireShowing: boolean = true) {
    if (video.textTracks && video.textTracks.length > 0) {
      for (let i = 0; i < video.textTracks.length; i++) {
        if (language) {
          if (language == video.textTracks[i].language) {
            if (!requireShowing || (requireShowing && video.textTracks[i].mode === 'showing')) {
              return video.textTracks[i];
            }
          }
        } else {
          if (!requireShowing || (requireShowing && video.textTracks[i].mode === 'showing')) {
            return video.textTracks[i];
          }
        }
      }
    }
  }

  // Some sites ignore textTrack.mode = 'hidden' and will still show captions
  // This is a fallback (not preferred) method that can be used for hiding the cues
  hideCue(rule: AudioRule, cue: FilteredVTTCue) {
    if (
      (rule.showSubtitles === Constants.ShowSubtitles.Filtered && !cue.filtered)
      || (rule.showSubtitles === Constants.ShowSubtitles.Unfiltered && cue.filtered)
      || rule.showSubtitles === Constants.ShowSubtitles.None
    ) {
      cue.text = '';
      cue.position = 100;
      cue.size = 0;
    }
  }

  hideSubtitles(rule: AudioRule, subtitles?) {
    if (rule.displaySelector) {
      let container = document.querySelector(rule.displaySelector) as HTMLElement;
      if (container) {
        // Save the original display style if none was included in the rule
        if (
          rule.displayShow === ''
          && container.style.display !== ''
          && container.style.display !== rule.displayHide
        ) {
          rule.displayShow = container.style.display;
        }

        container.style.setProperty('display', rule.displayHide); // , 'important');
      }
    } else if (subtitles) {
      subtitles.forEach(subtitle => {
        subtitle.innerText = '';
        if (rule.removeSubtitleSpacing && subtitle.style) {
          if (subtitle.style.padding) { subtitle.style.padding = 0; }
          if (subtitle.style.margin) { subtitle.style.margin = 0; }
        }
      });
    }
  }

  initCueRule(rule: AudioRule) {
    if (rule.videoSelector === undefined) { rule.videoSelector = WebAudio.DefaultVideoSelector; }
    if (rule.videoCueRequireShowing === undefined) { rule.videoCueRequireShowing = this.filter.cfg.muteCueRequireShowing; }
  }

  initDisplaySelector(rule: AudioRule) {
    if (rule.displaySelector !== undefined) {
      if (rule.displayHide === undefined) { rule.displayHide = 'none'; }
      if (rule.displayShow === undefined) { rule.displayShow = ''; }
    }
  }

  initElementChildRule(rule: AudioRule) {
    if (!rule.parentSelector && !rule.parentSelectorAll) { rule.disabled = true; }
    this.initDisplaySelector(rule);
  }

  initElementRule(rule: AudioRule) {
    this.initDisplaySelector(rule);
  }

  initRules() {
    this.rules.forEach((rule, index) => {
      if (
        rule.mode === undefined
        || ((rule.mode == 'element' || rule.mode == 'elementChild') && !rule.tagName)
        // Skip this rule if it doesn't apply to the current page
        || (rule.iframe === true && this.filter.iframe == null)
        || (rule.iframe === false && this.filter.iframe != null)
      ) {
        rule.disabled = true;
      }

      if (!rule.disabled) {
        // Setup rule defaults
        if (rule.filterSubtitles == null) { rule.filterSubtitles = true; }

        // Allow rules to override global settings
        if (rule.muteMethod == null) { rule.muteMethod = this.filter.cfg.muteMethod; }
        if (rule.showSubtitles == null) { rule.showSubtitles = this.filter.cfg.showSubtitles; }

        // Ensure proper rule values
        if (rule.tagName != null && rule.tagName != '#text') { rule.tagName = rule.tagName.toUpperCase(); }

        switch(rule.mode) {
          case 'cue':
            this.initCueRule(rule);
            if (!rule.disabled) { this.cueRuleIds.push(index); }
            break;
          case 'elementChild':
            this.initElementChildRule(rule);
            break;
          case 'element':
            this.initElementRule(rule);
            break;
          case 'text':
            this.initTextRule(rule);
            break;
          case 'watcher':
            this.initWatcherRule(rule);
            if (!rule.disabled) { this.watcherRuleIds.push(index); }
            break;
        }
        if (!rule.disabled) { this.enabledRuleIds.push(index); }
      }
    });
  }

  initTextRule(rule: AudioRule) {
    rule.tagName = '#text';
    if (rule.simpleUnmute === undefined) { rule.simpleUnmute = true; }
  }

  initWatcherRule(rule: AudioRule) {
    if (rule.checkInterval === undefined) { rule.checkInterval = 20; }
    if (rule.ignoreMutations === undefined) { rule.ignoreMutations = true; }
    if (rule.simpleUnmute === undefined) { rule.simpleUnmute = true; }
    if (rule.videoSelector === undefined) { rule.videoSelector = WebAudio.DefaultVideoSelector; }
    this.initDisplaySelector(rule);
  }

  mute(rule?: AudioRule, video?: HTMLVideoElement): void {
    if (!this.muted) {
      this.muted = true;
      let muteMethod = rule && rule.muteMethod >= 0 ? rule.muteMethod : this.filter.cfg.muteMethod;

      switch(muteMethod) {
        case Constants.MuteMethods.Tab:
          chrome.runtime.sendMessage({ mute: true });
          break;
        case Constants.MuteMethods.Video:
          if (!video) { video = document.querySelector(rule && rule.videoSelector ? rule.videoSelector : WebAudio.DefaultVideoSelector); }
          if (video && video.volume != null) {
            this.volume = video.volume; // Save original volume
            video.volume = 0;
          }
          break;
      }
    }

    // If we called mute and there is a delayedUnmute planned, clear it
    if (rule && rule.unmuteDelay && this.unmuteTimeout) { this.clearUnmuteTimeout(rule); }
  }

  playing(video: HTMLVideoElement): boolean {
    return !!(video && video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);
  }

  processCues(cues: FilteredVTTCue[], rule: AudioRule) {
    for (let i = 0; i < cues.length; i++) {
      let cue = cues[i];
      if (cue.hasOwnProperty('filtered')) { continue; }

      if (rule.videoCueSync) {
        cue.startTime += rule.videoCueSync;
        cue.endTime += rule.videoCueSync;
      }

      let result = this.replaceTextResult(cue.text);
      if (result.modified) {
        cue.filtered = true;
        cue.originalText = cue.text;
        cue.text = result.filtered;
      } else {
        cue.filtered = false;
      }

      if (rule.videoCueHideCues) { this.hideCue(rule, cue); }
    }
  }

  processWatcherCaptions(rule, captions, data) {
    let instance = this;

    let initialCall = data.initialCall; // Check if this is the first call
    if (initialCall) {
      // Don't process the same filter again
      if (instance.lastProcessedText && instance.lastProcessedText === captions.textContent) {
        data.skipped = true;
        return false;
      } else { // These are new captions, unmute if muted
        instance.unmute(rule);
        instance.lastProcessedText = '';
      }

      data.initialCall = false;
      data.filtered = false;
    }

    if (captions.hasChildNodes()) {
      captions.childNodes.forEach(child => {
        instance.processWatcherCaptions(rule, child, data);
      });
    } else { // Process child
      // innerText handles line feeds/spacing better, but is not available to #text nodes
      let textMethod = (captions && captions.nodeName) === '#text' ? 'textContent' : 'innerText';

      // Don't process empty/whitespace nodes
      if (captions[textMethod] && captions[textMethod].trim()) {
        let result = instance.replaceTextResult(captions[textMethod]);
        if (result.modified) {
          instance.mute(rule);
          data.filtered = true;
          if (rule.filterSubtitles) { captions[textMethod] = result.filtered; }
        }
      }
    }

    if (initialCall) { instance.lastProcessedText = captions.textContent; }
  }

  replaceTextResult(string: string, stats: boolean = true) {
    return this.filter.replaceTextResult(string, this.wordlistId, stats);
  }

  showSubtitles(rule) {
    if (rule.displaySelector) {
      let container = document.querySelector(rule.displaySelector);
      if (container) { container.style.setProperty('display', rule.displayShow); }
    }
  }

  // Checks if a node is a supported audio node.
  // Returns rule id upon first match, otherwise returns false
  supportedNode(node) {
    for (let i = 0; i < this.enabledRuleIds.length; i++) {
      let ruleId = this.enabledRuleIds[i];
      let rule = this.rules[ruleId];

      switch(rule.mode) {
        case 'element':
          if (node.nodeName == rule.tagName) {
            let failed = false;
            if (!failed && rule.className && (!node.className || !node.classList.contains(rule.className))) { failed = true; }
            if (!failed && rule.dataPropPresent && (!node.dataset || !node.dataset.hasOwnProperty(rule.dataPropPresent))) { failed = true; }
            if (!failed && rule.hasChildrenElements && (typeof node.childElementCount !== 'number' || node.childElementCount == 0)) { failed = true; }
            if (!failed && rule.subtitleSelector && (typeof node.querySelector !== 'function' || !node.querySelector(rule.subtitleSelector))) { failed = true; }
            if (!failed && rule.containsSelector && (typeof node.querySelector !== 'function' || !node.querySelector(rule.containsSelector))) { failed = true; }
            if (!failed) { return ruleId; }
          }
          break;
        case 'elementChild':
          if (node.nodeName === rule.tagName) {
            if (rule.parentSelector) {
              let parent = document.querySelector(rule.parentSelector);
              if (parent && parent.contains(node)) { return ruleId; }
            } else {
              let parents = document.querySelectorAll(rule.parentSelectorAll);
              for (let j = 0; j < parents.length; j++) {
                if (parents[j].contains(node)) { return ruleId; }
              }
            }
          }
          break;
        case 'text':
          if (node.nodeName === rule.tagName) {
            let parent = document.querySelector(rule.parentSelector);
            if (parent && parent.contains(node)) { return ruleId; }
          }
          break;
        case 'watcher':
          if (node.parentElement && node.parentElement == document.querySelector(rule.subtitleSelector)) { return ruleId; }
          if (rule.parentSelector != null) {
            let parent = document.querySelector(rule.parentSelector);
            if (parent && parent.contains(node)) { return ruleId; }
          }
          break;
      }
    }

    // No matching rule was found
    return false;
  }

  unmute(rule?: AudioRule, video?: HTMLVideoElement, delayed: boolean = false): void {
    if (this.muted) {
      // If we haven't already delayed unmute and we should (rule.unmuteDelay), set the timeout
      if (!delayed && rule && rule.unmuteDelay >= 0) {
        // If unmute is called after an unmute has been scheduled, remove the older one and schedule a new unmute
        if (this.unmuteTimeout == null) { this.clearUnmuteTimeout(rule); }
        this.unmuteTimeout = window.setTimeout(this.delayedUnmute, rule.unmuteDelay, this, rule);
        return;
      }

      this.muted = false;
      let muteMethod = rule && rule.muteMethod >= 0 ? rule.muteMethod : this.filter.cfg.muteMethod;

      switch(muteMethod) {
        case Constants.MuteMethods.Tab:
          chrome.runtime.sendMessage({ mute: false });
          break;
        case Constants.MuteMethods.Video:
          if (!video) { video = document.querySelector(rule && rule.videoSelector ? rule.videoSelector : WebAudio.DefaultVideoSelector); }
          if (video && video.volume != null) {
            video.volume = this.volume;
          }
          break;
      }
    }
  }

  watcher(instance: WebAudio, ruleId = 0) {
    let rule = instance.rules[ruleId];
    let video = document.querySelector(rule.videoSelector) as HTMLVideoElement;

    if (video && instance.playing(video)) {
      if (rule.ignoreMutations) { instance.filter.stopObserving(); } // Stop observing when video is playing

      let captions = document.querySelector(rule.subtitleSelector) as HTMLElement;
      if (captions && captions.textContent && captions.textContent.trim()) {
        let data: WatcherData = { initialCall: true };
        instance.processWatcherCaptions(rule, captions, data);
        if (data.skipped) { return false; }

        // Hide/show captions/subtitles
        switch (rule.showSubtitles) {
          case Constants.ShowSubtitles.Filtered: if (data.filtered) { instance.showSubtitles(rule); } else { instance.hideSubtitles(rule); } break;
          case Constants.ShowSubtitles.Unfiltered: if (data.filtered) { instance.hideSubtitles(rule); } else { instance.showSubtitles(rule); } break;
          case Constants.ShowSubtitles.None: instance.hideSubtitles(rule); break;
        }

        if (data.filtered) { instance.filter.updateCounterBadge(); }
      } else if (rule.simpleUnmute) { // If there are no captions/subtitles: unmute and hide
        instance.unmute(rule, video);
        if (rule.showSubtitles > 0) { instance.hideSubtitles(rule); }
      }
    } else {
      if (rule.ignoreMutations) { instance.filter.startObserving(); } // Start observing when video is not playing
    }
  }

  watchForVideo(instance: WebAudio) {
    instance.cueRuleIds.forEach(cueRuleId => {
      let rule = instance.rules[cueRuleId] as AudioRule;
      let video = document.querySelector(rule.videoSelector) as HTMLVideoElement;
      if (video && video.textTracks && instance.playing(video)) {
        let textTrack = instance.getVideoTextTrack(video, rule.videoCueLanguage, rule.videoCueRequireShowing);

        if (textTrack && !textTrack.oncuechange) {
          if (!rule.videoCueHideCues && rule.showSubtitles === Constants.ShowSubtitles.None) { textTrack.mode = 'hidden'; }

          textTrack.oncuechange = () => {
            if (textTrack.activeCues && textTrack.activeCues.length > 0) {
              let filtered = false;

              for (let i = 0; i < textTrack.activeCues.length; i++) {
                let activeCue = textTrack.activeCues[i] as FilteredVTTCue;
                if (!activeCue.hasOwnProperty('filtered')) {
                  let cues = textTrack.cues as any as FilteredVTTCue[];
                  instance.processCues(cues, rule);
                }

                if (activeCue.filtered) {
                  filtered = true;
                  instance.mute(rule, video);
                }
              }

              if (!filtered) { instance.unmute(rule, video); }

              if (!rule.videoCueHideCues) {
                if (filtered) {
                  switch (rule.showSubtitles) {
                    case Constants.ShowSubtitles.Filtered: textTrack.mode = 'showing'; break;
                    case Constants.ShowSubtitles.Unfiltered: textTrack.mode = 'hidden'; break;
                  }
                } else {
                  switch (rule.showSubtitles) {
                    case Constants.ShowSubtitles.Filtered: textTrack.mode = 'hidden'; break;
                    case Constants.ShowSubtitles.Unfiltered: textTrack.mode = 'showing'; break;
                  }
                }
              }
            } else { // No active cues
              instance.unmute(rule, video);
            }
          };
        }
      }
    });
  }

  youTubeAutoSubsCurrentRow(node): boolean {
    return !!(node.parentElement.parentElement == node.parentElement.parentElement.parentElement.lastChild);
  }

  youTubeAutoSubsMuteTimeout(instance) {
    let video = window.document.querySelector(WebAudio.DefaultVideoSelector);
    if (video && instance.playing(video)) {
      instance.unmute();
    }
    instance.youTubeAutoSubsTimeout = null;
  }

  youTubeAutoSubsNodeIsSubtitleText(node): boolean {
    let captionWindow = document.querySelector('div.caption-window'); // YouTube Auto-gen subs
    return !!(captionWindow && captionWindow.contains(node));
  }

  youTubeAutoSubsPresent(): boolean {
    return !!(document.querySelector('div.ytp-caption-window-rollup'));
  }

  youTubeAutoSubsSupportedNode(node: any): boolean {
    if (node.nodeName == '#text' && node.textContent != '') {
      return !!(this.youTubeAutoSubsNodeIsSubtitleText(node));
    }
    return false;
  }
}