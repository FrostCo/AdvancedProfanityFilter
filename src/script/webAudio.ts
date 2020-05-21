import WebFilter from './webFilter';
import BookmarkletFilter from './bookmarkletFilter';
import { WebAudioSites } from './webAudioSites';

export default class WebAudio {
  cueRuleIds: number[];
  filter: WebFilter | BookmarkletFilter;
  lastFilteredNode: HTMLElement | ChildNode;
  lastFilteredText: string;
  lastProcessed: string[];
  muted: boolean;
  rules: AudioRules[];
  simpleUnmute: boolean;
  sites: { [site: string]: AudioRules[] };
  supportedNode: Function;
  supportedPage: boolean;
  unmuteDelay: number;
  volume: number;
  watcherRuleIds: number[];
  wordlistId: number;
  youTube: boolean;
  youTubeAutoSubsMin: number;
  youTubeAutoSubsMax: number;
  youTubeAutoSubsTimeout: number;

  static readonly brTagRegExp = new RegExp('<br>', 'i');

  static combineSites(sites: { [site: string]: AudioRules[] } = {}): { [site: string]: AudioRules[] } {
    return Object.assign({}, WebAudioSites, sites);
  }

  constructor(filter: WebFilter | BookmarkletFilter) {
    this.cueRuleIds = [];
    this.watcherRuleIds = [];
    this.filter = filter;
    this.lastFilteredNode = null;
    this.lastFilteredText = '';
    this.lastProcessed = [];
    this.muted = false;
    if (
      !filter.cfg.customAudioSites
      || typeof filter.cfg.customAudioSites !== 'object'
    ) {
      filter.cfg.customAudioSites = {};
    }
    this.sites = WebAudio.combineSites(filter.cfg.customAudioSites);
    this.unmuteDelay = 0;
    this.volume = 1;
    this.wordlistId = filter.audioWordlistId;
    this.youTubeAutoSubsMin = filter.cfg.youTubeAutoSubsMin;
    this.youTubeAutoSubsMax = filter.cfg.youTubeAutoSubsMax * 1000;

    // Setup rules for current site
    this.rules = this.sites[filter.hostname];
    if (this.rules) {
      this.supportedPage = true;
      if (['tv.youtube.com', 'www.youtube.com'].includes(filter.hostname)) { this.youTube = true; }
      if (!Array.isArray(this.rules)) {
        this.rules = [this.rules];
      }

      this.supportedNode = this.buildSupportedNodeFunction();

      // Mode: watcher
      if (this.watcherRuleIds.length > 0) {
        this.watcherRuleIds.forEach(ruleId => {
          setInterval(this.watcher, this.rules[ruleId].checkInterval, this, ruleId);
        });
      }

      // Mode: cue (check for videos)
      if (this.cueRuleIds.length > 0) { setInterval(this.watchForVideo, 250, this); }
    }
  }

