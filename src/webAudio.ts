export default class WebAudio {
  static readonly subtitleSelectors = {
    'app.plex.tv': 'span > span',
    'www.amazon.com': 'span.timedTextBackground',
    'www.netflix.com': 'span',
    'www.vudu.com': 'span.subtitles',
    'www.youtube.com': 'span.caption-visual-line'
  }

  static subtitleSelector(hostname: string): string {
    return WebAudio.subtitleSelectors[hostname];
  }

  static supportedNode(hostname: string, node: any): boolean {
    switch(hostname) {
      case 'app.plex.tv':
        return !!(node.tagName == 'DIV' && (node.dataset && node.dataset.hasOwnProperty('dialogueId')) || (typeof node.querySelectorAll === "function" && node.querySelectorAll('div[data-dialogue-id]').length > 0));
      case 'www.amazon.com':
        return !!(node.tagName == 'P' && node.querySelectorAll('span.timedTextWindow > span.timedTextBackground').length > 0);
      case 'www.netflix.com':
        return !!(node.tagName == 'DIV' && node.className.includes('player-timedtext-text-container') && node.querySelectorAll('span').length > 0);
      case 'www.vudu.com':
        return !!(node.tagName == 'DIV' && node.querySelectorAll('span.subtitles').length > 0);
      case 'www.youtube.com':
        return !!(node.tagName == 'DIV' && node.className.includes('caption-window') && node.querySelectorAll('span.captions-text span span.caption-visual-line').length > 0);
    }
    return false;
  }
}