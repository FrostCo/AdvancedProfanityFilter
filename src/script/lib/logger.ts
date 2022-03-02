/* eslint-disable no-console */
import Constants from './constants';

// Class logging methods will be logged unconditionally
// Instance logging methods will be conditionally logged based on this.level, and may optionally include a prefix tag
export default class Logger {
  level: number;
  prefix: string;

  static readonly app = 'APF';
  static readonly debugLevel = Constants.LOGGING_LEVELS.DEBUG;
  static readonly debugName = Constants.loggingLevelName(this.debugLevel).toLowerCase();
  static readonly defaultLevel = Constants.LOGGING_LEVELS.WARN;
  static readonly errorLevel = Constants.LOGGING_LEVELS.ERROR;
  static readonly errorName = Constants.loggingLevelName(this.errorLevel).toLowerCase();
  static readonly infoLevel = Constants.LOGGING_LEVELS.INFO;
  static readonly infoName = Constants.loggingLevelName(this.infoLevel).toLowerCase();
  static readonly warnLevel = Constants.LOGGING_LEVELS.WARN;
  static readonly warnName = Constants.loggingLevelName(this.warnLevel).toLowerCase();

  static debug(message: string, ...data: any[]) { this.log(this.debugName, message, data); }
  static debugTime(message: string, data: any[] = []) { this.logTime(this.debugName, message, data); }
  static error(message: string, ...data: any[]) { this.log(this.errorName, message, data); }
  static errorTime(message: string, data: any[] = []) { this.logTime(this.errorName, message, data); }
  static info(message: string, ...data: any[]) { this.log(this.infoName, message, data); }
  static infoTime(message: string, data: any[] = []) { this.logTime(this.infoName, message, data); }

  static log(level: string, message: string, data: any[] = []) {
    message = `[${Logger.app}] ${message}`;
    if (data.length) {
      console[level](message, data);
    } else {
      console[level](message);
    }
  }

  static logTime(level: string, message: string, data: any[] = []) {
    const now = new Date().toLocaleString();
    message = `[${Logger.app}] ${message}`;
    if (data.length) {
      console[level](message, now, data);
    } else {
      console[level](message, now);
    }
  }

  static warn(message: string, ...data: any[]) { this.log(this.warnName, message, data); }
  static warnTime(message: string, data: any[] = []) { this.logTime(this.warnName, message, data); }

  constructor(tag?: string) {
    this.level = Logger.defaultLevel;
    this.prefix = '';
    if (tag) { this.prefix = `[${tag}] `; }
  }

  debug(message: string, ...data: any[]) { if (Logger.debugLevel >= this.level) { Logger.debug(`${this.prefix}${message}`, data); } }
  debugTime(message: string, ...data: any[]) { if (Logger.debugLevel >= this.level) { Logger.debugTime(`${this.prefix}${message}`, data); } }
  error(message: string, ...data: any[]) { if (Logger.errorLevel >= this.level) { Logger.error(`${this.prefix}${message}`, data); } }
  errorTime(message: string, ...data: any[]) { if (Logger.errorLevel >= this.level) { Logger.errorTime(`${this.prefix}${message}`, data); } }
  info(message: string, ...data: any[]) { if (Logger.infoLevel >= this.level) { Logger.info(`${this.prefix}${message}`, data); } }
  infoTime(message: string, ...data: any[]) { if (Logger.infoLevel >= this.level) { Logger.infoTime(`${this.prefix}${message}`, data); } }
  setLevel(levelId: number) { this.level = levelId; }
  warn(message: string, ...data: any[]) { if (Logger.warnLevel >= this.level) { Logger.warn(`${this.prefix}${message}`, data); } }
  warnTime(message: string, ...data: any[]) { if (Logger.warnLevel >= this.level) { Logger.warnTime(`${this.prefix}${message}`, data); } }
}
