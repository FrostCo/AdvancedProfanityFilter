interface AudioRules {
  mode: string;                     // 'cue', 'element', 'text', 'watcher'
  className?: string;               // [Element] node.className.includes()
  checkInterval?: number;           // [Watcher] Set a custom watch interval (in ms)
  containsSelector?: string;        // [Element] node.querySelector() [Not commonly used]
  dataPropPresent?: string;         // [Element] node.dataset.hasOwnProperty()
  hasChildrenElements?: boolean;    // [Element] node.childElementCount > 0 [Not commonly used]
  iframe?: boolean | undefined;     // [All] pages to run on (true: only iframes, false: no iframes, undefined: all)
  removeSubtitleSpacing?: boolean;  // [Element] Remove subtitle padding/margin when hiding
  subtitleSelector?: string;        // [Element,Watcher] *Used for Filtering*: node.querySelector()
  tagName?: string;                 // [Element] *REQUIRED*: node.nodeName
  textParentSelector?: string;      // [Text] parent.contains(node)
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
  capital: boolean;
  matchMethod: number;
  repeat: boolean;
  sub: string;
}