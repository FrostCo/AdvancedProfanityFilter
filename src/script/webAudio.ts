import Constants from './lib/constants';
import WebFilter from './webFilter';
import BookmarkletFilter from './bookmarkletFilter';
import WebAudioSites from './webAudioSites';
import { getGlobalVariable, hmsToSeconds, makeRequest, secondsToHMS } from './lib/helper';
import Logger from './lib/logger';
const logger = new Logger();

export default class WebAudio {
  cueRuleIds: number[];
  enabledRuleIds: number[];
  fetching: boolean;
  fillerAudio: HTMLAudioElement;
  filter: WebFilter | BookmarkletFilter;
  lastFilteredNode: HTMLElement | ChildNode;
  lastFilteredText: string;
  lastProcessedText: string;
  muted: boolean;
  rules: AudioRule[];
  sites: { [site: string]: AudioRule[] };
  supportedPage: boolean;
  unmuteTimeout: number;
  volume: number;
  watcherRuleIds: number[];
  wordlistId: number;
  youTube: boolean;
  youTubeAutoSubsMax: number;
  youTubeAutoSubsMin: number;
  youTubeAutoSubsRule: AudioRule;
  youTubeAutoSubsTimeout: number;
  youTubeAutoSubsUnmuteDelay: number;

  static readonly brTagRegExp = new RegExp('<br>', 'i');
  static readonly defaultVideoSelector = 'video';
  static readonly fillerConfig = {
    beep: {
      fileName: 'audio/beep.mp3',
      volume: 0.2,
    },
    crickets: {
      fileName: 'audio/crickets.mp3',
      volume: 0.4,
    },
    static: {
      fileName: 'audio/static.mp3',
      volume: 0.3,
    },
  };
  static readonly textTrackRuleMappings = {
    externalSubTrackLabel: 'label',
    videoCueKind: 'kind',
    videoCueLabel: 'label',
    videoCueLanguage: 'language',
  };

  constructor(filter: WebFilter | BookmarkletFilter) {
    this.filter = filter;
    this.cueRuleIds = [];
    this.enabledRuleIds = [];
    this.watcherRuleIds = [];
    if (this.filter.extension) { this.fillerAudio = this.initFillerAudio(this.filter.cfg.fillerAudio); }
    this.lastFilteredNode = null;
    this.lastFilteredText = '';
    this.lastProcessedText = '';
    this.muted = false;
    if (
      !filter.cfg.customAudioSites
      || typeof filter.cfg.customAudioSites !== 'object'
    ) {
      filter.cfg.customAudioSites = {};
    }
    this.sites = WebAudioSites.combineSites(filter.cfg.customAudioSites);
    this.volume = 1;
    this.wordlistId = filter.audioWordlistId;
    this.youTubeAutoSubsMax = filter.cfg.youTubeAutoSubsMax * 1000;
    this.youTubeAutoSubsMin = filter.cfg.youTubeAutoSubsMin;
    this.youTubeAutoSubsUnmuteDelay = 0;

    // Setup rules for current site
    this.rules = this.sites[filter.hostname];
    if (this.rules) {
      if (!Array.isArray(this.rules)) { this.rules = [this.rules]; }
      this.rules.forEach((rule) => { this.initRule(rule); });
      if (this.enabledRuleIds.length > 0) {
        this.supportedPage = true;
        this.initYouTube();
      }
    }
  }

  apfCaptionLine(rule: AudioRule, text: string): HTMLSpanElement {
    const line = document.createElement('span');
    line.classList.add('APF-subtitle-line');
    line.style.background = 'black';
    line.style.color = 'white';
    line.style.fontSize = '3.5vw';
    line.style.paddingLeft = '4px';
    line.style.paddingRight = '4px';
    line.style.height = '18px';
    line.textContent = text;
    return line;
  }

  apfCaptionLines(rule: AudioRule, lines: HTMLSpanElement[]): HTMLDivElement {
    const apfLines = document.createElement('div');
    apfLines.classList.add('APF-subtitles');
    apfLines.style.bottom = '10px';
    apfLines.style.position = 'absolute';
    apfLines.style.textAlign = 'center';
    apfLines.style.width = '100%';
    lines.forEach((line) => {
      apfLines.appendChild(line);
      apfLines.appendChild(document.createElement('br'));
    });
    return apfLines;
  }

