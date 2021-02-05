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
      addTextTrack: function(type = 'captions', label = '', language = '') { this.textTracks.push({
        cues: [],
        mode: 'showing',
        label: label,
        language: language,
        addCue: function(start, end, text) { this.cues.push({ start: start, end: end, text: text }); },
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
      expect(audio.getVideoTextTrack(video, rule, 'videoCueLanguage')).to.eq(textTrack1);
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
      expect(audio.getVideoTextTrack(video, rule, 'videoCueLanguage')).to.eq(textTrack0);
    });
  });

  describe('.matchTextTrack()', function() {
    it ('Match on label and language', function() {
      const audio = new WebAudio(filter);
      const rule = { mode: 'cue', videoCueLanguage: 'en-US', videoCueLabel: 'APF', videoCueRequireShowing: false };
      const textTrack = { mode: 'showing', language: 'en-US', label: 'APF', cues: [] };
      textTrack.addCue = (start, end, text) => { textTrack.cues.push({ start: start, end: end, text: text }); };
      textTrack.addCue('0:00:10', '0:00:20', 'First sample text');
      textTrack.addCue('0:00:25', '0:00:37', 'Second sample text');
      expect(audio.matchTextTrack(textTrack, rule, 'label', 'videoCueLabel')).to.be.true;
      expect(audio.matchTextTrack(textTrack, rule, 'language', 'videoCueLanguage')).to.be.true;
    });

    it ('Require showing', function() {
      const audio = new WebAudio(filter);
      const rule = { mode: 'cue', videoCueLanguage: 'en-US', videoCueLabel: 'APF', videoCueRequireShowing: true };
      const textTrack = { mode: 'hidden', language: 'en-US', label: 'APF', cues: [] };
      textTrack.addCue = (start, end, text) => { textTrack.cues.push({ start: start, end: end, text: text }); };
      textTrack.addCue('0:00:10', '0:00:20', 'First sample text');
      textTrack.addCue('0:00:25', '0:00:37', 'Second sample text');
      expect(audio.matchTextTrack(textTrack, rule, 'label', 'videoCueLabel')).to.be.undefined;
      expect(audio.matchTextTrack(textTrack, rule, 'language', 'videoCueLanguage')).to.be.undefined;
    });

    it ('Return first match with cues when no keys provided', function() {
      const audio = new WebAudio(filter);
      const rule = { mode: 'cue', videoCueLanguage: 'en-US', videoCueLabel: 'APF', videoCueRequireShowing: true };
      const textTrack = { mode: 'showing', language: 'en-US', label: 'APF', cues: [] };
      textTrack.addCue = (start, end, text) => { textTrack.cues.push({ start: start, end: end, text: text }); };
      textTrack.addCue('0:00:10', '0:00:20', 'First sample text');
      textTrack.addCue('0:00:25', '0:00:37', 'Second sample text');
      expect(audio.matchTextTrack(textTrack, rule)).to.be.true;
      textTrack.mode = 'hidden';
      expect(audio.matchTextTrack(textTrack, rule)).to.be.undefined;
    });
  });
});