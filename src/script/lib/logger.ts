export default class Logger {
  level: number;
  prefix: string;

  static readonly APP = 'APF'
  static readonly DebugLevel = 0;
  static readonly DebugName = 'debug';
  static readonly ErrorLevel = 3;
  static readonly ErrorName = 'error';
  static readonly InfoLevel = 1;
  static readonly InfoName = 'info';
  static readonly WarnLevel = 2;
  static readonly WarnName = 'warn';

  static readonly DefaultLevel = Logger.WarnLevel;

  constructor( level: number = Logger.DefaultLevel, tag?: string) {
    this.level = level;
    this.prefix = `[${Logger.APP}] `;
    if (tag) { this.prefix = `${this.prefix}[${tag}] `; }
  }

  debug = (message: string, ...data: any[]) => { if (Logger.DebugLevel >= this.level) { this.output(Logger.DebugName, message, data); } };
  debugTime = (message: string, ...data: any[]) => { if (Logger.DebugLevel >= this.level) { this.outputTime(Logger.DebugName, message, data); } };
  error = (message: string, ...data: any[]) => { if (Logger.ErrorLevel >= this.level) { this.output(Logger.ErrorName, message, data); } };
  errorTime = (message: string, ...data: any[]) => { if (Logger.ErrorLevel >= this.level) { this.outputTime(Logger.ErrorName, message, data); } };
  info = (message: string, ...data: any[]) => { if (Logger.InfoLevel >= this.level) { this.output(Logger.InfoName, message, data); } };
  infoTime = (message: string, ...data: any[]) => { if (Logger.InfoLevel >= this.level) { this.outputTime(Logger.InfoName, message, data); } };
  warn = (message: string, ...data: any[]) => { if (Logger.WarnLevel >= this.level) { this.output(Logger.WarnName, message, data); } };
  warnTime = (message: string, ...data: any[]) => { if (Logger.WarnLevel >= this.level) { this.outputTime(Logger.WarnName, message, data); } };

  output(level: string, message: string, data: any[] = []) {
    if (data.length) {
      // eslint-disable-next-line no-console
      console[level](this.prefix + message, data);
    } else {
      // eslint-disable-next-line no-console
      console[level](this.prefix + message);
    }
  }

  outputTime(level: string, message: string, data: any[] = []) {
    const now = new Date().toLocaleString();
    if (data.length) {
      // eslint-disable-next-line no-console
      console[level](now, this.prefix + message, data);
    } else {
      // eslint-disable-next-line no-console
      console[level](now, this.prefix + message);
    }
  }
}
