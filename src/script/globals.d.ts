interface AudioSite {
  className?: string;               // node.className.includes()
  dataPropPresent?: string;         // node.dataset.hasOwnProperty()
  hasChildrenElements?: boolean;    // node.childElementCount > 0
  querySelectorAllPresent?: string; // node.querySelectorAll().length > 0
  subtitleSelector?: string;        // *Used for Filtering*: node.querySelectorAll().length > 0
  tagName: string;                  // *REQUIRED*: node.tagName
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

interface WebAudioConstructorArgs {
  hostname: string;
  muteMethod: number;
  showSubtitles: number;
  sites: { [site: string]: AudioSite };
  youTubeAutoSubsMin: number;
}

interface WordOptions {
  matchMethod: number;
  repeat: boolean;
  sub: string;
}