export default class WebAudioSites {
  static combineSites(sites: { [site: string]: AudioRule[] } = {}): { [site: string]: AudioRule[] } {
    return Object.assign({}, WebAudioSites.sites, sites);
  }

  static sites: { [site: string]: AudioRule[] } = {
    'abc.com': [{ className: 'akamai-caption-text', mode: 'element', tagName: 'DIV' }],
    'acorn.tv': [
      {
        iframe: true,
        mode: 'elementChild',
        parentSelector: 'div.vjs-text-track-display',
        simpleUnmute: true,
        subtitleSelector: ':scope div > div',
        tagName: 'DIV',
      }
    ],
    'www.amazon.com': [
      {
        displayHide: 'none',
        displaySelector: 'div.webPlayerContainer div.f35bt6a',
        displayShow: '',
        iframe: false,
        mode: 'watcher',
        parentSelector: 'div.webPlayerContainer div p > span',
        subtitleSelector: 'div.webPlayerContainer div span > span',
        videoSelector: 'div.webPlayerElement video[src]',
      }
    ],
    'www.amc.com': [
      { className: 'ttr-container', mode: 'element', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' },
      { mode: 'cue', videoCueLanguage: 'en', videoSelector: 'video' },
    ],
    'tv.apple.com': [
      {
        displaySelector: 'div.video-container > div > div > div',
        mode: 'elementChild',
        parentSelector: 'div.video-container',
        preserveWhiteSpace: true,
        rootNode: true,
        subtitleSelector: 'div > div > div > div > div',
        tagName: 'DIV',
      }
    ],
    'www.att.tv': [{ mode: 'cue', videoSelector: 'video#quickplayPlayer' }],
    'www.attwatchtv.com': [{ mode: 'cue', videoSelector: 'video#quickplayPlayer' }],
    'www.britbox.com': [
      { className: 'bmpui-ui-subtitle-label', mode: 'element', tagName: 'SPAN' },
      { className: 'bmpui-subtitle-region-container', mode: 'element', subtitleSelector: 'div.bmpui-container-wrapper > span.bmpui-ui-subtitle-label', tagName: 'div' },
    ],
    'gem.cbc.ca': [{ className: 'jw-text-track-container', mode: 'element', subtitleSelector: 'div.jw-text-track-cue', tagName: 'DIV' }],
    'www.cbs.com': [{ mode: 'cue', videoCueLanguage: 'en', videoCueRequireShowing: false }],
    'www.crackle.com': [{ ignoreMutations: true, mode: 'elementChild', parentSelector: 'div.clpp-subtitles-container', simpleUnmute: true, tagName: '#text' }],
    'www.criterionchannel.com': [{ iframe: true, mode: 'cue', videoCueHideCues: true, videoCueRequireShowing: false }],
    'www.crunchyroll.com': [
      {
        displaySelector: 'canvas#velocity-canvas',
        externalSub: true,
        externalSubVar: 'window.v1config.media.subtitles',
        iframe: true,
        mode: 'cue',
        showSubtitles: 0,
        videoCueLanguage: 'enUS',
        videoCueRequireShowing: false,
      }
    ],
    'www.cwtv.com': [{ className: 'ttr-container', mode: 'element', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' }],
    'www.dishanywhere.com': [
      { className: 'bmpui-ui-subtitle-label', mode: 'element', tagName: 'SPAN' },
      { className: 'bmpui-subtitle-region-container', mode: 'element', subtitleSelector: 'div.bmpui-container-wrapper > span.bmpui-ui-subtitle-label', tagName: 'div' },
    ],
    'www.disneyplus.com': [{ mode: 'cue', videoSelector: 'video.btm-media-client-element' }],
    'www.fox.com': [{ className: 'jw-text-track-container', mode: 'element', subtitleSelector: 'div.jw-text-track-cue', tagName: 'DIV' }],
    'www.funimation.com': [
      {
        iframe: true,
        mode: 'elementChild',
        parentSelector: 'div.vjs-text-track-display',
        simpleUnmute: true,
        subtitleSelector: ':scope div > div',
        tagName: 'DIV',
      }
    ],
    'play.google.com': [{ className: 'lava-timed-text-window', mode: 'element', subtitleSelector: 'span.lava-timed-text-caption', tagName: 'DIV' }],
    'play.hbomax.com': [{ mode: 'elementChild', parentSelectorAll: 'div.class3 > span, div.class28 > span', showSubtitles: 0, tagName: 'SPAN' }],
    'www.hulu.com': [
      { className: 'caption-text-box', displaySelector: 'div.caption-text-box', mode: 'element', subtitleSelector: 'p', tagName: 'DIV' },
      { displaySelector: 'div.CaptionBox', mode: 'elementChild', parentSelector: 'div.CaptionBox', tagName: 'P' }
    ],
    'www.nbc.com': [
      { className: 'ttr-line', mode: 'element', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' },
      { mode: 'cue', videoCueLanguage: 'en' },
    ],
    'www.netflix.com': [{ className: 'player-timedtext-text-container', mode: 'element', subtitleSelector: 'span', tagName: 'DIV' }],
    'www.peacocktv.com': [{ mode: 'elementChild', parentSelector: 'div.video-player__subtitles > div', subtitleSelector: 'SPAN > SPAN', tagName: 'div' }],
    'www.philo.com': [{ mode: 'cue' }],
    'app.plex.tv': [
      { dataPropPresent: 'dialogueId', mode: 'element', subtitleSelector: 'span > span', tagName: 'DIV' },
      { containsSelector: 'div[data-dialogue-id]', mode: 'element', subtitleSelector: 'span > span', tagName: 'DIV' },
    ],
    'pluto.tv': [{ mode: 'cue', videoCueHideCues: true, videoCueRequireShowing: false }],
    'watch.redeemtv.com': [{ convertBreaks: true, displaySelector: 'div.vp-captions', mode: 'elementChild', parentSelector: 'div.vp-captions', tagName: 'SPAN' }],
    'play.stan.com.au': [{ ignoreMutations: true, mode: 'elementChild', parentSelector: 'div.clpp-subtitles-container', simpleUnmute: true, tagName: '#text' }],
    'www.starz.com': [{ mode: 'elementChild', parentSelector: 'starz-captions > div.cue-list', tagName: 'SPAN' }],
    'www.syfy.com': [{ className: 'ttr-line', mode: 'element', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' }],
    'www.tntdrama.com': [{ mode: 'cue', videoCueLanguage: 'en', videoSelector: 'video.top-media-element' }],
    'tubitv.com': [{ mode: 'elementChild', parentSelector: 'div#captionsComponent', tagName: 'SPAN' }],
    'www.universalkids.com': [{ mode: 'element', subtitleSelector: 'div.gwt-HTML', tagName: 'DIV' }],
    'www.usanetwork.com': [{ className: 'ttr-line', mode: 'element', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' }],
    'www.vudu.com': [{ mode: 'element', subtitleSelector: 'span.subtitles', tagName: 'DIV' }],
    'vrv.co': [
      { displaySelector: 'div.libassjs-canvas-parent', externalSub: true, externalSubVar: 'window.vilos.content.captions', iframe: true, mode: 'cue', videoCueLanguage: 'en-US', videoCueRequireShowing: false },
      { displaySelector: 'div.libassjs-canvas-parent', externalSub: true, externalSubVar: 'window.vilos.content.subtitles', iframe: true, mode: 'cue', videoCueLanguage: 'en-US', videoCueRequireShowing: false },
    ],
    'm.youtube.com': [{ className: 'caption-window', mode: 'element', subtitleSelector: 'span.ytp-caption-segment', tagName: 'DIV' }],
    'tv.youtube.com': [{ className: 'caption-window', mode: 'element', subtitleSelector: 'span.ytp-caption-segment', tagName: 'DIV' }],
    'www.youtube.com': [{ className: 'caption-window', mode: 'element', subtitleSelector: 'span.ytp-caption-segment', tagName: 'DIV' }],
  };
}
