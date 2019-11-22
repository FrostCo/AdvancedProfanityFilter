import WebFilter from './webFilter';
import BookmarkletFilter from './bookmarkletFilter';

export default class WebAudio {
  cueRuleIds: number[];
  filter: WebFilter | BookmarkletFilter;
  lastFilteredNode: HTMLElement;
  muted: boolean;
  muteMethod: number;
  rules: AudioRules[];
  showSubtitles: number;
  sites: { [site: string]: AudioRules[] };
  supportedNode: Function;
  supportedPage: boolean;
  unmuteDelay: number;
  volume: number;
  youTube: boolean;
  youTubeAutoSubsMin: number;

  constructor(filter: WebFilter | BookmarkletFilter) {
    this.cueRuleIds = [];
    this.filter = filter;
    this.lastFilteredNode = null;
    this.muted = false;
    this.muteMethod = filter.cfg.muteMethod;
    this.showSubtitles = filter.cfg.showSubtitles;
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

      // Video TextTrack Cue
      if (this.cueRuleIds.length > 0) {
        this.cueRuleIds.forEach(cueRuleId => { // set defaults for cue rules
          this.rules[cueRuleId] = Object.assign(WebAudio._videoModeDefaults, this.rules[cueRuleId]);
        });

        // First rule's videoInterval will override subsequent rules
        setInterval(this.watchForVideo, this.rules[this.cueRuleIds[0]].videoInterval, this);
      }
    }
  }

  static readonly _videoModeDefaults = {
    videoInterval: 200,
    videoSelector: 'video'
  };

  static readonly sites: { [site: string]: AudioRules[] } = {
    'abc.com': [ { mode: 'element', className: 'akamai-caption-text', tagName: 'DIV' } ],
    'www.amazon.com': [ { mode: 'element', removeSubtitleSpacing: true, subtitleSelector: 'span.timedTextBackground', tagName: 'P' } ],
    'www.amc.com': [
      { mode: 'element', className: 'ttr-container', tagName: 'DIV', subtitleSelector: 'span.ttr-cue' },
      { mode: 'cue', videoCueLanguage: 'en', videoSelector: 'video' }
    ],
    'www.dishanywhere.com': [
      { mode: 'element', className: 'bmpui-ui-subtitle-label', tagName: 'SPAN' },
      { mode: 'element', className: 'bmpui-subtitle-region-container', subtitleSelector: 'div.bmpui-container-wrapper > span.bmpui-ui-subtitle-label', tagName: 'div' }
    ],
    'www.fox.com': [ { mode: 'element', className: 'jw-text-track-container', subtitleSelector: 'div.jw-text-track-cue', tagName: 'DIV' } ],
    'www.hulu.com': [ { mode: 'element', className: 'caption-text-box', subtitleSelector: 'p', tagName: 'DIV' } ],
    'www.nbc.com': [ { mode: 'element', className: 'ttr-line', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' } ],
    'www.netflix.com': [ { mode: 'element', className: 'player-timedtext-text-container', subtitleSelector: 'span', tagName: 'DIV' } ],
    'app.plex.tv': [ { mode: 'element', dataPropPresent: 'dialogueId', subtitleSelector: 'span > span', tagName: 'DIV' } ],
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
      if (!rule.mode) {
        rule.mode = 'element';
      }

      if (rule.textParentSelector) {
        rule.mode = 'text';
      }

      switch(rule.mode) {
        case 'cue':
          // NO-OP for supportedNode()
          this.cueRuleIds.push(index); // Save list of cue rule ids
          break;
        case 'text':
          block += `
            if (node.nodeName === '#text') {
              let textParent = document.querySelector('${rule.textParentSelector}');
              if (textParent && textParent.contains(node)) { return ${index}; }
            }`;
          break;
        case 'element':
        default:
          if (!rule.tagName) { throw('tagName is required.'); }
          block += `
          if (node.nodeName == '${rule.tagName.toUpperCase()}') {
            let failed = false;
            ${rule.className ? `if (!node.className || !node.className.includes('${rule.className}')) { failed = true; }` : ''}
            ${rule.dataPropPresent ? `if (!failed && !node.dataset || !node.dataset.hasOwnProperty('${rule.dataPropPresent}')) { failed = true; }` : ''}
            ${rule.hasChildrenElements ? 'if (!failed && typeof node.childElementCount !== "number" || node.childElementCount < 1) { failed = true; }' : ''}
            ${rule.subtitleSelector ? `if (!failed && typeof node.querySelector !== 'function' || !node.querySelector('${rule.subtitleSelector}')) { failed = true; }` : ''}
            ${rule.containsSelector ? `if (!failed && typeof node.querySelector !== 'function' || !node.querySelector('${rule.containsSelector}')) { failed = true; }` : ''}
            if (!failed) {
              return ${index};
            }
          }`;
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
        subtitle[textMethod] = result.filtered;
        this.mute(); // Mute the audio if we haven't already
        if (subtitle.nodeName === '#text') { this.lastFilteredNode = subtitle; }
      }
    });

    // Subtitle display - 0: Show all, 1: Show only filtered, 2: Show only unfiltered, 3: Hide all
    switch (this.showSubtitles) {
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

  getVideoTextTrack(video: HTMLVideoElement, language: string) {
    if (video.textTracks && video.textTracks.length > 0) {
      if (language) {
        for (let i = 0; i < video.textTracks.length; i++) {
          if (video.textTracks[i].language == language) {
            return video.textTracks[i];
          }
        }
      }

      return video.textTracks[0];
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


  mute(video?: HTMLVideoElement): void {
    if (!this.muted) {
      this.muted = true;

      switch(this.muteMethod) {
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

  unmute(video?: HTMLVideoElement): void {
    if (this.muted) {
      this.muted = false;

      switch(this.muteMethod) {
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

  watchForVideo(instance: WebAudio) {
    instance.cueRuleIds.forEach(cueRuleId => {
      let rule = instance.rules[cueRuleId] as AudioRules;
      let video = document.querySelector(rule.videoSelector) as HTMLVideoElement;
      if (video && video.textTracks && instance.playing(video)) {
        let textTrack = instance.getVideoTextTrack(video, rule.videoCueLanguage);

        if (textTrack && !textTrack.oncuechange) {
          if (instance.showSubtitles == 3) { textTrack.mode = 'hidden'; }

          textTrack.oncuechange = () => {
            if (textTrack.activeCues && textTrack.activeCues.length > 0) {
              let filtered = false;

              for (let i = 0; i < textTrack.activeCues.length; i++) {
                let activeCue = textTrack.activeCues[i] as FilteredTextTrackCue;
                if (!activeCue.hasOwnProperty('filtered')) {
                  let cues = textTrack.cues as any as FilteredTextTrackCue[];
                  instance.processCues(cues, rule);
                }
                if (activeCue.filtered) { filtered = true; }
              }

              if (filtered) {
                instance.mute(video);
                switch (instance.showSubtitles) {
                  case 1: textTrack.mode = 'showing'; break;
                  case 2: textTrack.mode = 'hidden'; break;
                }
              } else {
                instance.unmute(video);
                switch (instance.showSubtitles) {
                  case 1: textTrack.mode = 'hidden'; break;
                  case 2: textTrack.mode = 'showing'; break;
                }
              }
            } else { // No active cues
              instance.unmute(video);
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