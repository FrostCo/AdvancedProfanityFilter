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