  buildSupportedNodeFunction(): Function {
    let block = '';

    this.rules.forEach((rule, index) => {
      // Skip this rule if it doesn't apply to the current page
      if (
        (rule.iframe === true && this.filter.iframe == null)
        || (rule.iframe === false && this.filter.iframe != null)
      ) {
        return;
      }

      // Setup rule defaults
      if (rule.mode === undefined) { rule.mode = 'element'; }
      if (rule.filterSubtitles === undefined) { rule.filterSubtitles = true; }
      if (rule.simpleUnmute) { this.simpleUnmute = true; }

      // Allow rules to override global settings
      if (rule.muteMethod === undefined) { rule.muteMethod = this.filter.cfg.muteMethod; }
      if (rule.showSubtitles === undefined) { rule.showSubtitles = this.filter.cfg.showSubtitles; }

      switch(rule.mode) {
        case 'cue':
          // NO-OP for supportedNode()
          this.cueRuleIds.push(index); // Save list of cue rule ids
          this.initCueRule(rule);
          break;
        case 'element':
          if (!rule.tagName) { throw('tagName is required.'); }
          block += `
          if (node.nodeName == '${rule.tagName.toUpperCase()}') {
            let failed = false;
            ${rule.className ? `if (!failed && (!node.className || !node.className.includes('${rule.className}'))) { failed = true; }` : ''}
            ${rule.dataPropPresent ? `if (!failed && (!node.dataset || !node.dataset.hasOwnProperty('${rule.dataPropPresent}'))) { failed = true; }` : ''}
            ${rule.hasChildrenElements ? 'if (!failed && (typeof node.childElementCount !== "number" || node.childElementCount < 1)) { failed = true; }' : ''}
            ${rule.subtitleSelector ? `if (!failed && (typeof node.querySelector !== 'function' || !node.querySelector('${rule.subtitleSelector}'))) { failed = true; }` : ''}
            ${rule.containsSelector ? `if (!failed && (typeof node.querySelector !== 'function' || !node.querySelector('${rule.containsSelector}'))) { failed = true; }` : ''}
            if (!failed) { return ${index}; }
          }`;
          break;
        case 'elementChild':
          this.initElementChildRule(rule);
          block += `
          if (node.nodeName === '${rule.tagName.toUpperCase()}') {
            let parent = document.querySelector('${rule.parentSelector}');
            if (parent && parent.contains(node)) { return ${index}; }
          }`;
          break;
        case 'text':
          block += `
            if (node.nodeName === '#text') {
              let parent = document.querySelector('${rule.parentSelector}');
              if (parent && parent.contains(node)) { return ${index}; }
            }`;
          break;
        case 'watcher':
          this.watcherRuleIds.push(index);
          this.initWatcherRule(rule);
          block += `
            if (node.parentElement && node.parentElement == document.querySelector('${rule.subtitleSelector}')) { return ${index}; }
            ${rule.parentSelector ? `let parent = document.querySelector('${rule.parentSelector}'); if (parent && parent.contains(node)) { return ${index}; }` : ''}
          `;
          break;
      }
    });

    return new Function('node', `${block} return false;`.replace(/^\s*\n/gm, ''));
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
        this.mute(rule.muteMethod); // Mute the audio if we haven't already
        if (rule.filterSubtitles) { subtitle[textMethod] = result.filtered; }
        this.lastFilteredNode = subtitle;
        this.lastFilteredText = subtitle[textMethod];
      }
    });

    // Subtitle display - 0: Show all, 1: Show only filtered, 2: Show only unfiltered, 3: Hide all
    switch (rule.showSubtitles) {
      case 1: if (filtered) { this.showSubtitles(rule); } else { this.hideSubtitles(subtitles, rule); } break;
      case 2: if (filtered) { this.hideSubtitles(subtitles, rule); } else { this.showSubtitles(rule); } break;
      case 3: this.hideSubtitles(subtitles, rule); break;
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
      this.unmuteDelay = null;
      this.filter.updateCounterBadge();

      // Set a timer to unmute if a max time was specified
      if (this.youTubeAutoSubsMax) {
        this.youTubeAutoSubsTimeout = window.setTimeout(this.youTubeAutoSubsMuteTimeout, this.youTubeAutoSubsMax, this);
      }
    } else {
      if (this.muted) {
        if (this.youTubeAutoSubsMin > 0) {
          let currentTime = document.getElementsByTagName('video')[0].currentTime;
          if (this.unmuteDelay == null) { // Start tracking unmuteDelay when next unfiltered word is found
            this.unmuteDelay = currentTime;
          } else {
            if (currentTime < this.unmuteDelay) { this.unmuteDelay = 0; } // Reset unmuteDelay if video reversed
            if (currentTime > (this.unmuteDelay + this.youTubeAutoSubsMin)) { // Unmute if its been long enough
              this.unmute();
            }
          }
        } else { // Unmute immediately if youTubeAutoSubsMin = 0
          this.unmute();
        }
      }
    }

    // Hide YouTube auto text unless show all subtitles is set
    if (this.filter.cfg.showSubtitles != 0) {
      let container = document.querySelector('div.ytp-caption-window-rollup span.captions-text') as HTMLElement;
      if (container.style.display == 'block') {
        container.style.display = 'none';
      }
    }
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

  hideSubtitles(subtitles, rule: AudioRules) {
    if (rule.displaySelector) {
      let container = document.querySelector(rule.displaySelector) as HTMLElement;
      if (container) { container.style.display = rule.displayHide; }
    } else {
      subtitles.forEach(subtitle => {
        subtitle.innerText = '';
        if (rule.removeSubtitleSpacing && subtitle.style) {
          if (subtitle.style.padding) { subtitle.style.padding = 0; }
          if (subtitle.style.margin) { subtitle.style.margin = 0; }
        }
      });
    }
  }

  initCueRule(rule) {
    if (rule.videoSelector === undefined) { rule.videoSelector = 'video'; }
    if (rule.videoCueRequireShowing === undefined) { rule.videoCueRequireShowing = this.filter.cfg.muteCueRequireShowing; }
  }

  initElementChildRule(rule) {
    if (rule.displaySelector !== undefined) {
      if (rule.displayHide === undefined) { rule.displayHide = 'none'; }
      if (rule.displayShow === undefined) { rule.displayShow = ''; }
    }
  }

  initWatcherRule(rule) {
    if (rule.checkInterval === undefined) { rule.checkInterval = 20; }
    if (rule.trackProcessed === undefined) { rule.trackProcessed = true; }
    if (rule.videoSelector === undefined) { rule.videoSelector = 'video'; }
  }

  mute(muteMethod: number = this.filter.cfg.muteMethod, video?: HTMLVideoElement): void {
    if (!this.muted) {
      this.muted = true;

      switch(muteMethod) {
        case 0: // Mute tab
          chrome.runtime.sendMessage({ mute: true });
          break;
        case 1: { // Mute video
          if (!video) { video = document.querySelector('video'); }
          if (video && video.volume != null) {
            this.volume = video.volume; // Save original volume
            video.volume = 0;
          }
          break;
        }
      }
    }
  }

  playing(video: HTMLMediaElement): boolean {
    return !!(video && video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);
  }

  processCues(cues: FilteredTextTrackCue[], rule: AudioRules) {
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
    }
  }

  replaceTextResult(string: string, stats: boolean = true) {
    return this.filter.replaceTextResult(string, this.wordlistId, stats);
  }

  showSubtitles(rule) {
    if (rule.displaySelector) {
      let container = document.querySelector(rule.displaySelector);
      if (container) { container.style.display = rule.displayShow; }
    }
  }

  unmute(muteMethod: number = this.filter.cfg.muteMethod, video?: HTMLVideoElement): void {
    if (this.muted) {
      this.muted = false;

      switch(muteMethod) {
        case 0: // Mute tab
          chrome.runtime.sendMessage({ mute: false });
          break;
        case 1: { // Mute video
          if (!video) { video = document.querySelector('video'); }
          if (video && video.volume != null) {
            video.volume = this.volume;
          }
          break;
        }
      }
    }
  }

  watcher(instance: WebAudio, ruleId = 0) {
    let rule = instance.rules[ruleId];
    let video = document.querySelector(rule.videoSelector) as HTMLVideoElement;

    if (video && instance.playing(video)) {
      let captions = document.querySelector(rule.subtitleSelector) as HTMLElement;

      if (captions && captions.textContent) {
        let filtered = false;
        let newCaptions = !rule.trackProcessed;

        if (captions.hasChildNodes()) {
          captions.childNodes.forEach((child, index) => {
            // innerText handles line feeds/spacing better, but is not available to #text nodes
            let textMethod = (child && child.nodeName)  === '#text' ? 'textContent' : 'innerText';

            // Skip captions/subtitles that have already been processed
            if (!newCaptions) {
              if (captions.childNodes.length === instance.lastProcessed.length) {
                if (instance.lastProcessed[index] === child[textMethod]) {
                  return false;
                } else {
                  newCaptions = true;
                  instance.lastProcessed.slice(0, index);
                }
              } else {
                newCaptions = true;
                instance.lastProcessed = [];
              }
            }

            // Filter the captions/subtitles
            if (child[textMethod]) {
              let result = instance.replaceTextResult(child[textMethod]);
              if (result.modified) {
                instance.mute(rule.muteMethod);
                filtered = true;
                if (rule.filterSubtitles) { child[textMethod] = result.filtered; }
                instance.lastFilteredNode = child;
                instance.lastFilteredText = child[textMethod];
              }
            }
            if (rule.trackProcessed) { instance.lastProcessed.push(child[textMethod]); }
          });
          if (!newCaptions) { return false; } // Skip captions/subtitles that have already been processed
        } else {
          // innerText handles line feeds/spacing better, but is not available to #text nodes
          let textMethod = (captions && captions.nodeName)  === '#text' ? 'textContent' : 'innerText';

          // Skip captions/subtitles that have already been processed
          if (!newCaptions && instance.lastProcessed.includes(captions[textMethod])) { return false; }

          if (captions[textMethod] && (instance.lastFilteredText && !captions[textMethod].contains(instance.lastFilteredText))) {
            let result = instance.replaceTextResult(captions[textMethod]);
            if (result.modified) {
              instance.mute(rule.muteMethod);
              filtered = true;
              if (rule.filterSubtitles) { captions[textMethod] = result.filtered; }
              instance.lastFilteredNode = captions;
              instance.lastFilteredText = captions[textMethod];
            }
          }
          if (rule.trackProcessed) { instance.lastProcessed = [captions[textMethod]]; }
        }

        // Unmute if nothing was filtered and the text doesn't match the last filtered
        let textMethod = (captions && captions.nodeName)  === '#text' ? 'textContent' : 'innerText';
        if (!filtered && !captions[textMethod].includes(instance.lastFilteredText)) { instance.unmute(rule.muteMethod); }

        if (captions.nodeName !== '#text') {
          switch (rule.showSubtitles) {
            case 1: captions.style.display = filtered ? '' : 'none'; break;
            case 2: captions.style.display = filtered ? 'none' : ''; break;
            case 3: captions.style.display = 'none'; break;
          }
        }

        if (filtered) { instance.filter.updateCounterBadge(); } // Update if modified
      }
    }
  }

  watchForVideo(instance: WebAudio) {
    instance.cueRuleIds.forEach(cueRuleId => {
      let rule = instance.rules[cueRuleId] as AudioRules;
      let video = document.querySelector(rule.videoSelector) as HTMLVideoElement;
      if (video && video.textTracks && instance.playing(video)) {
        let textTrack = instance.getVideoTextTrack(video, rule.videoCueLanguage, rule.videoCueRequireShowing);

        if (textTrack && !textTrack.oncuechange) {
          if (!rule.videoCueHideCues && rule.showSubtitles == 3) { textTrack.mode = 'hidden'; }

          textTrack.oncuechange = () => {
            if (textTrack.activeCues && textTrack.activeCues.length > 0) {
              let filtered = false;

              for (let i = 0; i < textTrack.activeCues.length; i++) {
                let activeCue = textTrack.activeCues[i] as FilteredTextTrackCue;
                if (!activeCue.hasOwnProperty('filtered')) {
                  let cues = textTrack.cues as any as FilteredTextTrackCue[];
                  instance.processCues(cues, rule);
                }
                if (activeCue.filtered) {
                  filtered = true;
                  instance.mute(rule.muteMethod, video);
                }
              }

              if (!filtered) { instance.unmute(rule.muteMethod, video); }

              if (rule.videoCueHideCues) {
                // Some sites don't care if textTrack.mode = 'hidden' and will continue showing.
                // This is a fallback (not preferred) method that can be used for hiding the cues.
                if (
                  (rule.showSubtitles === 1 && !filtered)
                  || (rule.showSubtitles === 2 && filtered)
                  || rule.showSubtitles === 3
                ) {
                  for (let i = 0; i < textTrack.activeCues.length; i++) {
                    let activeCue = textTrack.activeCues[i] as FilteredTextTrackCue;
                    activeCue.text = '';
                    activeCue.position = 100;
                    activeCue.size = 0;
                  }
                }
              } else {
                if (filtered) {
                  switch (rule.showSubtitles) {
                    case 1: textTrack.mode = 'showing'; break;
                    case 2: textTrack.mode = 'hidden'; break;
                  }
                } else {
                  switch (rule.showSubtitles) {
                    case 1: textTrack.mode = 'hidden'; break;
                    case 2: textTrack.mode = 'showing'; break;
                  }
                }
              }
            } else { // No active cues
              instance.unmute(rule.muteMethod, video);
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
    let video = window.document.querySelector('video');
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