interface AudioRule {
  _displayElement?: HTMLElement;                 // Element to display/hide
  _dynamic?: boolean;                            // [Dynamic] Set to true on a dynamic rule
  apfCaptions?: boolean;                         // [Cue] Display an HTML version of the caption/subtitle text: Requires videoCueHideCues = true
  apfCaptionsSelector?: string;                  // [Cue] Selector for container that will hold the custom HTML captions
  checkInterval?: number;                        // [Watcher] Set a custom watch interval (in ms, Default: 20)
  className?: string;                            // [Element] node.className.includes()
  containsSelector?: string;                     // [Element] node.querySelector() [Not commonly used]
  convertBreaks?: boolean;                       // [Element,ElementChild] Convert <br> to '\n'
  dataPropPresent?: string;                      // [Element] node.dataset.hasOwnProperty()
  disabled?: boolean;                            // [All] Set automatically based on iframe status or missing a required property
  displayHide?: string;                          // [Element,ElementChild,Watcher] Display style for hiding captions (Default: 'none')
  displaySelector?: string;                      // [Element,ElementChild,Watcher] Alternate selector to hide/show captions
  displayShow?: string;                          // [Element,ElementChild,Watcher] Display style for showing captions (Default: '')
  displayVisibility?: boolean;                   // [Watcher*] Use visibility to show/hide caption container
  dynamicClasslist?: string;                     // [Dynamic] Set when a dynamicTextKey is found
  dynamicTargetMode?: string;                    // [Dynamic] Target mode for dynamic rule
  dynamicTextKey?: string;                       // [Dynamic] Key used to identify a dynamic caption node
  externalSub?: boolean;                         // [Cue] [BETA]: Convert external captions/subtitles obtained from remote source to VTTCues
  externalSubFormatKey?: string;                 // [Cue] [BETA]: Key name for caption/subtitle format (Default: 'format')
  externalSubTrackLabel?: string;                // [Cue] [BETA]: Label used for processed TextTrack
  externalSubTrackMode?: TextTrackMode;          // [Cue] [BETA]: TextTrack mode for new TextTrack
  externalSubURLKey?: string;                    // [Cue] [BETA]: Key name for caption/subtitle URL (Default: 'url')
  externalSubVar?: string;                       // [Cue] [BETA]: Global variable to find available caption/subtitle data
  filterSubtitles?: boolean;                     // [All] Filter subtitle text (Default: true)
  hasChildrenElements?: boolean;                 // [Element] node.childElementCount > 0 [Not commonly used]
  iframe?: boolean | undefined;                  // [All] Pages to run on (true: only iframes, false: no iframes, undefined: all)
  ignoreMutations?: boolean;                     // [Element,ElementChild,Text,Watcher] Ignore mutations when filtering captions/subtitles
  mode: string;                                  // [All*] 'cue', 'dynamic', 'element', 'elementChild', 'text', 'watcher'
  muteMethod?: number;                           // [All] Override global muteMthod (0: tab, 1: video)
  note?: string;                                 // [All] Note about the rule
  parentSelector?: string;                       // [ElementChild?,Text,Watcher] parent.contains(node)
  parentSelectorAll?: string;                    // [ElementChild?] Check if any parents contain the node: parent.contains(node)
  preserveWhiteSpace?: boolean;                  // [Element,ElementChild] Set whiteSpace = 'pre' on subtitle elements
  removeSubtitleSpacing?: boolean;               // [Element] Remove subtitle padding/margin when hiding
  rootNode?: boolean;                            // [Element,ElementChild] Use getRootNode() or assume document (Default: false)
  showSubtitles?: number;                        // [All] Override global showSubtitles (0: all, 1: filtered, 2: unfiltered, 3: none)
  simpleUnmute?: boolean;                        // [Element,ElementChild,Text+,Watcher+] Simplify requirements for unmuting (should be first rule)
  subtitleSelector?: string;                     // [Element,ElementChild,Watcher] *Used for Filtering*: node.querySelector()
  tagName?: string;                              // [Element*,ElementChild*] node.nodeName
  unmuteDelay?: number;                          // [Element,ElementChild,Watcher] Positive number (in ms) to delay unmuting
  videoCueHideCues?: boolean;                    // [Cue] Remove/hide cues instead of setting textTrack.mode = 'hidden'
  videoCueKind?: string;                         // [Cue] Kind of video TextTrack ('captions', 'subtitles', etc.)
  videoCueLabel?: string;                        // [Cue] Label for video TextTrack
  videoCueLanguage?: string;                     // [Cue] Language for video TextTrack
  videoCueRequireShowing?: boolean;              // [Cue] Override global setting for muteCueRequireShowing
  videoCueSync?: number;                         // [Cue] Adjust subtitle sync +/- (in seconds)
  videoSelector?: string;                        // [Cue,Watcher] Selector for video, also used for volume muteMethod (Default: 'video')
}

interface BackgroundData {
  disabledTab?: boolean;
}

interface BackgroundStorage {
  tabs?: {
    [tabId: number]: TabStorageOptions;
  };
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
  deep?: boolean;
  disabled?: boolean;
  enabled?: boolean;
  wordlist?: number;
}

interface FilteredVTTCue extends VTTCue {
  filtered: boolean;
  originalText: string;
  position: number; // TextTrackCue
  size: number; // TextTrackCue
}

interface Message {
  advanced?: boolean;
  backgroundData?: boolean;
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

interface ParsedSubOptions {
  align?: AlignSetting;
  line?: string;
  position?: string;
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

interface TabStorageOptions {
  id?: number;
  disabled?: boolean;
  disabledOnce?: boolean;
  registeredAt?: number;
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
