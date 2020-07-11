interface AudioRules {
  mode: string;                     // [All*] 'cue', 'element', 'elementChild', 'text', 'watcher'
  checkInterval?: number;           // [Watcher] Set a custom watch interval (in ms, Default: 20)
  className?: string;               // [Element] node.className.includes()
  containsSelector?: string;        // [Element] node.querySelector() [Not commonly used]
  convertBreaks?: boolean;          // [Element,ElementChild] Convert <br> to '\n'
  dataPropPresent?: string;         // [Element] node.dataset.hasOwnProperty()
  disabled?: boolean;               // [All] Set automatically based on iframe status or missing a required property
  displayHide?: string;             // [Element,ElementChild] Display style for hiding captions (Default: 'none')
  displaySelector?: string;         // [Element,ElementChild] Alternate selector to hide/show captions
  displayShow?: string;             // [Element,ElementChild] Display style for showing captions (Default: '')
  filterSubtitles?: boolean;        // [All] Filter subtitle text (Default: true)
  hasChildrenElements?: boolean;    // [Element] node.childElementCount > 0 [Not commonly used]
  iframe?: boolean | undefined;     // [All] Pages to run on (true: only iframes, false: no iframes, undefined: all)
  ignoreMutations?: boolean;        // [Element,ElementChild,Text] Ignore mutations when filtering captions/subtitles
  muteMethod?: number;              // [All] Override global muteMthod (0: tab, 1: video)
  parentSelector?: string;          // [ElementChild?,Text,Watcher] parent.contains(node)
  parentSelectorAll?: string;       // [ElementChild?] Check if any parents contain the node: parent.contains(node)
  removeSubtitleSpacing?: boolean;  // [Element] Remove subtitle padding/margin when hiding
  showSubtitles?: number;           // [All] Override global showSubtitles (0: all, 1: filtered, 2: unfiltered, 3: none)
  simpleUnmute?: boolean;           // [All] Simplify requirements for unmuting (Only require text match)
  subtitleSelector?: string;        // [Element,ElementChild,Watcher] *Used for Filtering*: node.querySelector()
  tagName?: string;                 // [Element*,ElementChild*] node.nodeName
  videoCueHideCues?: boolean;       // [Cue] Hide activeCues instead of textTrack.mode = 'hidden'
  videoCueLanguage?: string;        // [Cue] Language for video TextTrack
  videoCueRequireShowing?: boolean; // [Cue] Override global setting for muteCueRequireShowing
  videoCueSync?: number;            // [Cue] Adjust subtitle sync +/- (in seconds)
  videoSelector?: string;           // [Cue,Watcher] Video selector: (Default: 'video')
}

interface ConfirmModalSettings {
  backup?: boolean;
  content?: string;
  title?: string;
  titleClass?: string;
}

interface DomainCfg {
  adv?: boolean;
  audioList?: number;
  disabled?: boolean;
  enabled?: boolean;
  wordlist?: number;
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

interface Migration {
  version: string;
  name: string;
  runOnImport: boolean;
}

interface ReplaceTextResult {
  original: string;
  filtered: string;
  modified: boolean;
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

interface WatcherData {
  filtered?: boolean;
  initialCall: boolean;
  skipped?: boolean;
}

interface WordOptions {
  _filterMethod?: number;  // This should not be stored in the config. Only there for new Word
  lists?: number[];
  matchMethod: number;
  repeat: boolean;
  separators?: boolean;
  sub: string;
}
