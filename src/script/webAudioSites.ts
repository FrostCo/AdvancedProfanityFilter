import Constants from './lib/constants';

export default class WebAudioSites {
  static combineSites(sites: { [site: string]: AudioRule[] } = {}): { [site: string]: AudioRule[] } {
    return Object.assign({}, WebAudioSites.sites, sites);
  }

  static sites: { [site: string]: AudioRule[] } = {
    'abc.com': [
      { className: 'akamai-caption-text', mode: 'element', tagName: 'DIV' },
      { className: 'amp-caption-area', displaySelector: 'div.amp-caption-area', mode: 'element', muteMethod: Constants.MUTE_METHODS.VIDEO, subtitleSelector: 'div.amp-caption > p', tagName: 'DIV' },
    ],
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
        muteMethod: Constants.MUTE_METHODS.TAB,
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
    'beta.crunchyroll.com': [
      {
        apfCaptions: true,
        apfCaptionsSelector: 'vilosVttJs',
        displaySelector: 'canvas#velocity-canvas',
        externalSub: true,
        externalSubTrackMode: 'hidden',
        externalSubVar: 'window.v1config.media.subtitles',
        iframe: true,
        mode: 'cue',
        videoCueLanguage: 'en-US',
        videoCueRequireShowing: false
      },
    ],
    'www.crunchyroll.com': [
      {
        apfCaptions: true,
        apfCaptionsSelector: 'vilosVttJs',
        displaySelector: 'canvas#velocity-canvas',
        externalSub: true,
        externalSubTrackMode: 'hidden',
        externalSubVar: 'window.v1config.media.subtitles',
        iframe: true,
        mode: 'cue',
        videoCueLanguage: 'enUS',
        videoCueRequireShowing: false,
        videoSelector: 'video#player0',
      },
    ],
    'www.cwtv.com': [
      { className: 'ttr-container', convertBreaks: true, mode: 'element', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' },
      { className: 'ttr-line', convertBreaks: true, mode: 'element', note: '[CC]', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' },
    ],
    'www.discoveryplus.com': [{ displaySelector: 'div.cjRVXG', mode: 'cue', videoCueKind: 'captions', videoCueLanguage: 'en' }],
    'www.dishanywhere.com': [
      { className: 'bmpui-ui-subtitle-label', mode: 'element', tagName: 'SPAN' },
      { className: 'bmpui-subtitle-region-container', mode: 'element', subtitleSelector: 'div.bmpui-container-wrapper > span.bmpui-ui-subtitle-label', tagName: 'div' },
    ],
    'www.disneyplus.com': [{ mode: 'cue', videoCueHideCues: true, videoSelector: 'video.btm-media-client-element' }],
    'www.fox.com': [{ className: 'jw-text-track-container', mode: 'element', subtitleSelector: 'div.jw-text-track-cue', tagName: 'DIV' }],
    'www.fubo.tv': [
      {
        displayHide: 'none',
        displaySelector: 'div.bmpui-ui-subtitle-overlay',
        iframe: false,
        mode: 'watcher',
        parentSelector: 'div.bmpui-ui-subtitle-overlay',
        subtitleSelector: 'div.bmpui-ui-subtitle-overlay span',
      },
    ],
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
    'www.paramountplus.com': [{ mode: 'cue', videoCueLanguage: 'en', videoCueRequireShowing: false }],
    'play.google.com': [{ className: 'lava-timed-text-window', mode: 'element', subtitleSelector: 'span.lava-timed-text-caption', tagName: 'DIV' }],
    'play.hbomax.com': [{ displayVisibility: true, dynamicTargetMode: 'watcher', dynamicTextKey: 'Example Text', mode: 'dynamic', parentSelectorAll: '> span', subtitleSelector: 'span' }],
    'www.hulu.com': [
      { className: 'caption-text-box', displaySelector: 'div.caption-text-box', mode: 'element', subtitleSelector: 'p', tagName: 'DIV' },
      { displaySelector: 'div.CaptionBox', mode: 'elementChild', parentSelector: 'div.CaptionBox', tagName: 'P' }
    ],
    'www.nbc.com': [
      { className: 'ttr-line', mode: 'element', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' },
      { mode: 'cue', videoCueLanguage: 'en' },
    ],
    'www.netflix.com': [{ className: 'player-timedtext-text-container', mode: 'element', subtitleSelector: 'span', tagName: 'DIV' }],
    'www.pbs.org': [{ iframe: true, mode: 'element', subtitleSelector: 'div.vjs-text-track-cue > div', tagName: 'DIV' }],
    'www.peacocktv.com': [
      { displaySelector: 'div.video-player__subtitles', mode: 'elementChild', parentSelector: 'div.video-player__subtitles > div', simpleUnmute: true, tagName: '#text' },
      { displaySelector: 'div.video-player__subtitles', mode: 'elementChild', parentSelector: 'div.video-player__subtitles > div', subtitleSelector: 'SPAN > SPAN', tagName: 'DIV' },
      { displaySelector: 'div.video-player__subtitles', mode: 'elementChild', parentSelector: 'div.video-player__subtitles > div', tagName: 'SPAN' },
    ],
    'www.philo.com': [{ mode: 'cue' }],
    'app.plex.tv': [
      { dataPropPresent: 'dialogueId', mode: 'element', subtitleSelector: 'span > span', tagName: 'DIV' },
      { containsSelector: 'div[data-dialogue-id]', mode: 'element', subtitleSelector: 'span > span', tagName: 'DIV' },
    ],
    'pluto.tv': [{ mode: 'cue', videoCueHideCues: true, videoCueRequireShowing: false }],
    'www.redbox.com': [{ mode: 'elementChild', parentSelector: 'div.rb-text-container', subtitleSelector: 'SPAN', tagName: 'DIV' }],
    'watch.redeemtv.com': [{ convertBreaks: true, displaySelector: 'div.vp-captions', mode: 'elementChild', parentSelector: 'div.vp-captions', tagName: 'SPAN' }],
    'www.showmax.com': [{ ignoreMutations: true, mode: 'elementChild', parentSelector: 'div.contentWrapper > div.subtitles--3EXhT', simpleUnmute: true, tagName: '#text' }],
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