  clean(subtitleContainer, ruleIndex = 0): void {
    const rule = this.rules[ruleIndex];
    if (rule.mode === 'watcher') { return; } // If this is for a watcher rule, leave the text alone
    let filtered = false;

    if (subtitleContainer.nodeName && subtitleContainer.nodeName === '#text' && subtitleContainer.parentElement) {
      subtitleContainer = subtitleContainer.parentElement;
    }
    const subtitles = rule.subtitleSelector && subtitleContainer.querySelectorAll ? subtitleContainer.querySelectorAll(rule.subtitleSelector) : [subtitleContainer];
    if (subtitles.length === 0) { return; }

    // Process subtitles
    subtitles.forEach((subtitle) => {
      // innerText handles line feeds/spacing better, but is not available to #text nodes
      const textMethod = subtitle.nodeName === '#text' ? 'textContent' : 'innerText';
      if (
        rule.convertBreaks === true
        && subtitle.nodeName !== '#text'
        && !WebAudio.brTagRegExp.test(subtitle[textMethod])
        && WebAudio.brTagRegExp.test(subtitle.innerHTML)
      ) {
        if (subtitle.style.whiteSpace !== 'pre') { subtitle.style.whiteSpace = 'pre'; }
        subtitle.textContent = subtitle.innerHTML.replace(WebAudio.brTagRegExp, '\n');
      }
      const result = this.replaceTextResult(subtitle[textMethod]);
      if (result.modified) {
        filtered = true;
        this.mute(rule); // Mute the audio if we haven't already

        if (rule.filterSubtitles) {
          if (rule.preserveWhiteSpace && subtitle.style.whiteSpace !== 'pre') { subtitle.style.whiteSpace = 'pre'; }
          if (rule.ignoreMutations) { this.filter.stopObserving(); }
          subtitle[textMethod] = result.filtered;
          if (rule.ignoreMutations) { this.filter.startObserving(); }
        }

        this.lastFilteredNode = subtitle;
        this.lastFilteredText = subtitle[textMethod];
      }
    });

    // When captions/subtitles are spread across multiple mutations, check to see if a filtered node is still present
    if (!filtered) {
      if (this.lastFilteredNode && this.lastFilteredNode.parentElement && this.lastFilteredNode.textContent === this.lastFilteredText) {
        filtered = true;
      }
    }

    const shouldBeShown = this.subtitlesShouldBeShown(rule, filtered);
    shouldBeShown ? this.showSubtitles(rule, subtitles) : this.hideSubtitles(rule, subtitles);
  }

  cleanYouTubeAutoSubs(node): void {
    // Found a new word, clear the max timeout
    if (this.youTubeAutoSubsTimeout != null) {
      clearTimeout(this.youTubeAutoSubsTimeout);
      this.youTubeAutoSubsTimeout = null;
    }

    const result = this.replaceTextResult(node.textContent);
    if (result.modified) {
      node.textContent = result.filtered;
      this.mute(this.youTubeAutoSubsRule);
      this.youTubeAutoSubsUnmuteDelay = null;
      this.filter.updateCounterBadge();

      // Set a timer to unmute if a max time was specified
      if (this.youTubeAutoSubsMax) {
        this.youTubeAutoSubsTimeout = window.setTimeout(this.youTubeAutoSubsMuteTimeout, this.youTubeAutoSubsMax, this);
      }
    } else {
      if (this.muted) {
        if (this.youTubeAutoSubsMin > 0) {
          const currentTime = document.getElementsByTagName(WebAudio.defaultVideoSelector)[0].currentTime;
          if (this.youTubeAutoSubsUnmuteDelay == null) { // Start tracking youTubeAutoSubsUnmuteDelay when next unfiltered word is found
            this.youTubeAutoSubsUnmuteDelay = currentTime;
          } else {
            if (currentTime < this.youTubeAutoSubsUnmuteDelay) { this.youTubeAutoSubsUnmuteDelay = 0; } // Reset youTubeAutoSubsUnmuteDelay if video reversed
            if (currentTime > (this.youTubeAutoSubsUnmuteDelay + this.youTubeAutoSubsMin)) { // Unmute if its been long enough
              this.unmute(this.youTubeAutoSubsRule);
            }
          }
        } else { // Unmute immediately if youTubeAutoSubsMin = 0
          this.unmute(this.youTubeAutoSubsRule);
        }
      }
    }

    // Hide YouTube auto text unless show all subtitles is set
    if (this.filter.cfg.showSubtitles !== Constants.SHOW_SUBTITLES.ALL) {
      const container = document.querySelector('div.ytp-caption-window-rollup span.captions-text') as HTMLElement;
      if (container.style.display == 'block') {
        container.style.display = 'none';
      }
    }
  }

  clearUnmuteTimeout(rule: AudioRule) {
    if (rule.unmuteDelay && this.unmuteTimeout != null) {
      clearTimeout(this.unmuteTimeout);
      this.unmuteTimeout = null;
    }
  }

  delayedUnmute(instance: WebAudio, rule: AudioRule) {
    const delayed = true;
    instance.unmute(rule, null, delayed);
    this.unmuteTimeout = null;
  }

