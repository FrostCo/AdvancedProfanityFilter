/* eslint-disable @typescript-eslint/naming-convention */
import Constants from './lib/constants';

export const defaultTargetConfig: BuildTargetSites = {
  disabledSites: [],
  sites: {},
};

export const iOSTargetConfig: BuildTargetSites = {
  disabledSites: [
    'www.hidive.com',
    'watch.sling.com',
  ],
  sites: {
    'tv.apple.com': [{ mode: 'cue', videoCueLanguage: 'en' }],
    'play.stan.com.au': [{ mode: 'cue', videoCueLanguage: 'en' }],
  },
};

export const safariTargetConfig: BuildTargetSites = {
  disabledSites: [],
  sites: {
    'tv.apple.com': [{ mode: 'cue', videoCueLanguage: 'en' }],
    'play.stan.com.au': [{ mode: 'cue', videoCueLanguage: 'en' }],
  },
};

export const supportedSites: AudioSites = {
  'abc.com': [
    { className: 'akamai-caption-text', mode: 'element', tagName: 'DIV' },
    { className: 'amp-caption-area', displaySelector: 'div.amp-caption-area', mode: 'element', muteMethod: Constants.MUTE_METHODS.VIDEO_VOLUME, subtitleSelector: 'div.amp-caption > p', tagName: 'DIV' },
  ],
  'iview.abc.net.au': [{ mode: 'element', subtitleSelector: 'div.jw-text-track-cue', tagName: 'div' }],
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
  'smile.amazon.com': [
    {
      displayHide: 'none',
      displaySelector: 'div.webPlayerContainer div.f35bt6a',
      displayShow: '',
      iframe: false,
      mode: 'watcher',
      parentSelector: 'div.webPlayerContainer div span > span',
      videoSelector: 'div.webPlayerElement video[src]',
    }
  ],
  'www.amazon.co.uk': [
    {
      displayHide: 'none',
      displaySelector: 'div.webPlayerContainer div.f35bt6a',
      displayShow: '',
      iframe: false,
      mode: 'watcher',
      parentSelector: 'div.webPlayerContainer div span > span',
      videoSelector: 'div.webPlayerElement video[src]',
    }
  ],
  'www.amazon.com': [
    {
      displayHide: 'none',
      displaySelector: 'div.webPlayerContainer div.f35bt6a',
      displayShow: '',
      iframe: false,
      mode: 'watcher',
      parentSelector: 'div.webPlayerContainer div span > span',
      videoSelector: 'div.webPlayerElement video[src]',
    }
  ],
  'www.amc.com': [
    { className: 'ttr-container', mode: 'element', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' },
    { mode: 'cue', videoCueLanguage: 'en', videoSelector: 'video' },
  ],
  'www.amcplus.com': [{ mode: 'element', subtitleSelector: 'div.vjs-text-track-cue > div', tagName: 'DIV' }],
  'tv.apple.com': [
    {
      apfCaptions: true,
      apfCaptionsSelector: 'div.video-container',
      displaySelector: 'div.video-player div.video-container > div > div',
      mode: 'elementChild',
      parentSelector: 'div.video-player div.video-container',
      subtitleSelector: ':scope div > div',
      tagName: 'DIV',
      videoSelector: 'div.video-player div.video-container video',
    },
  ],
  'www.att.tv': [{ mode: 'cue', videoSelector: 'video#quickplayPlayer' }],
  'www.attwatchtv.com': [{ mode: 'cue', videoSelector: 'video#quickplayPlayer' }],
  'www.bbc.co.uk': [
    {
      displaySelector: 'smp-toucan-player >>> smp-video-layout >>> smp-subtitles >>> div',
      iframe: false,
      mode: 'watcher',
      subtitleSelector: 'smp-toucan-player >>> smp-video-layout >>> smp-subtitles >>> div[lang] p span span',
      videoSelector: 'smp-toucan-player >>> smp-playback >>> video'
    },
  ],
  'www.britbox.com': [
    { className: 'bmpui-ui-subtitle-label', mode: 'element', tagName: 'SPAN' },
    { className: 'bmpui-subtitle-region-container', mode: 'element', subtitleSelector: 'div.bmpui-container-wrapper > span.bmpui-ui-subtitle-label', tagName: 'div' },
  ],
  'gem.cbc.ca': [{ className: 'jw-text-track-container', mode: 'element', subtitleSelector: 'div.jw-text-track-cue', tagName: 'DIV' }],
  'www.cbs.com': [{ mode: 'cue', videoCueLanguage: 'en', videoCueRequireShowing: false }],
  'www.channel4.com': [{ displaySelector: 'div.subtitles-container', mode: 'elementChild', parentSelector: 'div.subtitles-container', tagName: 'SPAN' }],
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
      videoCueLanguage: 'en-US',
      videoCueRequireShowing: false,
      videoSelector: 'video#player0',
    },
  ],
  'www.cwtv.com': [
    { className: 'ttr-container', convertBreaks: true, mode: 'element', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' },
    { className: 'ttr-line', convertBreaks: true, mode: 'element', note: '[CC]', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' },
  ],
  'www.dailywire.com': [{ mode: 'cue' }],
  'www.discoveryplus.com': [{ displaySelector: 'div.cjRVXG', mode: 'cue', videoCueKind: 'captions', videoCueLanguage: 'en' }],
  'www.dishanywhere.com': [
    { className: 'bmpui-ui-subtitle-label', mode: 'element', tagName: 'SPAN' },
    { className: 'bmpui-subtitle-region-container', mode: 'element', subtitleSelector: 'div.bmpui-container-wrapper > span.bmpui-ui-subtitle-label', tagName: 'div' },
  ],
  'www.apps.disneyplus.com': [
    {
      displayHide: 'none',
      displaySelector: 'div#video-container div.shaka-text-container',
      displayShow: 'flex',
      iframe: false,
      mode: 'watcher',
      note: 'South Africa',
      subtitleSelector: 'div#video-container div.shaka-text-container > span',
      videoSelector: 'div#video-container video'
    },
  ],
  'www.disneyplus.com': [{ className: 'dss-subtitle-renderer-wrapper', mode: 'element', subtitleSelector: 'div.dss-subtitle-renderer-cue-window span.dss-subtitle-renderer-line', tagName: 'DIV' }],
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
      displaySelector: 'div > div.vjs-text-track-cue',
      mode: 'element',
      subtitleSelector: 'div.vjs-text-track-cue > div',
      tagName: 'DIV'
    },
    {
      iframe: true,
      mode: 'elementChild',
      note: 'Embedded videos',
      parentSelector: 'div.vjs-text-track-display',
      simpleUnmute: true,
      subtitleSelector: ':scope div > div',
      tagName: 'DIV',
    },
  ],
  'fxnow.fxnetworks.com': [{ iframe: true, mode: 'cue', videoSelector: 'video' }],
  'play.google.com': [{ className: 'lava-timed-text-window', mode: 'element', subtitleSelector: 'span.lava-timed-text-caption', tagName: 'DIV' }],
  'play.hbomax.com': [
    {
      apfCaptions: true,
      displaySelector: "div[data-testid='CueBoxContainer']",
      displaySelectorParents: 1,
      ignoreMutations: true,
      mode: 'watcher',
      subtitleSelector: "div[data-testid='CueBoxContainer'] > div > div > div",
    },
  ],
  'www.hidive.com': [{ className: 'rmp-cc-container', mode: 'element', subtitleSelector: 'div.rmp-cc-cue > span', tagName: 'DIV' }],
  'www.hulu.com': [
    { className: 'caption-text-box', displaySelector: 'div.caption-text-box', mode: 'element', subtitleSelector: 'p', tagName: 'DIV' },
    { displaySelector: 'div.CaptionBox', mode: 'elementChild', parentSelector: 'div.CaptionBox', tagName: 'P' }
  ],
  'www.itv.com': [{ mode: 'cue', videoCueLanguage: 'en' }],
  'mediasetinfinity.mediaset.it': [
    {
      ignoreMutations: true,
      mode: 'elementChild',
      parentSelector: 'div#playerContainer > div > div > div > div > div',
      simpleUnmute: true,
      tagName: '#text',
      videoSelector: 'div#playerContainer video',
    },
    {
      ignoreMutations: true,
      mode: 'elementChild',
      parentSelector: 'div#playerContainer > div > div > div > div > div > div > div > div > div > div',
      simpleUnmute: true,
      tagName: 'DIV',
      videoSelector: 'div#playerContainer video',
    },
  ],
  'moviesanywhere.com': [{ mode: 'cue' }],
  'www.nbc.com': [
    { className: 'ttr-line', mode: 'element', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' },
    { mode: 'cue', videoCueLanguage: 'en' },
  ],
  'www.netflix.com': [
    { className: 'player-timedtext-text-container', mode: 'element', note: 'Fallback compatibility', subtitleSelector: 'span > span', tagName: 'DIV' },
    { className: 'player-timedtext-text-container', mode: 'element', subtitleSelector: 'span', tagName: 'DIV' },
  ],
  'www.paramountplus.com': [
    { mode: 'cue', videoCueHideCues: true, videoCueLanguage: 'en', videoCueRequireShowing: false, videoSelector: 'div[data-role=videoContainer] video' },
  ],
  'www.pbs.org': [{ iframe: true, mode: 'element', subtitleSelector: 'div.vjs-text-track-cue > div', tagName: 'DIV' }],
  'www.peacocktv.com': [
    {
      displaySelector: 'div.video-player__subtitles',
      mode: 'elementChild',
      parentSelector: 'div.video-player__subtitles > span.video-player__subtitles__cue span.video-player__subtitles__line',
      simpleUnmute: true,
      tagName: '#text'
    },
    {
      className: 'video-player__subtitles',
      displaySelector: 'div.video-player__subtitles',
      mode: 'element',
      subtitleSelector: 'span.video-player__subtitles__cue > span.video-player__subtitles__line',
      tagName: 'DIV'
    },
  ],
  'www.philo.com': [{ mode: 'cue' }],
  'app.plex.tv': [
    { dataPropPresent: 'dialogueId', mode: 'element', subtitleSelector: 'span > span', tagName: 'DIV' },
    { containsSelector: 'div[data-dialogue-id]', mode: 'element', subtitleSelector: 'span > span', tagName: 'DIV' },
  ],
  'pluto.tv': [{ mode: 'cue', videoCueHideCues: true, videoCueRequireShowing: false }],
  'www.primevideo.com': [
    {
      displayHide: 'none',
      displaySelector: 'div.webPlayerContainer div.f35bt6a',
      displayShow: '',
      iframe: false,
      mode: 'watcher',
      parentSelector: 'div.webPlayerContainer div span > span',
      videoSelector: 'div.webPlayerElement video[src]',
    }
  ],
  'www.raiplay.it': [
    {
      mode: 'elementChild',
      parentSelector: 'div.theoplayer-texttracks div.theoplayer-webvtt-region-default',
      subtitleSelector: 'div span',
      tagName: 'DIV',
    },
  ],
  'www.redbox.com': [{ mode: 'elementChild', parentSelector: 'div.rb-text-container', subtitleSelector: 'SPAN > SPAN', tagName: 'DIV' }],
  'watch.redeemtv.com': [{ convertBreaks: true, displaySelector: 'div.vp-captions', mode: 'elementChild', parentSelector: 'div.vp-captions', tagName: 'SPAN' }],
  'therokuchannel.roku.com': [{ mode: 'element', subtitleSelector: 'div.vjs-text-track-cue > div', tagName: 'DIV' }],
  'row8.com': [{ iframe: false, mode: 'watcher', parentSelector: 'div.vjs-text-track-display div.vjs-text-track-cue', subtitleSelector: 'div', videoSelector: 'app-videojs-player video' }],
  'www.sbs.com.au': [{ className: 'bmpui-subtitle-region-container', mode: 'element', subtitleSelector: 'DIV.bmpui-container-wrapper > SPAN.bmpui-ui-subtitle-label > SPAN', tagName: 'DIV' }],
  'www.showmax.com': [{ ignoreMutations: true, mode: 'elementChild', parentSelector: 'div.contentWrapper > div.subtitles--3EXhT', simpleUnmute: true, tagName: '#text' }],
  'www.showtime.com': [{ mode: 'cue', videoCueHideCues: true, videoCueLanguage: 'en', videoCueRequireShowing: false }],
  'www.shudder.com': [{ mode: 'element', subtitleSelector: 'div.vjs-text-track-cue > div', tagName: 'DIV' }],
  'watch.sling.com': [{ className: 'bmpui-subtitle-region-container', mode: 'element', subtitleSelector: 'DIV.bmpui-container-wrapper > SPAN.bmpui-ui-subtitle-label', tagName: 'DIV' }],
  'play.stan.com.au': [{ ignoreMutations: true, mode: 'elementChild', parentSelector: 'div.clpp-text-container', simpleUnmute: true, tagName: 'DIV' }],
  'www.starz.com': [{ mode: 'elementChild', parentSelector: 'starz-captions > div.cue-list', tagName: 'SPAN' }],
  'www.syfy.com': [{ className: 'ttr-line', mode: 'element', subtitleSelector: 'span.ttr-cue', tagName: 'DIV' }],
  'www.tntdrama.com': [{ mode: 'cue', videoCueLanguage: 'en', videoSelector: 'video.top-media-element' }],
  'tubitv.com': [{ mode: 'elementChild', parentSelector: "div[data-id='captionsComponent']", tagName: 'SPAN' }],
  'www.universalkids.com': [{ mode: 'element', subtitleSelector: 'div.gwt-HTML', tagName: 'DIV' }],
  'www.usanetwork.com': [
    { className: 'ttr-container', mode: 'element', note: 'movies 2022-12', subtitleSelector: 'span.ttr-cue', tagName: 'DIV', videoSelector: 'video[src^=blob]' },
    { className: 'ttr-line', mode: 'element', note: 'free clips 2022-12', subtitleSelector: 'span', tagName: 'DIV', videoSelector: 'video[src^=blob]' },
  ],
  'vimeo.com': [{ mode: 'element', tagName: 'SPAN', note: 'Only tested with single-line captions', className: 'vp-captions-line', displaySelector: 'div.vp-captions > span.vp-captions-window' }],
  'player.vimeo.com': [{ mode: 'element', tagName: 'SPAN', note: 'For embedded videos', className: 'vp-captions-line', displaySelector: 'div.vp-captions > span.vp-captions-window' }],
  'www.vudu.com': [{ displaySelector: 'div#subtitleContainer > div', iframe: true, mode: 'element', subtitleSelector: 'span.subtitles', tagName: 'DIV' }],
  'vrv.co': [
    { displaySelector: 'div.libassjs-canvas-parent', externalSub: true, externalSubVar: 'window.vilos.content.captions', iframe: true, mode: 'cue', videoCueLanguage: 'en-US', videoCueRequireShowing: false },
    { displaySelector: 'div.libassjs-canvas-parent', externalSub: true, externalSubVar: 'window.vilos.content.subtitles', iframe: true, mode: 'cue', videoCueLanguage: 'en-US', videoCueRequireShowing: false },
  ],
  'm.youtube.com': [{ className: 'caption-window', mode: 'element', subtitleSelector: 'span.ytp-caption-segment', tagName: 'DIV' }],
  'tv.youtube.com': [{ className: 'caption-window', mode: 'element', subtitleSelector: 'span.ytp-caption-segment', tagName: 'DIV' }],
  'www.youtube.com': [{ className: 'caption-window', mode: 'element', subtitleSelector: 'span.ytp-caption-segment', tagName: 'DIV' }],
};
