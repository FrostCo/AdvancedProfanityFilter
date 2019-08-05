export default class WebAudio {
  muted: boolean;
  muteMethod: number;
  showSubtitles: number;
  sites: { [site: string]: AudioSite };
  subtitleSelector: string;
  supportedNode: Function;
  supportedPage: boolean;
  unmuteDelay: number;
  volume: number;
  youTube: boolean;
  youTubeAutoSubsMin: number;

  constructor(params: WebAudioConstructorArgs) {
    this.muted = false;
    this.muteMethod = params.muteMethod;
    this.showSubtitles = params.showSubtitles;
    this.sites = Object.assign(WebAudio.sites, params.sites);
    this.unmuteDelay = 0;
    this.volume = 1;
    this.youTubeAutoSubsMin = params.youTubeAutoSubsMin;

    // Additional setup
    this.supportedPage = Object.keys(this.sites).includes(params.hostname);
    if (this.supportedPage) {
      if (params.hostname == 'www.youtube.com') { this.youTube = true; }
      this.subtitleSelector = this.sites[params.hostname].subtitleSelector;
      this.supportedNode = WebAudio.buildSupportedNodeFunction(params.hostname);
    }
  }

  static readonly sites: { [site: string]: AudioSite } = {
    'app.plex.tv': {
      dataPropPresent: 'dialogueId',
      subtitleSelector: 'span > span',
      tagName: 'DIV'
    },
    'www.amazon.com': {
      subtitleSelector: 'span.timedTextBackground',
      tagName: 'P'
    },
    'www.hulu.com': {
      className: 'caption-text-box',
      hasChildrenElements: true,
      subtitleSelector: 'p',
      tagName: 'DIV'
    },
    'www.netflix.com': {
      className: 'player-timedtext-text-container',
      hasChildrenElements: true,
      subtitleSelector: 'span',
      tagName: 'DIV'
    },
    'www.vudu.com': {
      subtitleSelector: 'span.subtitles',
      tagName: 'DIV'
    },
    'www.youtube.com': {
      className: 'caption-window',
      subtitleSelector: 'span.ytp-caption-segment',
      tagName: 'DIV'
    }
  }

  static buildSupportedNodeFunction(hostname): Function {
    let { className, dataPropPresent, tagName, hasChildrenElements, querySelectorAllPresent, subtitleSelector } = this.sites[hostname];
    if (!tagName) { throw('tagName is required.'); }

    return new Function('node',`
    if (node.tagName == '${tagName.toUpperCase()}') {
      ${className ? `if (!node.className.includes('${className}')) { return false; }` : ''}
      ${dataPropPresent ? `if (!node.dataset || !node.dataset.hasOwnProperty('${dataPropPresent}')) { return false; }` : ''}
      ${hasChildrenElements ? `if (node.childElementCount('${querySelectorAllPresent}').length == 0) { return false; }` : ''}
      ${subtitleSelector ? `if (node.querySelectorAll('${subtitleSelector}').length == 0) { return false; }` : ''}
      ${querySelectorAllPresent ? `if (node.querySelectorAll('${querySelectorAllPresent}').length == 0) { return false; }` : ''}
      return true;
    } else {
      return false;
    }`.replace(/^\s*\n/gm, ''));
  }

  clean(filter, subtitleContainer): void {
    let filtered = false;
    let subtitles = subtitleContainer.querySelectorAll(this.subtitleSelector);

    // Process subtitles
    subtitles.forEach(subtitle => {
      let result = filter.replaceTextResult(subtitle.innerText);
      if (result.modified) {
        filtered = true;
        subtitle.innerText = result.filtered;
        this.mute(); // Mute the audio if we haven't already
      }
    });

    // Subtitle display - 0: Show all, 1: Show only filtered, 2: Show only unfiltered, 3: Hide all
    switch (this.showSubtitles) {
      case 1: if (!filtered) { subtitles.forEach(subtitle => { subtitle.innerText = ''; }); } break;
      case 2: if (filtered) { subtitles.forEach(subtitle => { subtitle.innerText = ''; }); } break;
      case 3: subtitles.forEach(subtitle => { subtitle.innerText = ''; }); break;
    }

    if (filtered) { filter.updateCounterBadge(); } // Update if modified
  }

  cleanYouTubeAutoSubs(filter, node): void {
    let result = filter.replaceTextResult(node.textContent);
    if (result.modified) {
      node.textContent = result.filtered;
      this.mute();
      this.unmuteDelay = null;
      filter.updateCounterBadge();
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

  mute(): void {
    if (!this.muted) {
      this.muted = true;

      switch(this.muteMethod) {
        case 0: // Mute tab
          chrome.runtime.sendMessage({ mute: true });
          break;
        case 1: { // Mute video
          let video = document.getElementsByTagName('video')[0];
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

  unmute(): void {
    this.muted = false;

    switch(this.muteMethod) {
      case 0: // Mute tab
        chrome.runtime.sendMessage({ mute: false });
        break;
      case 1: { // Mute video
        let video = document.getElementsByTagName('video')[0];
        if (video && video.volume != null) {
          video.volume = this.volume;
        }
        break;
      }
    }
  }

  youTubeAutoSubsCurrentRow(node): boolean {
    return !!(node.parentElement.parentElement == node.parentElement.parentElement.parentElement.lastChild);
  }

  youTubeAutoSubsNodeIsSubtitleText(node): boolean {
    let captionWindow = document.querySelectorAll('div.caption-window')[0]; // YouTube Auto-gen subs
    return !!(captionWindow && captionWindow.contains(node));
  }

  youTubeAutoSubsPresent(): boolean {
    return !!(document.querySelectorAll('div.ytp-caption-window-rollup')[0]);
  }

  youTubeAutoSubsSupportedNode(node: any): boolean {
    if (node.nodeName == '#text' && node.textContent != '') {
      return !!(this.youTubeAutoSubsNodeIsSubtitleText(node));
    }
    return false;
  }
}