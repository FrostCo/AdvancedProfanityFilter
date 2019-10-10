import WebFilter from './webFilter';
import BookmarkletFilter from './bookmarkletFilter';

export default class WebAudio {
  filter: WebFilter | BookmarkletFilter;
  lastFilteredNode: HTMLElement;
  muted: boolean;
  muteMethod: number;
  showSubtitles: number;
  site: AudioSite;
  sites: { [site: string]: AudioSite };
  subtitleSelector: string;
  supportedNode: Function;
  supportedPage: boolean;
  unmuteDelay: number;
  volume: number;
  youTube: boolean;
  youTubeAutoSubsMin: number;

  constructor(filter: WebFilter | BookmarkletFilter) {
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
      Object.keys(filter.cfg.customAudioSites).forEach(x => { this.sites[x]._custom = true; });
    } else {
      this.sites = WebAudio.sites;
    }
    this.unmuteDelay = 0;
    this.volume = 1;
    this.youTubeAutoSubsMin = filter.cfg.youTubeAutoSubsMin;

    // Additional setup
    this.site = this.sites[filter.hostname];
    this.supportedPage = (this.site != null);
    if (this.site) {
      if (filter.hostname == 'www.youtube.com') { this.youTube = true; }
      if (this.site.videoCueMode) {
        this.site = Object.assign(WebAudio._videoModeDefaults, this.site);
        setInterval(this.watchForVideo, this.site.videoInterval, this);
      }
      this.subtitleSelector = this.site.subtitleSelector;
      this.supportedNode = this.buildSupportedNodeFunction();
    }
  }

  static readonly _videoModeDefaults = {
    videoInterval: 200,
    videoSelector: 'video'
  };

  static readonly sites: { [site: string]: AudioSite } = {
    'abc.go.com': { className: 'akamai-caption-text', tagName: 'DIV' },
    'app.plex.tv': { dataPropPresent: 'dialogueId', subtitleSelector: 'span > span', tagName: 'DIV' },
    'www.amazon.com': { subtitleSelector: 'span.timedTextBackground', tagName: 'P' },
    'www.dishanywhere.com': { className: 'bmpui-ui-subtitle-label', tagName: 'SPAN' },
    'www.fox.com': { className: 'jw-text-track-container', subtitleSelector: 'div.jw-text-track-cue', tagName: 'DIV' },
    'www.hulu.com': { className: 'caption-text-box', subtitleSelector: 'p', tagName: 'DIV' },
    'www.nbc.com': { className: 'ttr-line', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' },
    'www.netflix.com': { className: 'player-timedtext-text-container', subtitleSelector: 'span', tagName: 'DIV' },
    'www.sonycrackle.com': { textParentSelector: 'div.clpp-subtitles-container' },
    'www.syfy.com': { className: 'ttr-line', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' },
    'www.tntdrama.com': { videoCueMode: true, videoCueLanguage: 'en', videoSelector: 'video.top-media-element' },
    'www.universalkids.com': { subtitleSelector: 'div.gwt-HTML', tagName: 'DIV' },
    'www.usanetwork.com': { className: 'ttr-line', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' },
    'www.vudu.com': { subtitleSelector: 'span.subtitles', tagName: 'DIV' },
    'www.youtube.com': { className: 'caption-window', subtitleSelector: 'span.ytp-caption-segment', tagName: 'DIV' }
  };

  buildSupportedNodeFunction(): Function {
    let site = this.site;

    // Plain text mode
    if (site.textParentSelector) {
      return new Function('node',`
      if (node.nodeName === '#text') {
        let textParent = document.querySelector('${site.textParentSelector}');
        if (textParent && textParent.contains(node)) { return true; }
      }
      return false;`);
    }

    // Video cue mode
    if (site.videoCueMode) {
      return new Function('node', 'return false;');
    }

    // Element mode (Default)
    if (!site.tagName) { throw('tagName is required.'); }

    return new Function('node',`
    if (node.nodeName == '${site.tagName.toUpperCase()}') {
      ${site.className ? `if (!node.className || !node.className.includes('${site.className}')) { return false; }` : ''}
      ${site.dataPropPresent ? `if (!node.dataset || !node.dataset.hasOwnProperty('${site.dataPropPresent}')) { return false; }` : ''}
      ${site.hasChildrenElements ? 'if (typeof node.childElementCount !== "number" || node.childElementCount < 1) { return false; }' : ''}
      ${site.subtitleSelector ? `if (typeof node.querySelector !== 'function' || !node.querySelector('${site.subtitleSelector}')) { return false; }` : ''}
      ${site.containsSelector ? `if (typeof node.querySelector !== 'function' || !node.querySelector('${site.containsSelector}')) { return false; }` : ''}
      return true;
    } else {
      return false;
    }`.replace(/^\s*\n/gm, ''));
  }

  clean(subtitleContainer): void {
    let filtered = false;
    let subtitles = this.subtitleSelector ? subtitleContainer.querySelectorAll(this.subtitleSelector) : [subtitleContainer];

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
      case 1: if (!filtered) { subtitleContainer.textContent = ''; } break;
      case 2: if (filtered) { subtitleContainer.textContent = ''; } break;
      case 3: subtitleContainer.textContent = ''; break;
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

  getVideoTextTrack(video: HTMLVideoElement) {
    if (video.textTracks && video.textTracks.length > 0) {
      if (this.site.videoCueLanguage) {
        for (let i = 0; i < video.textTracks.length; i++) {
          if (video.textTracks[i].language == this.site.videoCueLanguage) {
            return video.textTracks[i];
          }
        }
      }

      return video.textTracks[0];
    }
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

  processCues(cues: FilteredTextTrackCue[]) {
    for (let i = 0; i < cues.length; i++) {
      let cue = cues[i];
      if (cue.hasOwnProperty('filtered')) { continue; }

      if (this.site.videoCueSync) {
        cue.startTime += this.site.videoCueSync;
        cue.endTime += this.site.videoCueSync;
      }

      cue.index = i;
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
    let video = document.querySelector(instance.site.videoSelector) as HTMLVideoElement;
    if (video && video.textTracks && instance.playing(video)) {
      let textTrack = instance.getVideoTextTrack(video);

      if (textTrack && !textTrack.oncuechange) {
        if (instance.showSubtitles == 3) { textTrack.mode = 'hidden'; }

        textTrack.oncuechange = () => {
          if (textTrack.activeCues.length > 0) {
            let filtered = false;

            for (let i = 0; i < textTrack.activeCues.length; i++) {
              let activeCue = textTrack.activeCues[i] as FilteredTextTrackCue;
              if (!activeCue.hasOwnProperty('filtered')) {
                let cues = textTrack.cues as any as FilteredTextTrackCue[];
                instance.processCues(cues);
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