  // Priority (requires cues): [overrideKey], label, language, kind (prefer caption/subtitle), order
  getVideoTextTrack(textTracks, rule, overrideKey?: string): TextTrack {
    let bestIndex = 0;
    let bestScore = 0;
    let foundCues = false; // Return the first match with cues if no other matches are found
    let perfectScore = 0;
    if (overrideKey && rule[overrideKey]) { perfectScore += 1000; }
    if (rule.videoCueLabel) { perfectScore += 100; }
    if (rule.videoCueLanguage) { perfectScore += 10; }
    if (rule.videoCueKind) { perfectScore += 1; } // Add one, because we will default to 'captions'/'subtitles'

    for (let i = 0; i < textTracks.length; i++) {
      const textTrack = textTracks[i];
      if (textTrack.cues.length === 0) { continue; }
      if (rule.videoCueRequireShowing && textTrack.mode !== 'showing') { continue; }

      let currentScore = 0;
      if (overrideKey && rule[overrideKey] && this.textTrackKeyTest(textTrack, WebAudio.textTrackRuleMappings[overrideKey], rule[overrideKey])) { currentScore += 1000; }
      if (rule.videoCueLabel && this.textTrackKeyTest(textTrack, WebAudio.textTrackRuleMappings.videoCueLabel, rule.videoCueLabel)) { currentScore += 100; }
      if (rule.videoCueLanguage && this.textTrackKeyTest(textTrack, WebAudio.textTrackRuleMappings.videoCueLanguage, rule.videoCueLanguage)) { currentScore += 10; }
      if (rule.videoCueKind) {
        if (this.textTrackKeyTest(textTrack, WebAudio.textTrackRuleMappings.videoCueKind, rule.videoCueKind)) { currentScore += 1; }
      } else {
        if (
          this.textTrackKeyTest(textTrack, WebAudio.textTrackRuleMappings.videoCueKind, 'captions')
          || this.textTrackKeyTest(textTrack, WebAudio.textTrackRuleMappings.videoCueKind, 'subtitles')
        ) { currentScore += 1; }
      }

      if (currentScore === perfectScore) { return textTrack; }
      if (currentScore > bestScore || !foundCues) {
        bestScore = currentScore;
        bestIndex = i;
        foundCues = true;
      }
    }

    if (foundCues) { return textTracks[bestIndex]; }
  }

  // Some sites ignore textTrack.mode = 'hidden' and will still show captions
  // This is a fallback (not preferred) method that can be used for hiding the cues
  hideCue(rule: AudioRule, cue: FilteredVTTCue) {
    cue.text = '';
    cue.position = 100;
    cue.size = 0;
  }

  hideSubtitles(rule: AudioRule, subtitles?) {
    if (rule.displayVisibility && rule._displayElement) {
      // TODO: Only tested with Watcher: HBO Max. This may be a much better solution
      rule._displayElement.style.visibility = 'hidden';
    } else if (rule.displaySelector) {
      const root = rule.rootNode && subtitles && subtitles[0] ? subtitles[0].getRootNode() : document;
      if (root) {
        const container = root.querySelector(rule.displaySelector) as HTMLElement;
        if (container) {
          // Save the original display style if none was included in the rule
          if (
            rule.displayShow === ''
            && container.style.display !== ''
            && container.style.display !== rule.displayHide
          ) {
            rule.displayShow = container.style.display;
          }

          container.style.setProperty('display', rule.displayHide); // , 'important');
        }
      }
    } else if (subtitles) {
      subtitles.forEach((subtitle) => {
        subtitle.innerText = '';
        if (rule.removeSubtitleSpacing && subtitle.style) {
          if (subtitle.style.padding) { subtitle.style.padding = 0; }
          if (subtitle.style.margin) { subtitle.style.margin = 0; }
        }
      });
    }
  }

  initCueRule(rule: AudioRule) {
    if (rule.apfCaptions === true) { rule.videoCueHideCues = true; }
    if (rule.videoSelector === undefined) { rule.videoSelector = WebAudio.defaultVideoSelector; }
    if (rule.videoCueRequireShowing === undefined) { rule.videoCueRequireShowing = this.filter.cfg.muteCueRequireShowing; }
    if (rule.externalSub) {
      if (rule.externalSubTrackMode === undefined) { rule.externalSubTrackMode = 'showing'; }
      if (rule.externalSubURLKey === undefined) { rule.externalSubURLKey = 'url'; }
      if (rule.externalSubFormatKey === undefined) { rule.externalSubFormatKey = 'format'; }
      if (rule.externalSubTrackLabel === undefined) { rule.externalSubTrackLabel = 'APF'; }
    }
  }

  initDisplaySelector(rule: AudioRule) {
    if (rule.displaySelector !== undefined) {
      if (rule.displayHide === undefined) { rule.displayHide = 'none'; }
      if (rule.displayShow === undefined) { rule.displayShow = ''; }
    }
  }

  initDynamicRule(rule: AudioRule) {
    rule._dynamic = true;
    if (rule.dynamicTargetMode == undefined) { rule.disabled == true; }
  }

  initElementChildRule(rule: AudioRule) {
    if (!rule.parentSelector && !rule.parentSelectorAll) { rule.disabled = true; }
  }

  initElementRule(rule: AudioRule) { }

  initFillerAudio(name: string = ''): HTMLAudioElement {
    const fillerConfig = WebAudio.fillerConfig[name];
    if (fillerConfig) {
      const url = chrome.runtime.getURL(fillerConfig.fileName);
      const audioFiller = new Audio();
      audioFiller.src = url;
      audioFiller.loop = true;
      if (fillerConfig.volume) { audioFiller.volume = fillerConfig.volume; }
      if (fillerConfig.loopAfter) {
        audioFiller.ontimeupdate = () => {
          if (audioFiller.currentTime > fillerConfig.loopAfter) {
            audioFiller.currentTime = 0;
          }
        };
      }
      return audioFiller;
    }
  }

