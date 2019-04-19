export default class WebAudio {
  static readonly subtitleSelectors = {
    'app.plex.tv': 'span > span',
    'www.amazon.com': 'span.timedTextBackground',
    'www.netflix.com': 'span',
    'www.vudu.com': 'span.subtitles',
    'www.youtube.com': 'span.ytp-caption-segment'
  }

  static clean(filter, subtitleContainer, subSelector): void {
    let filtered = false;
    let subtitles = subtitleContainer.querySelectorAll(subSelector);

    // Process subtitles
    subtitles.forEach(subtitle => {
      let result = filter.replaceTextResult(subtitle.innerText);
      if (result.modified) {
        filtered = true;
        subtitle.innerText = result.filtered;
        WebAudio.mute(filter); // Mute the audio if we haven't already
      }
    });

    // Subtitle display - 0: Show all, 1: Show only filtered, 2: Show only unfiltered, 3: Hide all
    switch (filter.cfg.showSubtitles) {
      case 1: if (!filtered) { subtitles.forEach(subtitle => { subtitle.innerText = ''; }); } break;
      case 2: if (filtered) { subtitles.forEach(subtitle => { subtitle.innerText = ''; }); } break;
      case 3: subtitles.forEach(subtitle => { subtitle.innerText = ''; }); break;
    }

    if (filtered) { filter.updateCounterBadge(); } // Update if modified
  }

  static cleanYouTubeAutoSubs(filter, node): void {
    let result = filter.replaceTextResult(node.textContent);
    let currentTime = document.getElementsByTagName('video')[0].currentTime;
    if (result.modified) {
      node.textContent = result.filtered;
      WebAudio.mute(filter);
      filter.mutedAt = currentTime;
      filter.updateCounterBadge();
    } else {
      if (filter.muted) {
        if (currentTime < filter.mutedAt) { filter.mutedAt = 0; } // Reset mutedAt if video reversed
        if (currentTime > (filter.mutedAt + filter.cfg.youTubeAutoSubsMin)) {
          WebAudio.unmute(filter);
        }
      }
    }
  }

  static mute(filter): void {
    if (!filter.muted) {
      filter.muted = true;

      switch(filter.cfg.muteMethod) {
        case 0: // Mute tab
          chrome.runtime.sendMessage({ mute: true });
          break;
        case 1: { // Mute video
          let video = document.getElementsByTagName('video')[0];
          if (video && video.volume != null) {
            filter.volume = video.volume; // Save original volume
            video.volume = 0;
          }
          break;
        }
      }
    }
  }

  static playing(video: HTMLMediaElement): boolean {
    return !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);
  }

  static subtitleSelector(hostname: string): string {
    return WebAudio.subtitleSelectors[hostname];
  }

  static supportedNode(hostname: string, node: any): boolean {
    switch(hostname) {
      case 'app.plex.tv':
        return !!(node.tagName == 'DIV' && (node.dataset && node.dataset.hasOwnProperty('dialogueId')) || (typeof node.querySelectorAll === 'function' && node.querySelectorAll('div[data-dialogue-id]').length > 0));
      case 'www.amazon.com':
        return !!(node.tagName == 'P' && node.querySelectorAll('span.timedTextWindow > span.timedTextBackground').length > 0);
      case 'www.netflix.com':
        return !!(node.tagName == 'DIV' && node.className.includes('player-timedtext-text-container') && node.querySelectorAll('span').length > 0);
      case 'www.vudu.com':
        return !!(node.tagName == 'DIV' && node.querySelectorAll('span.subtitles').length > 0);
      case 'www.youtube.com':
        return !!(node.tagName == 'DIV' && node.className.includes('caption-window') && node.querySelectorAll('span.captions-text span.ytp-caption-segment').length > 0);
    }
    return false;
  }

  static supportedPages(): string[] {
    return Object.keys(WebAudio.subtitleSelectors);
  }

  static unmute(filter): void {
    filter.muted = false;

    switch(filter.cfg.muteMethod) {
      case 0: // Mute tab
        chrome.runtime.sendMessage({ mute: false });
        break;
      case 1: { // Mute video
        let video = document.getElementsByTagName('video')[0];
        if (video && video.volume != null) {
          video.volume = filter.volume;
        }
        break;
      }
    }
  }

  static youTubeAutoSubsCurrentRow(node): boolean {
    return !!(node.parentElement.parentElement == node.parentElement.parentElement.parentElement.lastChild);
  }

  static youTubeAutoSubsNodeIsSubtitleText(node): boolean {
    let captionWindow = document.querySelectorAll('div.caption-window')[0]; // YouTube Auto-gen subs
    return !!(captionWindow && captionWindow.contains(node));
  }

  static youTubeAutoSubsPresent(filter): boolean {
    return !!(filter.hostname == 'www.youtube.com' && document.querySelectorAll('div.ytp-caption-window-rollup')[0]);
  }

  static youTubeAutoSubsSupportedNode(hostname: string, node: any): boolean {
    if (hostname == 'www.youtube.com' && node.nodeName == '#text' && node.textContent != '') {
      return !!(WebAudio.youTubeAutoSubsNodeIsSubtitleText(node));
    }
    return false;
  }
}