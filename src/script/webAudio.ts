import WebFilter from './webFilter';
import BookmarkletFilter from './bookmarkletFilter';

export default class WebAudio {
  cueRuleIds: number[];
  filter: WebFilter | BookmarkletFilter;
  lastFilteredNode: HTMLElement;
  muted: boolean;
  rules: AudioRules[];
  sites: { [site: string]: AudioRules[] };
  supportedNode: Function;
  supportedPage: boolean;
  unmuteDelay: number;
  volume: number;
  watcherRuleIds: number[];
  youTube: boolean;
  youTubeAutoSubsMin: number;

  constructor(filter: WebFilter | BookmarkletFilter) {
    this.cueRuleIds = [];
    this.watcherRuleIds = [];
    this.filter = filter;
    this.lastFilteredNode = null;
    this.muted = false;
    if (
      filter.cfg.customAudioSites
      && typeof filter.cfg.customAudioSites == 'object'
      && Object.keys(filter.cfg.customAudioSites).length > 0
    ) {
      this.sites = Object.assign(WebAudio.sites, filter.cfg.customAudioSites);
    } else {
      this.sites = WebAudio.sites;
    }
    this.unmuteDelay = 0;
    this.volume = 1;
    this.youTubeAutoSubsMin = filter.cfg.youTubeAutoSubsMin;

    // Setup rules for current site
    this.rules = this.sites[filter.hostname];
    if (this.rules) {
      this.supportedPage = true;
      if (filter.hostname == 'www.youtube.com') { this.youTube = true; }
      if (!Array.isArray(this.rules)) {
        this.rules = [ this.rules ];
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

  static readonly sites: { [site: string]: AudioRules[] } = {
    'abc.com': [ { mode: 'element', className: 'akamai-caption-text', tagName: 'DIV' } ],
    'www.amazon.com': [ { mode: 'element', removeSubtitleSpacing: true, subtitleSelector: 'span.timedTextBackground', tagName: 'P' } ],
    'www.amc.com': [
      { mode: 'element', className: 'ttr-container', tagName: 'DIV', subtitleSelector: 'span.ttr-cue' },
      { mode: 'cue', videoCueLanguage: 'en', videoSelector: 'video' }
    ],
    'www.att.tv': [ { mode: 'cue', videoSelector: 'video#quickplayPlayer' } ],
    'www.cbs.com': [ { mode: 'cue', videoCueLanguage: 'en' } ],
    'www.dishanywhere.com': [
      { mode: 'element', className: 'bmpui-ui-subtitle-label', tagName: 'SPAN' },
      { mode: 'element', className: 'bmpui-subtitle-region-container', subtitleSelector: 'div.bmpui-container-wrapper > span.bmpui-ui-subtitle-label', tagName: 'div' }
    ],
    'www.disneyplus.com': [ { mode: 'cue', videoSelector: 'video.btm-media-client-element' } ],
    'www.fox.com': [ { mode: 'element', className: 'jw-text-track-container', subtitleSelector: 'div.jw-text-track-cue', tagName: 'DIV' } ],
    'www.hulu.com': [ { mode: 'element', className: 'caption-text-box', subtitleSelector: 'p', tagName: 'DIV' } ],
    'www.nbc.com': [
      { mode: 'element', className: 'ttr-line', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' },
      { mode: 'cue', videoCueLanguage: 'en' }
    ],
    'www.netflix.com': [ { mode: 'element', className: 'player-timedtext-text-container', subtitleSelector: 'span', tagName: 'DIV' } ],
    'www.philo.com': [ { mode: 'cue' } ],
    'app.plex.tv': [
      { mode: 'element', dataPropPresent: 'dialogueId', subtitleSelector: 'span > span', tagName: 'DIV' },
      { containsSelector: 'div[data-dialogue-id]', mode: 'element', subtitleSelector: 'span > span', tagName: 'DIV' }
    ],
    'www.sonycrackle.com': [ { mode: 'text', textParentSelector: 'div.clpp-subtitles-container' } ],
    'www.syfy.com': [ { mode: 'element', className: 'ttr-line', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' } ],
    'www.tntdrama.com': [ { mode: 'cue', videoCueLanguage: 'en', videoSelector: 'video.top-media-element' } ],
    'www.universalkids.com': [ { mode: 'element', subtitleSelector: 'div.gwt-HTML', tagName: 'DIV' } ],
    'www.usanetwork.com': [ { mode: 'element', className: 'ttr-line', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' } ],
    'www.vudu.com': [ { mode: 'element', subtitleSelector: 'span.subtitles', tagName: 'DIV' } ],
    'www.youtube.com': [ { mode: 'element', className: 'caption-window', subtitleSelector: 'span.ytp-caption-segment', tagName: 'DIV' } ]
  };

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
      if (rule.textParentSelector) { rule.mode = 'text'; }
      if (rule.filterSubtitles === undefined) { rule.filterSubtitles = true; }

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
            if (!failed) {
              return ${index};
            }
          }`;
          break;
        case 'text':
          block += `
            if (node.nodeName === '#text') {
              let textParent = document.querySelector('${rule.textParentSelector}');
              if (textParent && textParent.contains(node)) { return ${index}; }
            }`;
          break;
        case 'watcher':
          // NO-OP for supportedNode()
          if (rule.checkInterval === undefined) { rule.checkInterval = 20; }
          this.watcherRuleIds.push(index);
          break;
      }
    });

    return new Function('node', `${block} return false;`.replace(/^\s*\n/gm, ''));
  }

  clean(subtitleContainer, ruleIndex = 0): void {
    let rule = this.rules[ruleIndex];
    let filtered = false;
    let subtitles = rule.subtitleSelector ? subtitleContainer.querySelectorAll(rule.subtitleSelector) : [subtitleContainer];

    // Process subtitles
    subtitles.forEach(subtitle => {
      // innerText handles line feeds/spacing better, but is not available to #text nodes
      let textMethod = subtitle.nodeName === '#text' ? 'textContent' : 'innerText';
      let result = this.filter.replaceTextResult(subtitle[textMethod]);
      if (result.modified) {
        filtered = true;
        if (rule.filterSubtitles) { subtitle[textMethod] = result.filtered; }
        this.mute(rule.muteMethod); // Mute the audio if we haven't already
        if (subtitle.nodeName === '#text') { this.lastFilteredNode = subtitle; }
      }
    });

    // Subtitle display - 0: Show all, 1: Show only filtered, 2: Show only unfiltered, 3: Hide all
    switch (rule.showSubtitles) {
      case 1: if (!filtered) { this.hideElementSubtitles(subtitles, rule); } break;
      case 2: if (filtered) { this.hideElementSubtitles(subtitles, rule); } break;
      case 3: this.hideElementSubtitles(subtitles, rule); break;
    }

    if (filtered) { this.filter.updateCounterBadge(); } // Update if modified
  }

  cleanYouTubeAutoSubs(node): void {
    let result = this.filter.replaceTextResult(node.textContent);
    if (result.modified) {
      node.textContent = result.filtered;
      this.mute();
      this.unmuteDelay = null;
      this.filter.updateCounterBadge();
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

  hideElementSubtitles(subtitles, rule) {
    subtitles.forEach(subtitle => {
      subtitle.innerText = '';
      if (rule.removeSubtitleSpacing && subtitle.style) {
        if (subtitle.style.padding) { subtitle.style.padding = 0; }
        if (subtitle.style.margin) { subtitle.style.margin = 0; }
      }
    });
  }

  initCueRule(rule) {
    if (rule.videoSelector === undefined) { rule.videoSelector = 'video'; }
    if (rule.videoCueRequireShowing === undefined) { rule.videoCueRequireShowing = this.filter.cfg.muteCueRequireShowing; }
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
    return !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);
  }

  processCues(cues: FilteredTextTrackCue[], rule: AudioRules) {
    for (let i = 0; i < cues.length; i++) {
      let cue = cues[i];
      if (cue.hasOwnProperty('filtered')) { continue; }

      if (rule.videoCueSync) {
        cue.startTime += rule.videoCueSync;
        cue.endTime += rule.videoCueSync;
      }

      let result = this.filter.replaceTextResult(cue.text);
      if (result.modified) {
        cue.filtered = true;
        cue.originalText = cue.text;
        cue.text = result.filtered;
      } else {
        cue.filtered = false;
      }
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
    let captions = document.querySelector(rule.subtitleSelector) as HTMLElement;

    if (captions && captions.textContent) {
      let combinedText = captions.textContent.trim();
      // Checking minimum length due to live-style captions ('#')
      if (combinedText && combinedText.length > 2) {
        let result = instance.filter.replaceTextResult(combinedText);
        if (result.modified) {
          instance.mute(rule.muteMethod);
        } else {
          instance.unmute(rule.muteMethod);
        }

        switch (rule.showSubtitles) {
          case 1: captions.style.display = result.modified ? '' : 'none'; break;
          case 2: captions.style.display = result.modified ? 'none' : ''; break;
          case 3: captions.style.display = 'none'; break;
        }
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