  initRule(rule: AudioRule) {
    const ruleId = this.rules.indexOf(rule);
    if (
      rule.mode === undefined
      || ((rule.mode == 'element' || rule.mode == 'elementChild') && !rule.tagName)
      // Skip this rule if it doesn't apply to the current page
      || (rule.iframe === true && this.filter.iframe == null)
      || (rule.iframe === false && this.filter.iframe != null)
    ) {
      rule.disabled = true;
    }

    if (!rule.disabled) {
      // Setup rule defaults
      if (rule.filterSubtitles == null) { rule.filterSubtitles = true; }
      this.initDisplaySelector(rule);

      // Allow rules to override global settings
      if (rule.muteMethod == null) { rule.muteMethod = this.filter.cfg.muteMethod; }
      if (rule.showSubtitles == null) { rule.showSubtitles = this.filter.cfg.showSubtitles; }

      // Ensure proper rule values
      if (rule.tagName != null && rule.tagName != '#text') { rule.tagName = rule.tagName.toUpperCase(); }

      switch(rule.mode) {
        case 'cue':
          this.initCueRule(rule);
          if (!rule.disabled) { this.cueRuleIds.push(ruleId); }
          break;
        case 'dynamic':
          this.initDynamicRule(rule);
          break;
        case 'elementChild':
          this.initElementChildRule(rule);
          break;
        case 'element':
          this.initElementRule(rule);
          break;
        case 'text':
          this.initTextRule(rule);
          break;
        case 'watcher':
          this.initWatcherRule(rule);
          if (!rule.disabled) { this.watcherRuleIds.push(ruleId); }
          break;
      }
      if (!rule.disabled) {
        this.enabledRuleIds.push(ruleId);

        if (rule.mode == 'cue' && this.cueRuleIds.length === 1) { // Only for first rule
          setInterval(this.watchForVideo, 250, this);
        } else if (rule.mode == 'watcher') {
          setInterval(this.watcher, rule.checkInterval, this, ruleId);
        }
      }
    }
  }

  initTextRule(rule: AudioRule) {
    rule.tagName = '#text';
    if (rule.simpleUnmute === undefined) { rule.simpleUnmute = true; }
  }

  initWatcherRule(rule: AudioRule) {
    if (rule.checkInterval === undefined) { rule.checkInterval = 20; }
    if (rule.ignoreMutations === undefined) { rule.ignoreMutations = true; }
    if (rule.simpleUnmute === undefined) { rule.simpleUnmute = true; }
    if (rule.videoSelector === undefined) { rule.videoSelector = WebAudio.defaultVideoSelector; }
  }

  initYouTube() {
    if(['m.youtube.com', 'tv.youtube.com', 'www.youtube.com'].includes(this.filter.hostname)) {
      this.youTube = true;
      // Issue 251: YouTube is now filtering words out of auto-generated captions/subtitles
      const youTubeAutoCensor = '[ __ ]';
      const lists = this.wordlistId == 0 ? [] : [this.wordlistId];
      const youTubeAutoCensorOptions: WordOptions = { lists: lists, matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: false, separators: false, sub: '' };
      this.filter.cfg.addWord(youTubeAutoCensor, youTubeAutoCensorOptions);

      // Setup rule for YouTube Auto Subs
      this.youTubeAutoSubsRule = { mode: 'ytauto', muteMethod: this.filter.cfg.muteMethod } as AudioRule;
    }
  }

  mute(rule?: AudioRule, video?: HTMLVideoElement): void {
    if (!this.muted) {
      this.muted = true;

      switch(rule.muteMethod) {
        case Constants.MUTE_METHODS.TAB:
          chrome.runtime.sendMessage({ mute: true });
          break;
        case Constants.MUTE_METHODS.VIDEO:
          if (!video) { video = document.querySelector(rule && rule.videoSelector ? rule.videoSelector : WebAudio.defaultVideoSelector); }
          if (video && video.volume != null) {
            this.volume = video.volume; // Save original volume
            video.volume = 0;
          }
          if (this.fillerAudio) { this.playFillerAudio(); }
          break;
      }
    }

    // If we called mute and there is a delayedUnmute planned, clear it
    if (rule && rule.unmuteDelay && this.unmuteTimeout) { this.clearUnmuteTimeout(rule); }
  }

  newCue(start, end, text, options: ParsedSubOptions = {}): VTTCue {
    try {
      const cue = new VTTCue(hmsToSeconds(start), hmsToSeconds(end), text);
      if (options.align) { cue.align = options.align; }
      if (options.line) { cue.line = this.parseLineAndPositionSetting(options.line); }
      if (options.position) { cue.position = this.parseLineAndPositionSetting(options.position); }
      return cue;
    } catch (e) {
      logger.error(`[Audio] Failed to add cue: ( start: ${start}, end: ${end}, text: ${text} )`, e);
    }
  }

