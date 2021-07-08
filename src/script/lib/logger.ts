/* eslint-disable no-console */

export default class Logger {
  level: number;
  prefix: string;

  static readonly app = 'APF'
  static readonly debugLevel = 0;
  static readonly debugName = 'debug';
  static readonly errorLevel = 3;
  static readonly errorName = 'error';
  static readonly infoLevel = 1;
  static readonly infoName = 'info';
  static readonly warnLevel = 2;
  static readonly warnName = 'warn';

  static readonly defaultLevel = Logger.warnLevel;

  constructor( level: number = Logger.defaultLevel, tag?: string) {
    this.level = level;
    this.prefix = `[${Logger.app}] `;
    if (tag) { this.prefix = `${this.prefix}[${tag}] `; }
  }

  debug = (message: string, ...data: any[]) => { if (Logger.debugLevel >= this.level) { this.output(Logger.debugName, message, data); } };
  debugTime = (message: string, ...data: any[]) => { if (Logger.debugLevel >= this.level) { this.outputTime(Logger.debugName, message, data); } };
  error = (message: string, ...data: any[]) => { if (Logger.errorLevel >= this.level) { this.output(Logger.errorName, message, data); } };
  errorTime = (message: string, ...data: any[]) => { if (Logger.errorLevel >= this.level) { this.outputTime(Logger.errorName, message, data); } };
  info = (message: string, ...data: any[]) => { if (Logger.infoLevel >= this.level) { this.output(Logger.infoName, message, data); } };
  infoTime = (message: string, ...data: any[]) => { if (Logger.infoLevel >= this.level) { this.outputTime(Logger.infoName, message, data); } };
  warn = (message: string, ...data: any[]) => { if (Logger.warnLevel >= this.level) { this.output(Logger.warnName, message, data); } };
  warnTime = (message: string, ...data: any[]) => { if (Logger.warnLevel >= this.level) { this.outputTime(Logger.warnName, message, data); } };

  output(level: string, message: string, data: any[] = []) {
    if (data.length) {
      console[level](this.prefix + message, data);
    } else {
      console[level](this.prefix + message);
    }
  }

  outputTime(level: string, message: string, data: any[] = []) {
    const now = new Date().toLocaleString();
    if (data.length) {
      console[level](now, this.prefix + message, data);
    } else {
      console[level](now, this.prefix + message);
    }
  }
}
