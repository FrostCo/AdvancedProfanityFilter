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
    const now = new Date();
    const currentTime = now.toLocaleTimeString().replace(' ', `.${now.getMilliseconds().toString()} `);

    message = `[${Logger.app}] ${message}`;
    if (data.length) {
      console[level](message, currentTime, data);
    } else {
      console[level](message, currentTime);
    }
  }

  static warn(message: string, ...data: any[]) { this.log(this.warnName, message, data); }
  static warnTime(message: string, data: any[] = []) { this.logTime(this.warnName, message, data); }

  constructor(tag?: string) {
    this.level = Logger.defaultLevel;
    this.prefix = '';
    if (tag) { this.prefix = `[${tag}] `; }
  }

  debug(message: string, ...data: any[]) { if (Logger.debugLevel >= this.level) { Logger.log(Logger.debugName, `${this.prefix}${message}`, data); } }
  debugTime(message: string, ...data: any[]) { if (Logger.debugLevel >= this.level) { Logger.logTime(Logger.debugName, `${this.prefix}${message}`, data); } }
  error(message: string, ...data: any[]) { if (Logger.errorLevel >= this.level) { Logger.log(Logger.errorName, `${this.prefix}${message}`, data); } }
  errorTime(message: string, ...data: any[]) { if (Logger.errorLevel >= this.level) { Logger.logTime(Logger.errorName, `${this.prefix}${message}`, data); } }
  info(message: string, ...data: any[]) { if (Logger.infoLevel >= this.level) { Logger.log(Logger.infoName, `${this.prefix}${message}`, data); } }
  infoTime(message: string, ...data: any[]) { if (Logger.infoLevel >= this.level) { Logger.logTime(Logger.infoName, `${this.prefix}${message}`, data); } }
  setLevel(levelId: number) { this.level = levelId; }
  warn(message: string, ...data: any[]) { if (Logger.warnLevel >= this.level) { Logger.log(Logger.warnName, `${this.prefix}${message}`, data); } }
  warnTime(message: string, ...data: any[]) { if (Logger.warnLevel >= this.level) { Logger.logTime(Logger.warnName, `${this.prefix}${message}`, data); } }
}
