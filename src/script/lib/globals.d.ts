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
  deep?: boolean;
  disabled?: boolean;
  enabled?: boolean;
  framesOff?: boolean;
  framesOn?: boolean;
  wordlist?: number;
}

interface Message {
  advanced?: boolean;
  backgroundData?: boolean;
  counter?: number;
  deep?: boolean;
  destination: string;
  disabled?: boolean;
  fetch?: string;
  fetchMethod?: string;
  forceUpdate?: boolean;
  getStatus?: boolean;
  globalVariable?: string;
  iframe?: boolean;
  popup?: boolean;
  source: string;
  status?: number;
  summary?: Summary;
  tabId?: number;
  updateContextMenus?: boolean;
  urlUpdate?: string;
}

interface Migration {
  async?: boolean;
  name: string;
  runOnImport: boolean;
  version: string;
}

interface ReplaceTextResult {
  filtered: string;
  modified: boolean;
  original: string;
}

interface Statistics {
  startedAt?: number;
  words: WordStatistics;
}

interface Summary {
  [word: string]: {
    filtered: string;
    count: number;
  };
}

interface TabStorageOptions {
  disabled?: boolean;
  disabledOnce?: boolean;
  id?: number;
  registeredAt?: number;
  status?: number;
}

interface Version {
  major: number;
  minor: number;
  patch: number;
}

interface WordOptions {
  _filterMethod?: number;  // This should not be stored in the config. Only there for new Word
  case?: number;
  lists?: number[];
  matchMethod: number;
  repeat: number;
  separators?: number;
  sub: string;
}

interface WordStatistic {
  text: number;
  total?: number;
}

interface WordStatistics {
  [word: string]: WordStatistic;
}