  newTextTrack(rule: AudioRule, video: HTMLVideoElement, cues: VTTCue[]): TextTrack {
    if (video.textTracks) {
      const track = video.addTextTrack('captions', rule.externalSubTrackLabel, rule.videoCueLanguage) as TextTrack;
      track.mode = rule.externalSubTrackMode;
      for (let i = 0; i < cues.length; i++) {
        track.addCue(cues[i]);
      }
      return track;
    }
  }

  parseLineAndPositionSetting(setting: string): LineAndPositionSetting {
    if (typeof setting == 'string' && setting != '') {
      if (setting == 'auto') {
        return 'auto';
      } else {
        return parseInt(setting);
      }
    }
  }

  parseSRT(srt): VTTCue[] {
    const lines = srt.trim().replace('\r\n', '\n').split(/[\r\n]/).map((line) => line.trim());
    const cues: VTTCue[] = [];
    let start = null;
    let end = null;
    let text = null;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].indexOf('-->') >= 0) {
        const splitted = lines[i].split(/[ \t]+-->[ \t]+/);
        if (splitted.length != 2) {
          throw 'Error when splitting "-->": ' + lines[i];
        }
        start = splitted[0];
        end = splitted[1];
      } else if (lines[i] == '') {
        if (start && end) {
          const cue = this.newCue(start, end, text);
          cues.push(cue);
          start = null;
          end = null;
          text = null;
        }
      } else if(start && end) {
        if (text == null) {
          text = lines[i];
        } else {
          text += '\n' + lines[i];
        }
      }
    }
    if (start && end) {
      const cue = this.newCue(start, end, text);
      cues.push(cue);
    }
    return cues;
  }

  parseSSA(ssa: string): VTTCue[] {
    const cues: VTTCue[] = [];
    let endIndex, startIndex, textIndex;
    let foundEvents = false;

    const lines = ssa.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (!foundEvents) {
        if (lines[i].match(/^\[Events\]/i)) { foundEvents = true; }
        continue;
      }

      if (lines[i].match(/^format:/i)) {
        const format = lines[i].trim().split(',');
        endIndex = format.indexOf('End');
        startIndex = format.indexOf('Start');
        textIndex = format.indexOf('Text');
      } else if (lines[i].match(/^dialogue:/i)) {
        const line = lines[i].trim().split(',');
        const start = line[startIndex];
        const end = line[endIndex];
        const cleanText = line.slice(textIndex).join(',').replace(/\{\\\w.+?\}/g, '').split('\\N').reverse(); // Cleanup formatting and convert newlines
        for (let j = 0; j < cleanText.length; j++) {
          cues.push(this.newCue(start, end, cleanText[j]));
        }
      }
    }
    return cues;
  }

  parseVTT(input: string): VTTCue[] {
    const cues: VTTCue[] = [];
    const lines = input.split('\n');
    const separator = new RegExp('\\s-->\\s');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(separator)) { // Timestamp [& option] line
        const parts = line.replace(separator, ' ').split(' ');
        let [start, end, ...extraOptions] = parts;
        start = start.replace(',', '.');
        end = end.replace(',', '.');
        const options: ParsedSubOptions = extraOptions.map((o) => o.split(':')).reduce((acc, cur) => {acc[cur[0]] = cur[1]; return acc;}, {});

        // Get text
        const prevLine = lines[i-1].trim();
        const nextLine = lines[i+1].trim();
        const textStartRegex = new RegExp(`^<[cs]\\.${prevLine}>`);
        const textEndRegex = new RegExp('<\/[cs]>$');
        let text;
        if (nextLine.match(textStartRegex)) {
          text = nextLine.replace(textStartRegex, '').replace(textEndRegex, '');
        } else {
          text = nextLine;
        }

        // Handle the case when there are multiple cues that should be shown concurrently
        // The first line of the entry could look like "Caption-C8_1", and the subsequent entry would be "Caption-C8_2"
        if (prevLine && !prevLine.match(/_1$/)) {
          const previousCue = cues[cues.length-1];
          // If they share an endTime with the previous cue, but startTimes are different, make them match
          if (previousCue.startTime != hmsToSeconds(start) && previousCue.endTime == hmsToSeconds(end)) {
            start = secondsToHMS(previousCue.startTime);
          }
        }

        const cue = this.newCue(start, end, text, options);

        // Concurrent cues seem to be displayed backwards, so we'll reverse them: [a,b,c] -> [c,b,a]
        if (prevLine && !prevLine.match(/_1$/)) {
          const concurrentNumber = parseInt(prevLine.match(/_([2-9])$/)[1]);
          const firstConcurrentCueIndex = (cues.length - concurrentNumber) + 1; // Find the first concurrent index
          cues.splice(firstConcurrentCueIndex, 0, cue);
        } else {
          cues.push(cue);
        }

        i++; // Skip the next line because we already processed the text
      }
    }
    return cues;
  }

  playFillerAudio() {
    this.fillerAudio.play();
  }

  playing(video: HTMLVideoElement): boolean {
    return !!(video && video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);
  }

  processCues(cues: FilteredVTTCue[], rule: AudioRule) {
    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i];
      if (cue.hasOwnProperty('filtered')) { continue; }

      if (rule.videoCueSync) {
        cue.startTime += rule.videoCueSync;
        cue.endTime += rule.videoCueSync;
      }

      const result = this.replaceTextResult(cue.text);
      cue.originalText = cue.text;
      if (result.modified) {
        cue.filtered = true;
        cue.text = result.filtered;
      } else {
        cue.filtered = false;
      }
    }
  }

  async processExternalSub(video: HTMLVideoElement, rule) {
    const textTrack = this.getVideoTextTrack(video.textTracks, rule, 'externalSubTrackLabel');
    if (!this.fetching && !textTrack) {
      try {
        const subsData = getGlobalVariable(rule.externalSubVar);
        if (Array.isArray(subsData)) {
          const found = subsData.find((subtitle) => subtitle.language === rule.videoCueLanguage);
          if (!found) { throw(`Failed to find subtitle for language: ${rule.videoCueLanguage}.`); }
          this.fetching = true;
          const subs = await makeRequest('GET', found[rule.externalSubURLKey]) as string;
          if (typeof subs == 'string' && subs) {
            let parsedCues;
            switch(found[rule.externalSubFormatKey]) {
              case 'ass': parsedCues = this.parseSSA(subs); break;
              case 'srt': parsedCues = this.parseSRT(subs); break;
              case 'vtt': parsedCues = this.parseVTT(subs); break;
              default:
                throw(`Unsupported subtitle type: ${found[rule.externalSubFormatKey]}`);
            }
            if (parsedCues) {
              const track = this.newTextTrack(rule, video, parsedCues);
              const cues = track.cues as any as FilteredVTTCue[];
              this.processCues(cues, rule);
              this.fetching = false;

              // Hide old captions/subtitles
              if (rule.displaySelector) {
                const oldSubtitlesContainer = document.querySelector(rule.displaySelector) as HTMLElement;
                if (oldSubtitlesContainer) { oldSubtitlesContainer.style.display = 'none'; }
              }
            }
          } else {
            throw(`Failed to download external subtitles from '${found[rule.externalSubURLKey]}'.`);
          }
        } else {
          throw(`Failed to find subtitle variable: ${rule.externalSubVar}`);
        }
      } catch(e) {
        logger.error(`[Audio] Error using external subtitles for ${this.filter.hostname}.`, e);
      }
    }
  }

  processWatcherCaptions(rule, captions, data) {
    const initialCall = data.initialCall; // Check if this is the first call
    if (initialCall) {
      // Don't process the same filter again
      if (this.lastProcessedText && this.lastProcessedText === captions.textContent) {
        data.skipped = true;
        return false;
      } else { // These are new captions, unmute if muted
        this.unmute(rule);
        this.lastProcessedText = '';
      }

      data.initialCall = false;
      data.filtered = false;
    }

    if (captions.hasChildNodes()) {
      captions.childNodes.forEach((child) => {
        this.processWatcherCaptions(rule, child, data);
      });
    } else { // Process child
      // innerText handles line feeds/spacing better, but is not available to #text nodes
      const textMethod = (captions && captions.nodeName) === '#text' ? 'textContent' : 'innerText';

      // Don't process empty/whitespace nodes
      if (captions[textMethod] && captions[textMethod].trim()) {
        const result = this.replaceTextResult(captions[textMethod]);
        if (result.modified) {
          this.mute(rule);
          data.filtered = true;
          if (rule.filterSubtitles) { captions[textMethod] = result.filtered; }
        }
      }
    }

    if (initialCall) { this.lastProcessedText = captions.textContent; }
  }

  // TODO: Only tested with HBO Max
  processWatcherCaptionsArray(rule: AudioRule, captions: HTMLElement[], data: WatcherData) {
    const originalText = captions.map((caption) => caption.textContent).join(' ');

    // Don't process the same filter again
    if (this.lastProcessedText && this.lastProcessedText === originalText) {
      data.skipped = true;
      return false;
    } else { // These are new captions, unmute if muted
      this.unmute(rule);
      this.lastProcessedText = '';
      data.filtered = false;
    }

    captions.forEach((caption) => {
      rule.displayVisibility = true; // Requires .textContent()
      // Don't process empty/whitespace nodes
      if (caption.textContent && caption.textContent.trim()) {
        const result = this.replaceTextResult(caption.textContent);
        if (result.modified) {
          this.mute(rule);
          data.filtered = true;
          if (rule.filterSubtitles) { caption.textContent = result.filtered; }
        }
      }
    });

    this.lastProcessedText = captions.map((caption) => caption.textContent).join(' ');
  }

  replaceTextResult(string: string, stats: boolean = true) {
    return this.filter.replaceTextResult(string, this.wordlistId, stats);
  }

  showSubtitles(rule, subtitles?) {
    if (rule.displayVisibility && rule._displayElement) {
      // TODO: Only tested with Watcher: HBO Max. This may be a much better solution
      rule._displayElement.style.visibility = 'visible';
    } else if (rule.displaySelector) {
      const root = rule.rootNode && subtitles && subtitles[0] ? subtitles[0].getRootNode() : document;
      if (root) {
        const container = root.querySelector(rule.displaySelector);
        if (container) { container.style.setProperty('display', rule.displayShow); }
      }
    }
  }

  stopFillerAudio() {
    this.fillerAudio.pause();
    this.fillerAudio.currentTime = 0;
  }

  subtitlesShouldBeShown(rule, filtered: boolean = false): boolean {
    switch(rule.showSubtitles) {
      case Constants.SHOW_SUBTITLES.ALL: return true;
      case Constants.SHOW_SUBTITLES.FILTERED: return filtered;
      case Constants.SHOW_SUBTITLES.UNFILTERED: return !filtered;
      case Constants.SHOW_SUBTITLES.NONE: return false;
    }
  }

  // Checks if a node is a supported audio node.
  // Returns rule id upon first match, otherwise returns false
  supportedNode(node) {
    for (let i = 0; i < this.enabledRuleIds.length; i++) {
      const ruleId = this.enabledRuleIds[i];
      const rule = this.rules[ruleId];

      switch(rule.mode) {
        case 'element':
          if (node.nodeName == rule.tagName) {
            let failed = false;
            if (!failed && rule.className && (!node.className || !node.classList.contains(rule.className))) { failed = true; }
            if (!failed && rule.dataPropPresent && (!node.dataset || !node.dataset.hasOwnProperty(rule.dataPropPresent))) { failed = true; }
            if (!failed && rule.hasChildrenElements && (typeof node.childElementCount !== 'number' || node.childElementCount == 0)) { failed = true; }
            if (!failed && rule.subtitleSelector && (typeof node.querySelector !== 'function' || !node.querySelector(rule.subtitleSelector))) { failed = true; }
            if (!failed && rule.containsSelector && (typeof node.querySelector !== 'function' || !node.querySelector(rule.containsSelector))) { failed = true; }
            if (!failed) { return ruleId; }
          }
          break;
        case 'elementChild':
          if (node.nodeName === rule.tagName) {
            const root = rule.rootNode ? node.getRootNode() : document;
            if (root) {
              if (rule.parentSelector) {
                const parent = root.querySelector(rule.parentSelector);
                if (parent && parent.contains(node)) { return ruleId; }
              } else {
                const parents = root.querySelectorAll(rule.parentSelectorAll);
                for (let j = 0; j < parents.length; j++) {
                  if (parents[j].contains(node)) { return ruleId; }
                }
              }
            }
          }
          break;
        case 'text':
          if (node.nodeName === rule.tagName) {
            const parent = document.querySelector(rule.parentSelector);
            if (parent && parent.contains(node)) { return ruleId; }
          }
          break;
        case 'watcher':
          if (node.parentElement && node.parentElement == document.querySelector(rule.subtitleSelector)) { return ruleId; }
          if (rule.parentSelector != null) {
            const parent = document.querySelector(rule.parentSelector);
            if (parent && parent.contains(node)) { return ruleId; }
          }
          break;
        case 'dynamic':
          // HBO Max: When playing a video, this node gets added, but doesn't include any context. Grabbing classList and then start watching.
          if (node.textContent === rule.dynamicTextKey) {
            rule.mode = rule.dynamicTargetMode;
            // TODO: Only working for HBO Max right now
            rule.parentSelectorAll = `${node.tagName.toLowerCase()}.${Array.from(node.classList).join('.')} ${rule.parentSelectorAll}`;
            this.initRule(rule);
          }
          break;
      }
    }

    // No matching rule was found
    return false;
  }

  textTrackKeyTest(textTrack: TextTrack, key: string, value: string) {
    return (textTrack[key] && value && textTrack[key] === value);
  }

  unmute(rule?: AudioRule, video?: HTMLVideoElement, delayed: boolean = false): void {
    if (this.muted) {
      // If we haven't already delayed unmute and we should (rule.unmuteDelay), set the timeout
      if (!delayed && rule && rule.unmuteDelay >= 0) {
        // If unmute is called after an unmute has been scheduled, remove the older one and schedule a new unmute
        if (this.unmuteTimeout == null) { this.clearUnmuteTimeout(rule); }
        this.unmuteTimeout = window.setTimeout(this.delayedUnmute, rule.unmuteDelay, this, rule);
        return;
      }

      this.muted = false;
      switch(rule.muteMethod) {
        case Constants.MUTE_METHODS.TAB:
          chrome.runtime.sendMessage({ mute: false });
          break;
        case Constants.MUTE_METHODS.VIDEO:
          if (this.fillerAudio) { this.stopFillerAudio(); }
          if (!video) { video = document.querySelector(rule && rule.videoSelector ? rule.videoSelector : WebAudio.defaultVideoSelector); }
          if (video && video.volume != null) {
            video.volume = this.volume;
          }
          break;
      }
    }
  }

  watcher(instance: WebAudio, ruleId = 0) {
    const rule = instance.rules[ruleId];
    const video = document.querySelector(rule.videoSelector) as HTMLVideoElement;

    if (video && instance.playing(video)) {
      if (rule.ignoreMutations) { instance.filter.stopObserving(); } // Stop observing when video is playing
      const data: WatcherData = { initialCall: true };
      let captions;

      if (rule.parentSelectorAll) { // TODO: Only tested with HBO Max
        const parents = Array.from(document.querySelectorAll(rule.parentSelectorAll)).filter((result) => {
          return rule._dynamic && result.textContent !== rule.dynamicTextKey;
        }) as HTMLElement[];

        if (
          !rule._displayElement
          && parents[0]
          && parents[0].parentElement
          && parents[0].parentElement.parentElement
          && parents[0].parentElement.parentElement.parentElement
        ) {
          rule._displayElement = parents[0].parentElement.parentElement.parentElement;
        }
        captions = parents.map((parent) => parent.querySelector(rule.subtitleSelector));
        if (captions.length) {
          instance.processWatcherCaptionsArray(rule, captions, data);
        } else { // If there are no captions/subtitles: unmute and hide
          instance.watcherSimpleUnmute(rule, video);
        }
      } else if (rule.subtitleSelector) {
        captions = document.querySelector(rule.subtitleSelector) as HTMLElement;
        if (captions && captions.textContent && captions.textContent.trim()) {
          instance.processWatcherCaptions(rule, captions, data);
        } else { // If there are no captions/subtitles: unmute and hide
          instance.watcherSimpleUnmute(rule, video);
        }
      }

      if (data.skipped) { return false; }
      const shouldBeShown = instance.subtitlesShouldBeShown(rule, data.filtered);
      shouldBeShown ? instance.showSubtitles(rule) : instance.hideSubtitles(rule);
      if (data.filtered) { instance.filter.updateCounterBadge(); }
    } else {
      if (rule.ignoreMutations) { instance.filter.startObserving(); } // Start observing when video is not playing
    }
  }

  watchForVideo(instance: WebAudio) {
    for (let x = 0; x < instance.cueRuleIds.length; x++) {
      const rule = instance.rules[x] as AudioRule;
      const video = document.querySelector(rule.videoSelector) as HTMLVideoElement;
      if (video && video.textTracks && instance.playing(video)) {
        if (rule.externalSub) { instance.processExternalSub(video, rule); }
        const textTrack = instance.getVideoTextTrack(video.textTracks, rule);

        if (textTrack && !textTrack.oncuechange) {
          if (!rule.videoCueHideCues && rule.showSubtitles === Constants.SHOW_SUBTITLES.NONE) { textTrack.mode = 'hidden'; }

          textTrack.oncuechange = () => {
            if (textTrack.activeCues && textTrack.activeCues.length > 0) {
              const activeCues = Array.from(textTrack.activeCues as any as FilteredVTTCue[]);
              const apfLines = [];

              const processed = activeCues.some((activeCue) => activeCue.hasOwnProperty('filtered'));
              if (!processed) { instance.processCues(activeCues, rule); }
              const filtered = activeCues.some((activeCue) => activeCue.filtered);
              filtered ? instance.mute(rule, video) : instance.unmute(rule, video);
              const shouldBeShown = instance.subtitlesShouldBeShown(rule, filtered);

              for (let i = 0; i < activeCues.length; i++) {
                const activeCue = activeCues[i];
                if (!shouldBeShown && rule.videoCueHideCues) { instance.hideCue(rule, activeCue); }
                if (rule.apfCaptions) {
                  const text = filtered ? activeCue.text : activeCue.originalText;
                  const line = instance.apfCaptionLine(rule, text);
                  apfLines.unshift(line); // Cues seem to show up in reverse order
                }
              }

              if (apfLines.length) {
                const container = document.getElementById(rule.apfCaptionsSelector);
                const oldLines = container.querySelector('div.APF-subtitles');
                if (oldLines) { oldLines.remove(); }
                if (shouldBeShown) {
                  const apfCaptions = instance.apfCaptionLines(rule, apfLines);
                  container.appendChild(apfCaptions);
                }
              }

              if (!rule.videoCueHideCues) { textTrack.mode = shouldBeShown ? 'showing' : 'hidden'; }
              if (rule.displaySelector) { // Hide original subtitles if using apfCaptions
                apfLines.length || !shouldBeShown ? instance.hideSubtitles(rule) : instance.showSubtitles(rule);
              }
            } else { // No active cues
              instance.unmute(rule, video);
            }
          };
        }
      }
    }
  }

  watcherSimpleUnmute(rule: AudioRule, video: HTMLVideoElement) {
    this.unmute(rule, video);
    if (rule.showSubtitles > 0) { this.hideSubtitles(rule, rule._displayElement); }
  }

  youTubeAutoSubsCurrentRow(node): boolean {
    return !!(node.parentElement.parentElement == node.parentElement.parentElement.parentElement.lastChild);
  }

  youTubeAutoSubsMuteTimeout(instance) {
    const video = window.document.querySelector(WebAudio.defaultVideoSelector);
    if (video && instance.playing(video)) {
      instance.unmute(this.youTubeAutoSubsRule);
    }
    instance.youTubeAutoSubsTimeout = null;
  }

  youTubeAutoSubsNodeIsSubtitleText(node): boolean {
    const captionWindow = document.querySelector('div.caption-window'); // YouTube Auto-gen subs
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