import { expect } from 'chai';
import WebAudio from './built/webAudio';
import WebConfig from './built/webConfig';
import WebFilter from './built/webFilter';

describe('WebAudio', function() {
  const filter = new WebFilter;
  filter.cfg = new WebConfig({});
  const location = { hostname: 'example.com' };
  global.window = { parent: { location: location }, location: location };
  global.document = { location: location, referrer: 'sample.com' };
  filter.getTestHostname = () => (window.location == window.parent.location) ? document.location.hostname : new URL(document.referrer).hostname;
  filter.hostname = filter.getTestHostname();

  const newVideo = function() {
    return {
      textTracks: [],
      addTextTrack: function(kind = 'captions', label = '', language = '') { this.textTracks.push({
        addCue: function(start, end, text) { this.cues.push({ start: start, end: end, text: text }); },
        cues: [],
        kind: kind,
        label: label,
        language: language,
        mode: 'showing',
      }); }
    };
  };

  describe('.getVideoTextTrack()', function() {
    it('Return first exact match for the keys provided', function() {
      const audio = new WebAudio(filter);
      const rule = { mode: 'cue', videoCueLanguage: 'en', videoCueLabel: 'English', videoCueRequireShowing: true };
      const video = newVideo();
      video.addTextTrack('captions', 'Spanish', 'es');
      const textTrack0 = video.textTracks[0];
      textTrack0.addCue('0:00:10', '0:00:20', 'First sample text');
      textTrack0.addCue('0:00:25', '0:00:37', 'Second sample text');
      video.addTextTrack('captions', 'English', 'en');
      const textTrack1 = video.textTracks[1];
      textTrack1.addCue('0:00:10', '0:00:20', 'First sample text');
      textTrack1.addCue('0:00:25', '0:00:37', 'Second sample text');
      expect(audio.getVideoTextTrack(video.textTracks, rule)).to.eq(textTrack1);
    });

    it('Return first textTrack when there are cues present but none are an exact match for the keys provided', function() {
      const audio = new WebAudio(filter);
      const rule = { mode: 'cue', videoCueLanguage: '', videoCueLabel: '', videoCueRequireShowing: true };
      const video = newVideo();
      video.addTextTrack('captions', 'Spanish', 'es');
      const textTrack0 = video.textTracks[0];
      textTrack0.addCue('0:00:10', '0:00:20', 'First sample text');
      textTrack0.addCue('0:00:25', '0:00:37', 'Second sample text');
      video.addTextTrack('captions', 'French', 'fr');
      const textTrack1 = video.textTracks[1];
      textTrack1.addCue('0:00:10', '0:00:20', 'First sample text');
      textTrack1.addCue('0:00:25', '0:00:37', 'Second sample text');
      expect(audio.getVideoTextTrack(video.textTracks, rule)).to.eq(textTrack0);
    });

    it('Match on label and language and kind', function() {
      const audio = new WebAudio(filter);
      const rule = { mode: 'cue', videoCueLanguage: 'en-US', videoCueLabel: 'English', videoCueKind: 'subtitles', videoCueRequireShowing: false };
      const video = newVideo();
      video.addTextTrack('captions', 'English', 'en-US');
      const textTrack0 = video.textTracks[0];
      textTrack0.addCue('0:00:10', '0:00:20', 'First sample text');
      video.addTextTrack('subtitles', 'English', 'en-US');
      const textTrack1 = video.textTracks[1];
      textTrack1.addCue('0:00:10', '0:00:20', 'First sample text');
      expect(audio.getVideoTextTrack(video.textTracks, rule)).to.eq(textTrack1);
    });

    it('Require showing', function() {
      const audio = new WebAudio(filter);
      const rule = { mode: 'cue', videoCueLanguage: 'en-US', videoCueLabel: 'English', videoCueKind: 'subtitles', videoCueRequireShowing: true };
      const video = newVideo();
      video.addTextTrack('captions', 'English', 'en-US');
      const textTrack0 = video.textTracks[0];
      textTrack0.addCue('0:00:10', '0:00:20', 'First sample text');
      textTrack0.mode = 'hidden';
      expect(audio.getVideoTextTrack(video.textTracks, rule)).to.be.undefined;
      textTrack0.mode = 'showing';
      expect(audio.getVideoTextTrack(video.textTracks, rule)).to.eq(textTrack0);
    });

    it('Return first match with cues when no matches are found', function() {
      const audio = new WebAudio(filter);
      const rule = { mode: 'cue', videoCueLanguage: 'es', videoCueLabel: 'Spanish', videoCueRequireShowing: false };
      const video = newVideo();
      video.addTextTrack('captions', 'English', 'en-US');
      const textTrack0 = video.textTracks[0];
      textTrack0.addCue('0:00:10', '0:00:20', 'First sample text');
      expect(audio.getVideoTextTrack(video.textTracks, rule)).to.eq(textTrack0);
    });

    it('Return first match when 2 identically scored matches are found (precedence)', function() {
      const audio = new WebAudio(filter);
      const rule = { mode: 'cue', videoCueLanguage: 'es', videoCueLabel: 'Spanish', videoCueRequireShowing: false };
      const video = newVideo();
      video.addTextTrack('captions', '', 'es');
      const textTrack0 = video.textTracks[0];
      textTrack0.addCue('0:00:10', '0:00:20', 'First sample text');
      video.addTextTrack('captions', 'Spanish (text)', 'es');
      const textTrack1 = video.textTracks[1];
      textTrack1.addCue('0:00:10', '0:00:20', 'First sample text');
      expect(audio.getVideoTextTrack(video.textTracks, rule)).to.eq(textTrack0);
    });

    it('Use the override value', function() {
      const audio = new WebAudio(filter);
      const rule = { mode: 'cue', videoCueLanguage: 'en-US', videoCueLabel: 'English', videoCueKind: 'subtitles', externalSubTrackLabel: 'APF' };
      const video = newVideo();
      video.addTextTrack('captions', 'English', 'en-US');
      const textTrack0 = video.textTracks[0];
      textTrack0.addCue('0:00:10', '0:00:20', 'First sample text');
      video.addTextTrack('captions', 'APF', '');
      const textTrack1 = video.textTracks[1];
      textTrack1.addCue('0:00:10', '0:00:20', 'First sample text');
      expect(audio.getVideoTextTrack(video.textTracks, rule, 'externalSubTrackLabel')).to.eq(textTrack1);
    });
  });
});
