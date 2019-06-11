interface Message {
  advanced?: boolean;
  clearMute?: boolean;
  counter?: number;
  disabled?: boolean;
  mute?: boolean;
  mutePage?: boolean;
  popup?: boolean;
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