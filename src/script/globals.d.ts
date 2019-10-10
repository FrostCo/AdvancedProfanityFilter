interface AudioSite {
  _custom?: boolean;                // Added automatically for custom sites
  className?: string;               // [Element] node.className.includes()
  containsSelector?: string;        // [Element] node.querySelector() [Not commonly used]
  dataPropPresent?: string;         // [Element] node.dataset.hasOwnProperty()
  hasChildrenElements?: boolean;    // [Element] node.childElementCount > 0 [Not commonly used]
  removeSubtitleSpacing?: boolean;  // [Element] Remove subtitle padding/margin when hiding
  subtitleSelector?: string;        // [Element] *Used for Filtering*: node.querySelector()
  tagName?: string;                 // [Element] *REQUIRED*: node.nodeName
  textParentSelector?: string;      // [Text] parent.contains(node)
  videoCueLanguage?: string;        // [Video Cue] Language for video TextTrack
  videoCueMode?: boolean;           // [Video Cue] Enabled when true
  videoCueSync?: number;            // [Video Cue] Adjust subtitle sync +/- (in seconds)
  videoInterval?: number;           // [Video Cue] Set a custom watch interval (in ms) [Shouldn't be needed]
  videoSelector?: string;           // [Video Cue] Video selector: defaults to 'video'
}

interface FilteredTextTrackCue extends TextTrackCue {
  filtered: boolean;
  index: number;
  originalText: string;
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
  sub: string;
}