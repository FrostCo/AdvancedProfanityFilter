interface AudioSite {
  className?: string;               // node.className.includes()
  containsSelector?: string;        // node.querySelector() [Not commonly used]
  dataPropPresent?: string;         // node.dataset.hasOwnProperty()
  hasChildrenElements?: boolean;    // node.childElementCount > 0 [Not commonly used]
  subtitleSelector?: string;        // *Used for Filtering*: node.querySelector()
  tagName?: string;                 // *REQUIRED*: node.nodeName
  textParentSelector?: string;      // [Text Mode]: parent.contains(node)
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