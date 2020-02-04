interface AudioRules {
  mode: string;                     // 'cue', 'element', 'text', 'watcher'
  checkInterval?: number;           // [Watcher] Set a custom watch interval (in ms)
  className?: string;               // [Element] node.className.includes()
  containsSelector?: string;        // [Element] node.querySelector() [Not commonly used]
  dataPropPresent?: string;         // [Element] node.dataset.hasOwnProperty()
  filterSubtitles?: boolean;        // [All] Filter subtitle text [Default: true]
  hasChildrenElements?: boolean;    // [Element] node.childElementCount > 0 [Not commonly used]
  iframe?: boolean | undefined;     // [All] pages to run on (true: only iframes, false: no iframes, undefined: all)
  muteMethod?: number;              // [All] Override global muteMthod (0: tab, 1: video)
  parentSelector?: string;          // [Text] parent.contains(node)
  removeSubtitleSpacing?: boolean;  // [Element] Remove subtitle padding/margin when hiding
  showSubtitles?: number;           // [All] Override global showSubtitles (0: all, 1: filtered, 2: unfiltered, 3: none)
  subtitleSelector?: string;        // [Element,Watcher] *Used for Filtering*: node.querySelector()
  tagName?: string;                 // [Element] *REQUIRED*: node.nodeName
  trackProcessed?: boolean;         // [Watcher] Attempt to only process text once
  videoCueHideCues?: boolean;       // [Cue] Hide activeCues instead of textTrack.mode = 'hidden'
  videoCueLanguage?: string;        // [Cue] Language for video TextTrack
  videoCueRequireShowing?: boolean; // [Cue] Override global setting for muteCueRequireShowing
  videoCueSync?: number;            // [Cue] Adjust subtitle sync +/- (in seconds)
  videoSelector?: string;           // [Cue] Video selector: defaults to 'video'
}

interface FilteredTextTrackCue extends TextTrackCue {
  filtered: boolean;
  originalText: string;
  position: number; // TextTrackCue
  size: number; // TextTrackCue
}

interface Message {
  advanced?: boolean;
  clearMute?: boolean;
  counter?: number;
  disabled?: boolean;
  mute?: boolean;
  mutePage?: boolean;
  popup?: boolean;
  setBadgeColor?: boolean;
  summary?: Summary;
}

interface Summary {
  [word: string]: {
    filtered: string;
    count: number;
  };
}

interface Version {
  major: number;
  minor: number;
  patch: number;
}

interface WordOptions {
  matchMethod: number;
  repeat: boolean;
  separators?: boolean;
  sub: string;
}