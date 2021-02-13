export default class Logger {
  prefix: string;
  // TODO: maxLevel
  // TODO: devOnly

  static readonly APP = 'APF'
  static readonly DEBUG = 'debug';
  static readonly ERROR = 'error';
  static readonly INFO = 'info';
  static readonly WARN = 'warn';

  constructor(tag?: string) {
    this.prefix = `[${Logger.APP}] `;
    if (tag) { this.prefix = `${this.prefix}[${tag}] `; }
  }

  debug = (message: string, ...data: any[]) => { this.output(Logger.DEBUG, message, data); }
  debugTime = (message: string, ...data: any[]) => { this.outputTime(Logger.DEBUG, message, data); }
  error = (message: string, ...data: any[]) => { this.output(Logger.ERROR, message, data); }
  errorTime = (message: string, ...data: any[]) => { this.outputTime(Logger.ERROR, message, data); }
  info = (message: string, ...data: any[]) => { this.output(Logger.INFO, message, data); }
  infoTime = (message: string, ...data: any[]) => { this.outputTime(Logger.INFO, message, data); }
  warn = (message: string, ...data: any[]) => { this.output(Logger.WARN, message, data); }
  warnTime = (message: string, ...data: any[]) => { this.outputTime(Logger.WARN, message, data); }

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
